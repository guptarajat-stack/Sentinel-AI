'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';

// Mock Incident Database for Forensic Details
const INCIDENTS_DB: Record<string, {
  id: string;
  title: string;
  type: string;
  severity: string;
  confidence: string;
  asset: string;
  status: string;
  created: string;
  attackerIp: string;
  targetIp: string;
  playbookName: string;
  forensicLogs: string[];
  timeline: {
    title: string;
    description: string;
    time: string;
    status: 'completed' | 'active' | 'pending';
    details: string;
  }[];
}> = {
  'INC-81072': {
    id: 'INC-81072',
    title: 'Brute Force Attack',
    type: 'SSH Brute Force',
    severity: 'CRITICAL',
    confidence: '97%',
    asset: 'auth-srv-01',
    status: 'Active',
    created: '2026-06-15 13:00:05',
    attackerIp: '192.168.1.254',
    targetIp: '10.0.0.1',
    playbookName: 'SSH Host Containment',
    forensicLogs: [
      'Jun 15 13:00:05 soc-server sshd[8412]: Failed password for invalid user admin from 192.168.1.254 port 38241 ssh2',
      'Jun 15 13:00:12 soc-server sshd[8415]: Failed password for invalid user ubuntu from 192.168.1.254 port 38244 ssh2',
      'Jun 15 13:00:20 soc-server sshd[8419]: Failed password for invalid user guest from 192.168.1.254 port 38248 ssh2',
      'Jun 15 13:00:35 soc-server sshd[8422]: Failed password for invalid user support from 192.168.1.254 port 38252 ssh2',
      'Jun 15 13:00:52 soc-server sshd[8430]: Accepted password for root from 192.168.1.254 port 38260 ssh2',
      'Jun 15 13:01:05 orchestrator: Automated alert escalated. Confidence index 97%. Triggering quarantine...'
    ],
    timeline: [
      {
        title: 'Attack Started',
        description: 'First failed login attempt detected.',
        time: '13:00:05',
        status: 'completed',
        details: 'SSH Connection established from external host IP 192.168.1.254 on interface eth0.'
      },
      {
        title: 'Failed Logins',
        description: 'Rapid credential stuffing spike.',
        time: '13:00:35',
        status: 'completed',
        details: '14 authentication failures recorded in a 30-second window targeting administrative user profiles.'
      },
      {
        title: 'Successful Access',
        description: 'Intruder successfully logged in as root.',
        time: '13:00:52',
        status: 'completed',
        details: 'Password guess accepted for account root from 192.168.1.254. Threat level escalated.'
      },
      {
        title: 'Response Triggered',
        description: 'Automated quarantine playbook executed.',
        time: '13:01:05',
        status: 'completed',
        details: 'Response Agent configured iptables rules to block port 22 traffic from IP 192.168.1.254.'
      },
      {
        title: 'Incident Closed',
        description: 'Auditing and system verification.',
        time: 'Pending Actions',
        status: 'active',
        details: 'Awaiting manual administrator confirmation to release network quarantine and archive forensic logs.'
      }
    ]
  },
  'INC-74910': {
    id: 'INC-74910',
    title: 'SQL Injection payload blocked',
    type: 'SQL Injection',
    severity: 'HIGH',
    confidence: '94%',
    asset: 'web-gateway-db',
    status: 'Investigating',
    created: '2026-06-15 12:45:12',
    attackerIp: '10.0.10.99',
    targetIp: '10.0.0.5',
    playbookName: 'WAF Filter Block',
    forensicLogs: [
      '12:45:12 nginx-waf[1082]: client 10.0.10.99 WAF Blocked SQL Injection: GET /api/v1/auth/login?user=1%27%20OR%201%3D1',
      '12:45:13 nginx-waf[1082]: Request terminated status=403 rule_id=942100',
      '12:46:00 agent-inv: Enrichment completed. Asset status: normal.'
    ],
    timeline: [
      {
        title: 'Attack Started',
        description: 'Injection signature matched.',
        time: '12:45:12',
        status: 'completed',
        details: 'WAF rules matched SQL query patterns in query parameters on HTTP endpoint.'
      },
      {
        title: 'Failed Logins',
        description: 'Request Blocked',
        time: '12:45:13',
        status: 'completed',
        details: 'Request returned 403 Forbidden. Database server never received the query payload.'
      },
      {
        title: 'Successful Access',
        description: 'Access Denied',
        time: '12:45:13',
        status: 'completed',
        details: 'Intrusion was blocked at the perimeter gateway level.'
      },
      {
        title: 'Response Triggered',
        description: 'WAF filter updated.',
        time: '12:46:00',
        status: 'completed',
        details: 'Mitigation rules applied: temporary ban on IP 10.0.10.99 for 30 minutes.'
      },
      {
        title: 'Incident Closed',
        description: 'Logs archived.',
        time: '12:50:00',
        status: 'completed',
        details: 'Incident marked resolved after traffic patterns from the subnet returned to normal baseline values.'
      }
    ]
  }
};

