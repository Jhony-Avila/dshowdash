/**
 * data/cities.ts — base local de cidades (157), 100% offline.
 * @version 3.0.0
 *
 * GERADO por scripts/relogio-mundial-gen-cities.mjs a partir da base v2 (112 cidades)
 * cruzada com Natural Earth 10m populated places (população real + ISO-2 do país).
 * As 45 cidades novas cobrem lacunas que o briefing expõe: praças financeiras que
 * faltavam (Frankfurt, Shenzhen, Milão, Tel Aviv) e a malha brasileira de fato —
 * 4 fusos do Brasil (Sao_Paulo, Bahia/Recife/Fortaleza/Belem, Campo_Grande, Rio_Branco).
 *
 * NÃO editar à mão para acrescentar em massa: rode o gerador. Uma cidade pontual pode
 * ser adicionada aqui (id kebab-case único, tz IANA válido, lat/lng decimais N/E+).
 *
 * `pop` alimenta a hierarquia visual dos marcadores; `region` alimenta o painel
 * analítico; `airport` é o IATA do aeroporto principal (detalhe em data/airports.ts);
 * `business` seleciona o perfil de expediente (o Golfo trabalha domingo a quinta).
 * A bolsa NÃO fica aqui de propósito: data/exchanges.ts é a fonte única, porque uma
 * cidade pode sediar duas (Nova York = NYSE + NASDAQ; Mumbai = BSE + NSE).
 */
'use strict';

export type Region = 'americas' | 'europa' | 'africa' | 'asia' | 'oceania';
export type BusinessProfileId = 'default' | 'gulf';

export interface City {
  id: string;
  name: string;
  country: string;
  /** ISO 3166-1 alpha-2 — usado para a bandeira (emoji derivado, sem asset). */
  cc: string;
  /** Zona IANA. */
  tz: string;
  lat: number;
  lng: number;
  /** População da área urbana (Natural Earth pop_max). */
  pop: number;
  region: Region;
  /** IATA do aeroporto principal. */
  airport: string;
  business: BusinessProfileId;
}

export const LOCAL_CITY_ID = 'sao-paulo';

/** Conjunto exibido no primeiro acesso (antes de qualquer preferência salva). */
export const DEFAULT_CITY_IDS: string[] = [
  'sao-paulo', 'new-york', 'london', 'frankfurt', 'dubai',
  'mumbai', 'shanghai', 'hong-kong', 'tokyo', 'singapore',
  'sydney', 'los-angeles', 'mexico-city', 'johannesburg', 'moscow',
];

