/**
 * World Clock Map — base local de cidades (nome pt-BR, país, fuso IANA, lat/lng).
 * @version 0.2.0
 *
 * Base 100% LOCAL (sem API externa). Usada pela busca, pelos chips e pelo relógio
 * em destaque. Fusos são IANA (Intl resolve horário de verão e meia-hora sozinho).
 *
 * COMO ADICIONAR UMA CIDADE: acrescente um objeto { id, name, country, tz, lat, lng }
 * ao array CITIES (id kebab-case único; tz IANA válido; lat/lng em graus decimais,
 * N/E positivos). Para exibi-la por padrão, inclua o id em DEFAULT_CITY_IDS.
 */
'use strict';

export const LOCAL_CITY_ID = 'sao-paulo';

// Conjunto padrão exibido ao abrir (São Paulo destacada como cidade local).
export const DEFAULT_CITY_IDS = [
  'sao-paulo', 'new-york', 'los-angeles', 'mexico-city', 'buenos-aires',
  'london', 'paris', 'berlin', 'madrid', 'moscow',
  'dubai', 'new-delhi', 'beijing', 'johannesburg', 'hong-kong',
  'tokyo', 'seoul', 'singapore', 'sydney'
];

export const CITIES = [
  // ===== América do Sul =====
  { id: 'sao-paulo', name: 'São Paulo', country: 'Brasil', tz: 'America/Sao_Paulo', lat: -23.55, lng: -46.63 },
  { id: 'rio-de-janeiro', name: 'Rio de Janeiro', country: 'Brasil', tz: 'America/Sao_Paulo', lat: -22.91, lng: -43.17 },
  { id: 'brasilia', name: 'Brasília', country: 'Brasil', tz: 'America/Sao_Paulo', lat: -15.79, lng: -47.88 },
  { id: 'manaus', name: 'Manaus', country: 'Brasil', tz: 'America/Manaus', lat: -3.12, lng: -60.02 },
  { id: 'buenos-aires', name: 'Buenos Aires', country: 'Argentina', tz: 'America/Argentina/Buenos_Aires', lat: -34.60, lng: -58.38 },
  { id: 'santiago', name: 'Santiago', country: 'Chile', tz: 'America/Santiago', lat: -33.45, lng: -70.67 },
  { id: 'lima', name: 'Lima', country: 'Peru', tz: 'America/Lima', lat: -12.05, lng: -77.04 },
  { id: 'bogota', name: 'Bogotá', country: 'Colômbia', tz: 'America/Bogota', lat: 4.71, lng: -74.07 },
  { id: 'caracas', name: 'Caracas', country: 'Venezuela', tz: 'America/Caracas', lat: 10.48, lng: -66.90 },
  { id: 'montevideo', name: 'Montevidéu', country: 'Uruguai', tz: 'America/Montevideo', lat: -34.90, lng: -56.16 },
  { id: 'la-paz', name: 'La Paz', country: 'Bolívia', tz: 'America/La_Paz', lat: -16.50, lng: -68.15 },
  { id: 'asuncion', name: 'Assunção', country: 'Paraguai', tz: 'America/Asuncion', lat: -25.28, lng: -57.64 },
  { id: 'quito', name: 'Quito', country: 'Equador', tz: 'America/Guayaquil', lat: -0.18, lng: -78.47 },

  // ===== América do Norte e Central =====
  { id: 'new-york', name: 'Nova York', country: 'Estados Unidos', tz: 'America/New_York', lat: 40.71, lng: -74.01 },
  { id: 'los-angeles', name: 'Los Angeles', country: 'Estados Unidos', tz: 'America/Los_Angeles', lat: 34.05, lng: -118.24 },
  { id: 'chicago', name: 'Chicago', country: 'Estados Unidos', tz: 'America/Chicago', lat: 41.88, lng: -87.63 },
  { id: 'denver', name: 'Denver', country: 'Estados Unidos', tz: 'America/Denver', lat: 39.74, lng: -104.99 },
  { id: 'miami', name: 'Miami', country: 'Estados Unidos', tz: 'America/New_York', lat: 25.76, lng: -80.19 },
  { id: 'san-francisco', name: 'São Francisco', country: 'Estados Unidos', tz: 'America/Los_Angeles', lat: 37.77, lng: -122.42 },
  { id: 'washington', name: 'Washington, D.C.', country: 'Estados Unidos', tz: 'America/New_York', lat: 38.90, lng: -77.04 },
  { id: 'toronto', name: 'Toronto', country: 'Canadá', tz: 'America/Toronto', lat: 43.65, lng: -79.38 },
  { id: 'vancouver', name: 'Vancouver', country: 'Canadá', tz: 'America/Vancouver', lat: 49.28, lng: -123.12 },
  { id: 'mexico-city', name: 'Cidade do México', country: 'México', tz: 'America/Mexico_City', lat: 19.43, lng: -99.13 },
  { id: 'havana', name: 'Havana', country: 'Cuba', tz: 'America/Havana', lat: 23.11, lng: -82.37 },
  { id: 'panama', name: 'Cidade do Panamá', country: 'Panamá', tz: 'America/Panama', lat: 8.98, lng: -79.52 },
  { id: 'guatemala', name: 'Cidade da Guatemala', country: 'Guatemala', tz: 'America/Guatemala', lat: 14.63, lng: -90.51 },
  { id: 'anchorage', name: 'Anchorage', country: 'Estados Unidos', tz: 'America/Anchorage', lat: 61.22, lng: -149.90 },
  { id: 'honolulu', name: 'Honolulu', country: 'Estados Unidos', tz: 'Pacific/Honolulu', lat: 21.31, lng: -157.86 },

  // ===== Europa =====
  { id: 'london', name: 'Londres', country: 'Reino Unido', tz: 'Europe/London', lat: 51.51, lng: -0.13 },
  { id: 'paris', name: 'Paris', country: 'França', tz: 'Europe/Paris', lat: 48.85, lng: 2.35 },
  { id: 'berlin', name: 'Berlim', country: 'Alemanha', tz: 'Europe/Berlin', lat: 52.52, lng: 13.40 },
  { id: 'madrid', name: 'Madri', country: 'Espanha', tz: 'Europe/Madrid', lat: 40.42, lng: -3.70 },
  { id: 'rome', name: 'Roma', country: 'Itália', tz: 'Europe/Rome', lat: 41.90, lng: 12.50 },
  { id: 'lisbon', name: 'Lisboa', country: 'Portugal', tz: 'Europe/Lisbon', lat: 38.72, lng: -9.14 },
  { id: 'amsterdam', name: 'Amsterdã', country: 'Países Baixos', tz: 'Europe/Amsterdam', lat: 52.37, lng: 4.90 },
  { id: 'brussels', name: 'Bruxelas', country: 'Bélgica', tz: 'Europe/Brussels', lat: 50.85, lng: 4.35 },
  { id: 'zurich', name: 'Zurique', country: 'Suíça', tz: 'Europe/Zurich', lat: 47.37, lng: 8.54 },
  { id: 'vienna', name: 'Viena', country: 'Áustria', tz: 'Europe/Vienna', lat: 48.21, lng: 16.37 },
  { id: 'dublin', name: 'Dublin', country: 'Irlanda', tz: 'Europe/Dublin', lat: 53.35, lng: -6.26 },
  { id: 'stockholm', name: 'Estocolmo', country: 'Suécia', tz: 'Europe/Stockholm', lat: 59.33, lng: 18.06 },
  { id: 'oslo', name: 'Oslo', country: 'Noruega', tz: 'Europe/Oslo', lat: 59.91, lng: 10.75 },
  { id: 'copenhagen', name: 'Copenhague', country: 'Dinamarca', tz: 'Europe/Copenhagen', lat: 55.68, lng: 12.57 },
  { id: 'helsinki', name: 'Helsinque', country: 'Finlândia', tz: 'Europe/Helsinki', lat: 60.17, lng: 24.94 },
  { id: 'warsaw', name: 'Varsóvia', country: 'Polônia', tz: 'Europe/Warsaw', lat: 52.23, lng: 21.01 },
  { id: 'prague', name: 'Praga', country: 'Tchéquia', tz: 'Europe/Prague', lat: 50.08, lng: 14.44 },
  { id: 'budapest', name: 'Budapeste', country: 'Hungria', tz: 'Europe/Budapest', lat: 47.50, lng: 19.04 },
  { id: 'athens', name: 'Atenas', country: 'Grécia', tz: 'Europe/Athens', lat: 37.98, lng: 23.73 },
  { id: 'bucharest', name: 'Bucareste', country: 'Romênia', tz: 'Europe/Bucharest', lat: 44.43, lng: 26.10 },
  { id: 'kyiv', name: 'Kiev', country: 'Ucrânia', tz: 'Europe/Kyiv', lat: 50.45, lng: 30.52 },
  { id: 'moscow', name: 'Moscou', country: 'Rússia', tz: 'Europe/Moscow', lat: 55.76, lng: 37.62 },
  { id: 'istanbul', name: 'Istambul', country: 'Turquia', tz: 'Europe/Istanbul', lat: 41.01, lng: 28.98 },
  { id: 'reykjavik', name: 'Reykjavík', country: 'Islândia', tz: 'Atlantic/Reykjavik', lat: 64.15, lng: -21.94 },

  // ===== África =====
  { id: 'johannesburg', name: 'Joanesburgo', country: 'África do Sul', tz: 'Africa/Johannesburg', lat: -26.20, lng: 28.05 },
  { id: 'cape-town', name: 'Cidade do Cabo', country: 'África do Sul', tz: 'Africa/Johannesburg', lat: -33.92, lng: 18.42 },
  { id: 'cairo', name: 'Cairo', country: 'Egito', tz: 'Africa/Cairo', lat: 30.04, lng: 31.24 },
  { id: 'lagos', name: 'Lagos', country: 'Nigéria', tz: 'Africa/Lagos', lat: 6.52, lng: 3.38 },
  { id: 'nairobi', name: 'Nairóbi', country: 'Quênia', tz: 'Africa/Nairobi', lat: -1.29, lng: 36.82 },
  { id: 'casablanca', name: 'Casablanca', country: 'Marrocos', tz: 'Africa/Casablanca', lat: 33.57, lng: -7.59 },
  { id: 'addis-ababa', name: 'Adis Abeba', country: 'Etiópia', tz: 'Africa/Addis_Ababa', lat: 9.03, lng: 38.74 },
  { id: 'accra', name: 'Acra', country: 'Gana', tz: 'Africa/Accra', lat: 5.60, lng: -0.19 },
  { id: 'algiers', name: 'Argel', country: 'Argélia', tz: 'Africa/Algiers', lat: 36.75, lng: 3.06 },
  { id: 'dakar', name: 'Dacar', country: 'Senegal', tz: 'Africa/Dakar', lat: 14.72, lng: -17.47 },
  { id: 'kinshasa', name: 'Quinxassa', country: 'Rep. Dem. do Congo', tz: 'Africa/Kinshasa', lat: -4.32, lng: 15.31 },
  { id: 'luanda', name: 'Luanda', country: 'Angola', tz: 'Africa/Luanda', lat: -8.84, lng: 13.23 },
  { id: 'tunis', name: 'Túnis', country: 'Tunísia', tz: 'Africa/Tunis', lat: 36.81, lng: 10.18 },

  // ===== Oriente Médio =====
  { id: 'dubai', name: 'Dubai', country: 'Emirados Árabes Unidos', tz: 'Asia/Dubai', lat: 25.20, lng: 55.27 },
  { id: 'abu-dhabi', name: 'Abu Dhabi', country: 'Emirados Árabes Unidos', tz: 'Asia/Dubai', lat: 24.45, lng: 54.38 },
  { id: 'riyadh', name: 'Riade', country: 'Arábia Saudita', tz: 'Asia/Riyadh', lat: 24.71, lng: 46.68 },
  { id: 'doha', name: 'Doha', country: 'Catar', tz: 'Asia/Qatar', lat: 25.29, lng: 51.53 },
  { id: 'tehran', name: 'Teerã', country: 'Irã', tz: 'Asia/Tehran', lat: 35.69, lng: 51.39 },
  { id: 'jerusalem', name: 'Jerusalém', country: 'Israel', tz: 'Asia/Jerusalem', lat: 31.77, lng: 35.21 },
  { id: 'baghdad', name: 'Bagdá', country: 'Iraque', tz: 'Asia/Baghdad', lat: 33.31, lng: 44.36 },
  { id: 'kuwait', name: 'Cidade do Kuwait', country: 'Kuwait', tz: 'Asia/Kuwait', lat: 29.38, lng: 47.99 },
  { id: 'beirut', name: 'Beirute', country: 'Líbano', tz: 'Asia/Beirut', lat: 33.89, lng: 35.50 },

  // ===== Ásia Central e Sul =====
  { id: 'new-delhi', name: 'Nova Délhi', country: 'Índia', tz: 'Asia/Kolkata', lat: 28.61, lng: 77.21 },
  { id: 'mumbai', name: 'Mumbai', country: 'Índia', tz: 'Asia/Kolkata', lat: 19.08, lng: 72.88 },
  { id: 'bengaluru', name: 'Bengaluru', country: 'Índia', tz: 'Asia/Kolkata', lat: 12.97, lng: 77.59 },
  { id: 'kolkata', name: 'Calcutá', country: 'Índia', tz: 'Asia/Kolkata', lat: 22.57, lng: 88.36 },
  { id: 'karachi', name: 'Karachi', country: 'Paquistão', tz: 'Asia/Karachi', lat: 24.86, lng: 67.01 },
  { id: 'islamabad', name: 'Islamabad', country: 'Paquistão', tz: 'Asia/Karachi', lat: 33.68, lng: 73.05 },
  { id: 'dhaka', name: 'Daca', country: 'Bangladesh', tz: 'Asia/Dhaka', lat: 23.81, lng: 90.41 },
  { id: 'kathmandu', name: 'Catmandu', country: 'Nepal', tz: 'Asia/Kathmandu', lat: 27.72, lng: 85.32 },
  { id: 'colombo', name: 'Colombo', country: 'Sri Lanka', tz: 'Asia/Colombo', lat: 6.93, lng: 79.85 },
  { id: 'tashkent', name: 'Tashkent', country: 'Uzbequistão', tz: 'Asia/Tashkent', lat: 41.30, lng: 69.24 },
  { id: 'almaty', name: 'Almaty', country: 'Cazaquistão', tz: 'Asia/Almaty', lat: 43.24, lng: 76.89 },
  { id: 'kabul', name: 'Cabul', country: 'Afeganistão', tz: 'Asia/Kabul', lat: 34.56, lng: 69.21 },

  // ===== Ásia Oriental e Sudeste =====
  { id: 'beijing', name: 'Pequim', country: 'China', tz: 'Asia/Shanghai', lat: 39.90, lng: 116.41 },
  { id: 'shanghai', name: 'Xangai', country: 'China', tz: 'Asia/Shanghai', lat: 31.23, lng: 121.47 },
  { id: 'hong-kong', name: 'Hong Kong', country: 'China', tz: 'Asia/Hong_Kong', lat: 22.32, lng: 114.17 },
  { id: 'taipei', name: 'Taipé', country: 'Taiwan', tz: 'Asia/Taipei', lat: 25.03, lng: 121.57 },
  { id: 'tokyo', name: 'Tóquio', country: 'Japão', tz: 'Asia/Tokyo', lat: 35.68, lng: 139.69 },
  { id: 'osaka', name: 'Osaka', country: 'Japão', tz: 'Asia/Tokyo', lat: 34.69, lng: 135.50 },
  { id: 'seoul', name: 'Seul', country: 'Coreia do Sul', tz: 'Asia/Seoul', lat: 37.57, lng: 126.98 },
  { id: 'singapore', name: 'Singapura', country: 'Singapura', tz: 'Asia/Singapore', lat: 1.35, lng: 103.82 },
  { id: 'bangkok', name: 'Bangcoc', country: 'Tailândia', tz: 'Asia/Bangkok', lat: 13.76, lng: 100.50 },
  { id: 'jakarta', name: 'Jacarta', country: 'Indonésia', tz: 'Asia/Jakarta', lat: -6.21, lng: 106.85 },
  { id: 'kuala-lumpur', name: 'Kuala Lumpur', country: 'Malásia', tz: 'Asia/Kuala_Lumpur', lat: 3.14, lng: 101.69 },
  { id: 'manila', name: 'Manila', country: 'Filipinas', tz: 'Asia/Manila', lat: 14.60, lng: 120.98 },
  { id: 'hanoi', name: 'Hanói', country: 'Vietnã', tz: 'Asia/Ho_Chi_Minh', lat: 21.03, lng: 105.85 },
  { id: 'ho-chi-minh', name: 'Ho Chi Minh', country: 'Vietnã', tz: 'Asia/Ho_Chi_Minh', lat: 10.82, lng: 106.63 },
  { id: 'yangon', name: 'Rangum', country: 'Mianmar', tz: 'Asia/Yangon', lat: 16.87, lng: 96.20 },
  { id: 'phnom-penh', name: 'Phnom Penh', country: 'Camboja', tz: 'Asia/Phnom_Penh', lat: 11.56, lng: 104.93 },
  { id: 'ulaanbaatar', name: 'Ulan Bator', country: 'Mongólia', tz: 'Asia/Ulaanbaatar', lat: 47.89, lng: 106.91 },

  // ===== Oceania =====
  { id: 'sydney', name: 'Sydney', country: 'Austrália', tz: 'Australia/Sydney', lat: -33.87, lng: 151.21 },
  { id: 'melbourne', name: 'Melbourne', country: 'Austrália', tz: 'Australia/Melbourne', lat: -37.81, lng: 144.96 },
  { id: 'brisbane', name: 'Brisbane', country: 'Austrália', tz: 'Australia/Brisbane', lat: -27.47, lng: 153.03 },
  { id: 'perth', name: 'Perth', country: 'Austrália', tz: 'Australia/Perth', lat: -31.95, lng: 115.86 },
  { id: 'adelaide', name: 'Adelaide', country: 'Austrália', tz: 'Australia/Adelaide', lat: -34.93, lng: 138.60 },
  { id: 'auckland', name: 'Auckland', country: 'Nova Zelândia', tz: 'Pacific/Auckland', lat: -36.85, lng: 174.76 },
  { id: 'wellington', name: 'Wellington', country: 'Nova Zelândia', tz: 'Pacific/Auckland', lat: -41.29, lng: 174.78 },
  { id: 'suva', name: 'Suva', country: 'Fiji', tz: 'Pacific/Fiji', lat: -18.14, lng: 178.44 },
  { id: 'port-moresby', name: 'Port Moresby', country: 'Papua-Nova Guiné', tz: 'Pacific/Port_Moresby', lat: -9.44, lng: 147.18 }
];

// Índice por id para lookup O(1).
export const CITY_BY_ID = CITIES.reduce((m, c) => { m[c.id] = c; return m; }, {});

export function getCity(id) { return CITY_BY_ID[id] || null; }

/** Busca simples por nome/país (case/acentos-insensível). */
export function searchCities(query, limit) {
  const q = _norm(query).trim();
  if (!q) return [];
  const out = [];
  for (const c of CITIES) {
    if (_norm(c.name).includes(q) || _norm(c.country).includes(q)) {
      out.push(c);
      if (out.length >= (limit || 12)) break;
    }
  }
  return out;
}

function _norm(s) {
  return (s || '').toString().toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
}
