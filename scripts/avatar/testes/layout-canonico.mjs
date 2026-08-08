// testes/layout-canonico.mjs — lote 801–810 (AS6 §2676–§2687): estados
// canônicos + assinatura de geometria compartilhados entre o GERADOR
// (gerar-baseline-layout.mjs) e o TESTE (regressao-layout.mjs).
// @version 1.0.0  @created 2026-08-08
//
// Cada estado canônico declara: flags/preparo e os SELETORES estruturais
// que precisam existir e manter geometria estável. A assinatura de um
// elemento é a bounding box arredondada a 2px (tolerância de subpixel/
// fontes) + visível ou não. Elementos de conteúdo dinâmico (cards de
// catálogo, contadores) ficam FORA de propósito — aqui é ESTRUTURA.

/** Seletores estruturais do shell (macro-regiões + controles fixos). */
const SHELL = ['.avst5-header', '.avst5-sidebar', '.avst5-viewport', '.avst5-painel',
  '.avst5-fundos', '.avst6-cam', '.avst5-zoom'];

export const ESTADOS_CANONICOS = [
  { id: 'shell-edicao', flags: { 'as5.novo_shell': true }, seletores: SHELL },
  {
    id: 'shell-foco',
    flags: { 'as5.novo_shell': true },
    preparar: async (p) => { await p.keyboard.press('f'); await p.waitForTimeout(400); },
    seletores: ['.avst5-header', '.avst5-viewport', '.avst5-zoom'],
  },
  {
    id: 'classico-aaa-itens',
    flags: { 'as5.novo_shell': false, 'as5.classico_aaa': true },
    preparar: async (p) => {
      await p.evaluate(() => { [...document.querySelectorAll('.avst-cat')].find((x) => x.textContent.trim() === 'Itens')?.click(); });
      await p.waitForTimeout(600);
    },
    seletores: ['.avst-topo', '.avst-centro', '.avst-palco', '.avst-trilho', '[data-teste="aaa-cores"]', '.avst-barra-estado'],
  },
  {
    id: 'classico-foto',
    flags: { 'as5.novo_shell': false, 'as5.classico_aaa': true },
    preparar: async (p) => {
      await p.evaluate(() => { [...document.querySelectorAll('.avst-cat')].find((x) => x.textContent.trim() === 'Foto')?.click(); });
      await p.waitForTimeout(600);
    },
    seletores: ['.avst-topo', '.avst-foto', '.avst-categorias'],
  },
];

/** Assinatura: caixa arredondada a 2px + visibilidade, por seletor. */
export async function assinaturaDoEstado(pagina, estado) {
  if (estado.preparar) await estado.preparar(pagina);
  return pagina.evaluate((seletores) => {
    const arred = (v) => Math.round(v / 2) * 2;
    const saida = {};
    for (const sel of seletores) {
      const el = document.querySelector(sel);
      if (!el) { saida[sel] = null; continue; }
      const r = el.getBoundingClientRect();
      const st = getComputedStyle(el);
      saida[sel] = {
        x: arred(r.x), y: arred(r.y), w: arred(r.width), h: arred(r.height),
        visivel: st.display !== 'none' && st.visibility !== 'hidden' && r.width > 0 && r.height > 0,
      };
    }
    return saida;
  }, estado.seletores);
}

/** Compara assinatura atual × baseline; devolve a lista de desvios. */
export function compararAssinaturas(baseline, atual, tolerancia = 2) {
  const desvios = [];
  for (const [sel, esperado] of Object.entries(baseline)) {
    const visto = atual[sel];
    if (esperado === null && visto === null) continue;
    if (esperado === null || visto === null) {
      desvios.push(`${sel}: ${esperado === null ? 'não existia e agora existe' : 'sumiu do DOM'}`);
      continue;
    }
    if (esperado.visivel !== visto.visivel) {
      desvios.push(`${sel}: visibilidade mudou (${esperado.visivel} → ${visto.visivel})`);
      continue;
    }
    for (const eixo of ['x', 'y', 'w', 'h']) {
      if (Math.abs(esperado[eixo] - visto[eixo]) > tolerancia) {
        desvios.push(`${sel}: ${eixo} desviou ${esperado[eixo]} → ${visto[eixo]} (tolerância ${tolerancia}px)`);
      }
    }
  }
  return desvios;
}
