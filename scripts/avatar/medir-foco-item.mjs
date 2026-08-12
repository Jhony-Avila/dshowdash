// scripts/avatar/medir-foco-item.mjs — onda 1401 (decisão #150): mede o
// BOUNDING BOX real do fragmento SVG de cada acessório (camada isolada)
// e imprime a tabela `FOCO_ITEM_ASSET` pronta para colar em
// src/components/modoItem.ts (viewBox quadrado, ocupação-alvo ~78%,
// briefing de elevação §12: 70–85%).
//
// FERRAMENTA DE DESENVOLVIMENTO (mesma doutrina do --gravar dos goldens,
// #83): rodar, revisar o diff da tabela e commitar JUNTO com a arte nova.
// A medição usa getBBox num Chromium headless — o RESULTADO é baked em
// dados estáticos; o runtime continua 100% determinístico (zero DOM).
//
// Uso (da raiz do repo):
//   node scripts/avatar/medir-foco-item.mjs            (imprime a tabela)
//   node scripts/avatar/medir-foco-item.mjs ace_bone   (só um asset)
// @version 1.0.0  @created 2026-08-12
import { execSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { chromium } from 'playwright-core';

const RAIZ = resolve(import.meta.dirname, '..', '..');
const PAINEL = join(RAIZ, 'public', 'components', 'panels', 'panel-avatar-studio');
const SO_ASSET = process.argv[2] ?? null;

// alvo de ocupação (lado do bbox / lado do viewBox) — meio do §12 (70–85%)
const OCUPACAO = 0.78;
const LADO_CANVAS = 240;

// 1) bundle Node-puro que exporta os fragmentos SVG por asset -----------
const tmp = mkdtempSync(join(tmpdir(), 'avst-foco-'));
writeFileSync(join(tmp, 'entrada.ts'), `
import { ACESSORIOS } from '${PAINEL}/src/engine/partes/acessorios';
import { paletaDe } from '${PAINEL}/src/engine/cores';
import { CONFIG_PADRAO } from '${PAINEL}/src/services/AvatarCatalog';

const paleta = paletaDe(CONFIG_PADRAO.cores);
const saida: Array<{ id: string; svg: string }> = [];
for (const parte of ACESSORIOS) {
  saida.push({
    id: parte.id,
    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${LADO_CANVAS} ${LADO_CANVAS}" width="${LADO_CANVAS}" height="${LADO_CANVAS}">'
      + parte.render(paleta, 'medir') + '</svg>',
  });
}
console.log(JSON.stringify(saida));
`);
execSync(
  `npx esbuild ${join(tmp, 'entrada.ts')} --bundle --platform=node --format=esm `
  + `--outfile=${join(tmp, 'entrada.mjs')} --log-level=silent`,
  { cwd: RAIZ, stdio: ['ignore', 'inherit', 'inherit'] },
);
const fragmentos = JSON.parse(
  execSync(`node ${join(tmp, 'entrada.mjs')}`, { cwd: RAIZ }).toString(),
);
rmSync(tmp, { recursive: true, force: true });

// 2) getBBox de cada fragmento num Chromium headless --------------------
const navegador = await chromium.launch({
  executablePath: process.env.PW_CHROME ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--no-sandbox'],
});
const pagina = await (await navegador.newContext()).newPage();
await pagina.setContent('<!doctype html><body></body>');

const linhas = [];
for (const { id, svg } of fragmentos) {
  if (SO_ASSET && id !== SO_ASSET) continue;
  const caixa = await pagina.evaluate((markup) => {
    document.body.innerHTML = markup;
    const el = document.body.querySelector('svg');
    const b = el.getBBox();
    return { x: b.x, y: b.y, w: b.width, h: b.height };
  }, svg);
  // viewBox QUADRADO centrado no bbox, lado = maior dimensão / ocupação;
  // clamp: nunca menor que 40 (itens minúsculos não viram zoom absurdo)
  const lado = Math.max(40, Math.max(caixa.w, caixa.h) / OCUPACAO);
  const x = caixa.x + caixa.w / 2 - lado / 2;
  const y = caixa.y + caixa.h / 2 - lado / 2;
  const f = (n) => String(Math.round(n));
  linhas.push(`  ${id}: '${f(x)} ${f(y)} ${f(lado)} ${f(lado)}',`);
}
await navegador.close();

console.log('// gerado por scripts/avatar/medir-foco-item.mjs — revisar o diff no mesmo commit');
console.log('export const FOCO_ITEM_ASSET: Record<string, string> = {');
for (const l of linhas.sort()) console.log(l);
console.log('};');
