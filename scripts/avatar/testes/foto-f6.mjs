// testes/foto-f6.mjs — AS5 F6: templates do Photo Studio (§326/§327),
// exportação em escala (§368) e autosave do estilo (§362).
// Fluxo no App CLÁSSICO (flag off): aba Foto → upload PNG → Estilizar →
// template → asserções no preview SVG determinístico.
import { SAIDA, abrir, irParaHarness, relatorio } from './navegador.mjs';

const { navegador: b, pagina: p, erros } = await abrir({ viewport: { width: 1500, height: 940 } });
await irParaHarness(p, 'avst-harness.html', 1200);

const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };

// PNG 96×96 gerado em memória (sem asset externo)
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

// §326/§327 + lotes 211–260 (§344/§349): strip com os 17 templates +
// Limpar + Compor pra mim (mega 258) — todos são .avst-ft-template
ok(await p.locator('[data-teste="templates-foto"] .avst-ft-template').count() === 19,
  'esperava 17 templates + Limpar + Compor pra mim');
await p.locator('.avst-ft-template', { hasText: 'Cyber Profile' }).click();
await p.waitForTimeout(600);
const svg = await p.locator('.avst-ft-preview svg').evaluate((el) => el.outerHTML);
ok(svg.includes('4cd9e8'), 'template não aplicou a cor de destaque do Cyber Profile');
ok((await p.locator('.avst-foto-msg').textContent())?.includes('aplicado'), 'mensagem de aplicação ausente');
// chips refletem o template (fundo Synthwave marcado)
ok(await p.locator('.avst-ft-chip[aria-checked="true"]', { hasText: 'Synthwave' }).count() === 1,
  'chip do fundo não refletiu o template');

// §368: controles de exportação presentes (download real não roda headless)
ok(await p.locator('.avst-ft-escala select').count() === 1, 'seletor de escala ausente');
ok(await p.locator('button', { hasText: 'Baixar PNG' }).count() === 1, 'botão Baixar PNG ausente');
await p.screenshot({ path: `${SAIDA}/f6-template.png` });

// §362: autosave — sair e voltar ao modo estilizada RETOMA o estilo
await p.locator('button', { hasText: 'Cancelar' }).click();
await p.waitForTimeout(400);
await p.locator('input[type="file"]').first().setInputFiles({
  name: 'teste2.png', mimeType: 'image/png', buffer: Buffer.from(png, 'base64'),
});
await p.waitForTimeout(800);
await p.locator('button', { hasText: 'Estilizar' }).click();
await p.waitForTimeout(600);
ok((await p.locator('.avst-foto-msg').textContent() ?? '').includes('Retomamos'),
  'estilo anterior não foi retomado (§362)');
ok(await p.locator('.avst-ft-chip[aria-checked="true"]', { hasText: 'Synthwave' }).count() === 1,
  'autosave não restaurou o fundo do template');
// Limpar zera estilo E o rascunho salvo
await p.locator('.avst-ft-template-limpar').click();
await p.waitForTimeout(300);
ok(await p.locator('.avst-ft-chip[aria-checked="true"]', { hasText: 'Synthwave' }).count() === 0,
  'Limpar não zerou o estilo');

const ok_ = relatorio('foto-f6', falhas, erros);
await b.close();
process.exit(ok_ ? 0 : 1);
