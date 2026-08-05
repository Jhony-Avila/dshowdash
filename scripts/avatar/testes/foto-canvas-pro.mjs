// testes/foto-canvas-pro.mjs — LOTE 221–230, megas 221–225: PHOTO STUDIO
// PRO (§323/§324/§344/§345). Cobre:
//  1) flag as5.foto_canvas_pro liga o canvas (viewport + controles §324);
//  2) zoom por botões/percentual + fit (§324.1);
//  3) grade e safe areas como overlays (§324);
//  4) seleção de elemento + nudge move a LEGENDA no SVG (§323.2) e
//     Centralizar/Restaurar voltam ao layout automático (§324.2);
//  5) setas do teclado movem o elemento (acessibilidade §323.2) e a dica
//     §349 "legenda sobre o rosto" aparece e corrige em 1 clique;
//  6) título-componente: escala G/P e compacto mudam o selo (§344);
//  7) presets de posição do emblema (§345.1);
//  8) template ASSINATURA aplica pos+seloCfg (mega 225);
//  9) as 3 regiões engajam via container query em contêiner largo (§323,
//     decisão #51) — e o fluxo empilhado segue são no aside estreito.
import { SAIDA, abrir, irParaHarness } from './navegador.mjs';

const { navegador: b, pagina: p, erros } = await abrir({ viewport: { width: 1500, height: 980 } });
await irParaHarness(p, 'avst-harness.html', 800);

const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };

// ── entra no Estilizar com foto sintética ──
await p.evaluate(() => { [...document.querySelectorAll('.avst-cat')].find((x) => x.textContent.trim() === 'Foto')?.click(); });
await p.waitForTimeout(500);
await p.evaluate(async () => {
  const c = document.createElement('canvas');
  c.width = 480; c.height = 480;
  const g = c.getContext('2d');
  g.fillStyle = '#4c9de8'; g.fillRect(0, 0, 480, 480);
  const blob = await new Promise((r) => c.toBlob(r, 'image/png'));
  const dt = new DataTransfer();
  dt.items.add(new File([blob], 'pro.png', { type: 'image/png' }));
  const input = document.querySelector('input[type="file"]');
  input.files = dt.files;
  input.dispatchEvent(new Event('change', { bubbles: true }));
});
await p.waitForSelector('.avst-foto-acoes', { timeout: 10000 });
await p.evaluate(() => { [...document.querySelectorAll('.avst-foto-acoes button')].find((x) => x.textContent.includes('Estilizar'))?.click(); });
await p.waitForSelector('[data-teste="ftp-canvas"]', { timeout: 10000 });
const svgDe = () => p.evaluate(() => document.querySelector('.avst-ft-preview svg')?.outerHTML ?? '');

// ── 1) canvas ligado pela flag ──
ok(await p.locator('[data-teste="ftpro"]').count() === 1, 'contêiner ftpro ausente (flag as5.foto_canvas_pro?)');
ok(await p.locator('[data-teste="ftp-controles"]').count() === 1, 'controles do canvas ausentes');

// ── 2) zoom §324.1 ──
ok((await p.locator('[data-teste="ftp-pct"]').textContent()) === '100%', 'zoom inicial deveria ser 100%');
await p.locator('[data-teste="ftp-mais"]').click();
ok((await p.locator('[data-teste="ftp-pct"]').textContent()) === '125%', 'zoom + não foi a 125%');
await p.locator('[data-teste="ftp-fit"]').click();
ok((await p.locator('[data-teste="ftp-pct"]').textContent()) === '100%', 'Fit não voltou a 100%');

// ── 3) grade + safe areas §324 ──
ok(await p.locator('[data-teste="ftp-grade"]').count() === 0, 'grade deveria começar desligada');
await p.locator('[data-teste="ftp-grade-toggle"]').click();
ok(await p.locator('[data-teste="ftp-grade"]').count() === 1, 'grade não ligou');
await p.locator('[data-teste="ftp-safe-toggle"]').click();
ok(await p.locator('[data-teste="ftp-safe"]').count() === 1, 'safe areas não ligaram');
await p.locator('[data-teste="ftp-grade-toggle"]').click(); // desliga (não interfere no snap dos passos seguintes)

// ── 4) seleção + nudge da LEGENDA §323.2 ──
await p.locator('[data-teste="legenda-foto"]').evaluate((el) => {
  const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
  set.call(el, 'Dshow'); el.dispatchEvent(new Event('input', { bubbles: true }));
});
await p.waitForTimeout(300);
const baseline = await svgDe();
ok(baseline.includes('x="120" y="200"'), 'legenda deveria começar no layout legado (120/200)');
await p.locator('[data-teste="ftp-el-legenda"]').click();
ok(await p.locator('[data-teste="ftp-marcador"]').count() === 1, 'marcador de seleção ausente');
await p.locator('[data-teste="ftp-nudge"] button[aria-label="Mover à direita"]').click();
await p.locator('[data-teste="ftp-nudge"] button[aria-label="Mover à direita"]').click();
await p.waitForTimeout(250);
ok((await svgDe()).includes('x="124"'), 'nudge ▶▶ não moveu a legenda para x=124');
await p.locator('[data-teste="ftp-centralizar"]').click();
await p.waitForTimeout(250);
ok((await svgDe()).includes('x="120"'), 'Centralizar não voltou a legenda ao centro (x=120)');
await p.locator('[data-teste="ftp-restaurar"]').click();
await p.waitForTimeout(250);
ok(await svgDe() === baseline, 'Restaurar deveria devolver o SVG byte-idêntico ao layout automático');

