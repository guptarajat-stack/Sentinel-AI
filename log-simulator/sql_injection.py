import random
import time

def generate_sql_injection_logs():
    attacker_ip = f"10.0.10.{random.randint(10, 99)}"
    payloads = [
        "1' OR 1=1 --",
        "1' UNION SELECT username, password FROM users --",
        "1; DROP TABLE incidents; --",
        "admin' --",
        "'; EXEC xp_cmdshell('whoami') --"
    ]
    logs = []
    
    timestamp = time.strftime("%Y-%m-%dT%H:%M:%SZ")
    payload = random.choice(payloads)
    logs.append(f'{{"timestamp": "{timestamp}", "source": "nginx-waf", "level": "WARNING", "client_ip": "{attacker_ip}", "request": "GET /api/v1/auth/login?user={payload} HTTP/1.1", "action": "BLOCKED", "rule_id": "942100"}}')
    return logs

if __name__ == "__main__":
    for log in generate_sql_injection_logs():
        print(log)
