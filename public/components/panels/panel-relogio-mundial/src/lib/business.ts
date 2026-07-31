/**
 * lib/business.ts — expediente comercial e estado visual por cidade.
 * @version 3.0.0
 *
 * Duas classificações independentes, de propósito:
 *
 * 1. EXPEDIENTE (businessStatus) — responde "consigo falar com essa gente agora?".
 *    Depende do perfil de trabalho do país: o Golfo trabalha domingo a quinta, e
 *    tratar isso como "fim de semana" na sexta seria simplesmente errado.
 *
 * 2. ESTADO VISUAL (timeState) — a paleta que o briefing pede para os marcadores
 *    (azul manhã, verde comercial, laranja fim da tarde, roxo noite, cinza
 *    madrugada). É uma leitura do RELÓGIO, não do calendário: às 10h de domingo
 *    a cor é "comercial" porque o mapa está comunicando hora do dia, enquanto o
 *    selo de expediente diz, separadamente, que o escritório está fechado.
 */
'use strict';

import type { BusinessProfileId, City } from '@/data/cities';
import { minutesOfDay, zonedParts, instantFromZoned } from '@/lib/time';

export interface BusinessProfile {
  id: BusinessProfileId;
  label: string;
  /** Minutos desde a meia-noite. */
  start: number;
  end: number;
  lunch: [number, number];
  /** Dias úteis: 0 = domingo … 6 = sábado. */
  days: number[];
}

const h = (hh: number, mm = 0) => hh * 60 + mm;

export const BUSINESS_PROFILES: Record<BusinessProfileId, BusinessProfile> = {
  default: {
    id: 'default', label: 'Seg–Sex, 9h–18h',
    start: h(9), end: h(18), lunch: [h(12), h(13)], days: [1, 2, 3, 4, 5],
  },
  gulf: {
    id: 'gulf', label: 'Dom–Qui, 8h–17h',
    start: h(8), end: h(17), lunch: [h(13), h(14)], days: [0, 1, 2, 3, 4],
  },
};

export type BusinessState =
  | 'aberto'
  | 'almoco'
  | 'fim-do-expediente'
  | 'fora-do-expediente'
  | 'fim-de-semana';

const BUSINESS_LABEL: Record<BusinessState, string> = {
  aberto: 'Expediente',
  almoco: 'Almoço',
  'fim-do-expediente': 'Fim do expediente',
  'fora-do-expediente': 'Fora do expediente',
  'fim-de-semana': 'Fim de semana',
};

export const BUSINESS_STATE_LABEL = BUSINESS_LABEL;

export const BUSINESS_STATE_TOKEN: Record<BusinessState, string> = {
  aberto: 'var(--wcm-state-open)',
  almoco: 'var(--wcm-state-pause)',
  'fim-do-expediente': 'var(--wcm-state-after)',
  'fora-do-expediente': 'var(--wcm-state-closed)',
  'fim-de-semana': 'var(--wcm-state-closed)',
};

export interface BusinessStatus {
  state: BusinessState;
  label: string
  profile: BusinessProfile;
  /** Progresso [0,1] dentro do expediente do dia. */
  progress: number;
  /** Próxima abertura de expediente, se estiver fora dele. */
  nextOpen: Date | null;
}

export function businessStatus(city: City, date: Date): BusinessStatus {
  const profile = BUSINESS_PROFILES[city.business];
  const p = zonedParts(date, city.tz);
  const min = minutesOfDay(date, city.tz);
  const working = profile.days.includes(p.dow);

  let state: BusinessState;
  if (!working) state = 'fim-de-semana';
  else if (min >= profile.lunch[0] && min < profile.lunch[1]) state = 'almoco';
  else if (min >= profile.start && min < profile.end - 60) state = 'aberto';
  else if (min >= profile.end - 60 && min < profile.end) state = 'fim-do-expediente';
  else state = 'fora-do-expediente';

  const span = profile.end - profile.start;
  const progress = span > 0 ? Math.max(0, Math.min(1, (min - profile.start) / span)) : 0;

  return {
    state,
    label: BUSINESS_LABEL[state],
    profile,
    progress,
    nextOpen: state === 'aberto' || state === 'almoco' || state === 'fim-do-expediente'
      ? null
      : nextBusinessOpen(city, date),
  };
}

/** Próximo início de expediente da cidade (varre até 9 dias). */
export function nextBusinessOpen(city: City, date: Date): Date | null {
  const profile = BUSINESS_PROFILES[city.business];
  for (let i = 0; i <= 9; i++) {
    const probe = new Date(date.getTime() + i * 86400000);
    const p = zonedParts(probe, city.tz);
    if (!profile.days.includes(p.dow)) continue;
    const at = instantFromZoned(p.year, p.month, p.day, Math.floor(profile.start / 60), profile.start % 60, city.tz);
    if (at.getTime() > date.getTime()) return at;
  }
  return null;
}

