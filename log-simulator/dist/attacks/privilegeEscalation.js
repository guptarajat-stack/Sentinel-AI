"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.simulatePrivilegeEscalation = simulatePrivilegeEscalation;
const random_1 = require("../utils/random");
const constants_1 = require("../utils/constants");
/**
 * Simulates system privilege escalation attack logs.
 * Returns an array of security log entries representing the attack.
 */
function simulatePrivilegeEscalation() {
    const logs = [];
    const baseTime = new Date();
    const user = (0, random_1.randomElement)(constants_1.BENIGN_USERNAMES);
    const pid = (0, random_1.randomInt)(5000, 32000);
    // Format standard date format for syslog: "MMM DD HH:mm:ss"
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const getSyslogHeader = (time) => {
        const monthStr = months[time.getMonth()];
        const dateStr = String(time.getDate()).padStart(2, ' ');
        const timeStr = time.toTimeString().split(' ')[0];
        return `${monthStr} ${dateStr} ${timeStr}`;
    };
    // Step 1: Failed sudo attempts
    const time1 = new Date(baseTime.getTime());
    const msg1 = `${getSyslogHeader(time1)} soc-server sudo:   ${user} : 1 incorrect password attempt ; TTY=pts/2 ; PWD=/home/${user} ; USER=root ; COMMAND=/bin/bash`;
    logs.push({
        timestamp: time1,
        source: 'auth',
        logLevel: 'WARNING',
        message: msg1,
        details: { user, service: 'sudo', event: 'failed_escalation', run_as: 'root', command: '/bin/bash' }
    });
    // Step 2: Sudo success (compromised)
    const time2 = new Date(baseTime.getTime() + (0, random_1.randomInt)(5000, 10000));
    const msg2 = `${getSyslogHeader(time2)} soc-server sudo:   ${user} : TTY=pts/2 ; PWD=/home/${user} ; USER=root ; COMMAND=/bin/bash`;
    logs.push({
        timestamp: time2,
        source: 'auth',
        logLevel: 'CRITICAL',
        message: msg2,
        details: { user, service: 'sudo', event: 'successful_escalation', run_as: 'root', command: '/bin/bash' }
    });
    // Step 3: Execution of malicious commands (as root)
    const suspiciousCommand = (0, random_1.randomElement)(constants_1.SUSPICIOUS_COMMANDS);
    const time3 = new Date(time2.getTime() + (0, random_1.randomInt)(1000, 3000));
    const msg3 = `${getSyslogHeader(time3)} soc-server shell-audit[${pid}]: user=root cmd="${suspiciousCommand}"`;
    logs.push({
        timestamp: time3,
        source: 'system',
        logLevel: 'CRITICAL',
        message: msg3,
        details: { process: 'shell-audit', pid, event: 'suspicious_command', user: 'root', command: suspiciousCommand }
    });
    return logs;
}
