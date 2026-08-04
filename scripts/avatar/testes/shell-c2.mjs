// testes/shell-c2.mjs — AS5 F3 C2: chips por slot (§68.3), resumo (§68.2),
// propriedades por asset (§71: sliders de aura/emblema com preview e undo).
import { SAIDA, abrir, irParaHarness, relatorio } from './navegador.mjs';

const { navegador: b, pagina: p, erros } = await abrir({
  viewport: { width: 1500, height: 940 },
  init: () => { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true })); },
});
await irParaHarness(p, 'avst-harness.html', 1200);

const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };
const svgPalco = () => p.locator('.avst5-palco svg').evaluate((el) => el.innerHTML);

// §68.2/§68.3: categoria Acessórios mostra resumo + chips; chip filtra a grade
await p.evaluate(() => { [...document.querySelectorAll('.avst5-cat')].find((x) => x.textContent.includes('Acess'))?.click(); });
await p.waitForTimeout(700);
ok(await p.locator('.avst5-chips .avst5-chip').count() === 4, 'deveria haver 4 chips de slot');
ok(await p.locator('[data-teste="resumo-acessorios"]').count() === 1, 'resumo §68.2 ausente');
const totalTodos = await p.locator('.avst5-painel .avst-card').count();
await p.locator('.avst5-chip', { hasText: 'Rosto' }).click();
await p.waitForTimeout(500);
const totalRosto = await p.locator('.avst5-painel .avst-card').count();
ok(totalRosto > 0 && totalRosto < totalTodos, `chip Rosto não filtrou (${totalRosto}/${totalTodos})`);
// equipar um item de rosto atualiza o resumo
await p.evaluate(() => {
  const c = [...document.querySelectorAll('.avst5-painel .avst-card')].find((x) => !x.className.includes('avst-card-ativo') && !x.className.includes('avst-card-bloqueado') && !x.className.includes('avst-card-nenhum'));
  c?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
});
await p.waitForTimeout(500);
if (await p.locator('.avst5-modal').count()) { // slot já ocupado no seed → confirmar
  await p.locator('.avst5-modal button', { hasText: 'substituir' }).click();
  await p.waitForTimeout(400);
}
ok((await p.locator('[data-teste="resumo-acessorios"]').textContent())?.includes('equipado'),
  'resumo não refletiu o acessório equipado');
await p.screenshot({ path: `${SAIDA}/c2-chips.png` });

// §71: aura equipada expõe sliders; arrastar = preview; soltar = comando c/ undo
await p.evaluate(() => { [...document.querySelectorAll('.avst5-cat')].find((x) => x.textContent.trim().endsWith('Aura'))?.click(); });
await p.waitForTimeout(600);
await p.evaluate(() => {
  const c = [...document.querySelectorAll('.avst5-painel .avst-card')].find((x) => !x.className.includes('avst-card-ativo') && !x.className.includes('avst-card-bloqueado') && !x.className.includes('avst-card-nenhum'));
  c?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
});
await p.waitForTimeout(600);
await p.locator('.avst5-painel-topo button[title="Cores e propriedades"]').click();
await p.waitForTimeout(500);
ok(await p.locator('.avst5-props .avst5-slider').count() >= 2, 'sliders da aura ausentes');

const antesSlider = await svgPalco();
ok(!antesSlider.includes('opacity="0.5"><g'), 'palco já tinha wrapper de intensidade antes do slider');
// mover o slider de INTENSIDADE para 0.5 (change = preview; pointerup = commit)
// (megas 72–74: o painel agora tem MAIS grupos de props — mirar pelo rótulo)
await p.locator('.avst5-props .avst5-slider', { hasText: 'Intensidade' }).first()
  .locator('input[type="range"]').evaluate((el) => {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
  setter.call(el, '0.5');
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  el.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
});
await p.waitForTimeout(500);
const depoisSlider = await svgPalco();
ok(depoisSlider.includes('opacity="0.5"'), 'commit do slider não aplicou a intensidade no SVG');
ok((await p.locator('.avst5-salvar').textContent())?.includes('alteraç'), 'commit deveria marcar alterações pendentes');
// undo remove a propriedade (comando com inverso)
await p.keyboard.press('Control+z');
await p.waitForTimeout(500);
ok(!(await svgPalco()).includes('opacity="0.5"'), 'undo não reverteu a propriedade');
await p.keyboard.press('Control+Shift+Z');
await p.waitForTimeout(500);
ok((await svgPalco()).includes('opacity="0.5"'), 'redo não reaplicou a propriedade');

// Restaurar padrão limpa params (megas 72–74: pode haver vários grupos —
// restaura TODOS p/ garantir que a aura volta)
for (const btn of await p.locator('.avst5-props-reset').all()) await btn.click();
await p.waitForTimeout(500);
ok(!(await svgPalco()).includes('opacity="0.5"'), 'Restaurar não voltou ao padrão');
await p.screenshot({ path: `${SAIDA}/c2-propriedades.png` });

const ok_ = relatorio('shell-c2', falhas, erros);
await b.close();
process.exit(ok_ ? 0 : 1);
