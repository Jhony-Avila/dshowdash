// testes/shell-s2.mjs — AS5 F2 S2: câmera contextual, fundos e atalhos.
import { SAIDA, abrir, irParaHarness, relatorio } from './navegador.mjs';

const { navegador: b, pagina: p, erros } = await abrir({
  viewport: { width: 1500, height: 940 },
  init: () => { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true, 'as6.dock_inferior': false })); },
});
await irParaHarness(p, 'avst-harness.html', 1200);

const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };
const zoomDe = () => p.locator('.avst5-zoom').evaluate((el) => getComputedStyle(el).transform);

// R2: enquadramento muda entre categorias; Olhos dá close
const zBase = await zoomDe();
await p.evaluate(() => { [...document.querySelectorAll('.avst5-cat')].find((x) => x.textContent.includes('Olhos'))?.click(); });
await p.waitForTimeout(800);
const zOlhos = await zoomDe();
ok(zBase !== zOlhos, 'enquadramento deveria mudar entre Rosto e Olhos');
const escala = await p.locator('.avst5-zoom').evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).a);
ok(escala > 1.8, `olhos deveria dar close (escala=${escala.toFixed(2)})`);
await p.screenshot({ path: `${SAIDA}/s2-olhos-close.png` });

// R1: fundo grade aplica
await p.locator('.avst5-fundos button', { hasText: 'Grade' }).click();
ok(await p.locator('.avst5-viewport[data-fundo="grade"]').count() === 1, 'fundo grade não aplicou');

// R6+R11: equipar → barra cita categoria; Ctrl+Z desfaz
await p.evaluate(() => { [...document.querySelectorAll('.avst5-cat')].find((x) => x.textContent.includes('Cabelo'))?.click(); });
await p.waitForTimeout(700);
const antes = await p.locator('.avst5-palco svg').evaluate((el) => el.innerHTML.length);
await p.evaluate(() => {
  const cards = [...document.querySelectorAll('.avst5-painel .avst-card')].filter((c) => !c.className.includes('avst-card-ativo'));
  cards[2]?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
});
await p.waitForTimeout(600);
ok((await p.locator('.avst5-salvar').textContent())?.includes('cabelo'), 'barra deveria citar a categoria alterada');
await p.keyboard.press('Control+z');
await p.waitForTimeout(500);
const depois = await p.locator('.avst5-palco svg').evaluate((el) => el.innerHTML.length);
ok(antes === depois, `Ctrl+Z não desfez (${antes}→${depois})`);

// persistência do fundo no reload
await p.reload({ waitUntil: 'networkidle' });
await p.waitForFunction(() => window.__pronto === true, { timeout: 20000 });
await p.waitForTimeout(1000);
ok(await p.locator('.avst5-viewport[data-fundo="grade"]').count() === 1, 'fundo não persistiu no reload');

const ok_ = relatorio('shell-s2', falhas, erros);
await b.close();
process.exit(ok_ ? 0 : 1);
