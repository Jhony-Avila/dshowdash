'use strict';
// panel-consultas/index.js — carregador do painel React "APIs para consulta" (1ª tela: Revisão cadastral, C2).
// @module  panels/panel-consultas
// @version 1.0.0
// @created 2026-11-26 (VERDE/ACIMA_DIREITA; molde = panel-atributos/index.js)
//
// Espelha panel-bling/index.js (E1 ATRIBUTOS-WEB, 18/11/2026): adaptador vanilla que o PanelPort
// importa e que SEMPRE monta a interface React dentro do container-main (sem
// iframe).
//
// A rota #/panel-consultas resolve por CONVENÇÃO no panel-paths.js
// (resolvePanelPath cai em /components/panels/<panelId>/index.js), então este
// arquivo não precisa ser registrado em lugar nenhum — mesmo caminho de
// panel-outlook, panel-datatables e panel-google-calendar.
//
// Rota: `#/panel-consultas` (resolução por convenção, sem registro).
// DIFERENÇA para o Bling (regra do módulo: "tela nova sempre atrás de flag"): aqui a
// flag é OBRIGATÓRIA — desligada, fora do rollout ou ilegível → o React NÃO é montado.
//
// O manifest é lido com `cache:'no-store'` (fonte da verdade do entry hasheado).

const MODULE_ID = 'panels/panel-consultas';
const VERSION   = '1.0.0';
const FLAG_KEY  = 'panel_consultas_enabled';   // DESLIGADA por padrão; o acesso a nível 100 é decidido no SERVIDOR (a API responde 403)

let _reactMod    = null;
let _folhasReact = [];
let _mounted     = false;

// Acesso (18/11, achado da DIREITA §27 do PARA-STATUS dela: "não liberado" por engano às 18:03 — a checagem abortou em 4 s com o
// servidor lento). Três estados, continua FAIL-CLOSED (o painel só monta com a flag CONFIRMADA ligada):
//   'ligada'    → resposta 200 válida com enabled === true;
//   'desligada' → resposta 200 válida e DEFINITIVA com enabled !== true → "não liberado";
//   'falha'     → timeout, aborto, rede, 4xx/5xx, JSON inválido ou formato inesperado → "Não foi possível verificar o acesso." + "Tentar novamente".
// Cada tentativa espera até 10 s; uma falha ganha 1 nova tentativa automática antes de virar 'falha'.
export const ACESSO = Object.freeze({ timeoutMs: 10000, tentativas: 2, pausaMs: 800 });

async function umaTentativa(fetchFn, timeoutMs) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetchFn(
      `/api/feature-flags/?action=check&flag=${encodeURIComponent(FLAG_KEY)}`,
      { credentials: 'same-origin', headers: { Accept: 'application/json' }, signal: ctrl.signal }
    );
    if (!res || res.status !== 200) return { estado: 'falha', motivo: `http ${res ? res.status : '?'}` };
    let body;
    try { body = await res.json(); } catch (_) { return { estado: 'falha', motivo: 'json inválido' }; }
    // Envelope do projeto: {ok, data, error}. Nunca {success}.
    const flag = body && body.ok !== false && body.data && body.data.flag;
    if (!flag || typeof flag !== 'object' || typeof flag.enabled !== 'boolean') return { estado: 'falha', motivo: 'formato inesperado' };
    if (flag.source === 'error') return { estado: 'falha', motivo: 'servidor de flags com erro' };   // "desligada por erro" não é resposta definitiva
    const payload = (flag.payload && typeof flag.payload === 'object') ? flag.payload : {};
    return flag.enabled === true ? { estado: 'ligada', payload } : { estado: 'desligada', payload: {} };
  } catch (e) {
    return { estado: 'falha', motivo: (e && e.name === 'AbortError') ? 'tempo esgotado ou abortado' : 'rede' };
  } finally { clearTimeout(t); }
}

/** Verifica a flag. Exportada para teste (fetch falso). Nunca lança. */
export async function verificarFlag(fetchFn = (...a) => fetch(...a), opc = {}) {
  const { timeoutMs, tentativas, pausaMs } = { ...ACESSO, ...opc };
  let r = { estado: 'falha', motivo: 'sem tentativa' };
  for (let i = 0; i < tentativas; i++) {
    if (i > 0 && pausaMs > 0) await new Promise((ok) => setTimeout(ok, pausaMs));
    r = await umaTentativa(fetchFn, timeoutMs);
    if (r.estado !== 'falha') return { ...r, tentativas: i + 1 };
  }
  return { ...r, tentativas };
}

const CAIXA = '<div style="padding:32px;max-width:520px;margin:40px auto;text-align:center;'
  + 'border:1px solid #2a3042;border-radius:12px;background:var(--bg-card,#1a1e2a);color:var(--text-primary,#e8eaf2)">';

function renderCarregando(contentEl) {
  if (!contentEl) return;
  contentEl.innerHTML = CAIXA + '<span role="status" style="font-size:13px;opacity:.8">Carregando…</span></div>';
}

function renderIndisponivel(contentEl) {
  if (!contentEl) return;
  contentEl.innerHTML = CAIXA
    + '<strong style="display:block;font-size:15px;margin-bottom:8px">APIs para consulta não está disponível</strong>'
    + '<span style="font-size:13px;opacity:.8">Este painel está em piloto e não foi liberado para o seu usuário.</span>'
    + '</div>';
}

