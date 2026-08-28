// global-mobile-static.mjs — Track D: PROVA ESTÁTICA (pura, sem browser) da
// garantia mais crítica: TODO seletor de global-mobile.css exige #app-shell[data-mobile]
// → com o marcador ausente (flag OFF) NENHUMA regra casa → desktop BYTE A BYTE.
// Também confere que cada correção de causa-raiz está presente.
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
// caminho PORTÁTIL: relativo ao próprio script (repo root = 3 níveis acima de
// scripts/avatar/testes/), com fallback p/ cwd — roda em qualquer checkout.
const REL = 'public/components/app-shell/styles/global-mobile.css';
const viaScript = fileURLToPath(new URL('../../../' + REL, import.meta.url));
const CSS_PATH = existsSync(viaScript) ? viaScript : REL;
const css = readFileSync(CSS_PATH, 'utf8');
let falhas = 0; const ok = (c, m) => { console.log(`${c ? '  \u2713' : '  \u2717 FALHA:'} ${m}`); if (!c) falhas++; };

// remove comentários; extrai seletores de regra (ignora headers de @media/@supports)
const semCom = css.replace(/\/\*[\s\S]*?\*\//g, '');
const tokens = semCom.split('}').map((s) => s.trim()).filter(Boolean);
let seletores = [];
for (const t of tokens) {
  const braceParts = t.split('{');
  for (let i = 0; i < braceParts.length - 1; i++) {
    let sel = braceParts[i].trim();
    sel = sel.split('\n').map((x) => x.trim()).filter(Boolean).pop() || '';
    if (!sel || sel.startsWith('@')) continue;
    for (const s of sel.split(',')) { const ss = s.trim(); if (ss) seletores.push(ss); }
  }
}
seletores = seletores.filter((s) => !s.startsWith('@') && !/^\d/.test(s) && !s.includes('%'));
const semMarcador = seletores.filter((s) => !/#app-shell\[data-mobile\]/.test(s));
console.log(`  (analisados ${seletores.length} seletores)`);
if (semMarcador.length) console.log('  seletores SEM marcador:', semMarcador.slice(0, 8));
ok(seletores.length > 20, `global-mobile.css tem regras (${seletores.length} seletores)`);
ok(semMarcador.length === 0, `TODO seletor exige #app-shell[data-mobile] -> flag OFF = desktop byte a byte (${semMarcador.length} fora)`);

const tem = (re, m) => ok(re.test(css), m);
tem(/\.dsd-sidebar[^{]*\{\s*display:\s*flex\s*!important/i, 'sidebar: neutraliza display:none <500 (display:flex !important sob o marcador)');
tem(/\.header-right[\s\S]*?overflow-x:\s*auto/i, 'header: header-right contem as acoes (overflow-x:auto) - sem clip do documento');
tem(/env\(safe-area-inset-bottom/i, 'safe-area-inset-bottom aplicado (bottom-nav/footer)');
tem(/prefers-reduced-motion:\s*reduce[\s\S]*?\.ticker-track[\s\S]*?animation:\s*none/i, 'ticker: reduced-motion cobre .ticker-track (animation:none)');
tem(/\.dsd-footer[^{]*\{\s*position:\s*static\s*!important/i, 'footer: entra no fluxo (position:static) - nao compete com bottom-nav');
tem(/min-height:\s*var\(--gm-tap\)|min-height:\s*44px/i, 'alvos de toque >=44px (min-height)');
tem(/--header-ticker-total:|--sidebar-width:|--footer-height-total:/i, 'tokens de offset UNIFICADOS sob o marcador');

console.log(falhas ? `\n\u2717 global-mobile-static: ${falhas} falha(s)` : '\n\u2713 global-mobile-static verde');
process.exit(falhas ? 1 : 0);
