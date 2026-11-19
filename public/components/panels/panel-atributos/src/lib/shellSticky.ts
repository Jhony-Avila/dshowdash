// UX-1b refeito (decisão do Cima, opção 1): para o cabeçalho do módulo grudar (position: sticky), os ancestrais do shell entre o módulo e
// o elemento que ROLA a página não podem ser contêineres de rolagem. Medido: .dsd-container__body (overflow:auto) e #container-main
// (overflow:hidden). Enquanto o módulo está montado, esses intermediários ficam com overflow: clip (recorta igual, sem virar contêiner de
// rolagem). DESFEITO na desmontagem (efeito do App) E de novo no unmountReact do entry.tsx (finally: qualquer troca de rota/painel, mesmo
// se o React der erro). Nenhum arquivo do shell muda.
// DÍVIDA TÉCNICA registrada: mover esta regra para o CSS do shell num portão próprio (opção 2) e apagar este arquivo.
const trocados = new Map<HTMLElement, string>();   // elemento → overflow ORIGINAL (style inline)
let vigia: MutationObserver | null = null;

export function liberarSticky(modulo: HTMLElement, rolador: Element): void {
  // Medido no harness 8115 (shell idêntico à produção): ao trocar de painel, o shell TIRA o nó do módulo do DOM sem chamar o unmount
  // na hora. Por isso, além do cleanup do React e do unmountReact, este vigia restaura assim que o módulo deixa o documento.
  if (!vigia && typeof MutationObserver !== 'undefined') {
    vigia = new MutationObserver(() => { if (!modulo.isConnected) restaurarShell(); });
    vigia.observe(rolador, { childList: true, subtree: true });
  }
  for (let e = modulo.parentElement; e && e !== rolador; e = e.parentElement) {
    const c = getComputedStyle(e);
    if (/^(visible|clip)$/.test(c.overflowY) && /^(visible|clip)$/.test(c.overflowX)) continue;
    if (!trocados.has(e)) trocados.set(e, e.style.overflow);
    e.style.overflow = 'clip';
  }
}

export function restaurarShell(): void {
  vigia?.disconnect(); vigia = null;
  for (const [e, v] of trocados) { try { e.style.overflow = v; } catch { /* elemento já fora do DOM */ } }
  trocados.clear();
}

export const elementosTrocados = () => trocados.size;
