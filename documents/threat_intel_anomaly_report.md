# Feature Report: Threat Intel Enrichment & ML Anomaly Scoring

**Project:** Sentinel-AI Security Operations Center  
**Date:** 2026-06-21  
**Author:** Engineering Team  
**Status:** Implemented — integrated into Investigation Agent pipeline

---

## Problem Being Solved

The original Investigation Agent made every decision from a single data point: the name of the
detection rule that fired. A "Brute Force SSH" alert was always treated the same — whether the
source IP was a known botnet in China or the company's own IT helpdesk running a scheduled
provisioning script.

This caused two costly failure modes:

1. **Overconfident decisions on low-signal alerts** — the LLM would recommend BLOCK_IP
   with high confidence even when an alert was almost certainly a false positive.

2. **Underconfident decisions on high-signal alerts** — the LLM had no way to know that an IP
   had already been reported 400 times on AbuseIPDB this week, so it could not escalate appropriately.

Both problems waste analyst time and degrade trust in the system.

---

## Feature 1: Threat Intelligence Enrichment

**File:** `agents/investigation-agent/threat_intel.py`

### What It Does

Before the LLM receives the alert, the `enrich(ip)` function performs two parallel reputation
lookups against external threat intelligence databases:

| Source | Data Returned | API Tier Used |
|--------|---------------|---------------|
| **AbuseIPDB** | Abuse confidence score (0–100), total reports, country, ISP, Tor flag, last seen | Free (1,000 checks/day) |
| **VirusTotal** | Malicious engine count, suspicious engine count, ASN owner | Free (4 req/min) |

The results are serialised into a single human-readable string and prepended to the LLM's user
message — not the system prompt — so the model sees it as part of the specific alert context.

### Why This Makes the LLM Better

The LLM's system prompt explicitly instructs it to use the enrichment data to calibrate its
`confidence_score` and `false_positive_likelihood` fields:

- IP with AbuseIPDB score ≥ 50 + VT malicious ≥ 3 → LLM raises confidence to 85–95%, sets
  `false_positive_likelihood = LOW`
- Private/internal IP (RFC1918) → LLM sets `false_positive_likelihood = HIGH` and notes
  lateral movement as an alternative hypothesis
- Unknown IP with score 0 and VT harmless = 80 → LLM lowers confidence, suggests monitoring
  rather than immediate block

### Private IP Guard

The function detects RFC1918 ranges (10.x, 172.16–31.x, 192.168.x, 127.x) and skips all
external API calls. Instead it immediately returns an `is_internal: true` flag and a note.
This prevents the pipeline from making API calls for internal scanner results or developer
machines, and prompts the LLM to consider false positive / lateral movement scenarios.

### Timeout Safety

Every HTTP call uses a 3-second timeout. If either API is down, the function returns an empty
dict and the pipeline continues without enrichment. The LLM prompt notes when data is
unavailable so the model does not fabricate reputation scores.

### Configuration

Set in `.env` (or `.env.example`):

```
ABUSEIPDB_API_KEY=your-key    # https://www.abuseipdb.com/account/api
VIRUSTOTAL_API_KEY=your-key   # https://www.virustotal.com/gui/my-apikey
```

Both are optional. The agent degrades gracefully if either or both keys are missing.

---

## Feature 2: Isolation Forest Anomaly Scoring

**File:** `agents/investigation-agent/anomaly_detector.py`

### What It Does

Every alert is scored by a trained machine learning model before it reaches the LLM.
The score (`0.0 = perfectly normal`, `1.0 = maximally anomalous`) is injected into the
LLM prompt alongside the threat intel data.

### Algorithm: Isolation Forest

Isolation Forest is an unsupervised anomaly detection algorithm well-suited to this problem
because:

- It requires **no labeled attack data** to train — it only needs examples of *normal* traffic.
- It works well on **tabular, low-dimensional feature vectors** (6 features per alert).
- It is **fast at inference** (<1ms per alert after training) — no network call, no latency.
- It naturally handles **mixed feature types** (categorical like `is_internal`, continuous
  like `log_length`).

Alternative algorithms considered and rejected:

| Algorithm | Reason Rejected |
|-----------|-----------------|
| One-Class SVM | Much slower on inference; sensitive to kernel choice |
| Autoencoder (neural net) | Overkill for 6 features; requires GPU or heavy deps |
| Z-score / statistical | Cannot capture joint distributions or interactions |
| LSTM sequence model | Requires temporal sequence data we don't have yet |

### Feature Extraction

Six features are extracted from each alert dict:

| # | Feature | Source | Rationale |
|---|---------|---------|-----------|
| 0 | `port` | `context.port` or parsed from raw_log | Unusual ports (e.g. 0, 65535) are rare in normal traffic |
| 1 | `hour_of_day` | System clock | Attacks often spike at off-hours (02:00–05:00 UTC) |
| 2 | `is_internal_ip` | RFC1918 check on source IP | Internal sources behaving like external attackers is highly anomalous |
| 3 | `severity_score` | LOW=1 MEDIUM=2 HIGH=3 CRITICAL=4 | Severity alone is a weak signal when combined with other features |
| 4 | `log_length` | `len(raw_log)`, capped at 500 chars | SQL injection payloads and exploit strings are typically much longer than normal logs |
| 5 | `special_char_count` | Count of `"'();,=*/<>\|\\&$\`` in raw_log | SQL/shell injection payloads have dense special character sequences |

