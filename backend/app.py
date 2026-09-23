import json
import os
import sys
import urllib.error
import urllib.request
from datetime import datetime

from flask import Flask, jsonify, request
from flask_cors import CORS

sys.path.append(os.path.dirname(__file__))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from ml_inference import model_status, predict_node_risk
app = Flask(__name__)
CORS(app)

STALE_SENSOR_SECONDS = float(os.getenv('ATLAS_STALE_SENSOR_SECONDS', '15'))
STALE_WORKER_SECONDS = float(os.getenv('ATLAS_STALE_WORKER_SECONDS', '15'))
STALE_PPE_SECONDS = float(os.getenv('ATLAS_STALE_PPE_SECONDS', '30'))
BACKEND_PORT = int(os.getenv('ATLAS_BACKEND_PORT', os.getenv('PORT', '6001')))

# Store latest data from each source
node_data = {}
watch_data = {}

# Device registry and cloud sync state
device_registry = {}
cloud_commands = []
cloud_endpoint = os.getenv('CLOUD_ENDPOINT')
aegis_service_url = os.getenv('AEGIS_SERVICE_URL', 'http://127.0.0.1:8790')
aegis_cache = {
    "devices": {},
    "summary": None,
    "overview": None,
    "network_intelligence": None,
    "network_actions": None,
    "last_error": None,
    "last_sync": None
}


def parse_bool(value, default=False):
    if isinstance(value, bool):
        return value
    if value is None:
        return default
    text = str(value).strip().lower()
    if text in ("1", "true", "yes", "on"):
        return True
    if text in ("0", "false", "no", "off"):
        return False
    return default


cloud_sync_enabled = parse_bool(os.getenv('CLOUD_SYNC_ENABLED'), True)


def first_present(payload, *keys):
    if not isinstance(payload, dict):
        return None
    for key in keys:
        if key in payload and payload[key] is not None:
            return payload[key]
    return None


def empty_ppe_data():
    return {
        "helmet": False,
        "vest": False,
        "gloves": False,
        "gate_status": 0,
        "missing_items": [],
        "timestamp": None,
    }


def parse_record_timestamp(value):
    if not value:
        return None
    try:
        parsed = datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    except (TypeError, ValueError):
        return None
    if parsed.tzinfo is not None:
        parsed = parsed.astimezone().replace(tzinfo=None)
    return parsed


def age_seconds(timestamp):
    parsed = parse_record_timestamp(timestamp)
    if parsed is None:
        return None
    return max(0.0, (datetime.now() - parsed).total_seconds())


def is_demo_source(source):
    text = str(source or "").lower()
    return any(token in text for token in ("seed", "demo", "synthetic", "lab"))


def annotate_record(record, ttl_seconds, source):
    annotated = dict(record or {})
    age = age_seconds(annotated.get("timestamp") or annotated.get("ts") or annotated.get("received_ts"))
    source_value = annotated.get("source") or annotated.get("data_source") or source
    annotated["age_seconds"] = round(age, 3) if age is not None else None
    annotated["source"] = source_value
    annotated["is_synthetic"] = is_demo_source(source_value) or bool(annotated.get("synthetic"))
    annotated["is_stale"] = age is None or age > ttl_seconds or annotated["is_synthetic"]
    return annotated


def split_active_stale(records, ttl_seconds, source):
    active = []
    stale = []
    for record in records:
        annotated = annotate_record(record, ttl_seconds, source)
        if annotated["is_stale"]:
            stale.append(annotated)
        else:
            active.append(annotated)
    return active, stale


def aegis_status():
    if not aegis_service_url:
        return "disabled"
    if aegis_cache.get("summary") and not aegis_cache.get("last_error"):
        return "online"
    if aegis_cache.get("summary") or aegis_cache.get("overview"):
        return "degraded"
    return "unavailable"


def unavailable_payload(component, cached=None):
    body = dict(cached or {})
    body["status"] = "unavailable" if cached is None else body.get("status", "cached")
    body["component"] = component
    body["cached"] = cached is not None
    body["message"] = aegis_cache.get("last_error") or "AEGIS unavailable"
    body["last_sync"] = aegis_cache.get("last_sync")
    return body


