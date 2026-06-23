"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.simulateXss = simulateXss;
const ipGenerator_1 = require("../utils/ipGenerator");
const random_1 = require("../utils/random");
const constants_1 = require("../utils/constants");
/**
 * Simulates Cross-Site Scripting (XSS) attack logs.
 * Returns an array of security log entries representing the attack.
 */
function simulateXss() {
    const logs = [];
    const attackerIp = (0, ipGenerator_1.generateExternalIp)();
    const baseTime = new Date();
    const payload = (0, random_1.randomElement)(constants_1.XSS_PAYLOADS);
    const userAgent = (0, random_1.randomElement)(constants_1.MALICIOUS_USER_AGENTS);
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
