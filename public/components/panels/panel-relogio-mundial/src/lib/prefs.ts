/**
 * lib/prefs.ts — persistência das preferências do painel (servidor + espelho local).
 * @version 3.0.0
 *
 * FONTE DA VERDADE = servidor (/api/user/preferences), para a configuração seguir o
 * usuário entre navegadores e dispositivos. O localStorage é só espelho de PRIMEIRA
 * PINTURA, nunca fonte única.
 *
 * COMPATIBILIDADE COM A v2: a chave antiga `world_clock.pinned_cities` (array puro de
 * ids) continua sendo LIDA. Quem já tinha cidades fixadas não perde nada ao migrar —
 * o array vira o campo `visible` do novo objeto e, no primeiro salvamento, sobe já no
 * formato novo. A chave velha não é apagada, então um rollback para a v2 ainda acha
 * as cidades dela.
 *
 * CSRF no POST: header X-CSRF-Token; token via window.SecurityCSRF → meta → cookie →
 * refresh por /api/auth/check.php (COM .php — sem a extensão cai no fallback SPA e
 * todo write volta 403).
 */
'use strict';

import { DEFAULT_CITY_IDS, LOCAL_CITY_ID, getCity } from '@/data/cities';
import type { ProjectionId } from '@/map/projections';

const KEY_NEW = 'world_clock.preferences';
const KEY_LEGACY = 'world_clock.pinned_cities';
const LOCAL_KEY = 'dsd:world-clock:preferences';
const API = '/api/user/preferences';

export interface LayerFlags {
  night: boolean;
  cityLights: boolean;
  stars: boolean;
  graticule: boolean;
  markets: boolean;
  airports: boolean;
  weather: boolean;
  labels: boolean;
  sunMarker: boolean;
  countries: boolean;
  /** Feriado de hoje e mudança de DST em até 7 dias, marcados no mapa. */
  events: boolean;
}

export interface Prefs {
  /** Cidades com card no mapa. */
  visible: string[];
  /** Favoritas, na ordem escolhida pelo usuário (arrastável). */
  favorites: string[];
  /**
   * Categoria de cada favorita (id da cidade → rótulo livre).
   * Mapa em vez de lista de grupos de propósito: uma cidade pertence a no máximo uma
   * categoria, e guardar assim torna impossível o estado inconsistente de a mesma
   * cidade aparecer em dois grupos.
   */
  categories: Record<string, string>;
  /** Cidade em destaque no painel de relógio. */
  activeId: string;
  projection: ProjectionId;
  layers: LayerFlags;
  /** Painéis flutuantes recolhidos pelo usuário. */
  collapsed: string[];
  /** Cidades do comparador de fusos. */
  compare: [string, string] | null;
  /** Relógio analógico visível no painel inferior. */
  analog: boolean;
}

export const DEFAULT_LAYERS: LayerFlags = {
  night: true,
  cityLights: true,
  stars: true,
  graticule: true,
  markets: true,
  airports: false,
  weather: true,
  labels: true,
  sunMarker: true,
  countries: true,
  events: true,
};

export const DEFAULT_PREFS: Prefs = {
  visible: DEFAULT_CITY_IDS.slice(),
  favorites: [LOCAL_CITY_ID, 'new-york', 'london'],
  categories: {},
  activeId: LOCAL_CITY_ID,
  projection: 'equirectangular',
  layers: { ...DEFAULT_LAYERS },
  collapsed: [],
  compare: [LOCAL_CITY_ID, 'london'],
  analog: true,
};

// ===================== Sanitização =====================

function sanitizeIds(arr: unknown): string[] | null {
  if (!Array.isArray(arr)) return null;
  const out: string[] = [];
  for (const id of arr) {
    if (typeof id === 'string' && getCity(id) && !out.includes(id)) out.push(id);
  }
  return out.length ? out : null;
}

/** A cidade local nunca sai da lista: é a referência de comparação do painel. */
function ensureLocal(ids: string[]): string[] {
  return ids.includes(LOCAL_CITY_ID) ? ids : [LOCAL_CITY_ID, ...ids];
}

const VALID_PROJECTIONS: ProjectionId[] = ['equirectangular', 'naturalEarth', 'orthographic', 'mercator'];

/**
 * Normaliza qualquer coisa que venha do servidor/localStorage num Prefs válido.
 * Aceita tanto o objeto novo quanto o ARRAY puro da v2.
 */