export const CITIES: City[] = [
  // ===== Américas =====
  { id: 'new-york', name: 'Nova York', country: 'Estados Unidos', cc: 'US', tz: 'America/New_York', lat: 40.71, lng: -74.01, pop: 19040000, region: 'americas', airport: 'JFK', business: 'default' },
  { id: 'mexico-city', name: 'Cidade do México', country: 'México', cc: 'MX', tz: 'America/Mexico_City', lat: 19.43, lng: -99.13, pop: 19028000, region: 'americas', airport: 'MEX', business: 'default' },
  { id: 'sao-paulo', name: 'São Paulo', country: 'Brasil', cc: 'BR', tz: 'America/Sao_Paulo', lat: -23.55, lng: -46.63, pop: 18845000, region: 'americas', airport: 'GRU', business: 'default' },
  { id: 'buenos-aires', name: 'Buenos Aires', country: 'Argentina', cc: 'AR', tz: 'America/Argentina/Buenos_Aires', lat: -34.6, lng: -58.38, pop: 12795000, region: 'americas', airport: 'EZE', business: 'default' },
  { id: 'los-angeles', name: 'Los Angeles', country: 'Estados Unidos', cc: 'US', tz: 'America/Los_Angeles', lat: 34.05, lng: -118.24, pop: 12500000, region: 'americas', airport: 'LAX', business: 'default' },
  { id: 'rio-de-janeiro', name: 'Rio de Janeiro', country: 'Brasil', cc: 'BR', tz: 'America/Sao_Paulo', lat: -22.91, lng: -43.17, pop: 11748000, region: 'americas', airport: 'GIG', business: 'default' },
  { id: 'chicago', name: 'Chicago', country: 'Estados Unidos', cc: 'US', tz: 'America/Chicago', lat: 41.88, lng: -87.63, pop: 8990000, region: 'americas', airport: 'ORD', business: 'default' },
  { id: 'lima', name: 'Lima', country: 'Peru', cc: 'PE', tz: 'America/Lima', lat: -12.05, lng: -77.04, pop: 8012000, region: 'americas', airport: 'LIM', business: 'default' },
  { id: 'bogota', name: 'Bogotá', country: 'Colômbia', cc: 'CO', tz: 'America/Bogota', lat: 4.71, lng: -74.07, pop: 7772000, region: 'americas', airport: 'BOG', business: 'default' },
  { id: 'santiago', name: 'Santiago', country: 'Chile', cc: 'CL', tz: 'America/Santiago', lat: -33.45, lng: -70.67, pop: 5720000, region: 'americas', airport: 'SCL', business: 'default' },
  { id: 'miami', name: 'Miami', country: 'Estados Unidos', cc: 'US', tz: 'America/New_York', lat: 25.76, lng: -80.19, pop: 5585000, region: 'americas', airport: 'MIA', business: 'default' },
  { id: 'belo-horizonte', name: 'Belo Horizonte', country: 'Brasil', cc: 'BR', tz: 'America/Sao_Paulo', lat: -19.92, lng: -43.94, pop: 5575000, region: 'americas', airport: 'CNF', business: 'default' },
  { id: 'toronto', name: 'Toronto', country: 'Canadá', cc: 'CA', tz: 'America/Toronto', lat: 43.65, lng: -79.38, pop: 5213000, region: 'americas', airport: 'YYZ', business: 'default' },
  { id: 'dallas', name: 'Dallas', country: 'Estados Unidos', cc: 'US', tz: 'America/Chicago', lat: 32.78, lng: -96.8, pop: 4798000, region: 'americas', airport: 'DFW', business: 'default' },
  { id: 'atlanta', name: 'Atlanta', country: 'Estados Unidos', cc: 'US', tz: 'America/New_York', lat: 33.75, lng: -84.39, pop: 4506000, region: 'americas', airport: 'ATL', business: 'default' },
  { id: 'boston', name: 'Boston', country: 'Estados Unidos', cc: 'US', tz: 'America/New_York', lat: 42.36, lng: -71.06, pop: 4467000, region: 'americas', airport: 'BOS', business: 'default' },
  { id: 'houston', name: 'Houston', country: 'Estados Unidos', cc: 'US', tz: 'America/Chicago', lat: 29.76, lng: -95.37, pop: 4459000, region: 'americas', airport: 'IAH', business: 'default' },
  { id: 'washington', name: 'Washington, D.C.', country: 'Estados Unidos', cc: 'US', tz: 'America/New_York', lat: 38.9, lng: -77.04, pop: 4338000, region: 'americas', airport: 'IAD', business: 'default' },
  { id: 'porto-alegre', name: 'Porto Alegre', country: 'Brasil', cc: 'BR', tz: 'America/Sao_Paulo', lat: -30.03, lng: -51.23, pop: 3917000, region: 'americas', airport: 'POA', business: 'default' },
  { id: 'brasilia', name: 'Brasília', country: 'Brasil', cc: 'BR', tz: 'America/Sao_Paulo', lat: -15.79, lng: -47.88, pop: 3716996, region: 'americas', airport: 'BSB', business: 'default' },
  { id: 'montreal', name: 'Montreal', country: 'Canadá', cc: 'CA', tz: 'America/Toronto', lat: 45.5, lng: -73.57, pop: 3678000, region: 'americas', airport: 'YUL', business: 'default' },
  { id: 'recife', name: 'Recife', country: 'Brasil', cc: 'BR', tz: 'America/Recife', lat: -8.05, lng: -34.88, pop: 3651000, region: 'americas', airport: 'REC', business: 'default' },
  { id: 'fortaleza', name: 'Fortaleza', country: 'Brasil', cc: 'BR', tz: 'America/Fortaleza', lat: -3.73, lng: -38.52, pop: 3602319, region: 'americas', airport: 'FOR', business: 'default' },
  { id: 'salvador', name: 'Salvador', country: 'Brasil', cc: 'BR', tz: 'America/Bahia', lat: -12.97, lng: -38.51, pop: 3484000, region: 'americas', airport: 'SSA', business: 'default' },
  { id: 'san-francisco', name: 'São Francisco', country: 'Estados Unidos', cc: 'US', tz: 'America/Los_Angeles', lat: 37.77, lng: -122.42, pop: 3450000, region: 'americas', airport: 'SFO', business: 'default' },
  { id: 'curitiba', name: 'Curitiba', country: 'Brasil', cc: 'BR', tz: 'America/Sao_Paulo', lat: -25.43, lng: -49.27, pop: 3084000, region: 'americas', airport: 'CWB', business: 'default' },
  { id: 'seattle', name: 'Seattle', country: 'Estados Unidos', cc: 'US', tz: 'America/Los_Angeles', lat: 47.61, lng: -122.33, pop: 3074000, region: 'americas', airport: 'SEA', business: 'default' },
  { id: 'caracas', name: 'Caracas', country: 'Venezuela', cc: 'VE', tz: 'America/Caracas', lat: 10.48, lng: -66.9, pop: 2985000, region: 'americas', airport: 'CCS', business: 'default' },
  { id: 'vancouver', name: 'Vancouver', country: 'Canadá', cc: 'CA', tz: 'America/Vancouver', lat: 49.28, lng: -123.12, pop: 2313328, region: 'americas', airport: 'YVR', business: 'default' },
  { id: 'denver', name: 'Denver', country: 'Estados Unidos', cc: 'US', tz: 'America/Denver', lat: 39.74, lng: -104.99, pop: 2313000, region: 'americas', airport: 'DEN', business: 'default' },
  { id: 'havana', name: 'Havana', country: 'Cuba', cc: 'CU', tz: 'America/Havana', lat: 23.11, lng: -82.37, pop: 2174000, region: 'americas', airport: 'HAV', business: 'default' },
  { id: 'belem', name: 'Belém', country: 'Brasil', cc: 'BR', tz: 'America/Belem', lat: -1.46, lng: -48.5, pop: 2167000, region: 'americas', airport: 'BEL', business: 'default' },
  { id: 'goiania', name: 'Goiânia', country: 'Brasil', cc: 'BR', tz: 'America/Sao_Paulo', lat: -16.69, lng: -49.26, pop: 2022000, region: 'americas', airport: 'GYN', business: 'default' },
  { id: 'asuncion', name: 'Assunção', country: 'Paraguai', cc: 'PY', tz: 'America/Asuncion', lat: -25.28, lng: -57.64, pop: 1870000, region: 'americas', airport: 'ASU', business: 'default' },
  { id: 'manaus', name: 'Manaus', country: 'Brasil', cc: 'BR', tz: 'America/Manaus', lat: -3.12, lng: -60.02, pop: 1753000, region: 'americas', airport: 'MAO', business: 'default' },
  { id: 'quito', name: 'Quito', country: 'Equador', cc: 'EC', tz: 'America/Guayaquil', lat: -0.18, lng: -78.47, pop: 1701000, region: 'americas', airport: 'UIO', business: 'default' },
  { id: 'la-paz', name: 'La Paz', country: 'Bolívia', cc: 'BO', tz: 'America/La_Paz', lat: -16.5, lng: -68.15, pop: 1590000, region: 'americas', airport: 'LPB', business: 'default' },
  { id: 'montevideo', name: 'Montevidéu', country: 'Uruguai', cc: 'UY', tz: 'America/Montevideo', lat: -34.9, lng: -56.16, pop: 1513000, region: 'americas', airport: 'MVD', business: 'default' },
  { id: 'panama', name: 'Cidade do Panamá', country: 'Panamá', cc: 'PA', tz: 'America/Panama', lat: 8.98, lng: -79.52, pop: 1281000, region: 'americas', airport: 'PTY', business: 'default' },
  { id: 'guatemala', name: 'Cidade da Guatemala', country: 'Guatemala', cc: 'GT', tz: 'America/Guatemala', lat: 14.63, lng: -90.51, pop: 1024000, region: 'americas', airport: 'GUA', business: 'default' },
  { id: 'florianopolis', name: 'Florianópolis', country: 'Brasil', cc: 'BR', tz: 'America/Sao_Paulo', lat: -27.6, lng: -48.55, pop: 1023000, region: 'americas', airport: 'FLN', business: 'default' },
  { id: 'campo-grande', name: 'Campo Grande', country: 'Brasil', cc: 'BR', tz: 'America/Campo_Grande', lat: -20.44, lng: -54.65, pop: 778000, region: 'americas', airport: 'CGR', business: 'default' },
  { id: 'anchorage', name: 'Anchorage', country: 'Estados Unidos', cc: 'US', tz: 'America/Anchorage', lat: 61.22, lng: -149.9, pop: 260283, region: 'americas', airport: 'ANC', business: 'default' },
  { id: 'rio-branco', name: 'Rio Branco', country: 'Brasil', cc: 'BR', tz: 'America/Rio_Branco', lat: -9.97, lng: -67.81, pop: 257642, region: 'americas', airport: 'RBR', business: 'default' },
  { id: 'ushuaia', name: 'Ushuaia', country: 'Argentina', cc: 'AR', tz: 'America/Argentina/Ushuaia', lat: -54.8, lng: -68.3, pop: 58028, region: 'americas', airport: 'USH', business: 'default' },
  { id: 'nuuk', name: 'Nuuk', country: 'Groenlândia', cc: 'GL', tz: 'America/Nuuk', lat: 64.18, lng: -51.72, pop: 14798, region: 'americas', airport: 'GOH', business: 'default' },

  // ===== Europa =====
  { id: 'moscow', name: 'Moscou', country: 'Rússia', cc: 'RU', tz: 'Europe/Moscow', lat: 55.76, lng: 37.62, pop: 10452000, region: 'europa', airport: 'SVO', business: 'default' },
  { id: 'istanbul', name: 'Istambul', country: 'Turquia', cc: 'TR', tz: 'Europe/Istanbul', lat: 41.01, lng: 28.98, pop: 10061000, region: 'europa', airport: 'IST', business: 'default' },
  { id: 'paris', name: 'Paris', country: 'França', cc: 'FR', tz: 'Europe/Paris', lat: 48.85, lng: 2.35, pop: 9904000, region: 'europa', airport: 'CDG', business: 'default' },
  { id: 'london', name: 'Londres', country: 'Reino Unido', cc: 'GB', tz: 'Europe/London', lat: 51.51, lng: -0.13, pop: 8567000, region: 'europa', airport: 'LHR', business: 'default' },
  { id: 'madrid', name: 'Madri', country: 'Espanha', cc: 'ES', tz: 'Europe/Madrid', lat: 40.42, lng: -3.7, pop: 5567000, region: 'europa', airport: 'MAD', business: 'default' },
  { id: 'barcelona', name: 'Barcelona', country: 'Espanha', cc: 'ES', tz: 'Europe/Madrid', lat: 41.39, lng: 2.17, pop: 4920000, region: 'europa', airport: 'BCN', business: 'default' },
  { id: 'saint-petersburg', name: 'São Petersburgo', country: 'Rússia', cc: 'RU', tz: 'Europe/Moscow', lat: 59.94, lng: 30.31, pop: 4553000, region: 'europa', airport: 'LED', business: 'default' },
  { id: 'berlin', name: 'Berlim', country: 'Alemanha', cc: 'DE', tz: 'Europe/Berlin', lat: 52.52, lng: 13.4, pop: 3406000, region: 'europa', airport: 'BER', business: 'default' },
  { id: 'rome', name: 'Roma', country: 'Itália', cc: 'IT', tz: 'Europe/Rome', lat: 41.9, lng: 12.5, pop: 3339000, region: 'europa', airport: 'FCO', business: 'default' },
  { id: 'athens', name: 'Atenas', country: 'Grécia', cc: 'GR', tz: 'Europe/Athens', lat: 37.98, lng: 23.73, pop: 3242000, region: 'europa', airport: 'ATH', business: 'default' },
  { id: 'milan', name: 'Milão', country: 'Itália', cc: 'IT', tz: 'Europe/Rome', lat: 45.46, lng: 9.19, pop: 2945000, region: 'europa', airport: 'MXP', business: 'default' },
  { id: 'frankfurt', name: 'Frankfurt', country: 'Alemanha', cc: 'DE', tz: 'Europe/Berlin', lat: 50.11, lng: 8.68, pop: 2895000, region: 'europa', airport: 'FRA', business: 'default' },
  { id: 'lisbon', name: 'Lisboa', country: 'Portugal', cc: 'PT', tz: 'Europe/Lisbon', lat: 38.72, lng: -9.14, pop: 2812000, region: 'europa', airport: 'LIS', business: 'default' },
  { id: 'kyiv', name: 'Kiev', country: 'Ucrânia', cc: 'UA', tz: 'Europe/Kyiv', lat: 50.45, lng: 30.52, pop: 2709000, region: 'europa', airport: 'KBP', business: 'default' },
  { id: 'vienna', name: 'Viena', country: 'Áustria', cc: 'AT', tz: 'Europe/Vienna', lat: 48.21, lng: 16.37, pop: 2400000, region: 'europa', airport: 'VIE', business: 'default' },
  { id: 'manchester', name: 'Manchester', country: 'Reino Unido', cc: 'GB', tz: 'Europe/London', lat: 53.48, lng: -2.24, pop: 2230000, region: 'europa', airport: 'MAN', business: 'default' },
  { id: 'bucharest', name: 'Bucareste', country: 'Romênia', cc: 'RO', tz: 'Europe/Bucharest', lat: 44.43, lng: 26.1, pop: 1942000, region: 'europa', airport: 'OTP', business: 'default' },
  { id: 'hamburg', name: 'Hamburgo', country: 'Alemanha', cc: 'DE', tz: 'Europe/Berlin', lat: 53.55, lng: 9.99, pop: 1757000, region: 'europa', airport: 'HAM', business: 'default' },
  { id: 'brussels', name: 'Bruxelas', country: 'Bélgica', cc: 'BE', tz: 'Europe/Brussels', lat: 50.85, lng: 4.35, pop: 1743000, region: 'europa', airport: 'BRU', business: 'default' },
  { id: 'warsaw', name: 'Varsóvia', country: 'Polônia', cc: 'PL', tz: 'Europe/Warsaw', lat: 52.23, lng: 21.01, pop: 1707000, region: 'europa', airport: 'WAW', business: 'default' },
  { id: 'budapest', name: 'Budapeste', country: 'Hungria', cc: 'HU', tz: 'Europe/Budapest', lat: 47.5, lng: 19.04, pop: 1679000, region: 'europa', airport: 'BUD', business: 'default' },
  { id: 'munich', name: 'Munique', country: 'Alemanha', cc: 'DE', tz: 'Europe/Berlin', lat: 48.14, lng: 11.58, pop: 1275000, region: 'europa', airport: 'MUC', business: 'default' },
  { id: 'stockholm', name: 'Estocolmo', country: 'Suécia', cc: 'SE', tz: 'Europe/Stockholm', lat: 59.33, lng: 18.06, pop: 1264000, region: 'europa', airport: 'ARN', business: 'default' },
  { id: 'prague', name: 'Praga', country: 'Tchéquia', cc: 'CZ', tz: 'Europe/Prague', lat: 50.08, lng: 14.44, pop: 1162000, region: 'europa', airport: 'PRG', business: 'default' },
  { id: 'helsinki', name: 'Helsinque', country: 'Finlândia', cc: 'FI', tz: 'Europe/Helsinki', lat: 60.17, lng: 24.94, pop: 1115000, region: 'europa', airport: 'HEL', business: 'default' },
  { id: 'zurich', name: 'Zurique', country: 'Suíça', cc: 'CH', tz: 'Europe/Zurich', lat: 47.37, lng: 8.54, pop: 1108000, region: 'europa', airport: 'ZRH', business: 'default' },
  { id: 'copenhagen', name: 'Copenhague', country: 'Dinamarca', cc: 'DK', tz: 'Europe/Copenhagen', lat: 55.68, lng: 12.57, pop: 1085000, region: 'europa', airport: 'CPH', business: 'default' },
  { id: 'dublin', name: 'Dublin', country: 'Irlanda', cc: 'IE', tz: 'Europe/Dublin', lat: 53.35, lng: -6.26, pop: 1059000, region: 'europa', airport: 'DUB', business: 'default' },
  { id: 'amsterdam', name: 'Amsterdã', country: 'Países Baixos', cc: 'NL', tz: 'Europe/Amsterdam', lat: 52.37, lng: 4.9, pop: 1031000, region: 'europa', airport: 'AMS', business: 'default' },
  { id: 'oslo', name: 'Oslo', country: 'Noruega', cc: 'NO', tz: 'Europe/Oslo', lat: 59.91, lng: 10.75, pop: 835000, region: 'europa', airport: 'OSL', business: 'default' },
  { id: 'edinburgh', name: 'Edimburgo', country: 'Reino Unido', cc: 'GB', tz: 'Europe/London', lat: 55.95, lng: -3.19, pop: 504966, region: 'europa', airport: 'EDI', business: 'default' },
  { id: 'reykjavik', name: 'Reykjavík', country: 'Islândia', cc: 'IS', tz: 'Atlantic/Reykjavik', lat: 64.15, lng: -21.94, pop: 166212, region: 'europa', airport: 'KEF', business: 'default' },

  // ===== África =====
  { id: 'cairo', name: 'Cairo', country: 'Egito', cc: 'EG', tz: 'Africa/Cairo', lat: 30.04, lng: 31.24, pop: 11893000, region: 'africa', airport: 'CAI', business: 'default' },
  { id: 'lagos', name: 'Lagos', country: 'Nigéria', cc: 'NG', tz: 'Africa/Lagos', lat: 6.52, lng: 3.38, pop: 9466000, region: 'africa', airport: 'LOS', business: 'default' },
  { id: 'kinshasa', name: 'Quinxassa', country: 'Rep. Dem. do Congo', cc: 'CD', tz: 'Africa/Kinshasa', lat: -4.32, lng: 15.31, pop: 7843000, region: 'africa', airport: 'FIH', business: 'default' },
  { id: 'luanda', name: 'Luanda', country: 'Angola', cc: 'AO', tz: 'Africa/Luanda', lat: -8.84, lng: 13.23, pop: 5172900, region: 'africa', airport: 'LAD', business: 'default' },
  { id: 'khartoum', name: 'Cartum', country: 'Sudão', cc: 'SD', tz: 'Africa/Khartoum', lat: 15.55, lng: 32.53, pop: 4754000, region: 'africa', airport: 'KRT', business: 'default' },
  { id: 'abidjan', name: 'Abidjan', country: 'Costa do Marfim', cc: 'CI', tz: 'Africa/Abidjan', lat: 5.36, lng: -4.01, pop: 3802000, region: 'africa', airport: 'ABJ', business: 'default' },
  { id: 'johannesburg', name: 'Joanesburgo', country: 'África do Sul', cc: 'ZA', tz: 'Africa/Johannesburg', lat: -26.2, lng: 28.05, pop: 3435000, region: 'africa', airport: 'JNB', business: 'default' },
  { id: 'algiers', name: 'Argel', country: 'Argélia', cc: 'DZ', tz: 'Africa/Algiers', lat: 36.75, lng: 3.06, pop: 3354000, region: 'africa', airport: 'ALG', business: 'default' },
  { id: 'cape-town', name: 'Cidade do Cabo', country: 'África do Sul', cc: 'ZA', tz: 'Africa/Johannesburg', lat: -33.92, lng: 18.42, pop: 3215000, region: 'africa', airport: 'CPT', business: 'default' },
  { id: 'casablanca', name: 'Casablanca', country: 'Marrocos', cc: 'MA', tz: 'Africa/Casablanca', lat: 33.57, lng: -7.59, pop: 3181000, region: 'africa', airport: 'CMN', business: 'default' },
  { id: 'addis-ababa', name: 'Adis Abeba', country: 'Etiópia', cc: 'ET', tz: 'Africa/Addis_Ababa', lat: 9.03, lng: 38.74, pop: 3100000, region: 'africa', airport: 'ADD', business: 'default' },
  { id: 'nairobi', name: 'Nairóbi', country: 'Quênia', cc: 'KE', tz: 'Africa/Nairobi', lat: -1.29, lng: 36.82, pop: 3010000, region: 'africa', airport: 'NBO', business: 'default' },
  { id: 'dakar', name: 'Dacar', country: 'Senegal', cc: 'SN', tz: 'Africa/Dakar', lat: 14.72, lng: -17.47, pop: 2604000, region: 'africa', airport: 'DSS', business: 'default' },
  { id: 'tunis', name: 'Túnis', country: 'Tunísia', cc: 'TN', tz: 'Africa/Tunis', lat: 36.81, lng: 10.18, pop: 2412500, region: 'africa', airport: 'TUN', business: 'default' },
  { id: 'accra', name: 'Acra', country: 'Gana', cc: 'GH', tz: 'Africa/Accra', lat: 5.6, lng: -0.19, pop: 2121000, region: 'africa', airport: 'ACC', business: 'default' },
  { id: 'harare', name: 'Harare', country: 'Zimbábue', cc: 'ZW', tz: 'Africa/Harare', lat: -17.83, lng: 31.05, pop: 1572000, region: 'africa', airport: 'HRE', business: 'default' },
  { id: 'maputo', name: 'Maputo', country: 'Moçambique', cc: 'MZ', tz: 'Africa/Maputo', lat: -25.97, lng: 32.57, pop: 1446000, region: 'africa', airport: 'MPM', business: 'default' },

  // ===== Ásia =====
  { id: 'tokyo', name: 'Tóquio', country: 'Japão', cc: 'JP', tz: 'Asia/Tokyo', lat: 35.68, lng: 139.69, pop: 35676000, region: 'asia', airport: 'HND', business: 'default' },
  { id: 'mumbai', name: 'Mumbai', country: 'Índia', cc: 'IN', tz: 'Asia/Kolkata', lat: 19.08, lng: 72.88, pop: 18978000, region: 'asia', airport: 'BOM', business: 'default' },
  { id: 'shanghai', name: 'Xangai', country: 'China', cc: 'CN', tz: 'Asia/Shanghai', lat: 31.23, lng: 121.47, pop: 14987000, region: 'asia', airport: 'PVG', business: 'default' },
  { id: 'kolkata', name: 'Calcutá', country: 'Índia', cc: 'IN', tz: 'Asia/Kolkata', lat: 22.57, lng: 88.36, pop: 14787000, region: 'asia', airport: 'CCU', business: 'default' },
  { id: 'dhaka', name: 'Daca', country: 'Bangladesh', cc: 'BD', tz: 'Asia/Dhaka', lat: 23.81, lng: 90.41, pop: 12797394, region: 'asia', airport: 'DAC', business: 'default' },
  { id: 'karachi', name: 'Karachi', country: 'Paquistão', cc: 'PK', tz: 'Asia/Karachi', lat: 24.86, lng: 67.01, pop: 12130000, region: 'asia', airport: 'KHI', business: 'default' },
  { id: 'osaka', name: 'Osaka', country: 'Japão', cc: 'JP', tz: 'Asia/Tokyo', lat: 34.69, lng: 135.5, pop: 11294000, region: 'asia', airport: 'KIX', business: 'default' },
  { id: 'beijing', name: 'Pequim', country: 'China', cc: 'CN', tz: 'Asia/Shanghai', lat: 39.9, lng: 116.41, pop: 11106000, region: 'asia', airport: 'PEK', business: 'default' },
  { id: 'manila', name: 'Manila', country: 'Filipinas', cc: 'PH', tz: 'Asia/Manila', lat: 14.6, lng: 120.98, pop: 11100000, region: 'asia', airport: 'MNL', business: 'default' },
  { id: 'seoul', name: 'Seul', country: 'Coreia do Sul', cc: 'KR', tz: 'Asia/Seoul', lat: 37.57, lng: 126.98, pop: 9796000, region: 'asia', airport: 'ICN', business: 'default' },
  { id: 'jakarta', name: 'Jacarta', country: 'Indonésia', cc: 'ID', tz: 'Asia/Jakarta', lat: -6.21, lng: 106.85, pop: 9125000, region: 'asia', airport: 'CGK', business: 'default' },
  { id: 'guangzhou', name: 'Cantão', country: 'China', cc: 'CN', tz: 'Asia/Shanghai', lat: 23.13, lng: 113.26, pop: 8829000, region: 'asia', airport: 'CAN', business: 'default' },
  { id: 'tehran', name: 'Teerã', country: 'Irã', cc: 'IR', tz: 'Asia/Tehran', lat: 35.69, lng: 51.39, pop: 7873000, region: 'asia', airport: 'IKA', business: 'default' },
  { id: 'shenzhen', name: 'Shenzhen', country: 'China', cc: 'CN', tz: 'Asia/Shanghai', lat: 22.54, lng: 114.06, pop: 7581000, region: 'asia', airport: 'SZX', business: 'default' },
  { id: 'hong-kong', name: 'Hong Kong', country: 'China', cc: 'HK', tz: 'Asia/Hong_Kong', lat: 22.32, lng: 114.17, pop: 7206000, region: 'asia', airport: 'HKG', business: 'default' },
  { id: 'taipei', name: 'Taipé', country: 'Taiwan', cc: 'TW', tz: 'Asia/Taipei', lat: 25.03, lng: 121.57, pop: 6900273, region: 'asia', airport: 'TPE', business: 'default' },
  { id: 'bengaluru', name: 'Bengaluru', country: 'Índia', cc: 'IN', tz: 'Asia/Kolkata', lat: 12.97, lng: 77.59, pop: 6787000, region: 'asia', airport: 'BLR', business: 'default' },
  { id: 'bangkok', name: 'Bangcoc', country: 'Tailândia', cc: 'TH', tz: 'Asia/Bangkok', lat: 13.76, lng: 100.5, pop: 6704000, region: 'asia', airport: 'BKK', business: 'default' },
  { id: 'ho-chi-minh', name: 'Ho Chi Minh', country: 'Vietnã', cc: 'VN', tz: 'Asia/Ho_Chi_Minh', lat: 10.82, lng: 106.63, pop: 5314000, region: 'asia', airport: 'SGN', business: 'default' },
  { id: 'singapore', name: 'Singapura', country: 'Singapura', cc: 'SG', tz: 'Asia/Singapore', lat: 1.35, lng: 103.82, pop: 5183700, region: 'asia', airport: 'SIN', business: 'default' },
  { id: 'baghdad', name: 'Bagdá', country: 'Iraque', cc: 'IQ', tz: 'Asia/Baghdad', lat: 33.31, lng: 44.36, pop: 5054000, region: 'asia', airport: 'BGW', business: 'gulf' },
  { id: 'riyadh', name: 'Riade', country: 'Arábia Saudita', cc: 'SA', tz: 'Asia/Riyadh', lat: 24.71, lng: 46.68, pop: 4465000, region: 'asia', airport: 'RUH', business: 'gulf' },
  { id: 'hanoi', name: 'Hanói', country: 'Vietnã', cc: 'VN', tz: 'Asia/Ho_Chi_Minh', lat: 21.03, lng: 105.85, pop: 4378000, region: 'asia', airport: 'HAN', business: 'default' },
  { id: 'chengdu', name: 'Chengdu', country: 'China', cc: 'CN', tz: 'Asia/Shanghai', lat: 30.66, lng: 104.06, pop: 4123000, region: 'asia', airport: 'CTU', business: 'default' },
  { id: 'yangon', name: 'Rangum', country: 'Mianmar', cc: 'MM', tz: 'Asia/Yangon', lat: 16.87, lng: 96.2, pop: 4088000, region: 'asia', airport: 'RGN', business: 'default' },
  { id: 'kabul', name: 'Cabul', country: 'Afeganistão', cc: 'AF', tz: 'Asia/Kabul', lat: 34.56, lng: 69.21, pop: 3277000, region: 'asia', airport: 'KBL', business: 'default' },
  { id: 'tel-aviv', name: 'Tel Aviv', country: 'Israel', cc: 'IL', tz: 'Asia/Jerusalem', lat: 32.08, lng: 34.78, pop: 3112000, region: 'asia', airport: 'TLV', business: 'default' },
  { id: 'tashkent', name: 'Tashkent', country: 'Uzbequistão', cc: 'UZ', tz: 'Asia/Tashkent', lat: 41.3, lng: 69.24, pop: 2184000, region: 'asia', airport: 'TAS', business: 'default' },
  { id: 'kuwait', name: 'Cidade do Kuwait', country: 'Kuwait', cc: 'KW', tz: 'Asia/Kuwait', lat: 29.38, lng: 47.99, pop: 2063000, region: 'asia', airport: 'KWI', business: 'gulf' },
  { id: 'beirut', name: 'Beirute', country: 'Líbano', cc: 'LB', tz: 'Asia/Beirut', lat: 33.89, lng: 35.5, pop: 1846000, region: 'asia', airport: 'BEY', business: 'default' },
  { id: 'phnom-penh', name: 'Phnom Penh', country: 'Camboja', cc: 'KH', tz: 'Asia/Phnom_Penh', lat: 11.56, lng: 104.93, pop: 1466000, region: 'asia', airport: 'PNH', business: 'default' },
  { id: 'doha', name: 'Doha', country: 'Catar', cc: 'QA', tz: 'Asia/Qatar', lat: 25.29, lng: 51.53, pop: 1450000, region: 'asia', airport: 'DOH', business: 'gulf' },
  { id: 'kuala-lumpur', name: 'Kuala Lumpur', country: 'Malásia', cc: 'MY', tz: 'Asia/Kuala_Lumpur', lat: 3.14, lng: 101.69, pop: 1448000, region: 'asia', airport: 'KUL', business: 'default' },
  { id: 'novosibirsk', name: 'Novosibirsk', country: 'Rússia', cc: 'RU', tz: 'Asia/Novosibirsk', lat: 55.03, lng: 82.92, pop: 1389000, region: 'asia', airport: 'OVB', business: 'default' },
  { id: 'dubai', name: 'Dubai', country: 'Emirados Árabes Unidos', cc: 'AE', tz: 'Asia/Dubai', lat: 25.2, lng: 55.27, pop: 1379000, region: 'asia', airport: 'DXB', business: 'gulf' },
  { id: 'almaty', name: 'Almaty', country: 'Cazaquistão', cc: 'KZ', tz: 'Asia/Almaty', lat: 43.24, lng: 76.89, pop: 1209000, region: 'asia', airport: 'ALA', business: 'default' },
  { id: 'amman', name: 'Amã', country: 'Jordânia', cc: 'JO', tz: 'Asia/Amman', lat: 31.95, lng: 35.93, pop: 1060000, region: 'asia', airport: 'AMM', business: 'default' },
  { id: 'jerusalem', name: 'Jerusalém', country: 'Israel', cc: 'IL', tz: 'Asia/Jerusalem', lat: 31.77, lng: 35.21, pop: 1029300, region: 'asia', airport: 'TLV', business: 'default' },
  { id: 'kathmandu', name: 'Catmandu', country: 'Nepal', cc: 'NP', tz: 'Asia/Kathmandu', lat: 27.72, lng: 85.32, pop: 895000, region: 'asia', airport: 'KTM', business: 'default' },
  { id: 'ulaanbaatar', name: 'Ulan Bator', country: 'Mongólia', cc: 'MN', tz: 'Asia/Ulaanbaatar', lat: 47.89, lng: 106.91, pop: 885000, region: 'asia', airport: 'UBN', business: 'default' },
  { id: 'islamabad', name: 'Islamabad', country: 'Paquistão', cc: 'PK', tz: 'Asia/Karachi', lat: 33.68, lng: 73.05, pop: 780000, region: 'asia', airport: 'ISB', business: 'default' },
  { id: 'muscat', name: 'Mascate', country: 'Omã', cc: 'OM', tz: 'Asia/Muscat', lat: 23.61, lng: 58.59, pop: 734697, region: 'asia', airport: 'MCT', business: 'default' },
  { id: 'abu-dhabi', name: 'Abu Dhabi', country: 'Emirados Árabes Unidos', cc: 'AE', tz: 'Asia/Dubai', lat: 24.45, lng: 54.38, pop: 603492, region: 'asia', airport: 'AUH', business: 'gulf' },
  { id: 'vladivostok', name: 'Vladivostok', country: 'Rússia', cc: 'RU', tz: 'Asia/Vladivostok', lat: 43.12, lng: 131.89, pop: 587022, region: 'asia', airport: 'VVO', business: 'default' },
  { id: 'manama', name: 'Manama', country: 'Bahrein', cc: 'BH', tz: 'Asia/Bahrain', lat: 26.23, lng: 50.59, pop: 563920, region: 'asia', airport: 'BAH', business: 'default' },
  { id: 'new-delhi', name: 'Nova Délhi', country: 'Índia', cc: 'IN', tz: 'Asia/Kolkata', lat: 28.61, lng: 77.21, pop: 317797, region: 'asia', airport: 'DEL', business: 'default' },
  { id: 'colombo', name: 'Colombo', country: 'Sri Lanka', cc: 'LK', tz: 'Asia/Colombo', lat: 6.93, lng: 79.85, pop: 217000, region: 'asia', airport: 'CMB', business: 'default' },

  // ===== Oceania =====
  { id: 'sydney', name: 'Sydney', country: 'Austrália', cc: 'AU', tz: 'Australia/Sydney', lat: -33.87, lng: 151.21, pop: 4630000, region: 'oceania', airport: 'SYD', business: 'default' },
  { id: 'melbourne', name: 'Melbourne', country: 'Austrália', cc: 'AU', tz: 'Australia/Melbourne', lat: -37.81, lng: 144.96, pop: 4170000, region: 'oceania', airport: 'MEL', business: 'default' },
  { id: 'brisbane', name: 'Brisbane', country: 'Austrália', cc: 'AU', tz: 'Australia/Brisbane', lat: -27.47, lng: 153.03, pop: 1860000, region: 'oceania', airport: 'BNE', business: 'default' },
  { id: 'perth', name: 'Perth', country: 'Austrália', cc: 'AU', tz: 'Australia/Perth', lat: -31.95, lng: 115.86, pop: 1532000, region: 'oceania', airport: 'PER', business: 'default' },
  { id: 'auckland', name: 'Auckland', country: 'Nova Zelândia', cc: 'NZ', tz: 'Pacific/Auckland', lat: -36.85, lng: 174.76, pop: 1377200, region: 'oceania', airport: 'AKL', business: 'default' },
  { id: 'adelaide', name: 'Adelaide', country: 'Austrália', cc: 'AU', tz: 'Australia/Adelaide', lat: -34.93, lng: 138.6, pop: 1145000, region: 'oceania', airport: 'ADL', business: 'default' },
  { id: 'honolulu', name: 'Honolulu', country: 'Estados Unidos', cc: 'US', tz: 'Pacific/Honolulu', lat: 21.31, lng: -157.86, pop: 786000, region: 'oceania', airport: 'HNL', business: 'default' },
  { id: 'wellington', name: 'Wellington', country: 'Nova Zelândia', cc: 'NZ', tz: 'Pacific/Auckland', lat: -41.29, lng: 174.78, pop: 393400, region: 'oceania', airport: 'WLG', business: 'default' },
  { id: 'christchurch', name: 'Christchurch', country: 'Nova Zelândia', cc: 'NZ', tz: 'Pacific/Auckland', lat: -43.53, lng: 172.64, pop: 363200, region: 'oceania', airport: 'CHC', business: 'default' },
  { id: 'port-moresby', name: 'Port Moresby', country: 'Papua-Nova Guiné', cc: 'PG', tz: 'Pacific/Port_Moresby', lat: -9.44, lng: 147.18, pop: 283733, region: 'oceania', airport: 'POM', business: 'default' },
  { id: 'suva', name: 'Suva', country: 'Fiji', cc: 'FJ', tz: 'Pacific/Fiji', lat: -18.14, lng: 178.44, pop: 175399, region: 'oceania', airport: 'SUV', business: 'default' },
  { id: 'papeete', name: 'Papeete', country: 'Polinésia Francesa', cc: 'PF', tz: 'Pacific/Tahiti', lat: -17.54, lng: -149.57, pop: 131695, region: 'oceania', airport: 'PPT', business: 'default' },
  { id: 'darwin', name: 'Darwin', country: 'Austrália', cc: 'AU', tz: 'Australia/Darwin', lat: -12.46, lng: 130.84, pop: 93080, region: 'oceania', airport: 'DRW', business: 'default' },
  { id: 'noumea', name: 'Numeá', country: 'Nova Caledônia', cc: 'NC', tz: 'Pacific/Noumea', lat: -22.28, lng: 166.46, pop: 93060, region: 'oceania', airport: 'NOU', business: 'default' },
  { id: 'apia', name: 'Apia', country: 'Samoa', cc: 'WS', tz: 'Pacific/Apia', lat: -13.83, lng: -171.77, pop: 61916, region: 'oceania', airport: 'APW', business: 'default' },
];

