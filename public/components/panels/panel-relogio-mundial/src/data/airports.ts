/**
 * data/airports.ts — aeroportos internacionais principais (156), com ICAO e IATA reais.
 * @version 3.1.0
 *
 * FONTE: OurAirports (domínio público, davidmegginson.github.io/ourairports-data).
 * Cruzado com data/cities.ts pelo IATA: cada registro carrega o ICAO oficial e as
 * COORDENADAS DO AEROPORTO — não as da cidade. É por isso que GRU aparece em
 * Guarulhos e não no centro de São Paulo; a camada tem que ser cartograficamente
 * honesta para valer alguma coisa sobre um mapa.
 *
 * A zona IANA é herdada da cidade-sede: aeroporto e cidade compartilham fuso em
 * todos os 156 casos desta base (verificado na geração).
 *
 * SOBRE STATUS (o briefing pede o campo): não existe aqui nada de operação ao vivo
 * — atrasos, voos, pistas — porque isso exigiria uma API de tráfego aéreo que este
 * módulo não tem. O que existe é o campo REAL do OurAirports `scheduled_service`,
 * que diz se o aeroporto tem serviço comercial regular programado. Não é decoração:
 * KBP (Kiev) aparece como SEM serviço regular, refletindo a suspensão da aviação
 * civil ucraniana. Inventar um Operacional verde para todo mundo seria pior que
 * não ter campo nenhum.
 */
'use strict';

export type AirportType = 'grande' | 'medio';

export interface Airport {
  /** Código IATA de 3 letras (GRU, JFK, HND). */
  iata: string;
  /** Código ICAO de 4 letras (SBGR, KJFK, RJTT). */
  icao: string;
  name: string;
  /** id em data/cities.ts. */
  cityId: string;
  tz: string;
  lat: number;
  lng: number;
  cc: string;
  /** Município onde o aeroporto fica de fato (≠ cidade-sede em vários casos). */
  muni: string;
  type: AirportType;
  /** Elevação em pés. */
  elev: number | null;
  /** Tem serviço comercial regular programado (campo do OurAirports). */
  scheduled: boolean;
}

