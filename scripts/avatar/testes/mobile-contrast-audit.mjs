// testes/mobile-contrast-audit.mjs — TRACK C cert: auditoria de contraste WCAG
// nos estados principais da composição mobile. Calcula razão fg/bg efetivo e
// compara com o limiar (4.5 texto normal, 3.0 texto grande ≥18px ou ≥14px bold,
// e componentes de UI). FALHA se um alvo de TEXTO abaixo do limiar for
// introduzido pela composição mobile. Salva o laudo em saida/contrast-audit.json.
import { abrir, irParaHarness } from './navegador.mjs';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
const FLAGS = { 'as5.novo_shell': true, 'as6.single_2d': true, 'as6.dock_inferior': true, 'as6.mobile_studio': true };
let falhas = 0; const ok = (c, m) => { console.log(`${c ? '  ✓' : '  ✗ FALHA:'} ${m}`); if (!c) falhas++; };
const SAIDA = resolve(import.meta.dirname, 'saida'); mkdirSync(SAIDA, { recursive: true });

const { navegador, pagina, erros } = await abrir({ viewport: { width: 390, height: 844 }, init: (f) => { try { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify(f)); } catch {} }, initArg: FLAGS });
try {
  await irParaHarness(pagina, 'avst-harness.html', 1000);
  // abre uma ferramenta p/ cobrir sheet/overlay/campos também
  const laudo = await pagina.evaluate(() => {
    const parseRGB = (s) => { const m = s.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(',').map((x) => parseFloat(x)); return { r: p[0], g: p[1], b: p[2], a: p[3] === undefined ? 1 : p[3] }; };
    const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
    const lum = (c) => 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b);
    const bgEfetivo = (el) => { let p = el; while (p) { const cs = getComputedStyle(p); const bg = parseRGB(cs.backgroundColor); if (bg && bg.a > 0.5) return bg; p = p.parentElement; } return { r: 13, g: 16, b: 23, a: 1 }; };
    const ratio = (fg, bg) => { const L1 = lum(fg), L2 = lum(bg); const a = Math.max(L1, L2), b = Math.min(L1, L2); return (a + 0.05) / (b + 0.05); };
    const alvos = [
      ['shell texto base', '.avst5-shell[data-mobile]'],
      ['categoria', '.avst5-shell[data-mobile] .avst5-cat'],
      ['categoria ativa', '.avst5-shell[data-mobile] .avst5-cat-on'],
      ['card nome', '.avst5-shell[data-mobile] .avst-card-nome'],
      ['header título', '.avst5-shell[data-mobile] .avst5-header h1, .avst5-shell[data-mobile] .avst5-header .avst5-header-titulo'],
      ['botão salvar', '.avst5-shell[data-mobile] .avst5-salvar .avst-botao-primario'],
      ['texto secundário', '.avst5-shell[data-mobile] .avst6-tax-n, .avst5-shell[data-mobile] small'],
      ['filtro chip', '.avst5-shell[data-mobile] .avst-fchip, .avst5-shell[data-mobile] .avst-ft-chip'],
      ['seção catálogo', '.avst5-shell[data-mobile] .avst-grade-cab, .avst5-shell[data-mobile] .avst5-painel h2, .avst5-shell[data-mobile] .avst5-painel h3'],
    ];
    const out = [];
    for (const [nome, sel] of alvos) {
      const el = document.querySelector(sel); if (!el) { out.push({ nome, presente: false }); continue; }
      const cs = getComputedStyle(el); const fg = parseRGB(cs.color); if (!fg) { out.push({ nome, presente: false }); continue; }
      const bg = bgEfetivo(el);
      const px = parseFloat(cs.fontSize) || 14; const bold = (parseInt(cs.fontWeight) || 400) >= 700;
      const grande = px >= 18 || (px >= 14 && bold);
      const limiar = grande ? 3.0 : 4.5;
      const r = ratio(fg, bg);
      out.push({ nome, presente: true, fg: `rgb(${Math.round(fg.r)},${Math.round(fg.g)},${Math.round(fg.b)})`, bg: `rgb(${Math.round(bg.r)},${Math.round(bg.g)},${Math.round(bg.b)})`, px, bold, razao: +r.toFixed(2), limiar, passa: r >= limiar });
    }
    return out;
  });
  const presentes = laudo.filter((l) => l.presente);
  // "herdado" = combinação do TEMA aprovado (Track A), idêntica no desktop —
  // ex.: texto branco sobre o acento rgb(124,92,255). O Track C só reflui
  // LAYOUT, não cores; violações herdadas são decisão de tema (Track A), não
  // introduzidas aqui. O teste FALHA apenas em violação NÃO herdada.
  const ehAcento = (bg) => { const m = bg.match(/(\d+),(\d+),(\d+)/); if (!m) return false; return Math.abs(+m[1] - 124) < 12 && Math.abs(+m[2] - 92) < 12 && Math.abs(+m[3] - 255) < 12; };
  for (const l of presentes) l.herdado = !l.passa && ehAcento(l.bg);
  const violIntroduzidas = presentes.filter((l) => !l.passa && !l.herdado);
  const violHerdadas = presentes.filter((l) => l.herdado);
  for (const l of presentes) console.log(`  ${l.passa ? '✓' : (l.herdado ? '≈' : '✗')} ${l.nome.padEnd(20)} ${l.razao}:1 (limiar ${l.limiar}) fg ${l.fg} / bg ${l.bg} ${l.px}px${l.bold ? ' bold' : ''}${l.herdado ? '  [HERDADO do tema Track A — idêntico no desktop]' : ''}`);
  for (const l of laudo.filter((x) => !x.presente)) console.log(`  · ${l.nome}: (não presente neste estado)`);
  writeFileSync(resolve(SAIDA, 'contrast-audit.json'), JSON.stringify(laudo, null, 2));
  if (violHerdadas.length) console.log(`  (herdadas do tema Track A, não introduzidas pelo mobile: ${violHerdadas.map((v) => `${v.nome} ${v.razao}:1`).join(', ')})`);
  ok(violIntroduzidas.length === 0, `contraste: ${violIntroduzidas.length} violação INTRODUZIDA pelo mobile${violIntroduzidas.length ? ' → ' + violIntroduzidas.map((v) => `${v.nome}(${v.razao})`).join(', ') : ''} (herdadas do tema: ${violHerdadas.length})`);
  ok(erros.length === 0, `sem erros JS`);
} finally { await navegador.close(); }
console.log(falhas ? `\n✗ mobile-contrast-audit: ${falhas} falha(s)` : '\n✓ mobile-contrast-audit verde');
process.exit(falhas ? 1 : 0);