export const CITY_BY_ID: Record<string, City> = CITIES.reduce<Record<string, City>>((m, c) => {
  m[c.id] = c;
  return m;
}, {});

export function getCity(id: string | null | undefined): City | null {
  return (id && CITY_BY_ID[id]) || null;
}

/** Bandeira emoji derivada do ISO-2 — zero asset, zero requisição. */
export function flagOf(cc: string): string {
  if (!cc || cc.length !== 2) return '🏳️';
  const base = 0x1f1e6;
  return String.fromCodePoint(
    base + (cc.charCodeAt(0) - 65),
    base + (cc.charCodeAt(1) - 65),
  );
}

function norm(s: string): string {
  return (s || '').toString().toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
}

export interface SearchGroup {
  label: string;
  items: City[];
}

/**
 * Busca agrupada (o briefing pede "agrupar resultados"): cidade, país e aeroporto
 * viram grupos separados, e o ranking prioriza prefixo > população.
 */
export function searchGrouped(query: string, limitPerGroup = 6): SearchGroup[] {
  const q = norm(query).trim();
  if (!q) return [];

  const byName: City[] = [];
  const byCountry: City[] = [];
  const byAirport: City[] = [];

  for (const c of CITIES) {
    const n = norm(c.name);
    if (n.startsWith(q)) byName.unshift(c);
    else if (n.includes(q)) byName.push(c);
    else if (norm(c.country).includes(q)) byCountry.push(c);
    else if (norm(c.airport) === q || norm(c.airport).startsWith(q)) byAirport.push(c);
  }

  const rank = (a: City, b: City) => b.pop - a.pop;
  byCountry.sort(rank);
  byAirport.sort(rank);

  const groups: SearchGroup[] = [];
  if (byName.length) groups.push({ label: 'Cidades', items: byName.slice(0, limitPerGroup) });
  if (byCountry.length) groups.push({ label: 'Países', items: byCountry.slice(0, limitPerGroup) });
  if (byAirport.length) groups.push({ label: 'Aeroportos', items: byAirport.slice(0, limitPerGroup) });
  return groups;
}

/** Busca plana (usada pelo autocomplete de "adicionar cidade"). */
export function searchCities(query: string, limit = 10): City[] {
  return searchGrouped(query, limit).flatMap((g) => g.items).slice(0, limit);
}

export const REGION_LABEL: Record<Region, string> = {
  americas: 'Américas',
  europa: 'Europa',
  africa: 'África',
  asia: 'Ásia',
  oceania: 'Oceania',
};
