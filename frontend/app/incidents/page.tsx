'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const INITIAL_INCIDENTS = [
  {
    id: 'INC-81072',
    title: 'Brute Force Attack',
    type: 'Brute Force',
    severity: 'CRITICAL',
    confidence: '97%',
    asset: 'auth-srv-01',
    status: 'Active',
    created: '2026-06-15 13:00:05',
    epoch: 1781614805000 // June 15, 2026 13:00
  },
  {
    id: 'INC-74910',
    title: 'SQL Injection Payload',
    type: 'SQL Injection',
    severity: 'HIGH',
    confidence: '94%',
    asset: 'web-gateway-db',
    status: 'Investigating',
    created: '2026-06-15 12:45:12',
    epoch: 1781613912000 // June 15, 2026 12:45
  },
  {
    id: 'INC-38102',
    title: 'Gateway Port Scan',
    type: 'Port Scan',
    severity: 'MEDIUM',
    confidence: '88%',
    asset: 'dmz-firewall-02',
    status: 'Resolved',
    created: '2026-06-15 11:20:00',
    epoch: 1781608800000 // June 15, 2026 11:20
  },
  {
    id: 'INC-29481',
    title: 'XSS Attempt via Portal',
    type: 'XSS Attempt',
    severity: 'LOW',
    confidence: '76%',
    asset: 'portal-frontend',
    status: 'Resolved',
    created: '2026-06-14 18:10:00',
    epoch: 1781547000000 // June 14, 2026 18:10
  },
  {
    id: 'INC-19827',
    title: 'Credential Stuffing API',
    type: 'Credential Stuffing',
    severity: 'HIGH',
    confidence: '91%',
    asset: 'identity-provider',
    status: 'Active',
    created: '2026-06-13 09:30:00',
    epoch: 1781428200000 // June 13, 2026 09:30
  },
  {
    id: 'INC-09283',
    title: 'Brute Force Admin SSH',
    type: 'Brute Force',
    severity: 'CRITICAL',
    confidence: '98%',
    asset: 'ssh-gateway-west',
    status: 'Resolved',
    created: '2026-06-12 15:40:00',
    epoch: 1781364600000 // June 12, 2026 15:40
  }
];

