import random
import threading
import time
import requests


# 🔹 App.py endpoint — where ESP nodes send data
APP_SERVER = "http://127.0.0.1:6001"

# ═══════════════════════════════════════════════
#  SENSOR NODE DATA (ESP32 environment sensors)
# ═══════════════════════════════════════════════

def generate_node_data(node_id):
    return {
        "node_id": node_id,
        "temperature": round(random.uniform(20, 40), 2),
        "humidity": round(random.uniform(30, 90), 2),
        "vibration": round(random.uniform(0, 10), 2),
        "pressure": round(random.uniform(900, 1100), 2),
        "altitude": round(random.uniform(0, 500), 2),
        "mq6": random.randint(100, 1000),
        "mq7": random.randint(100, 1000),
        "mq2": random.randint(100, 1000),
        "mq135": random.randint(100, 1000),
        "o2_level": round(random.uniform(18, 23), 2),
        "acceleration": {
            "x": round(random.uniform(-10, 10), 2),
            "y": round(random.uniform(-10, 10), 2),
            "z": round(random.uniform(-10, 10), 2)
        }
    }


# ═══════════════════════════════════════════════
#  SMART WATCH DATA (ESP32 wearable on workers)
# ═══════════════════════════════════════════════

def generate_watch_data(worker_id):
    return {
        "worker_id": worker_id,
        "temperature": round(random.uniform(35, 39), 2),       # body temp °C
        "humidity": round(random.uniform(40, 80), 2),           # skin humidity %
        "heart_rate": random.randint(60, 120),                  # bpm
        "spo2": random.randint(90, 100),                        # blood oxygen %
        "sos_button": random.choice([0, 0, 0, 0, 0, 0, 0, 1]), # mostly 0, rare SOS
        "activity": {
            "ax": round(random.uniform(-5, 5), 2),
            "ay": round(random.uniform(-5, 5), 2),
            "az": round(random.uniform(-5, 5), 2)
        },
    }


# ═══════════════════════════════════════════════
#  ESP SIMULATORS (threaded, push every 2 sec)
# ═══════════════════════════════════════════════

# 🔹 Simulate one ESP sensor node
def esp_node(node_id):
    endpoint = f"{APP_SERVER}/sensor_data/{node_id}"

    while True:
        data = generate_node_data(node_id)

        try:
            response = requests.post(endpoint, json=data, timeout=5)
            print(f"[OK] {node_id} sent | Status: {response.status_code}")

        except requests.exceptions.ConnectionError:
            print(f"[ERR] {node_id} app.py not reachable")

        except Exception as e:
            print(f"[ERR] {node_id} error: {e}")

        time.sleep(2)


# Simulate IP Camera PPE detection
def esp_ppe_cam():
    endpoint = f"{APP_SERVER}/ppe_detection"

    while True:
        # Simulate compliance
        is_compliant = random.choice([True, True, True, False]) # 75% compliant
        if is_compliant:
            data = {"helmet": True, "vest": True, "gloves": True}
        else:
            data = {
                "helmet": random.choice([True, False]),
                "vest": random.choice([True, False]),
                "gloves": random.choice([True, False])
            }
            # Ensure at least one is false if not compliant
            if data["helmet"] and data["vest"] and data["gloves"]:
                data[random.choice(["helmet", "vest", "gloves"])] = False

        try:
            requests.post(endpoint, json=data, timeout=5)
            # Not printing here to avoid too much noise, app.py will log it
        except:
            pass

        time.sleep(10) # Update PPE every 10 seconds


# Simulate one ESP smart watch
def esp_watch(worker_id):
    endpoint = f"{APP_SERVER}/watch_data/{worker_id}"

    while True:
        data = generate_watch_data(worker_id)

        try:
            response = requests.post(endpoint, json=data, timeout=5)
            sos = "[SOS!]" if data["sos_button"] == 1 else ""
            print(f"[WATCH] {worker_id} sent | HR: {data['heart_rate']} {sos}")

        except requests.exceptions.ConnectionError:
            print(f"[ERR] {worker_id} app.py not reachable")

        except Exception as e:
            print(f"[ERR] {worker_id} error: {e}")

        time.sleep(2)





if __name__ == '__main__':

    print("[*] ESP Simulator Started!")
    print(f" -> Server: {APP_SERVER}")
    print(f" -> Interval: every 2 seconds")
    print(f" -> Nodes: node_1, node_2")
    print(f" -> Workers: worker_1, worker_2, worker_3\n")

    # Start sensor node threads
    threading.Thread(target=esp_node, args=("node_1",), daemon=True).start()
    threading.Thread(target=esp_node, args=("node_2",), daemon=True).start()

    # Start smart watch threads (3 workers)
    threading.Thread(target=esp_watch, args=("worker_1",), daemon=True).start()
    threading.Thread(target=esp_watch, args=("worker_2",), daemon=True).start()
    threading.Thread(target=esp_watch, args=("worker_3",), daemon=True).start()

    # Start PPE camera simulation
    threading.Thread(target=esp_ppe_cam, daemon=True).start()

    # Keep main thread alive
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n[*] Simulator stopped.")
