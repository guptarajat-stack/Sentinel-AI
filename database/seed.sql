-- Create enum types
CREATE TYPE "Severity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE "IncidentStatus" AS ENUM ('NEW', 'INVESTIGATING', 'RESOLVED', 'FALSE_POSITIVE');

-- Seed Users Table
CREATE TABLE IF NOT EXISTS "User" (
    "id" SERIAL PRIMARY KEY,
    "email" VARCHAR(255) UNIQUE NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255),
    "role" VARCHAR(50) DEFAULT 'ANALYST',
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed Incidents Table
CREATE TABLE IF NOT EXISTS "Incident" (
    "id" SERIAL PRIMARY KEY,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "status" "IncidentStatus" DEFAULT 'NEW',
    "severity" "Severity" DEFAULT 'MEDIUM',
    "sourceIp" VARCHAR(45),
    "destIp" VARCHAR(45),
    "userId" INTEGER REFERENCES "User"("id"),
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed Logs Table
CREATE TABLE IF NOT EXISTS "SecurityLog" (
    "id" SERIAL PRIMARY KEY,
    "timestamp" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "source" VARCHAR(100) NOT NULL,
    "logLevel" VARCHAR(50) NOT NULL,
    "message" TEXT NOT NULL,
    "details" JSONB,
    "incidentId" INTEGER REFERENCES "Incident"("id")
);

-- Seed Detection Rules Table
CREATE TABLE IF NOT EXISTS "DetectionRule" (
    "id" SERIAL PRIMARY KEY,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "pattern" TEXT NOT NULL,
    "severity" "Severity" DEFAULT 'MEDIUM',
    "isActive" BOOLEAN DEFAULT TRUE,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Initial Mock Data
INSERT INTO "User" (email, password, name, role) VALUES
('admin@soc.local', '$2b$10$xyz...', 'SOC Admin', 'ADMIN'),
('analyst@soc.local', '$2b$10$xyz...', 'John Doe', 'ANALYST');

INSERT INTO "DetectionRule" (name, description, pattern, severity) VALUES
('Brute Force SSH', 'Detects multiple failed SSH logins from single IP', 'Failed password for .* from (?P<ip>\S+) port \d+ ssh2', 'HIGH'),
('SQL Injection WAF', 'Detects common SQL syntax in web requests', '(?i)(select|union|insert|update|delete|drop).*from', 'HIGH'),
('Port Scan Detect', 'Detects broad TCP connect events from same IP', 'Connection reset by peer.*Port scan detected', 'MEDIUM');
