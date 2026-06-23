import { SecurityLogEntry } from '../types/log';
import { generateExternalIp } from '../utils/ipGenerator';
import { randomElement } from '../utils/random';
import { XSS_PAYLOADS, MALICIOUS_USER_AGENTS } from '../utils/constants';

/**
 * Simulates Cross-Site Scripting (XSS) attack logs.
 * Returns an array of security log entries representing the attack.
 */
export function simulateXss(): SecurityLogEntry[] {
  const logs: SecurityLogEntry[] = [];
  const attackerIp = generateExternalIp();
  const baseTime = new Date();
  const payload = randomElement(XSS_PAYLOADS);
  const userAgent = randomElement(MALICIOUS_USER_AGENTS);

  // WAF Block Log for XSS
  const details = {
    client_ip: attackerIp,
    request: `POST /api/v1/comments?text=${encodeURIComponent(payload)} HTTP/1.1`,
    action: 'BLOCKED',
    rule_id: '941100', // ModSecurity XSS rule
    status_code: 403,
    user_agent: userAgent
  };

  const wafMessage = JSON.stringify({
    timestamp: baseTime.toISOString(),
    source: 'nginx-waf',
    level: 'WARNING',
    ...details
  });

  logs.push({
    timestamp: baseTime,
    source: 'nginx-waf',
    logLevel: 'CRITICAL',
    message: wafMessage,
    details
  });

  return logs;
}
