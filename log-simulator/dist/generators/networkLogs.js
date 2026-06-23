"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateNetworkLog = generateNetworkLog;
const ipGenerator_1 = require("../utils/ipGenerator");
const random_1 = require("../utils/random");
const constants_1 = require("../utils/constants");
/**
 * Generates a benign firewall/network connection log entry.
 */
function generateNetworkLog() {
    const timestamp = new Date();
    // Format: "YYYY-MM-DD HH:mm:ss"
    const formattedDate = timestamp.toISOString().replace('T', ' ').substring(0, 19);
    const isOutbound = Math.random() > 0.3;
    const srcIp = isOutbound ? (0, ipGenerator_1.generateInternalIp)() : (0, ipGenerator_1.generateExternalIp)();
    const dstIp = isOutbound ? (0, ipGenerator_1.generateExternalIp)() : (0, ipGenerator_1.generateInternalIp)();
    const portMapping = (0, random_1.randomElement)(constants_1.COMMON_PORTS);
    const dstPort = portMapping.port;
    const proto = 'TCP';
    const spt = (0, random_1.randomInt)(49152, 65535);
    // Mostly ALLOW, some REJECT (for unusual/blocked ports)
    const action = (0, random_1.weightedRandom)(['ALLOW', 'REJECT'], [0.95, 0.05]);
    const bytes = action === 'ALLOW' ? (0, random_1.randomInt)(64, 15000) : 0;
    const msg = `${formattedDate} fw-gateway-1: src=${srcIp} dst=${dstIp} proto=${proto} spt=${spt} dpt=${dstPort} action=${action} bytes=${bytes}`;
    return {
        timestamp,
        source: 'firewall',
        logLevel: action === 'REJECT' ? 'WARNING' : 'INFO',
        message: msg,
        details: {
            src_ip: srcIp,
            dst_ip: dstIp,
            proto,
            port: dstPort,
            dst_port: dstPort,
            action,
            bytes
        }
    };
}