def register_device(device_id, device_type, meta=None):
    now = datetime.now().isoformat()
    record = device_registry.get(device_id, {
        "device_id": device_id,
        "device_type": device_type,
        "first_seen": now,
        "meta": {}
    })
    record["device_type"] = device_type
    record["last_seen"] = now
    if isinstance(meta, dict):
        record["meta"].update(meta)
    device_registry[device_id] = record
    return record


def merge_network_metadata(payload, base_meta=None):
    meta = {}
    if isinstance(base_meta, dict):
        meta.update(base_meta)
    if isinstance(payload, dict):
        nested = payload.get("meta") or payload.get("metadata")
        if isinstance(nested, dict):
            for key, value in nested.items():
                if key not in meta and value is not None:
                    meta[key] = value

    def set_if_missing(key, value):
        if key not in meta and value is not None:
            meta[key] = value

    if isinstance(payload, dict):
        set_if_missing("segmentId", first_present(payload, "segmentId", "segment_id", "segment"))
        set_if_missing("address", first_present(payload, "address", "ip", "mac"))
        set_if_missing("addressFamily", first_present(payload, "addressFamily", "address_family"))
        set_if_missing("interfaceId", first_present(payload, "interfaceId", "interface"))
        set_if_missing("routingProtocol", first_present(payload, "routingProtocol", "routing_protocol", "protocol"))
        set_if_missing("routeMetric", first_present(payload, "routeMetric", "route_metric"))
        set_if_missing("routeCost", first_present(payload, "routeCost", "route_cost"))
        set_if_missing("latencyMs", first_present(payload, "latencyMs", "latency_ms", "latency"))
        set_if_missing("packetLossRatio", first_present(payload, "packetLossRatio", "packet_loss_ratio", "packet_loss"))
        set_if_missing("reconnects", first_present(payload, "reconnects", "reconnect_count", "reconnect_rate"))
        set_if_missing("jitterMs", first_present(payload, "jitterMs", "jitter_ms"))
        set_if_missing("vlanId", first_present(payload, "vlanId", "vlan_id"))
        set_if_missing("dhcpObserved", payload.get("dhcpObserved"))
        set_if_missing("dhcpAddressChanged", payload.get("dhcpAddressChanged"))
        set_if_missing("slaacObserved", payload.get("slaacObserved"))
        set_if_missing("slaacPrefixChanged", payload.get("slaacPrefixChanged"))
        set_if_missing("natDetected", payload.get("natDetected"))
        set_if_missing("privateToPublicBoundary", payload.get("privateToPublicBoundary"))
        set_if_missing("asymmetricRoute", payload.get("asymmetricRoute"))
        set_if_missing("mtuBlackhole", payload.get("mtuBlackhole"))
        set_if_missing("aggregatorId", payload.get("aggregatorId"))
        embedded = payload.get("embeddedDeviceIds") or payload.get("embedded_device_ids")
        if embedded is not None and "embeddedDeviceIds" not in meta:
            meta["embeddedDeviceIds"] = embedded
    return meta if meta else None


def normalize_node_payload(data):
    normalized = dict(data or {})
    if "mq2" not in normalized and normalized.get("mq4") is not None:
        normalized["mq2"] = normalized["mq4"]
    if "mq6" not in normalized and normalized.get("mq5") is not None:
        normalized["mq6"] = normalized["mq5"]
    if "mq4" not in normalized and normalized.get("mq2") is not None:
        normalized["mq4"] = normalized["mq2"]
    if "mq5" not in normalized and normalized.get("mq6") is not None:
        normalized["mq5"] = normalized["mq6"]
    normalized.setdefault("sensor_map", {
        "mq2": "physical_mq4_ch4",
        "mq6": "physical_mq5_lpg",
        "mq7": "physical_mq7_co",
        "mq135": "physical_mq135_air_quality",
    })
    meta = normalized.get("meta") if isinstance(normalized.get("meta"), dict) else {}
    availability = normalized.get("sensor_availability")
    if not isinstance(availability, dict):
        availability = meta.get("sensorAvailability") or meta.get("sensor_availability")
    if not isinstance(availability, dict):
        availability = {}
    availability.setdefault("o2_level", False)
    availability.setdefault("pressure", False)
    normalized["sensor_availability"] = availability
    if availability.get("o2_level") is False:
        normalized.pop("o2_level", None)
    if availability.get("pressure") is False:
        normalized.pop("pressure", None)
    return normalized


