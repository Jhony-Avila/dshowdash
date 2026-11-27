// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (10.0.1-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-permissions-admin.api.client
// PURPOSE: UARPS Admin - API Client
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   Api — exported value
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   window.Permissions
//   (window as any).PermissionsInventory
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createPanelPorts } from '/core/runtime/ports-profiles.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-permissions-admin.api.client';

const BASE_URL = '/api/permissions/uarps.php';

const Ports = createPanelPorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }

export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

/** E1 (VERDE 27/11): token CSRF pela MESMA ordem do nav-adapter (porta securityCSRF → window.SecurityCSRF → meta csrf-token → cookie csrf_token).
 *  O uarps.php exige requireCsrf nas escritas (:150/:192); sem o token toda gravação dava 403. */
function _csrfToken(): string {
  const porta = _getPort('securityCSRF'); const t1 = porta?.getToken?.(); if (t1) return String(t1);
  const g = (window as any).SecurityCSRF; const t2 = g?.getToken?.(); if (t2) return String(t2);
  const meta = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null; if (meta?.content) return meta.content;
  const c = document.cookie.split(';').map((x) => x.trim()).find((x) => x.startsWith('csrf_token=')); return c ? c.slice(11) : '';
}
function _getBaseUrl() {
  _initPorts();
  const config = _getPort('config');
  if (config && config.app && config.app.baseUrl) return config.app.baseUrl;
  if (config && config.baseUrl) return config.baseUrl;
  const routeState = _getPort('routeState');
  if (routeState && routeState.getBaseUrl) return routeState.getBaseUrl();
  return '';
}

async function _request(action: string, params: Record<string, unknown> = {}, { signal }: { signal?: AbortSignal } = {}) {
  try {
    const base = _getBaseUrl();
    const url = new URL(BASE_URL, base || window.location.origin)   /* 27/11: sem baseUrl, 'new URL(relativa, undefined)' lançava Invalid URL e nenhum pedido saía */;
    url.searchParams.set('action', action);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    });
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      credentials: 'same-origin',
      signal
    });
    return await _envelope(response);
  } catch (error: any) {
    return { success: false, error: error?.name === 'AbortError' ? 'ABORTADO' : (error instanceof TypeError || /fetch|network|load failed/i.test(String(error?.message))) ? 'FALHA_DE_REDE' : 'ERRO_NO_CLIENTE', data: null };
  }
}

// UARPS degrau B (27/11): o servidor responde {ok, data, error} (ApiResponse). Desembrulha UMA vez: data = o miolo; erro com código.
// Antes, o envelope inteiro ia em data e getUsers procurava data.users no nível errado → lista sempre vazia.
async function _envelope(response: Response): Promise<{ success: boolean; data: any; error: string | null }> {
  let json: any = null;
  try { json = await response.json(); } catch (_) { return { success: false, data: null, error: response.ok ? 'RESPOSTA_FORA_DO_CONTRATO' : 'HTTP_' + response.status }; }
  if (!json || typeof json !== 'object' || !('ok' in json)) return { success: false, data: null, error: 'RESPOSTA_FORA_DO_CONTRATO' };
  if (json.ok !== true || !response.ok) return { success: false, data: null, error: typeof json.error === 'string' ? json.error : 'HTTP_' + response.status };
  return { success: true, data: json.data, error: null };
}

async function _post(action: string, data: Record<string, unknown> = {}, { signal, operacaoId }: { signal?: AbortSignal; operacaoId?: string } = {}) {
  try {
    const base = _getBaseUrl();
    const url = new URL(BASE_URL, base || window.location.origin)   /* 27/11: sem baseUrl, 'new URL(relativa, undefined)' lançava Invalid URL e nenhum pedido saía */;
    url.searchParams.set('action', action);
    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-CSRF-Token': _csrfToken(), 'Idempotency-Key': operacaoId || novaOperacao() },
      credentials: 'same-origin',
      signal,
      body: JSON.stringify(data)
    });
    return await _envelope(response);
  } catch (error: any) {
    return { success: false, error: error?.name === 'AbortError' ? 'ABORTADO' : (error instanceof TypeError || /fetch|network|load failed/i.test(String(error?.message))) ? 'FALHA_DE_REDE' : 'ERRO_NO_CLIENTE', data: null };
  }
}

