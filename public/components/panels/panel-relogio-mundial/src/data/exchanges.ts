/**
 * data/exchanges.ts — bolsas de valores: sessões, intervalos e feriados.
 * @version 3.0.0
 *
 * MODELO: nada de "aberto/fechado" hardcoded. Cada bolsa declara a GRADE local
 * (sessão regular, possível pausa de almoço, pré-abertura, after-market, dias da
 * semana úteis) e lib/markets.ts calcula o estado no instante consultado, na zona
 * IANA da praça. Assim o horário de verão de cada país entra de graça — foi por isso
 * que o modelo é em minutos LOCAIS e não em UTC.
 *
 * ⚠️ FERIADOS: a lista abaixo é CURADORIA para 2026 e precisa ser revalidada a cada
 * ano contra o calendário oficial de cada bolsa. `HOLIDAY_YEAR` marca a validade;
 * lib/markets.ts degrada com honestidade quando a data consultada sai desse ano
 * (devolve `holidayDataStale: true` em vez de afirmar que o dia é útil).
 *
 * Referências das grades: sites oficiais das bolsas (NYSE, B3, LSE, Deutsche Börse,
 * Euronext, SIX, JPX, HKEX, SSE/SZSE, KRX, SGX, ASX, TSX, BMV, MOEX, BIST, JSE,
 * DFM, Tadawul, TASE, BSE/NSE, TWSE).
 */
'use strict';

/** Ano de validade das listas de feriados deste arquivo. */
export const HOLIDAY_YEAR = 2026;

export type SessionWindow = [number, number]; // minutos desde a meia-noite local

export interface Exchange {
  id: string;
  /** Sigla exibida nos chips e na camada do mapa. */
  code: string;
  name: string;
  /** Cidade-sede (id em data/cities.ts) — define a posição no mapa e o fuso. */
  cityId: string;
  tz: string;
  /** Moeda de negociação. */
  currency: string;
  /** Sessão regular, 1 ou 2 blocos (2 = pausa de almoço entre eles). */
  regular: SessionWindow[];
  /** Pré-abertura / leilão de abertura. */
  pre?: SessionWindow;
  /** After-market / leilão de fechamento estendido. */
  after?: SessionWindow;
  /** Dias úteis: 0 = domingo … 6 = sábado. */
  days: number[];
  /** Feriados no formato MM-DD (ano em HOLIDAY_YEAR). */
  holidays: string[];
}

const h = (hh: number, mm = 0) => hh * 60 + mm;

const SEG_SEX = [1, 2, 3, 4, 5];
const DOM_QUI = [0, 1, 2, 3, 4];

// Feriados compartilhados (2026) — Páscoa 05/04/2026, logo Sexta Santa = 03/04.
const US_2026 = ['01-01', '01-19', '02-16', '04-03', '05-25', '06-19', '07-03', '09-07', '11-26', '12-25'];
const BR_2026 = ['01-01', '02-16', '02-17', '04-03', '04-21', '05-01', '06-04', '09-07', '10-12', '11-02', '11-20', '12-24', '12-25', '12-31'];
const UK_2026 = ['01-01', '04-03', '04-06', '05-04', '05-25', '08-31', '12-25', '12-28'];
const EU_2026 = ['01-01', '04-03', '04-06', '05-01', '12-24', '12-25', '12-26', '12-31'];
const CN_2026 = ['01-01', '02-16', '02-17', '02-18', '02-19', '02-20', '04-06', '05-01', '06-19', '09-25', '10-01', '10-02', '10-05', '10-06', '10-07', '10-08'];
const HK_2026 = ['01-01', '02-17', '02-18', '02-19', '04-03', '04-06', '04-07', '05-01', '05-25', '06-19', '07-01', '10-01', '10-19', '12-25'];
const JP_2026 = ['01-01', '01-02', '01-03', '01-12', '02-11', '02-23', '03-20', '04-29', '05-03', '05-04', '05-05', '05-06', '07-20', '08-11', '09-21', '09-22', '10-12', '11-03', '11-23', '12-31'];