def forward_to_cloud(event_type, payload):
    if not cloud_sync_enabled or not cloud_endpoint:
        return
    body = {
        "type": event_type,
        "payload": payload,
        "timestamp": datetime.now().isoformat()
    }
    data = json.dumps(body).encode('utf-8')
    req = urllib.request.Request(
        cloud_endpoint,
        data=data,
        headers={'Content-Type': 'application/json'}
    )
    try:
        urllib.request.urlopen(req, timeout=3)
    except (urllib.error.URLError, urllib.error.HTTPError) as exc:
        print(f"[CLOUD] Forward failed: {exc}")


def post_json(url, payload, timeout=3):
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(
        url,
        data=data,
        headers={'Content-Type': 'application/json'}
    )
    with urllib.request.urlopen(req, timeout=timeout) as response:
        return json.loads(response.read().decode('utf-8'))


def get_json(url, timeout=2):
    try:
        with urllib.request.urlopen(url, timeout=timeout) as response:
            return json.loads(response.read().decode('utf-8'))
    except TimeoutError as exc:
        raise urllib.error.URLError(exc) from exc


def send_to_aegis(event_kind, device_id, device_type, payload, metadata=None):
    if not aegis_service_url:
        return None
    envelope = {
        "deviceId": device_id,
        "deviceType": device_type,
        "eventKind": event_kind,
        "timestamp": datetime.now().isoformat(),
        "sequenceId": f"{device_id}-{datetime.now().timestamp()}",
        "transport": "wifi_http",
        "payload": payload
    }
    if isinstance(metadata, dict):
        envelope["metadata"] = metadata
    try:
        result = post_json(f"{aegis_service_url}/ingest", envelope, timeout=2)
        device = result.get("device") if isinstance(result, dict) else None
        if device and "deviceId" in device:
            aegis_cache["devices"][device["deviceId"]] = device
        aegis_cache["last_error"] = None
        return result
    except (ValueError, TimeoutError, urllib.error.URLError, urllib.error.HTTPError, json.JSONDecodeError) as exc:
        aegis_cache["last_error"] = str(exc)
        return None


def refresh_aegis_summary():
    if not aegis_service_url:
        return None
    try:
        summary = get_json(f"{aegis_service_url}/summary", timeout=2)
        aegis_cache["summary"] = summary
        aegis_cache["last_sync"] = datetime.now().isoformat()
        return summary
    except (ValueError, TimeoutError, urllib.error.URLError, urllib.error.HTTPError, json.JSONDecodeError) as exc:
        aegis_cache["last_error"] = str(exc)
        return None


def refresh_aegis_overview():
    if not aegis_service_url:
        return None
    try:
        overview = get_json(f"{aegis_service_url}/overview", timeout=3)
        aegis_cache["overview"] = overview
        aegis_cache["last_sync"] = datetime.now().isoformat()
        return overview
    except (ValueError, TimeoutError, urllib.error.URLError, urllib.error.HTTPError, json.JSONDecodeError) as exc:
        aegis_cache["last_error"] = str(exc)
        return None


def refresh_aegis_network_intelligence():
    if not aegis_service_url:
        return None
    try:
        intelligence = get_json(f"{aegis_service_url}/gateway/network/intelligence", timeout=3)
        aegis_cache["network_intelligence"] = intelligence
        aegis_cache["last_sync"] = datetime.now().isoformat()
        return intelligence
    except (ValueError, TimeoutError, urllib.error.URLError, urllib.error.HTTPError, json.JSONDecodeError) as exc:
        aegis_cache["last_error"] = str(exc)
        return None


