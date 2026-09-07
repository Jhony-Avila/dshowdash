// vc/enquadramentoDinamico.ts — Enquadramento (framing) E hit-testing dinâmicos
// COMPARTILHADOS: uma única geometria/transformação para os dois (decisão #48/#49).
//
// Regra de ouro (correção obrigatória do Jhony):
//   • Rosto/corpo NUNCA cortados: o viewBox é derivado dos LIMITES VISUAIS REAIS do
//     personagem equipado (getBBox de [data-anim="plano-personagem"], que já exclui o
//     fundo) + margem de segurança. `contain` sempre (preserveAspectRatio meet), nunca
//     `cover`. Sem preset fixo; recalcula a cada gatilho.
//   • Hotspots usam A MESMA transformação: pointer→coordenada interna por
//     getScreenCTM().inverse() (incorpora viewBox+meet+tamanho do palco vivo), e as
//     regiões são getBBox de grupos semânticos quando existem, senão a caixa canônica
//     da parte — NADA de porcentagem fixa sobre o crop antigo.
//   • Realce sutil desenhado DENTRO do próprio <svg> (mesmo viewBox) → alinhamento
//     garantido por construção; nenhum retângulo técnico/roxo.

export interface CaixaU { x: number; y: number; w: number; h: number; }

// Canvas base do motor 2D (busto x corpo) — usado como enquadramento de segurança
// (tela cheia = jamais cortado) quando a medição falha, e para clamp de margem.
export const BASE_BUSTO: CaixaU = { x: 0, y: 0, w: 240, h: 240 };
export const BASE_CORPO: CaixaU = { x: 0, y: 0, w: 240, h: 400 };

// Margem de segurança padrão (fração do maior lado do alvo). 0.10 = 10% (faixa 8–12%).
export const MARGEM_PADRAO = 0.10;

// Identificadores estáveis de parte (independem do crop). Cada um resolve a região
// clicável por: 1) grupo semântico data-anim (se existir no render); 2) caixa canônica.
export type ParteId =
  | 'acessorio_cabeca' | 'cabelo' | 'olhos' | 'boca' | 'rosto' | 'roupa' | 'calcados';

interface DefParte {
  id: ParteId;
  seletores: string[];       // grupos semânticos a tentar (getBBox), em ordem
  canonBusto?: CaixaU;       // fallback em espaço de usuário do busto (240x240)
  canonCorpo?: CaixaU;       // fallback em espaço de usuário do corpo (240x400)
}

// Caixas canônicas derivadas do enquadramento real do motor (grupos.ts `foco`),
// em coordenadas de usuário. Só entram quando não há grupo semântico medível.
const DEFS: DefParte[] = [
  { id: 'acessorio_cabeca', seletores: ['[data-anim="acessorio"]', '[data-parte="acessorio"]'],
    canonBusto: { x: 50, y: 0, w: 140, h: 74 }, canonCorpo: { x: 78, y: 8, w: 84, h: 44 } },
  { id: 'cabelo', seletores: ['[data-anim="cabelo"]', '[data-parte="cabelo"]'],
    canonBusto: { x: 46, y: 6, w: 148, h: 130 }, canonCorpo: { x: 82, y: 10, w: 76, h: 70 } },
  { id: 'olhos', seletores: ['[data-anim="olhos"]', '[data-parte="olhos"]'],
    canonBusto: { x: 64, y: 56, w: 112, h: 74 }, canonCorpo: { x: 96, y: 40, w: 48, h: 30 } },
  { id: 'boca', seletores: ['[data-anim="boca"]', '[data-parte="boca"]'],
    canonBusto: { x: 70, y: 96, w: 100, h: 78 }, canonCorpo: { x: 100, y: 66, w: 40, h: 24 } },
  { id: 'rosto', seletores: ['[data-anim="rosto"]', '[data-parte="rosto"]'],
    canonBusto: { x: 58, y: 46, w: 124, h: 120 }, canonCorpo: { x: 88, y: 30, w: 64, h: 90 } },
  { id: 'roupa', seletores: ['[data-anim="roupa"]', '[data-parte="roupa"]'],
    canonCorpo: { x: 30, y: 150, w: 180, h: 150 } },
  { id: 'calcados', seletores: ['[data-anim="calcados"]', '[data-parte="pes"]', '[data-parte="calcados"]'],
    canonCorpo: { x: 40, y: 315, w: 160, h: 85 } },
];

