import random
import time

def generate_brute_force_logs():
    attacker_ip = f"192.168.1.{random.randint(200, 254)}"
    users = ["admin", "root", "support", "guest", "ubuntu"]
    logs = []
    
    # Generate 5-10 failed login attempts
    attempts = random.randint(5, 10)
    for _ in range(attempts):
        user = random.choice(users)
        port = random.randint(32768, 61000)
        timestamp = time.strftime("%b %d %H:%M:%S")
        logs.append(f"{timestamp} soc-server sshd[{random.randint(1000, 9999)}]: Failed password for {user} from {attacker_ip} port {port} ssh2")
        
    # Occasionally end with a successful compromise
    if random.random() > 0.5:
        port = random.randint(32768, 61000)
        timestamp = time.strftime("%b %d %H:%M:%S")
        logs.append(f"{timestamp} soc-server sshd[{random.randint(1000, 9999)}]: Accepted password for root from {attacker_ip} port {port} ssh2")
        
    return logs

if __name__ == "__main__":
    for log in generate_brute_force_logs():
        print(log)
