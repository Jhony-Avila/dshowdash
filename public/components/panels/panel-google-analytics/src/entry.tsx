// entry.tsx — ponto de entrada do painel React (Google Analytics).
// @version 1.0.0  @created 2026-07-30
//
// Contrato com o app-shell (via adaptador index.js):
//   await panelModule.mount(contentEl, config)  -> mountReact
//   await panelModule.unmount()                 -> unmountReact
// Montamos no MESMO documento do shell: tokens e tema valem sem ponte.
import { StrictMode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import App from './app/App';

let _root: Root | null = null;
let _host: HTMLElement | null = null;

export async function mountReact(contentEl: HTMLElement): Promise<void> {
  if (_root) {
    await unmountReact();
  }
  _host = document.createElement('div');
  // ⚠️ O atributo é o escopo de TODO o CSS do módulo (tokens --ga-*). Mudar este nome sem
  // mudar as folhas deixa o painel sem estilo nenhum.
  _host.setAttribute('data-ga-react-root', '');
  _host.style.height = '100%';
  contentEl.appendChild(_host);

  _root = createRoot(_host);
  _root.render(
    <StrictMode>
      <App />
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
