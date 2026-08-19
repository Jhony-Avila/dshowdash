// testes/visual/captura.mjs — onda 1407 (MEGA_BRIEFING_01 §2697–§2705,
// §2973; decisão #158): CAPTURA DETERMINÍSTICA para a regressão visual.
//   • viewport fixo (1440×900 2D/UI · 1500×940 3D) · DPR 1 · Chromium fixo
//     (PW_CHROME) · prefers-reduced-motion: reduce (vida/WAAPI param)
//   • SMIL pausado e zerado + Web Animations pausadas ANTES de cada
//     screenshot (congelarAnimacoes) — auras/efeitos ficam no frame 0
//   • SVG → PNG fora da UI (renderizarSvg): o fragmento do motor vira
//     imagem num documento mínimo, com tamanho padronizado por grupo
//   • 3D: canvas via toDataURL com double-RAF (SwiftShader) — aviso, não
//     tripwire (#158)
// @version 1.0.0  @created 2026-08-19
import { writeFileSync } from 'node:fs';
import { abrir, irParaHarness } from '../navegador.mjs';

export const VIEWPORT_2D = { width: 1440, height: 900 };
export const VIEWPORT_3D = { width: 1500, height: 940 };
export const TAMANHO_SVG = { busto: { w: 480, h: 480 }, corpo: { w: 480, h: 800 }, foto: { w: 960, h: null }, item: { w: 256, h: 256 } };

/** Abre um contexto determinístico (flags explícitas, reduced-motion). */
export async function abrirDeterministico({ webgl = false, flags = {}, viewport } = {}) {
  const sessao = await abrir({
    viewport: viewport ?? (webgl ? VIEWPORT_3D : VIEWPORT_2D), webgl,
    init: (f) => { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify(f)); },
    initArg: flags,
  });
  await sessao.pagina.emulateMedia({ reducedMotion: 'reduce' });
  return sessao;
}

/** Congela SMIL (pausa + t=0) e Web Animations na página inteira. */
export async function congelarAnimacoes(pagina) {
  await pagina.evaluate(() => {
    for (const svg of document.querySelectorAll('svg')) {
      try { svg.pauseAnimations?.(); svg.setCurrentTime?.(0); } catch { /* svg inline sem timeline */ }
    }
    try { for (const a of document.getAnimations?.() ?? []) { a.pause(); a.currentTime = 0; } } catch { /* sem WAAPI */ }
  });
  await pagina.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
}

/** Renderiza um fragmento SVG do motor em PNG (documento mínimo, fundo
 *  neutro escuro #0b0d14 = tokens do palco). Retorna { largura, altura }. */
export async function renderizarSvg(pagina, svg, caminho, tamanho = 'busto') {
  const t = TAMANHO_SVG[tamanho] ?? TAMANHO_SVG.busto;
  const estilo = t.h ? `width:${t.w}px;height:${t.h}px` : `width:${t.w}px;height:auto`;
  await pagina.setContent(
    `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;background:#0b0d14}svg{display:block;${estilo}}</style></head><body>${svg}</body></html>`,
    { waitUntil: 'load' },
  );
  await congelarAnimacoes(pagina);
  const el = pagina.locator('svg').first();
  await el.screenshot({ path: caminho, animations: 'disabled' });
  const caixa = await el.boundingBox();
  return { largura: Math.round(caixa?.width ?? 0), altura: Math.round(caixa?.height ?? 0) };
}

/** Ocupação (§12: 70–85%) de um SVG isolado: bbox do conteúdo / viewBox. */
export async function medirOcupacao(pagina, svg) {
  await pagina.setContent(`<!doctype html><body style="margin:0">${svg}</body>`, { waitUntil: 'load' });
  await congelarAnimacoes(pagina); // SMIL em t=0 — bbox determinístico
  return pagina.evaluate(() => {
    const s = document.querySelector('svg');
    if (!s) return null;
    const vb = s.viewBox?.baseVal;
    const b = s.getBBox();
    if (!vb || !vb.width) return null;
    const lado = Math.max(b.width, b.height);
    const ladoVb = Math.max(vb.width, vb.height);
    return { ocupacao: Math.round((lado / ladoVb) * 100) / 100, bbox: { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) }, viewBox: `${vb.x} ${vb.y} ${vb.width} ${vb.height}` };
  });
}

/** Screenshot de um elemento da UI com animações congeladas. */
export async function fotografarElemento(pagina, seletor, caminho) {
  await congelarAnimacoes(pagina);
  const el = pagina.locator(seletor).first();
  if (!(await el.count())) return false;
  await el.screenshot({ path: caminho, animations: 'disabled' });
  return true;
}

/** Canvas 3D → PNG (toDataURL; screenshot de elemento sai branco no SwiftShader). */
export async function fotografarCanvas3d(pagina, caminho) {
  await pagina.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  const data = await pagina.evaluate(() => document.querySelector('[data-teste="palco-3d"] canvas')?.toDataURL('image/png'));
  if (!data || data.length < 2000) return false;
  writeFileSync(caminho, Buffer.from(data.split(',')[1], 'base64'));
  return true;
}

export { irParaHarness };
