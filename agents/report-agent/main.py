import os
import json
import time

class ReportAgent:
    def __init__(self, output_dir=None):
        # Allow customization or relative path fallback
        self.output_dir = output_dir or os.path.join(os.path.dirname(__file__), "../../reports/generated")
        os.makedirs(self.output_dir, exist_ok=True)

    def write_report(self, incident_id, alert, analysis, response):
        timestamp = time.strftime("%Y%m%d_%H%M%S")
        report_filename = f"INCIDENT_{incident_id}_{timestamp}.md"
        report_path = os.path.join(self.output_dir, report_filename)
        
        md_content = f"""# SOC SECURITY INCIDENT REPORT: INC-{incident_id}
**Report Timestamp:** {time.strftime('%Y-%m-%d %H:%M:%S UTC')}
**Threat Severity:** {alert.get('severity', 'MEDIUM')}

---

## 1. Alert Information
* **Rule Triggered:** {alert.get('rule_name', 'Default Rule')}
* **Raw Log Source:** `{alert.get('raw_log', '')}`
* **Extracted Entities:** `{json.dumps(alert.get('context', {}))}`

## 2. Threat Investigation Summary
* **Playbook Reference:** {analysis.get('playbook_applied', 'Generic Playbook')}
* **Investigation Findings:** {analysis.get('findings', 'No additional context extracted.')}

## 3. Containment & Remediation Actions
* **Status:** {response.get('status', 'PENDING')}
* **Action Performed:** {response.get('action', 'NONE')}
* **Command Executed:** `{response.get('command_executed', 'N/A')}`
* **Remediation Details:** {response.get('message', 'No action logs available.')}

---
*Report generated automatically by SOC Report-Agent. Confidential.*
"""
        with open(report_path, "w") as f:
            f.write(md_content)
            
        print(f"[Report Agent] Incident report generated at: {report_path}", flush=True)
        return report_path

if __name__ == "__main__":
    agent = ReportAgent()
    agent.write_report(
        "999",
        {"rule_name": "Brute Force SSH", "raw_log": "Failed password for admin", "severity": "HIGH", "context": {"ip": "10.0.10.99"}},
        {"playbook_applied": "SSH Block Playbook", "findings": "Host was scanning SSH port."},
        {"status": "COMPLETED", "action": "BLOCK_IP", "command_executed": "iptables -A ...", "message": "Blocked IP"}
    )
