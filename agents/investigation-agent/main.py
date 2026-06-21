import os
import json
from pydantic import BaseModel
from openai import OpenAI
from dotenv import load_dotenv

import threat_intel
import anomaly_detector as ad

load_dotenv()


class ThreatAnalysis(BaseModel):
    threat_classification: str
    mitre_technique: str
    confidence_score: int
    risk_level: str
    findings: str
    attack_chain: list[str]
    playbook_applied: str
    suggested_actions: list[str]
    false_positive_likelihood: str
    analyst_notes: str


SYSTEM_PROMPT = """You are an elite SOC Tier-3 analyst with 10+ years of experience in threat hunting,
incident response, and digital forensics. You specialize in correlating security alerts with
MITRE ATT&CK, OWASP Top 10, and NIST CSF frameworks.

You will receive a security alert enriched with two additional data sources:
  • Threat Intel — external IP reputation from AbuseIPDB and VirusTotal
  • ML Anomaly Score — an Isolation Forest score (0.0 = normal, 1.0 = maximally anomalous)

Use both to calibrate your confidence_score and false_positive_likelihood:
  - A HIGH abuse score + HIGH anomaly score → raise confidence, lower false-positive likelihood
  - An INTERNAL IP → raise false-positive likelihood significantly
  - A LOW abuse score but HIGH anomaly score → unusual internal behavior, note in analyst_notes

When given the full alert, you will:
1. Classify the threat using MITRE ATT&CK technique IDs (e.g. T1110.001)
2. Assign confidence_score 0–100 — ground it in the enrichment data, not just the rule name
3. Set risk_level to one of: LOW, MEDIUM, HIGH, CRITICAL
4. Provide a concise forensic narrative in findings
5. Reconstruct attack_chain as ordered steps the attacker likely took
6. Name the playbook_applied (e.g. "SSH Brute Force Mitigation Playbook")
7. List suggested_actions using: BLOCK_IP, WAF_RECONFIG, LOG_EXCLUSION, ISOLATE_HOST, PATCH_SYSTEM
8. Assess false_positive_likelihood as LOW, MEDIUM, or HIGH
9. Write analyst_notes — cite the anomaly score and threat intel in your reasoning

Be precise, technical, and concise."""


FALLBACK_RULES = {
    "Brute Force SSH": {
        "playbook": "SSH Brute Force Mitigation Playbook",
        "actions": ["BLOCK_IP", "LOG_EXCLUSION"],
        "mitre": "T1110.001 - Brute Force: Password Guessing",
    },
    "SQL Injection WAF": {
        "playbook": "OWASP SQLi Sanitization Playbook",
        "actions": ["BLOCK_IP", "WAF_RECONFIG"],
        "mitre": "T1190 - Exploit Public-Facing Application",
    },
    "Port Scan Detect": {
        "playbook": "Network Reconnaissance Response Playbook",
        "actions": ["BLOCK_IP", "LOG_EXCLUSION"],
        "mitre": "T1046 - Network Service Discovery",
    },
}


