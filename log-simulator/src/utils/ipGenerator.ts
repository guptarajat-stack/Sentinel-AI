import { randomInt, randomElement } from './random';

/**
 * Generates a random private IP (RFC1918).
 */
export function generateInternalIp(): string {
  const subnets = [
    () => `192.168.${randomInt(0, 255)}.${randomInt(1, 254)}`,
    () => `10.${randomInt(0, 255)}.${randomInt(0, 255)}.${randomInt(1, 254)}`,
    () => `172.${randomInt(16, 31)}.${randomInt(0, 255)}.${randomInt(1, 254)}`,
  ];
  return randomElement(subnets)();
}

/**
 * Generates a random public IP (excluding private and loopback ranges).
 */
export function generateExternalIp(): string {
  while (true) {
    const octet1 = randomInt(1, 223);
    // Skip loopback (127.x.x.x) and private ranges (10.x.x.x)
    if (octet1 === 127 || octet1 === 10) continue;
    // Skip 172.16-31.x.x
    if (octet1 === 172) {
      const octet2 = randomInt(0, 255);
      if (octet2 >= 16 && octet2 <= 31) continue;
    }
    // Skip 192.168.x.x
    if (octet1 === 192) {
      const octet2 = randomInt(168, 168);
      if (octet2 === 168) continue;
    }
    
    return `${octet1}.${randomInt(0, 255)}.${randomInt(0, 255)}.${randomInt(1, 254)}`;
  }
}
