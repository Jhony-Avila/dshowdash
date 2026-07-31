// panel-bling/src/entry.tsx — ponte entre o app-shell (vanilla) e o React
// @version 1.0.0  @created 2026-07-30
//
// Espelha panel-google-calendar/src/entry.tsx. O adaptador vanilla (index.js)
// importa este módulo e chama mountReact/unmountReact.

import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { App } from './app/App';
import '../../../_shared-react/styles/tokens.css';
import './styles/modulo.css';

export const MODULE_ID = 'panels/panel-bling';
export const VERSION = '1.0.0';

let _root: Root | null = null;
let _container: HTMLElement | null = null;
let _hospedeiro: HTMLElement | null = null;

export async function mountReact(container: HTMLElement, config: Record<string, unknown> = {}) {
  if (_root) await unmountReact();
  if (!container) throw new Error(`[${MODULE_ID}] container obrigatório`);

  _container = container;
  container.innerHTML = '';

  // O React monta num nó PRÓPRIO, não direto no container do app-shell.
  //
  // Motivo (medido em 2026-07-30): ao trocar de painel, o shell limpa o
  // container por conta própria. Se a raiz do React for o próprio container,
  // `root.unmount()` tenta remover filhos que o shell já removeu e estoura
  // `NotFoundError: removeChild`. Com um nó intermediário, o React só mexe no
  // que é dele. O controle (Google Calendar) não apresentava o erro; o Bling
  // apresentava 3 por troca de painel — era nosso, não do shell.
  const hospedeiro = document.createElement('div');
  hospedeiro.setAttribute('data-bl-host', '');
  hospedeiro.style.height = '100%';
  container.appendChild(hospedeiro);
  _hospedeiro = hospedeiro;

  _root = createRoot(hospedeiro);
  _root.render(<App />);

  return { moduleId: MODULE_ID, version: VERSION, config };
}

export async function unmountReact() {
  if (_root) {
    // unmount fora do ciclo de render: desmontar durante o render do React
    // dispara aviso e pode deixar o container num estado inconsistente.
    const r = _root;
    _root = null;
    await Promise.resolve();
    try {
      r.unmount();
    } catch (e) {
      // O shell pode ter esvaziado o container antes de nos chamar. Nesse caso
      // não há o que desmontar — e derrubar o unmount por isso deixaria o
      // próximo mount num estado pior.
      console.warn(`[${MODULE_ID}] unmount ignorado (container já limpo):`, e);
    }
  }
  if (_hospedeiro && _hospedeiro.parentNode) {
    _hospedeiro.parentNode.removeChild(_hospedeiro);
  }
  _hospedeiro = null;
  _container = null;
}

export function reactInfo() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    mounted: _root !== null,
    container: _container ? 'presente' : 'ausente',
    hospedeiro: _hospedeiro ? 'presente' : 'ausente',
  };
}

export default { mountReact, unmountReact, reactInfo, MODULE_ID, VERSION };
