"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateGeoData = void 0;
exports.simulateSuspiciousLogin = simulateSuspiciousLogin;
const ipGenerator_1 = require("../utils/ipGenerator");
const geoGenerator_1 = require("../utils/geoGenerator");
Object.defineProperty(exports, "generateGeoData", { enumerable: true, get: function () { return geoGenerator_1.generateGeoData; } });
const random_1 = require("../utils/random");
const constants_1 = require("../utils/constants");
/**
 * Simulates suspicious login activities (e.g., impossible travel or anomalous location logins).
 * Returns an array of security log entries representing the attack.
 */
function simulateSuspiciousLogin() {
    const logs = [];
    const baseTime = new Date();
    const user = (0, random_1.randomElement)(constants_1.BENIGN_USERNAMES);
    // Impossible Travel Scenario:
    // Login 1: US location (e.g. New York)
    const ip1 = '198.51.100.42'; // Static US-like IP
    const geo1 = {
        country: 'United States',
        countryCode: 'US',
        city: 'New York',
        lat: 40.7128,
        lon: -74.0060,
        isp: 'Comcast Cable'
    };
    const pid1 = (0, random_1.randomInt)(1000, 9999);
    const time1 = new Date(baseTime.getTime() - 10 * 60 * 1000); // 10 minutes ago
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const getSyslogHeader = (time) => {
        const monthStr = months[time.getMonth()];
        const dateStr = String(time.getDate()).padStart(2, ' ');
        const timeStr = time.toTimeString().split(' ')[0];
        return `${monthStr} ${dateStr} ${timeStr}`;
    };
    const msg1 = `${getSyslogHeader(time1)} soc-server sshd[${pid1}]: Accepted password for ${user} from ${ip1} port ${(0, random_1.randomInt)(32000, 61000)} ssh2`;
    logs.push({
        timestamp: time1,
        source: 'auth',
        logLevel: 'INFO',
        message: msg1,
        details: { user, client_ip: ip1, port: (0, random_1.randomInt)(32000, 61000), service: 'sshd', auth_method: 'password', pid: pid1, geo: geo1 }
    });
    // Login 2: 5 minutes later from Russia or North Korea (Impossible travel)
    const ip2 = (0, ipGenerator_1.generateExternalIp)();
    // Ensure we get Russia or North Korea or another foreign template
    let geo2 = (0, geoGenerator_1.generateGeoData)(ip2);
    if (geo2.countryCode === 'US') {
        // Override to ensure impossible travel/suspicious geo
        geo2 = {
            country: 'Russia',
            countryCode: 'RU',
            city: 'Moscow',
            lat: 55.7558,
            lon: 37.6173,
            isp: 'Rostelecom'
        };
    }
    const pid2 = (0, random_1.randomInt)(1000, 9999);
    const time2 = new Date(time1.getTime() + 5 * 60 * 1000); // 5 minutes after Login 1
    const msg2 = `${getSyslogHeader(time2)} soc-server sshd[${pid2}]: Accepted password for ${user} from ${ip2} port ${(0, random_1.randomInt)(32000, 61000)} ssh2`;
    logs.push({
        timestamp: time2,
        source: 'auth',
        logLevel: 'CRITICAL',
        message: msg2,
        details: {
            user,
            client_ip: ip2,
            port: (0, random_1.randomInt)(32000, 61000),
            service: 'sshd',
            auth_method: 'password',
            pid: pid2,
            geo: geo2,
            event: 'impossible_travel_detected',
            notes: `User logged in from US (New York) and Russia (Moscow) within 5 minutes.`
        }
    });
    return logs;
}
