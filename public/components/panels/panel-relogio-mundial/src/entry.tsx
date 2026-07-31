/**
 * entry.tsx — ponto de entrada do painel React (Relógio Mundial).
 * @version 3.0.0
 *
 * Contrato com o app-shell (via adaptador index.js):
 *   await panelModule.mount(contentEl, config)  -> mountReact
 *   await panelModule.unmount()                 -> unmountReact
 *
 * Monta no MESMO documento do shell: os tokens de tema e o `data-theme` valem sem
 * ponte, e o store consegue observar a troca de tema do usuário.
 *
 * SEM StrictMode aqui, ao contrário do panel-ads: o StrictMode monta e desmonta cada
 * efeito duas vezes em desenvolvimento, e este painel abre um ResizeObserver, um
 * MutationObserver, um intervalo de 1 s e dois AbortController no boot. O ciclo duplo
 * não quebra (todos têm cleanup), mas dobra requisição de clima e de geometria em
 * produção nenhuma vez — e mascara justamente a classe de vazamento que a gente quer
 * enxergar no navegador. O contrato de limpeza é garantido pelo unmount explícito.
 */
import { createRoot, type Root } from 'react-dom/client';
import { App } from '@/app/App';
import { StoreProvider } from '@/app/store';
// O CSS entra pelo entry para o Vite emitir a folha e registrá-la no manifest —
// é dela que o adaptador index.js monta os <link> antes de chamar mountReact.
import '@/styles/panel.css';

let _root: Root | null = null;
let _host: HTMLElement | null = null;

export interface ShellConfig {
  signal?: AbortSignal;
  [key: string]: unknown;
}

export async function mountReact(contentEl: HTMLElement, _config: ShellConfig = {}): Promise<void> {
  if (_root) await unmountReact();

  _host = document.createElement('div');
  _host.setAttribute('data-wcm-react-root', '');
  // ALTURA: o host é posicionado ABSOLUTO, não `height:100%`.
  //
  // `.dsd-container__content` recebe altura do flex do shell (`flex:1 1 0%`), então a
  // altura ESPECIFICADA dele é `auto` — mesmo que a computada seja 732px. Percentual de
  // altura resolve contra a especificada, virou `auto`, e o painel inteiro colapsava
  // para a altura natural do conteúdo (medido: 104px, com o mapa em 120px de canvas).
  // `inset:0` contra o `.dsd-container__content` (position:relative) não depende dessa
  // resolução e preenche o container de fato.
  _host.style.position = 'absolute';
  _host.style.inset = '0';
  contentEl.appendChild(_host);

  _root = createRoot(_host);
  _root.render(
    <StoreProvider>
      <App />
    </StoreProvider>,
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
  return { mounted: _root !== null, hasHost: _host !== null, version: '3.0.0' };
}
