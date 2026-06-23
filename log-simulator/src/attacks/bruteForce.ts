import { SecurityLogEntry } from '../types/log';
import { generateExternalIp } from '../utils/ipGenerator';
import { randomElement, randomInt, randomChance } from '../utils/random';
import { USERNAMES } from '../utils/constants';

/**
 * Simulates an SSH brute-force attack sequence.
 * Returns an array of security log entries representing the attack.
 */
export function simulateBruteForce(): SecurityLogEntry[] {
  const logs: SecurityLogEntry[] = [];
  const attackerIp = generateExternalIp();
  const targetUser = randomElement(USERNAMES);
  const attemptsCount = randomInt(6, 12);
  const baseTime = new Date();

  // Create sequence of failed attempts spaced out by 1-3 seconds
  for (let i = 0; i < attemptsCount; i++) {
    const timestamp = new Date(baseTime.getTime() + i * randomInt(1000, 3000));
    const port = randomInt(32768, 61000);
    const pid = randomInt(1000, 9999);
    
    // Format syslog date: "MMM DD HH:mm:ss"
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthStr = months[timestamp.getMonth()];
    const dateStr = String(timestamp.getDate()).padStart(2, ' ');
    const timeStr = timestamp.toTimeString().split(' ')[0];
    const syslogTimestamp = `${monthStr} ${dateStr} ${timeStr}`;

    const msg = `${syslogTimestamp} soc-server sshd[${pid}]: Failed password for ${targetUser} from ${attackerIp} port ${port} ssh2`;

    logs.push({
      timestamp,
      source: 'auth',
      logLevel: 'WARNING',
      message: msg,
      details: {
        user: targetUser,
        client_ip: attackerIp,
        port,
        service: 'sshd',
        event: 'failed_login',
        pid
      }
    });
  }

  // 50% chance of successful compromise in the end
  if (randomChance(0.5)) {
    const finalIndex = attemptsCount;
    const timestamp = new Date(baseTime.getTime() + finalIndex * randomInt(1000, 3000));
    const port = randomInt(32768, 61000);
    const pid = randomInt(1000, 9999);

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthStr = months[timestamp.getMonth()];
    const dateStr = String(timestamp.getDate()).padStart(2, ' ');
    const timeStr = timestamp.toTimeString().split(' ')[0];
    const syslogTimestamp = `${monthStr} ${dateStr} ${timeStr}`;

    const msg = `${syslogTimestamp} soc-server sshd[${pid}]: Accepted password for ${targetUser} from ${attackerIp} port ${port} ssh2`;

    logs.push({
      timestamp,
      source: 'auth',
      logLevel: 'CRITICAL',
      message: msg,
      details: {
        user: targetUser,
        client_ip: attackerIp,
        port,
        service: 'sshd',
        event: 'successful_login_compromise',
        pid
      }
    });
  }

  return logs;
}
