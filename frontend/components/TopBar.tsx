'use client';

import Link from 'next/link';
import { useState } from 'react';

const AGENTS = [
  { name: 'Detection Agent',      short: 'DET', status: 'active' },
  { name: 'Investigation Agent',  short: 'INV', status: 'active' },
  { name: 'Response Agent',       short: 'RES', status: 'active' },
  { name: 'Report Agent',         short: 'RPT', status: 'active' },
];

const ENVIRONMENTS = ['Production', 'Staging', 'Dev / Lab'];

const NOTIFICATIONS = [
  { id: 1, title: 'Critical: SSH Brute Force detected', time: '2m ago', severity: 'critical', read: false },
  { id: 2, title: 'High: SQL Injection blocked by WAF', time: '8m ago', severity: 'high', read: false },
  { id: 3, title: 'Agent: Response Agent executed playbook', time: '14m ago', severity: 'info', read: false },
  { id: 4, title: 'Medium: Port scan from 45.33.32.156', time: '22m ago', severity: 'medium', read: true },
  { id: 5, title: 'Report generated: Daily SOC Summary', time: '1h ago', severity: 'info', read: true },
];

const sevDot: Record<string, string> = {
  critical: 'var(--sev-critical)',
  high:     'var(--sev-high)',
  medium:   'var(--sev-medium)',
  info:     'var(--accent-blue)',
};

