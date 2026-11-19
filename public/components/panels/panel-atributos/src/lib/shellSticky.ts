// CABEÇALHO TRAVADO (UX-1b refeito + trava da barra do shell). Decisão do Cima (opção 1): o módulo só mexe no shell por estilo INLINE,
// só enquanto está montado, e desfaz tudo ao sair. Nenhum arquivo do shell muda.
//  1. Os ancestrais entre o módulo e quem ROLA a página não podem ser contêineres de rolagem (senão o sticky gruda neles). Medido:
//     .dsd-container__body (overflow:auto) e #container-main (overflow:hidden) → overflow: clip (recorta igual, sem rolar).
//  2. A barra do painel (.dsd-container__header, "Produtos & Atributos") também fica travada: position: sticky no topo da área visível.
//     O topo da área visível vem do token do shell --lv2-top (header + ticker no Shell Layout v2, em que o DOCUMENTO rola por baixo
//     do header fixo; na produção a flag as6.shell_layout_v2 está ligada para todos). Sem o v2, quem rola é o main#main: topo 0.
//     A altura da barra vem do token dela (--cm-header-height); o módulo marca data-barra-travada para descontá-la (CSS, sem medir).
// Desfeito em três caminhos: vigia (o shell tira o nó do módulo do DOM sem chamar o unmount), cleanup do App e unmountReact (entry.tsx).
// DÍVIDA TÉCNICA (PARA-STATUS §50): levar estas regras para o CSS do shell num portão próprio e apagar este arquivo.
type Original = Partial<Record<'overflow' | 'position' | 'top' | 'zIndex', string>>;
const trocados = new Map<HTMLElement, Original>();   // elemento → valores ORIGINAIS do style inline que o módulo trocou
let vigia: MutationObserver | null = null;
let raizMarcada: HTMLElement | null = null;

function trocar(e: HTMLElement, props: Original): void {
  const orig = trocados.get(e) ?? {};
  for (const k of Object.keys(props) as (keyof Original)[]) { if (!(k in orig)) orig[k] = e.style[k]; e.style[k] = props[k] as string; }
  trocados.set(e, orig);
}

export function liberarSticky(modulo: HTMLElement, rolador: Element): void {
  if (!vigia && typeof MutationObserver !== 'undefined') {
    vigia = new MutationObserver(() => { if (!modulo.isConnected) restaurarShell(); });
    vigia.observe(rolador === document.documentElement ? document.body : rolador, { childList: true, subtree: true });
  }
  for (let e = modulo.parentElement; e && e !== rolador && e !== document.body; e = e.parentElement) {
    const c = getComputedStyle(e);
    if (/^(visible|clip)$/.test(c.overflowY) && /^(visible|clip)$/.test(c.overflowX)) continue;
    trocar(e, { overflow: 'clip' });
  }
  // barra do painel: irmã do corpo, filha direta do contêiner do painel
  const barra = modulo.closest('.dsd-container')?.querySelector<HTMLElement>(':scope > .dsd-container__header') ?? null;
  if (barra && barra.contains(modulo) === false) {
    trocar(barra, { position: 'sticky', top: 'var(--lv2-top, 0px)', zIndex: '30' });
    modulo.setAttribute('data-barra-travada', '1'); raizMarcada = modulo;
  }
}

export function restaurarShell(): void {
  vigia?.disconnect(); vigia = null;
  for (const [e, orig] of trocados) { try { for (const k of Object.keys(orig) as (keyof Original)[]) e.style[k] = orig[k] as string; } catch { /* fora do DOM */ } }
  trocados.clear();
  try { raizMarcada?.removeAttribute('data-barra-travada'); } catch { /* fora do DOM */ } raizMarcada = null;
}

export const elementosTrocados = () => trocados.size;
