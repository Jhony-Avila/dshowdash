// testes/foto-pro2.mjs — lote 541–550 (§339/§346/§348.1/§360/§370, flag
// as5.foto_pro2): foto PRO 2.
//   • §348.1: chips de partículas ESTÁTICAS → entram no SVG (sem
//     <animate> — export fiel); neutro = SVG limpo (byte-stability)
//   • §370: linha de validação com resolução/proporção/transparência
//     visível antes do export; muda com o formato
//   • rollback §651
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
    name: 't.png', mimeType: 'image/png', buffer: Buffer.from(png, 'base64'),
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
  // §348.1: partículas entram/saem, SEM animação
  const base = await svgDe(p);
  ok(await p.locator('[data-teste="foto-particulas"]').count() === 1, 'chips §348.1 ausentes');
  await p.evaluate(() => document.querySelector('[data-teste="fpart-estrelas"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true })));
  await p.waitForTimeout(400);
  const comPart = await svgDe(p);
  ok(comPart !== base, 'partículas não entraram no SVG');
  ok(!comPart.includes('<animate'), 'partículas da foto não podem animar (§348.1 estático)');
  await p.evaluate(() => document.querySelector('[data-teste="fpart-nenhum"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true })));
  await p.waitForTimeout(400);
  ok(await svgDe(p) === base, 'neutro não restaurou byte a byte');

  // §370: specs visíveis e reagem ao formato
  ok(await p.locator('[data-teste="export-specs"]').count() === 1, 'linha §370 ausente');
  ok((await p.locator('[data-teste="export-specs"]').textContent())?.includes('1:1'),
    'specs do perfil sem proporção');
  await p.screenshot({ path: `${SAIDA}/foto-pro2.png` });
} catch (e) { falhas.push(`exceção: ${e.message}`); }
await b.close();

const { navegador: b2, pagina: p2, erros: erros2 } = await abrir({
  viewport: { width: 1500, height: 940 },
  init: () => {
    localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({
      'as5.novo_shell': false, 'as5.palco3d': false, 'as5.foto_pro2': false,
    }));
  },
});
try {
  await irParaHarness(p2, 'avst-harness.html', 1200);
  await prepararFoto(p2);
  ok(await p2.locator('[data-teste="foto-particulas"]').count() === 0, 'flag off com chips (§651)');
  ok(await p2.locator('[data-teste="export-specs"]').count() === 0, 'flag off com specs (§651)');
} catch (e) { falhas.push(`exceção no rollback: ${e.message}`); }

const ok_ = relatorio('foto-pro2', falhas, [...erros, ...erros2]);
await b2.close();
process.exit(ok_ ? 0 : 1);
