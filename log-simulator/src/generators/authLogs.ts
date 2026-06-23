import { SecurityLogEntry } from '../types/log';
import { BENIGN_USERNAMES } from '../utils/constants';
import { randomElement, randomInt, randomChance } from '../utils/random';
import { generateInternalIp } from '../utils/ipGenerator';

/**
 * Generates a benign authentication log entry.
 */
export function generateAuthLog(): SecurityLogEntry {
  const timestamp = new Date();
  const user = randomElement(BENIGN_USERNAMES);
  const ip = generateInternalIp();
  const port = randomInt(32768, 61000);
  const pid = randomInt(1000, 9999);
  
  // Format standard date format for syslog: "MMM DD HH:mm:ss"
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthStr = months[timestamp.getMonth()];
  const dateStr = String(timestamp.getDate()).padStart(2, ' ');
  const timeStr = timestamp.toTimeString().split(' ')[0];
  const syslogTimestamp = `${monthStr} ${dateStr} ${timeStr}`;

  const events = [
    // SSH Public Key success
    () => {
      const msg = `${syslogTimestamp} soc-server sshd[${pid}]: Accepted publickey for ${user} from ${ip} port ${port} ssh2`;
      return {
        timestamp,
        source: 'auth',
        logLevel: 'INFO' as const,
        message: msg,
        details: { user, client_ip: ip, port, service: 'sshd', auth_method: 'publickey', pid }
      };
    },
    // SSH Password success
    () => {
      const msg = `${syslogTimestamp} soc-server sshd[${pid}]: Accepted password for ${user} from ${ip} port ${port} ssh2`;
      return {
        timestamp,
        source: 'auth',
        logLevel: 'INFO' as const,
        message: msg,
        details: { user, client_ip: ip, port, service: 'sshd', auth_method: 'password', pid }
      };
    },
    // PAM Session open
    () => {
      const msg = `${syslogTimestamp} soc-server systemd-logind[${pid}]: New session 123 of user ${user}.`;
      return {
        timestamp,
        source: 'auth',
        logLevel: 'INFO' as const,
        message: msg,
        details: { user, service: 'systemd-logind', pid, event: 'session_open' }
      };
    },
    // Sudo session open
    () => {
      const cmd = randomChance(0.5) ? 'apt-get update' : 'systemctl restart nginx';
      const msg = `${syslogTimestamp} soc-server sudo:   ${user} : TTY=pts/1 ; PWD=/home/${user} ; USER=root ; COMMAND=${cmd}`;
      return {
        timestamp,
        source: 'auth',
        logLevel: 'INFO' as const,
        message: msg,
        details: { user, service: 'sudo', event: 'command_execution', command: cmd, run_as: 'root' }
      };
    }
  ];

  return randomElement(events)();
}
