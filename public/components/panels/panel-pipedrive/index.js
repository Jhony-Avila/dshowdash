'use strict';
// panel-pipedrive/index.js — carregador do painel React (Pipedrive Analytics).
// @module  panels/panel-pipedrive
// @version 1.0.0
// @created 2026-07-21
//
// Espelha panel-datatables/index.js: adaptador vanilla que o PanelPort importa e
// que SEMPRE monta a interface React dentro do container-main (sem iframe).
//
// A folha de CSS do modulo e injetada UMA vez e NUNCA removida — escopada ao root
// `[data-pp-react-root]` (tokens `--pp-*`), fica inerte quando o painel fecha.
// Isso evita o "header perde estilo apos o 1o clique" nas remontagens do shell.
//
// O manifest e lido com `cache:'no-store'` (fonte da verdade do entry hasheado).

const MODULE_ID = 'panels/panel-pipedrive';
const VERSION   = '1.0.0';
const FLAG_KEY  = 'panel_pipedrive_enabled';

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
    const flag = body && body.data && body.data.flag;
    return (flag && flag.payload && typeof flag.payload === 'object') ? flag.payload : padrao;
  } catch (_) {
    return padrao;
  }
}

const CSS_ATTR = 'data-pp-react-css';

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
  const base = '/components/panels/panel-pipedrive/dist/';
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
    throw new Error('Bundle React nao encontrado (manifest ausente ou invalido)');
  }
  _reactMod = await import(/* @vite-ignore */ entrada);
  return _reactMod;
}

function garantirCssReact() {
  _folhasReact.forEach(injetarCss);
}

function renderErro(contentEl, err) {
  console.error('[pipedrive] falha ao carregar o React:', err);
  if (!contentEl) return;
  contentEl.innerHTML =
    '<div style="padding:32px;max-width:520px;margin:40px auto;text-align:center;'
    + 'border:1px solid var(--pp-border,#333);border-radius:12px;'
    + 'background:var(--bg-card,#1a1a2e);color:var(--text-primary,#e8e8f0)">'
    + '<strong style="display:block;font-size:15px;margin-bottom:8px">Nao foi possivel carregar o Pipedrive Analytics</strong>'
    + '<span style="font-size:13px;opacity:.8">Recarregue a pagina. Se persistir, avise a equipe de dev.</span>'
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
    console.error('[pipedrive] erro no unmount:', err);
  } finally {
    _mounted = false;
  }
  return Promise.resolve();
}

export function healthCheck() {
  const base = {
    status: _mounted ? 'HEALTHY' : 'IDLE',
    score: _mounted ? 100 : 0,
    maxScore: 100,
    details: { mounted: _mounted, impl: 'react', version: VERSION },
  };
  if (_mounted && _reactMod && _reactMod.reactInfo) {
    base.details.react = _reactMod.reactInfo();
  }
  return base;
}

export function info() {
  return { MODULE_ID, VERSION, impl: 'react', flagKey: FLAG_KEY };
}

const _panel = { mount, unmount, destroy: unmount, dispose: unmount, healthCheck, info, VERSION, MODULE_ID };

export { MODULE_ID, VERSION };
export const destroy = unmount;
export const dispose = unmount;
export default _panel;
