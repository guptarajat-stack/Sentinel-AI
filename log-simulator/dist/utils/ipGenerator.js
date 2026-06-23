"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateInternalIp = generateInternalIp;
exports.generateExternalIp = generateExternalIp;
const random_1 = require("./random");
/**
 * Generates a random private IP (RFC1918).
 */
function generateInternalIp() {
    const subnets = [
        () => `192.168.${(0, random_1.randomInt)(0, 255)}.${(0, random_1.randomInt)(1, 254)}`,
        () => `10.${(0, random_1.randomInt)(0, 255)}.${(0, random_1.randomInt)(0, 255)}.${(0, random_1.randomInt)(1, 254)}`,
        () => `172.${(0, random_1.randomInt)(16, 31)}.${(0, random_1.randomInt)(0, 255)}.${(0, random_1.randomInt)(1, 254)}`,
    ];
    return (0, random_1.randomElement)(subnets)();
}
/**
 * Generates a random public IP (excluding private and loopback ranges).
 */
function generateExternalIp() {
    while (true) {
        const octet1 = (0, random_1.randomInt)(1, 223);
        // Skip loopback (127.x.x.x) and private ranges (10.x.x.x)
        if (octet1 === 127 || octet1 === 10)
            continue;
        // Skip 172.16-31.x.x
        if (octet1 === 172) {
            const octet2 = (0, random_1.randomInt)(0, 255);
            if (octet2 >= 16 && octet2 <= 31)
                continue;
        }
        // Skip 192.168.x.x
        if (octet1 === 192) {
            const octet2 = (0, random_1.randomInt)(168, 168);
            if (octet2 === 168)
                continue;
        }
        return `${octet1}.${(0, random_1.randomInt)(0, 255)}.${(0, random_1.randomInt)(0, 255)}.${(0, random_1.randomInt)(1, 254)}`;
    }
}
