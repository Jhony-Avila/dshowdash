// testes/mobile-touch-inventory.mjs — TRACK C cert corretiva: inventário de
// TODOS os elementos interativos utilizáveis nos 14 viewports mobile. Classifica
// largura/altura/área/visível/função/criticidade/viewport e FALHA se qualquer
// ação utilizável (visível, não-hidden, interativa) medir < 44×44 CSS px.
// Salva o inventário completo em saida/touch-inventory.json.
import { abrir, irParaHarness } from './navegador.mjs';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
const FLAGS = { 'as5.novo_shell': true, 'as6.single_2d': true, 'as6.dock_inferior': true, 'as6.mobile_studio': true };
const VPS = [[320,568],[360,640],[375,667],[390,844],[393,873],[412,915],[430,932],[667,375],[844,390],[768,1024],[1024,768],[1280,720],[1440,900],[1600,1000]];
const mobileVP = (w,h)=> w<=768||h<=520;
let falhas = 0; const ok = (c, m) => { console.log(`${c ? '  ✓' : '  ✗ FALHA:'} ${m}`); if (!c) falhas++; };

const SAIDA = resolve(import.meta.dirname, 'saida'); mkdirSync(SAIDA, { recursive: true });
const { navegador, pagina, erros } = await abrir({ viewport: { width: 390, height: 844 }, init: (f) => { try { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify(f)); } catch {} }, initArg: FLAGS });
const inventario = [];
try {
  await irParaHarness(pagina, 'avst-harness.html', 1000);
  for (const [w, h] of VPS) {
    await pagina.setViewportSize({ width: w, height: h });
    await pagina.waitForTimeout(160);
    const itens = await pagina.evaluate((dm) => {
      const SEL = 'button, [role="button"], a[href], input, select, textarea, [tabindex]:not([tabindex="-1"]), .avst-swatch, input[type="range"]';
      const escopo = document.querySelector(dm ? '.avst5-shell[data-mobile]' : '.avst5-shell') || document;
      const crit = (el) => {
        const c = el.className && el.className.baseVal !== undefined ? el.className.baseVal : (el.className || '');
        if (/avst5-cat|avst5-salvar|avst5-ferr-fechar|avst6-navg-cab/.test(c)) return 'critico';
        if (/avst-swatch|avst-ft-chip|avst-fchip|avst-card|avst5-header-acoes/.test(c)) return 'secundario';
        return 'outro';
      };
      const func = (el) => (el.getAttribute('aria-label') || (el.textContent||'').trim().slice(0,24) || el.getAttribute('title') || el.type || el.tagName.toLowerCase());
      const out = [];
      for (const el of escopo.querySelectorAll(SEL)) {
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        const visivel = r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && !el.hasAttribute('hidden') && el.offsetParent !== null;
        out.push({ w: Math.round(r.width), h: Math.round(r.height), area: Math.round(r.width*r.height), visivel, func: func(el), crit: crit(el) });
      }
      return out;
    }, mobileVP(w,h));
    const usaveis = itens.filter((i) => i.visivel);
    const sub44 = usaveis.filter((i) => i.w < 44 || i.h < 44);
    // No desktop (não-mobile) os alvos seguem o design aprovado (Track A) — só exigimos ≥44 na composição MOBILE.
    const exige = mobileVP(w, h);
    inventario.push({ viewport: `${w}x${h}`, mobile: exige, totalInterativos: itens.length, usaveis: usaveis.length, sub44: sub44.map((i)=>({ func: i.func, w: i.w, h: i.h, crit: i.crit })) });
    if (exige) ok(sub44.length === 0, `${w}x${h} (mobile): ${usaveis.length} alvos utilizáveis, ${sub44.length} abaixo de 44×44${sub44.length?': '+sub44.map(i=>`${i.func}(${i.w}x${i.h})`).slice(0,6).join(', '):''}`);
    else console.log(`  · ${w}x${h} (desktop, fora do critério mobile): ${usaveis.length} alvos`);
  }
  writeFileSync(resolve(SAIDA, 'touch-inventory.json'), JSON.stringify(inventario, null, 2));
  console.log(`  inventário salvo: ${inventario.length} viewports → saida/touch-inventory.json`);
  ok(erros.length === 0, `sem erros JS (${erros.slice(0,2).join(' | ')})`);
} finally { await navegador.close(); }
console.log(falhas ? `\n✗ mobile-touch-inventory: ${falhas} falha(s)` : '\n✓ mobile-touch-inventory verde');
process.exit(falhas ? 1 : 0);
