import os
import pickle
from datetime import datetime

try:
    import numpy as np
except ImportError:
    np = None

try:
    import xgboost as xgb
    XGB_IMPORT_ERROR = None
except Exception as exc:
    xgb = None
    XGB_IMPORT_ERROR = str(exc)

MODEL_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "ml", "models"))
GAS_MODEL_FILES = ("gas_xgb.json", "resqsense_xai_model.json")
FIRE_MODEL_FILES = ("fire_rf.pkl", "resqsense_fire_model.pkl")

_gas_model = None
_fire_model = None
_model_state = {
    "loaded_at": None,
    "gas_model": None,
    "fire_model": None,
    "errors": [],
}


def _find_model_path(candidates):
    for name in candidates:
        path = os.path.join(MODEL_DIR, name)
        if os.path.exists(path):
            return path
    return None


def _load_gas_model():
    if xgb is None or np is None:
        if XGB_IMPORT_ERROR:
            return None, f"xgboost_unavailable:{XGB_IMPORT_ERROR}"
        return None, "xgboost_unavailable"
    path = _find_model_path(GAS_MODEL_FILES)
    if not path:
        return None, "gas_model_missing"
    model = xgb.XGBClassifier()
    model.load_model(path)
    return model, None


def _load_fire_model():
    if np is None:
        return None, "numpy_unavailable"
    path = _find_model_path(FIRE_MODEL_FILES)
    if not path:
        return None, "fire_model_missing"
    with open(path, "rb") as file_handle:
        model = pickle.load(file_handle)
    return model, None


def _initialize_models():
    global _gas_model
    global _fire_model
    errors = []

    try:
        _gas_model, error = _load_gas_model()
        if error:
            errors.append(error)
    except Exception as exc:
        errors.append(f"gas_model_error:{exc}")
        _gas_model = None

    try:
        _fire_model, error = _load_fire_model()
        if error:
            errors.append(error)
    except Exception as exc:
        errors.append(f"fire_model_error:{exc}")
        _fire_model = None

    _model_state.update({
        "loaded_at": datetime.now().isoformat(),
        "gas_model": "loaded" if _gas_model else "unavailable",
        "fire_model": "loaded" if _fire_model else "unavailable",
        "errors": errors,
    })


_initialize_models()


def model_status():
    return dict(_model_state)


