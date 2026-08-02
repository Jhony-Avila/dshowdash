// testes/shell-f3d.mjs — AS5 §67: drawer de detalhes do asset (pendência F3).
import { SAIDA, abrir, irParaHarness, relatorio } from './navegador.mjs';

const { navegador: b, pagina: p, erros } = await abrir({
  viewport: { width: 1500, height: 940 },
  init: () => { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true })); },
});
await irParaHarness(p, 'avst-harness.html', 1200);

const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };
const svgPalco = () => p.locator('.avst5-palco svg').evaluate((el) => el.innerHTML);

// abre o drawer pelo ⓘ do primeiro card real de Cabelo
await p.evaluate(() => { [...document.querySelectorAll('.avst5-cat')].find((x) => x.textContent.includes('Cabelo'))?.click(); });
await p.waitForTimeout(600);
await p.evaluate(() => {
  const card = [...document.querySelectorAll('.avst5-painel .avst-card')]
    .find((c) => !c.className.includes('avst-card-nenhum') && !c.className.includes('avst-card-ativo'));
  card?.querySelector('.avst-card-info-btn')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
});
await p.waitForTimeout(500);
ok(await p.locator('[data-teste="drawer-detalhe"]').count() === 1, 'drawer §67 não abriu');
const nome = await p.locator('.avst5-det-cab strong').textContent();
ok(Boolean(nome && nome.length > 2), 'nome do item ausente no drawer');
ok(await p.locator('.avst5-det-hero svg').count() === 1, 'hero visual ausente');
ok(((await p.locator('.avst5-det-lore').textContent()) ?? '').length > 10, 'lore/descrição ausente');
ok(await p.locator('.avst5-det-rar').count() === 1, 'raridade ausente');

// Experimentar (segurar) = preview no palco; soltar restaura
const antes = await svgPalco();
await p.locator('.avst5-det-acoes button', { hasText: 'Experimentar' }).dispatchEvent('pointerdown');
await p.waitForTimeout(400);
ok((await svgPalco()) !== antes, 'Experimentar não mostrou o preview no palco');
await p.locator('.avst5-det-acoes button', { hasText: 'Experimentar' }).dispatchEvent('pointerup');
await p.waitForTimeout(400);
ok((await svgPalco()) === antes, 'soltar Experimentar não restaurou o palco');

// Salvar preset a partir do drawer → aparece na aba Presets
await p.locator('.avst5-det-acoes button', { hasText: 'Salvar preset' }).click();
await p.waitForTimeout(300);
ok((await p.locator('.avst5-det-acoes button', { hasText: 'Preset salvo' }).count()) === 1, 'Salvar preset não confirmou');

// relacionados navegam DENTRO do drawer
const nRel = await p.locator('.avst5-det-rel-lista button').count();
if (nRel > 0) {
  const nomeAntes = await p.locator('.avst5-det-cab strong').textContent();
  await p.locator('.avst5-det-rel-lista button').first().click();
  await p.waitForTimeout(400);
  ok((await p.locator('.avst5-det-cab strong').textContent()) !== nomeAntes, 'relacionado não trocou o item do drawer');
}
await p.screenshot({ path: `${SAIDA}/f3d-drawer.png` });

// Equipar fecha o drawer e aplica (vira alteração)
await p.locator('.avst5-det-acoes button', { hasText: 'Equipar' }).click();
await p.waitForTimeout(500);
ok(await p.locator('[data-teste="drawer-detalhe"]').count() === 0, 'Equipar deveria fechar o drawer');
ok((await p.locator('.avst5-salvar').textContent())?.includes('alteraç'), 'Equipar do drawer não virou alteração');
// preset salvo aparece na biblioteca
await p.locator('.avst5-abas button', { hasText: 'Presets' }).click();
await p.waitForTimeout(400);
ok((await p.locator('[data-teste="preset"]').count()) >= 1, 'preset salvo do drawer não está na biblioteca');

const ok_ = relatorio('shell-f3d', falhas, erros);
await b.close();
process.exit(ok_ ? 0 : 1);