const DEFAULT_INCIDENT = {
  id: 'INC-GENERIC',
  title: 'Network Traffic Anomaly',
  type: 'Anomaly Detection',
  severity: 'MEDIUM',
  confidence: '82%',
  asset: 'dmz-gateway',
  status: 'Active',
  created: '2026-06-15 14:10:00',
  attackerIp: '172.16.50.104',
  targetIp: '10.0.0.1',
  playbookName: 'IP Block Playbook',
  forensicLogs: [
    '14:10:00 firewall-alert: Incoming SYN scan detected from 172.16.50.104',
    '14:11:02 orchestrator: Port scan signature matched. Conf=82%.'
  ],
  timeline: [
    {
      title: 'Attack Started',
      description: 'TCP scans initiated.',
      time: '14:10:00',
      status: 'completed',
      details: 'SYN sweep scanning ports 21, 22, 80, 443, 8080.'
    },
    {
      title: 'Failed Logins',
      description: 'Scans Blocked',
      time: '14:10:05',
      status: 'completed',
      details: 'Firewall firewall logs logged connection limits exceeded.'
    },
    {
      title: 'Successful Access',
      description: 'No access allowed',
      time: '14:10:05',
      status: 'completed',
      details: 'No internal service accepted traffic from source IP.'
    },
    {
      title: 'Response Triggered',
      description: 'Firewall rules updated',
      time: '14:11:02',
      status: 'completed',
      details: 'IP 172.16.50.104 blocked at DMZ perimeter.'
    },
    {
      title: 'Incident Closed',
      description: 'Awaiting Verification',
      time: '14:15:00',
      status: 'completed',
      details: 'Incident resolved.'
    }
  ]
};

