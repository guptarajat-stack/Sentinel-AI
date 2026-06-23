import { GeoData } from '../types/log';
import { randomElement } from './random';

interface GeoTemplate {
  country: string;
  countryCode: string;
  cities: Array<{ name: string; lat: number; lon: number }>;
  isps: string[];
}

const GEO_TEMPLATES: GeoTemplate[] = [
  {
    country: 'United States',
    countryCode: 'US',
    cities: [
      { name: 'New York', lat: 40.7128, lon: -74.0060 },
      { name: 'San Francisco', lat: 37.7749, lon: -122.4194 },
      { name: 'Washington D.C.', lat: 38.9072, lon: -77.0369 },
      { name: 'Chicago', lat: 41.8781, lon: -87.6298 },
    ],
    isps: ['Comcast Cable', 'Verizon Fios', 'AT&T Internet', 'Amazon Web Services', 'DigitalOcean'],
  },
  {
    country: 'China',
    countryCode: 'CN',
    cities: [
      { name: 'Beijing', lat: 39.9042, lon: 116.4074 },
      { name: 'Shanghai', lat: 31.2304, lon: 121.4737 },
      { name: 'Guangzhou', lat: 23.1291, lon: 113.2644 },
    ],
    isps: ['China Telecom', 'China Unicom', 'Alibaba Cloud'],
  },
  {
    country: 'Russia',
    countryCode: 'RU',
    cities: [
      { name: 'Moscow', lat: 55.7558, lon: 37.6173 },
      { name: 'Saint Petersburg', lat: 59.9343, lon: 30.3351 },
    ],
    isps: ['Rostelecom', 'Megafon', 'Yandex Cloud'],
  },
  {
    country: 'Germany',
    countryCode: 'DE',
    cities: [
      { name: 'Frankfurt', lat: 50.1109, lon: 8.6821 },
      { name: 'Berlin', lat: 52.5200, lon: 13.4050 },
    ],
    isps: ['Deutsche Telekom', 'Vodafone Germany', 'Hetzner Online'],
  },
  {
    country: 'Japan',
    countryCode: 'JP',
    cities: [
      { name: 'Tokyo', lat: 35.6762, lon: 139.6503 },
      { name: 'Osaka', lat: 34.6937, lon: 135.5023 },
    ],
    isps: ['NTT Communications', 'KDDI Corporation', 'Softbank'],
  },
  {
    country: 'United Kingdom',
    countryCode: 'GB',
    cities: [
      { name: 'London', lat: 51.5074, lon: -0.1278 },
      { name: 'Manchester', lat: 53.4808, lon: -2.2426 },
    ],
    isps: ['British Telecommunications', 'Virgin Media', 'M25 Group'],
  },
  {
    country: 'Brazil',
    countryCode: 'BR',
    cities: [
      { name: 'São Paulo', lat: -23.5505, lon: -46.6333 },
      { name: 'Rio de Janeiro', lat: -22.9068, lon: -43.1729 },
    ],
    isps: ['Claro Brazil', 'Vivo', 'Telefonica Brasil'],
  },
  {
    country: 'North Korea',
    countryCode: 'KP',
    cities: [
      { name: 'Pyongyang', lat: 39.0392, lon: 125.7625 },
    ],
    isps: ['Star Joint Venture'],
  },
];

// In-memory cache for IP geo assignments to ensure stability
const ipGeoCache = new Map<string, GeoData>();

/**
 * Generates geographic data for a given IP.
 * Uses a cache to ensure the same IP always resolves to the same geolocation.
 */
export function generateGeoData(ip: string): GeoData {
  if (ipGeoCache.has(ip)) {
    return ipGeoCache.get(ip)!;
  }

  const template = randomElement(GEO_TEMPLATES);
  const cityInfo = randomElement(template.cities);
  
  const geoData: GeoData = {
    country: template.country,
    countryCode: template.countryCode,
    city: cityInfo.name,
    lat: cityInfo.lat,
    lon: cityInfo.lon,
    isp: randomElement(template.isps),
  };

  ipGeoCache.set(ip, geoData);
  return geoData;
}
