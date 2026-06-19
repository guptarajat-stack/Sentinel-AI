import time
import random
import argparse
from brute_force import generate_brute_force_logs
from sql_injection import generate_sql_injection_logs
from port_scan import generate_port_scan_logs

def stream_logs(interval=2.0, output_file=None):
    print("Starting AI SOC Log Simulator stream... Press Ctrl+C to stop.")
    if output_file:
        print(f"Writing log stream to {output_file}")
        
    simulators = [
        generate_brute_force_logs,
        generate_sql_injection_logs,
        generate_port_scan_logs
    ]
    
    try:
        while True:
            # Pick a simulator randomly
            sim = random.choice(simulators)
            logs = sim()
            
            for log in logs:
                if output_file:
                    with open(output_file, "a") as f:
                        f.write(log + "\n")
                print(log)
                time.sleep(random.uniform(0.1, 0.5))
                
            time.sleep(interval)
    except KeyboardInterrupt:
        print("\nLog Simulator stopped.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="AI Security SOC Log Simulator")
    parser.add_argument("--interval", type=float, default=2.0, help="Interval between events in seconds")
    parser.add_argument("--out", type=str, default=None, help="Output file path to save logs")
    args = parser.parse_args()
    
    stream_logs(interval=args.interval, output_file=args.out)
