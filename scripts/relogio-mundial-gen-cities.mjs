// scripts/relogio-mundial-gen-cities.mjs
// Gerador da base de cidades do painel Relógio Mundial.
// @version 1.0.0  @created 2026-07-30
//
// COMO RODAR (precisa de rede, baixa ~5 MB de Natural Earth):
//   cd /tmp && curl -sfLO https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_populated_places_simple.geojson
//   node /var/www/dshowdash/scripts/relogio-mundial-gen-cities.mjs
//
// Entradas esperadas no MESMO diretório de execução:
//   cities-raw.json   — [[id,nome,país,tz,lat,lng], …] (a lista curada)
//   pp10.geojson      — ne_10m_populated_places_simple
// Saída: cities-enriched.json, que vira src/data/cities.ts.
//
// A saída é COMMITADA; este script não roda em build nem em produção. Ele existe para
// que a base de 157 cidades seja reproduzível em vez de um blob editado à mão.


import fs from 'node:fs';

const RAW = JSON.parse(fs.readFileSync(new URL('./cities-raw.json', import.meta.url), 'utf8'));
const NE = JSON.parse(fs.readFileSync(new URL('./pp10.geojson', import.meta.url), 'utf8'));

const places = NE.features.map((f) => ({
  lng: f.geometry.coordinates[0],
  lat: f.geometry.coordinates[1],
  pop: f.properties.pop_max || f.properties.pop_min || 0,
  cc: f.properties.iso_a2,
  name: f.properties.nameascii,
}));

function nearest(lat, lng) {
  let best = null;
  let bestD = Infinity;
  for (const p of places) {
    const dLat = p.lat - lat;
    const dLng = (p.lng - lng) * Math.cos((lat * Math.PI) / 180);
    const d = dLat * dLat + dLng * dLng;
    if (d < bestD) { bestD = d; best = p; }
  }
  // ~0.6° de tolerância: além disso o casamento é ruído, não a mesma cidade.
  return bestD < 0.36 ? best : null;
}

// Curadoria: região do painel analítico, bolsa e aeroporto principal.
const REGION = {
  'America/': 'americas', 'Atlantic/Reykjavik': 'europa', 'Europe/': 'europa',
  'Africa/': 'africa', 'Asia/': 'asia', 'Australia/': 'oceania', 'Pacific/': 'oceania',
};
function regionOf(tz) {
  if (tz.startsWith('Australia/') || tz.startsWith('Pacific/')) return 'oceania';
  if (tz.startsWith('Atlantic/')) return 'europa';
  for (const k of Object.keys(REGION)) if (tz.startsWith(k)) return REGION[k];
  return 'americas';
}

const EXCHANGE = {
  'sao-paulo': 'b3', 'new-york': 'nyse', 'chicago': 'cme', 'toronto': 'tsx',
  'mexico-city': 'bmv', 'london': 'lse', 'paris': 'euronext', 'amsterdam': 'euronext-am',
  'frankfurt': 'fwb', 'berlin': 'fwb', 'zurich': 'six', 'madrid': 'bme', 'milan': 'borsa-it',
  'stockholm': 'omx', 'moscow': 'moex', 'istanbul': 'bist', 'johannesburg': 'jse',
  'dubai': 'dfm', 'riyadh': 'tadawul', 'tel-aviv': 'tase', 'jerusalem': 'tase',
  'mumbai': 'bse', 'new-delhi': 'nse', 'shanghai': 'sse', 'shenzhen': 'szse',
  'beijing': 'sse', 'hong-kong': 'hkex', 'taipei': 'twse', 'tokyo': 'jpx', 'osaka': 'jpx',
  'seoul': 'krx', 'singapore': 'sgx', 'sydney': 'asx', 'melbourne': 'asx',
};

