// services/AvatarService.ts — persistência e sincronização do avatar.
// @version 2.1.0
// @changelog v2.1.0 — histórico (GET ?historico=1), foto recortada
//   (POST {foto}), tipo_ativo + config_camadas_recente na carga.
// @changelog v2.0.0 — contrato real do /api/avatar/studio.php: version p/
//   concorrência otimista (409), CSRF via /api/auth/check.php (mesmo caminho
//   do panel-user-profile), broadcast do render_url PUBLICADO pelo servidor.
//   Fallback localStorage permanece p/ offline/erro (briefing §25).
// O backend NUNCA confia no que sai daqui: revalida config, sanitiza o SVG
// e re-encoda a foto.
import type { AvatarConfig, HistoricoItem } from '../domain/types';
import { validarConfig, svgDe, dataUriDe } from './AvatarCatalog';

const URL_API = '/api/avatar/studio.php';
const URL_SESSAO = '/api/auth/check.php';
const CHAVE_CONFIG = 'dshow.avatar.config.v1';
const CHAVE_RENDER = 'dshow.avatar.render.v1';
const CANAL = 'dshow-avatar';
const EVENTO_DOM = 'dshow:avatar:atualizado';

export type OrigemDado = 'api' | 'local' | 'padrao';

export type TipoAtivo = 'camadas' | 'foto' | 'legado' | null;

export interface ResultadoCarga {
  config: AvatarConfig | null;
  versao: number;
  origem: OrigemDado;
  renderUrl: string | null;
  urlLegado: string | null;
  tipoAtivo: TipoAtivo;
  /** último trabalho em camadas — recuperado mesmo com foto/legado ativo */
  configCamadasRecente: AvatarConfig | null;
}

export interface ResultadoSalvar {
  ok: boolean;
  origem: OrigemDado;
  versao?: number;
  conflito?: boolean;
  mensagem?: string;
}

let _csrf: string | null = null;

/** Token CSRF da sessão — mesmo mecanismo do panel-user-profile. */
async function obterCsrf(): Promise<string | null> {
  if (_csrf) return _csrf;
  try {
    const r = await fetch(URL_SESSAO, { credentials: 'include', cache: 'no-store' });
    if (r.ok) {
      const corpo = await r.json();
      _csrf = corpo?.data?.session?.csrf_token ?? corpo?.session?.csrf_token ?? null;
    }
  } catch { /* sem sessão — o POST vai falhar e cair no fallback local */ }
  return _csrf;
}

export async function carregarAvatar(signal?: AbortSignal): Promise<ResultadoCarga> {
  // 1) API oficial
  try {
    const r = await fetch(URL_API, { credentials: 'include', signal, cache: 'no-store' });
    if (r.ok) {
      const corpo = await r.json();
      const d = corpo?.data ?? {};
      return {
        config: d.config ? validarConfig(d.config) : null,
        versao: typeof d.version === 'number' ? d.version : 0,
        origem: 'api',
        renderUrl: d.render_url ?? null,
        urlLegado: d.avatar_url ?? null,
        tipoAtivo: d.tipo_ativo ?? null,
        configCamadasRecente: d.config_camadas_recente ? validarConfig(d.config_camadas_recente) : null,
      };
    }
  } catch { /* segue para o fallback */ }

  // 2) localStorage (rascunho offline / API indisponível)
  try {
    const salvo = localStorage.getItem(CHAVE_CONFIG);
    if (salvo) {
      const cfg = validarConfig(JSON.parse(salvo));
      return { config: cfg, versao: 0, origem: 'local', renderUrl: null, urlLegado: null, tipoAtivo: null, configCamadasRecente: cfg };
    }
  } catch { /* segue */ }

  return { config: null, versao: 0, origem: 'padrao', renderUrl: null, urlLegado: null, tipoAtivo: null, configCamadasRecente: null };
}

/** Últimas 12 versões (camadas e fotos) — briefing §26. */
export async function carregarHistorico(signal?: AbortSignal): Promise<HistoricoItem[]> {
  try {
    const r = await fetch(`${URL_API}?historico=1`, { credentials: 'include', signal, cache: 'no-store' });
    if (!r.ok) return [];
    const corpo = await r.json();
    const itens = corpo?.data?.itens;
    if (!Array.isArray(itens)) return [];
    return itens.map((i: Record<string, unknown>) => ({
      id: Number(i.id) || 0,
      tipo: i.tipo === 'foto' ? 'foto' as const : 'camadas' as const,
      config: i.config ? validarConfig(i.config) : null,
      url: typeof i.url === 'string' ? i.url : null,
      criadoEm: typeof i.criado_em === 'string' ? i.criado_em : '',
    }));
  } catch {
    return [];
  }
}

