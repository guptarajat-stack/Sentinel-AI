export interface GeoData {
  country: string;
  countryCode: string;
  city: string;
  lat: number;
  lon: number;
  isp: string;
}

export interface SecurityLogDetails extends Record<string, any> {
  // Common details properties
  user?: string;
  client_ip?: string;
  src_ip?: string;
  dst_ip?: string;
  port?: number;
  dst_port?: number;
  proto?: string;
  action?: string;
  bytes?: number;
  request?: string;
  status_code?: number;
  user_agent?: string;
  rule_id?: string;
  process?: string;
  pid?: number;
  event?: string;
  service?: string;
  geo?: GeoData;
}

export interface SecurityLogEntry {
  timestamp: Date;
  source: string;
  logLevel: 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  message: string;
  details: SecurityLogDetails;
}

export interface SimulationConfig {
  benignIntervalMs: number;
  attackIntervalMinutes: number;
  enableDatabase: boolean;
  enableStdout: boolean;
  chaosFactor: number; // 0 (calm) to 1 (pure chaos)
}