export default function TopBar() {
  const [envOpen,  setEnvOpen]  = useState(false);
  const [env,      setEnv]      = useState('Production');
  const [notiOpen, setNotiOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const unread = NOTIFICATIONS.filter(n => !n.read).length;

  return (
    <header className="topbar">

      {/* ── Brand ── */}
      <div className="topbar__brand">
        <div className="topbar__brand-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
            style={{ color: '#4a9eff', width: 18, height: 18 }}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
          </svg>
        </div>
        <div className="topbar__brand-text">
          <span className="topbar__brand-name">SENTINEL AI</span>
          <span className="topbar__brand-version">SOC Platform v2.0</span>
        </div>
      </div>

      {/* ── Search ── */}
      <div className="topbar__center">
        <div className="topbar__search">
          <svg viewBox="0 0 20 20" fill="currentColor" width="15" height="15">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
          </svg>
          <input type="text" placeholder="Search logs, IPs, incidents, IOCs, rules…" aria-label="Global search" />
          <div className="topbar__search-kbd">
            <kbd>⌘</kbd><kbd>K</kbd>
          </div>
        </div>
      </div>

      {/* ── Right Actions ── */}
      <div className="topbar__right">

        {/* Environment Selector */}
        <div style={{ position: 'relative' }}>
          <button
            className="topbar__icon-btn"
            style={{ width: 'auto', padding: '0 12px', gap: 6, fontSize: '0.78rem', fontWeight: 600 }}
            onClick={() => { setEnvOpen(o => !o); setNotiOpen(false); setProfileOpen(false); }}
            aria-label="Select environment"
          >
            <span style={{
              width: 7, height: 7, borderRadius: '50%', display: 'inline-block', flexShrink: 0,
              background: env === 'Production' ? 'var(--accent-green)' : env === 'Staging' ? 'var(--accent-amber)' : 'var(--accent-blue)',
              boxShadow: `0 0 5px ${env === 'Production' ? 'var(--accent-green)' : env === 'Staging' ? 'var(--accent-amber)' : 'var(--accent-blue)'}`,
            }} />
            {env}
            <svg viewBox="0 0 20 20" fill="currentColor" width="12" height="12" style={{ opacity: 0.5 }}>
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>

          {envOpen && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 8px)', left: 0, minWidth: 160,
              background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)', zIndex: 200,
              padding: '6px',
            }}>
              {ENVIRONMENTS.map(e => (
                <button key={e} onClick={() => { setEnv(e); setEnvOpen(false); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 10px',
                    borderRadius: 'var(--radius-sm)', background: e === env ? 'var(--bg-hover)' : 'transparent',
                    color: 'var(--text-primary)', fontSize: '0.82rem', fontWeight: 500, cursor: 'pointer', border: 'none', textAlign: 'left',
                  }}>
                  <span style={{
                    width: 7, height: 7, borderRadius: '50%', display: 'inline-block',
                    background: e === 'Production' ? 'var(--accent-green)' : e === 'Staging' ? 'var(--accent-amber)' : 'var(--accent-blue)',
                  }} />
                  {e}
                  {e === env && <svg viewBox="0 0 20 20" fill="currentColor" width="13" height="13" style={{ marginLeft: 'auto', color: 'var(--accent-blue)' }}><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="topbar__divider" />

        {/* Agent Status Indicators (Visible directly on the right side) */}
        <div className="topbar__agents-strip" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {AGENTS.map(agent => (
            <div key={agent.name} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 10px',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.75rem',
              fontWeight: 500,
              color: 'var(--text-secondary)',
              userSelect: 'none',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'var(--border-default)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--border-subtle)';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
            >
              <span style={{
                width: 6, height: 6,
                borderRadius: '50%',
                background: 'var(--accent-green)',
                boxShadow: '0 0 6px var(--accent-green)',
                animation: 'pulse-green 2s ease-in-out infinite',
                display: 'inline-block'
              }} />
              {agent.name}
            </div>
          ))}
        </div>

        <div className="topbar__divider" />

        {/* Notifications */}
        <div style={{ position: 'relative' }}>
          <button className="topbar__icon-btn" onClick={() => { setNotiOpen(o => !o); setEnvOpen(false); setProfileOpen(false); }} aria-label="Notifications">
            <svg viewBox="0 0 20 20" fill="currentColor" width="17" height="17">
              <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
            </svg>
            {unread > 0 && <span className="topbar__badge">{unread}</span>}
          </button>

          {notiOpen && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: 340,
              background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)', zIndex: 200, overflow: 'hidden',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>Notifications</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--accent-blue)', cursor: 'pointer', fontWeight: 600 }}>Mark all read</span>
              </div>
              {NOTIFICATIONS.map(n => (
                <div key={n.id} style={{
                  display: 'flex', gap: 10, padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)',
                  background: n.read ? 'transparent' : 'rgba(74,158,255,0.04)', cursor: 'pointer',
                  transition: 'background 0.12s',
                }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: sevDot[n.severity], marginTop: 5, flexShrink: 0, boxShadow: `0 0 5px ${sevDot[n.severity]}` }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: n.read ? 400 : 600, color: n.read ? 'var(--text-secondary)' : 'var(--text-primary)', lineHeight: 1.4 }}>{n.title}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 3 }}>{n.time}</div>
                  </div>
                  {!n.read && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-blue)', marginTop: 5, flexShrink: 0 }} />}
                </div>
              ))}
              <div style={{ padding: '10px 16px', textAlign: 'center' }}>
                <Link href="/incidents" style={{ fontSize: '0.78rem', color: 'var(--accent-blue)', fontWeight: 600 }} onClick={() => setNotiOpen(false)}>
                  View all alerts →
                </Link>
              </div>
            </div>
          )}
        </div>

        <div className="topbar__divider" />

        {/* User Profile */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => { setProfileOpen(o => !o); setNotiOpen(false); setEnvOpen(false); }}
            style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'transparent', border: '1px solid transparent', cursor: 'pointer', padding: '4px 8px', borderRadius: 'var(--radius-md)', transition: 'background 0.12s, border-color 0.12s' }}
            aria-label="User profile"
          >
            <div className="topbar__avatar">SA</div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2 }}>SOC Admin</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Administrator</div>
            </div>
            <svg viewBox="0 0 20 20" fill="currentColor" width="12" height="12" style={{ opacity: 0.4, color: 'var(--text-secondary)' }}>
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>

          {profileOpen && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: 200,
              background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)', zIndex: 200, padding: '6px',
            }}>
              <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-subtle)', marginBottom: 6 }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>SOC Admin</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>admin@soc.local</div>
              </div>
              {[
                { icon: '👤', label: 'My Profile' },
                { icon: '⚙️', label: 'Preferences' },
                { icon: '🔑', label: 'API Keys' },
                { icon: '📋', label: 'Audit Log' },
              ].map(item => (
                <button key={item.label} style={{
                  display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 10px',
                  borderRadius: 'var(--radius-sm)', background: 'transparent', color: 'var(--text-secondary)',
                  fontSize: '0.82rem', fontWeight: 500, cursor: 'pointer', border: 'none', textAlign: 'left',
                  transition: 'all 0.12s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                >
                  <span>{item.icon}</span>{item.label}
                </button>
              ))}
              <div style={{ borderTop: '1px solid var(--border-subtle)', marginTop: 6, paddingTop: 6 }}>
                <button style={{
                  display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 10px',
                  borderRadius: 'var(--radius-sm)', background: 'transparent', color: 'var(--accent-red)',
                  fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', border: 'none',
                }}>
                  <span>🚪</span> Sign out
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}
