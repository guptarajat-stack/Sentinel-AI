"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.simulatePortScan = simulatePortScan;
const ipGenerator_1 = require("../utils/ipGenerator");
const random_1 = require("../utils/random");
const constants_1 = require("../utils/constants");
/**
 * Simulates a port scan attack sequence.
 * Returns an array of firewall logs representing rejected connections on multiple ports.
 */
function simulatePortScan() {
    const logs = [];
    const attackerIp = (0, ipGenerator_1.generateExternalIp)();
    const targetIp = '192.168.1.10'; // Internal DMZ server
    const baseTime = new Date();
    // Select 6-10 ports to scan
    const portsToScan = (0, random_1.randomSample)(constants_1.COMMON_PORTS, (0, random_1.randomInt)(6, 10)).map(p => p.port);
    portsToScan.forEach((port, idx) => {
        // Spacer: nmap scans ports very fast (milliseconds apart)
        const timestamp = new Date(baseTime.getTime() + idx * (0, random_1.randomInt)(50, 200));
        // Format: "YYYY-MM-DD HH:mm:ss"
        const formattedDate = timestamp.toISOString().replace('T', ' ').substring(0, 19);
        // Most common port scan behavior blocks/rejects traffic
        const action = 'REJECT';
        const spt = (0, random_1.randomInt)(49152, 65535);
        const msg = `${formattedDate} fw-gateway-1: src=${attackerIp} dst=${targetIp} proto=TCP spt=${spt} dpt=${port} action=${action} bytes=0`;
        logs.push({
            timestamp,
            source: 'firewall',
            logLevel: 'WARNING',
            message: msg,
            details: {
                src_ip: attackerIp,
                dst_ip: targetIp,
                proto: 'TCP',
                port,
                dst_port: port,
                action,
                bytes: 0
            }
        });
    });
    return logs;
}
