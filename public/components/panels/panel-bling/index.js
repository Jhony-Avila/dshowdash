'use strict';
// panel-bling/index.js — carregador do painel React (Bling).
// @module  panels/panel-bling
// @version 1.0.0
// @created 2026-07-30
//
// Espelha panel-google-calendar/index.js: adaptador vanilla que o PanelPort
// importa e que SEMPRE monta a interface React dentro do container-main (sem
// iframe).
//
// A rota #/panel-bling resolve por CONVENÇÃO no panel-paths.js
// (resolvePanelPath cai em /components/panels/<panelId>/index.js), então este
// arquivo não precisa ser registrado em lugar nenhum — mesmo caminho de
// panel-outlook, panel-datatables e panel-google-calendar.
//
// ⚠️ ATENÇÃO À ROTA: use `#/panel-bling`, NUNCA `#/bling`.
// `ITEM_TO_PANEL['bling']` aponta para `panel-04`, que é um stub federado
// chamado "Produtos/Bling" — um decoy antigo. A rota curta abriria o stub.
//
// O manifest é lido com `cache:'no-store'` (fonte da verdade do entry hasheado).

const MODULE_ID = 'panels/panel-bling';
const VERSION   = '1.0.0';
const FLAG_KEY  = 'panel_bling_enabled';

let _reactMod    = null;
let _folhasReact = [];
let _mounted     = false;

async function resolverPayload() {
  const padrao = { react_routes: ['*'] };
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 4000);
    const res = await fetch(
      `/api/feature-flags/?action=check&flag=${encodeURIComponent(FLAG_KEY)}`,
      { credentials: 'same-origin', headers: { Accept: 'application/json' }, signal: ctrl.signal }
    );
    clearTimeout(t);
    if (!res.ok) return padrao;
    const body = await res.json();
    // Envelope do projeto: {ok, data, error}. Nunca {success}.
    const flag = body && body.data && body.data.flag;
    return (flag && flag.payload && typeof flag.payload === 'object') ? flag.payload : padrao;
  } catch (_) {
    return padrao;
  }
}

const CSS_ATTR = 'data-bl-react-css';

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
  const base = '/components/panels/panel-bling/dist/';
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
  console.error('[bling] falha ao carregar o React:', err);
  if (!contentEl) return;
  contentEl.innerHTML =
    '<div style="padding:32px;max-width:520px;margin:40px auto;text-align:center;'
    + 'border:1px solid var(--bl-borda,#2a3042);border-radius:12px;'
    + 'background:var(--bg-card,#1a1e2a);color:var(--text-primary,#e8eaf2)">'
    + '<strong style="display:block;font-size:15px;margin-bottom:8px">Não foi possível carregar o Bling</strong>'
    + '<span style="font-size:13px;opacity:.8">Recarregue a página. Se persistir, avise a equipe de dev.</span>'
    + '</div>';
}

export async function mount(contentEl, config = {}) {
  if (_mounted) await unmount();
  const payload = await resolverPayload();
  if (config.signal && config.signal.aborted) return;
  try {
    const mod = await carregarReact();
    garantirCssReact();
    await mod.mountReact(contentEl, {
      ...config,
      flag: { key: FLAG_KEY, enabled: true, payload, source: 'ga' },
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
    console.error('[bling] erro no unmount:', err);
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