// ── 5) teclado (setas) + dica §349 da legenda sobre o rosto ──
await p.locator('.avst-ftp-viewport').focus();
for (let i = 0; i < 7; i++) await p.keyboard.press('Shift+ArrowUp'); // 200 → 144
await p.waitForTimeout(350);
ok((await svgDe()).includes('y="144"'), 'setas com Shift não moveram a legenda para y=144');
const dicaRosto = await p.evaluate(() => [...document.querySelectorAll('[data-teste="dicas-foto"] p')]
  .some((x) => x.textContent.includes('sobre o rosto')));
ok(dicaRosto, 'dica §349 "legenda sobre o rosto" não apareceu');
await p.evaluate(() => { [...document.querySelectorAll('[data-teste="dica-aplicar"]')].at(-1)?.click(); });
await p.waitForTimeout(300);
ok(await svgDe() === baseline, 'aplicar a dica deveria restaurar o layout automático');

// ── 6) título-componente §344 ──
await p.evaluate(() => {
  const grupo = [...document.querySelectorAll('.avst-ft-grupo')].find((x) => x.querySelector('.avst-ft-rotulo')?.textContent.includes('Título'));
  [...(grupo?.querySelectorAll('.avst-ft-chip') ?? [])][1]?.click(); // 1º título real
});
await p.waitForTimeout(300);
ok(await p.locator('[data-teste="selo-cfg"]').count() === 1, 'chips do selo (§344) ausentes com título ativo');
const seloAntes = await svgDe();
ok(seloAntes.includes('font-size="12"'), 'selo legado deveria usar font-size 12');
await p.locator('[data-teste="selo-esc-g"]').click();
await p.waitForTimeout(250);
ok((await svgDe()).includes('font-size="14.2"'), 'escala G não aumentou o selo (esperava font-size 14.2)');
await p.locator('[data-teste="selo-esc-m"]').click();
await p.waitForTimeout(250);
ok(await svgDe() === seloAntes, 'voltar à escala M deveria restaurar o selo legado byte a byte');

// ── 7) presets do emblema §345.1 ──
await p.evaluate(() => {
  const grupo = [...document.querySelectorAll('.avst-ft-grupo')].find((x) => x.querySelector('.avst-ft-rotulo')?.textContent.trim().startsWith('Emblema'));
  [...(grupo?.querySelectorAll('.avst-ft-chip') ?? [])][1]?.click();
});
await p.waitForTimeout(300);
ok(await p.locator('[data-teste="ftp-emblema-presets"]').count() === 1, 'presets do emblema (§345.1) ausentes');
await p.locator('[data-teste="ftp-emb-canto-sup"]').click();
await p.waitForTimeout(250);
ok((await svgDe()).includes('translate(50 -168)'), 'preset canto superior não moveu o emblema (esperava translate(50 -168))');
await p.locator('[data-teste="ftp-emb-auto"]').click();
await p.waitForTimeout(250);
ok((await svgDe()).includes('translate(26 -28)'), 'preset Auto não voltou ao translate legado');

// ── 8) template ASSINATURA aplica pos+seloCfg (mega 225) ──
await p.evaluate(() => { document.querySelector('[data-teste="tpl-filtro-assinatura"]')?.click(); });
await p.waitForTimeout(250);
ok(await p.locator('[data-teste="tpl-tpl_selo_discreto"]').count() === 1, 'categoria assinatura sem o Selo Discreto');
await p.locator('[data-teste="tpl-tpl_selo_discreto"] .avst-ft-template').click();
await p.waitForTimeout(400);
const svgTpl = await svgDe();
ok(svgTpl.includes('font-size="9.8"'), 'seloCfg escala P do template não entrou (esperava font-size 9.8)');
ok(svgTpl.includes('y="14"'), 'pos.selo do template não moveu o selo ao topo (y=14)');
await p.screenshot({ path: `${SAIDA}/foto-canvas-pro.png` });

// ── 9) 3 regiões engajam com contêiner largo (decisão #51) ──
const displayEstreito = await p.evaluate(() => getComputedStyle(document.querySelector('.avst-ft-pro')).display);
ok(displayEstreito !== 'grid', `no aside estreito o PRO deveria ficar empilhado (veio ${displayEstreito})`);
await p.addStyleTag({ content: '.avst-foto { width: 1100px !important; max-width: none !important; }' });
await p.waitForTimeout(300);
const displayLargo = await p.evaluate(() => getComputedStyle(document.querySelector('.avst-ft-pro')).display);
ok(displayLargo === 'grid', `com ≥700px as 3 regiões deveriam engajar (§323 — veio ${displayLargo})`);

ok(erros.length === 0, `erros de página: ${erros.join(' | ')}`);

await b.close();
if (falhas.length) { console.error('FALHAS foto-canvas-pro:\n- ' + falhas.join('\n- ')); process.exit(1); }
console.log('foto-canvas-pro OK');