export default function IncidentsPage() {
  const router = useRouter();

  const [incidents] = useState(INITIAL_INCIDENTS);
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterType, setFilterType] = useState('ALL');
  const [filterTime, setFilterTime] = useState('ALL');

  // Filtering Logic
  const filteredIncidents = incidents.filter(inc => {
    // Severity Filter
    if (filterSeverity !== 'ALL' && inc.severity !== filterSeverity) return false;

    // Status Filter
    if (filterStatus !== 'ALL' && inc.status !== filterStatus) return false;

    // Attack Type Filter
    if (filterType !== 'ALL' && inc.type !== filterType) return false;

    // Time Range Filter (Mocking threshold for current simulated time of June 15, 2026 15:00)
    if (filterTime === '24H') {
      const dayAgoEpoch = 1781614800000 - 24 * 60 * 60 * 1000;
      if (inc.epoch < dayAgoEpoch) return false;
    } else if (filterTime === '7D') {
      const weekAgoEpoch = 1781614800000 - 7 * 24 * 60 * 60 * 1000;
      if (inc.epoch < weekAgoEpoch) return false;
    }

    return true;
  });

  return (
    <div className="page-wrapper animate-fade-in" style={{ paddingBottom: '40px' }}>
      
      {/* ── Page Header ── */}
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
        <div className="page-hero__actions">
          <button className="btn btn--ghost">Export Timeline</button>
          <button className="btn btn--primary">Create Response Playbook</button>
        </div>
      </div>

      <div className="summary-strip">
        <div className="summary-chip">
          <div className="summary-chip__label">Active Cases</div>
          <div className="summary-chip__value">2 critical</div>
        </div>
        <div className="summary-chip">
          <div className="summary-chip__label">Avg Confidence</div>
          <div className="summary-chip__value">91%</div>
        </div>
        <div className="summary-chip">
          <div className="summary-chip__label">Resolved This Week</div>
          <div className="summary-chip__value">18</div>
        </div>
      </div>

      {/* ── Filter Controls ── */}
      <div className="card" style={{ padding: '16px 20px', display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.97) 0%, rgba(11, 18, 31, 0.97) 100%)' }}>
        
        {/* Severity Filter */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Severity</span>
          <select 
            value={filterSeverity} 
            onChange={(e) => setFilterSeverity(e.target.value)}
            style={{
              background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
              color: 'var(--text-primary)', padding: '6px 12px', borderRadius: 'var(--radius-md)', fontSize: '0.82rem', cursor: 'pointer', outline: 'none'
            }}
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>

        {/* Status Filter */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Status</span>
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{
              background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
              color: 'var(--text-primary)', padding: '6px 12px', borderRadius: 'var(--radius-md)', fontSize: '0.82rem', cursor: 'pointer', outline: 'none'
            }}
          >
            <option value="ALL">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Investigating">Investigating</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>

        {/* Attack Type Filter */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Attack Type</span>
          <select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value)}
            style={{
              background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
              color: 'var(--text-primary)', padding: '6px 12px', borderRadius: 'var(--radius-md)', fontSize: '0.82rem', cursor: 'pointer', outline: 'none'
            }}
          >
            <option value="ALL">All Types</option>
            <option value="Brute Force">Brute Force</option>
            <option value="SQL Injection">SQL Injection</option>
            <option value="Port Scan">Port Scan</option>
            <option value="XSS Attempt">XSS Attempt</option>
            <option value="Credential Stuffing">Credential Stuffing</option>
          </select>
        </div>

        {/* Time Range Filter */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Time Range</span>
          <select 
            value={filterTime} 
            onChange={(e) => setFilterTime(e.target.value)}
            style={{
              background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
              color: 'var(--text-primary)', padding: '6px 12px', borderRadius: 'var(--radius-md)', fontSize: '0.82rem', cursor: 'pointer', outline: 'none'
            }}
          >
            <option value="ALL">All Time</option>
            <option value="24H">Last 24 Hours</option>
            <option value="7D">Last 7 Days</option>
          </select>
        </div>

        <div style={{ marginLeft: 'auto', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
          Showing <strong>{filteredIncidents.length}</strong> of {incidents.length} cases
        </div>
      </div>

      {/* ── Table List ── */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.01)', borderBottom: '1px solid var(--border-default)' }}>
              {['Incident ID', 'Type', 'Severity', 'Confidence', 'Affected Asset', 'Status', 'Created At'].map(h => (
                <th key={h} style={{ padding: '14px 20px', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredIncidents.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '40px', color: 'var(--text-muted)', textAlign: 'center' }}>
                  No incidents match the selected filter criteria.
                </td>
              </tr>
            ) : (
              filteredIncidents.map(inc => {
                const sev = inc.severity.toLowerCase() as 'critical' | 'high' | 'medium' | 'low';
                return (
                  <tr 
                    key={inc.id} 
                    onClick={() => router.push(`/incidents/${inc.id}`)}
                    style={{ borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer', transition: 'background 0.12s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '16px 20px', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: 'var(--accent-blue)' }}>{inc.id}</td>
                    <td style={{ padding: '16px 20px', fontWeight: 600, color: 'var(--text-primary)' }}>{inc.title}</td>
                    <td style={{ padding: '16px 20px' }}>
                      <span className={`badge badge--${sev}`}>
                        {inc.severity}
                      </span>
                    </td>
                    <td style={{ padding: '16px 20px', fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: 'var(--text-secondary)' }}>{inc.confidence}</td>
                    <td style={{ padding: '16px 20px', fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-primary)' }}>{inc.asset}</td>
                    <td style={{ padding: '16px 20px' }}>
                      <span style={{ 
                        fontSize: '0.8rem', 
                        fontWeight: 700, 
                        color: inc.status === 'Resolved' ? 'var(--accent-green)' : inc.status === 'Investigating' ? 'var(--accent-amber)' : 'var(--accent-red)'
                      }}>
                        {inc.status.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '16px 20px', color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>{inc.created}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
