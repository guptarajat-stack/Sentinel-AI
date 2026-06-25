import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';

import { initSocket, emit } from './services/socketService';
import { prisma } from './lib/prisma';
import { Severity, IncidentStatus } from '@prisma/client';

import authRoutes     from './routes/authRoutes';
import incidentRoutes from './routes/incidentRoutes';
import logRoutes      from './routes/logRoutes';

dotenv.config();

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST', 'PATCH'] },
});

const PORT = process.env.PORT || 5000;

// ── Middleware ────────────────────────────────────────────────────────────────

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// ── Socket.io ─────────────────────────────────────────────────────────────────

initSocket(io);

io.on('connection', socket => {
  console.log(`[Socket] connected: ${socket.id}`);
  socket.on('disconnect', () => console.log(`[Socket] disconnected: ${socket.id}`));
});

// ── Routes ────────────────────────────────────────────────────────────────────

app.use('/api/auth',      authRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/logs',      logRoutes);

// ── Health ────────────────────────────────────────────────────────────────────

app.get('/health', (_req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

// ── Agent alert hook ──────────────────────────────────────────────────────────
// Receives alerts from the Python orchestrator, persists them, and broadcasts
// to all connected dashboard clients via Socket.io.

const VALID_SEVERITIES = Object.values(Severity);

function mapSeverity(raw: string): Severity {
  const upper = raw?.toUpperCase() as Severity;
  return VALID_SEVERITIES.includes(upper) ? upper : Severity.MEDIUM;
}

app.post('/api/agents/alert', async (req, res) => {
  const alert = req.body;
  console.log(`[Backend] <<< Agent alert: ${alert.rule_name} | ${alert.severity}`);

  // 1. Persist incident to database
  let savedIncident = null;
  try {
    const sourceIp =
      alert.context?.ip ||
      alert.context?.client_ip ||
      alert.context?.src ||
      null;

    savedIncident = await prisma.incident.create({
      data: {
        title:       alert.rule_name || 'Unknown Alert',
        description: alert.raw_log  || '',
        severity:    mapSeverity(alert.severity),
        sourceIp,
        status:      IncidentStatus.NEW,
      },
    });

    // Also store the raw log line
    if (alert.raw_log) {
      await prisma.securityLog.create({
        data: {
          source:     alert.rule_name || 'detection-agent',
          logLevel:   mapSeverity(alert.severity),
          message:    alert.raw_log,
          details:    alert.context || {},
          incidentId: savedIncident.id,
        },
      });
    }

    console.log(`[Backend] Incident saved: ID=${savedIncident.id}`);
  } catch (dbErr) {
    console.error('[Backend] DB save failed (broadcasting anyway):', dbErr);
  }

  // 2. Broadcast to frontend — include DB id if available
  const payload = {
    ...alert,
    db_id: savedIncident?.id ?? null,
  };
  emit('new-alert', payload);

  res.status(201).json({ status: 'ACK', db_id: savedIncident?.id ?? null });
});

// ── Start ─────────────────────────────────────────────────────────────────────

server.listen(PORT, () => {
  console.log(`[Server] SOC Backend running on port ${PORT}`);
});