/** E2 (VERDE 27/11): UMA chave por intenção do usuário (o escritor v4 exige Idempotency-Key em toda alteração; repetir a chave = mesma resposta, sem nova mutação). */
export function novaOperacao(): string {
  const c = (globalThis as any).crypto; if (c?.randomUUID) return c.randomUUID();
  return 'op-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 12);
}

/** DELETE (voltar a herdar = remover a regra pessoal): CSRF + Idempotency-Key; parâmetros na URL, como o uarps.php lê. */
async function _delete(action: string, params: Record<string, unknown>, { operacaoId }: { operacaoId?: string } = {}) {
  try {
    const url = new URL(BASE_URL, _getBaseUrl() || window.location.origin); url.searchParams.set('action', action);
    const op = operacaoId || novaOperacao(); url.searchParams.set('operacao_id', op);
    // E3.1 (escritor v4.4, nota 2 do AZUL): o MOTIVO vai no CORPO (URL de pedido costuma ir para o access log); ids continuam na URL
    const { reason, ...naUrl } = params as Record<string, unknown>;
    Object.entries(naUrl).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v)); });
    const temMotivo = typeof reason === 'string' && reason !== '';
    const response = await fetch(url.toString(), { method: 'DELETE', headers: { 'Accept': 'application/json', 'X-CSRF-Token': _csrfToken(), 'Idempotency-Key': op, ...(temMotivo ? { 'Content-Type': 'application/json' } : {}) }, credentials: 'same-origin', ...(temMotivo ? { body: JSON.stringify({ reason }) } : {}) });
    return await _envelope(response);
  } catch (error: any) {
    return { success: false, error: error?.name === 'AbortError' ? 'ABORTADO' : (error instanceof TypeError || /fetch|network|load failed/i.test(String(error?.message))) ? 'FALHA_DE_REDE' : 'ERRO_NO_CLIENTE', data: null };
  }
}

/** Voltar a herdar: o servidor remove a regra pessoal e devolve `acesso_efetivo` (origem relida — a tela mostra só isso). */
export async function inheritTrigger(userId: string | number, triggerId: string, opts: { operacaoId?: string; reason?: string } = {}) {
  return _delete('remove-trigger', { user_id: userId, trigger_id: triggerId, reason: opts.reason }, { operacaoId: opts.operacaoId });
}
export async function inheritRegion(userId: string | number, regionId: string, opts: { operacaoId?: string; reason?: string } = {}) {
  return _delete('remove-region', { user_id: userId, region_id: regionId, reason: opts.reason }, { operacaoId: opts.operacaoId });
}

/** E2 (VERDE 27/11): prévia SÓ de leitura (escritor v4.1): atual × futuro, muda, bloqueio e o que gravaria — o servidor decide, a tela só mostra. */
export async function previewTrigger(userId: string | number, triggerId: string, state: 'allow' | 'deny' | 'inherit') {
  return _request('preview-trigger', { user_id: userId, trigger_id: triggerId, state });
}

export async function getUsers() {
  const res = await _request('all-users');
  if (!res.success) return res;
  if (!Array.isArray(res.data?.users)) return { success: false, data: null, error: 'RESPOSTA_FORA_DO_CONTRATO' };
  {
    return {
      success: true,
      data: res.data.users.map((u: Record<string, unknown>) => ({
        id: u.id, nome: u.nome || u.nome_completo || u.username, name: u.nome || u.nome_completo || u.username,   // o repositório manda 'nome'
        email: u.email, nivel: u.level, level: u.level, ativo: true
      }))
    };
  }
  return res;
}

