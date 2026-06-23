import { SecurityLogEntry } from '../types/log';
import { generateExternalIp } from '../utils/ipGenerator';
import { randomElement, randomInt } from '../utils/random';
import { SQLI_PAYLOADS, MALICIOUS_USER_AGENTS } from '../utils/constants';

/**
 * Simulates SQL Injection attack logs.
 * Returns an array of security log entries representing the attack.
 */
export function simulateSqlInjection(): SecurityLogEntry[] {
  const logs: SecurityLogEntry[] = [];
  const attackerIp = generateExternalIp();
  const baseTime = new Date();
  const payload = randomElement(SQLI_PAYLOADS);
  const userAgent = randomElement(MALICIOUS_USER_AGENTS);

  // WAF Block Log
  const details = {
    client_ip: attackerIp,
    request: `GET /api/v1/auth/login?user=${encodeURIComponent(payload)} HTTP/1.1`,
    action: 'BLOCKED',
    rule_id: '942100', // ModSecurity SQLi rule
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
    logLevel: 'CRITICAL', // mapped to WARNING/HIGH in detection rules
    message: wafMessage,
    details
  });

  // DB audit log showing statement block (optional but nice details)
  const dbTime = new Date(baseTime.getTime() + 100);
  const formattedDbDate = dbTime.toISOString().replace('T', ' ').replace('Z', ' UTC').substring(0, 23);
  const dbPid = randomInt(100, 32000);
  const dbMsg = `${formattedDbDate} [${dbPid}] postgres@ai_security_soc LOG:  statement: SELECT * FROM "User" WHERE email = '${payload}';`;

  logs.push({
    timestamp: dbTime,
    source: 'database',
    logLevel: 'WARNING',
    message: dbMsg,
    details: {
      process: 'postgres',
      pid: dbPid,
      event: 'query_execution_error',
      db_user: 'postgres',
      db_name: 'ai_security_soc',
      query: `SELECT * FROM "User" WHERE email = '${payload}';`,
      error_message: 'syntax error or SQL injection attempt blocked'
    }
  });

  return logs;
}