def refresh_aegis_network_actions():
    if not aegis_service_url:
        return None
    try:
        actions = get_json(f"{aegis_service_url}/gateway/network/actions", timeout=3)
        aegis_cache["network_actions"] = actions
        aegis_cache["last_sync"] = datetime.now().isoformat()
        return actions
    except (ValueError, TimeoutError, urllib.error.URLError, urllib.error.HTTPError, json.JSONDecodeError) as exc:
        aegis_cache["last_error"] = str(exc)
        return None


def resolve_probe_target(node_id, overrides=None):
    record = device_registry.get(node_id)
    meta = {}
    if record and isinstance(record.get("meta"), dict):
        meta.update(record["meta"])
    if isinstance(overrides, dict):
        meta.update({key: value for key, value in overrides.items() if value is not None})

    address = meta.get("address") or meta.get("ip") or meta.get("host")
    if not address:
        return None

    protocol = meta.get("protocol") or meta.get("transportProtocol") or "HTTP"
    target = {
        "nodeId": node_id,
        "address": address,
        "protocol": protocol,
    }
    if meta.get("port") is not None:
        target["port"] = meta.get("port")
    if meta.get("path"):
        target["path"] = meta.get("path")
    if meta.get("timeoutMs") is not None:
        target["timeoutMs"] = meta.get("timeoutMs")
    return target


@app.route('/')
def home():
    return "Atlas Server Running!"


# ═══════════════════════════════════════════════
#  RECEIVE FROM SENSOR NODES (POST)
# ═══════════════════════════════════════════════

@app.route('/sensor_data/<node_id>', methods=['POST'])
def receive_sensor_data(node_id):
    data = request.get_json()

    if not data:
        return jsonify({"status": "error", "message": "Invalid data"}), 400

    data = normalize_node_payload(data)
    data["node_id"] = node_id
    data["timestamp"] = datetime.now().isoformat()

    try:
        data["ai"] = predict_node_risk(data)
    except Exception as exc:
        data["ai"] = {"error": str(exc), "engine": "Unavailable"}

    node_data[node_id] = data
    meta = merge_network_metadata(data, data.get("meta"))
    register_device(node_id, "node", meta)
    aegis_result = send_to_aegis("SENSOR_EVENT", node_id, "node", data, meta)
    if aegis_result is None:
        forward_to_cloud("sensor_data", data)

    print(f"[NODE] Received from {node_id} | Temp: {data.get('temperature')}C | MQ135: {data.get('mq135')}")

    return jsonify({"status": "success", "node_id": node_id}), 200


# ═══════════════════════════════════════════════
#  RECEIVE FROM SMART WATCHES (POST)
# ═══════════════════════════════════════════════

@app.route('/watch_data/<worker_id>', methods=['POST'])
def receive_watch_data(worker_id):
    data = request.get_json()

    if not data:
        return jsonify({"status": "error", "message": "Invalid data"}), 400

    data["worker_id"] = worker_id
    data["timestamp"] = datetime.now().isoformat()

    watch_data[worker_id] = data
    meta = merge_network_metadata(data, data.get("meta"))
    register_device(worker_id, "watch", meta)
    aegis_result = send_to_aegis("TELEMETRY", worker_id, "watch", data, meta)
    if aegis_result is None:
        forward_to_cloud("watch_data", data)

    sos = "[SOS!]" if data.get("sos_button") == 1 else ""
    nearest = data.get("proximity", {}).get("nearest_node", "?")
    print(f"[WATCH] Received from {worker_id} | HR: {data.get('heart_rate')} | SpO2: {data.get('spo2')}% | Near: {nearest} {sos}")

    return jsonify({"status": "success", "worker_id": worker_id}), 200


# ═══════════════════════════════════════════════
#  PPE DETECTION — IP CAM + GATE CONTROL
# ═══════════════════════════════════════════════

# Store latest PPE detection result
ppe_data = empty_ppe_data()


