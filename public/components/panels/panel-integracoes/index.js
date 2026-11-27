'use strict';
// panel-integracoes/index.js — carregador do painel "Integrações" (React), PAINEL PRÓPRIO (27/11, P89j validado pelo Jhony).
// @module  panels/panel-integracoes   @version 1.0.0
// Antes, #/panel-integracoes apontava para o adaptador do panel-dashboard (o MESMO módulo e a MESMA raiz React da Geral): o menu marcava um
// painel e a tela mostrava o outro, e voltar para a Geral ficava preso em Integrações. Este adaptador é OUTRO módulo para o carregador
// (estado próprio) e monta uma raiz React SEPARADA (entry.tsx → mountIntegracoes). O bundle é o do panel-dashboard (mesmo manifest e CSS,
// escopado a [data-geral-react-root]); nada é duplicado no build.

const MODULE_ID = 'panels/panel-integracoes';
const VERSION   = '1.0.0';
const BASE      = '/components/panels/panel-dashboard/dist/';
const CSS_ATTR  = 'data-geral-react-css';   // o mesmo atributo do panel-dashboard: a folha não é injetada duas vezes

let _reactMod    = null;
let _folhasReact = [];
let _mounted     = false;

function injetarCss(href) {
  if (document.querySelector(`link[${CSS_ATTR}][href="${href}"]`)) return;
  const l = document.createElement('link'); l.setAttribute(CSS_ATTR, ''); l.rel = 'stylesheet'; l.href = href; document.head.appendChild(l);
}
function coletarCss(manifesto, chaveEntry) {
  const folhas = []; const vistos = new Set();
  const visitar = (chave) => { if (!chave || vistos.has(chave)) return; vistos.add(chave); const reg = manifesto[chave]; if (!reg) return;
    (reg.css || []).forEach((c) => { const href = BASE + c; if (!folhas.includes(href)) folhas.push(href); }); (reg.imports || []).forEach(visitar); };
  visitar(chaveEntry); return folhas;
}
async function carregarReact() {
  if (_reactMod) return _reactMod;
  let entrada = null;
  try {
    const res = await fetch(BASE + '.vite/manifest.json', { credentials: 'same-origin', cache: 'no-store', headers: { Accept: 'application/json' } });
    if (res.ok) {
      const mf = await res.json();
      const chave = Object.keys(mf).find((k) => k.endsWith('src/entry.tsx')) || Object.keys(mf).find((k) => k.endsWith('entry.tsx'));
      const reg = chave ? mf[chave] : null;
      if (reg && reg.file) { entrada = BASE + reg.file; _folhasReact = coletarCss(mf, chave); }
    }
  } catch (_) { /* trata abaixo */ }
  if (!entrada) throw new Error('Bundle React não encontrado (manifest ausente ou inválido)');
  _reactMod = await import(/* @vite-ignore */ entrada);
  return _reactMod;
}
function renderErro(contentEl, err) {
  console.error('[integracoes] falha ao carregar o React:', err);
  if (!contentEl) return;
  contentEl.innerHTML = '<div style="padding:32px;max-width:520px;margin:40px auto;text-align:center;border:1px solid var(--border-color,#2e2e44);'
    + 'border-radius:12px;background:var(--bg-card,#1a1a2e);color:var(--text-primary,#e8e8f0)"><strong style="display:block;font-size:15px;margin-bottom:8px">'
    + 'Não foi possível carregar Integrações</strong><span style="font-size:13px;opacity:.8">Recarregue a página. Se persistir, avise a equipe de dev.</span></div>';
}

export async function mount(contentEl, config = {}) {
  if (_mounted) await unmount();
  if (config.signal && config.signal.aborted) return;
  try {
    const mod = await carregarReact();
    _folhasReact.forEach(injetarCss);
    await mod.mountIntegracoes(contentEl);
    _mounted = true;
    return { MODULE_ID, VERSION, impl: 'react' };
  } catch (err) { renderErro(contentEl, err); _mounted = false; return { MODULE_ID, VERSION, impl: 'error' }; }
}
export async function unmount() {
  try { if (_reactMod && _reactMod.unmountIntegracoes) await _reactMod.unmountIntegracoes(); } catch (err) { console.error('[integracoes] erro no unmount:', err); }
  _mounted = false;
}
export function healthCheck() { return { ok: true, module: MODULE_ID, version: VERSION, mounted: _mounted }; }
export function info() { return { id: MODULE_ID, version: VERSION, mounted: _mounted }; }
const _panel = { mount, unmount, destroy: unmount, dispose: unmount, healthCheck, info, VERSION, MODULE_ID };
export { MODULE_ID, VERSION };
export const destroy = unmount;
export const dispose = unmount;
export default _panel;
