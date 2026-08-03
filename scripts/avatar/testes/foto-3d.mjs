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

// escolher Casual → captura headless (SwiftShader é lento) → Estilizar
await p.locator('.avst-foto-3d-item', { hasText: 'Casual' }).click();
await p.waitForSelector('.avst-ft-preview svg', { timeout: 45000 });
const svg = await p.locator('.avst-ft-preview svg').evaluate((el) => el.outerHTML);
ok(svg.includes('<image'), 'preview estilizada sem a captura embutida');
ok(await p.locator('[data-teste="templates-foto"]').count() === 1, 'fluxo Estilizar não abriu após a captura');
// captura 3D real: o data-uri embutido tem tamanho de imagem de verdade
ok(svg.length > 20000, `SVG do preview suspeito de captura vazia (${svg.length} chars)`);
await p.screenshot({ path: `${SAIDA}/foto3d-estilizada.png` });

const ok_ = relatorio('foto-3d', falhas, erros);
await b.close();
process.exit(ok_ ? 0 : 1);
