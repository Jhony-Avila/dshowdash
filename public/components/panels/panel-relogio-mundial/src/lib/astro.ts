/**
 * lib/astro.ts — posição solar, terminador e efemérides por cidade.
 * @version 3.0.0
 *
 * MUDANÇA DE MÉTODO EM RELAÇÃO À v2: o terminador não é mais um path SVG amostrado
 * em coordenadas de tela. Agora é um POLÍGONO GEOGRÁFICO (círculo de 90° em torno do
 * ponto antisolar) devolvido em lon/lat. Isso é o que permite projetar a noite em
 * QUALQUER projeção — inclusive no globo ortográfico — usando o mesmo d3.geoPath do
 * resto do mapa. O jeito antigo só funcionava em equiretangular.
 *
 * A borda suave do briefing sai de círculos concêntricos: a altitude do Sol num ponto
 * é 90° − (distância angular até o ponto subsolar). Logo, distância ao ANTISOLAR:
 *   90° = horizonte (pôr do sol)   84° = fim do crepúsculo civil (−6°)
 *   78° = fim do náutico (−12°)    72° = fim do astronômico (−18°, noite fechada)
 * Empilhando esses anéis com alfa crescente sai o gradiente atmosférico real.
 */

import { geoCircle } from 'd3-geo';
import type { Feature, Polygon } from 'geojson';

const D2R = Math.PI / 180;
const R2D = 180 / Math.PI;

export interface SolarPosition {
  /** Latitude do ponto subsolar (= declinação solar), graus. */
  lat: number;
  /** Longitude do ponto subsolar, graus [-180,180]. */
  lng: number;
  /** Declinação, graus. */
  declination: number;
  /** Equação do tempo, minutos. */
  equationOfTime: number;
}

function julianDay(date: Date): number {
  return date.getTime() / 86400000 + 2440587.5;
}

/** Greenwich Mean Sidereal Time em horas. */
function gmstHours(jd: number): number {
  const d = jd - 2451545.0;
  let h = (18.697374558 + 24.06570982441908 * d) % 24;
  if (h < 0) h += 24;
  return h;
}

function sunEclipticLongitude(jd: number): number {
  const n = jd - 2451545.0;
  const L = (280.460 + 0.9856474 * n) % 360;
  const g = (357.528 + 0.9856003 * n) % 360;
  return L + 1.915 * Math.sin(g * D2R) + 0.020 * Math.sin(2 * g * D2R);
}

function obliquity(jd: number): number {
  return 23.4393 - 0.0000004 * (jd - 2451545.0);
}

function sunEquatorial(jd: number): { alpha: number; delta: number } {
  const lambda = sunEclipticLongitude(jd) * D2R;
  const eps = obliquity(jd) * D2R;
  const alpha = Math.atan2(Math.cos(eps) * Math.sin(lambda), Math.cos(lambda)) * R2D;
  const delta = Math.asin(Math.sin(eps) * Math.sin(lambda)) * R2D;
  return { alpha, delta };
}

function norm180(deg: number): number {
  return ((deg + 180) % 360 + 360) % 360 - 180;
}

/** Ponto subsolar: onde o Sol está exatamente a pino neste instante. */
export function solarPosition(date: Date): SolarPosition {
  const jd = julianDay(date);
  const { alpha, delta } = sunEquatorial(jd);
  const g = gmstHours(jd);
  const lng = norm180(alpha - g * 15);
  // Equação do tempo: diferença entre o meio-dia solar aparente e o médio.
  const n = jd - 2451545.0;
  const L = (280.460 + 0.9856474 * n) % 360;
  const eot = 4 * norm180(L - alpha);
  return { lat: delta, lng, declination: delta, equationOfTime: eot };
}

/** Ponto ANTISOLAR — centro da calota noturna. */
export function antisolarPoint(date: Date): [number, number] {
  const s = solarPosition(date);
  return [norm180(s.lng + 180), -s.lat];
}

/**
 * Calota da noite como Feature GeoJSON, projetável em qualquer projeção.
 * `radiusDeg` seleciona a faixa: 90 = horizonte, 84/78/72 = crepúsculos.
 */
export function nightCap(date: Date, radiusDeg = 90, precision = 1): Feature<Polygon> {
  const [lng, lat] = antisolarPoint(date);
  const gen = geoCircle().center([lng, lat]).radius(radiusDeg).precision(precision);
  return { type: 'Feature', properties: {}, geometry: gen() as Polygon };
}

/** Faixas do gradiente atmosférico, do mais claro (borda) ao mais escuro (núcleo). */
export const TWILIGHT_BANDS: { radius: number; alpha: number; label: string }[] = [
  { radius: 90, alpha: 0.10, label: 'Pôr/nascer do sol' },
  { radius: 87, alpha: 0.14, label: 'Crepúsculo civil' },
  { radius: 84, alpha: 0.18, label: 'Fim do civil' },
  { radius: 81, alpha: 0.20, label: 'Crepúsculo náutico' },
  { radius: 78, alpha: 0.22, label: 'Fim do náutico' },
  { radius: 74, alpha: 0.24, label: 'Crepúsculo astronômico' },
  { radius: 70, alpha: 0.26, label: 'Noite fechada' },
];

/** Altitude do Sol (graus acima do horizonte) num ponto, no instante dado. */
export function sunAltitude(date: Date, lat: number, lng: number): number {
  const jd = julianDay(date);
  const { alpha, delta } = sunEquatorial(jd);
  const g = gmstHours(jd);
  const H = (g * 15 + lng - alpha) * D2R;      // ângulo horário
  const phi = lat * D2R;
  const dec = delta * D2R;
  const sinAlt = Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(H);
  return Math.asin(Math.max(-1, Math.min(1, sinAlt))) * R2D;
}

