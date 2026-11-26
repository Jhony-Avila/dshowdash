// panel-consultas/src/entry.tsx — ponte entre o app-shell (vanilla) e o React: "APIs para consulta" (1ª tela: Revisão cadastral, C2).
// @version 1.0.0  @created 2026-11-26 (VERDE/ACIMA_DIREITA). Molde: panel-atributos/src/entry.tsx (nó hospedeiro próprio: o shell
// limpa o container por conta própria ao trocar de painel; com o React num nó intermediário o unmount não estoura removeChild).
import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { RevisaoCadastral } from './screens/RevisaoCadastral';
import '../../../_shared-react/styles/tokens.css';
import './screens/revisao.css';

export const MODULE_ID = 'panels/panel-consultas';
export const VERSION = '1.0.0';

let _root: Root | null = null;
let _container: HTMLElement | null = null;
let _hospedeiro: HTMLElement | null = null;

export async function mountReact(container: HTMLElement, config: Record<string, unknown> = {}) {
  if (_root) await unmountReact();
  if (!container) throw new Error(`[${MODULE_ID}] container obrigatório`);
  _container = container;
  container.innerHTML = '';
  const hospedeiro = document.createElement('div');
  hospedeiro.setAttribute('data-cs-host', '');
  container.appendChild(hospedeiro);
  _hospedeiro = hospedeiro;
  _root = createRoot(hospedeiro);
  _root.render(<div data-bl-root className="cs-raiz"><RevisaoCadastral /></div>);
  return { moduleId: MODULE_ID, version: VERSION, config };
}

export async function unmountReact() {
  if (_root) {
    const r = _root;
    _root = null;
    await Promise.resolve();
    try { r.unmount(); } catch (e) { console.warn(`[${MODULE_ID}] unmount ignorado (container já limpo):`, e); }
  }
  if (_hospedeiro && _hospedeiro.parentNode) _hospedeiro.parentNode.removeChild(_hospedeiro);
  _hospedeiro = null;
  _container = null;
}

export function reactInfo() {
  return { moduleId: MODULE_ID, version: VERSION, mounted: _root !== null, container: _container ? 'presente' : 'ausente', hospedeiro: _hospedeiro ? 'presente' : 'ausente' };
}

export default { mountReact, unmountReact, reactInfo, MODULE_ID, VERSION };