export async function getInventory() {
  try {

    // @ts-expect-error TS migration - TS2339
    const inventory = window.Permissions?.getInventory?.() || (window as any).PermissionsInventory?.getAll?.();
    if (inventory) {
      const triggers: Record<string, unknown>[] = [];
      const regions: Record<string, unknown>[] = [];
      if (inventory.triggers) {
        Object.entries(inventory.triggers).forEach(([id, data]) => {

          // @ts-expect-error TS migration - TS2339, TS2698
          triggers.push({ id, label: data.label || _formatLabel(id), area: _extractArea(id), ...data });
        });
      }
      if (inventory.regions) {
        Object.entries(inventory.regions).forEach(([id, data]) => {

          // @ts-expect-error TS migration - TS2339, TS2698
          regions.push({ id, label: data.label || _formatLabel(id), ...data });
        });
      }
      return { success: true, data: { triggers, regions } };
    }
    return _scanDOMForInventory();
  } catch (error: any) {
    return { success: false, error: (error as Error).message, data: { triggers: [] as Record<string, unknown>[], regions: [] as Record<string, unknown>[] } };
  }
}

function _scanDOMForInventory() {
  const triggers: Record<string, unknown>[] = [];
  const regions: Record<string, unknown>[] = [];
  document.querySelectorAll('[data-uarps-trigger]').forEach(el => {
    const id = el.getAttribute('data-uarps-trigger');
    if (id && !triggers.find((t: Record<string, unknown>) => t.id === id)) {
      triggers.push({ id, label: el.textContent?.trim() || _formatLabel(id), area: _extractArea(id) });
    }
  });
  document.querySelectorAll('[data-uarps-region]').forEach(el => {
    const id = el.getAttribute('data-uarps-region');
    if (id && !regions.find((r: Record<string, unknown>) => r.id === id)) {
      regions.push({ id, label: el.getAttribute('data-region-label') || _formatLabel(id) });
    }
  });
  return { success: true, data: { triggers, regions } };
}

function _extractArea(triggerId: string) {
  const parts = triggerId.split(':');
  return parts.length >= 2 ? parts[1] : 'other';
}

function _formatLabel(id: string) {
  const parts = id.split(':');
  const last = parts[parts.length - 1] || id;
  return last.charAt(0).toUpperCase() + last.slice(1).replace(/-/g, ' ');
}

/** E3 (parecer R27): a VIGÊNCIA vem do servidor (escritor v4.3: `vigente`/`vencida`/`estado_efetivo`). `triggers`/`regions` = só as
 *  concessões VIGENTES; vencida = "expirada" (nunca ativa); negações e prazos ficam em `detalhes`. Linha sem vigência = fora do contrato. */