const AIRPORT = {
  'sao-paulo': 'GRU', 'rio-de-janeiro': 'GIG', 'brasilia': 'BSB', 'manaus': 'MAO',
  'buenos-aires': 'EZE', 'santiago': 'SCL', 'lima': 'LIM', 'bogota': 'BOG',
  'caracas': 'CCS', 'montevideo': 'MVD', 'la-paz': 'LPB', 'asuncion': 'ASU', 'quito': 'UIO',
  'new-york': 'JFK', 'los-angeles': 'LAX', 'chicago': 'ORD', 'denver': 'DEN',
  'miami': 'MIA', 'san-francisco': 'SFO', 'washington': 'IAD', 'toronto': 'YYZ',
  'vancouver': 'YVR', 'mexico-city': 'MEX', 'havana': 'HAV', 'panama': 'PTY',
  'guatemala': 'GUA', 'anchorage': 'ANC', 'honolulu': 'HNL',
  'london': 'LHR', 'paris': 'CDG', 'berlin': 'BER', 'madrid': 'MAD', 'rome': 'FCO',
  'lisbon': 'LIS', 'amsterdam': 'AMS', 'brussels': 'BRU', 'zurich': 'ZRH', 'vienna': 'VIE',
  'dublin': 'DUB', 'stockholm': 'ARN', 'oslo': 'OSL', 'copenhagen': 'CPH', 'helsinki': 'HEL',
  'warsaw': 'WAW', 'prague': 'PRG', 'budapest': 'BUD', 'athens': 'ATH', 'bucharest': 'OTP',
  'kyiv': 'KBP', 'moscow': 'SVO', 'istanbul': 'IST', 'reykjavik': 'KEF',
  'johannesburg': 'JNB', 'cape-town': 'CPT', 'cairo': 'CAI', 'lagos': 'LOS',
  'nairobi': 'NBO', 'casablanca': 'CMN', 'addis-ababa': 'ADD', 'accra': 'ACC',
  'algiers': 'ALG', 'dakar': 'DSS', 'kinshasa': 'FIH', 'luanda': 'LAD', 'tunis': 'TUN',
  'dubai': 'DXB', 'abu-dhabi': 'AUH', 'riyadh': 'RUH', 'doha': 'DOH', 'tehran': 'IKA',
  'jerusalem': 'TLV', 'baghdad': 'BGW', 'kuwait': 'KWI', 'beirut': 'BEY',
  'new-delhi': 'DEL', 'mumbai': 'BOM', 'bengaluru': 'BLR', 'kolkata': 'CCU',
  'karachi': 'KHI', 'islamabad': 'ISB', 'dhaka': 'DAC', 'kathmandu': 'KTM',
  'colombo': 'CMB', 'tashkent': 'TAS', 'almaty': 'ALA', 'kabul': 'KBL',
  'beijing': 'PEK', 'shanghai': 'PVG', 'hong-kong': 'HKG', 'taipei': 'TPE',
  'tokyo': 'HND', 'osaka': 'KIX', 'seoul': 'ICN', 'singapore': 'SIN', 'bangkok': 'BKK',
  'jakarta': 'CGK', 'kuala-lumpur': 'KUL', 'manila': 'MNL', 'hanoi': 'HAN',
  'ho-chi-minh': 'SGN', 'yangon': 'RGN', 'phnom-penh': 'PNH', 'ulaanbaatar': 'UBN',
  'sydney': 'SYD', 'melbourne': 'MEL', 'brisbane': 'BNE', 'perth': 'PER',
  'adelaide': 'ADL', 'auckland': 'AKL', 'wellington': 'WLG', 'suva': 'SUV',
  'port-moresby': 'POM',
};

// ISO-2 de reserva quando o Natural Earth não casa (ilhas, grafias divergentes).
const CC_FALLBACK = {
  'brasilia': 'BR', 'quito': 'EC', 'washington': 'US', 'honolulu': 'US',
  'kinshasa': 'CD', 'jerusalem': 'IL', 'kuwait': 'KW', 'suva': 'FJ',
};

// Perfil de expediente comercial local (h decimal). Golfo: domingo a quinta.
const BUSINESS = {
  default: { start: 9, end: 18, lunch: [12, 13], days: [1, 2, 3, 4, 5] },
  gulf: { start: 8, end: 17, lunch: [13, 14], days: [0, 1, 2, 3, 4] },
  jp: { start: 9, end: 18, lunch: [12, 13], days: [1, 2, 3, 4, 5] },
  br: { start: 9, end: 18, lunch: [12, 13], days: [1, 2, 3, 4, 5] },
};
const GULF_TZ = ['Asia/Dubai', 'Asia/Riyadh', 'Asia/Qatar', 'Asia/Kuwait', 'Asia/Baghdad'];

const rows = RAW.map(([id, name, country, tz, lat, lng]) => {
  const ne = nearest(lat, lng);
  const cc = (ne && ne.cc && ne.cc !== '-99' ? ne.cc : CC_FALLBACK[id]) || '';
  const pop = ne ? ne.pop : 0;
  return {
    id, name, country, tz, lat, lng,
    cc,
    pop,
    region: regionOf(tz),
    exchange: EXCHANGE[id] || null,
    airport: AIRPORT[id] || null,
    business: GULF_TZ.includes(tz) ? 'gulf' : 'default',
  };
});

const semCc = rows.filter((r) => !r.cc).map((r) => r.id);
const semPop = rows.filter((r) => !r.pop).map((r) => r.id);
console.log('total', rows.length, '| sem cc:', semCc, '| sem pop:', semPop);
fs.writeFileSync(new URL('./cities-enriched.json', import.meta.url), JSON.stringify(rows, null, 0));
console.log('BUSINESS profiles', Object.keys(BUSINESS).length);
