// testes/foto-3d.mjs — mega 12: Photo Studio com origem PERSONAGEM 3D
// (§21×§174.1): galeria de curados → captura headless §508 → Estilizar.
// @version 1.0.0  @created 2026-08-03
import { SAIDA, abrir, irParaHarness, relatorio } from './navegador.mjs';

const { navegador: b, pagina: p, erros } = await abrir({
  viewport: { width: 1500, height: 940 }, webgl: true,
});
await irParaHarness(p, 'avst-harness.html', 1200);

const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };

// mega 14: Vitrine com a seção Personagens 3D (6 cards do índice)
await p.evaluate(() => { [...document.querySelectorAll('.avst-cat')].find((x) => x.textContent.includes('Vitrine'))?.click(); });
await p.waitForTimeout(900);
ok(await p.locator('[data-teste="vitrine-3d"]').count() === 1, 'seção Personagens 3D ausente na Vitrine');
ok(await p.locator('[data-teste="vitrine-3d"] .avst-vt-card-3d').count() === 6, 'esperava 6 cards 3D na Vitrine');

// aba Foto (modo clássico) → origem "Personagem 3D"
await p.evaluate(() => { [...document.querySelectorAll('.avst-cat')].find((x) => x.textContent.trim() === 'Foto')?.click(); });
await p.waitForTimeout(600);
ok(await p.locator('[data-teste="origem-3d"]').count() === 1, 'origem Personagem 3D ausente');
await p.locator('[data-teste="origem-3d"]').click();
await p.waitForSelector('[data-teste="galeria-3d"]', { timeout: 10000 });

// cadeia registry(vazio no harness)→index.json serviu os 6 com thumbs
const itens = await p.locator('.avst-foto-3d-item').count();
ok(itens === 6, `esperava 6 personagens na galeria (${itens})`);
const thumbOk = await p.evaluate(async () => {
  const img = document.querySelector('.avst-foto-3d-item img');
  if (!img) return false;
  await new Promise((r) => { if (img.complete) r(); else { img.onload = r; img.onerror = r; } });
  return img.naturalWidth > 0;
});
ok(thumbOk, 'thumb do personagem não carregou');
await p.screenshot({ path: `${SAIDA}/foto3d-galeria.png` });

// mega 47: toggle "fundo transparente" LIGADO antes de escolher
ok(await p.locator('[data-teste="foto-3d-transparente"]').count() === 1, 'toggle transparente ausente na galeria');
await p.locator('[data-teste="foto-3d-transparente"] input').check();

// escolher Casual → captura headless (SwiftShader é lento) → Estilizar
await p.locator('.avst-foto-3d-item', { hasText: 'Casual' }).click();
await p.waitForSelector('.avst-ft-preview svg', { timeout: 45000 });
const svg = await p.locator('.avst-ft-preview svg').evaluate((el) => el.outerHTML);
ok(svg.includes('<image'), 'preview estilizada sem a captura embutida');
ok(await p.locator('[data-teste="templates-foto"]').count() === 1, 'fluxo Estilizar não abriu após a captura');
// captura 3D real: o data-uri embutido tem tamanho de imagem de verdade
ok(svg.length > 20000, `SVG do preview suspeito de captura vazia (${svg.length} chars)`);
// mega 15: botão Compartilhar presente (ClipboardItem existe no Chromium)
ok(await p.locator('[data-teste="compartilhar-foto"]').count() === 1, 'botão Compartilhar ausente na estilizada');
// mega 47: a captura embutida tem canto TRANSPARENTE (alpha 0) — o
// template compõe sem o fundo escuro do palco
const alphaCanto = await p.evaluate(async () => {
  const img = document.querySelector('.avst-ft-preview svg image');
  const href = img?.getAttribute('href') ?? img?.getAttribute('xlink:href');
  if (!href) return null;
  const el = new Image();
  await new Promise((r) => { el.onload = r; el.src = href; });
  const c = document.createElement('canvas');
  c.width = el.width; c.height = el.height;
  const g = c.getContext('2d');
  g.drawImage(el, 0, 0);
  return g.getImageData(2, 2, 1, 1).data[3];
});
ok(alphaCanto === 0, `captura 3D da Foto deveria ter canto transparente (alpha ${alphaCanto})`);
await p.screenshot({ path: `${SAIDA}/foto3d-estilizada.png` });

const ok_ = relatorio('foto-3d', falhas, erros);
await b.close();
process.exit(ok_ ? 0 : 1);
