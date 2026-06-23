import { SecurityLogEntry } from '../types/log';
import { generateExternalIp, generateInternalIp } from '../utils/ipGenerator';
import { randomElement, randomInt, weightedRandom } from '../utils/random';
import { USER_AGENTS } from '../utils/constants';

const WEB_PATHS = [
  '/', '/index.html', '/about', '/contact', '/login', '/register',
  '/api/v1/health', '/api/v1/auth/login', '/api/v1/incidents', '/api/v1/users/profile',
  '/assets/logo.png', '/assets/main.css', '/assets/bundle.js', '/favicon.ico'
];

const WEB_METHODS = ['GET', 'POST', 'PUT', 'DELETE'];

/**
 * Generates a benign web server access or WAF log entry.
 */
export function generateWebLog(): SecurityLogEntry {
  const timestamp = new Date();
  const clientIp = Math.random() > 0.1 ? generateExternalIp() : generateInternalIp();
  const method = weightedRandom(WEB_METHODS, [0.8, 0.15, 0.03, 0.02]);
  const path = randomElement(WEB_PATHS);
  const status = weightedRandom([200, 302, 404, 500], [0.9, 0.07, 0.02, 0.01]);
  const bytes = status === 200 ? randomInt(150, 85000) : randomInt(0, 500);
  const userAgent = randomElement(USER_AGENTS);

  // Format date for Nginx: "DD/MMM/YYYY:HH:mm:ss +0000"
  const day = String(timestamp.getUTCDate()).padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[timestamp.getUTCMonth()];
  const year = timestamp.getUTCFullYear();
  const hours = String(timestamp.getUTCHours()).padStart(2, '0');
  const mins = String(timestamp.getUTCMinutes()).padStart(2, '0');
  const secs = String(timestamp.getUTCSeconds()).padStart(2, '0');
  const nginxDate = `${day}/${month}/${year}:${hours}:${mins}:${secs} +0000`;

  const isNginxAccess = Math.random() > 0.3;

  if (isNginxAccess) {
    const message = `${clientIp} - - [${nginxDate}] "${method} ${path} HTTP/1.1" ${status} ${bytes} "${userAgent}"`;
    return {
      timestamp,
      source: 'web-access',
      logLevel: status >= 500 ? 'ERROR' : status >= 400 ? 'WARNING' : 'INFO',
      message,
      details: {
        client_ip: clientIp,
        request: `${method} ${path} HTTP/1.1`,
        status_code: status,
        bytes,
        user_agent: userAgent,
        action: 'ALLOWED'
      }
    };
  } else {
    // JSON WAF / app logs
    const wafDate = timestamp.toISOString();
    const details = {
      client_ip: clientIp,
      request: `${method} ${path} HTTP/1.1`,
      action: 'PASSED',
      rule_id: '000000',
      status_code: status,
      user_agent: userAgent
    };
    const message = JSON.stringify({
      timestamp: wafDate,
      source: 'nginx-waf',
      level: 'INFO',
      ...details
    });

    return {
      timestamp,
      source: 'nginx-waf',
      logLevel: 'INFO',
      message,
      details
    };
  }
}
