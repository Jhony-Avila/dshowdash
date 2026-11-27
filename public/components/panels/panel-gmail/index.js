'use strict';
// panel-gmail/index.js — painel "Gmail" (ROXO/CIMA, 27/11; decisão do Jhony: o Gmail substitui o Outlook no menu).
// Ainda NÃO existe integração com o Gmail: a tela diz isso, sem número e sem conexão. Vanilla (sem bundle): nada a carregar além deste arquivo.
// Tokens do shell (--text-primary, --bg-card, --border-color…) com fallback; claro e escuro seguem o shell.
const MODULE_ID = 'panels/panel-gmail';
const VERSION   = '1.0.0';
let _host = null;

export async function mount(contentEl) {
  if (_host) await unmount();
  if (!contentEl) return { MODULE_ID, VERSION, impl: 'error' };
  _host = document.createElement('section');
  _host.setAttribute('data-panel-gmail', '');
  _host.setAttribute('aria-labelledby', 'gmail-titulo');
  _host.style.cssText = 'padding:24px 28px;max-width:720px;font-family:inherit;color:var(--text-primary,#e8e8f0)';
  _host.innerHTML =
    '<h1 id="gmail-titulo" style="margin:0 0 12px;font-size:20px;font-weight:600;letter-spacing:-.01em">Gmail</h1>'
    + '<div style="display:flex;flex-direction:column;gap:10px;padding:16px 18px;border:1px solid var(--border-color,#2e2e44);border-radius:12px;background:var(--bg-card,#1a1a2e)">'
    + '<span data-gmail-estado style="align-self:flex-start;display:inline-flex;align-items:center;gap:6px;height:22px;padding:0 10px;border-radius:999px;font-size:12px;font-weight:600;'
    + 'border:1px solid var(--border-color,#2e2e44);color:var(--text-secondary,#b4b4c8)">Não integrada</span>'
    + '<p style="margin:0;font-size:14px">Integração com o Gmail em preparação.</p>'
    + '<p style="margin:0;font-size:12px;color:var(--text-secondary,#b4b4c8)">Nenhum dado do Gmail é lido pelo Dash por enquanto. O estado das outras integrações fica em '
    + '<a href="#/panel-integracoes" style="color:var(--text-primary,inherit);text-decoration:underline;text-underline-offset:2px">Integrações</a>.</p>'
    + '</div>';
  contentEl.appendChild(_host);
  return { MODULE_ID, VERSION, impl: 'vanilla' };
}
export async function unmount() { if (_host) { _host.remove(); _host = null; } }
export function healthCheck() { return { ok: true, module: MODULE_ID, version: VERSION, mounted: !!_host }; }
export function info() { return { id: MODULE_ID, version: VERSION, mounted: !!_host }; }
const _panel = { mount, unmount, destroy: unmount, dispose: unmount, healthCheck, info, VERSION, MODULE_ID };
export { MODULE_ID, VERSION };
export const destroy = unmount;
export const dispose = unmount;
export default _panel;
