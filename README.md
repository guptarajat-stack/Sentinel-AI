# AI-Powered Security SOC (Security Operations Center)

An autonomous AI Security Operations Center dashboard, event listener, and automated incident response orchestrator.

## Project Structure

```
ai-security-soc/
├── frontend/                 # Next.js dashboard
│   ├── app/
│   │   ├── dashboard/        # SOC overview & live charts
│   │   ├── incidents/        # Incident management list & details
│   │   ├── reports/          # Executive report generator
│   │   └── chat/             # AI Copilot chatbot interface
│   ├── components/           # Custom React/Next UI Components
│   ├── lib/                  # Utilities, client configs
│   └── types/                # TypeScript Interfaces
│
├── backend/                  # Node.js API server
│   ├── src/
│   │   ├── routes/           # REST endpoints
│   │   ├── controllers/      # Route controllers
│   │   ├── services/         # Business & DB logic
│   │   ├── middleware/       # Authentication, logging, WAF rules
│   │   ├── sockets/          # Real-time dashboard sockets
│   │   └── index.ts          # Server entrypoint
│   └── prisma/
│       └── schema.prisma     # Database models
│
├── agents/                   # AI agent logic
│   ├── detection-agent/      # Log monitoring and alert triggers
│   │   ├── rules.py
│   │   └── main.py
│   ├── investigation-agent/  # RAG context collection and root cause analysis
│   │   └── main.py
│   ├── response-agent/       # Automatic mitigation execution
│   │   └── main.py
│   ├── report-agent/         # Summary & executive PDF generation
│   │   └── main.py
│   └── orchestrator/         # Agent cooperative workflow manager
│       └── workflow.py
│
├── log-simulator/            # Simulated security event generators
│   ├── generate_logs.py      # Main simulator stream
│   ├── brute_force.py        # Authentication attacks simulator
│   ├── sql_injection.py      # WAF block events simulator
│   └── port_scan.py          # Nmap/Firewall block events simulator
│
├── knowledge-base/           # RAG document store
│   ├── owasp/                # OWASP mitigation guides
│   ├── mitre/                # MITRE ATT&CK techniques
│   └── playbooks/            # Incident response playbook docs
│
├── database/
│   ├── migrations/           # Database migration files
│   └── seed.sql              # Core initial seed data
│
├── reports/
│   └── generated/            # Output folder for AI-generated summaries
│
└── docker/                   # Deployment environments
    ├── frontend.Dockerfile
    ├── backend.Dockerfile
    └── agents.Dockerfile
```

## Getting Started

### Prerequisites
- Node.js (v18+)
- Python (v3.10+)
- Docker and Docker Compose

### Setup Instructions

1. **Clone the repository:**
   ```bash
   git clone <repo-url>
   cd ai-security-soc
   ```

2. **Configure Environment Variables:**
   Copy `.env.example` to `.env` in the root:
   ```bash
   cp .env.example .env
   ```

3. **Start the environment using Docker Compose:**
   ```bash
   docker-compose up --build
   ```

This will spin up:
- PostgreSQL database at port `5432`
- Backend server at `http://localhost:5000`
- Frontend dashboard at `http://localhost:3000`
- AI Agent Orchestrator listener