export function sanitizePrefs(raw: unknown): Prefs | null {
  if (!raw) return null;

  // Formato v2: array de ids.
  if (Array.isArray(raw)) {
    const visible = sanitizeIds(raw);
    if (!visible) return null;
    return { ...DEFAULT_PREFS, visible: ensureLocal(visible) };
  }

  if (typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;

  const visible = sanitizeIds(o.visible) ?? DEFAULT_PREFS.visible.slice();
  const favorites = sanitizeIds(o.favorites) ?? [];
  const activeId = typeof o.activeId === 'string' && getCity(o.activeId) ? o.activeId : LOCAL_CITY_ID;
  const projection = VALID_PROJECTIONS.includes(o.projection as ProjectionId)
    ? (o.projection as ProjectionId)
    : DEFAULT_PREFS.projection;

  const layers: LayerFlags = { ...DEFAULT_LAYERS };
  if (o.layers && typeof o.layers === 'object') {
    for (const k of Object.keys(DEFAULT_LAYERS) as (keyof LayerFlags)[]) {
      const v = (o.layers as Record<string, unknown>)[k];
      if (typeof v === 'boolean') layers[k] = v;
    }
  }

  // Categorias: só de cidades conhecidas, rótulo aparado e limitado — o valor vem de
  // campo livre do usuário e volta do servidor, então é entrada não confiável.
  const categories: Record<string, string> = {};
  if (o.categories && typeof o.categories === 'object') {
    for (const [id, rot] of Object.entries(o.categories as Record<string, unknown>)) {
      if (!getCity(id) || typeof rot !== 'string') continue;
      const limpo = rot.trim().slice(0, 32);
      if (limpo) categories[id] = limpo;
    }
  }

  const collapsed = Array.isArray(o.collapsed)
    ? o.collapsed.filter((s): s is string => typeof s === 'string').slice(0, 20)
    : [];

  let compare: [string, string] | null = null;
  if (Array.isArray(o.compare) && o.compare.length === 2) {
    const [a, b] = o.compare;
    if (typeof a === 'string' && typeof b === 'string' && getCity(a) && getCity(b)) compare = [a, b];
  }

  return {
    visible: ensureLocal(visible),
    favorites,
    categories,
    activeId,
    projection,
    layers,
    collapsed,
    compare: compare ?? DEFAULT_PREFS.compare,
    analog: typeof o.analog === 'boolean' ? o.analog : DEFAULT_PREFS.analog,
  };
}

// ===================== Espelho local =====================

export function readLocal(): Prefs | null {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return null;
    return sanitizePrefs(JSON.parse(raw));
  } catch {
    return null;
  }
}

function writeLocal(prefs: Prefs): void {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(prefs));
  } catch {
    /* cota cheia / modo privado: o servidor continua sendo a fonte da verdade */
  }
}

// ===================== Servidor =====================

/** Lê as preferências no servidor. null = sem preferência salva (≠ preferência vazia). */
export async function fetchServer(signal?: AbortSignal): Promise<Prefs | null> {
  try {
    const res = await fetch(API, {
      method: 'GET',
      credentials: 'include',
      headers: { Accept: 'application/json' },
      signal,
    });
    if (!res.ok) return null;
    const body = await res.json();
    // Aceita tanto {ok,data:{preferences}} quanto {preferences} ou o mapa cru.
    const prefsBag = body?.data?.preferences ?? body?.preferences ?? body?.data ?? body;
    if (!prefsBag || typeof prefsBag !== 'object') return null;

    const novo = sanitizePrefs(prefsBag[KEY_NEW]);
    if (novo) return novo;
    // Migração transparente da v2.
    return sanitizePrefs(prefsBag[KEY_LEGACY]);
  } catch {
    return null;
  }
}

/** Grava (local imediato + servidor best-effort). */
export async function save(prefs: Prefs): Promise<boolean> {
  writeLocal(prefs);
  try {
    const res = await fetch(API, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-CSRF-Token': await csrfToken(),
      },
      body: JSON.stringify({ key: KEY_NEW, value: prefs }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Salvamento com debounce — a UI muda estado a cada clique, o servidor não precisa. */
export function makeDebouncedSave(delayMs = 900): (p: Prefs) => void {
  let timer: number | null = null;
  let pending: Prefs | null = null;
  return (p: Prefs) => {
    pending = p;
    writeLocal(p); // local é instantâneo: recarregar a página nunca perde a mudança
    if (timer !== null) clearTimeout(timer);
    timer = window.setTimeout(() => {
      timer = null;
      if (pending) void save(pending);
    }, delayMs);
  };
}

// ===================== CSRF =====================

interface SecurityCSRFLike { getToken?: () => string | null }

function tokenFromDom(): string {
  try {
    const g = (window as unknown as { SecurityCSRF?: SecurityCSRFLike }).SecurityCSRF;
    const t = g?.getToken?.();
    if (t) return t;
  } catch {
    /* noop */
  }
  const meta = document.querySelector('meta[name="csrf-token"]');
  const fromMeta = meta?.getAttribute('content');
  if (fromMeta) return fromMeta;

  const cookie = document.cookie.split('; ').find((c) => c.startsWith('csrf_token='));
  if (cookie) return decodeURIComponent(cookie.split('=')[1]);
  return '';
}

async function csrfToken(): Promise<string> {
  const t = tokenFromDom();
  if (t) return t;
  try {
    // COM .php: sem a extensão a rota cai no fallback SPA e o write volta 403.
    const res = await fetch('/api/auth/check.php', {
      method: 'GET',
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return '';
    const json = await res.json();
    return json?.data?.session?.csrf_token ?? '';
  } catch {
    return '';
  }
}
