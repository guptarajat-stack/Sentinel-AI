import type { Metadata } from 'next';
import TopBar from '@/components/TopBar';
import Sidebar from '@/components/Sidebar';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Sentinel AI — SOC Platform',
    template: '%s · Sentinel AI',
  },
  description:
    'Enterprise-grade AI Security Operations Center — autonomous threat detection, AI-driven investigation, and real-time incident response.',
  keywords: ['SOC', 'SIEM', 'AI Security', 'Threat Detection', 'Incident Response'],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <div className="app-shell">
          {/* Global top navigation */}
          <TopBar />

          {/* Body: sidebar + main content */}
          <div className="app-body">
            <Sidebar />
            <main className="main-content">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