// Prioridade de sobreposição: o topo VISUAL recebe o clique. Uma caixa grande (rosto)
// NÃO pode bloquear cabelo/olhos/boca. 'acessorio_cabeca' NÃO entra como região de clique
// sintética: o render não expõe grupo próprio de acessório e uma caixa derivada do topo do
// cabelo apenas roubaria o clique do cabelo; acessórios de cabeça são editáveis pelo trilho.
const PRIORIDADE: ParteId[] = ['cabelo', 'olhos', 'boca', 'rosto', 'roupa', 'calcados'];

const ID_REALCE = 'vc-realce-dinamico';

function bboxSeguro(el: Element | null): CaixaU | null {
  if (!el || typeof (el as SVGGraphicsElement).getBBox !== 'function') return null;
  try {
    const b = (el as SVGGraphicsElement).getBBox();
    if (!isFinite(b.width) || !isFinite(b.height) || b.width <= 0 || b.height <= 0) return null;
    return { x: b.x, y: b.y, w: b.width, h: b.height };
  } catch { return null; }
}

/** Limites visuais reais do PERSONAGEM equipado (exclui o fundo). Null se não medível. */
export function medirPersonagem(svg: SVGSVGElement): CaixaU | null {
  return bboxSeguro(svg.querySelector('[data-anim="plano-personagem"]'))
    ?? bboxSeguro(svg.querySelector('[data-anim="personagem"]'));
}

/** viewBox com margem de segurança ao redor do alvo. `contain` é garantido pelo meet. */
export function viewBoxComMargem(alvo: CaixaU, margem = MARGEM_PADRAO): string {
  const m = Math.max(alvo.w, alvo.h) * margem;
  const x = alvo.x - m, y = alvo.y - m, w = alvo.w + m * 2, h = alvo.h + m * 2;
  // Arredonda para evitar jitter de subpixel entre recalculos (anti zoom cumulativo).
  const r = (n: number) => Math.round(n * 100) / 100;
  return `${r(x)} ${r(y)} ${r(w)} ${r(h)}`;
}

/**
 * Aplica o enquadramento dinâmico ao <svg> vivo: viewBox pelos limites reais +
 * preserveAspectRatio="xMidYMid meet" (contain, centralizado no alvo visual, nunca
 * cover). Falha de medição → tela cheia do canvas base (jamais corta). Idempotente:
 * o mesmo estado produz o mesmo viewBox (sem acúmulo de zoom).
 */
export function enquadrar(svg: SVGSVGElement, opts: { corpo: boolean; margem?: number }): void {
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  const alvo = medirPersonagem(svg);
  const base = opts.corpo ? BASE_CORPO : BASE_BUSTO;
  const vb = alvo ? viewBoxComMargem(alvo, opts.margem ?? MARGEM_PADRAO)
                  : `${base.x} ${base.y} ${base.w} ${base.h}`;
  if (svg.getAttribute('viewBox') !== vb) svg.setAttribute('viewBox', vb);
}

/** Converte um ponto de tela (clientX/Y) para coordenada INTERNA do svg (mesma
 *  transformação do enquadramento, via CTM inverso). */
export function pontoInterno(svg: SVGSVGElement, clientX: number, clientY: number): { x: number; y: number } | null {
  const ctm = svg.getScreenCTM();
  if (!ctm) return null;
  try {
    const p = new DOMPoint(clientX, clientY).matrixTransform(ctm.inverse());
    return { x: p.x, y: p.y };
  } catch { return null; }
}

// Regiões faciais DERIVADAS dos grupos semânticos REAIS (olhos/cabelo medidos por
// getBBox) — boca/rosto/acessório não têm grupo próprio no render, então em vez de
// porcentagem fixa (recusada) as caixas são ancoradas na geometria real e se adaptam
// por avatar. Só caem no canônico absoluto se olhos/cabelo não forem medíveis.
function derivarFace(svg: SVGSVGElement): Partial<Record<ParteId, CaixaU>> {
  const olhos = bboxSeguro(svg.querySelector('[data-anim="olhos"]'));
  const cabelo = bboxSeguro(svg.querySelector('[data-anim="cabelo"]'));
  const out: Partial<Record<ParteId, CaixaU>> = {};
  if (olhos) out.olhos = olhos;
  if (cabelo) {
    // O getBBox cru do cabelo é um retângulo largo que COBRE os olhos e rouba o clique.
    // A região clicável do cabelo é recortada ACIMA do topo dos olhos (a copa/coroa);
    // assim olhos/boca/rosto ficam livres e o cabelo pega apenas o alto da cabeça.
    const topo = cabelo.y;
    const base = olhos ? Math.min(cabelo.y + cabelo.h, olhos.y) : cabelo.y + cabelo.h;
    const h = Math.max(base - topo, cabelo.h * 0.25);
    out.cabelo = { x: cabelo.x, y: topo, w: cabelo.w, h };
  }
  if (olhos) {
    const cx = olhos.x + olhos.w / 2;
    const bw = olhos.w * 0.62, bh = Math.max(olhos.h * 1.0, 14);
    const by = olhos.y + olhos.h * 1.9;
    out.boca = { x: cx - bw / 2, y: by, w: bw, h: bh };
    const topo = olhos.y - olhos.h * 0.4;
    const base = by + bh * 1.6;
    const rw = olhos.w * 1.18;
    out.rosto = { x: cx - rw / 2, y: topo, w: rw, h: base - topo };
  }
  return out;
}

