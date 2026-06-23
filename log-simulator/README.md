# Security Log Simulator (TypeScript)

This module is a production-quality, high-performance security log simulator designed to continuously generate realistic background activity and simulated cyberattack scenarios. The output can be streamed via `stdout` to detection systems (like the Python detection agent) and/or written directly to a PostgreSQL database for real-time visualization in the Next.js dashboard.

## Features

- **Realistic Traffic Profiling**: Simulates mixed logs from various system components (Web Server, WAF, Database, Firewall, Authentication Services, and Linux OS).
- **Simulated Cyberattack Scenarios**:
  - **SSH Brute Force**: Repeated failed passwords from external IP, optionally ending with access compromise.
  - **SQL Injection**: WAF block entries mimicking common injection vectors.
  - **Cross-Site Scripting (XSS)**: WAF block entries simulating browser-based client-side code injections.
  - **Port Scan**: Connection rejection logs over multiple ports on a single internal IP from one external source.
  - **Privilege Escalation**: Root shell spawns, failed `sudo` commands, and executing high-risk admin actions.
  - **Suspicious Login / Impossible Travel**: Concurrent sessions of the same user from geolocations thousands of miles apart (e.g., US and Russia) within minutes.
- **Batched Database Writes**: Queues database records and inserts them using Prisma Client in batches to maximize database write efficiency and avoid blocking.
- **Graceful Shutdown**: Automatically flushes queued logs to the database on system termination (`SIGINT` / `SIGTERM`).

---

## Directory Structure

```
log-simulator/
├── src/
│   ├── generators/           # Benign system component logs
│   │   ├── authLogs.ts       # SSH, PAM, Sudo session logs
│   │   ├── networkLogs.ts    # Firewall and gateway rejects
│   │   ├── webLogs.ts        # Nginx access logs and WAF passes
│   │   ├── systemLogs.ts     # OS cron, systemd, shell execution logs
│   │   └── databaseLogs.ts   # PostgreSQL query audit logs
│   │
│   ├── attacks/              # Attack scenario generators
│   │   ├── bruteForce.ts     # SSH login password guessing
│   │   ├── sqlInjection.ts   # SQL payload ModSecurity triggers
│   │   ├── xssAttack.ts      # XSS pattern blocking
│   │   ├── portScan.ts       # Service sweeps rejecting ports
│   │   ├── privilegeEscalation.ts  # Root transition & shell commands
│   │   └── suspiciousLogin.ts      # Impossible travel logins
│   │
│   ├── services/             # Core execution handlers
│   │   ├── logProducer.ts    # Mixes benign activities and coordinates attacks
│   │   ├── scheduler.ts      # Manages runtime loops and timers
│   │   └── databaseWriter.ts # Batch inserts security logs into PostgreSQL
│   │
│   ├── utils/                # Helper files
│   │   ├── random.ts         # Math utils & weighted selections
│   │   ├── ipGenerator.ts    # Private/Public IP generators
│   │   ├── geoGenerator.ts   # GeoIP template lookup and caching
│   │   └── constants.ts      # Payload lists & usernames
│   │
│   ├── types/
│   │   └── log.ts            # Log schema & configuration types
│   │
│   └── index.ts              # Command line argument parser & startup
│
├── docker/
│   └── Dockerfile            # Multi-stage production Docker definition
├── package.json
├── tsconfig.json
└── README.md
```

---

## Getting Started (Local)

### 1. Install Dependencies

Ensure you have Node.js (v18+) installed. Go into the `log-simulator` folder and install dependencies:

```bash
cd log-simulator
npm install
```

### 2. Configure Database Environment

Copy the environment variables or supply a `DATABASE_URL` pointing to your PostgreSQL instance:

```bash
# In log-simulator/.env (or root .env)
DATABASE_URL="postgresql://postgres:password123@localhost:5432/ai_security_soc?schema=public"
```

### 3. Generate Prisma Client

Generate the database schema bindings:

```bash
npx prisma generate
```

### 4. Run the Simulator

Start the simulator in development mode:

```bash
npm run dev
```

To run a built production version:

```bash
npm run build
npm start
```

---

## CLI Options

You can pass arguments to customize the simulator's output:

```bash
# Display help menu
npm run dev -- --help

# Run at a faster speed (e.g. 500ms between benign logs)
npm run dev -- --interval=500

# Do not write to the database (stdout only)
npm run dev -- --no-db

# Trigger a specific attack immediately on startup
npm run dev -- --attack=sqlInjection
```

---

## Integration with Detection Agent

You can stream logs directly into the Python Detection Agent using shell pipes:

```bash
npm run dev | python ../agents/detection-agent/main.py
```

This runs the simulator, printing raw log lines to `stdout` which are fed directly into the `stdin` monitoring loop of the detection agent.
