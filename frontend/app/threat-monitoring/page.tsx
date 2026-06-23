'use client';

import { useState, useEffect, useRef } from 'react';
import { getSocket, type RawAlert } from '../../lib/socket';
import Link from 'next/link';

// Mock logs generator bank
const LOG_TEMPLATES = [
  { type: 'SSH_FAIL', msg: 'sshd[{pid}]: Failed password for invalid user admin from 192.168.1.254 port {port} ssh2', sev: 'High' },
  { type: 'SSH_FAIL', msg: 'sshd[{pid}]: Failed password for invalid user root from 192.168.1.254 port {port} ssh2', sev: 'High' },
  { type: 'SQLI_BLOCK', msg: 'nginx-waf[{pid}]: client 10.0.10.99 WAF Blocked SQL Injection attempt: GET /api/v1/auth/login?user=1%27%20OR%201%3D1%20--%20HTTP/1.1', sev: 'High' },
  { type: 'PORT_SCAN', msg: 'kernel: firewall-alert: IN=eth0 OUT= SRC=45.33.32.156 DST=10.0.0.1 PROTO=TCP SPT={port} DPT=80 SYN', sev: 'Medium' },
  { type: 'PORT_SCAN', msg: 'kernel: firewall-alert: IN=eth0 OUT= SRC=45.33.32.156 DST=10.0.0.1 PROTO=TCP SPT={port} DPT=443 SYN', sev: 'Medium' },
  { type: 'PORT_SCAN', msg: 'kernel: firewall-alert: IN=eth0 OUT= SRC=45.33.32.156 DST=10.0.0.1 PROTO=TCP SPT={port} DPT=8080 SYN', sev: 'Medium' },
  { type: 'SSH_SUCCESS', msg: 'sshd[{pid}]: Accepted password for root from 192.168.1.254 port {port} ssh2', sev: 'Critical' },
  { type: 'MITIGATION', msg: 'agent-orchestrator: Automated mitigation playbook triggered - SSH Quarantine applied for Host IP 192.168.1.254', sev: 'Critical' },
  { type: 'SYS_INFO', msg: 'auditd[{pid}]: User admin logged in successfully from 192.168.2.14', sev: 'Info' },
  { type: 'SYS_INFO', msg: 'dockerd[{pid}]: Container health check passed for microservice backend-api', sev: 'Info' }
];

function generateRandomLog(id: number) {
  const template = LOG_TEMPLATES[Math.floor(Math.random() * LOG_TEMPLATES.length)];
  const date = new Date();
  const timestamp = date.toISOString().split('T')[1].slice(0, 8);
  const pid = Math.floor(Math.random() * 8000) + 1000;
  const port = Math.floor(Math.random() * 28000) + 32000;

  const content = template.msg
    .replace('{pid}', pid.toString())
    .replace('{port}', port.toString());

  return {
    id,
    timestamp,
    content,
    sev: template.sev,
  };
}