/** Regiões clicáveis atuais, na ordem de PRIORIDADE (topo visual primeiro).
 *  Para as partes da face, a versão DERIVADA (olhos real; cabelo recortado acima dos
 *  olhos; boca/rosto ancorados na face real) tem preferência sobre o getBBox cru — este
 *  é greedy e sobrepõe. Sem derivada: grupo semântico → caixa canônica do modo.
 *  Mesma geometria usada pelo enquadramento. */
export function regioes(svg: SVGSVGElement, corpo: boolean): { id: ParteId; caixa: CaixaU }[] {
  const out: { id: ParteId; caixa: CaixaU }[] = [];
  const der = derivarFace(svg);
  for (const pid of PRIORIDADE) {
    const def = DEFS.find((d) => d.id === pid);
    if (!def) continue;
    let caixa: CaixaU | null = der[pid] ?? null;
    if (!caixa) { for (const sel of def.seletores) { caixa = bboxSeguro(svg.querySelector(sel)); if (caixa) break; } }
    if (!caixa) caixa = corpo ? (def.canonCorpo ?? null) : (def.canonBusto ?? null);
    if (caixa) out.push({ id: pid, caixa });
  }
  return out;
}

function dentro(c: CaixaU, x: number, y: number): boolean {
  return x >= c.x && x <= c.x + c.w && y >= c.y && y <= c.y + c.h;
}

/** Parte atingida por um ponto de tela, respeitando a prioridade de sobreposição. */
export function acertar(svg: SVGSVGElement, clientX: number, clientY: number, corpo: boolean): ParteId | null {
  const p = pontoInterno(svg, clientX, clientY);
  if (!p) return null;
  for (const r of regioes(svg, corpo)) if (dentro(r.caixa, p.x, p.y)) return r.id;
  return null;
}

/** Garante que o <rect> de realce exista (criado uma vez, oculto). Chamado dentro do
 *  reenquadramento — quando o MutationObserver do chamador está desconectado — para
 *  que hovers subsequentes só mudem ATRIBUTOS (nunca childList) e não disparem loops. */
export function garantirRealce(svg: SVGSVGElement): SVGRectElement {
  let rect = svg.querySelector<SVGRectElement>('#' + ID_REALCE);
  if (!rect) {
    rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('id', ID_REALCE);
    rect.setAttribute('fill', 'rgba(124,58,237,0.10)');
    rect.setAttribute('stroke', 'rgba(124,58,237,0.55)');
    rect.setAttribute('stroke-width', '1.5');
    rect.setAttribute('rx', '8');
    rect.setAttribute('pointer-events', 'none');
    rect.setAttribute('vector-effect', 'non-scaling-stroke');
    rect.setAttribute('opacity', '0');
  }
  if (rect.parentNode !== svg) svg.appendChild(rect); // último filho → por cima do personagem
  return rect;
}

/** Atualiza o realce sutil DENTRO do svg (mesmo viewBox → alinhado sempre). caixa=null
 *  oculta. Sem retângulo técnico: preenchimento leve + contorno macio não-escalável. */
export function marcarRealce(svg: SVGSVGElement, caixa: CaixaU | null): void {
  const rect = garantirRealce(svg);
  if (!caixa) { rect.setAttribute('opacity', '0'); return; }
  rect.setAttribute('x', String(caixa.x));
  rect.setAttribute('y', String(caixa.y));
  rect.setAttribute('width', String(caixa.w));
  rect.setAttribute('height', String(caixa.h));
  rect.setAttribute('opacity', '1');
}

/** Caixa de uma parte específica (para realçar a seleção ativa sem hover). */
export function caixaDaParte(svg: SVGSVGElement, id: ParteId, corpo: boolean): CaixaU | null {
  for (const r of regioes(svg, corpo)) if (r.id === id) return r.caixa;
  return null;
}