# 🔹 Receive PPE detection from IP cam (POST)
# The camera + model will POST what it detected
@app.route('/ppe_detection', methods=['POST'])
def receive_ppe_detection():
    data = request.get_json()

    if not data:
        return jsonify({"status": "error", "message": "Invalid data"}), 400

    helmet = data.get("helmet", False)
    vest = data.get("vest", False)
    gloves = data.get("gloves", False)

    camera_id = data.get("camera_id", "ppe_camera")

    # Check what's missing
    missing = []
    if not helmet:
        missing.append("HELMET")
    if not vest:
        missing.append("VEST")
    if not gloves:
        missing.append("GLOVES")

    all_ok = len(missing) == 0
    gate_status = 1 if all_ok else 0

    ppe_data["helmet"] = helmet
    ppe_data["vest"] = vest
    ppe_data["gloves"] = gloves
    ppe_data["gate_status"] = gate_status
    ppe_data["missing_items"] = missing
    ppe_data["timestamp"] = datetime.now().isoformat()
    ppe_data["source"] = data.get("source") or data.get("data_source") or "ppe"

    meta = merge_network_metadata(data, {"stream": data.get("stream")})
    register_device(camera_id, "camera", meta)
    aegis_result = send_to_aegis("SENSOR_EVENT", camera_id, "camera", ppe_data, meta)
    if aegis_result is None:
        forward_to_cloud("ppe_detection", ppe_data)

    if all_ok:
        print(f"[SAFE] PPE OK - Gate OPEN")
    else:
        print(f"[DANGER] PPE MISSING: {', '.join(missing)} - Gate CLOSED")

    return jsonify({
        "status": "success",
        "gate_status": gate_status,
        "missing_items": missing
    }), 200


# 🔹 ESP32 polls this to check gate open/close
@app.route('/ppe_status', methods=['GET'])
def get_ppe_status():
    return jsonify({
        "gate": ppe_data["gate_status"],
        "missing": ppe_data["missing_items"]
    })


# ═══════════════════════════════════════════════
#  SERVE ALL DATA (GET)
# ═══════════════════════════════════════════════

@app.route('/ingest', methods=['POST'])
def ingest_any_device():
    data = request.get_json() or {}
    device_id = data.get("device_id") or data.get("deviceId") or data.get("id")
    if not device_id:
        return jsonify({"status": "error", "message": "device_id required"}), 400
    device_type = data.get("device_type") or data.get("deviceType") or data.get("type") or "unknown"
    event_kind = data.get("event_kind") or data.get("eventKind") or data.get("kind") or "TELEMETRY"
    payload = data.get("payload")
    meta = data.get("meta") or data.get("metadata")
    if payload is None:
        skip_keys = {
            "device_id",
            "deviceId",
            "id",
            "device_type",
            "deviceType",
            "type",
            "event_kind",
            "eventKind",
            "kind",
            "payload",
            "meta",
            "metadata",
        }
        payload = {key: value for key, value in data.items() if key not in skip_keys}
    if not isinstance(payload, dict):
        payload = {"value": payload}
    merged_meta = merge_network_metadata(data, meta if isinstance(meta, dict) else None)
    record = register_device(device_id, device_type, merged_meta)
    aegis_result = send_to_aegis(event_kind, device_id, device_type, payload, merged_meta)
    if aegis_result is None:
        forward_to_cloud("ingest", {"device_id": device_id, "device_type": device_type, "payload": payload})
    return jsonify({"status": "success", "device": record, "aegis": aegis_result}), 200


