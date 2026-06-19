import random
import time

def generate_port_scan_logs():
    attacker_ip = f"172.16.50.{random.randint(100, 199)}"
    target_ip = "192.168.1.10"
    common_ports = [21, 22, 23, 25, 53, 80, 110, 139, 443, 445, 1433, 3306, 3389, 8080]
    logs = []
    
    # Simulate a port scan on 5-8 random common ports
    scanned_ports = random.sample(common_ports, k=random.randint(5, 8))
    for port in scanned_ports:
        timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
        action = "REJECT" if port not in [80, 443] else "ALLOW"
        logs.append(f"{timestamp} fw-gateway-1: src={attacker_ip} dst={target_ip} proto=TCP spt={random.randint(49152, 65535)} dpt={port} action={action} bytes=0")
        
    return logs

if __name__ == "__main__":
    for log in generate_port_scan_logs():
        print(log)