export const EXCHANGES: Exchange[] = [
  // ===== Américas =====
  {
    id: 'nyse', code: 'NYSE', name: 'New York Stock Exchange', cityId: 'new-york',
    tz: 'America/New_York', currency: 'USD',
    regular: [[h(9, 30), h(16)]], pre: [h(4), h(9, 30)], after: [h(16), h(20)],
    days: SEG_SEX, holidays: US_2026,
  },
  {
    id: 'nasdaq', code: 'NASDAQ', name: 'Nasdaq Stock Market', cityId: 'new-york',
    tz: 'America/New_York', currency: 'USD',
    regular: [[h(9, 30), h(16)]], pre: [h(4), h(9, 30)], after: [h(16), h(20)],
    days: SEG_SEX, holidays: US_2026,
  },
  {
    id: 'b3', code: 'B3', name: 'B3 — Brasil, Bolsa, Balcão', cityId: 'sao-paulo',
    tz: 'America/Sao_Paulo', currency: 'BRL',
    regular: [[h(10), h(17, 55)]], pre: [h(9, 45), h(10)], after: [h(18), h(18, 30)],
    days: SEG_SEX, holidays: BR_2026,
  },
  {
    id: 'tsx', code: 'TSX', name: 'Toronto Stock Exchange', cityId: 'toronto',
    tz: 'America/Toronto', currency: 'CAD',
    regular: [[h(9, 30), h(16)]], pre: [h(7), h(9, 30)], after: [h(16, 15), h(17)],
    days: SEG_SEX,
    holidays: ['01-01', '02-16', '04-03', '05-18', '07-01', '08-03', '09-07', '10-12', '12-25', '12-28'],
  },
  {
    id: 'bmv', code: 'BMV', name: 'Bolsa Mexicana de Valores', cityId: 'mexico-city',
    tz: 'America/Mexico_City', currency: 'MXN',
    regular: [[h(8, 30), h(15)]], days: SEG_SEX,
    holidays: ['01-01', '02-02', '03-16', '04-02', '04-03', '05-01', '09-16', '11-16', '12-12', '12-25'],
  },

  // ===== Europa, Oriente Médio e África =====
  {
    id: 'lse', code: 'LSE', name: 'London Stock Exchange', cityId: 'london',
    tz: 'Europe/London', currency: 'GBP',
    regular: [[h(8), h(16, 30)]], pre: [h(5, 5), h(7, 50)], after: [h(16, 40), h(17, 15)],
    days: SEG_SEX, holidays: UK_2026,
  },
  {
    id: 'fwb', code: 'XETRA', name: 'Deutsche Börse Xetra', cityId: 'frankfurt',
    tz: 'Europe/Berlin', currency: 'EUR',
    regular: [[h(9), h(17, 30)]], pre: [h(8), h(9)], after: [h(17, 30), h(20)],
    days: SEG_SEX, holidays: EU_2026,
  },
  {
    id: 'euronext', code: 'EPA', name: 'Euronext Paris', cityId: 'paris',
    tz: 'Europe/Paris', currency: 'EUR',
    regular: [[h(9), h(17, 30)]], pre: [h(7, 15), h(9)], after: [h(17, 30), h(17, 40)],
    days: SEG_SEX, holidays: EU_2026,
  },
  {
    id: 'euronext-am', code: 'AMS', name: 'Euronext Amsterdam', cityId: 'amsterdam',
    tz: 'Europe/Amsterdam', currency: 'EUR',
    regular: [[h(9), h(17, 30)]], pre: [h(7, 15), h(9)], after: [h(17, 30), h(17, 40)],
    days: SEG_SEX, holidays: EU_2026,
  },
  {
    id: 'six', code: 'SIX', name: 'SIX Swiss Exchange', cityId: 'zurich',
    tz: 'Europe/Zurich', currency: 'CHF',
    regular: [[h(9), h(17, 30)]], pre: [h(6), h(9)], days: SEG_SEX,
    holidays: ['01-01', '01-02', '04-03', '04-06', '05-01', '05-14', '05-25', '08-01', '12-24', '12-25', '12-26', '12-31'],
  },
  {
    id: 'bme', code: 'BME', name: 'Bolsa de Madrid', cityId: 'madrid',
    tz: 'Europe/Madrid', currency: 'EUR',
    regular: [[h(9), h(17, 30)]], days: SEG_SEX, holidays: EU_2026,
  },
  {
    id: 'borsa-it', code: 'MIL', name: 'Borsa Italiana', cityId: 'milan',
    tz: 'Europe/Rome', currency: 'EUR',
    regular: [[h(9), h(17, 30)]], days: SEG_SEX, holidays: EU_2026,
  },
  {
    id: 'omx', code: 'OMX', name: 'Nasdaq Stockholm', cityId: 'stockholm',
    tz: 'Europe/Stockholm', currency: 'SEK',
    regular: [[h(9), h(17, 30)]], days: SEG_SEX,
    holidays: ['01-01', '01-06', '04-03', '04-06', '05-01', '05-14', '06-19', '06-25', '12-24', '12-25', '12-31'],
  },
  {
    id: 'moex', code: 'MOEX', name: 'Moscow Exchange', cityId: 'moscow',
    tz: 'Europe/Moscow', currency: 'RUB',
    regular: [[h(10), h(18, 40)]], pre: [h(6, 50), h(10)], after: [h(19, 5), h(23, 50)],
    days: SEG_SEX,
    holidays: ['01-01', '01-02', '01-05', '01-06', '01-07', '01-08', '02-23', '03-09', '05-01', '05-11', '06-12', '11-04'],
  },
  {
    id: 'bist', code: 'BIST', name: 'Borsa İstanbul', cityId: 'istanbul',
    tz: 'Europe/Istanbul', currency: 'TRY',
    regular: [[h(10), h(13)], [h(14), h(18)]], days: SEG_SEX,
    holidays: ['01-01', '03-19', '03-20', '05-01', '05-27', '05-28', '05-29', '07-15', '08-28', '10-29'],
  },
  {
    id: 'jse', code: 'JSE', name: 'Johannesburg Stock Exchange', cityId: 'johannesburg',
    tz: 'Africa/Johannesburg', currency: 'ZAR',
    regular: [[h(9), h(17)]], days: SEG_SEX,
    holidays: ['01-01', '03-23', '04-03', '04-06', '04-27', '05-01', '06-16', '08-10', '09-24', '12-16', '12-25'],
  },
  {
    id: 'dfm', code: 'DFM', name: 'Dubai Financial Market', cityId: 'dubai',
    tz: 'Asia/Dubai', currency: 'AED',
    regular: [[h(10), h(14)]], days: SEG_SEX,
    holidays: ['01-01', '03-19', '03-20', '05-26', '05-27', '08-25', '12-01', '12-02', '12-03'],
  },
  {
    id: 'tadawul', code: 'TADAWUL', name: 'Saudi Exchange', cityId: 'riyadh',
    tz: 'Asia/Riyadh', currency: 'SAR',
    regular: [[h(10), h(15)]], pre: [h(9, 30), h(10)], days: DOM_QUI,
    holidays: ['03-19', '03-20', '03-23', '05-26', '05-27', '05-28', '09-23'],
  },
  {
    id: 'tase', code: 'TASE', name: 'Tel Aviv Stock Exchange', cityId: 'tel-aviv',
    tz: 'Asia/Jerusalem', currency: 'ILS',
    regular: [[h(9, 59), h(17, 14)]], days: DOM_QUI,
    holidays: ['03-03', '04-01', '04-02', '04-08', '04-21', '04-22', '05-21', '05-22', '07-23', '09-11', '09-12', '09-20', '09-21', '10-02', '10-09'],
  },

  // ===== Ásia-Pacífico =====
  {
    id: 'bse', code: 'BSE', name: 'BSE (Bombay Stock Exchange)', cityId: 'mumbai',
    tz: 'Asia/Kolkata', currency: 'INR',
    regular: [[h(9, 15), h(15, 30)]], pre: [h(9), h(9, 15)], days: SEG_SEX,
    holidays: ['01-26', '02-15', '03-03', '03-04', '03-21', '03-26', '04-03', '04-14', '05-01', '08-15', '08-26', '10-02', '10-20', '11-09', '12-25'],
  },
  {
    id: 'nse', code: 'NSE', name: 'National Stock Exchange of India', cityId: 'mumbai',
    tz: 'Asia/Kolkata', currency: 'INR',
    regular: [[h(9, 15), h(15, 30)]], pre: [h(9), h(9, 15)], days: SEG_SEX,
    holidays: ['01-26', '02-15', '03-03', '03-04', '03-21', '03-26', '04-03', '04-14', '05-01', '08-15', '08-26', '10-02', '10-20', '11-09', '12-25'],
  },
  {
    id: 'sse', code: 'SSE', name: 'Shanghai Stock Exchange', cityId: 'shanghai',
    tz: 'Asia/Shanghai', currency: 'CNY',
    regular: [[h(9, 30), h(11, 30)], [h(13), h(15)]], pre: [h(9, 15), h(9, 30)],
    days: SEG_SEX, holidays: CN_2026,
  },
  {
    id: 'szse', code: 'SZSE', name: 'Shenzhen Stock Exchange', cityId: 'shenzhen',
    tz: 'Asia/Shanghai', currency: 'CNY',
    regular: [[h(9, 30), h(11, 30)], [h(13), h(15)]], pre: [h(9, 15), h(9, 30)],
    days: SEG_SEX, holidays: CN_2026,
  },
  {
    id: 'hkex', code: 'HKEX', name: 'Hong Kong Stock Exchange', cityId: 'hong-kong',
    tz: 'Asia/Hong_Kong', currency: 'HKD',
    regular: [[h(9, 30), h(12)], [h(13), h(16)]], pre: [h(9), h(9, 30)],
    days: SEG_SEX, holidays: HK_2026,
  },
  {
    id: 'twse', code: 'TWSE', name: 'Taiwan Stock Exchange', cityId: 'taipei',
    tz: 'Asia/Taipei', currency: 'TWD',
    regular: [[h(9), h(13, 30)]], days: SEG_SEX,
    holidays: ['01-01', '02-16', '02-17', '02-18', '02-19', '02-20', '02-27', '04-03', '04-06', '05-01', '06-19', '09-25', '10-09'],
  },
  {
    id: 'jpx', code: 'JPX', name: 'Japan Exchange Group (Tóquio)', cityId: 'tokyo',
    tz: 'Asia/Tokyo', currency: 'JPY',
    regular: [[h(9), h(11, 30)], [h(12, 30), h(15, 30)]],
    days: SEG_SEX, holidays: JP_2026,
  },
  {
    id: 'krx', code: 'KRX', name: 'Korea Exchange', cityId: 'seoul',
    tz: 'Asia/Seoul', currency: 'KRW',
    regular: [[h(9), h(15, 30)]], pre: [h(8, 30), h(9)], after: [h(15, 40), h(18)],
    days: SEG_SEX,
    holidays: ['01-01', '02-16', '02-17', '02-18', '03-02', '05-01', '05-05', '05-25', '06-03', '06-06', '08-17', '09-24', '09-25', '09-26', '10-05', '10-09', '12-25'],
  },
  {
    id: 'sgx', code: 'SGX', name: 'Singapore Exchange', cityId: 'singapore',
    tz: 'Asia/Singapore', currency: 'SGD',
    regular: [[h(9), h(12)], [h(13), h(17)]], days: SEG_SEX,
    holidays: ['01-01', '02-17', '02-18', '04-03', '05-01', '05-27', '05-31', '08-10', '11-08', '12-25'],
  },
  {
    id: 'asx', code: 'ASX', name: 'Australian Securities Exchange', cityId: 'sydney',
    tz: 'Australia/Sydney', currency: 'AUD',
    regular: [[h(10), h(16)]], pre: [h(7), h(10)], days: SEG_SEX,
    holidays: ['01-01', '01-26', '04-03', '04-06', '04-27', '06-08', '12-25', '12-28'],
  },
];

export const EXCHANGE_BY_ID: Record<string, Exchange> = EXCHANGES.reduce<Record<string, Exchange>>((m, e) => {
  m[e.id] = e;
  return m;
}, {});

/** Bolsas sediadas numa cidade (Nova York = 2, Mumbai = 2). */
export const EXCHANGES_BY_CITY: Record<string, Exchange[]> = EXCHANGES.reduce<Record<string, Exchange[]>>((m, e) => {
  (m[e.cityId] ||= []).push(e);
  return m;
}, {});