@app.route('/data')
def get_data():
    refresh_aegis_summary()
    nodes = []
    for record in node_data.values():
        if isinstance(record, dict) and "ai" not in record:
            try:
                enriched = {**record, "ai": predict_node_risk(record)}
            except Exception as exc:
                enriched = {**record, "ai": {"error": str(exc), "engine": "Unavailable"}}
        else:
            enriched = record
        nodes.append(enriched)

    active_nodes, stale_nodes = split_active_stale(nodes, STALE_SENSOR_SECONDS, "sensor")
    active_workers, stale_workers = split_active_stale(watch_data.values(), STALE_WORKER_SECONDS, "wearable")
    annotated_ppe = annotate_record(ppe_data, STALE_PPE_SECONDS, "ppe")
    ai_runtime = {
        "builtIn": model_status(),
    }

    return jsonify({
        "status": "success",
        "mode": "live",
        "node_count": len(active_nodes),
        "node_ids": [node.get("node_id") for node in active_nodes],
        "nodes": active_nodes,
        "worker_count": len(active_workers),
        "worker_ids": [worker.get("worker_id") for worker in active_workers],
        "workers": active_workers,
        "ppe": None if annotated_ppe["is_stale"] else annotated_ppe,
        "stale": {
            "node_count": len(stale_nodes),
            "nodes": stale_nodes,
            "worker_count": len(stale_workers),
            "workers": stale_workers,
            "ppe": annotated_ppe if annotated_ppe["is_stale"] else None,
        },
        "staleness": {
            "sensor_ttl_seconds": STALE_SENSOR_SECONDS,
            "worker_ttl_seconds": STALE_WORKER_SECONDS,
            "ppe_ttl_seconds": STALE_PPE_SECONDS,
        },
        "devices": list(device_registry.values()),
        "aegis": {
            "devices": list(aegis_cache["devices"].values()),
            "summary": aegis_cache["summary"],
            "last_error": aegis_cache["last_error"],
            "last_sync": aegis_cache["last_sync"],
            "status": aegis_status(),
        },
        "ai": ai_runtime,
        "live_status": {
            "has_active_sensor_data": bool(active_nodes or active_workers or (not annotated_ppe["is_stale"])),
            "stale_record_count": len(stale_nodes) + len(stale_workers) + (1 if annotated_ppe["is_stale"] else 0),
        },
        "cloud": {
            "enabled": cloud_sync_enabled,
            "endpoint_configured": cloud_endpoint is not None
        }
    })


@app.route('/lab/clear', methods=['POST'])
def clear_lab_runtime_data():
    node_data.clear()
    watch_data.clear()
    device_registry.clear()
    cloud_commands.clear()
    ppe_data.clear()
    ppe_data.update(empty_ppe_data())
    aegis_cache["devices"].clear()
    aegis_cache["summary"] = None
    aegis_cache["overview"] = None
    aegis_cache["network_intelligence"] = None
    aegis_cache["network_actions"] = None
    aegis_cache["last_error"] = None
    aegis_cache["last_sync"] = None
    if aegis_service_url:
        try:
            post_json(f"{aegis_service_url}/runtime/clear", {}, timeout=2)
        except (ValueError, TimeoutError, urllib.error.URLError, urllib.error.HTTPError, json.JSONDecodeError) as exc:
            aegis_cache["last_error"] = str(exc)
    return jsonify({"status": "success", "message": "local lab telemetry cleared"}), 200


@app.route('/runtime/clear', methods=['POST'])
def clear_runtime_data():
    return clear_lab_runtime_data()


@app.route('/ai/status')
def ai_status():
    return jsonify({
        "builtIn": model_status(),
    })


@app.route('/aegis/overview')
def aegis_overview():
    overview = refresh_aegis_overview()
    if overview is None:
        cached = aegis_cache.get("overview")
        return jsonify(unavailable_payload("overview", cached)), 200
    return jsonify(overview)


@app.route('/aegis/network/intelligence')
def aegis_network_intelligence():
    intelligence = refresh_aegis_network_intelligence()
    if intelligence is None:
        cached = aegis_cache.get("network_intelligence")
        return jsonify(unavailable_payload("network_intelligence", cached)), 200
    return jsonify(intelligence)


@app.route('/aegis/network/actions')
def aegis_network_actions():
    actions = refresh_aegis_network_actions()
    if actions is None:
        cached = aegis_cache.get("network_actions")
        return jsonify(unavailable_payload("network_actions", cached)), 200
    return jsonify(actions)


@app.route('/aegis/network/observe', methods=['POST'])
def aegis_network_observe():
    data = request.get_json() or {}
    try:
        result = post_json(f"{aegis_service_url}/gateway/network/observe", data, timeout=3)
        return jsonify(result), 202
    except (ValueError, TimeoutError, urllib.error.URLError, urllib.error.HTTPError, json.JSONDecodeError) as exc:
        aegis_cache["last_error"] = str(exc)
        return jsonify({"status": "unavailable", "accepted": False, "message": str(exc)}), 200


