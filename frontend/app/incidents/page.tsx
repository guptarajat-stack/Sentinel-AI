'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getSocket, disconnectSocket, type RawAlert } from '../../lib/socket';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Incident {
  id: string;
  title: string;
  type: string;
  severity: string;
  confidence: string;
  asset: string;
  status: string;
  created: string;
  epoch: number;
  isLive?: boolean;
}

type SocketStatus = 'connecting' | 'live' | 'disconnected';

// ── Static seed data ──────────────────────────────────────────────────────────

const SEED_INCIDENTS: Incident[] = [
  { id: 'INC-81072', title: 'Brute Force Attack',      type: 'Brute Force',        severity: 'CRITICAL', confidence: '97%', asset: 'auth-srv-01',        status: 'Active',        created: '2026-06-15 13:00:05', epoch: 1781614805000 },
  { id: 'INC-74910', title: 'SQL Injection Payload',   type: 'SQL Injection',       severity: 'HIGH',     confidence: '94%', asset: 'web-gateway-db',     status: 'Investigating', created: '2026-06-15 12:45:12', epoch: 1781613912000 },
  { id: 'INC-38102', title: 'Gateway Port Scan',       type: 'Port Scan',           severity: 'MEDIUM',   confidence: '88%', asset: 'dmz-firewall-02',    status: 'Resolved',      created: '2026-06-15 11:20:00', epoch: 1781608800000 },
  { id: 'INC-29481', title: 'XSS Attempt via Portal',  type: 'XSS Attempt',         severity: 'LOW',      confidence: '76%', asset: 'portal-frontend',    status: 'Resolved',      created: '2026-06-14 18:10:00', epoch: 1781547000000 },
  { id: 'INC-19827', title: 'Credential Stuffing API', type: 'Credential Stuffing', severity: 'HIGH',     confidence: '91%', asset: 'identity-provider',  status: 'Active',        created: '2026-06-13 09:30:00', epoch: 1781428200000 },
  { id: 'INC-09283', title: 'Brute Force Admin SSH',   type: 'Brute Force',         severity: 'CRITICAL', confidence: '98%', asset: 'ssh-gateway-west',   status: 'Resolved',      created: '2026-06-12 15:40:00', epoch: 1781364600000 },
];

const RULE_TO_TYPE: Record<string, string> = {
  'Brute Force SSH':  'Brute Force',
  'SQL Injection WAF': 'SQL Injection',
  'Port Scan Detect': 'Port Scan',
};

// ── Alert → Incident mapper ───────────────────────────────────────────────────

