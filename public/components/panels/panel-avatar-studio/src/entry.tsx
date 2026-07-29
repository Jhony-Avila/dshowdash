// entry.tsx — ponto de entrada do painel React (Avatar Studio).
// @version 1.0.0  @created 2026-07-28
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
  _host.setAttribute('data-avst-react-root', '');
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