function renderFalhaAcesso(contentEl, aoTentar) {
  if (!contentEl) return;
  contentEl.innerHTML = CAIXA
    + '<strong role="alert" style="display:block;font-size:15px;margin-bottom:12px">Não foi possível verificar o acesso.</strong>'
    + '<button type="button" data-cs-tentar style="padding:6px 14px;border-radius:8px;border:1px solid #3b4460;background:transparent;color:inherit;cursor:pointer">Tentar novamente</button>'
    + '</div>';
  const b = contentEl.querySelector && contentEl.querySelector('[data-cs-tentar]');
  if (b) b.addEventListener('click', aoTentar, { once: true });
}

const CSS_ATTR = 'data-cs-react-css';

function injetarCss(href) {
  if (document.querySelector(`link[${CSS_ATTR}][href="${href}"]`)) return;
  const l = document.createElement('link');
  l.setAttribute(CSS_ATTR, '');
  l.rel = 'stylesheet';
  l.href = href;
  document.head.appendChild(l);
}

function coletarCss(manifesto, chaveEntry, base) {
  const folhas = [];
  const vistos = new Set();
  const visitar = (chave) => {
    if (!chave || vistos.has(chave)) return;
    vistos.add(chave);
    const reg = manifesto[chave];
    if (!reg) return;
    (reg.css || []).forEach((c) => {
      const href = base + c;
      if (!folhas.includes(href)) folhas.push(href);
    });
    (reg.imports || []).forEach(visitar);
  };
  visitar(chaveEntry);
  return folhas;
}

async function carregarReact() {
  if (_reactMod) return _reactMod;
  const base = '/components/panels/panel-consultas/dist/';
  let entrada = null;
  try {
    const res = await fetch(base + '.vite/manifest.json', {
      credentials: 'same-origin', cache: 'no-store', headers: { Accept: 'application/json' },
    });
    if (res.ok) {
      const mf = await res.json();
      const chave = Object.keys(mf).find((k) => k.endsWith('src/entry.tsx'))
                 || Object.keys(mf).find((k) => k.endsWith('entry.tsx'));
      const reg = chave ? mf[chave] : null;
      if (reg && reg.file) {
        entrada = base + reg.file;
        _folhasReact = coletarCss(mf, chave, base);
      }
    }
  } catch (_) { /* trata abaixo */ }

  if (!entrada) {
    throw new Error('Bundle React não encontrado (manifest ausente ou inválido)');
  }
  _reactMod = await import(/* @vite-ignore */ entrada);
  return _reactMod;
}

function garantirCssReact() {
  // A folha é injetada UMA vez e NUNCA removida — escopada a [data-bl-root],
  // fica inerte quando o painel fecha.
  _folhasReact.forEach(injetarCss);
}

function renderErro(contentEl, err) {
  console.error('[consultas] falha ao carregar o React:', err);
  if (!contentEl) return;
  contentEl.innerHTML =
    '<div style="padding:32px;max-width:520px;margin:40px auto;text-align:center;'
    + 'border:1px solid var(--bl-borda,#2a3042);border-radius:12px;'
    + 'background:var(--bg-card,#1a1e2a);color:var(--text-primary,#e8eaf2)">'
    + '<strong style="display:block;font-size:15px;margin-bottom:8px">Não foi possível carregar APIs para consulta</strong>'
    + '<span style="font-size:13px;opacity:.8">Recarregue a página. Se persistir, avise a equipe de dev.</span>'
    + '</div>';
}

export async function mount(contentEl, config = {}) {
  if (_mounted) await unmount();
  renderCarregando(contentEl);
  const flag = await verificarFlag(undefined, config.__acesso);
  if (config.signal && config.signal.aborted) return;
  if (flag.estado === 'desligada') {
    renderIndisponivel(contentEl);
    _mounted = false;
    return { MODULE_ID, VERSION, impl: 'disabled' };
  }
  if (flag.estado !== 'ligada') {   // fail-closed: sem flag confirmada, o painel NÃO monta
    console.warn('[consultas] verificação de acesso falhou:', flag.motivo);
    renderFalhaAcesso(contentEl, () => { mount(contentEl, config); });
    _mounted = false;
    return { MODULE_ID, VERSION, impl: 'acesso-indeterminado' };
  }
  try {
    const mod = await carregarReact();
    garantirCssReact();
    await mod.mountReact(contentEl, {
      ...config,
      flag: { key: FLAG_KEY, enabled: true, payload: flag.payload },
    });
    _mounted = true;
    return { MODULE_ID, VERSION, impl: 'react' };
  } catch (err) {
    renderErro(contentEl, err);
    _mounted = false;
    return { MODULE_ID, VERSION, impl: 'error' };
  }
}

export async function unmount() {
  try {
    if (_reactMod) {
      await _reactMod.unmountReact();
    }
  } catch (err) {
    console.error('[consultas] erro no unmount:', err);
  } finally {
    _mounted = false;
  }
  return Promise.resolve();
}

export function destroy() { return unmount(); }

export function healthCheck() {
  const base = {
    status: _mounted ? 'HEALTHY' : 'IDLE',
    score: _mounted ? 100 : 0,
    maxScore: 100,
    details: { mounted: _mounted, impl: 'react', version: VERSION },
  };
  if (_mounted && _reactMod && _reactMod.reactInfo) {
    try { base.details.react = _reactMod.reactInfo(); } catch (_) { /* informativo */ }
  }
  return base;
}

export function info() {
  return { moduleId: MODULE_ID, version: VERSION, mounted: _mounted, flag: FLAG_KEY };
}

export { MODULE_ID, VERSION };
export default { mount, unmount, destroy, healthCheck, info, MODULE_ID, VERSION };