export default function ThreatMonitoringPage() {
  const [isPlaying, setIsPlaying] = useState(true);
  const [logs, setLogs] = useState<{ id: number; timestamp: string; content: string; sev: string }[]>(() =>
    Array.from({ length: 15 }, (_, i) => generateRandomLog(i))
  );
  const [activeDetections, setActiveDetections] = useState([
    { id: 'INC-81072', title: 'Brute Force Attack',   type: 'SSH Brute Force', severity: 'HIGH',   confidence: '97%', status: 'Active',        time: 'Just Now' },
    { id: 'INC-74910', title: 'SQL Injection attempt', type: 'SQL Injection',   severity: 'HIGH',   confidence: '94%', status: 'Investigating', time: '8m ago'   },
    { id: 'INC-38102', title: 'Gateway Port Scan',    type: 'Port Scan',       severity: 'MEDIUM', confidence: '88%', status: 'Resolved',      time: '1h ago'   },
  ]);

  const terminalEndRef = useRef<HTMLDivElement>(null);
  const nextLogId = useRef(15);

  // Auto-scrolling terminal
  useEffect(() => {
    if (isPlaying && terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, isPlaying]);

  // Log ticking interval
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setLogs(prev => {
        const nextId = nextLogId.current++;
        const newLog = generateRandomLog(nextId);
        // Keep logs capped at 60 for performance
        return [...prev.slice(-60), newLog];
      });
    }, 1200);

    return () => clearInterval(interval);
  }, [isPlaying]);

  // Live alerts from agent pipeline via WebSocket
  useEffect(() => {
    const socket = getSocket();

    const onNewAlert = (alert: RawAlert) => {
      const id = `INC-${Math.floor(Math.random() * 90000 + 10000)}`;
      const typeMap: Record<string, string> = {
        'Brute Force SSH':   'SSH Brute Force',
        'SQL Injection WAF': 'SQL Injection',
        'Port Scan Detect':  'Port Scan',
      };
      const entry = {
        id,
        title: alert.rule_name,
        type: typeMap[alert.rule_name] ?? alert.rule_name,
        severity: alert.severity?.toUpperCase() ?? 'MEDIUM',
        confidence: '—',
        status: 'Active',
        time: 'Just Now',
      };
      setActiveDetections(prev => [entry, ...prev].slice(0, 10));

      // Also push a real log line into the terminal feed
      const now = new Date().toISOString().split('T')[1].slice(0, 8);
      const ip = alert.context?.ip || alert.context?.client_ip || '0.0.0.0';
      setLogs(prev => [...prev.slice(-59), {
        id: nextLogId.current++,
        timestamp: now,
        content: `[LIVE AGENT ALERT] ${alert.raw_log || alert.rule_name} — src=${ip}`,
        sev: alert.severity === 'CRITICAL' ? 'Critical' : alert.severity === 'HIGH' ? 'High' : 'Medium',
      }]);
    };

    socket.on('new-alert', onNewAlert);
    return () => { socket.off('new-alert', onNewAlert); };
  }, []);

  return (
    <div className="page-wrapper animate-fade-in" style={{ paddingBottom: '40px' }}>
      
      {/* ── Page Header ── */}
      <div className="page-hero">
        <div>
          <div className="page-hero__eyebrow">● Operations Room</div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Real-Time Threat Console
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 6 }}>
            System Event Log Monitor (SIEM Telemetry & WAF Engine)
          </p>
        </div>
        
        {/* Play/Pause control buttons */}
        <div className="page-hero__actions">
          <button 
            className={`btn ${isPlaying ? 'btn--ghost' : 'btn--primary'}`} 
            onClick={() => setIsPlaying(p => !p)}
            style={{ minWidth: 100 }}
          >
            {isPlaying ? '⏸️ Pause Stream' : '▶️ Resume Stream'}
          </button>
          <button className="btn btn--ghost" onClick={() => setLogs([])}>
            🗑️ Clear Console
          </button>
        </div>
      </div>

      {/* ── Main Operations Center Grid Layout ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1.5fr', gap: 16 }}>
        
        {/* Logs Stream (Terminal Style) */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '520px', overflow: 'hidden', background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.98) 0%, rgba(10, 18, 31, 0.98) 100%)' }}>
          <div className="card__header" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="mono" style={{ color: 'var(--accent-blue)', fontWeight: 700 }}>SPLUNK_STREAM_LOGS</span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Auto-updating live terminal</span>
            </div>
            {isPlaying && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-green)', boxShadow: '0 0 6px var(--accent-green)', animation: 'pulse-green 2s ease-in-out infinite' }} />
                <span style={{ fontSize: '0.7rem', color: 'var(--accent-green)', fontWeight: 600 }}>TICKING</span>
              </div>
            )}
          </div>

          <div style={{
            flex: 1,
            background: 'linear-gradient(180deg, #030712 0%, #050b17 100%)',
            padding: '16px',
            overflowY: 'auto',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '0.78rem',
            lineHeight: 1.5,
            color: '#c5d1e8',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            borderBottomLeftRadius: 'var(--radius-lg)',
            borderBottomRightRadius: 'var(--radius-lg)'
          }}>
            {logs.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '100px' }}>
                Console cleared. Awaiting network packets...
              </div>
            ) : (
              logs.map((log) => {
                let color = 'inherit';
                if (log.sev === 'Critical') color = 'var(--accent-red)';
                else if (log.sev === 'High') color = 'var(--accent-amber)';
                else if (log.sev === 'Medium') color = 'var(--accent-blue)';
                
                return (
                  <div key={log.id} style={{ display: 'flex', gap: 12, wordBreak: 'break-all' }}>
                    <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>[{log.timestamp}]</span>
                    <span style={{ color }}>{log.content}</span>
                  </div>
                );
              })
            )}
            <div ref={terminalEndRef} />
          </div>
        </div>

        {/* Right Side: Mini Map + Detection Feed */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Mini Threat Map */}
          <div className="card" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span className="card__title" style={{ fontSize: '0.85rem' }}>Active Threat Telemetry</span>
              <span className="badge badge--high" style={{ fontSize: '0.65rem' }}>Live Links</span>
            </div>
            
            <div style={{ 
              height: '140px', background: 'var(--bg-canvas)', borderRadius: 'var(--radius-md)', 
              border: '1px solid var(--border-subtle)', overflow: 'hidden', position: 'relative'
            }}>
              {/* Simplified world map vector */}
              <svg width="100%" height="100%" viewBox="0 0 300 150">
                <g fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.04)" strokeWidth="0.8">
                  {/* Continental paths */}
                  <path d="M 20,20 L 70,25 L 85,50 L 75,60 L 50,65 L 40,55 Z" />
                  {/* SA */}
                  <path d="M 55,75 L 75,80 L 70,110 L 60,130 L 55,110 Z" />
                  {/* Africa */}
                  <path d="M 120,75 L 150,80 L 165,95 L 150,130 L 130,120 L 120,95 Z" />
                  {/* Eurasia */}
                  <path d="M 120,30 L 170,25 L 220,30 L 250,45 L 230,75 L 180,75 L 160,50 L 120,45 Z" />
                  {/* Australia */}
                  <path d="M 230,105 L 255,105 L 260,120 L 235,125 Z" />
                </g>

                {/* Pulsing connections */}
                <path d="M 240,45 Q 165,30 90,55" fill="none" stroke="var(--sev-critical)" strokeWidth="1" opacity="0.6" strokeDasharray="4 3" />
                <path d="M 170,35 Q 130,30 90,55" fill="none" stroke="var(--sev-high)" strokeWidth="1" opacity="0.6" strokeDasharray="4 3" />
                <path d="M 45,50 Q 65,45 90,55" fill="none" stroke="var(--accent-blue)" strokeWidth="1" opacity="0.5" strokeDasharray="4 3" />

                {/* Target Host */}
                <circle cx="90" cy="55" r="4" fill="var(--accent-blue)" />
                <circle cx="90" cy="55" r="8" fill="var(--accent-blue)" opacity="0.15" />

                {/* Attack Sources */}
                <circle cx="240" cy="45" r="3" fill="var(--sev-critical)" />
                <circle cx="170" cy="35" r="3" fill="var(--sev-high)" />
                <circle cx="45" cy="50" r="3" fill="var(--accent-blue)" />
              </svg>
            </div>
          </div>

          {/* AI Detection Feed */}
          <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div className="card__header" style={{ borderBottom: '1px solid var(--border-subtle)', padding: '12px 16px' }}>
              <span className="card__title" style={{ fontSize: '0.85rem' }}>AI Detections (Autonomous Findings)</span>
            </div>
            <div className="card__body" style={{ padding: '8px 16px', display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto' }}>
              {activeDetections.map((detection) => {
                const isCritical = detection.severity === 'CRITICAL' || detection.severity === 'HIGH';
                return (
                  <div key={detection.id} style={{
                    padding: '12px',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    transition: 'border-color 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-default)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className={`badge ${isCritical ? 'badge--high' : 'badge--medium'}`} style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
                        {detection.severity}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{detection.time}</span>
                    </div>

                    <div>
                      <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>{detection.title}</h4>
                      <div style={{ display: 'flex', gap: 12, marginTop: 4, fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                        <span>Type: <strong>{detection.type}</strong></span>
                        <span>Confidence: <strong style={{ color: 'var(--accent-blue)' }}>{detection.confidence}</strong></span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.03)' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: detection.status === 'Resolved' ? 'var(--accent-green)' : 'var(--accent-amber)' }}>
                        ● {detection.status}
                      </span>
                      
                      {/* View Investigation links directly to dynamic incident detail page */}
                      <Link 
                        href={`/incidents/${detection.id}`}
                        className="btn btn--primary" 
                        style={{ fontSize: '0.72rem', padding: '4px 10px', height: 'auto', borderRadius: 4 }}
                      >
                        View Investigation →
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
