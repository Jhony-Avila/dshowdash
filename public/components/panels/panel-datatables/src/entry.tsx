// entry.tsx — ponto de entrada do painel React.
// @version 1.0.0  @created 2026-07-20
//
// CONTRATO COM O APP-SHELL
// O shell nao conhece React. Ele chama, no adaptador vanilla (index.js):
//     const instance = await panelModule.mount(contentEl, config)
//     await panelModule.unmount()
//
// Este arquivo expoe as duas funcoes equivalentes para o adaptador, sem exigir
// que o shell saiba de raiz React, StrictMode ou qualquer detalhe interno.
//
// POR QUE NAO HA IFRAME AQUI: montamos no MESMO documento do shell. Consequencia
// direta e desejada — as CSS custom properties do shell (--bg-card, --text-primary,
// data-theme) valem para dentro do React sem ponte nenhuma.
import { StrictMode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { App } from './app/App';
import type { ShellConfig } from './shell/types';

let _root: Root | null = null;
let _host: HTMLElement | null = null;

/** Chamado pelo adaptador. Idempotente: monta duas vezes nao duplica. */
export async function mountReact(contentEl: HTMLElement, config: ShellConfig = {}): Promise<void> {
  if (_root) {
    await unmountReact();
  }

  // Container proprio: o shell limpa o `contentEl` no unmount dele. Ter um no
  // intermediario evita que a limpeza do shell e a do React briguem pelo mesmo
  // elemento — causa classica de "removeChild on a node that is not a child".
  _host = document.createElement('div');
  _host.setAttribute('data-dt-react-root', '');
  _host.style.height = '100%';
  contentEl.appendChild(_host);

  _root = createRoot(_host);
  _root.render(
    <StrictMode>
      <App config={config} />
    </StrictMode>
  );
}

/** Desmonta e devolve o DOM ao estado anterior. Seguro chamar sem ter montado. */
export function unmountReact(): Promise<void> {
  if (_root) {
    // unmount() e sincrono, mas dispara efeitos de limpeza; o microtask abaixo
    // garante que eles rodem antes de o shell reaproveitar o container.
    _root.unmount();
    _root = null;
  }
  if (_host) {
    _host.remove();
    _host = null;
  }
  return Promise.resolve();
}

/** Diagnostico para o healthCheck do painel. */
export function reactInfo() {
  return {
    mounted: _root !== null,
    hasHost: _host !== null,
  };
}