function _detalhe(r: Record<string, unknown>) {
  return { state: r.state, estado_efetivo: r.estado_efetivo, vigente: r.vigente, vencida: r.vencida, expires_at: r.expires_at ?? null, reason: r.reason ?? null, granted_by: r.granted_by ?? null, granted_at: r.granted_at ?? null,
    // E3.2 (escritor v4.6/v4.7): concedente original, nível EXATO dele agora e a alçada dele AGORA sobre ESTA capacidade (só informação)
    concedente_id: r.concedente_id ?? null, concedente_nivel_atual: r.concedente_nivel_atual ?? null, concedente_alcada_atual: r.concedente_alcada_atual ?? null,
    perdeu_alcada: r.perdeu_alcada ?? null, nivel_minimo_capacidade: r.nivel_minimo_capacidade ?? null,
    alcada_estado: r.alcada_estado ?? undefined, alcada_motivo: r.alcada_motivo ?? null,   // v4.8: motivo quando sem alçada
    concedente_administra_permissoes: r.concedente_administra_permissoes ?? null, concedente_possui_capacidade: r.concedente_possui_capacidade ?? null };   // E3.3: v4.8 (indeterminado explícito); ausente = deduz dos booleanos
}
export function projetarPermissoes(data: any) {
  const linhas = [...(data?.triggers || []), ...(data?.regions || [])];
  if (linhas.some((r: Record<string, unknown>) => typeof r.vigente !== 'boolean' || typeof r.estado_efetivo !== 'string')) return null;
  const mapa = (lista: Record<string, unknown>[], k: string) => Object.fromEntries(lista.map((r) => [String(r[k]), _detalhe(r)]));
  const por = (lista: Record<string, unknown>[], k: string, est: string) => lista.filter((r) => r.estado_efetivo === est).map((r) => String(r[k]));
  const t = data.triggers || []; const g = data.regions || [];
  return {
    triggers: por(t, 'trigger_id', 'allow'), regions: por(g, 'region_id', 'allow'),
    negados: { triggers: por(t, 'trigger_id', 'deny'), regions: por(g, 'region_id', 'deny') },
    expirados: { triggers: por(t, 'trigger_id', 'expirada'), regions: por(g, 'region_id', 'expirada') },
    detalhes: { triggers: mapa(t, 'trigger_id'), regions: mapa(g, 'region_id') },
    contagem: { linhas_triggers: t.length, linhas_regions: g.length }
  };
}

export async function getUserPermissions(userId: string | number) {
  const res = await _request('user-permissions', { user_id: userId });
  if (res.success && (!Array.isArray(res.data?.triggers) || !Array.isArray(res.data?.regions))) return { success: false, data: null, error: 'RESPOSTA_FORA_DO_CONTRATO' };
  if (res.success && res.data) {
    const proj = projetarPermissoes(res.data);
    if (!proj) return { success: false, data: null, error: 'RESPOSTA_SEM_VIGENCIA' };
    return { success: true, data: proj };
  }
  return res;
}

export async function setTriggerPermission(userId: string | number, triggerId: string, granted: boolean, opts: { operacaoId?: string; reason?: string } = {}) {
  return _post('set-trigger', { user_id: userId, trigger_id: triggerId, state: granted ? 'allow' : 'deny', reason: opts.reason }, { operacaoId: opts.operacaoId });
}

export async function setRegionPermission(userId: string | number, regionId: string, granted: boolean, opts: { operacaoId?: string; reason?: string } = {}) {
  return _post('set-region', { user_id: userId, region_id: regionId, state: granted ? 'allow' : 'deny', reason: opts.reason }, { operacaoId: opts.operacaoId });
}

export async function bulkSetTriggers(userId: string | number, triggerIds: string[], granted: boolean) {
  const permissions: Record<string, string> = {};
  triggerIds.forEach(id => { permissions[id] = granted ? 'allow' : 'deny'; });
  return _post('bulk-set-triggers', { user_id: userId, permissions });
}

export async function bulkSetRegions(userId: string | number, regionIds: string[], granted: boolean) {
  const permissions: Record<string, string> = {};
  regionIds.forEach(id => { permissions[id] = granted ? 'allow' : 'deny'; });
  return _post('bulk-set-regions', { user_id: userId, permissions });
}

export async function syncInventory() { return getInventory(); }

/** Cópia (E3, parecer R27): uma escrita POR REGRA (o lote preserva o prazo do DESTINO, não copia o da origem), cada uma com a sua chave
 *  derivada da chave da cópia (reenviar a cópia = mesmas chaves = nenhuma regra gravada duas vezes). Regra EXPIRADA na origem não é copiada;
 *  prazo futuro é copiado como prazo (nunca vira permanente); negação é copiada como negação. Resultado item a item. */