/** Azimute do Sol (graus, 0 = norte, sentido horário). */
export function sunAzimuth(date: Date, lat: number, lng: number): number {
  const jd = julianDay(date);
  const { alpha, delta } = sunEquatorial(jd);
  const g = gmstHours(jd);
  const H = (g * 15 + lng - alpha) * D2R;
  const phi = lat * D2R;
  const dec = delta * D2R;
  const az = Math.atan2(Math.sin(H), Math.cos(H) * Math.sin(phi) - Math.tan(dec) * Math.cos(phi));
  return (az * R2D + 180) % 360;
}

export type DaylightPhase =
  | 'noite'
  | 'crepusculo-astronomico'
  | 'crepusculo-nautico'
  | 'crepusculo-civil'
  | 'nascer'
  | 'manha'
  | 'meio-dia'
  | 'tarde'
  | 'por-do-sol';

/** Classifica o momento do dia num ponto a partir da altitude solar. */
export function daylightPhase(date: Date, lat: number, lng: number): DaylightPhase {
  const alt = sunAltitude(date, lat, lng);
  if (alt < -18) return 'noite';
  if (alt < -12) return 'crepusculo-astronomico';
  if (alt < -6) return 'crepusculo-nautico';
  if (alt < -0.833) return 'crepusculo-civil';
  if (alt < 6) {
    // Distingue nascer de pôr pelo azimute (leste vs oeste).
    return sunAzimuth(date, lat, lng) < 180 ? 'nascer' : 'por-do-sol';
  }
  if (alt > 50) return 'meio-dia';
  return sunAzimuth(date, lat, lng) < 180 ? 'manha' : 'tarde';
}

export interface SunTimes {
  sunrise: Date | null;
  sunset: Date | null;
  solarNoon: Date;
  /** Duração do dia claro em minutos (0 = noite polar, 1440 = sol da meia-noite). */
  daylightMinutes: number;
  /** Sol nunca nasce / nunca se põe naquele dia. */
  polarNight: boolean;
  midnightSun: boolean;
}

/**
 * Nascer/pôr do sol pelo algoritmo NOAA, para a DATA CIVIL local do ponto.
 * Trata corretamente as latitudes polares (devolve null + flag).
 */
export function sunTimes(date: Date, lat: number, lng: number): SunTimes {
  // Meio-dia solar aproximado do dia UTC que contém o meio-dia local do ponto.
  const dayStart = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  const jdNoon = julianDay(new Date(dayStart + 43200000 - lng * 240000));

  const n = jdNoon - 2451545.0;
  const meanAnomaly = (357.5291 + 0.98560028 * n) % 360;
  const center = 1.9148 * Math.sin(meanAnomaly * D2R)
    + 0.02 * Math.sin(2 * meanAnomaly * D2R)
    + 0.0003 * Math.sin(3 * meanAnomaly * D2R);
  const eclipticLon = (meanAnomaly + center + 180 + 102.9372) % 360;
  const jTransit = 2451545.0 + n
    + 0.0053 * Math.sin(meanAnomaly * D2R)
    - 0.0069 * Math.sin(2 * eclipticLon * D2R);
  const decl = Math.asin(Math.sin(eclipticLon * D2R) * Math.sin(23.44 * D2R));

  // −0.833° cobre refração atmosférica + raio aparente do disco solar.
  const cosH = (Math.sin(-0.833 * D2R) - Math.sin(lat * D2R) * Math.sin(decl))
    / (Math.cos(lat * D2R) * Math.cos(decl));

  const solarNoon = new Date((jTransit - 2440587.5) * 86400000);

  if (cosH > 1) {
    return { sunrise: null, sunset: null, solarNoon, daylightMinutes: 0, polarNight: true, midnightSun: false };
  }
  if (cosH < -1) {
    return { sunrise: null, sunset: null, solarNoon, daylightMinutes: 1440, polarNight: false, midnightSun: true };
  }

  const H = Math.acos(cosH) * R2D;
  const jSet = jTransit + H / 360;
  const jRise = jTransit - H / 360;
  const sunrise = new Date((jRise - 2440587.5) * 86400000);
  const sunset = new Date((jSet - 2440587.5) * 86400000);

  return {
    sunrise,
    sunset,
    solarNoon,
    daylightMinutes: Math.round((sunset.getTime() - sunrise.getTime()) / 60000),
    polarNight: false,
    midnightSun: false,
  };
}

/** É dia (Sol acima do horizonte) naquele ponto agora? */
export function isDaylight(date: Date, lat: number, lng: number): boolean {
  return sunAltitude(date, lat, lng) > -0.833;
}

/**
 * Fase da Lua [0,1): 0 = nova, 0.25 = crescente, 0.5 = cheia, 0.75 = minguante.
 * Aproximação por idade sinódica — precisão de algumas horas, suficiente para o ícone.
 */
export function moonPhase(date: Date): { fraction: number; illumination: number; name: string } {
  const synodic = 29.530588853;
  const known = 2451550.1; // lua nova de 06/01/2000
  const jd = julianDay(date);
  let f = ((jd - known) % synodic) / synodic;
  if (f < 0) f += 1;
  const illumination = (1 - Math.cos(2 * Math.PI * f)) / 2;
  const names = [
    'Lua nova', 'Crescente côncava', 'Quarto crescente', 'Crescente gibosa',
    'Lua cheia', 'Minguante gibosa', 'Quarto minguante', 'Minguante côncava',
  ];
  return { fraction: f, illumination, name: names[Math.round(f * 8) % 8] };
}