@app.route('/aegis/network/probe', methods=['POST'])
def aegis_network_probe():
    return jsonify({
        "status": "removed",
        "accepted": False,
        "message": "Direct reachability probe is disabled for this deployment. Use registered-node ping or AEGIS observations.",
    }), 410


@app.route('/aegis/network/ping', methods=['POST'])
def aegis_network_ping():
    data = request.get_json() or {}
    node_id = data.get("nodeId") or data.get("node_id")
    if not node_id:
        return jsonify({"status": "error", "message": "nodeId required"}), 400
    target = resolve_probe_target(node_id, data)
    if target is None:
        return jsonify({"status": "error", "message": "node is not registered with a probe address"}), 404
    try:
        result = post_json(f"{aegis_service_url}/gateway/network/probe", target, timeout=3)
        return jsonify(result), 202
    except (ValueError, TimeoutError, urllib.error.URLError, urllib.error.HTTPError, json.JSONDecodeError) as exc:
        aegis_cache["last_error"] = str(exc)
        return jsonify({"status": "unavailable", "accepted": False, "message": str(exc)}), 200


# ═══════════════════════════════════════════════
#  DEVICE REGISTRATION + CLOUD CONTROL
# ═══════════════════════════════════════════════

@app.route('/register', methods=['POST'])
def register_device_endpoint():
    data = request.get_json() or {}
    device_id = data.get("device_id")
    device_type = data.get("device_type") or "unknown"
    if not device_id:
        return jsonify({"status": "error", "message": "device_id required"}), 400
    record = register_device(device_id, device_type, data.get("meta"))
    try:
        post_json(f"{aegis_service_url}/register", {
            "deviceId": device_id,
            "deviceType": device_type,
            "capabilities": data.get("capabilities") or []
        }, timeout=2)
    except (ValueError, TimeoutError, urllib.error.URLError, urllib.error.HTTPError, json.JSONDecodeError):
        pass
    return jsonify({"status": "success", "device": record}), 200


@app.route('/cloud/status', methods=['GET', 'POST'])
def cloud_status():
    global cloud_sync_enabled
    if request.method == 'POST':
        data = request.get_json() or {}
        if "enabled" in data:
            cloud_sync_enabled = parse_bool(data.get("enabled"), cloud_sync_enabled)
            try:
                post_json(f"{aegis_service_url}/cloud/status", {"enabled": cloud_sync_enabled}, timeout=2)
            except (ValueError, TimeoutError, urllib.error.URLError, urllib.error.HTTPError, json.JSONDecodeError):
                pass
    return jsonify({
        "enabled": cloud_sync_enabled,
        "endpoint_configured": cloud_endpoint is not None
    })


@app.route('/cloud/command', methods=['POST'])
def cloud_command():
    if not cloud_sync_enabled:
        return jsonify({"status": "error", "message": "cloud sync disabled"}), 403
    data = request.get_json() or {}
    device_id = data.get("device_id") or data.get("deviceId")
    cloud_commands.append({
        "timestamp": datetime.now().isoformat(),
        "command": data,
        "device_id": device_id
    })
    try:
        post_json(f"{aegis_service_url}/cloud/command", data, timeout=2)
    except (ValueError, TimeoutError, urllib.error.URLError, urllib.error.HTTPError, json.JSONDecodeError):
        pass
    return jsonify({"status": "accepted"}), 200


@app.route('/cloud/command', methods=['GET'])
def cloud_command_get():
    device_id = request.args.get("device_id")
    consume = request.args.get("consume") in ("1", "true", "yes")
    if not device_id:
        return jsonify({"status": "error", "message": "device_id required"}), 400

    for idx in range(len(cloud_commands) - 1, -1, -1):
        entry = cloud_commands[idx]
        if entry.get("device_id") == device_id:
            if consume:
                cloud_commands.pop(idx)
            return jsonify({"status": "ok", "command": entry.get("command"), "timestamp": entry.get("timestamp")})

    return jsonify({"status": "none"}), 200


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=BACKEND_PORT, debug=True, use_reloader=False)