/** Propaga o novo render para header/menu/perfil e outras abas. */
function anunciar(render: string, origem: OrigemDado): void {
  try { localStorage.setItem(CHAVE_RENDER, render); } catch { /* sem espaço */ }
  try { window.dispatchEvent(new CustomEvent(EVENTO_DOM, { detail: { render, origem } })); } catch { /* ambiente sem DOM */ }
  try {
    const canal = new BroadcastChannel(CANAL);
    canal.postMessage({ tipo: EVENTO_DOM, render });
    canal.close();
  } catch { /* navegador sem suporte */ }
}

export async function salvarAvatar(config: AvatarConfig, versaoBase: number): Promise<ResultadoSalvar> {
  const validado = validarConfig(config);

  // 1) API oficial (o servidor revalida o config e sanitiza o SVG)
  try {
    const cabecalhos: Record<string, string> = { 'Content-Type': 'application/json' };
    const csrf = await obterCsrf();
    if (csrf) cabecalhos['X-CSRF-Token'] = csrf;

    const r = await fetch(URL_API, {
      method: 'POST',
      credentials: 'include',
      headers: cabecalhos,
      body: JSON.stringify({
        config: validado,
        svg: svgDe(validado),          // quadro completo; círculo é corte do CSS
        base_version: versaoBase,
      }),
    });

    if (r.ok) {
      const corpo = await r.json();
      const renderUrl: string = corpo?.data?.render_url ?? '';
      const versao: number = corpo?.data?.version ?? versaoBase + 1;
      try { localStorage.setItem(CHAVE_CONFIG, JSON.stringify(validado)); } catch { /* espelho local */ }
      // bust explícito p/ <img> já montadas (o arquivo é novo, mas garante)
      anunciar(renderUrl ? `${renderUrl}?t=${versao}` : dataUriDe(validado), 'api');
      return { ok: true, origem: 'api', versao };
    }
    if (r.status === 409) {
      const corpo = await r.json().catch(() => null);
      return {
        ok: false, origem: 'api', conflito: true,
        versao: corpo?.data?.version,
        mensagem: 'O avatar foi salvo em outra aba. Recarregue para ver a versão mais recente.',
      };
    }
    if (r.status === 400) {
      const corpo = await r.json().catch(() => null);
      return { ok: false, origem: 'api', mensagem: `O servidor recusou o avatar (${corpo?.error ?? 'validação'}).` };
    }
  } catch { /* segue para o fallback */ }

  // 2) Fallback local (API fora do ar)
  try {
    localStorage.setItem(CHAVE_CONFIG, JSON.stringify(validado));
    anunciar(dataUriDe(validado), 'local');
    return { ok: true, origem: 'local', mensagem: 'Salvo neste navegador (servidor indisponível).' };
  } catch {
    return { ok: false, origem: 'padrao', mensagem: 'Não foi possível salvar.' };
  }
}

/** Salva a FOTO recortada (canvas PNG). Sem fallback local — exige servidor. */
export async function salvarFoto(dataUrlPng: string, versaoBase: number): Promise<ResultadoSalvar> {
  try {
    const cabecalhos: Record<string, string> = { 'Content-Type': 'application/json' };
    const csrf = await obterCsrf();
    if (csrf) cabecalhos['X-CSRF-Token'] = csrf;

    const r = await fetch(URL_API, {
      method: 'POST',
      credentials: 'include',
      headers: cabecalhos,
      body: JSON.stringify({ foto: dataUrlPng, base_version: versaoBase }),
    });

    if (r.ok) {
      const corpo = await r.json();
      const renderUrl: string = corpo?.data?.render_url ?? '';
      const versao: number = corpo?.data?.version ?? versaoBase + 1;
      if (renderUrl) anunciar(`${renderUrl}?t=${versao}`, 'api');
      return { ok: true, origem: 'api', versao };
    }
    if (r.status === 409) {
      const corpo = await r.json().catch(() => null);
      return {
        ok: false, origem: 'api', conflito: true, versao: corpo?.data?.version,
        mensagem: 'O avatar foi salvo em outra aba. Recarregue para ver a versão mais recente.',
      };
    }
    const corpo = await r.json().catch(() => null);
    return { ok: false, origem: 'api', mensagem: `O servidor recusou a foto (${corpo?.error ?? r.status}).` };
  } catch {
    return { ok: false, origem: 'padrao', mensagem: 'Sem conexão com o servidor — a foto precisa dele para ser salva.' };
  }
}