function alertToIncident(alert: RawAlert): Incident {
  const id = `INC-${Math.floor(Math.random() * 90000 + 10000)}`;
  const now = new Date();
  const asset =
    alert.context?.ip ||
    alert.context?.client_ip ||
    alert.context?.src ||
    'unknown';

  return {
    id,
    title: alert.rule_name,
    type: RULE_TO_TYPE[alert.rule_name] ?? alert.rule_name,
    severity: alert.severity?.toUpperCase() ?? 'MEDIUM',
    confidence: '—',
    asset,
    status: 'Active',
    created: now.toISOString().replace('T', ' ').slice(0, 19),
    epoch: now.getTime(),
    isLive: true,
  };
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function IncidentsPage() {
  const router = useRouter();

  const [incidents, setIncidents] = useState<Incident[]>(SEED_INCIDENTS);
  const [socketStatus, setSocketStatus] = useState<SocketStatus>('connecting');
  const [liveCount, setLiveCount] = useState(0);
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [filterStatus, setFilterStatus]     = useState('ALL');
  const [filterType, setFilterType]         = useState('ALL');
  const [filterTime, setFilterTime]         = useState('ALL');

  // Track which incident IDs should show the NEW badge (cleared after 8 s)
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const newIdTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const markNew = useCallback((id: string) => {
    setNewIds(prev => new Set(prev).add(id));
    const t = setTimeout(() => {
      setNewIds(prev => { const s = new Set(prev); s.delete(id); return s; });
      newIdTimers.current.delete(id);
    }, 8000);
    newIdTimers.current.set(id, t);
  }, []);

  // ── Socket lifecycle ────────────────────────────────────────────────────────
  useEffect(() => {
    const socket = getSocket();

    const onConnect = () => setSocketStatus('live');
    const onDisconnect = () => setSocketStatus('disconnected');
    const onConnectError = () => setSocketStatus('disconnected');

    const onNewAlert = (alert: RawAlert) => {
      const inc = alertToIncident(alert);
      setIncidents(prev => [inc, ...prev]);
      setLiveCount(c => c + 1);
      markNew(inc.id);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);
    socket.on('new-alert', onNewAlert);

    // If already connected (singleton reuse), sync status immediately
    if (socket.connected) setSocketStatus('live');

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
      socket.off('new-alert', onNewAlert);
    };
  }, [markNew]);

  // Clear badge timers on unmount
  useEffect(() => {
    return () => { newIdTimers.current.forEach(clearTimeout); };
  }, []);

  // ── Filtering ───────────────────────────────────────────────────────────────
  const filteredIncidents = incidents.filter(inc => {
    if (filterSeverity !== 'ALL' && inc.severity !== filterSeverity) return false;
    if (filterStatus   !== 'ALL' && inc.status   !== filterStatus)   return false;
    if (filterType     !== 'ALL' && inc.type      !== filterType)     return false;
    if (filterTime === '24H') {
      if (inc.epoch < Date.now() - 24 * 60 * 60 * 1000) return false;
    } else if (filterTime === '7D') {
      if (inc.epoch < Date.now() - 7 * 24 * 60 * 60 * 1000) return false;
    }
    return true;
  });

  // ── Status badge config ─────────────────────────────────────────────────────
  const statusConfig: Record<SocketStatus, { color: string; label: string; pulse: boolean }> = {
    connecting:   { color: 'var(--accent-amber)', label: 'CONNECTING…', pulse: false },
    live:         { color: 'var(--accent-green)',  label: 'LIVE',        pulse: true  },
    disconnected: { color: 'var(--accent-red)',    label: 'OFFLINE',     pulse: false },
  };
  const sc = statusConfig[socketStatus];

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="page-wrapper animate-fade-in" style={{ paddingBottom: 40 }}>

      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="page-hero">
        <div>
          <div className="page-hero__eyebrow">● Case Management</div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Incidents Investigation Center
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 6 }}>
            Audit, triage, and execute playbook remediations on active network escalations
          </p>
        </div>
        <div className="page-hero__actions" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>

          {/* Socket status pill */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '6px 14px', borderRadius: 99,
            background: 'var(--bg-elevated)',
            border: `1px solid ${sc.color}33`,
            fontSize: '0.75rem', fontWeight: 700, color: sc.color,
            letterSpacing: '0.06em',
          }}>
            <span style={{
              width: 7, height: 7, borderRadius: '50%',
              background: sc.color,
              boxShadow: sc.pulse ? `0 0 0 0 ${sc.color}` : 'none',
              animation: sc.pulse ? 'pulse-ring 1.6s ease-out infinite' : 'none',
            }} />
            {sc.label}
            {liveCount > 0 && (
              <span style={{
                marginLeft: 4, background: sc.color + '22',
                padding: '1px 6px', borderRadius: 6,
                color: sc.color,
              }}>
                +{liveCount}
              </span>
            )}
          </div>

          <button className="btn btn--ghost">Export Timeline</button>
          <button className="btn btn--primary">Create Response Playbook</button>
        </div>
      </div>

      {/* ── Summary strip ────────────────────────────────────────────────── */}
      <div className="summary-strip">
        <div className="summary-chip">
          <div className="summary-chip__label">Active Cases</div>
          <div className="summary-chip__value">
            {incidents.filter(i => i.status === 'Active').length} active
          </div>
        </div>
        <div className="summary-chip">
          <div className="summary-chip__label">Live Alerts This Session</div>
          <div className="summary-chip__value" style={{ color: liveCount > 0 ? 'var(--accent-green)' : undefined }}>
            {liveCount}
          </div>
        </div>
        <div className="summary-chip">
          <div className="summary-chip__label">Resolved This Week</div>
          <div className="summary-chip__value">18</div>
        </div>
      </div>

      {/* ── Filter Controls ───────────────────────────────────────────────── */}
      <div className="card" style={{
        padding: '16px 20px', display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center',
        background: 'linear-gradient(135deg, rgba(15,23,42,0.97) 0%, rgba(11,18,31,0.97) 100%)',
      }}>
        {[
          { label: 'Severity', value: filterSeverity, set: setFilterSeverity,
            options: [['ALL','All Severities'],['CRITICAL','Critical'],['HIGH','High'],['MEDIUM','Medium'],['LOW','Low']] },
          { label: 'Status',   value: filterStatus,   set: setFilterStatus,
            options: [['ALL','All Statuses'],['Active','Active'],['Investigating','Investigating'],['Resolved','Resolved']] },
          { label: 'Attack Type', value: filterType,  set: setFilterType,
            options: [['ALL','All Types'],['Brute Force','Brute Force'],['SQL Injection','SQL Injection'],['Port Scan','Port Scan'],['XSS Attempt','XSS Attempt'],['Credential Stuffing','Credential Stuffing']] },
          { label: 'Time Range',  value: filterTime,  set: setFilterTime,
            options: [['ALL','All Time'],['24H','Last 24 Hours'],['7D','Last 7 Days']] },
        ].map(({ label, value, set, options }) => (
          <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              {label}
            </span>
            <select
              value={value}
              onChange={e => set(e.target.value)}
              style={{
                background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
                color: 'var(--text-primary)', padding: '6px 12px',
                borderRadius: 'var(--radius-md)', fontSize: '0.82rem', cursor: 'pointer', outline: 'none',
              }}
            >
              {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
        ))}
        <div style={{ marginLeft: 'auto', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
          Showing <strong>{filteredIncidents.length}</strong> of {incidents.length} cases
        </div>
      </div>

      {/* ── Incident Table ────────────────────────────────────────────────── */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.01)', borderBottom: '1px solid var(--border-default)' }}>
              {['Incident ID', 'Type', 'Severity', 'Confidence', 'Affected Asset', 'Status', 'Created At'].map(h => (
                <th key={h} style={{
                  padding: '14px 20px', fontWeight: 600, color: 'var(--text-muted)',
                  fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em',
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredIncidents.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: 40, color: 'var(--text-muted)', textAlign: 'center' }}>
                  No incidents match the selected filter criteria.
                </td>
              </tr>
            ) : (
              filteredIncidents.map(inc => {
                const sev = inc.severity.toLowerCase() as 'critical' | 'high' | 'medium' | 'low';
                const isNew = newIds.has(inc.id);

                return (
                  <tr
                    key={inc.id}
                    onClick={() => router.push(`/incidents/${inc.id}`)}
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                      transition: 'background 0.12s',
                      background: isNew ? 'rgba(16,185,129,0.04)' : 'transparent',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                    onMouseLeave={e => (e.currentTarget.style.background = isNew ? 'rgba(16,185,129,0.04)' : 'transparent')}
                  >
                    {/* ID + optional NEW badge */}
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: 'var(--accent-blue)' }}>
                          {inc.id}
                        </span>
                        {isNew && (
                          <span style={{
                            fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.08em',
                            color: 'var(--accent-green)', background: 'rgba(16,185,129,0.12)',
                            border: '1px solid rgba(16,185,129,0.3)',
                            padding: '1px 6px', borderRadius: 4,
                            animation: 'fadeIn 0.3s ease',
                          }}>
                            LIVE
                          </span>
                        )}
                      </div>
                    </td>

                    <td style={{ padding: '16px 20px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {inc.title}
                    </td>

                    <td style={{ padding: '16px 20px' }}>
                      <span className={`badge badge--${sev}`}>{inc.severity}</span>
                    </td>

                    <td style={{ padding: '16px 20px', fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: 'var(--text-secondary)' }}>
                      {inc.confidence}
                    </td>

                    <td style={{ padding: '16px 20px', fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-primary)' }}>
                      {inc.asset}
                    </td>

                    <td style={{ padding: '16px 20px' }}>
                      <span style={{
                        fontSize: '0.8rem', fontWeight: 700,
                        color: inc.status === 'Resolved'     ? 'var(--accent-green)'
                             : inc.status === 'Investigating' ? 'var(--accent-amber)'
                             : 'var(--accent-red)',
                      }}>
                        {inc.status.toUpperCase()}
                      </span>
                    </td>

                    <td style={{ padding: '16px 20px', color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>
                      {inc.created}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Pulse animation keyframe (scoped to this page) ────────────────── */}
      <style>{`
        @keyframes pulse-ring {
          0%   { box-shadow: 0 0 0 0 var(--accent-green); }
          70%  { box-shadow: 0 0 0 6px transparent; }
          100% { box-shadow: 0 0 0 0 transparent; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
