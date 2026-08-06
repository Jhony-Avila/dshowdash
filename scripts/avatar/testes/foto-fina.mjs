// testes/foto-fina.mjs — lote 311–320 (§326/§333/§340–§341/§369/§372,
// flag as5.foto_fina): foto fina. App CLÁSSICO (aba Foto, como foto-f6):
//   • §333 nitidez: slider novo → feConvolveMatrix entra no SVG; zerar
//     remove (byte-stability: neutro = SEM filtro de convolução)
//   • §340–341 formas estrela/escudo: chips novos aplicam polygon/path
//   • §372 marca d'água: input → <text> discreto; vazio = some
//   • §369 JPEG: botão novo baixa image/jpeg (asserção no dataURL)
//   • §326 v2: contagem por categoria nos chips da galeria de templates
//   • rollback §651: flag off = nenhum controle novo aparece
// @version 1.0.0  @created 2026-08-06
import { SAIDA, abrir, irParaHarness, relatorio } from './navegador.mjs';

const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };

async function prepararFoto(p) {
  const png = await p.evaluate(() => {
    const c = document.createElement('canvas');
    c.width = 96; c.height = 96;
    const g = c.getContext('2d');
    g.fillStyle = '#4c9de8'; g.fillRect(0, 0, 96, 96);
    return c.toDataURL('image/png').split(',')[1];
  });
  await p.evaluate(() => { [...document.querySelectorAll('.avst-cat')].find((x) => x.textContent.trim() === 'Foto')?.click(); });
  await p.waitForTimeout(600);
  await p.locator('input[type="file"]').first().setInputFiles({
    name: 'teste.png', mimeType: 'image/png', buffer: Buffer.from(png, 'base64'),
  });
  await p.waitForTimeout(800);
  await p.locator('button', { hasText: 'Estilizar' }).click();
  await p.waitForTimeout(600);
}
const svgDe = (p) => p.locator('.avst-ft-preview svg').evaluate((el) => el.outerHTML);

const { navegador: b, pagina: p, erros } = await abrir({ viewport: { width: 1500, height: 940 } });
try {
  await irParaHarness(p, 'avst-harness.html', 1200);
  await prepararFoto(p);

  // §326 v2: contagens por categoria nos chips
  ok(await p.locator('[data-teste="tpl-contagem"]').count() > 2, 'contagens §326 v2 ausentes');

  // abre o painel de ajustes (mesmo caminho dos testes anteriores)
  await p.locator('button', { hasText: 'Ajustes' }).first().click().catch(() => {});
  await p.waitForTimeout(400);

  // §333 nitidez: neutro SEM convolução → slider liga → entra; zerar → sai
  const antes = await svgDe(p);
  ok(!antes.includes('feConvolveMatrix'), 'neutro não pode ter convolução (byte-stability §333)');
  ok(await p.locator('[data-teste="ajuste-nitidez"]').count() === 1, 'slider de nitidez ausente (§333)');
  await p.locator('[data-teste="ajuste-nitidez"]').evaluate((el) => {
    const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    set.call(el, '0.6');
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await p.waitForTimeout(400);
  ok((await svgDe(p)).includes('feConvolveMatrix'), 'nitidez não entrou no SVG (§333)');
  await p.locator('[data-teste="ajuste-nitidez"]').evaluate((el) => {
    const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    set.call(el, '0');
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await p.waitForTimeout(400);
  ok(!(await svgDe(p)).includes('feConvolveMatrix'), 'zerar a nitidez não limpou o SVG');

  // §340–341: estrela e escudo
  await p.locator('[data-teste="forma-estrela"]').click();
  await p.waitForTimeout(400);
  const svgEstrela = await svgDe(p);
  ok(svgEstrela.includes('<polygon'), 'forma estrela não aplicou polygon (§341)');
  await p.locator('[data-teste="forma-escudo"]').click();
  await p.waitForTimeout(400);
  ok((await svgDe(p)) !== svgEstrela, 'escudo não mudou o clip (§341)');
  await p.locator('[data-teste="forma-circulo"]').click();
  await p.waitForTimeout(300);

  // §372: marca d'água
  await p.locator('[data-teste="ajuste-marca"]').fill('Dshow 2026');
  await p.waitForTimeout(400);
  ok((await svgDe(p)).includes('DSHOW 2026'), 'marca d\'água não rendeu (§372)');
  await p.locator('[data-teste="ajuste-marca"]').fill('');
  await p.waitForTimeout(400);
  ok(!(await svgDe(p)).includes('DSHOW 2026'), 'marca vazia deveria sumir');

  // §369: JPEG — intercepta o clique e confere o dataURL
  ok(await p.locator('[data-teste="baixar-jpeg"]').count() === 1, 'botão JPEG ausente (§369)');
  const tipoBaixado = await p.evaluate(async () => new Promise((resolve) => {
    const orig = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function c() {
      HTMLAnchorElement.prototype.click = orig;
      resolve(String(this.href).slice(0, 22));
    };
    document.querySelector('[data-teste="baixar-jpeg"]').dispatchEvent(new MouseEvent('click', { bubbles: true }));
    setTimeout(() => resolve('TIMEOUT'), 8000);
  }));
  ok(String(tipoBaixado).startsWith('data:image/jpeg'), `download não é JPEG (§369): ${tipoBaixado}`);
  await p.screenshot({ path: `${SAIDA}/foto-fina.png` });
} catch (e) {
  falhas.push(`exceção: ${e.message}`);
}
await b.close();

// rollback §651: flag off → controles novos ausentes, foto igual à de antes
const { navegador: b2, pagina: p2, erros: erros2 } = await abrir({
  viewport: { width: 1500, height: 940 },
  init: () => {
    localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({
      'as5.novo_shell': false, 'as5.palco3d': false, 'as5.foto_fina': false,
    }));
  },
});
try {
  await irParaHarness(p2, 'avst-harness.html', 1200);
  await prepararFoto(p2);
  ok(await p2.locator('[data-teste="ajuste-nitidez"]').count() === 0, 'flag off com nitidez (§651)');
  ok(await p2.locator('[data-teste="baixar-jpeg"]').count() === 0, 'flag off com JPEG (§651)');
  ok(await p2.locator('[data-teste="ajuste-marca"]').count() === 0, 'flag off com marca (§651)');
  ok(await p2.locator('[data-teste="forma-estrela"]').count() === 0, 'flag off com estrela (§651)');
  ok(await p2.locator('[data-teste="tpl-contagem"]').count() === 0, 'flag off com contagens (§651)');
} catch (e) {
  falhas.push(`exceção no rollback: ${e.message}`);
}

const ok_ = relatorio('foto-fina', falhas, [...erros, ...erros2]);
await b2.close();
process.exit(ok_ ? 0 : 1);