class InvestigationAgent:
    def __init__(self):
        api_key = os.getenv("OPENAI_API_KEY")
        self.model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
        self.client = OpenAI(api_key=api_key) if api_key else None
        self.anomaly = ad.AnomalyDetector()

        if self.client:
            print(f"[Investigation Agent] OpenAI ready — model: {self.model}", flush=True)
        else:
            print("[Investigation Agent] No OPENAI_API_KEY — running in fallback mode.", flush=True)

    def _get_source_ip(self, context: dict) -> str:
        return context.get("ip") or context.get("client_ip") or context.get("src", "")

    def analyze_alert(self, alert_data: dict) -> dict:
        rule_name = alert_data.get("rule_name", "Unknown Alert")
        context = alert_data.get("context", {})
        raw_log = alert_data.get("raw_log", "")
        severity = alert_data.get("severity", "MEDIUM")

        print(f"[Investigation Agent] Analyzing: {rule_name} | severity={severity}", flush=True)

        # --- Stage 1: ML anomaly scoring (local, no network call) ---
        anomaly_result = self.anomaly.score(alert_data)
        anomaly_str = ad.format_for_prompt(anomaly_result)
        print(f"[Investigation Agent] {anomaly_str.splitlines()[0]}", flush=True)

        # --- Stage 2: Threat intel enrichment (external APIs, ~200ms) ---
        source_ip = self._get_source_ip(context)
        intel = threat_intel.enrich(source_ip)
        intel_str = threat_intel.format_for_prompt(source_ip, intel)
        print(f"[Investigation Agent] {intel_str.splitlines()[0]}", flush=True)

        # --- Stage 3: LLM analysis with enriched context ---
        if self.client:
            try:
                return self._ai_analyze(
                    rule_name, context, raw_log, severity,
                    anomaly_result, anomaly_str, intel, intel_str,
                )
            except Exception as e:
                print(f"[Investigation Agent] OpenAI error: {e} — falling back.", flush=True)

        return self._fallback_analyze(
            rule_name, context, severity, anomaly_result, intel,
        )

    def _ai_analyze(
        self,
        rule_name: str,
        context: dict,
        raw_log: str,
        severity: str,
        anomaly_result: dict,
        anomaly_str: str,
        intel: dict,
        intel_str: str,
    ) -> dict:
        user_message = f"""SECURITY ALERT
==============
Rule Triggered : {rule_name}
Severity       : {severity}
Raw Log        : {raw_log}
Parsed Context : {json.dumps(context, indent=2)}

ENRICHMENT DATA
===============
{intel_str}

{anomaly_str}

Perform a full threat investigation using all available data above."""

        response = self.client.beta.chat.completions.parse(
            model=self.model,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_message},
            ],
            response_format=ThreatAnalysis,
            temperature=0.2,
        )

        a: ThreatAnalysis = response.choices[0].message.parsed

        print(
            f"[Investigation Agent] AI complete — "
            f"confidence={a.confidence_score}% | risk={a.risk_level} | "
            f"fp={a.false_positive_likelihood}",
            flush=True,
        )

        return {
            "findings": a.findings,
            "threat_classification": a.threat_classification,
            "mitre_technique": a.mitre_technique,
            "confidence_score": a.confidence_score,
            "risk_level": a.risk_level,
            "attack_chain": a.attack_chain,
            "playbook_applied": a.playbook_applied,
            "suggested_actions": a.suggested_actions,
            "false_positive_likelihood": a.false_positive_likelihood,
            "analyst_notes": a.analyst_notes,
            "analysis_engine": f"openai:{self.model}",
            # Enrichment pass-through for report agent
            "threat_intel": intel,
            "anomaly": anomaly_result,
        }

    def _fallback_analyze(
        self,
        rule_name: str,
        context: dict,
        severity: str,
        anomaly_result: dict,
        intel: dict,
    ) -> dict:
        fb = FALLBACK_RULES.get(
            rule_name,
            {
                "playbook": "Standard Incident Isolation Playbook",
                "actions": ["BLOCK_IP", "LOG_EXCLUSION"],
                "mitre": "T1059 - Command and Scripting Interpreter",
            },
        )

        source_ip = self._get_source_ip(context)
        abuse_score = intel.get("abuse_score", "N/A")
        anomaly_score = anomaly_result.get("anomaly_score", "N/A")

        return {
            "findings": (
                f"Rule-based analysis: '{rule_name}' from {source_ip}. "
                f"AbuseIPDB score: {abuse_score}. "
                f"ML anomaly score: {anomaly_score}. "
                "Manual analyst review recommended."
            ),
            "threat_classification": rule_name,
            "mitre_technique": fb["mitre"],
            "confidence_score": 60,
            "risk_level": severity,
            "attack_chain": [f"Source IP {source_ip} triggered rule: {rule_name}"],
            "playbook_applied": fb["playbook"],
            "suggested_actions": fb["actions"],
            "false_positive_likelihood": "HIGH" if intel.get("is_internal") else "MEDIUM",
            "analyst_notes": "OpenAI unavailable — set OPENAI_API_KEY for AI analysis.",
            "analysis_engine": "rule-based:fallback",
            "threat_intel": intel,
            "anomaly": anomaly_result,
        }


if __name__ == "__main__":
    agent = InvestigationAgent()

    samples = [
        {
            "rule_name": "Brute Force SSH",
            "severity": "HIGH",
            "context": {"user": "root", "ip": "218.92.0.158"},
            "raw_log": "Failed password for root from 218.92.0.158 port 52341 ssh2",
        },
        {
            "rule_name": "Brute Force SSH",
            "severity": "HIGH",
            "context": {"user": "admin", "ip": "192.168.1.55"},
            "raw_log": "Failed password for admin from 192.168.1.55 port 44120 ssh2",
        },
        {
            "rule_name": "SQL Injection WAF",
            "severity": "HIGH",
            "context": {"client_ip": "45.33.32.156"},
            "raw_log": "WAF BLOCKED: SELECT * FROM users WHERE id=1 UNION SELECT password FROM admin--",
        },
    ]

    for s in samples:
        print("\n" + "=" * 60)
        result = agent.analyze_alert(s)
        print(json.dumps(result, indent=2))
