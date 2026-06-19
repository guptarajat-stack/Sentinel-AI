import re

RULES = [
    {
        "name": "Brute Force SSH",
        "pattern": r"Failed password for (?P<user>\S+) from (?P<ip>\S+) port \d+ ssh2",
        "severity": "HIGH"
    },
    {
        "name": "SQL Injection WAF",
        "pattern": r"(?i)(select|union|insert|update|delete|drop).*from",
        "severity": "HIGH"
    },
    {
        "name": "Port Scan Detect",
        "pattern": r"src=(?P<ip>\S+) dst=(?P<dst_ip>\S+) proto=TCP spt=\d+ dpt=(?P<port>\d+) action=REJECT",
        "severity": "MEDIUM"
    }
]

def evaluate_log(log_line):
    for rule in RULES:
        match = re.search(rule["pattern"], log_line)
        if match:
            return {
                "matched": True,
                "rule_name": rule["name"],
                "severity": rule["severity"],
                "context": match.groupdict(),
                "raw_log": log_line
            }
    return {"matched": False}
