import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

// ── GET /api/logs ─────────────────────────────────────────────────────────────

export const getLogs = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const {
      source,
      logLevel,
      incidentId,
      search,
      page  = '1',
      limit = '50',
    } = req.query as Record<string, string>;

    const pageNum  = Math.max(1, parseInt(page));
    const limitNum = Math.min(200, Math.max(1, parseInt(limit)));
    const skip     = (pageNum - 1) * limitNum;

    const where: Record<string, unknown> = {};
    if (source)     where.source   = { contains: source,   mode: 'insensitive' };
    if (logLevel)   where.logLevel = logLevel.toUpperCase();
    if (incidentId) where.incidentId = parseInt(incidentId);
    if (search) {
      where.message = { contains: search, mode: 'insensitive' };
    }

    const [logs, total] = await Promise.all([
      prisma.securityLog.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { timestamp: 'desc' },
        include: {
          incident: { select: { id: true, title: true, severity: true } },
        },
      }),
      prisma.securityLog.count({ where }),
    ]);

    res.json({
      data: logs,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('[logController] getLogs error:', error);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
};

// ── POST /api/logs ────────────────────────────────────────────────────────────

export const createLog = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { source, logLevel, message, details, incidentId } = req.body;

    if (!source || !message) {
      res.status(400).json({ error: 'source and message are required' });
      return;
    }

    const log = await prisma.securityLog.create({
      data: {
        source,
        logLevel: logLevel?.toUpperCase() || 'INFO',
        message,
        details:    details || {},
        incidentId: incidentId ? parseInt(incidentId) : undefined,
      },
    });

    res.status(201).json(log);
  } catch (error) {
    console.error('[logController] createLog error:', error);
    res.status(500).json({ error: 'Failed to create log' });
  }
};
