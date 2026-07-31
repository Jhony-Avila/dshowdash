'use strict';
// panel-relogio-mundial/index.js — carregador do painel React (Centro Global de Tempo).
// @module  panels/panel-relogio-mundial
// @version 3.0.0
// @created 2026-07-30
//
// Espelha panel-ads/index.js: adaptador vanilla que o PanelLifecycleController importa
// (por convenção de rota #/panel-relogio-mundial) e que monta a interface React dentro
// do container-main — sem iframe, no MESMO documento do shell (tokens/data-theme valem).
//
// PNR: se o bundle React não carregar (manifest ausente, dist sem permissão, rede),
// o adaptador cai para o motor VANILLA legado (/components/world-clock-map/panel.js),
// que continua no repositório justamente como rede de segurança. O painel nunca fica
// em branco: React → vanilla → cartão de erro, nessa ordem.

const MODULE_ID = 'panels/panel-relogio-mundial';
const VERSION   = '3.0.0';
const BASE      = '/components/panels/panel-relogio-mundial/dist/';

let _reactMod = null;
let _folhasReact = [];
let _legado = null;      // instância do motor vanilla, se usado
let _mounted = false;
let _impl = 'none';

const CSS_ATTR = 'data-wcm-react-css';

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
  let entrada = null;
  // cache:'no-store' é obrigatório: o manifest é a FONTE DA VERDADE do entry hasheado.
  // Servido do SW/CF ele fica stale e aponta para um arquivo que não existe mais.
  const res = await fetch(BASE + '.vite/manifest.json', {
    credentials: 'same-origin', cache: 'no-store', headers: { Accept: 'application/json' },
  });
  if (res.ok) {
    const mf = await res.json();
    const chave = Object.keys(mf).find((k) => k.endsWith('src/entry.tsx'))
               || Object.keys(mf).find((k) => k.endsWith('entry.tsx'));
    const reg = chave ? mf[chave] : null;
    if (reg && reg.file) {
      entrada = BASE + reg.file;
      _folhasReact = coletarCss(mf, chave, BASE);
    }
  }
  if (!entrada) throw new Error('Bundle React não encontrado (manifest ausente ou inválido)');
  _reactMod = await import(/* @vite-ignore */ entrada);
  return _reactMod;
}

async function montarLegado(contentEl) {
  const mod = await import('/components/world-clock-map/panel.js');
  _legado = mod.createWorldClock();
  await _legado.mount(contentEl);
  return true;
}

function renderErro(contentEl, err) {
  console.error('[relogio-mundial] falha ao carregar o painel:', err);
  if (!contentEl) return;
  contentEl.innerHTML =
    '<div style="padding:32px;max-width:520px;margin:40px auto;text-align:center;'
    + 'border:1px solid var(--border-color,#2e2e44);border-radius:12px;'
    + 'background:var(--bg-secondary,#1a1a2e);color:var(--text-primary,#e8e8f0)">'
    + '<strong style="display:block;font-size:15px;margin-bottom:8px">Não foi possível carregar o Relógio Mundial</strong>'
    + '<span style="font-size:13px;opacity:.8">Recarregue a página. Se persistir, avise a equipe de dev.</span>'
    + '</div>';
}

export async function mount(contentEl, config = {}) {
  if (_mounted) await unmount();
  if (config.signal && config.signal.aborted) return { MODULE_ID, VERSION, impl: 'aborted' };

  try {
    const mod = await carregarReact();
    _folhasReact.forEach(injetarCss);
    if (config.signal && config.signal.aborted) return { MODULE_ID, VERSION, impl: 'aborted' };
    await mod.mountReact(contentEl, config);
    _mounted = true;
    _impl = 'react';
    return { MODULE_ID, VERSION, impl: 'react' };
  } catch (errReact) {
    console.warn('[relogio-mundial] React indisponível, caindo para o motor vanilla:', errReact);
    try {
      await montarLegado(contentEl);
      _mounted = true;
      _impl = 'vanilla';
      return { MODULE_ID, VERSION, impl: 'vanilla' };
    } catch (errLegado) {
      renderErro(contentEl, errLegado);
      _mounted = false;
      _impl = 'error';
      return { MODULE_ID, VERSION, impl: 'error' };
    }
  }
}

export async function unmount() {
  try {
    if (_impl === 'react' && _reactMod) await _reactMod.unmountReact();
    else if (_impl === 'vanilla' && _legado) await _legado.unmount();
  } catch (err) {
    console.error('[relogio-mundial] erro no unmount:', err);
  } finally {
    _legado = null;
    _mounted = false;
    _impl = 'none';
  }
  return Promise.resolve();
}

export function healthCheck() {
  const base = {
    status: _mounted ? 'HEALTHY' : 'IDLE',
    score: _mounted ? 100 : 0,
    maxScore: 100,
    details: { mounted: _mounted, impl: _impl, version: VERSION },
  };
  if (_mounted && _impl === 'react' && _reactMod && _reactMod.reactInfo) {
    base.details.react = _reactMod.reactInfo();
  }
  return base;
}

export function info() {
  return { MODULE_ID, VERSION, impl: _impl, mounted: _mounted };
}

const _panel = { mount, unmount, destroy: unmount, dispose: unmount, healthCheck, info, VERSION, MODULE_ID };

export { MODULE_ID, VERSION };
export const destroy = unmount;
export const dispose = unmount;
export default _panel;
