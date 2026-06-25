import { Response } from 'express';
import { Severity, IncidentStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';
import { emit } from '../services/socketService';

// ── Helpers ───────────────────────────────────────────────────────────────────

const VALID_SEVERITIES = Object.values(Severity);
const VALID_STATUSES   = Object.values(IncidentStatus);

function mapSeverity(raw: string): Severity {
  const upper = raw?.toUpperCase() as Severity;
  return VALID_SEVERITIES.includes(upper) ? upper : Severity.MEDIUM;
}

function mapStatus(raw: string): IncidentStatus {
  const upper = raw?.toUpperCase() as IncidentStatus;
  return VALID_STATUSES.includes(upper) ? upper : IncidentStatus.NEW;
}

// ── GET /api/incidents ────────────────────────────────────────────────────────

export const getIncidents = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const {
      severity,
      status,
      search,
      page  = '1',
      limit = '20',
    } = req.query as Record<string, string>;

    const pageNum  = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip     = (pageNum - 1) * limitNum;

    const where: Record<string, unknown> = {};
    if (severity && VALID_SEVERITIES.includes(severity.toUpperCase() as Severity)) {
      where.severity = severity.toUpperCase();
    }
    if (status && VALID_STATUSES.includes(status.toUpperCase() as IncidentStatus)) {
      where.status = status.toUpperCase();
    }
    if (search) {
      where.OR = [
        { title:       { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { sourceIp:    { contains: search } },
      ];
    }

    const [incidents, total] = await Promise.all([
      prisma.incident.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { name: true, email: true } },
          _count: { select: { logs: true } },
        },
      }),
      prisma.incident.count({ where }),
    ]);

    res.json({
      data: incidents,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('[incidentController] getIncidents error:', error);
    res.status(500).json({ error: 'Failed to fetch incidents' });
  }
};

// ── GET /api/incidents/stats ──────────────────────────────────────────────────

export const getIncidentStats = async (
  _req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const [bySeverity, byStatus, recentCount] = await Promise.all([
      prisma.incident.groupBy({
        by: ['severity'],
        _count: { severity: true },
      }),
      prisma.incident.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
      prisma.incident.count({
        where: {
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

    res.json({
      bySeverity: Object.fromEntries(
        bySeverity.map(r => [r.severity, r._count.severity])
      ),
      byStatus: Object.fromEntries(
        byStatus.map(r => [r.status, r._count.status])
      ),
      last24h: recentCount,
    });
  } catch (error) {
    console.error('[incidentController] getIncidentStats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
};

// ── GET /api/incidents/:id ────────────────────────────────────────────────────

export const getIncident = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) { res.status(400).json({ error: 'Invalid incident ID' }); return; }

    const incident = await prisma.incident.findUnique({
      where: { id },
      include: {
        logs: { orderBy: { timestamp: 'desc' }, take: 100 },
        user: { select: { name: true, email: true } },
      },
    });

    if (!incident) { res.status(404).json({ error: 'Incident not found' }); return; }

    res.json(incident);
  } catch (error) {
    console.error('[incidentController] getIncident error:', error);
    res.status(500).json({ error: 'Failed to fetch incident' });
  }
};

// ── POST /api/incidents ───────────────────────────────────────────────────────
// Called by agents (no auth required) or via direct API

export const createIncident = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const {
      title, description, severity, sourceIp, destIp,
      // agent alert fields
      rule_name, raw_log, context,
    } = req.body;

    const resolvedTitle    = title || rule_name || 'Unknown Incident';
    const resolvedSeverity = mapSeverity(severity || 'MEDIUM');
    const resolvedSourceIp = sourceIp || context?.ip || context?.client_ip || context?.src;

    const incident = await prisma.incident.create({
      data: {
        title:       resolvedTitle,
        description: description || raw_log || '',
        severity:    resolvedSeverity,
        sourceIp:    resolvedSourceIp,
        destIp:      destIp,
        status:      IncidentStatus.NEW,
      },
    });

    // Create the originating log entry if raw_log was supplied
    if (raw_log) {
      await prisma.securityLog.create({
        data: {
          source:     rule_name || 'detection-agent',
          logLevel:   resolvedSeverity,
          message:    raw_log,
          details:    context || {},
          incidentId: incident.id,
        },
      });
    }

    // Notify all connected dashboard clients
    emit('incident-created', incident);

    res.status(201).json(incident);
  } catch (error) {
    console.error('[incidentController] createIncident error:', error);
    res.status(500).json({ error: 'Failed to create incident' });
  }
};

// ── PATCH /api/incidents/:id ──────────────────────────────────────────────────

export const updateIncident = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) { res.status(400).json({ error: 'Invalid incident ID' }); return; }

    const { status, userId } = req.body;

    const data: Record<string, unknown> = {};
    if (status) data.status = mapStatus(status);
    if (userId) data.userId = parseInt(userId);

    const incident = await prisma.incident.update({
      where: { id },
      data,
    });

    emit('incident-updated', incident);

    res.json(incident);
  } catch (error) {
    console.error('[incidentController] updateIncident error:', error);
    res.status(500).json({ error: 'Failed to update incident' });
  }
};
