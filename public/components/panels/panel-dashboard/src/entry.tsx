// entry.tsx — ponto de entrada do painel React (Visão Geral).
// @version 2.0.0  @created 2026-07-29
//
// Contrato com o app-shell (via adaptador index.js):
//   await panelModule.mount(contentEl, config)  -> mountReact
//   await panelModule.unmount()                 -> unmountReact
import { StrictMode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { App } from './app/App';
import type { ShellConfig } from './domain/types';

let _root: Root | null = null;
let _host: HTMLElement | null = null;

export async function mountReact(contentEl: HTMLElement, config: ShellConfig = {}): Promise<void> {
  if (_root) {
    await unmountReact();
  }
  _host = document.createElement('div');
  _host.setAttribute('data-geral-react-root', '');
  _host.style.height = '100%';
  contentEl.appendChild(_host);

  _root = createRoot(_host);
  _root.render(
    <StrictMode>
      <App config={config} />
    </StrictMode>
  );
}

export function unmountReact(): Promise<void> {
  if (_root) {
    _root.unmount();
    _root = null;
  }
  if (_host) {
    _host.remove();
    _host = null;
  }
  return Promise.resolve();
}

export function reactInfo() {
  return { mounted: _root !== null, hasHost: _host !== null };
}

// ── 27/11 (P89j): Integrações = PAINEL PRÓPRIO (panel-integracoes). Raiz React SEPARADA da Geral: o adaptador
// public/components/panels/panel-integracoes/index.js (outro módulo para o carregador → outro ciclo de vida) chama estas duas.
// Antes, #/panel-integracoes apontava para ESTE mesmo módulo: um único _root para dois painéis → menu marcando um e tela mostrando o outro.
import { Integracoes } from './v2/Integracoes';
let _rootI: Root | null = null;
let _hostI: HTMLElement | null = null;
export async function mountIntegracoes(contentEl: HTMLElement): Promise<void> {
  if (_rootI) await unmountIntegracoes();
  _hostI = document.createElement('div');
  _hostI.setAttribute('data-geral-react-root', '');   // o mesmo escopo de CSS/tokens da Geral (geral-v2.css, DES)
  _hostI.setAttribute('data-panel-integracoes', '');
  _hostI.style.height = '100%';
  contentEl.appendChild(_hostI);
  _rootI = createRoot(_hostI);
  _rootI.render(
    <StrictMode>
      <div className="ger-tela-toda" data-imersivo="0" data-densidade="conforto" data-geral-v2="1">
        <div className="gv2" data-gv2-vista="integracoes-pagina"><Integracoes pagina aoVoltar={() => { window.location.hash = '#/panel-dashboard'; }} /></div>
      </div>
    </StrictMode>
  );
}
export function unmountIntegracoes(): Promise<void> {
  if (_rootI) { _rootI.unmount(); _rootI = null; }
  if (_hostI) { _hostI.remove(); _hostI = null; }
  return Promise.resolve();
}