export const AIRPORTS: Airport[] = [
  { iata: 'GRU', icao: 'SBGR', name: 'São Paulo/Guarulhos–Governor André Franco Montoro International Airport', cityId: 'sao-paulo', tz: 'America/Sao_Paulo', lat: -23.4313, lng: -46.47, cc: 'BR', muni: 'São Paulo', type: 'grande', elev: 2461, scheduled: true },
  { iata: 'GIG', icao: 'SBGL', name: 'Rio Galeão – Tom Jobim International Airport', cityId: 'rio-de-janeiro', tz: 'America/Sao_Paulo', lat: -22.81, lng: -43.2506, cc: 'BR', muni: 'Rio De Janeiro', type: 'grande', elev: 28, scheduled: true },
  { iata: 'BSB', icao: 'SBBR', name: 'Presidente Juscelino Kubitschek International Airport', cityId: 'brasilia', tz: 'America/Sao_Paulo', lat: -15.8692, lng: -47.9208, cc: 'BR', muni: 'Brasília', type: 'grande', elev: 3497, scheduled: true },
  { iata: 'MAO', icao: 'SBEG', name: 'Eduardo Gomes International Airport', cityId: 'manaus', tz: 'America/Manaus', lat: -3.0386, lng: -60.0497, cc: 'BR', muni: 'Manaus', type: 'grande', elev: 264, scheduled: true },
  { iata: 'EZE', icao: 'SAEZ', name: 'Ezeiza International Airport - Ministro Pistarini', cityId: 'buenos-aires', tz: 'America/Argentina/Buenos_Aires', lat: -34.8222, lng: -58.5358, cc: 'AR', muni: 'Buenos Aires (Ezeiza)', type: 'grande', elev: 67, scheduled: true },
  { iata: 'SCL', icao: 'SCEL', name: 'Comodoro Arturo Merino Benítez International Airport', cityId: 'santiago', tz: 'America/Santiago', lat: -33.393, lng: -70.7858, cc: 'CL', muni: 'Santiago', type: 'grande', elev: 1555, scheduled: true },
  { iata: 'LIM', icao: 'SPJC', name: 'Jorge Chávez International Airport', cityId: 'lima', tz: 'America/Lima', lat: -12.0219, lng: -77.1143, cc: 'PE', muni: 'Lima', type: 'grande', elev: 113, scheduled: true },
  { iata: 'BOG', icao: 'SKBO', name: 'El Dorado International Airport', cityId: 'bogota', tz: 'America/Bogota', lat: 4.7016, lng: -74.1469, cc: 'CO', muni: 'Bogota', type: 'grande', elev: 8361, scheduled: true },
  { iata: 'CCS', icao: 'SVMI', name: 'Maiquetía Simón Bolívar International Airport', cityId: 'caracas', tz: 'America/Caracas', lat: 10.6022, lng: -66.9912, cc: 'VE', muni: 'Maiquetía', type: 'grande', elev: 234, scheduled: true },
  { iata: 'MVD', icao: 'SUMU', name: 'Carrasco General Cesáreo L. Berisso International Airport', cityId: 'montevideo', tz: 'America/Montevideo', lat: -34.8356, lng: -56.0265, cc: 'UY', muni: 'Ciudad de la Costa', type: 'grande', elev: 105, scheduled: true },
  { iata: 'LPB', icao: 'SLLP', name: 'El Alto International Airport', cityId: 'la-paz', tz: 'America/La_Paz', lat: -16.5103, lng: -68.1894, cc: 'BO', muni: 'La Paz / El Alto', type: 'grande', elev: 13355, scheduled: true },
  { iata: 'ASU', icao: 'SGAS', name: 'Silvio Pettirossi International Airport', cityId: 'asuncion', tz: 'America/Asuncion', lat: -25.2402, lng: -57.5192, cc: 'PY', muni: 'Asunción', type: 'grande', elev: 292, scheduled: true },
  { iata: 'UIO', icao: 'SEQM', name: 'Mariscal Sucre International Airport', cityId: 'quito', tz: 'America/Guayaquil', lat: -0.1254, lng: -78.3543, cc: 'EC', muni: 'Quito', type: 'grande', elev: 7841, scheduled: true },
  { iata: 'JFK', icao: 'KJFK', name: 'John F. Kennedy International Airport', cityId: 'new-york', tz: 'America/New_York', lat: 40.6394, lng: -73.7793, cc: 'US', muni: 'New York', type: 'grande', elev: 13, scheduled: true },
  { iata: 'LAX', icao: 'KLAX', name: 'Los Angeles International Airport', cityId: 'los-angeles', tz: 'America/Los_Angeles', lat: 33.9425, lng: -118.408, cc: 'US', muni: 'Los Angeles', type: 'grande', elev: 125, scheduled: true },
  { iata: 'ORD', icao: 'KORD', name: 'Chicago O\'Hare International Airport', cityId: 'chicago', tz: 'America/Chicago', lat: 41.9786, lng: -87.9048, cc: 'US', muni: 'Chicago', type: 'grande', elev: 680, scheduled: true },
  { iata: 'DEN', icao: 'KDEN', name: 'Denver International Airport', cityId: 'denver', tz: 'America/Denver', lat: 39.86, lng: -104.6738, cc: 'US', muni: 'Denver', type: 'grande', elev: 5431, scheduled: true },
  { iata: 'MIA', icao: 'KMIA', name: 'Miami International Airport', cityId: 'miami', tz: 'America/New_York', lat: 25.796, lng: -80.2898, cc: 'US', muni: 'Miami', type: 'grande', elev: 8, scheduled: true },
  { iata: 'SFO', icao: 'KSFO', name: 'San Francisco International Airport', cityId: 'san-francisco', tz: 'America/Los_Angeles', lat: 37.6198, lng: -122.3748, cc: 'US', muni: 'San Francisco', type: 'grande', elev: 13, scheduled: true },
  { iata: 'IAD', icao: 'KIAD', name: 'Washington Dulles International Airport', cityId: 'washington', tz: 'America/New_York', lat: 38.9445, lng: -77.4558, cc: 'US', muni: 'Dulles', type: 'grande', elev: 312, scheduled: true },
  { iata: 'YYZ', icao: 'CYYZ', name: 'Toronto Pearson International Airport', cityId: 'toronto', tz: 'America/Toronto', lat: 43.6759, lng: -79.6294, cc: 'CA', muni: 'Toronto', type: 'grande', elev: 569, scheduled: true },
  { iata: 'YVR', icao: 'CYVR', name: 'Vancouver International Airport', cityId: 'vancouver', tz: 'America/Vancouver', lat: 49.1939, lng: -123.184, cc: 'CA', muni: 'Vancouver', type: 'grande', elev: 14, scheduled: true },
  { iata: 'MEX', icao: 'MMMX', name: 'Mexico City Benito Juárez International Airport', cityId: 'mexico-city', tz: 'America/Mexico_City', lat: 19.4358, lng: -99.0703, cc: 'MX', muni: 'Mexico City', type: 'grande', elev: 7316, scheduled: true },
  { iata: 'HAV', icao: 'MUHA', name: 'José Martí International Airport', cityId: 'havana', tz: 'America/Havana', lat: 22.9892, lng: -82.4091, cc: 'CU', muni: 'Havana', type: 'grande', elev: 210, scheduled: true },
  { iata: 'PTY', icao: 'MPTO', name: 'Tocumen International Airport', cityId: 'panama', tz: 'America/Panama', lat: 9.0714, lng: -79.3835, cc: 'PA', muni: 'Tocumen', type: 'grande', elev: 135, scheduled: true },
  { iata: 'GUA', icao: 'MGGT', name: 'La Aurora International Airport', cityId: 'guatemala', tz: 'America/Guatemala', lat: 14.5829, lng: -90.5275, cc: 'GT', muni: 'Guatemala City', type: 'grande', elev: 4952, scheduled: true },
  { iata: 'ANC', icao: 'PANC', name: 'Ted Stevens Anchorage International Airport', cityId: 'anchorage', tz: 'America/Anchorage', lat: 61.179, lng: -149.9926, cc: 'US', muni: 'Anchorage', type: 'grande', elev: 152, scheduled: true },
  { iata: 'HNL', icao: 'PHNL', name: 'Daniel K. Inouye International Airport', cityId: 'honolulu', tz: 'Pacific/Honolulu', lat: 21.3184, lng: -157.9257, cc: 'US', muni: 'Honolulu, Oahu', type: 'grande', elev: 13, scheduled: true },
  { iata: 'LHR', icao: 'EGLL', name: 'London Heathrow Airport', cityId: 'london', tz: 'Europe/London', lat: 51.4707, lng: -0.4599, cc: 'GB', muni: 'London', type: 'grande', elev: 83, scheduled: true },
  { iata: 'CDG', icao: 'LFPG', name: 'Charles de Gaulle International Airport', cityId: 'paris', tz: 'Europe/Paris', lat: 49.009, lng: 2.5541, cc: 'FR', muni: 'Paris (Roissy-en-France, Val-d\'Oise)', type: 'grande', elev: 392, scheduled: true },
  { iata: 'BER', icao: 'EDDB', name: 'Berlin Brandenburg Airport', cityId: 'berlin', tz: 'Europe/Berlin', lat: 52.3617, lng: 13.5023, cc: 'DE', muni: 'Berlin', type: 'grande', elev: 157, scheduled: true },
  { iata: 'MAD', icao: 'LEMD', name: 'Adolfo Suárez Madrid–Barajas Airport', cityId: 'madrid', tz: 'Europe/Madrid', lat: 40.4934, lng: -3.5722, cc: 'ES', muni: 'Madrid', type: 'grande', elev: 1998, scheduled: true },
  { iata: 'FCO', icao: 'LIRF', name: 'Rome–Fiumicino Leonardo da Vinci International Airport', cityId: 'rome', tz: 'Europe/Rome', lat: 41.8045, lng: 12.252, cc: 'IT', muni: 'Rome', type: 'grande', elev: 13, scheduled: true },
  { iata: 'LIS', icao: 'LPPT', name: 'Lisbon Humberto Delgado Airport', cityId: 'lisbon', tz: 'Europe/Lisbon', lat: 38.7813, lng: -9.1359, cc: 'PT', muni: 'Lisbon', type: 'grande', elev: 374, scheduled: true },
  { iata: 'AMS', icao: 'EHAM', name: 'Amsterdam Airport Schiphol', cityId: 'amsterdam', tz: 'Europe/Amsterdam', lat: 52.3086, lng: 4.7639, cc: 'NL', muni: 'Amsterdam', type: 'grande', elev: -11, scheduled: true },
  { iata: 'BRU', icao: 'EBBR', name: 'Brussels Airport', cityId: 'brussels', tz: 'Europe/Brussels', lat: 50.9014, lng: 4.4844, cc: 'BE', muni: 'Zaventem', type: 'grande', elev: 175, scheduled: true },
  { iata: 'ZRH', icao: 'LSZH', name: 'Zürich Airport', cityId: 'zurich', tz: 'Europe/Zurich', lat: 47.4581, lng: 8.5481, cc: 'CH', muni: 'Zurich', type: 'grande', elev: 1417, scheduled: true },
  { iata: 'VIE', icao: 'LOWW', name: 'Vienna International Airport', cityId: 'vienna', tz: 'Europe/Vienna', lat: 48.1103, lng: 16.5697, cc: 'AT', muni: 'Vienna', type: 'grande', elev: 600, scheduled: true },
  { iata: 'DUB', icao: 'EIDW', name: 'Dublin Airport', cityId: 'dublin', tz: 'Europe/Dublin', lat: 53.4287, lng: -6.2621, cc: 'IE', muni: 'Dublin', type: 'grande', elev: 242, scheduled: true },
  { iata: 'ARN', icao: 'ESSA', name: 'Stockholm-Arlanda Airport', cityId: 'stockholm', tz: 'Europe/Stockholm', lat: 59.6485, lng: 17.9288, cc: 'SE', muni: 'Stockholm', type: 'grande', elev: 137, scheduled: true },
  { iata: 'OSL', icao: 'ENGM', name: 'Oslo-Gardermoen International Airport', cityId: 'oslo', tz: 'Europe/Oslo', lat: 60.1939, lng: 11.1004, cc: 'NO', muni: 'Oslo (Gardermoen)', type: 'grande', elev: 681, scheduled: true },
  { iata: 'CPH', icao: 'EKCH', name: 'Copenhagen Kastrup Airport', cityId: 'copenhagen', tz: 'Europe/Copenhagen', lat: 55.6179, lng: 12.656, cc: 'DK', muni: 'Copenhagen', type: 'grande', elev: 17, scheduled: true },
  { iata: 'HEL', icao: 'EFHK', name: 'Helsinki Vantaa Airport', cityId: 'helsinki', tz: 'Europe/Helsinki', lat: 60.3184, lng: 24.9633, cc: 'FI', muni: 'Helsinki (Vantaa)', type: 'grande', elev: 179, scheduled: true },
  { iata: 'WAW', icao: 'EPWA', name: 'Warsaw Chopin Airport', cityId: 'warsaw', tz: 'Europe/Warsaw', lat: 52.1657, lng: 20.9671, cc: 'PL', muni: 'Warsaw', type: 'grande', elev: 362, scheduled: true },
  { iata: 'PRG', icao: 'LKPR', name: 'Václav Havel Airport Prague', cityId: 'prague', tz: 'Europe/Prague', lat: 50.1009, lng: 14.2599, cc: 'CZ', muni: 'Prague', type: 'grande', elev: 1247, scheduled: true },
  { iata: 'BUD', icao: 'LHBP', name: 'Budapest Liszt Ferenc International Airport', cityId: 'budapest', tz: 'Europe/Budapest', lat: 47.4302, lng: 19.2624, cc: 'HU', muni: 'Budapest', type: 'grande', elev: 495, scheduled: true },
  { iata: 'ATH', icao: 'LGAV', name: 'Athens Eleftherios Venizelos International Airport', cityId: 'athens', tz: 'Europe/Athens', lat: 37.9364, lng: 23.9445, cc: 'GR', muni: 'Spata-Artemida', type: 'grande', elev: 308, scheduled: true },
  { iata: 'OTP', icao: 'LROP', name: 'Bucharest Henri Coandă International Airport', cityId: 'bucharest', tz: 'Europe/Bucharest', lat: 44.5718, lng: 26.1033, cc: 'RO', muni: 'Otopeni', type: 'grande', elev: 314, scheduled: true },
  { iata: 'KBP', icao: 'UKBB', name: 'Boryspil International Airport', cityId: 'kyiv', tz: 'Europe/Kyiv', lat: 50.345, lng: 30.8947, cc: 'UA', muni: 'Boryspil', type: 'medio', elev: 427, scheduled: false },
  { iata: 'SVO', icao: 'UUEE', name: 'Sheremetyevo International Airport', cityId: 'moscow', tz: 'Europe/Moscow', lat: 55.9769, lng: 37.4112, cc: 'RU', muni: 'Moscow', type: 'grande', elev: 622, scheduled: true },
  { iata: 'IST', icao: 'LTFM', name: 'İstanbul Airport', cityId: 'istanbul', tz: 'Europe/Istanbul', lat: 41.2749, lng: 28.7321, cc: 'TR', muni: 'Istanbul', type: 'grande', elev: 325, scheduled: true },
  { iata: 'KEF', icao: 'BIKF', name: 'Keflavik International Airport', cityId: 'reykjavik', tz: 'Atlantic/Reykjavik', lat: 63.985, lng: -22.6056, cc: 'IS', muni: 'Reykjavík', type: 'grande', elev: 171, scheduled: true },
  { iata: 'JNB', icao: 'FAOR', name: 'O.R. Tambo International Airport', cityId: 'johannesburg', tz: 'Africa/Johannesburg', lat: -26.1401, lng: 28.2468, cc: 'ZA', muni: 'Johannesburg', type: 'grande', elev: 5558, scheduled: true },
  { iata: 'CPT', icao: 'FACT', name: 'Cape Town International Airport', cityId: 'cape-town', tz: 'Africa/Johannesburg', lat: -33.974, lng: 18.6043, cc: 'ZA', muni: 'Cape Town', type: 'grande', elev: 151, scheduled: true },
  { iata: 'CAI', icao: 'HECA', name: 'Cairo International Airport', cityId: 'cairo', tz: 'Africa/Cairo', lat: 30.1115, lng: 31.3967, cc: 'EG', muni: 'Cairo', type: 'grande', elev: 322, scheduled: true },
  { iata: 'LOS', icao: 'DNMM', name: 'Murtala Muhammed International Airport', cityId: 'lagos', tz: 'Africa/Lagos', lat: 6.5774, lng: 3.3212, cc: 'NG', muni: 'Lagos', type: 'grande', elev: 135, scheduled: true },
  { iata: 'NBO', icao: 'HKJK', name: 'Jomo Kenyatta International Airport', cityId: 'nairobi', tz: 'Africa/Nairobi', lat: -1.3189, lng: 36.9282, cc: 'KE', muni: 'Nairobi', type: 'grande', elev: 5330, scheduled: true },
  { iata: 'CMN', icao: 'GMMN', name: 'Mohammed V International Airport', cityId: 'casablanca', tz: 'Africa/Casablanca', lat: 33.3675, lng: -7.59, cc: 'MA', muni: 'Casablanca', type: 'grande', elev: 656, scheduled: true },
  { iata: 'ADD', icao: 'HAAB', name: 'Addis Ababa Bole International Airport', cityId: 'addis-ababa', tz: 'Africa/Addis_Ababa', lat: 8.9779, lng: 38.7993, cc: 'ET', muni: 'Addis Ababa', type: 'grande', elev: 7630, scheduled: true },
  { iata: 'ACC', icao: 'DGAA', name: 'Kotoka International Airport', cityId: 'accra', tz: 'Africa/Accra', lat: 5.6052, lng: -0.1668, cc: 'GH', muni: 'Accra', type: 'grande', elev: 205, scheduled: true },
  { iata: 'ALG', icao: 'DAAG', name: 'Houari Boumediene Airport', cityId: 'algiers', tz: 'Africa/Algiers', lat: 36.6939, lng: 3.2145, cc: 'DZ', muni: 'Algiers', type: 'grande', elev: 82, scheduled: true },
  { iata: 'DSS', icao: 'GOBD', name: 'Blaise Diagne International Airport', cityId: 'dakar', tz: 'Africa/Dakar', lat: 14.6709, lng: -17.0728, cc: 'SN', muni: 'Dakar', type: 'grande', elev: 290, scheduled: true },
  { iata: 'FIH', icao: 'FZAA', name: 'Ndjili International Airport', cityId: 'kinshasa', tz: 'Africa/Kinshasa', lat: -4.3857, lng: 15.4446, cc: 'CD', muni: 'Kinshasa', type: 'grande', elev: 1027, scheduled: true },
  { iata: 'LAD', icao: 'FNLU', name: 'Quatro de Fevereiro International Airport', cityId: 'luanda', tz: 'Africa/Luanda', lat: -8.8584, lng: 13.2312, cc: 'AO', muni: 'Luanda', type: 'grande', elev: 243, scheduled: true },
  { iata: 'TUN', icao: 'DTTA', name: 'Tunis Carthage International Airport', cityId: 'tunis', tz: 'Africa/Tunis', lat: 36.851, lng: 10.2272, cc: 'TN', muni: 'Tunis', type: 'grande', elev: 22, scheduled: true },
  { iata: 'DXB', icao: 'OMDB', name: 'Dubai International Airport', cityId: 'dubai', tz: 'Asia/Dubai', lat: 25.2498, lng: 55.371, cc: 'AE', muni: 'Dubai', type: 'grande', elev: 62, scheduled: true },
  { iata: 'AUH', icao: 'OMAA', name: 'Zayed International Airport', cityId: 'abu-dhabi', tz: 'Asia/Dubai', lat: 24.441, lng: 54.6492, cc: 'AE', muni: 'Abu Dhabi', type: 'grande', elev: 88, scheduled: true },
  { iata: 'RUH', icao: 'OERK', name: 'King Khalid International Airport', cityId: 'riyadh', tz: 'Asia/Riyadh', lat: 24.9576, lng: 46.6988, cc: 'SA', muni: 'Riyadh', type: 'grande', elev: 2049, scheduled: true },
  { iata: 'DOH', icao: 'OTHH', name: 'Hamad International Airport', cityId: 'doha', tz: 'Asia/Qatar', lat: 25.2731, lng: 51.6081, cc: 'QA', muni: 'Doha', type: 'grande', elev: 13, scheduled: true },
  { iata: 'IKA', icao: 'OIIE', name: 'Imam Khomeini International Airport', cityId: 'tehran', tz: 'Asia/Tehran', lat: 35.4161, lng: 51.1522, cc: 'IR', muni: 'Tehran', type: 'grande', elev: 3305, scheduled: true },
  { iata: 'TLV', icao: 'LLBG', name: 'Ben Gurion International Airport', cityId: 'jerusalem', tz: 'Asia/Jerusalem', lat: 32.0114, lng: 34.8867, cc: 'IL', muni: 'Tel Aviv', type: 'grande', elev: 135, scheduled: true },
  { iata: 'BGW', icao: 'ORBI', name: 'Baghdad International Airport / New Al Muthana Air Base', cityId: 'baghdad', tz: 'Asia/Baghdad', lat: 33.2625, lng: 44.2346, cc: 'IQ', muni: 'Baghdad', type: 'grande', elev: 114, scheduled: true },
  { iata: 'KWI', icao: 'OKKK', name: 'Kuwait International Airport', cityId: 'kuwait', tz: 'Asia/Kuwait', lat: 29.2245, lng: 47.9698, cc: 'KW', muni: 'Kuwait City', type: 'grande', elev: 206, scheduled: true },
  { iata: 'BEY', icao: 'OLBA', name: 'Beirut Rafic Hariri International Airport', cityId: 'beirut', tz: 'Asia/Beirut', lat: 33.8198, lng: 35.4874, cc: 'LB', muni: 'Beirut', type: 'grande', elev: 87, scheduled: true },
  { iata: 'DEL', icao: 'VIDP', name: 'Indira Gandhi International Airport', cityId: 'new-delhi', tz: 'Asia/Kolkata', lat: 28.5556, lng: 77.0952, cc: 'IN', muni: 'New Delhi', type: 'grande', elev: 777, scheduled: true },
  { iata: 'BOM', icao: 'VABB', name: 'Chhatrapati Shivaji Maharaj International Airport', cityId: 'mumbai', tz: 'Asia/Kolkata', lat: 19.0887, lng: 72.8679, cc: 'IN', muni: 'Mumbai', type: 'grande', elev: 39, scheduled: true },
  { iata: 'BLR', icao: 'VOBL', name: 'Kempegowda International Airport Bengaluru', cityId: 'bengaluru', tz: 'Asia/Kolkata', lat: 13.1979, lng: 77.7063, cc: 'IN', muni: 'Bengaluru', type: 'grande', elev: 3000, scheduled: true },
  { iata: 'CCU', icao: 'VECC', name: 'Netaji Subhash Chandra Bose International Airport', cityId: 'kolkata', tz: 'Asia/Kolkata', lat: 22.654, lng: 88.4476, cc: 'IN', muni: 'Kolkata', type: 'grande', elev: 16, scheduled: true },
  { iata: 'KHI', icao: 'OPKC', name: 'Jinnah International Airport', cityId: 'karachi', tz: 'Asia/Karachi', lat: 24.9065, lng: 67.1608, cc: 'PK', muni: 'Karachi', type: 'grande', elev: 100, scheduled: true },
  { iata: 'ISB', icao: 'OPIS', name: 'Islamabad International Airport', cityId: 'islamabad', tz: 'Asia/Karachi', lat: 33.549, lng: 72.8257, cc: 'PK', muni: 'Attock', type: 'grande', elev: 1761, scheduled: true },
  { iata: 'DAC', icao: 'VGHS', name: 'Hazrat Shahjalal International Airport', cityId: 'dhaka', tz: 'Asia/Dhaka', lat: 23.8433, lng: 90.3978, cc: 'BD', muni: 'Dhaka', type: 'grande', elev: 30, scheduled: true },
  { iata: 'KTM', icao: 'VNKT', name: 'Tribhuvan International Airport', cityId: 'kathmandu', tz: 'Asia/Kathmandu', lat: 27.6966, lng: 85.3591, cc: 'NP', muni: 'Kathmandu', type: 'grande', elev: 4390, scheduled: true },
  { iata: 'CMB', icao: 'VCBI', name: 'Bandaranaike International Colombo Airport', cityId: 'colombo', tz: 'Asia/Colombo', lat: 7.1808, lng: 79.8841, cc: 'LK', muni: 'Colombo', type: 'grande', elev: 30, scheduled: true },
  { iata: 'TAS', icao: 'UZTT', name: 'Tashkent International Airport', cityId: 'tashkent', tz: 'Asia/Tashkent', lat: 41.2579, lng: 69.2812, cc: 'UZ', muni: 'Tashkent', type: 'grande', elev: 1417, scheduled: true },
  { iata: 'ALA', icao: 'UAAA', name: 'Almaty International Airport', cityId: 'almaty', tz: 'Asia/Almaty', lat: 43.3543, lng: 77.0428, cc: 'KZ', muni: 'Almaty', type: 'grande', elev: 2234, scheduled: true },
  { iata: 'KBL', icao: 'OAKB', name: 'Kabul International Airport', cityId: 'kabul', tz: 'Asia/Kabul', lat: 34.5659, lng: 69.2123, cc: 'AF', muni: 'Kabul', type: 'grande', elev: 5877, scheduled: true },
  { iata: 'PEK', icao: 'ZBAA', name: 'Beijing Capital International Airport', cityId: 'beijing', tz: 'Asia/Shanghai', lat: 40.0773, lng: 116.5967, cc: 'CN', muni: 'Beijing', type: 'grande', elev: 116, scheduled: true },
  { iata: 'PVG', icao: 'ZSPD', name: 'Shanghai Pudong International Airport', cityId: 'shanghai', tz: 'Asia/Shanghai', lat: 31.1434, lng: 121.805, cc: 'CN', muni: 'Shanghai (Pudong)', type: 'grande', elev: 13, scheduled: true },
  { iata: 'HKG', icao: 'VHHH', name: 'Hong Kong International Airport', cityId: 'hong-kong', tz: 'Asia/Hong_Kong', lat: 22.3118, lng: 113.9149, cc: 'HK', muni: 'Hong Kong', type: 'grande', elev: 28, scheduled: true },
  { iata: 'TPE', icao: 'RCTP', name: 'Taiwan Taoyuan International Airport', cityId: 'taipei', tz: 'Asia/Taipei', lat: 25.0777, lng: 121.233, cc: 'TW', muni: 'Taoyuan', type: 'grande', elev: 106, scheduled: true },
  { iata: 'HND', icao: 'RJTT', name: 'Tokyo Haneda International Airport', cityId: 'tokyo', tz: 'Asia/Tokyo', lat: 35.5497, lng: 139.787, cc: 'JP', muni: 'Tokyo', type: 'grande', elev: 35, scheduled: true },
  { iata: 'KIX', icao: 'RJBB', name: 'Kansai International Airport', cityId: 'osaka', tz: 'Asia/Tokyo', lat: 34.4273, lng: 135.244, cc: 'JP', muni: 'Osaka', type: 'grande', elev: 26, scheduled: true },
  { iata: 'ICN', icao: 'RKSI', name: 'Incheon International Airport', cityId: 'seoul', tz: 'Asia/Seoul', lat: 37.4691, lng: 126.451, cc: 'KR', muni: 'Seoul', type: 'grande', elev: 23, scheduled: true },
  { iata: 'SIN', icao: 'WSSS', name: 'Singapore Changi Airport', cityId: 'singapore', tz: 'Asia/Singapore', lat: 1.3502, lng: 103.994, cc: 'SG', muni: 'Singapore', type: 'grande', elev: 22, scheduled: true },
  { iata: 'BKK', icao: 'VTBS', name: 'Suvarnabhumi Airport', cityId: 'bangkok', tz: 'Asia/Bangkok', lat: 13.6811, lng: 100.747, cc: 'TH', muni: 'Bangkok', type: 'grande', elev: 5, scheduled: true },
  { iata: 'CGK', icao: 'WIII', name: 'Soekarno-Hatta International Airport', cityId: 'jakarta', tz: 'Asia/Jakarta', lat: -6.1256, lng: 106.656, cc: 'ID', muni: 'Jakarta', type: 'grande', elev: 34, scheduled: true },
  { iata: 'KUL', icao: 'WMKK', name: 'Kuala Lumpur International Airport', cityId: 'kuala-lumpur', tz: 'Asia/Kuala_Lumpur', lat: 2.7456, lng: 101.71, cc: 'MY', muni: 'Sepang', type: 'grande', elev: 69, scheduled: true },
  { iata: 'MNL', icao: 'RPLL', name: 'Ninoy Aquino International Airport', cityId: 'manila', tz: 'Asia/Manila', lat: 14.5086, lng: 121.02, cc: 'PH', muni: 'Manila (Pasay)', type: 'grande', elev: 75, scheduled: true },
  { iata: 'HAN', icao: 'VVNB', name: 'Noi Bai International Airport', cityId: 'hanoi', tz: 'Asia/Ho_Chi_Minh', lat: 21.2212, lng: 105.807, cc: 'VN', muni: 'Hanoi (Soc Son)', type: 'grande', elev: 39, scheduled: true },
  { iata: 'SGN', icao: 'VVTS', name: 'Tan Son Nhat International Airport', cityId: 'ho-chi-minh', tz: 'Asia/Ho_Chi_Minh', lat: 10.8188, lng: 106.652, cc: 'VN', muni: 'Ho Chi Minh City', type: 'grande', elev: 33, scheduled: true },
  { iata: 'RGN', icao: 'VYYY', name: 'Yangon International Airport', cityId: 'yangon', tz: 'Asia/Yangon', lat: 16.9073, lng: 96.1332, cc: 'MM', muni: 'Yangon', type: 'grande', elev: 109, scheduled: true },
  { iata: 'PNH', icao: 'VDPP', name: 'Phnom Penh International Airport', cityId: 'phnom-penh', tz: 'Asia/Phnom_Penh', lat: 11.5472, lng: 104.8447, cc: 'KH', muni: 'Phnom Penh (Pou Senchey)', type: 'grande', elev: 40, scheduled: false },
  { iata: 'UBN', icao: 'ZMCK', name: 'Ulaanbaatar Chinggis Khaan International Airport', cityId: 'ulaanbaatar', tz: 'Asia/Ulaanbaatar', lat: 47.6469, lng: 106.8198, cc: 'MN', muni: 'Ulaanbaatar (Sergelen)', type: 'grande', elev: 4482, scheduled: true },
  { iata: 'SYD', icao: 'YSSY', name: 'Sydney Kingsford Smith International Airport', cityId: 'sydney', tz: 'Australia/Sydney', lat: -33.9461, lng: 151.177, cc: 'AU', muni: 'Sydney (Mascot)', type: 'grande', elev: 21, scheduled: true },
  { iata: 'MEL', icao: 'YMML', name: 'Melbourne Airport', cityId: 'melbourne', tz: 'Australia/Melbourne', lat: -37.6707, lng: 144.8379, cc: 'AU', muni: 'Melbourne', type: 'grande', elev: 434, scheduled: true },
  { iata: 'BNE', icao: 'YBBN', name: 'Brisbane International Airport', cityId: 'brisbane', tz: 'Australia/Brisbane', lat: -27.3842, lng: 153.117, cc: 'AU', muni: 'Brisbane', type: 'grande', elev: 13, scheduled: true },
  { iata: 'PER', icao: 'YPPH', name: 'Perth International Airport', cityId: 'perth', tz: 'Australia/Perth', lat: -31.9403, lng: 115.967, cc: 'AU', muni: 'Perth', type: 'grande', elev: 67, scheduled: true },
  { iata: 'ADL', icao: 'YPAD', name: 'Adelaide International Airport', cityId: 'adelaide', tz: 'Australia/Adelaide', lat: -34.9475, lng: 138.5334, cc: 'AU', muni: 'Adelaide', type: 'grande', elev: 20, scheduled: true },
  { iata: 'AKL', icao: 'NZAA', name: 'Auckland International Airport', cityId: 'auckland', tz: 'Pacific/Auckland', lat: -37.012, lng: 174.7863, cc: 'NZ', muni: 'Auckland', type: 'grande', elev: 23, scheduled: true },
  { iata: 'WLG', icao: 'NZWN', name: 'Wellington International Airport', cityId: 'wellington', tz: 'Pacific/Auckland', lat: -41.3268, lng: 174.8069, cc: 'NZ', muni: 'Wellington', type: 'grande', elev: 41, scheduled: true },
  { iata: 'SUV', icao: 'NFNA', name: 'Nausori International Airport', cityId: 'suva', tz: 'Pacific/Fiji', lat: -18.0442, lng: 178.5615, cc: 'FJ', muni: 'Nausori', type: 'grande', elev: 17, scheduled: true },
  { iata: 'POM', icao: 'AYPY', name: 'Port Moresby Jacksons International Airport', cityId: 'port-moresby', tz: 'Pacific/Port_Moresby', lat: -9.4434, lng: 147.22, cc: 'PG', muni: 'Port Moresby', type: 'grande', elev: 146, scheduled: true },
  { iata: 'CNF', icao: 'SBCF', name: 'Tancredo Neves International Airport', cityId: 'belo-horizonte', tz: 'America/Sao_Paulo', lat: -19.6357, lng: -43.9669, cc: 'BR', muni: 'Belo Horizonte', type: 'grande', elev: 2721, scheduled: true },
  { iata: 'CWB', icao: 'SBCT', name: 'Curitiba-Afonso Pena International Airport', cityId: 'curitiba', tz: 'America/Sao_Paulo', lat: -25.5285, lng: -49.1758, cc: 'BR', muni: 'Curitiba', type: 'grande', elev: 2988, scheduled: true },
  { iata: 'POA', icao: 'SBPA', name: 'Porto Alegre-Salgado Filho International Airport', cityId: 'porto-alegre', tz: 'America/Sao_Paulo', lat: -29.994, lng: -51.1675, cc: 'BR', muni: 'Porto Alegre', type: 'grande', elev: 11, scheduled: true },
  { iata: 'SSA', icao: 'SBSV', name: 'Deputado Luiz Eduardo Magalhães International Airport', cityId: 'salvador', tz: 'America/Bahia', lat: -12.9086, lng: -38.3225, cc: 'BR', muni: 'Salvador', type: 'grande', elev: 64, scheduled: true },
  { iata: 'REC', icao: 'SBRF', name: 'Recife/Guararapes - Gilberto Freyre International Airport', cityId: 'recife', tz: 'America/Recife', lat: -8.1275, lng: -34.923, cc: 'BR', muni: 'Recife', type: 'grande', elev: 33, scheduled: true },
  { iata: 'FOR', icao: 'SBFZ', name: 'Pinto Martins International Airport', cityId: 'fortaleza', tz: 'America/Fortaleza', lat: -3.7758, lng: -38.5322, cc: 'BR', muni: 'Fortaleza', type: 'grande', elev: 83, scheduled: true },
  { iata: 'BEL', icao: 'SBBE', name: 'Val de Cans/Júlio Cezar Ribeiro International Airport', cityId: 'belem', tz: 'America/Belem', lat: -1.3793, lng: -48.4762, cc: 'BR', muni: 'Belém', type: 'grande', elev: 54, scheduled: true },
  { iata: 'GYN', icao: 'SBGO', name: 'Santa Genoveva International Airport', cityId: 'goiania', tz: 'America/Sao_Paulo', lat: -16.632, lng: -49.2207, cc: 'BR', muni: 'Goiânia', type: 'grande', elev: 2450, scheduled: true },
  { iata: 'CGR', icao: 'SBCG', name: 'Campo Grande Airport', cityId: 'campo-grande', tz: 'America/Campo_Grande', lat: -20.47, lng: -54.674, cc: 'BR', muni: 'Campo Grande', type: 'medio', elev: 1833, scheduled: true },
  { iata: 'FLN', icao: 'SBFL', name: 'Hercílio Luz International Airport', cityId: 'florianopolis', tz: 'America/Sao_Paulo', lat: -27.6703, lng: -48.5525, cc: 'BR', muni: 'Florianópolis', type: 'grande', elev: 16, scheduled: true },
  { iata: 'RBR', icao: 'SBRB', name: 'Rio Branco-Plácido de Castro International Airport', cityId: 'rio-branco', tz: 'America/Rio_Branco', lat: -9.869, lng: -67.894, cc: 'BR', muni: 'Rio Branco', type: 'grande', elev: 633, scheduled: true },
  { iata: 'FRA', icao: 'EDDF', name: 'Frankfurt Main Airport', cityId: 'frankfurt', tz: 'Europe/Berlin', lat: 50.0267, lng: 8.5584, cc: 'DE', muni: 'Frankfurt am Main', type: 'grande', elev: 364, scheduled: true },
  { iata: 'MXP', icao: 'LIMC', name: 'Milan Malpensa International Airport', cityId: 'milan', tz: 'Europe/Rome', lat: 45.6306, lng: 8.7281, cc: 'IT', muni: 'Ferno (VA)', type: 'grande', elev: 768, scheduled: true },
  { iata: 'SZX', icao: 'ZGSZ', name: 'Shenzhen Bao\'an International Airport', cityId: 'shenzhen', tz: 'Asia/Shanghai', lat: 22.6395, lng: 113.8033, cc: 'CN', muni: 'Shenzhen', type: 'grande', elev: 13, scheduled: true },
  { iata: 'CAN', icao: 'ZGGG', name: 'Guangzhou Baiyun International Airport', cityId: 'guangzhou', tz: 'Asia/Shanghai', lat: 23.3924, lng: 113.299, cc: 'CN', muni: 'Guangzhou (Huadu)', type: 'grande', elev: 50, scheduled: true },
  { iata: 'CTU', icao: 'ZUUU', name: 'Chengdu Shuangliu International Airport', cityId: 'chengdu', tz: 'Asia/Shanghai', lat: 30.5583, lng: 103.946, cc: 'CN', muni: 'Chengdu (Shuangliu)', type: 'grande', elev: 1625, scheduled: true },
  { iata: 'BOS', icao: 'KBOS', name: 'Boston Logan International Airport', cityId: 'boston', tz: 'America/New_York', lat: 42.362, lng: -71.0079, cc: 'US', muni: 'Boston', type: 'grande', elev: 20, scheduled: true },
  { iata: 'SEA', icao: 'KSEA', name: 'Seattle–Tacoma International Airport', cityId: 'seattle', tz: 'America/Los_Angeles', lat: 47.4479, lng: -122.3103, cc: 'US', muni: 'Seattle', type: 'grande', elev: 433, scheduled: true },
  { iata: 'ATL', icao: 'KATL', name: 'Hartsfield Jackson Atlanta International Airport', cityId: 'atlanta', tz: 'America/New_York', lat: 33.6367, lng: -84.4281, cc: 'US', muni: 'Atlanta', type: 'grande', elev: 1026, scheduled: true },
  { iata: 'DFW', icao: 'KDFW', name: 'Dallas Fort Worth International Airport', cityId: 'dallas', tz: 'America/Chicago', lat: 32.8968, lng: -97.038, cc: 'US', muni: 'Dallas-Fort Worth', type: 'grande', elev: 607, scheduled: true },
  { iata: 'IAH', icao: 'KIAH', name: 'George Bush Intercontinental Airport', cityId: 'houston', tz: 'America/Chicago', lat: 29.9844, lng: -95.3414, cc: 'US', muni: 'Houston', type: 'grande', elev: 97, scheduled: true },
  { iata: 'YUL', icao: 'CYUL', name: 'Montreal / Pierre Elliott Trudeau International Airport', cityId: 'montreal', tz: 'America/Toronto', lat: 45.4678, lng: -73.7423, cc: 'CA', muni: 'Montréal', type: 'grande', elev: 118, scheduled: true },
  { iata: 'BCN', icao: 'LEBL', name: 'Josep Tarradellas Barcelona-El Prat Airport', cityId: 'barcelona', tz: 'Europe/Madrid', lat: 41.2971, lng: 2.0785, cc: 'ES', muni: 'Barcelona', type: 'grande', elev: 12, scheduled: true },
  { iata: 'MUC', icao: 'EDDM', name: 'Munich Airport', cityId: 'munich', tz: 'Europe/Berlin', lat: 48.3538, lng: 11.7861, cc: 'DE', muni: 'Munich', type: 'grande', elev: 1487, scheduled: true },
  { iata: 'HAM', icao: 'EDDH', name: 'Hamburg Helmut Schmidt Airport', cityId: 'hamburg', tz: 'Europe/Berlin', lat: 53.6304, lng: 9.9882, cc: 'DE', muni: 'Hamburg', type: 'grande', elev: 53, scheduled: true },
  { iata: 'MAN', icao: 'EGCC', name: 'Manchester Airport', cityId: 'manchester', tz: 'Europe/London', lat: 53.3494, lng: -2.2795, cc: 'GB', muni: 'Manchester, Greater Manchester', type: 'grande', elev: 257, scheduled: true },
  { iata: 'EDI', icao: 'EGPH', name: 'Edinburgh Airport', cityId: 'edinburgh', tz: 'Europe/London', lat: 55.9501, lng: -3.3723, cc: 'GB', muni: 'Edinburgh', type: 'grande', elev: 135, scheduled: true },
  { iata: 'LED', icao: 'ULLI', name: 'Pulkovo Airport', cityId: 'saint-petersburg', tz: 'Europe/Moscow', lat: 59.8003, lng: 30.2625, cc: 'RU', muni: 'St. Petersburg', type: 'grande', elev: 78, scheduled: true },
  { iata: 'OVB', icao: 'UNNT', name: 'Novosibirsk Tolmachevo Airport', cityId: 'novosibirsk', tz: 'Asia/Novosibirsk', lat: 55.0198, lng: 82.6187, cc: 'RU', muni: 'Novosibirsk', type: 'grande', elev: 365, scheduled: true },
  { iata: 'VVO', icao: 'UHWW', name: 'Vladivostok International Airport', cityId: 'vladivostok', tz: 'Asia/Vladivostok', lat: 43.3963, lng: 132.1482, cc: 'RU', muni: 'Artyom', type: 'grande', elev: 59, scheduled: true },
  { iata: 'MCT', icao: 'OOMS', name: 'Muscat International Airport', cityId: 'muscat', tz: 'Asia/Muscat', lat: 23.6002, lng: 58.2853, cc: 'OM', muni: 'Muscat/Seeb', type: 'grande', elev: 48, scheduled: true },
  { iata: 'BAH', icao: 'OBBI', name: 'Bahrain International Airport', cityId: 'manama', tz: 'Asia/Bahrain', lat: 26.2673, lng: 50.6376, cc: 'BH', muni: 'Manama', type: 'grande', elev: 6, scheduled: true },
  { iata: 'AMM', icao: 'OJAI', name: 'Queen Alia International Airport', cityId: 'amman', tz: 'Asia/Amman', lat: 31.7226, lng: 35.9932, cc: 'JO', muni: 'Amman', type: 'grande', elev: 2395, scheduled: true },
  { iata: 'HRE', icao: 'FVRG', name: 'Robert Gabriel Mugabe International Airport', cityId: 'harare', tz: 'Africa/Harare', lat: -17.9318, lng: 31.0928, cc: 'ZW', muni: 'Harare', type: 'grande', elev: 4887, scheduled: true },
  { iata: 'MPM', icao: 'FQMA', name: 'Maputo Airport', cityId: 'maputo', tz: 'Africa/Maputo', lat: -25.9208, lng: 32.5726, cc: 'MZ', muni: 'Maputo', type: 'grande', elev: 145, scheduled: true },
  { iata: 'ABJ', icao: 'DIAP', name: 'Félix-Houphouët-Boigny International Airport', cityId: 'abidjan', tz: 'Africa/Abidjan', lat: 5.2614, lng: -3.9263, cc: 'CI', muni: 'Abidjan', type: 'grande', elev: 21, scheduled: true },
  { iata: 'KRT', icao: 'HSSK', name: 'Khartoum International Airport', cityId: 'khartoum', tz: 'Africa/Khartoum', lat: 15.5895, lng: 32.5532, cc: 'SD', muni: 'Khartoum', type: 'grande', elev: 1265, scheduled: true },
  { iata: 'DRW', icao: 'YPDN', name: 'Darwin International Airport / RAAF Darwin', cityId: 'darwin', tz: 'Australia/Darwin', lat: -12.415, lng: 130.8818, cc: 'AU', muni: 'Darwin', type: 'grande', elev: 103, scheduled: true },
  { iata: 'CHC', icao: 'NZCH', name: 'Christchurch International Airport', cityId: 'christchurch', tz: 'Pacific/Auckland', lat: -43.489, lng: 172.5321, cc: 'NZ', muni: 'Christchurch', type: 'grande', elev: 123, scheduled: true },
  { iata: 'NOU', icao: 'NWWW', name: 'La Tontouta International Airport', cityId: 'noumea', tz: 'Pacific/Noumea', lat: -22.0146, lng: 166.213, cc: 'NC', muni: 'Nouméa (La Tontouta)', type: 'grande', elev: 52, scheduled: true },
  { iata: 'PPT', icao: 'NTAA', name: 'Fa\'a\'ā International Airport', cityId: 'papeete', tz: 'Pacific/Tahiti', lat: -17.5535, lng: -149.6069, cc: 'PF', muni: 'Papeete', type: 'grande', elev: 5, scheduled: true },
  { iata: 'APW', icao: 'NSFA', name: 'Faleolo International Airport', cityId: 'apia', tz: 'Pacific/Apia', lat: -13.83, lng: -172.008, cc: 'WS', muni: 'Apia', type: 'grande', elev: 58, scheduled: true },
  { iata: 'GOH', icao: 'BGGH', name: 'Nuuk International Airport', cityId: 'nuuk', tz: 'America/Nuuk', lat: 64.1911, lng: -51.6791, cc: 'GL', muni: 'Nuuk', type: 'grande', elev: 283, scheduled: true },
  { iata: 'USH', icao: 'SAWH', name: 'Ushuaia - Malvinas Argentinas International Airport', cityId: 'ushuaia', tz: 'America/Argentina/Ushuaia', lat: -54.8433, lng: -68.2958, cc: 'AR', muni: 'Ushuaia', type: 'medio', elev: 102, scheduled: true },
];

export const AIRPORT_BY_IATA: Record<string, Airport> = AIRPORTS.reduce<Record<string, Airport>>((m, a) => {
  m[a.iata] = a;
  return m;
}, {});

export const AIRPORTS_BY_CITY: Record<string, Airport[]> = AIRPORTS.reduce<Record<string, Airport[]>>((m, a) => {
  (m[a.cityId] ||= []).push(a);
  return m;
}, {});

export const AIRPORT_TYPE_LABEL: Record<AirportType, string> = {
  grande: 'Hub internacional',
  medio: 'Aeroporto regional',
};

/** Rótulo honesto do campo de serviço — ver a nota de cabeçalho sobre status. */
export function servicoLabel(a: Airport): string {
  return a.scheduled ? 'Serviço regular programado' : 'Sem serviço regular programado';
}

/** Elevação formatada em metros (a fonte é em pés). */
export function elevacaoLabel(a: Airport): string {
  if (a.elev === null) return '—';
  return `${Math.round(a.elev * 0.3048)} m`;
}
