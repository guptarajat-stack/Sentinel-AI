import { SecurityLogEntry } from '../types/log';
import { randomElement, randomInt } from '../utils/random';
import { SYSTEM_PROCESSES, BENIGN_COMMANDS } from '../utils/constants';

/**
 * Generates a benign system/OS/process log entry.
 */
export function generateSystemLog(): SecurityLogEntry {
  const timestamp = new Date();
  const pid = randomInt(1, 32768);
  
  // Format standard date format for syslog: "MMM DD HH:mm:ss"
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthStr = months[timestamp.getMonth()];
  const dateStr = String(timestamp.getDate()).padStart(2, ' ');
  const timeStr = timestamp.toTimeString().split(' ')[0];
  const syslogTimestamp = `${monthStr} ${dateStr} ${timeStr}`;

  const events = [
    // Cron job execution
    () => {
      const msg = `${syslogTimestamp} soc-server cron[${pid}]: (root) CMD (run-parts /etc/cron.hourly)`;
      return {
        timestamp,
        source: 'system',
        logLevel: 'INFO' as const,
        message: msg,
        details: { process: 'cron', pid, event: 'cron_job_executed', cmd: 'run-parts /etc/cron.hourly' }
      };
    },
    // Systemd service change
    () => {
      const service = randomElement(['nginx', 'postgresql', 'docker', 'ssh']);
      const status = randomElement(['Started', 'Stopped', 'Reloaded']);
      const msg = `${syslogTimestamp} soc-server systemd[1]: ${status} ${service.toUpperCase()} service.`;
      return {
        timestamp,
        source: 'system',
        logLevel: 'INFO' as const,
        message: msg,
        details: { process: 'systemd', pid: 1, event: `service_${status.toLowerCase()}`, service_name: service }
      };
    },
    // System command audit (e.g. from user shell execution)
    () => {
      const cmd = randomElement(BENIGN_COMMANDS);
      const user = randomElement(['alice', 'bob', 'charlie']);
      const msg = `${syslogTimestamp} soc-server shell-audit[${pid}]: user=${user} cmd="${cmd}"`;
      return {
        timestamp,
        source: 'system',
        logLevel: 'INFO' as const,
        message: msg,
        details: { process: 'shell-audit', pid, event: 'command_run', user, command: cmd }
      };
    },
    // Kernel packet drop or hardware message
    () => {
      const msg = `${syslogTimestamp} soc-server kernel: [${randomInt(1000, 999999)}.123456] EXT4-fs (sda1): re-mounted. Opts: errors=remount-ro`;
      return {
        timestamp,
        source: 'system',
        logLevel: 'INFO' as const,
        message: msg,
        details: { process: 'kernel', event: 'hardware_info', dev: 'sda1' }
      };
    }
  ];

  return randomElement(events)();
}
