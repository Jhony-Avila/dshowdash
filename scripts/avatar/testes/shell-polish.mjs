// testes/shell-polish.mjs — polimento AS5: temas §590, dashboard §574 e
// gatilho de brilho ao equipar épico+ §158 (Motion System §285).
// @version 1.0.0  @created 2026-08-03
// (Confete ao SALVAR §158 fica na validação visual: o harness é offline.)
import { SAIDA, abrir, irParaHarness, relatorio } from './navegador.mjs';

const { navegador: b, pagina: p, erros } = await abrir({
  viewport: { width: 1500, height: 940 },
  init: () => { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true, 'as6.dock_inferior': false })); },
});
await irParaHarness(p, 'avst-harness.html', 1200);

const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };
const acento = () => p.locator('.avst5-shell').evaluate((el) => getComputedStyle(el).getPropertyValue('--avst-acento').trim());

// §590 R1: 4 bolinhas, roxo padrão; trocar p/ verde muda a var CSS
ok(await p.locator('.avst5-temas .avst5-tema-bolinha').count() === 4, 'esperava 4 temas');
const acentoAntes = await acento();
await p.locator('.avst5-temas .avst5-tema-bolinha').nth(1).click(); // verde
await p.waitForTimeout(400);
const acentoVerde = await acento();
ok(acentoVerde !== acentoAntes, 'trocar tema não mudou --avst-acento');
ok(acentoVerde.toLowerCase() === '#39d98a', `tema verde deveria ser #39d98a (${acentoVerde})`);
await p.screenshot({ path: `${SAIDA}/polish-tema-verde.png` });

// §590 R2: persiste no reload
await p.reload({ waitUntil: 'networkidle' });
await p.waitForFunction(() => window.__pronto === true, { timeout: 20000 });
await p.waitForTimeout(1000);
ok((await acento()).toLowerCase() === '#39d98a', 'tema não persistiu no reload');

// §574: dashboard pessoal na aba Presets com 4 chips e números
await p.locator('.avst5-abas button', { hasText: 'Presets' }).click();
await p.waitForTimeout(500);
ok(await p.locator('[data-teste="dashboard-pessoal"]').count() === 1, 'dashboard §574 ausente');
const chips = await p.locator('[data-teste="dashboard-pessoal"] .avst5-dash-item').count();
ok(chips === 4, `esperava 4 chips no dashboard (tem ${chips})`);
const textoDash = await p.locator('[data-teste="dashboard-pessoal"]').textContent();
ok(/Nível \d+/.test(textoDash ?? ''), 'chip de nível sem número');

// §158 (equipar): item épico+ dispara brilho WAAPI no palco
await p.locator('.avst5-abas button', { hasText: 'Todos' }).click();
await p.evaluate(() => { [...document.querySelectorAll('.avst5-cat')].find((x) => x.textContent.includes('Cabelo'))?.click(); });
await p.waitForTimeout(700);
// acha um card ÉPICO+ ainda não equipado e clica; mede getAnimations no palco
const disparou = await p.evaluate(async () => {
  const cards = [...document.querySelectorAll('.avst5-painel .avst-card')]
    .filter((c) => ['epico', 'lendario', 'mitico', 'exclusivo'].includes(c.dataset.raridade ?? '')
      && !c.className.includes('avst-card-ativo') && !c.className.includes('avst-card-bloqueado')
      && c.dataset.teste !== 'card-adiado');
  const alvo = cards[0];
  if (!alvo) return { achou: false };
  alvo.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  await new Promise((r) => setTimeout(r, 120));
  const palco = document.querySelector('.avst5-palco');
  return { achou: true, anim: (palco?.getAnimations?.() ?? []).length };
});
ok(disparou.achou, 'não achei card épico+ desbloqueado p/ testar o §158');
ok((disparou.anim ?? 0) > 0, 'equipar épico+ não disparou animação no palco (§158)');

// contra-prova: item COMUM não dispara brilho
await p.waitForTimeout(1000); // brilho anterior termina (700ms)
const comum = await p.evaluate(async () => {
  const cards = [...document.querySelectorAll('.avst5-painel .avst-card')]
    .filter((c) => c.dataset.raridade === 'comum' && !c.className.includes('avst-card-ativo')
      && c.dataset.teste !== 'card-adiado');
  const alvo = cards[0];
  if (!alvo) return { achou: false };
  alvo.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  await new Promise((r) => setTimeout(r, 120));
  const palco = document.querySelector('.avst5-palco');
  return { achou: true, anim: (palco?.getAnimations?.() ?? []).length };
});
ok(comum.achou, 'não achei card comum p/ contra-prova');
ok((comum.anim ?? 1) === 0, 'item COMUM não deveria disparar brilho (§158)');
await p.screenshot({ path: `${SAIDA}/polish-brilho.png` });

const ok_ = relatorio('shell-polish', falhas, erros);
await b.close();
process.exit(ok_ ? 0 : 1);
