// services/AvatarService.ts — persistência e sincronização do avatar.
// @version 1.0.0  @created 2026-07-29
//
// Estratégia de confiabilidade (briefing §25):
//   1. Tenta a API oficial (/api/avatar/studio.php — nasce na fase backend).
//   2. Sem API (404/erro de rede) → localStorage, marcando origem 'local'.
//   3. Todo salvamento emite EventBus + BroadcastChannel + localStorage de
//      render — header/menu/perfil sincronizam sem F5 (briefing §28–§30).
// O backend NUNCA confia no que chega daqui: revalida o config no servidor.
import type { AvatarConfig } from '../domain/types';
import { validarConfig, dataUriDe } from './AvatarCatalog';

const URL_API = '/api/avatar/studio.php';
const CHAVE_CONFIG = 'dshow.avatar.config.v1';
const CHAVE_RENDER = 'dshow.avatar.render.v1';
const CANAL = 'dshow-avatar';

export type OrigemDado = 'api' | 'local' | 'padrao';

export interface ResultadoCarga {
  config: AvatarConfig | null;
  origem: OrigemDado;
  urlLegado: string | null;
}

export interface ResultadoSalvar {
  ok: boolean;
  origem: OrigemDado;
  mensagem?: string;
}

declare global {
  interface Window {
    DshowEventBus?: { emit?: (evento: string, dados?: unknown) => void };
    csrfToken?: string;
  }
}

function tokenCsrf(): string | null {
  try {
    if (typeof window.csrfToken === 'string') return window.csrfToken;
    const meta = document.querySelector('meta[name="csrf-token"]');
    return meta?.getAttribute('content') ?? null;
  } catch { return null; }
}

export async function carregarAvatar(signal?: AbortSignal): Promise<ResultadoCarga> {
  // 1) API oficial
  try {
    const r = await fetch(URL_API, { credentials: 'include', signal, cache: 'no-store' });
    if (r.ok) {
      const corpo = await r.json();
      const bruto = corpo?.data?.config ?? corpo?.config ?? null;
      return {
        config: bruto ? validarConfig(bruto) : null,
        origem: 'api',
        urlLegado: corpo?.data?.avatar_url ?? corpo?.avatar_url ?? null,
      };
    }
  } catch { /* segue para o fallback */ }

  // 2) localStorage
  try {
    const salvo = localStorage.getItem(CHAVE_CONFIG);
    if (salvo) return { config: validarConfig(JSON.parse(salvo)), origem: 'local', urlLegado: null };
  } catch { /* segue */ }

  return { config: null, origem: 'padrao', urlLegado: null };
}

export async function salvarAvatar(config: AvatarConfig): Promise<ResultadoSalvar> {
  const validado = validarConfig(config);
  const render = dataUriDe(validado, { forma: 'circulo' });

  let resultado: ResultadoSalvar = { ok: false, origem: 'padrao' };

  // 1) API oficial (o servidor revalida e re-renderiza — não confia no front)
  try {
    const cabecalhos: Record<string, string> = { 'Content-Type': 'application/json' };
    const csrf = tokenCsrf();
    if (csrf) cabecalhos['X-CSRF-Token'] = csrf;
    const r = await fetch(URL_API, {
      method: 'POST',
      credentials: 'include',
      headers: cabecalhos,
      body: JSON.stringify({ config: validado }),
    });
    if (r.ok) resultado = { ok: true, origem: 'api' };
    else if (r.status === 409) return { ok: false, origem: 'api', mensagem: 'Conflito: o avatar foi alterado em outra aba.' };
  } catch { /* segue para o fallback */ }

  // 2) Fallback local (API ainda não publicada ou offline)
  if (!resultado.ok) {
    try {
      localStorage.setItem(CHAVE_CONFIG, JSON.stringify(validado));
      resultado = { ok: true, origem: 'local', mensagem: 'Salvo neste navegador (servidor indisponível).' };
    } catch {
      return { ok: false, origem: 'padrao', mensagem: 'Não foi possível salvar.' };
    }
  }

  // 3) Sincronização instantânea com o shell (header/menu/perfil)
  try { localStorage.setItem(CHAVE_RENDER, render); } catch { /* sem espaço */ }
  try { window.DshowEventBus?.emit?.('avatar:atualizado', { render, origem: resultado.origem }); } catch { /* shell ausente */ }
  try {
    const canal = new BroadcastChannel(CANAL);
    canal.postMessage({ tipo: 'avatar:atualizado', render });
    canal.close();
  } catch { /* navegador sem suporte */ }

  return resultado;
}
