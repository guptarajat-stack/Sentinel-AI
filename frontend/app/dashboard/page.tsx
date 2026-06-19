'use client';

import { useState } from 'react';
import Link from 'next/link';

// Sparkline Component
function Sparkline({ data, color }: { data: number[]; color: string }) {
  const width = 120;
  const height = 40;
  const padding = 2;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data.map((val, index) => {
    const x = (index / (data.length - 1)) * (width - padding * 2) + padding;
    const y = height - ((val - min) / range) * (height - padding * 2) - padding;
    return `${x},${y}`;
  }).join(' ');

  const areaPoints = `${padding},${height} ${points} ${width - padding},${height}`;

  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={`sparkGrad-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={`url(#sparkGrad-${color})`} />
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function DashboardPage() {
  const [activeSeries, setActiveSeries] = useState<Record<string, boolean>>({
    'Brute Force': true,
    'SQL Injection': true,
    'XSS': true,
    'Port Scan': true,
  });

  const [hoveredMapNode, setHoveredMapNode] = useState<string | null>(null);

  // Threat Timeline Data (last 12 hours)
  const hours = ['04:00', '05:00', '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00'];
  const seriesData = {
    'Brute Force': [45, 52, 98, 140, 195, 130, 105, 128, 225, 190, 260, 290],
    'SQL Injection': [25, 20, 38, 48, 62, 54, 75, 68, 85, 98, 115, 130],
    'XSS': [5, 12, 8, 15, 22, 18, 25, 32, 28, 35, 40, 48],
    'Port Scan': [110, 125, 115, 160, 138, 185, 172, 215, 198, 235, 222, 255],
  };

  const seriesColors = {
    'Brute Force': 'var(--sev-critical)',
    'SQL Injection': 'var(--sev-high)',
    'XSS': 'var(--accent-purple)',
    'Port Scan': 'var(--accent-blue)',
  };

  // Map Nodes & Connections
  const mapNodes = [
    { id: 'beijing', name: 'Beijing, CN', x: 420, y: 110, volume: 850, sev: 'critical', ip: '220.181.111.85' },
    { id: 'moscow', name: 'Moscow, RU', x: 290, y: 80, volume: 420, sev: 'high', ip: '95.108.174.12' },
    { id: 'california', name: 'California, US', x: 80, y: 100, volume: 180, sev: 'medium', ip: '104.244.42.1' },
    { id: 'saopaulo', name: 'São Paulo, BR', x: 155, y: 220, volume: 90, sev: 'low', ip: '191.234.8.19' },
  ];

  const targetNode = { name: 'Sentinel Core (US-East)', x: 130, y: 95 };

  // Helper to generate SVG Path for Timeline Area Chart
  const generateAreaPath = (data: number[], width: number, height: number) => {
    const maxVal = 320; // Max bound of y-axis
    const xStep = width / (data.length - 1);
    const coords = data.map((val, i) => {
      const x = i * xStep;
      const y = height - (val / maxVal) * height;
      return `${x},${y}`;
    });

    const path = `M 0,${height} L ${coords.join(' L ')} L ${width},${height} Z`;
    const strokePath = `M ${coords.join(' L ')}`;
    return { path, strokePath };
  };

  return (
    <div className="page-wrapper animate-fade-in" style={{ paddingBottom: '40px' }}>
      
      {/* ── Header ── */}
      <div className="page-hero">
        <div>
          <div className="page-hero__eyebrow">● Executive Overview</div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Sentinel Security Operations
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 6 }}>
            System Status: <span style={{ color: 'var(--accent-green)', fontWeight: 700 }}>SECURE</span> · Autonomous Orchestrator Monitoring Active
          </p>
        </div>
        <div className="page-hero__actions">
          <Link href="/threat-monitoring" className="btn btn--ghost">
            <span style={{ marginRight: 6 }}>🎛️</span> Operations Room
          </Link>
          <Link href="/incidents" className="btn btn--primary">
            <span style={{ marginRight: 6 }}>🛡️</span> View Active Cases
          </Link>
        </div>
      </div>

      <div className="summary-strip">
        <div className="summary-chip">
          <div className="summary-chip__label">Active Incidents</div>
          <div className="summary-chip__value">12</div>
        </div>
        <div className="summary-chip">
          <div className="summary-chip__label">Automations Run</div>
          <div className="summary-chip__value">48 today</div>
        </div>
        <div className="summary-chip">
          <div className="summary-chip__label">Attack Coverage</div>
          <div className="summary-chip__value">94%</div>
        </div>
      </div>

      {/* ── Top Row: Security Score & Alert Summary Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2.8fr', gap: 16 }}>
        
        {/* Security Score Card */}
        <div className="card" style={{ 
          padding: '24px', 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'center', 
          position: 'relative',
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(11, 19, 35, 0.98) 100%)',
          overflow: 'hidden',
          border: '1px solid rgba(56, 189, 248, 0.18)'
        }}>
          {/* Glowing background details */}
          <div style={{
            position: 'absolute', top: '-20%', right: '-20%', width: '150px', height: '150px',
            borderRadius: '50%', background: 'var(--accent-green-dim)', filter: 'blur(40px)', zIndex: 0
          }} />
          
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 24 }}>
            {/* SVG circular score indicator */}
            <div style={{ position: 'relative', width: 90, height: 90 }}>
              <svg width="90" height="90" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="rgba(255,255,255,0.03)"
                  strokeWidth="3.2"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="var(--accent-green)"
                  strokeWidth="3.2"
                  strokeDasharray="92, 100"
                  strokeLinecap="round"
                  style={{ filter: 'drop-shadow(0 0 3px var(--accent-green))' }}
                />
              </svg>
              <div style={{
                position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: "'JetBrains Mono', monospace"
              }}>
                92
              </div>
            </div>
            
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Overall Security Score
              </span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
                <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>92</span>
                <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>/ 100</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, fontSize: '0.78rem', color: 'var(--accent-green)', fontWeight: 600 }}>
                <span>▲ +5%</span>
                <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>vs last 24h</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Alert Summary Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {[
            { label: 'Critical Alerts', val: '3', trend: '-12%', trendUp: false, color: 'var(--sev-critical)', data: [8, 5, 6, 4, 3, 2, 4, 3] },
            { label: 'High Alerts', val: '9', trend: '+8%', trendUp: true, color: 'var(--sev-high)', data: [4, 6, 8, 5, 7, 6, 9, 9] },
            { label: 'Medium Alerts', val: '24', trend: '+21%', trendUp: true, color: 'var(--sev-medium)', data: [12, 15, 18, 14, 20, 22, 19, 24] },
            { label: 'Resolved Today', val: '142', trend: '+15%', trendUp: true, color: 'var(--accent-green)', data: [80, 95, 110, 105, 120, 130, 125, 142] }
          ].map((card, idx) => (
            <div key={idx} className="card" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {card.label}
                </span>
                <span style={{ 
                  fontSize: '0.72rem', 
                  fontWeight: 700, 
                  color: card.trendUp ? 'var(--accent-green)' : 'var(--accent-red)',
                  background: card.trendUp ? 'var(--accent-green-dim)' : 'var(--accent-red-dim)',
                  padding: '2px 6px',
                  borderRadius: 4
                }}>
                  {card.trend}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 4 }}>
                <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: "'JetBrains Mono', monospace", lineHeight: 1 }}>
                  {card.val}
                </span>
                <Sparkline data={card.data} color={card.color} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Middle Row: Large Timeline Area Chart + World Map ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: 16 }}>

        {/* Threat Activity Timeline Card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card__header">
            <div>
              <span className="card__title">Threat Activity Timeline</span>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>Interactive distribution graph of attacks per hour</p>
            </div>
            {/* Legend Toggles */}
            <div style={{ display: 'flex', gap: 12 }}>
              {Object.keys(seriesColors).map(label => (
                <button
                  key={label}
                  onClick={() => setActiveSeries(prev => ({ ...prev, [label]: !prev[label] }))}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    opacity: activeSeries[label] ? 1 : 0.35,
                    transition: 'opacity 0.2s',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: 'var(--text-secondary)'
                  }}
                >
                  <span style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: seriesColors[label as keyof typeof seriesColors]
                  }} />
                  {label}
                </button>
              ))}
            </div>
          </div>
          
          <div className="card__body" style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            {/* SVG Area Chart */}
            <div style={{ width: '100%', height: 260, position: 'relative' }}>
              <svg width="100%" height="100%" viewBox="0 0 600 240" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
                <defs>
                  {Object.entries(seriesColors).map(([label, color]) => (
                    <linearGradient key={label} id={`areaGrad-${label.replace(' ', '')}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={color} stopOpacity="0.15" />
                      <stop offset="100%" stopColor={color} stopOpacity="0.0" />
                    </linearGradient>
                  ))}
                </defs>

                {/* Y-axis helper lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
                  <line
                    key={i}
                    x1="0"
                    y1={240 * ratio}
                    x2="600"
                    y2={240 * ratio}
                    stroke="rgba(255,255,255,0.03)"
                    strokeWidth="1"
                  />
                ))}

                {/* Grid text markers */}
                <text x="-5" y="10" fill="var(--text-muted)" fontSize="8" textAnchor="end">320</text>
                <text x="-5" y="125" fill="var(--text-muted)" fontSize="8" textAnchor="end">160</text>
                <text x="-5" y="235" fill="var(--text-muted)" fontSize="8" textAnchor="end">0</text>

                {/* Render paths dynamically based on state */}
                {Object.entries(seriesData).map(([label, data]) => {
                  if (!activeSeries[label]) return null;
                  const { path, strokePath } = generateAreaPath(data, 600, 240);
                  const color = seriesColors[label as keyof typeof seriesColors];
                  return (
                    <g key={label}>
                      <path d={path} fill={`url(#areaGrad-${label.replace(' ', '')})`} />
                      <path d={strokePath} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* X-axis labels */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, paddingLeft: 10, paddingRight: 10 }}>
              {hours.map((h, i) => (
                <span key={i} style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>{h}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Attack Sources Map Card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card__header">
            <div>
              <span className="card__title">Attack Origin Map</span>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>Visual telemetry of active external threat coordinates</p>
            </div>
            <span className="badge badge--critical" style={{ fontSize: '0.65rem' }}>Active Links</span>
          </div>

          <div className="card__body" style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '10px' }}>
            <div style={{ position: 'relative', width: '100%', maxWidth: '380px', height: '220px', background: 'var(--bg-canvas)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
              
              {/* World Map SVG outlines */}
              <svg width="100%" height="100%" viewBox="0 0 500 300" style={{ opacity: 0.8 }}>
                <style>{`
                  @keyframes arc-dash {
                    to {
                      stroke-dashoffset: -40;
                    }
                  }
                  .arc-line {
                    stroke-dasharray: 8 6;
                    animation: arc-dash 2s linear infinite;
                  }
                `}</style>
                <g fill="rgba(255, 255, 255, 0.025)" stroke="rgba(255, 255, 255, 0.04)" strokeWidth="0.8">
                  {/* North America */}
                  <path d="M 40,40 L 130,45 L 150,90 L 140,110 L 100,115 L 80,95 L 40,75 Z" />
                  {/* South America */}
                  <path d="M 100,135 L 130,140 L 120,190 L 105,230 L 95,200 L 90,165 Z" />
                  {/* Africa */}
                  <path d="M 210,135 L 260,140 L 285,165 L 265,220 L 245,240 L 230,210 L 210,175 Z" />
                  {/* Europe & Asia */}
                  <path d="M 200,55 L 280,45 L 380,50 L 430,65 L 440,105 L 380,135 L 300,135 L 265,95 L 225,95 L 200,80 Z" />
                  {/* Australia */}
                  <path d="M 390,190 L 430,190 L 440,215 L 400,225 L 385,205 Z" />
                </g>

                {/* Target Hub Indicator */}
                <circle cx={targetNode.x} cy={targetNode.y} r="6" fill="var(--accent-blue)" opacity="0.3" />
                <circle cx={targetNode.x} cy={targetNode.y} r="3" fill="var(--accent-blue)" />

                {/* Connection bezier paths (Arcs) */}
                {mapNodes.map(node => (
                  <path
                    key={`arc-${node.id}`}
                    d={`M ${node.x},${node.y} Q ${(node.x + targetNode.x) / 2},${Math.min(node.y, targetNode.y) - 30} ${targetNode.x},${targetNode.y}`}
                    fill="none"
                    stroke={node.sev === 'critical' ? 'var(--sev-critical)' : node.sev === 'high' ? 'var(--sev-high)' : 'var(--accent-amber)'}
                    strokeWidth="1.2"
                    opacity="0.6"
                    className="arc-line"
                  />
                ))}

                {/* Threat Nodes */}
                {mapNodes.map(node => {
                  const nodeColor = node.sev === 'critical' ? 'var(--sev-critical)' : node.sev === 'high' ? 'var(--sev-high)' : node.sev === 'medium' ? 'var(--sev-medium)' : 'var(--accent-green)';
                  const isHovered = hoveredMapNode === node.id;
                  return (
                    <g 
                      key={node.id} 
                      onMouseEnter={() => setHoveredMapNode(node.id)}
                      onMouseLeave={() => setHoveredMapNode(null)}
                      style={{ cursor: 'pointer' }}
                    >
                      <circle cx={node.x} cy={node.y} r={isHovered ? 12 : 8} fill={nodeColor} opacity="0.15" style={{ transition: 'all 0.15s' }} />
                      <circle cx={node.x} cy={node.y} r={isHovered ? 6 : 4} fill={nodeColor} style={{ transition: 'all 0.15s' }} />
                    </g>
                  );
                })}
              </svg>

              {/* Hover Tooltip Overlay */}
              {hoveredMapNode && (() => {
                const node = mapNodes.find(n => n.id === hoveredMapNode);
                if (!node) return null;
                return (
                  <div style={{
                    position: 'absolute', bottom: 10, left: 10, right: 10,
                    background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-sm)', padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 2, zIndex: 10
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)' }}>{node.name}</span>
                      <span className={`badge badge--${node.sev}`} style={{ fontSize: '0.6rem', padding: '1px 5px' }}>{node.sev}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                      <span className="mono">{node.ip}</span>
                      <span style={{ fontWeight: 600 }}>{node.volume} attacks/hr</span>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom Row: AI Insights Panel ── */}
      <div>
        <div className="card">
          <div className="card__header" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: '1.25rem' }}>🤖</span>
              <div>
                <span className="card__title">AI Analysis &amp; Insights</span>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>Cognitive security logs generated by Sentinel AI orchestrator</p>
              </div>
            </div>
            <span style={{
              fontSize: '0.7rem', fontWeight: 700, color: 'var(--accent-blue)', 
              background: 'var(--accent-blue-dim)', border: '1px solid rgba(74,158,255,0.2)',
              padding: '2px 8px', borderRadius: 'var(--radius-pill)'
            }}>
              GPT-4o ENRICHED
            </span>
          </div>
          <div className="card__body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 20 }}>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Top Risk</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--sev-critical)' }} />
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>SSH Brute Force</span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                Unusual authentication activity detected targeting root logins from IP <span className="mono" style={{ color: 'var(--accent-blue)' }}>192.168.1.254</span>. Recommend triggering automated quarantine.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Most Targeted User</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--sev-high)' }} />
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: "'JetBrains Mono', monospace" }}>root</span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                Admin access credentials are being targeted in 92% of the auth alerts recorded today. Verify credential rotation and check login restrictions.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Unusual Activity</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--sev-medium)' }} />
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>WAF Spike</span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                A 340% increase in SQL injection payload blocks has been registered on the authentication routing endpoint <span className="mono" style={{ color: 'var(--accent-purple)' }}>/api/v1/auth/login</span>.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '12px 14px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-default)' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-blue)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Recommended Actions</div>
              <ul style={{ fontSize: '0.78rem', color: 'var(--text-primary)', paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: 6, margin: 0 }}>
                <li>Quarantine SSH source IP <span className="mono">192.168.1.254</span>.</li>
                <li>Apply SQL Injection WAF filter rule 942100.</li>
                <li>Force MFA authentication for <span className="mono">root</span> admin login attempts.</li>
              </ul>
            </div>

          </div>
        </div>
      </div>

    </div>
  );
}
