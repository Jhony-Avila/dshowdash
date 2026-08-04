// testes/foto-pro.mjs — lote 51–59: Photo Studio PRO (ajustes §333/§334,
// sombra §337, histórico §360, projetos §364, validação §370, lote §371).
// Roda no modo CLÁSSICO (aba Foto) com uma imagem sintética.
// @version 1.0.0  @created 2026-08-04
import { SAIDA, abrir, irParaHarness, relatorio } from './navegador.mjs';

const { navegador: b, pagina: p, erros } = await abrir({ viewport: { width: 1500, height: 940 } });
await irParaHarness(p, 'avst-harness.html', 800);

const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };

// aba Foto (clássico) → injeta uma foto sintética direto no modo estilizada
await p.evaluate(() => { [...document.querySelectorAll('.avst-cat')].find((x) => x.textContent.trim() === 'Foto')?.click(); });
await p.waitForTimeout(600);
// gera uma foto 480 colorida e entra no Estilizar pela galeria sintética:
// caminho oficial = upload; aqui usamos o input de arquivo com um PNG gerado
await p.evaluate(async () => {
  const c = document.createElement('canvas');
  c.width = 480; c.height = 480;
  const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 480, 480);
  grad.addColorStop(0, '#e05c3a'); grad.addColorStop(1, '#3a7ce0');
  g.fillStyle = grad; g.fillRect(0, 0, 480, 480);
  const blob = await new Promise((r) => c.toBlob(r, 'image/png'));
  const arquivo = new File([blob], 'sintetica.png', { type: 'image/png' });
  const input = document.querySelector('.avst-foto-origens input[type="file"], input[type="file"]');
  const dt = new DataTransfer();
  dt.items.add(arquivo);
  input.files = dt.files;
  input.dispatchEvent(new Event('change', { bubbles: true }));
});
await p.waitForSelector('.avst-foto-acoes', { timeout: 10000 });
await p.evaluate(() => {
  [...document.querySelectorAll('.avst-foto-acoes button')].find((x) => x.textContent.includes('Estilizar'))?.click();
});
await p.waitForSelector('[data-teste="ajustes-foto"]', { timeout: 10000 });

// R1 (megas 51–54): ajustes mudam o preview; Zerar volta ao byte-idêntico
const svgDe = () => p.evaluate(() => document.querySelector('.avst-ft-preview svg')?.outerHTML ?? '');
const antes = await svgDe();
ok(antes.length > 1000, 'preview estilizado vazio');
await p.locator('[data-teste="ajuste-brilho"]').evaluate((el) => {
  const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
  set.call(el, '1.3');
  el.dispatchEvent(new Event('input', { bubbles: true }));
});
await p.waitForTimeout(300);
const comBrilho = await svgDe();
ok(comBrilho !== antes && comBrilho.includes('feComponentTransfer'), 'brilho não entrou no SVG (filtro §333)');
await p.locator('[data-teste="ajuste-sombra"]').click();
await p.waitForTimeout(300);
ok((await svgDe()).includes('ellipse'), 'sombra de contato §337 ausente');
await p.locator('[data-teste="ajuste-vinheta"]').evaluate((el) => {
  const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
  set.call(el, '0.6');
  el.dispatchEvent(new Event('input', { bubbles: true }));
});
await p.waitForTimeout(300);
ok((await svgDe()).includes('radialGradient'), 'vinheta §334 ausente');
await p.screenshot({ path: `${SAIDA}/foto-pro-ajustes.png` });
await p.locator('[data-teste="ajuste-zerar"]').click();
await p.waitForTimeout(300);
ok(await svgDe() === antes, 'Zerar ajustes deveria voltar ao SVG byte-idêntico (fotos salvas intactas)');

// R2 (mega 56): histórico — equipar camada vira passo; desfazer/refazer
ok(await p.locator('[data-teste="ft-desfazer"]').isDisabled(), 'desfazer deveria começar desabilitado');
await p.evaluate(() => {
  const grupo = [...document.querySelectorAll('.avst-ft-grupo')].find((x) => x.textContent.includes('Fundo'));
  [...(grupo?.querySelectorAll('.avst-ft-chip') ?? [])][1]?.click(); // 1º item real
});
await p.waitForTimeout(300);
ok(!(await p.locator('[data-teste="ft-desfazer"]').isDisabled()), 'equipar fundo deveria habilitar o desfazer');
const comFundo = await svgDe();
await p.locator('[data-teste="ft-desfazer"]').click();
await p.waitForTimeout(300);
ok(await svgDe() === antes, 'desfazer não voltou ao estado anterior');
await p.locator('[data-teste="ft-refazer"]').click();
await p.waitForTimeout(300);
ok(await svgDe() === comFundo, 'refazer não reaplicou o fundo');

// R3 (mega 58): validação reporta dimensões/peso sem baixar nada
await p.locator('[data-teste="validar-foto"]').click();
await p.waitForTimeout(1500);
const msgVal = await p.locator('.avst-foto-msg').textContent();
ok(/Validação: 480×480px · ~\d+KB/.test(msgVal ?? ''), `validação inesperada: ${msgVal}`);

// R4 (mega 59): lote — intercepta 4 downloads (um por formato §325)
const lote = await p.evaluate(async () => {
  const original = HTMLAnchorElement.prototype.click;
  const nomes = [];
  HTMLAnchorElement.prototype.click = function () { nomes.push(this.download); };
  document.querySelector('[data-teste="exportar-lote"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  for (let i = 0; i < 200 && nomes.length < 4; i += 1) await new Promise((r) => setTimeout(r, 100));
  HTMLAnchorElement.prototype.click = original;
  return nomes;
});
ok(lote.length === 4, `lote deveria gerar 4 arquivos (${lote.length})`);
ok(lote.some((n) => n.includes('header')) && lote.some((n) => n.includes('wallpaper')),
  `formatos faltando no lote: ${lote.join(', ')}`);

// R5 (mega 57): projeto — guardar, fechar, reabrir do zero
await p.locator('[data-teste="guardar-projeto"]').click();
await p.waitForFunction(
  () => document.querySelector('.avst-foto-msg')?.textContent?.includes('guardado'),
  { timeout: 6000 },
).catch(() => falhas.push('guardar projeto sem confirmação'));
await p.evaluate(() => {
  [...document.querySelectorAll('.avst-foto-acoes button')].find((x) => x.textContent.includes('Cancelar'))?.click();
});
await p.waitForTimeout(600);
await p.waitForSelector('[data-teste="projetos-foto"]', { timeout: 5000 });
ok(await p.locator('[data-teste="projetos-foto"] .avst-foto-item').count() === 1, 'projeto não apareceu na lista');
await p.locator('[data-teste="projetos-foto"] .avst-foto-item-img').click();
await p.waitForSelector('[data-teste="ajustes-foto"]', { timeout: 5000 });
await p.waitForFunction(
  () => document.querySelector('.avst-foto-msg')?.textContent?.includes('reaberto'),
  { timeout: 6000 },
).catch(() => falhas.push('reabrir projeto sem confirmação'));
await p.screenshot({ path: `${SAIDA}/foto-pro-projeto.png` });

const ok_ = relatorio('foto-pro', falhas, erros);
await b.close();
process.exit(ok_ ? 0 : 1);