// ===================== Estado visual (paleta do briefing) =====================

export type TimeState = 'madrugada' | 'manha' | 'comercial' | 'fim-tarde' | 'noite';

export const TIME_STATE_LABEL: Record<TimeState, string> = {
  madrugada: 'Madrugada',
  manha: 'Manhã',
  comercial: 'Horário comercial',
  'fim-tarde': 'Fim da tarde',
  noite: 'Noite',
};

export const TIME_STATE_TOKEN: Record<TimeState, string> = {
  madrugada: 'var(--wcm-ts-madrugada)',
  manha: 'var(--wcm-ts-manha)',
  comercial: 'var(--wcm-ts-comercial)',
  'fim-tarde': 'var(--wcm-ts-fim-tarde)',
  noite: 'var(--wcm-ts-noite)',
};

/**
 * Faixas do relógio local → cor do marcador.
 *   00:00–05:59 madrugada (cinza)   06:00–08:59 manhã (azul)
 *   09:00–16:59 comercial (verde)   17:00–19:59 fim da tarde (laranja)
 *   20:00–23:59 noite (roxo)
 */
export function timeState(city: City, date: Date): TimeState {
  const min = minutesOfDay(date, city.tz);
  if (min < h(6)) return 'madrugada';
  if (min < h(9)) return 'manha';
  if (min < h(17)) return 'comercial';
  if (min < h(20)) return 'fim-tarde';
  return 'noite';
}

/**
 * Janela de sobreposição de expediente entre duas cidades, em minutos absolutos
 * de um mesmo dia UTC. Base do "melhor horário para reunião" do comparador.
 * Devolve null quando não existe interseção (ex.: São Paulo × Auckland).
 */
export function overlapWindow(a: City, b: City, date: Date): { start: Date; end: Date; minutes: number } | null {
  const pa = BUSINESS_PROFILES[a.business];
  const pb = BUSINESS_PROFILES[b.business];
  const za = zonedParts(date, a.tz);
  const zb = zonedParts(date, b.tz);

  const aStart = instantFromZoned(za.year, za.month, za.day, Math.floor(pa.start / 60), pa.start % 60, a.tz).getTime();
  const aEnd = instantFromZoned(za.year, za.month, za.day, Math.floor(pa.end / 60), pa.end % 60, a.tz).getTime();
  const bStart = instantFromZoned(zb.year, zb.month, zb.day, Math.floor(pb.start / 60), pb.start % 60, b.tz).getTime();
  const bEnd = instantFromZoned(zb.year, zb.month, zb.day, Math.floor(pb.end / 60), pb.end % 60, b.tz).getTime();

  const start = Math.max(aStart, bStart);
  const end = Math.min(aEnd, bEnd);
  if (end <= start) return null;
  return { start: new Date(start), end: new Date(end), minutes: Math.round((end - start) / 60000) };
}

/**
 * Melhor horário para reunião entre N cidades: varre as 24 h do dia em passos de
 * 30 min e pontua cada slot pela quantidade de cidades em expediente, penalizando
 * horário de almoço e a última hora do dia. Devolve os melhores slots ordenados.
 */
export interface MeetingSlot {
  at: Date;
  /** Cidades em expediente pleno nesse instante. */
  inHours: number;
  /** Pontuação [0,1] — 1 = todas em expediente, fora do almoço. */
  score: number;
  perCity: { city: City; state: BusinessState }[];
}

export function bestMeetingSlots(cities: City[], date: Date, topN = 5): MeetingSlot[] {
  if (!cities.length) return [];
  const base = new Date(date);
  base.setUTCHours(0, 0, 0, 0);

  const slots: MeetingSlot[] = [];
  for (let i = 0; i < 48; i++) {
    const at = new Date(base.getTime() + i * 30 * 60000);
    let score = 0;
    let inHours = 0;
    const perCity = cities.map((city) => {
      const st = businessStatus(city, at).state;
      if (st === 'aberto') { score += 1; inHours++; }
      else if (st === 'fim-do-expediente') { score += 0.6; inHours++; }
      else if (st === 'almoco') score += 0.35;
      return { city, state: st };
    });
    slots.push({ at, inHours, score: score / cities.length, perCity });
  }

  return slots
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score || a.at.getTime() - b.at.getTime())
    .slice(0, topN);
}