export default function IncidentDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const incident = INCIDENTS_DB[id] || { ...DEFAULT_INCIDENT, id: id || 'INC-UNKNOWN' };
  const [containmentApplied, setContainmentApplied] = useState(false);
  const [terminalOutput, setTerminalOutput] = useState<string[]>([]);
  const [isRunningTerminal, setIsRunningTerminal] = useState(false);

  const triggerManualQuarantine = () => {
    setIsRunningTerminal(true);
    setTerminalOutput(['$ sentinel-cli quarantine-host --ip ' + incident.attackerIp]);
    
    setTimeout(() => {
      setTerminalOutput(prev => [...prev, '[+] Initiating automated quarantine protocol...']);
    }, 600);

    setTimeout(() => {
      setTerminalOutput(prev => [...prev, '[+] Contacting Response Agent daemon... [ONLINE]']);
    }, 1200);

    setTimeout(() => {
      setTerminalOutput(prev => [...prev, '[+] Injecting iptables blocking rules on port 22/80/443...']);
    }, 1800);

    setTimeout(() => {
      setTerminalOutput(prev => [...prev, '[+] IP ' + incident.attackerIp + ' successfully quarantined.']);
      setTerminalOutput(prev => [...prev, '[+] Incident case status updated to RESOLVED.']);
      setContainmentApplied(true);
      setIsRunningTerminal(false);
    }, 2400);
  };

  const isCritical = incident.severity === 'CRITICAL' || incident.severity === 'HIGH';

  return (
    <div className="page-wrapper animate-fade-in" style={{ paddingBottom: '40px' }}>
      
      {/* Back button */}
      <div>
        <button onClick={() => router.push('/incidents')} className="btn btn--ghost" style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
          ← Back to Incidents List
        </button>
      </div>

      {/* ── Case File Header ── */}
      <div className="card" style={{ 
        padding: '24px', 
        borderLeft: `4px solid ${isCritical ? 'var(--sev-critical)' : 'var(--accent-amber)'}`,
        background: 'linear-gradient(135deg, var(--bg-surface) 0%, rgba(9, 12, 23, 0.85) 100%)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="mono" style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>CASE: {incident.id}</span>
              <span className={`badge ${isCritical ? 'badge--critical' : 'badge--medium'}`}>
                {incident.severity}
              </span>
              <span className="badge badge--active">
                {containmentApplied ? 'RESOLVED' : incident.status.toUpperCase()}
              </span>
            </div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: 8, letterSpacing: '-0.02em' }}>
              {incident.title}
            </h1>
            <div style={{ display: 'flex', gap: 20, marginTop: 12, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <span>Attacker IP: <strong className="mono" style={{ color: 'var(--accent-blue)' }}>{incident.attackerIp}</strong></span>
              <span>Target Asset: <strong className="mono" style={{ color: 'var(--accent-purple)' }}>{incident.asset}</strong></span>
              <span>Confidence: <strong className="mono" style={{ color: 'var(--accent-green)' }}>{incident.confidence}</strong></span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button 
              className="btn btn--danger" 
              onClick={triggerManualQuarantine}
              disabled={containmentApplied || isRunningTerminal}
              style={{ padding: '10px 18px', fontWeight: 700 }}
            >
              {containmentApplied ? '✅ IP Containment Active' : '🚨 Quarantine Source IP'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Case Layout Split Grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 2.5fr', gap: 16 }}>
        
        {/* Detective Case Timeline (Left) */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card__header" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
            <span className="card__title">Forensic Attack Timeline</span>
          </div>
          <div className="card__body" style={{ flex: 1, padding: '24px 20px' }}>
            
            {/* Timeline Wrapper */}
            <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 28, paddingLeft: 18 }}>
              
              {/* Vertical timeline connector line */}
              <div style={{
                position: 'absolute', top: 6, bottom: 6, left: 5, width: 2,
                background: 'rgba(255,255,255,0.06)'
              }} />

              {incident.timeline.map((step, idx) => {
                const isActive = step.status === 'active';
                const isCompleted = step.status === 'completed';
                
                return (
                  <div key={idx} style={{ position: 'relative' }}>
                    {/* Circle Node */}
                    <div style={{
                      position: 'absolute', left: -18, top: 4, width: 12, height: 12, borderRadius: '50%',
                      background: isCompleted ? 'var(--accent-green)' : isActive ? 'var(--accent-amber)' : 'var(--text-disabled)',
                      border: '2.5px solid var(--bg-surface)',
                      boxShadow: isCompleted ? '0 0 5px var(--accent-green)' : isActive ? '0 0 8px var(--accent-amber)' : 'none',
                      zIndex: 2,
                      animation: isActive ? 'pulse-green 2s ease-in-out infinite' : 'none'
                    }} />

                    {/* Step Content */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>{step.title}</h4>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>{step.time}</span>
                      </div>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 2 }}>{step.description}</p>
                      <p style={{ 
                        fontSize: '0.75rem', color: 'var(--text-muted)', 
                        background: 'rgba(255,255,255,0.01)', borderLeft: '2px solid rgba(255,255,255,0.05)',
                        padding: '6px 8px', borderRadius: 4, marginTop: 6
                      }}>
                        {step.details}
                      </p>
                    </div>
                  </div>
                );
              })}

            </div>

          </div>
        </div>

        {/* Forensic Logs & CLI containments (Right) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          
          {/* Forensic Logs Raw View */}
          <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div className="card__header" style={{ borderBottom: '1px solid var(--border-subtle)', padding: '12px 16px' }}>
              <span className="card__title">Forensic Audit Log Trails</span>
            </div>
            <div className="card__body" style={{ 
              flex: 1, background: '#04060b', padding: '16px', 
              fontFamily: "'JetBrains Mono', monospace", fontSize: '0.78rem', 
              color: '#adbcd6', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8,
              borderBottomLeftRadius: 'var(--radius-lg)', borderBottomRightRadius: 'var(--radius-lg)'
            }}>
              {incident.forensicLogs.map((log, idx) => (
                <div key={idx} style={{ 
                  borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: 6,
                  color: log.includes('Accepted') ? 'var(--accent-red)' : log.includes('Mitigation') ? 'var(--accent-green)' : 'inherit'
                }}>
                  {log}
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Shell Terminal Console */}
          <div className="card" style={{ height: '200px', display: 'flex', flexDirection: 'column' }}>
            <div className="card__header" style={{ borderBottom: '1px solid var(--border-subtle)', padding: '10px 16px' }}>
              <span className="card__title" style={{ fontSize: '0.8rem' }}>Mitigation Action CLI Shell</span>
            </div>
            
            <div style={{ 
              flex: 1, background: '#020306', padding: '12px 16px', 
              fontFamily: "'JetBrains Mono', monospace", fontSize: '0.78rem', 
              color: '#39ff14', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6,
              borderBottomLeftRadius: 'var(--radius-lg)', borderBottomRightRadius: 'var(--radius-lg)'
            }}>
              {terminalOutput.length === 0 ? (
                <div style={{ color: 'rgba(57, 255, 20, 0.4)' }}>
                  Awaiting playbook commands... Click &quot;Quarantine Source IP&quot; above to execute mitigation script.
                </div>
              ) : (
                terminalOutput.map((line, idx) => (
                  <div key={idx} style={{ color: line.startsWith('$') ? 'var(--accent-blue)' : 'inherit' }}>
                    {line}
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