export function prazoParaEscrita(exp: unknown): string | null {
  if (exp === null || exp === undefined || exp === '') return null;
  // E3.2 (escritor v4.7 b340e882): o instante vai INTEIRO até o milissegundo (AAAA-MM-DD HH:MM:SS[.mmm]); nunca cortar o .860.
  const m = /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}:\d{2})(?:\.(\d{1,6}))?$/.exec(String(exp).trim());
  if (!m) return 'INVALIDO';
  if (m[3] && /[1-9]/.test(m[3].slice(3))) return 'INVALIDO';   // fração além do ms não cabe no DATETIME(3): não arredonda, pula
  return m[3] ? `${m[1]} ${m[2]}.${(m[3] + '000').slice(0, 3)}` : `${m[1]} ${m[2]}`;
}
export function planoDeCopia(origem: any) {
  const itens: Array<{ tipo: 'trigger' | 'region'; id: string; state: string; expires_at: string | null; acao: 'copiar' | 'pular'; motivo?: string }> = [];
  (['trigger', 'region'] as const).forEach((tipo) => {
    const det = (origem?.detalhes?.[tipo + 's'] || {}) as Record<string, any>;
    Object.keys(det).sort().forEach((id) => {
      const d = det[id]; const exp = prazoParaEscrita(d.expires_at);
      if (d.estado_efetivo === 'expirada' || d.vigente !== true) itens.push({ tipo, id, state: String(d.state), expires_at: d.expires_at, acao: 'pular', motivo: 'expirada na origem' });
      else if (exp === 'INVALIDO') itens.push({ tipo, id, state: String(d.state), expires_at: d.expires_at, acao: 'pular', motivo: 'prazo ilegível' });
      else itens.push({ tipo, id, state: String(d.estado_efetivo), expires_at: exp, acao: 'copiar' });
    });
  });
  return itens;
}
export async function copyPermissions(fromUserId: string | number, toUserId: string | number, opts: { operacaoId?: string; reason?: string } = {}) {
  const origem: any = await getUserPermissions(fromUserId);
  if (!origem.success) return origem;
  const base = (opts.operacaoId || novaOperacao()).slice(0, 36);
  const plano = planoDeCopia(origem.data); const itens: Array<Record<string, unknown>> = [];
  for (let i = 0; i < plano.length; i++) {
    const it = plano[i]; if (it.acao === 'pular') { itens.push({ ...it, resultado: 'pulado' }); continue; }
    const chave = `${base}-${it.tipo === 'trigger' ? 't' : 'r'}${i}`;
    const corpo: Record<string, unknown> = { user_id: toUserId, state: it.state, reason: opts.reason, expires_at: it.expires_at };
    corpo[it.tipo === 'trigger' ? 'trigger_id' : 'region_id'] = it.id;
    const r = await _post(it.tipo === 'trigger' ? 'set-trigger' : 'set-region', corpo, { operacaoId: chave });
    itens.push({ ...it, operacao_id: chave, resultado: r.success ? 'gravado' : 'falhou', erro: r.error });
  }
  const falhas = itens.filter((x) => x.resultado === 'falhou').length;
  return { success: falhas === 0, data: { itens, copiados: itens.filter((x) => x.resultado === 'gravado').length, pulados: itens.filter((x) => x.resultado === 'pulado').length, falhas, operacao_base: base }, error: falhas ? 'FALHA_NA_COPIA' : null };
}

export async function getStats() {
  const users = await getUsers();
  const inventory = await getInventory();
  return { success: true, data: { users: users.data?.length || 0, triggers: inventory.data?.triggers?.length || 0, regions: inventory.data?.regions?.length || 0 } };
}

export async function healthCheck() { return { success: true, status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', version: VERSION, portsInitialized: Ports.isInitialized(), timestamp: Date.now() }; }

export const Api = {
  inheritTrigger,
  inheritRegion,
  novaOperacao,
  previewTrigger, projetarPermissoes, planoDeCopia, prazoParaEscrita,
  getUsers, getInventory, getUserPermissions, setTriggerPermission, setRegionPermission,
  bulkSetTriggers, bulkSetRegions, syncInventory, copyPermissions, getStats, healthCheck, injectPorts, getPorts, VERSION, MODULE_ID
};

export default Api;