### Baseline Training Data

The model trains at startup on 600 synthetic "normal" feature vectors representing three
legitimate traffic profiles:

| Profile | Port | Hours | IP Type | Severity | Notes |
|---------|------|-------|---------|----------|-------|
| Normal SSH | 22 | 08–18 | Internal | LOW | Admin logins during business hours |
| Normal Web | 80/443 | Any | Mixed | LOW/MED | HTTP/HTTPS requests with minimal payloads |
| Normal DB | 3306/5432/6379 | 08–18 | Internal | LOW | Database queries from app servers |

Anomalies — like a port-22 connection at 03:00 from an external IP with a 450-character payload
containing SQL keywords — will deviate from all three baseline clusters and receive a high score.

### Score Interpretation

| Score Range | Label | Meaning |
|-------------|-------|---------|
| 0.00 – 0.54 | NORMAL | Consistent with baseline traffic |
| 0.55 – 0.74 | ANOMALOUS | Moderately unusual — warrants investigation |
| 0.75 – 1.00 | ANOMALOUS | Strongly deviates — high confidence this is real |

The LLM system prompt instructs it to treat the anomaly score as a secondary confidence
signal. A high anomaly score alone does not block an IP — the LLM still reasons about
the full alert — but it shifts the model's priors toward treating the event as genuine.

### No External Dependencies

Isolation Forest runs entirely in-process using `scikit-learn`. The training step takes
approximately 80–120ms at agent startup and is invisible to alert processing latency.

---

## Data Flow Diagram

```
Raw Log Line
     │
     ▼
Detection Agent  ──► regex rules ──► alert dict (rule_name, severity, context, raw_log)
     │
     ▼
Orchestrator ──► Investigation Agent
                        │
               ┌────────┴─────────┐
               │                  │
               ▼                  ▼
     Anomaly Detector      Threat Intel Enrichment
     (local, ~0ms)         (AbuseIPDB + VT, ~200ms)
               │                  │
               └────────┬─────────┘
                        │  enriched context string
                        ▼
                  OpenAI LLM (gpt-4o-mini)
                  ┌──────────────────────┐
                  │ ThreatAnalysis model │
                  │ - confidence_score   │  ← calibrated by enrichment
                  │ - false_positive     │  ← calibrated by internal IP flag
                  │ - mitre_technique    │
                  │ - attack_chain       │
                  │ - suggested_actions  │
                  └──────────────────────┘
                        │
                        ▼
               Response Agent  ──►  execute actions
                        │
                        ▼
               Report Agent  ──►  markdown incident report
                                  (includes intel table + anomaly bar)
```

---

## Effect on Output Quality

### Before (rule-based only)

```
findings: "Simulated analysis: Alert matches security rule 'Brute Force SSH'. 
           Multiple connection failures detected from unknown source."
confidence_score: 60
false_positive_likelihood: MEDIUM
analyst_notes: "OpenAI API unavailable — rule-based fallback used."
```

### After (enrichment + LLM)

```
findings: "External IP 218.92.0.158 (CN, Unicom, AbuseIPDB 87/100, 412 reports) 
           repeatedly attempted SSH authentication as root via password guessing. 
           ML anomaly score 0.83 confirms this is strongly atypical behavior. 
           Consistent with automated credential-stuffing from a known botnet."
confidence_score: 91
false_positive_likelihood: LOW
mitre_technique: "T1110.001 - Brute Force: Password Guessing"
attack_chain: [
  "Attacker (218.92.0.158) initiates TCP connection to port 22",
  "SSH banner exchange reveals OpenSSH version",
  "Automated password guessing begins targeting root account",
  "Multiple failures within short window trigger detection rule"
]
analyst_notes: "IP is listed on AbuseIPDB with 87/100 confidence and 412 historical 
                reports. ML anomaly score 0.83 corroborates. Recommend immediate 
                BLOCK_IP and review of any successful logins from this subnet."
```

---

## Cost Impact

| Lookup | Cost | Latency Added |
|--------|------|---------------|
| AbuseIPDB check | Free (1k/day) | ~120ms |
| VirusTotal check | Free (4 req/min) | ~150ms |
| Isolation Forest score | Free (local) | <1ms |
| **Total enrichment overhead** | **$0** | **~270ms** |

Both external lookups run sequentially before the LLM call. For a production system with
high alert volume, both can be parallelised with `concurrent.futures.ThreadPoolExecutor`
and results cached by IP with a 1-hour TTL.

---

## Next Steps

1. **Cache enrichment results by IP** — avoid re-querying AbuseIPDB for the same IP within
   a 1-hour window. A simple `dict` with timestamps is sufficient.

2. **Retrain anomaly model on real logs** — once the system has processed 1,000+ real alerts,
   replace the synthetic baseline with actual normal-traffic feature vectors. This will tighten
   the anomaly boundaries significantly.

3. **Add enrichment to frontend** — expose `threat_intel` and `anomaly` fields from the
   analysis dict through the backend API so the incident details page can render an
   AbuseIPDB reputation badge and anomaly score bar chart.

4. **Add GreyNoise** as a third enrichment source — it specifically identifies internet-wide
   scanners and distinguishes them from targeted attacks, which would further reduce false
   positives from opportunistic scanners.
