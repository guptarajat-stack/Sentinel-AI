-- CreateEnum
CREATE TYPE "Severity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "IncidentStatus" AS ENUM ('NEW', 'INVESTIGATING', 'RESOLVED', 'FALSE_POSITIVE');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "role" TEXT NOT NULL DEFAULT 'ANALYST',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Incident" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "IncidentStatus" NOT NULL DEFAULT 'NEW',
    "severity" "Severity" NOT NULL DEFAULT 'MEDIUM',
    "sourceIp" TEXT,
    "destIp" TEXT,
    "userId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Incident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecurityLog" (
    "id" SERIAL NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" TEXT NOT NULL,
    "logLevel" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "details" JSONB,
    "incidentId" INTEGER,

    CONSTRAINT "SecurityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DetectionRule" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "pattern" TEXT NOT NULL,
    "severity" "Severity" NOT NULL DEFAULT 'MEDIUM',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DetectionRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityLog" ADD CONSTRAINT "SecurityLog_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE SET NULL ON UPDATE CASCADE;
