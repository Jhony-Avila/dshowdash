/**
 * lib/share.ts — link compartilhável de uma configuração específica do mapa.
 * @version 3.0.0
 *
 * ONDE O ESTADO VAI NA URL, E POR QUÊ: no QUERY STRING (antes do #), nunca dentro do
 * hash. O app-shell roteia por hash (`#/panel-relogio-mundial`) e acrescentar `?…`
 * ali arriscaria o parser de rota não reconhecer o painel. O query string é território
 * livre — o roteador ignora, e a URL continua abrindo o painel certo.
 *
 * FORMATO: parâmetros curtos e legíveis, não base64. Um link compartilhado é lido por
 * gente ("por que esse link mostra Tóquio?"), e texto claro também sobrevive melhor a
 * cliente de e-mail que reescreve URL.
 *
 *   ?wc=1&c=sao-paulo,tokyo,london&a=tokyo&p=orthographic&l=night,stars&cmp=sao-paulo~tokyo&t=-120
 *
 * `t` é o deslocamento da timeline em minutos: compartilhar "o mundo às 15h de hoje"
 * é justamente o caso de uso que justifica o recurso.
 */
'use strict';

import { getCity } from '@/data/cities';
import { DEFAULT_LAYERS, type LayerFlags, type Prefs } from '@/lib/prefs';
import type { ProjectionId } from '@/map/projections';

const FLAG = 'wc';

export interface ShareState {
  visible: string[];
  activeId: string;
  projection: ProjectionId;
  layers: LayerFlags;
  compare: [string, string] | null;
  /** Deslocamento da timeline, em minutos a partir de agora. */
  timeOffset: number;
}

const LAYER_KEYS = Object.keys(DEFAULT_LAYERS) as (keyof LayerFlags)[];

/** Monta a URL absoluta que reproduz a configuração atual. */
export function buildShareUrl(state: ShareState): string {
  const params = new URLSearchParams();
  params.set(FLAG, '1');
  params.set('c', state.visible.join(','));
  params.set('a', state.activeId);
  params.set('p', state.projection);
  // Só as camadas LIGADAS entram, e só se divergirem do padrão — link curto.
  const on = LAYER_KEYS.filter((k) => state.layers[k]);
  const off = LAYER_KEYS.filter((k) => !state.layers[k]);
  if (off.length) params.set('l', on.join(','));
  if (state.compare) params.set('cmp', `${state.compare[0]}~${state.compare[1]}`);
  if (state.timeOffset) params.set('t', String(Math.round(state.timeOffset)));

  const url = new URL(window.location.href);
  url.search = params.toString();
  url.hash = '#/panel-relogio-mundial';
  return url.toString();
}

/** Lê a configuração da URL atual. null quando o link não é um link compartilhado. */
export function readShareUrl(): Partial<ShareState> | null {
  let params: URLSearchParams;
  try {
    params = new URLSearchParams(window.location.search);
  } catch {
    return null;
  }
  if (params.get(FLAG) !== '1') return null;

  const out: Partial<ShareState> = {};

  const c = params.get('c');
  if (c) {
    const ids = c.split(',').filter((id) => getCity(id));
    if (ids.length) out.visible = ids;
  }

  const a = params.get('a');
  if (a && getCity(a)) out.activeId = a;

  const p = params.get('p');
  if (p === 'equirectangular' || p === 'naturalEarth' || p === 'orthographic' || p === 'mercator') {
    out.projection = p;
  }

  const l = params.get('l');
  if (l !== null) {
    const on = new Set(l.split(',').filter(Boolean));
    const layers = { ...DEFAULT_LAYERS };
    for (const k of LAYER_KEYS) layers[k] = on.has(k);
    out.layers = layers;
  }

  const cmp = params.get('cmp');
  if (cmp) {
    const [x, y] = cmp.split('~');
    if (getCity(x) && getCity(y)) out.compare = [x, y];
  }

  const t = params.get('t');
  if (t !== null) {
    const n = Number(t);
    if (Number.isFinite(n) && Math.abs(n) <= 7 * 24 * 60) out.timeOffset = Math.round(n);
  }

  return out;
}

/**
 * Limpa os parâmetros de compartilhamento da barra de endereços depois de aplicá-los.
 * Sem isso, qualquer mudança posterior do usuário conflitaria visualmente com uma URL
 * que já não descreve a tela — e um F5 desfaria o trabalho dele.
 */
export function clearShareParams(): void {
  try {
    const url = new URL(window.location.href);
    if (!url.searchParams.has(FLAG)) return;
    url.search = '';
    window.history.replaceState(null, '', url.toString());
  } catch {
    /* noop */
  }
}

/** Aplica o estado compartilhado sobre as preferências carregadas. */
export function mergeShareIntoPrefs(prefs: Prefs, share: Partial<ShareState>): Prefs {
  return {
    ...prefs,
    visible: share.visible ?? prefs.visible,
    activeId: share.activeId ?? prefs.activeId,
    projection: share.projection ?? prefs.projection,
    layers: share.layers ?? prefs.layers,
    compare: share.compare ?? prefs.compare,
  };
}

/** Copia para a área de transferência, com fallback para navegadores sem permissão. */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* cai no fallback */
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  } catch {
    return false;
  }
}
