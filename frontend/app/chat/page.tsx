'use client';

export default function ChatPage() {
  const mockMessages = [
    {
      sender: 'AI-SOC Analyst',
      text: 'Hello! I am your cooperative Security Copilot. I scan raw security event streams and correlate RAG playbooks to isolate attacks.',
      time: '13:02',
    },
    {
      sender: 'User (You)',
      text: 'What is the status of INC-81072?',
      time: '13:03',
    },
    {
      sender: 'AI-SOC Analyst',
      text: 'Incident INC-81072 was identified as a high-severity SSH Brute Force attack from source IP 192.168.1.254. The Response Agent automatically executed a block rule on the firewall router gateway. A full markdown dossier was written to reports/generated/.',
      time: '13:03',
    },
  ];

  return (
    <div className="page-wrapper animate-fade-in" style={{ paddingBottom: '40px' }}>
      <div className="page-hero">
        <div>
          <div className="page-hero__eyebrow">● AI Copilot Workspace</div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            AI Security Assistant
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 6 }}>
            Query logs, isolate hosts, and generate playbooks via natural language.
          </p>
        </div>
      </div>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '480px', overflow: 'hidden' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', padding: '20px', background: 'linear-gradient(180deg, #fafcff 0%, #f7fbff 100%)' }}>
          {mockMessages.map((msg, i) => (
            <div
              key={i}
              style={{
                alignSelf: msg.sender.startsWith('User') ? 'flex-end' : 'flex-start',
                maxWidth: '72%',
                background: msg.sender.startsWith('User') ? 'var(--bg-elevated)' : 'rgba(59, 130, 246, 0.06)',
                border: '1px solid ' + (msg.sender.startsWith('User') ? 'var(--border-default)' : 'rgba(59, 130, 246, 0.16)'),
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}
            >
              <span
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: msg.sender.startsWith('User') ? 'var(--accent-blue)' : 'var(--accent-purple)',
                }}
              >
                {msg.sender}
              </span>
              <p style={{ fontSize: '0.95rem', lineHeight: '1.5', color: 'var(--text-primary)' }}>{msg.text}</p>
              <span style={{ alignSelf: 'flex-end', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{msg.time}</span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '12px', borderTop: '1px solid var(--border-subtle)', padding: '16px 20px', background: 'var(--bg-surface)' }}>
          <input
            type="text"
            placeholder="Ask Copilot to check logs or execute actions (e.g. 'Block IP 192.168.1.200')..."
            style={{
              flex: 1,
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-default)',
              borderRadius: '8px',
              padding: '12px 16px',
              color: 'var(--text-primary)',
              fontFamily: 'inherit',
              fontSize: '0.95rem',
            }}
          />
          <button
            style={{
              background: 'var(--accent-blue)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '0 24px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
