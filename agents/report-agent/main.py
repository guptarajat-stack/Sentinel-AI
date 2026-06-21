import os
import json
import time

class ReportAgent:
    def __init__(self, output_dir=None):
        # Allow customization or relative path fallback
        self.output_dir = output_dir or os.path.join(os.path.dirname(__file__), "../../reports/generated")
        os.makedirs(self.output_dir, exist_ok=True)

    def _render_threat_intel(self, intel: dict) -> str:
        if not intel:
            return "_No threat intel data available._"
        if intel.get("is_internal"):
            return f"**INTERNAL IP** — {intel.get('note', 'private address')}"
        if "note" in intel and len(intel) == 1:
            return f"_{intel['note']}_"
        lines = []
        if "abuse_score" in intel:
            lines.append(f"| AbuseIPDB Score | {intel['abuse_score']}/100 |")
            lines.append(f"| Total Reports | {intel.get('total_reports', 0)} |")
            lines.append(f"| Last Reported | {intel.get('last_reported', 'never')} |")
            lines.append(f"| Country | {intel.get('country', '??')} |")
            lines.append(f"| ISP | {intel.get('isp', 'unknown')} |")
            lines.append(f"| Tor Node | {intel.get('is_tor', False)} |")
        if "vt_malicious" in intel:
            lines.append(f"| VT Malicious Engines | {intel.get('vt_malicious', 0)} |")
            lines.append(f"| VT Suspicious Engines | {intel.get('vt_suspicious', 0)} |")
            lines.append(f"| VT Owner | {intel.get('vt_owner', 'unknown')} |")
        if not lines:
            return "_Threat intel APIs not configured._"
        return "| Field | Value |\n|-------|-------|\n" + "\n".join(lines)

    def _render_anomaly(self, anomaly: dict) -> str:
        if not anomaly or "error" in anomaly:
            return "_Anomaly scoring unavailable._"
        score = anomaly.get("anomaly_score", "N/A")
        label = anomaly.get("label", "UNKNOWN")
        feats = anomaly.get("features", {})
        bar_len = int(float(score) * 20) if isinstance(score, (int, float)) else 10
        bar = "█" * bar_len + "░" * (20 - bar_len)
        return (
            f"`[{bar}]` **{score}/1.00** — {label}\n\n"
            f"| Feature | Value |\n|---------|-------|\n"
            f"| Port | {feats.get('port', 'N/A')} |\n"
            f"| Hour of Day | {feats.get('hour_of_day', 'N/A')}:00 |\n"
            f"| Internal IP | {feats.get('is_internal_ip', 'N/A')} |\n"
            f"| Log Length | {feats.get('log_length', 'N/A')} chars |\n"
            f"| Special Chars | {feats.get('special_char_count', 'N/A')} |"
        )

    def write_report(self, incident_id, alert, analysis, response):
        timestamp = time.strftime("%Y%m%d_%H%M%S")
        report_filename = f"INCIDENT_{incident_id}_{timestamp}.md"
        report_path = os.path.join(self.output_dir, report_filename)
        
        attack_chain = analysis.get("attack_chain", [])
        attack_chain_md = "\n".join(f"{i+1}. {step}" for i, step in enumerate(attack_chain)) or "N/A"

        md_content = f"""# SOC SECURITY INCIDENT REPORT: INC-{incident_id}
**Report Timestamp:** {time.strftime('%Y-%m-%d %H:%M:%S UTC')}
**Threat Severity:** {alert.get('severity', 'MEDIUM')}
**Analysis Engine:** {analysis.get('analysis_engine', 'rule-based:fallback')}

---

## 1. Alert Information
| Field | Value |
|-------|-------|
| Rule Triggered | {alert.get('rule_name', 'Default Rule')} |
| Raw Log | `{alert.get('raw_log', '')}` |
| Extracted Entities | `{json.dumps(alert.get('context', {}))}` |

## 2. Enrichment Data

### Threat Intelligence
{self._render_threat_intel(analysis.get('threat_intel', {}))}

### ML Anomaly Score
{self._render_anomaly(analysis.get('anomaly', {}))}

## 3. AI Threat Investigation
| Field | Value |
|-------|-------|
| Threat Classification | {analysis.get('threat_classification', 'Unknown')} |
| MITRE ATT&CK Technique | {analysis.get('mitre_technique', 'N/A')} |
| Risk Level | {analysis.get('risk_level', alert.get('severity', 'MEDIUM'))} |
| Confidence Score | {analysis.get('confidence_score', 60)}% |
| False Positive Likelihood | {analysis.get('false_positive_likelihood', 'MEDIUM')} |
| Playbook Applied | {analysis.get('playbook_applied', 'Generic Playbook')} |

**Findings:**
{analysis.get('findings', 'No additional context extracted.')}

**Attack Chain Reconstruction:**
{attack_chain_md}

**Analyst Notes:**
> {analysis.get('analyst_notes', 'No notes.')}

## 4. Containment & Remediation Actions
| Field | Value |
|-------|-------|
| Status | {response.get('status', 'PENDING')} |
| Action Performed | {response.get('action', 'NONE')} |
| Command Executed | `{response.get('command_executed', 'N/A')}` |
| Details | {response.get('message', 'No action logs available.')} |

---
*Report generated automatically by Sentinel-AI SOC Report-Agent. Confidential — internal use only.*
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
