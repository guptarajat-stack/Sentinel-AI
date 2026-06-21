# AI Security SOC - Database Documentation

## Overview

This document describes the complete database schema for the AI Security SOC (Security Operations Center) system. The database is built on PostgreSQL using Supabase and managed with Prisma ORM.

**Database Provider:** PostgreSQL (Supabase)  
**ORM:** Prisma v5.15.0  
**Location:** Supabase hosted database

---

## Table of Contents

1. [Database Enums](#database-enums)
2. [Database Tables](#database-tables)
3. [Table Relationships](#table-relationships)
4. [Field Types and Constraints](#field-types-and-constraints)
5. [Common Queries](#common-queries)

---

## Database Enums

### Severity

Defines the severity level of incidents and detection rules.

```
enum Severity {
  LOW       - Low priority, minor security event
  MEDIUM    - Medium priority, moderate security concern
  HIGH      - High priority, significant security threat
  CRITICAL  - Critical priority, immediate action required
}
```

### IncidentStatus

Defines the current status of a security incident.

```
enum IncidentStatus {
  NEW              - Newly created incident, not yet reviewed
  INVESTIGATING    - Incident is being actively investigated
  RESOLVED         - Incident has been resolved
  FALSE_POSITIVE   - Incident was determined to be a false alarm
}
```

---

## Database Tables

### 1. User Table

Stores user account information and authentication details.

**Table Name:** `User`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | Integer | PRIMARY KEY, Auto Increment | Unique user identifier |
| `email` | String | UNIQUE, NOT NULL | User's email address (login credential) |
| `password` | String | NOT NULL | Hashed password for authentication |
| `name` | String | NULLABLE | User's full name |
| `role` | String | DEFAULT: "ANALYST" | User's role in the system |
| `createdAt` | DateTime | DEFAULT: now() | Account creation timestamp |

**Relationships:**
- One User → Many Incidents (1:N)

**Indexes:**
- `id` (Primary Key)
- `email` (Unique)

**Example Records:**
```json
{
  "id": 1,
  "email": "analyst@company.com",
  "password": "$2b$10$...",
  "name": "John Analyst",
  "role": "ANALYST",
  "createdAt": "2026-06-21T10:30:00Z"
}
```

---

### 2. Incident Table

Stores information about security incidents detected in the system.

**Table Name:** `Incident`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | Integer | PRIMARY KEY, Auto Increment | Unique incident identifier |
| `title` | String | NOT NULL | Brief title/summary of incident |
| `description` | String | NULLABLE | Detailed description of the incident |
| `status` | IncidentStatus Enum | DEFAULT: NEW | Current status of the incident |
| `severity` | Severity Enum | DEFAULT: MEDIUM | Severity level of the incident |
| `sourceIp` | String | NULLABLE | Source IP address of the threat |
| `destIp` | String | NULLABLE | Destination IP address affected |
| `userId` | Integer | FOREIGN KEY, NULLABLE | ID of assigned analyst |
| `createdAt` | DateTime | DEFAULT: now() | Incident creation timestamp |
| `updatedAt` | DateTime | AUTO UPDATE | Last update timestamp |

**Relationships:**
- Many Incidents → One User (N:1)
- One Incident → Many SecurityLogs (1:N)

**Indexes:**
- `id` (Primary Key)
- `userId` (Foreign Key)
- `status` (for filtering)
- `severity` (for sorting)

**Example Records:**
```json
{
  "id": 1,
  "title": "Brute Force Attack Detected",
  "description": "Multiple failed login attempts detected on server",
  "status": "INVESTIGATING",
  "severity": "HIGH",
  "sourceIp": "192.168.1.100",
  "destIp": "10.0.0.5",
  "userId": 1,
  "createdAt": "2026-06-21T11:00:00Z",
  "updatedAt": "2026-06-21T11:15:00Z"
}
```

---

### 3. SecurityLog Table

Stores individual security logs and events from various sources.

**Table Name:** `SecurityLog`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | Integer | PRIMARY KEY, Auto Increment | Unique log identifier |
| `timestamp` | DateTime | DEFAULT: now() | When the security event occurred |
| `source` | String | NOT NULL | Source of the log (e.g., firewall, IDS, app) |
| `logLevel` | String | NOT NULL | Log severity level (DEBUG, INFO, WARN, ERROR) |
| `message` | String | NOT NULL | Log message content |
| `details` | Json | NULLABLE | Additional structured data (JSON) |
| `incidentId` | Integer | FOREIGN KEY, NULLABLE | Associated incident ID |

**Relationships:**
- Many SecurityLogs → One Incident (N:1)

**Indexes:**
- `id` (Primary Key)
- `incidentId` (Foreign Key)
- `timestamp` (for time range queries)
- `source` (for filtering by source)

**Example Records:**
```json
{
  "id": 1,
  "timestamp": "2026-06-21T10:45:23Z",
  "source": "firewall",
  "logLevel": "ERROR",
  "message": "Port scan detected from external IP",
  "details": {
    "protocol": "TCP",
    "ports_scanned": [22, 80, 443, 3306],
    "scan_duration_seconds": 15
  },
  "incidentId": 1
}
```

---

### 4. DetectionRule Table

Stores security detection rules and patterns used by the detection agent.

**Table Name:** `DetectionRule`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | Integer | PRIMARY KEY, Auto Increment | Unique rule identifier |
| `name` | String | NOT NULL | Name of the detection rule |
| `description` | String | NULLABLE | Detailed description of what rule detects |
| `pattern` | String | NOT NULL | Pattern/regex used for detection |
| `severity` | Severity Enum | DEFAULT: MEDIUM | Default severity if rule triggers |
| `isActive` | Boolean | DEFAULT: true | Whether rule is enabled/active |
| `createdAt` | DateTime | DEFAULT: now() | Rule creation timestamp |

**Relationships:**
- No direct relationships (used as reference by detection agents)

**Indexes:**
- `id` (Primary Key)
- `isActive` (for filtering active rules)
- `name` (for quick lookup)

**Example Records:**
```json
{
  "id": 1,
  "name": "SQL Injection Attack",
  "description": "Detects common SQL injection patterns in HTTP requests",
  "pattern": "(?i)(union.*select|select.*from|';.*drop|exec\\()",
  "severity": "CRITICAL",
  "isActive": true,
  "createdAt": "2026-06-21T08:00:00Z"
}
```

---

## Table Relationships

### Entity Relationship Diagram

```
┌─────────────┐
│    User     │
├─────────────┤
│ id (PK)     │
│ email       │
│ password    │
│ name        │
│ role        │
│ createdAt   │
└──────┬──────┘
       │
       │ 1:N
       │
       ├────────────────────────┐
       │                        │
       ▼                        │
┌─────────────────┐             │
│   Incident      │             │
├─────────────────┤             │
│ id (PK)         │             │
│ title           │             │
│ description     │             │
│ status          │             │
│ severity        │             │
│ sourceIp        │             │
│ destIp          │             │
│ userId (FK)     │◄────────────┘
│ createdAt       │
│ updatedAt       │
└──────┬──────────┘
       │
       │ 1:N
       │
       ▼
┌──────────────────┐
│  SecurityLog     │
├──────────────────┤
│ id (PK)          │
│ timestamp        │
│ source           │
│ logLevel         │
│ message          │
│ details (JSON)   │
│ incidentId (FK)  │
└──────────────────┘

┌──────────────────┐
│ DetectionRule    │
├──────────────────┤
│ id (PK)          │
│ name             │
│ description      │
│ pattern          │
│ severity         │
│ isActive         │
│ createdAt        │
└──────────────────┘
```

### Relationship Types

| From | To | Type | Description |
|------|----|----|-------------|
| User | Incident | 1:N | One user can own/investigate multiple incidents |
| Incident | SecurityLog | 1:N | One incident can have multiple security logs |
| DetectionRule | - | - | Standalone reference table (no foreign keys) |

---

## Field Types and Constraints

### Data Types Used

| Type | Usage | Examples |
|------|-------|----------|
| `Int` | IDs, counts | User ID, Incident ID |
| `String` | Text data | Email, passwords, messages |
| `DateTime` | Timestamps | createdAt, updatedAt, timestamp |
| `Boolean` | Flags | isActive |
| `Json` | Structured data | SecurityLog details |
| `Enum` | Fixed values | Severity, IncidentStatus |

### Constraints Applied

| Constraint | Purpose | Example |
|-----------|---------|---------|
| PRIMARY KEY | Unique identifier | User.id |
| FOREIGN KEY | Referential integrity | Incident.userId → User.id |
| UNIQUE | Prevent duplicates | User.email |
| NOT NULL | Mandatory fields | User.email, Incident.title |
| DEFAULT | Auto-generated values | User.role = "ANALYST" |
| AUTO INCREMENT | Sequential IDs | All id fields |
| AUTO UPDATE | Track changes | Incident.updatedAt |

---

## Common Queries

### User Queries

**Find analyst by email:**
```sql
SELECT * FROM "User" WHERE email = 'analyst@company.com';
```

**Get all active analysts:**
```sql
SELECT * FROM "User" WHERE role = 'ANALYST' ORDER BY createdAt DESC;
```

**Count users by role:**
```sql
SELECT role, COUNT(*) as count FROM "User" GROUP BY role;
```

### Incident Queries

**Get all critical incidents:**
```sql
SELECT * FROM "Incident" WHERE severity = 'CRITICAL' ORDER BY createdAt DESC;
```

**Get incidents assigned to a user:**
```sql
SELECT * FROM "Incident" WHERE "userId" = 1 AND status != 'RESOLVED';
```

**Get incidents by status:**
```sql
SELECT status, COUNT(*) as count FROM "Incident" GROUP BY status;
```

**Get unresolved incidents with logs:**
```sql
SELECT i.*, COUNT(sl.id) as log_count 
FROM "Incident" i
LEFT JOIN "SecurityLog" sl ON i.id = sl."incidentId"
WHERE i.status IN ('NEW', 'INVESTIGATING')
GROUP BY i.id
ORDER BY i.severity DESC;
```

### SecurityLog Queries

**Get logs for an incident:**
```sql
SELECT * FROM "SecurityLog" 
WHERE "incidentId" = 1 
ORDER BY timestamp DESC;
```

**Get logs from a specific source:**
```sql
SELECT * FROM "SecurityLog" 
WHERE source = 'firewall' 
ORDER BY timestamp DESC 
LIMIT 100;
```

**Get error logs in last 24 hours:**
```sql
SELECT * FROM "SecurityLog" 
WHERE "logLevel" = 'ERROR' 
AND timestamp > NOW() - INTERVAL '24 hours'
ORDER BY timestamp DESC;
```

### DetectionRule Queries

**Get all active rules:**
```sql
SELECT * FROM "DetectionRule" WHERE "isActive" = true;
```

**Get rules by severity:**
```sql
SELECT * FROM "DetectionRule" 
WHERE severity = 'CRITICAL' AND "isActive" = true;
```

---

## Database Maintenance

### Backup Strategy

- Supabase provides automatic daily backups
- Manual backups can be initiated from Supabase dashboard
- Backup retention: 7 days minimum

### Performance Optimization

**Recommended Indexes:**
```sql
CREATE INDEX idx_incident_status ON "Incident"(status);
CREATE INDEX idx_incident_severity ON "Incident"(severity);
CREATE INDEX idx_securitylog_timestamp ON "SecurityLog"(timestamp);
CREATE INDEX idx_securitylog_source ON "SecurityLog"(source);
CREATE INDEX idx_user_email ON "User"(email);
CREATE INDEX idx_detectionrule_active ON "DetectionRule"("isActive");
```

### Data Retention

- **Incidents:** Keep for 1 year (archive old ones)
- **SecurityLogs:** Keep for 90 days (archive to data warehouse)
- **Users:** Keep indefinitely (soft delete if needed)
- **DetectionRules:** Keep indefinitely

---

## Development Usage

### Access Database in Code

**Using Prisma Client:**

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Create incident
const incident = await prisma.incident.create({
  data: {
    title: 'Suspicious Activity',
    severity: 'HIGH',
    sourceIp: '192.168.1.100',
  },
});

// Get incidents with logs
const incidents = await prisma.incident.findMany({
  include: {
    logs: true,
    user: true,
  },
  where: { severity: 'CRITICAL' },
});

// Update incident status
await prisma.incident.update({
  where: { id: 1 },
  data: { status: 'RESOLVED' },
});
```

### Migration Commands

```bash
# Create new migration
npm run prisma:migrate

# View database state
npx prisma db push

# Generate updated Prisma client
npm run prisma:generate

# Open Prisma Studio (interactive database browser)
npx prisma studio
```

---

## Security Considerations

1. **Passwords:** Always hash before storing (use bcrypt or similar)
2. **Sensitive Data:** JSON details field should not store passwords
3. **Access Control:** Implement row-level security in application layer
4. **Audit Trail:** Consider adding audit logs for critical operations
5. **Data Sanitization:** Validate all input before storing in database

---

## Document Version

- **Version:** 1.0
- **Last Updated:** 2026-06-21
- **Database Version:** PostgreSQL (Supabase)
- **Prisma Version:** 5.15.0

---

## Contact & Support

For database schema changes or questions:
- Prisma Documentation: https://www.prisma.io/docs/
- Supabase Documentation: https://supabase.com/docs
- Schema Definition: [backend/prisma/schema.prisma](backend/prisma/schema.prisma)
