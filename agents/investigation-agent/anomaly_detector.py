"""
Isolation Forest Anomaly Detector
Scores each alert against a baseline of synthetic normal traffic.
The score (0.0–1.0) is injected into the LLM prompt so the model can
calibrate its confidence_score with an objective ML signal.
"""

import re
from datetime import datetime

import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import MinMaxScaler

# Feature index reference (kept here as documentation)
# 0: destination_port
# 1: hour_of_day       (0–23)
# 2: is_internal_ip    (0 or 1)
# 3: severity_score    (LOW=1, MEDIUM=2, HIGH=3, CRITICAL=4)
# 4: log_length        (chars, capped at 500)
# 5: special_char_count (SQL/shell injection indicators)

_SEVERITY_MAP = {"LOW": 1, "MEDIUM": 2, "HIGH": 3, "CRITICAL": 4}
_PRIVATE_PREFIXES = ("10.", "192.168.", "127.", "::1")
_PRIVATE_172 = re.compile(r"^172\.(1[6-9]|2\d|3[01])\.")
_SPECIAL_CHARS = set("\"'();,=*/<>|\\&$`")


def _is_private(ip: str) -> bool:
    if any(ip.startswith(p) for p in _PRIVATE_PREFIXES):
        return True
    return bool(_PRIVATE_172.match(ip))


def _extract_features(alert: dict) -> list[float]:
    context = alert.get("context", {})
    raw_log = alert.get("raw_log", "")
    severity = alert.get("severity", "MEDIUM")

    # Port: prefer explicit context field, fall back to parsing raw log
    port = int(context.get("port") or context.get("dpt") or 0)
    if port == 0:
        m = re.search(r"port\s+(\d+)", raw_log, re.IGNORECASE)
        port = int(m.group(1)) if m else 80

    hour = datetime.now().hour

    ip = context.get("ip") or context.get("client_ip") or context.get("src", "0.0.0.0")
    is_internal = 1.0 if _is_private(ip) else 0.0

    sev = float(_SEVERITY_MAP.get(severity.upper(), 2))
    log_len = float(min(len(raw_log), 500))
    special = float(sum(1 for c in raw_log if c in _SPECIAL_CHARS))

    return [float(port), float(hour), is_internal, sev, log_len, special]


def _build_baseline(n: int = 600) -> np.ndarray:
    """
    Synthetic normal-traffic baseline.
    These represent typical legitimate activity across three traffic profiles.
    The Isolation Forest trains exclusively on this data — anomalies are
    defined as deviations from these patterns.
    """
    rng = np.random.default_rng(42)
    rows = []

    # SSH normal: port 22, business hours, internal IPs, LOW severity, short log
    for _ in range(n // 3):
        rows.append([
            22.0,
            float(rng.integers(8, 19)),   # 08:00–18:59
            1.0,                           # internal
            1.0,                           # LOW
            float(rng.integers(40, 120)),
            0.0,
        ])

    # Web normal: port 80/443, any hour, external IPs, LOW/MEDIUM severity
    for _ in range(n // 3):
        rows.append([
            float(rng.choice([80, 443])),
            float(rng.integers(0, 24)),
            float(rng.choice([0, 1])),
            float(rng.choice([1, 2])),
            float(rng.integers(80, 350)),
            float(rng.integers(0, 4)),
        ])

    # Database / service normal: common internal ports, business hours
    for _ in range(n // 3):
        rows.append([
            float(rng.choice([3306, 5432, 6379, 27017])),
            float(rng.integers(8, 19)),
            1.0,
            1.0,
            float(rng.integers(30, 100)),
            0.0,
        ])

    return np.array(rows)


class AnomalyDetector:
    def __init__(self):
        baseline = _build_baseline()
        self.scaler = MinMaxScaler()
        scaled = self.scaler.fit_transform(baseline)

        self.model = IsolationForest(
            n_estimators=150,
            contamination=0.08,
            random_state=42,
            n_jobs=-1,
        )
        self.model.fit(scaled)
        print("[Anomaly Detector] Isolation Forest trained on 600-sample baseline.", flush=True)

    def score(self, alert: dict) -> dict:
        """
        Returns:
            anomaly_score  float 0.0–1.0  (1.0 = maximally anomalous)
            label          str   "ANOMALOUS" | "NORMAL"
            features_used  dict  for transparency / logging
        """
        try:
            raw_features = _extract_features(alert)
            arr = np.array(raw_features).reshape(1, -1)
            scaled = self.scaler.transform(arr)

            # decision_function: negative = more anomalous; map to 0-1
            raw_score = self.model.decision_function(scaled)[0]
            # typical range is roughly -0.5 to +0.5; normalise to [0, 1]
            anomaly_score = float(np.clip(0.5 - raw_score, 0.0, 1.0))
            label = "ANOMALOUS" if anomaly_score >= 0.55 else "NORMAL"

            return {
                "anomaly_score": round(anomaly_score, 3),
                "label": label,
                "features": {
                    "port": int(raw_features[0]),
                    "hour_of_day": int(raw_features[1]),
                    "is_internal_ip": bool(raw_features[2]),
                    "severity_score": int(raw_features[3]),
                    "log_length": int(raw_features[4]),
                    "special_char_count": int(raw_features[5]),
                },
            }
        except Exception as e:
            return {"anomaly_score": 0.5, "label": "UNKNOWN", "error": str(e)}


def format_for_prompt(result: dict) -> str:
    """Render the anomaly result as a single line for the LLM prompt."""
    if "error" in result:
        return "ML Anomaly Score: unavailable"

    score = result["anomaly_score"]
    label = result["label"]
    feats = result.get("features", {})

    verdict = (
        "HIGH anomaly — strongly deviates from normal baselines"
        if score >= 0.75
        else "MODERATE anomaly — partially deviates from normal"
        if score >= 0.55
        else "LOW anomaly — consistent with normal traffic patterns"
    )

    return (
        f"ML Anomaly Score: {score:.2f}/1.00 [{label}] — {verdict}\n"
        f"  Features: port={feats.get('port')}, hour={feats.get('hour_of_day')}:00, "
        f"internal_ip={feats.get('is_internal_ip')}, "
        f"log_len={feats.get('log_length')} chars, "
        f"special_chars={feats.get('special_char_count')}"
    )
