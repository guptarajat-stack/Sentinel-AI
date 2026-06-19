import os
import json
import requests

class InvestigationAgent:
    def __init__(self):
        self.kb_path = os.getenv("KB_PATH", "../knowledge-base")

    def analyze_alert(self, alert_data):
        rule_name = alert_data.get("rule_name", "Unknown Alert")
        context = alert_data.get("context", {})
        raw_log = alert_data.get("raw_log", "")
        
        print(f"[Investigation Agent] Running threat correlation for: {rule_name}", flush=True)
        
        # Simulate RAG document search
        playbook = "Standard Incident Isolation Playbook"
        findings = f"Simulated analysis: Alert matches security rule '{rule_name}'."
        
        if "Brute Force" in rule_name:
            playbook = "SSH Brute Force Mitigation Playbook"
            findings += f" Multiple connection failures detected from {context.get('ip', 'unknown source')}."
        elif "SQL Injection" in rule_name:
            playbook = "OWASP SQLi Sanitization Playbook"
            findings += f" Malicious request containing SQL statements blocked by frontend WAF."
            
        analysis_report = {
            "findings": findings,
            "playbook_applied": playbook,
            "suggested_actions": ["BLOCK_IP", "LOG_EXCLUSION"] if "Brute Force" in rule_name else ["BLOCK_IP", "WAF_RECONFIG"]
        }
        
        return analysis_report

if __name__ == "__main__":
    agent = InvestigationAgent()
    sample = {"rule_name": "Brute Force SSH", "context": {"ip": "192.168.1.120"}, "raw_log": "ssh fail"}
    print(json.dumps(agent.analyze_alert(sample), indent=2))
