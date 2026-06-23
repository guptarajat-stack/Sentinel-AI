import { SecurityLogEntry } from '../types/log';
import { generateInternalIp, generateExternalIp } from '../utils/ipGenerator';
import { randomElement, randomInt, weightedRandom } from '../utils/random';
import { COMMON_PORTS } from '../utils/constants';

/**
 * Generates a benign firewall/network connection log entry.
 */
export function generateNetworkLog(): SecurityLogEntry {
  const timestamp = new Date();
  
  // Format: "YYYY-MM-DD HH:mm:ss"
  const formattedDate = timestamp.toISOString().replace('T', ' ').substring(0, 19);

  const isOutbound = Math.random() > 0.3;
  const srcIp = isOutbound ? generateInternalIp() : generateExternalIp();
  const dstIp = isOutbound ? generateExternalIp() : generateInternalIp();
  
  const portMapping = randomElement(COMMON_PORTS);
  const dstPort = portMapping.port;
  const proto = 'TCP';
  const spt = randomInt(49152, 65535);

  // Mostly ALLOW, some REJECT (for unusual/blocked ports)
  const action = weightedRandom(['ALLOW', 'REJECT'], [0.95, 0.05]);
  const bytes = action === 'ALLOW' ? randomInt(64, 15000) : 0;

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
