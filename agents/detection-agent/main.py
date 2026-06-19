import sys
import os
import requests
from rules import evaluate_log

ORCHESTRATOR_URL = os.getenv("ORCHESTRATOR_URL", "http://localhost:5001/alert")

def start_detection():
    print("Detection Agent is monitoring incoming log stream...", flush=True)
    try:
        for line in sys.stdin:
            line = line.strip()
            if not line:
                continue
            
            result = evaluate_log(line)
            if result["matched"]:
                print(f"[ALERT] matched rule: '{result['rule_name']}' - Severity: {result['severity']}", flush=True)
                
                # Forward to orchestrator
                try:
                    response = requests.post(ORCHESTRATOR_URL, json=result, timeout=3)
                    print(f"    Orchestrator alert logged, status code: {response.status_code}", flush=True)
                except requests.RequestException as e:
                    print(f"    Orchestrator endpoint connection failed: {e}", flush=True)
    except KeyboardInterrupt:
        print("\nDetection Agent stopped.", flush=True)

if __name__ == "__main__":
    start_detection()
