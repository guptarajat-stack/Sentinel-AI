import sys
import os
import json
import random
import importlib.util
from http.server import HTTPServer, BaseHTTPRequestHandler

AGENTS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))


def _load_class(agent_folder: str, class_name: str):
    """Load a class from an agent folder that may have dashes in its name."""
    spec = importlib.util.spec_from_file_location(
        class_name,
        os.path.join(AGENTS_DIR, agent_folder, "main.py"),
    )
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return getattr(module, class_name)


InvestigationAgent = _load_class("investigation-agent", "InvestigationAgent")
ResponseAgent = _load_class("response-agent", "ResponseAgent")
ReportAgent = _load_class("report-agent", "ReportAgent")

# Instantiate collaborative agents
investigator = InvestigationAgent()
responder = ResponseAgent()
reporter = ReportAgent()

class OrchestratorHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        if self.path == "/alert":
            content_length = int(self.headers["Content-Length"])
            post_data = self.rfile.read(content_length)
            alert = json.loads(post_data.decode("utf-8"))
            
            print(f"\n[Orchestrator] <<< New Alert Ingested: {alert.get('rule_name')}", flush=True)
            
            # Step 1: Investigation Agent Analyzes Threat & Suggests Playbook
            analysis = investigator.analyze_alert(alert)
            
            # Step 2: Response Agent Executes Containment
            actions_executed = []
            target_ip = alert.get("context", {}).get("ip") or alert.get("context", {}).get("client_ip")
            
            if target_ip:
                for action in analysis.get("suggested_actions", []):
                    result = responder.execute_action(action, target_ip)
                    actions_executed.append(result)
            else:
                actions_executed.append({
                    "status": "SKIPPED",
                    "action": "NONE",
                    "message": "No target IP identifier could be parsed from the alert log."
                })
                
            # Step 3: Report Agent Compiles PDF/Markdown Log
            incident_id = str(random.randint(10000, 99999))
            primary_action = actions_executed[0] if actions_executed else {"status": "SKIPPED"}
            report_path = reporter.write_report(incident_id, alert, analysis, primary_action)
            
            # Compile Workflow response
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            
            response = {
                "status": "RESOLVED",
                "incident_id": incident_id,
                "report_file": report_path,
                "remediations": actions_executed
            }
            self.wfile.write(json.dumps(response).encode("utf-8"))
        else:
            self.send_response(404)
            self.end_headers()

def run_orchestrator(port=5001):
    server_address = ("", port)
    httpd = HTTPServer(server_address, OrchestratorHandler)
    print(f"Orchestrator listening for alerts on port {port}...", flush=True)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nOrchestrator server shut down.", flush=True)
        httpd.server_close()

if __name__ == "__main__":
    run_orchestrator()