def predict_node_risk(node):
    if not isinstance(node, dict):
        return None
    if np is None or _gas_model is None or _fire_model is None:
        return None

    mq2 = _to_float(node.get("mq2"))
    mq5 = _to_float(node.get("mq5"))
    mq6 = _to_float(node.get("mq6"))
    mq7 = _to_float(node.get("mq7"))
    mq135 = _to_float(node.get("mq135"))
    temperature = _to_float(node.get("temperature"))
    humidity = _to_float(node.get("humidity"))
    vibration = _to_float(node.get("vibration"))
    pressure = _to_float(node.get("pressure"))

    gas_avg = _average([mq2, mq6, mq7, mq135])
    gas_prior = _normalize(gas_avg, 200, 1000)

    mq5_value = mq5 if mq5 is not None else mq6
    gas_model_prob = None
    gas_model_used = False
    if None not in (mq2, mq5_value, mq7, mq135):
        gas_model_prob = _predict_prob(_gas_model, [mq2, mq5_value, mq7, mq135])
        gas_model_used = gas_model_prob is not None
    if gas_model_prob is None:
        return None

    gas_fused = _bayesian_fuse(gas_prior, gas_model_prob) if gas_model_prob is not None else gas_prior

    eco2 = _to_float(node.get("eco2"))
    if eco2 is None:
        eco2 = _to_float(node.get("eCO2"))
    if eco2 is None:
        eco2 = mq135

    temp_risk = _normalize(temperature, 20, 60)
    fire_prior = _clamp01(0.65 * temp_risk + 0.35 * gas_fused)

    fire_model_prob = None
    fire_model_used = False
    if None not in (temperature, humidity, pressure, eco2):
        fire_model_prob = _predict_prob(_fire_model, [temperature, humidity, pressure, eco2])
        fire_model_used = fire_model_prob is not None
    if fire_model_prob is None:
        return None

    fire_fused = _bayesian_fuse(fire_prior, fire_model_prob) if fire_model_prob is not None else fire_prior

    collapse_risk = _normalize(vibration, 0, 10)

    gas_pct = round(gas_fused * 100)
    fire_pct = round(fire_fused * 100)
    collapse_pct = round(collapse_risk * 100)
    air_quality_pct = round(_normalize(mq135, 200, 1000) * 100)

    weighted_risks = [
        (gas_pct, 0.45),
        (fire_pct, 0.35),
        (collapse_pct, 0.20),
    ]
    total_weight = sum(weight for _, weight in weighted_risks)
    overall = round(sum(value * weight for value, weight in weighted_risks) / total_weight)

    features = _feature_weights([
        ("MQ7 Concentration", mq7, gas_pct * 0.35),
        ("MQ135 Air Quality", mq135, gas_pct * 0.25),
        ("Thermal Variance", temperature, fire_pct * 0.2),
        ("Seismic Activity", vibration, collapse_pct * 0.25),
    ])

    explanation = _build_explanation(overall, features)

    model_sources = {
        "gas": "xgboost",
        "fire": "random_forest",
        "eco2": "sensor" if node.get("eco2") or node.get("eCO2") else "mq135_proxy",
        "o2": "not_configured",
        "pressure": "sensor" if pressure is not None else "not_configured",
    }

    confidence = _clamp01(0.55 + 0.2 * int(gas_model_used) + 0.2 * int(fire_model_used))

    return {
        "gasRisk": gas_pct,
        "airQualityRisk": air_quality_pct,
        "fireRisk": fire_pct,
        "collapseRisk": collapse_pct,
        "overallRisk": overall,
        "features": features,
        "explanation": explanation,
        "engine": "Bayesian Fusion",
        "confidence": round(confidence * 100, 1),
        "modelSources": model_sources,
    }


def _predict_prob(model, values):
    if np is None:
        return None
    try:
        data = np.array([values], dtype=float)
        if hasattr(model, "predict_proba"):
            return float(model.predict_proba(data)[0][1])
        if hasattr(model, "predict"):
            return float(model.predict(data)[0])
    except Exception:
        return None
    return None


def _bayesian_fuse(prior, likelihood):
    if prior is None or likelihood is None:
        return prior if prior is not None else 0
    prior = _clamp01(prior)
    likelihood = _clamp01(likelihood)
    numerator = likelihood * prior
    denominator = numerator + (1 - likelihood) * (1 - prior)
    if denominator <= 0:
        return prior
    return numerator / denominator


def _normalize(value, low, high):
    if value is None:
        return 0
    if high == low:
        return 0
    return _clamp01((value - low) / (high - low))


def _average(values):
    clean = [value for value in values if value is not None]
    if not clean:
        return None
    return sum(clean) / len(clean)


def _clamp01(value):
    if value is None:
        return 0
    return max(0.0, min(1.0, float(value)))


def _to_float(value):
    try:
        if value is None:
            return None
        return float(value)
    except (TypeError, ValueError):
        return None


def _feature_weights(items):
    total = sum(item[2] for item in items if item[2] is not None)
    features = []
    for name, value, weight in items:
        if total > 0:
            normalized = round((weight / total) * 100)
        else:
            normalized = 0
        features.append({
            "name": name,
            "value": value,
            "weight": normalized,
        })
    return sorted(features, key=lambda item: item["weight"], reverse=True)


def _build_explanation(overall, features):
    primary = features[0]["name"] if features else "Sensor Fusion"
    if overall > 60:
        return (
            f"Critical anomaly detected in {primary}. Bayesian fusion indicates elevated hazard."
        )
    if overall > 35:
        return (
            f"Pre-alert status: Elevated {primary} detected. Bayesian fusion signals caution."
        )
    return "All fusion metrics within nominal range."
