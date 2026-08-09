// entry.tsx — ponto de entrada do painel React (Avatar Studio).
// @version 1.0.0  @created 2026-07-28
//
// Contrato com o app-shell (via adaptador index.js):
//   await panelModule.mount(contentEl, config)  -> mountReact
//   await panelModule.unmount()                 -> unmountReact
import { StrictMode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { App } from './app/App';
import { flag } from './nucleo/flags';
import type { ShellConfig } from './domain/types';

let _root: Root | null = null;
let _host: HTMLElement | null = null;

export async function mountReact(contentEl: HTMLElement, config: ShellConfig = {}): Promise<void> {
  if (_root) {
    await unmountReact();
  }
  _host = document.createElement('div');
  _host.setAttribute('data-avst-react-root', '');
  // lote 1141-1150 (#116, as6.light_v6): direção PRÓPRIA do tema claro
  // (§578) — gate por atributo p/ o CSS; off = claro do #112
  if (flag('as6.light_v6')) _host.setAttribute('data-light-v6', '');
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
