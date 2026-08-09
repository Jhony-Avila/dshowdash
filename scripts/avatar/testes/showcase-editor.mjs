// testes/showcase-editor.mjs — LOTE 221–230, megas 226–227: EDITOR DE
// SHOWCASE (§175) + modo automático (§175.1). Cobre:
//  1) flag as5.showcase_editor liga o chip "Showcase" e o painel;
//  2) clipes viram sequência ordenada (1·, 2·…) com teto de 4;
//  3) "Montar pra mim" (§175.1) é DETERMINÍSTICO por regras — avatar
//     sóbrio (sem aura/título raro) monta apresentação calma (3.2s,
//     luz de estúdio) e o resultado é o MESMO nas duas chamadas;
//  4) Tocar roda o showcase com o roteiro (data-apresentando) e ao fim
//     restaura luz/fundo do palco;
//  5) Salvar persiste (localStorage v1) e excluir remove.
// SwiftShader: esperas generosas (padrão dos testes do palco 3D).
import { SAIDA, abrir, irParaHarness } from './navegador.mjs';

const { navegador: b, pagina: p, erros } = await abrir({
  viewport: { width: 1500, height: 940 }, webgl: true,
  init: () => {
    localStorage.setItem('dshow.avst.flags.v1',
      JSON.stringify({ 'as5.novo_shell': true, 'as6.dock_inferior': false, 'as5.palco3d': true }));
  },
});
await irParaHarness(p, 'avst-harness.html', 1200);

const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };

// liga o 3D e espera o palco pintar
await p.locator('[data-teste="botao-3d"]').click();
await p.waitForSelector('[data-teste="palco-3d"] canvas', { timeout: 30000 });
await p.waitForTimeout(4000);

// ── 1) chip + painel do editor ──
ok(await p.locator('[data-teste="p3d-editor"]').count() === 1, 'chip Showcase ausente (flag as5.showcase_editor?)');
await p.locator('[data-teste="p3d-editor"]').click();
ok(await p.locator('[data-teste="p3d-editor-painel"]').count() === 1, 'painel do editor não abriu');

// ── 2) clipes ordenados ──
const chipsClipes = p.locator('[data-teste="p3d-rot-clipes"] .avst5-p3d-chip');
ok(await chipsClipes.count() >= 2, 'painel sem os clipes do personagem');
await p.locator('[data-teste="p3d-rot-clipe-Wave"]').click();
await p.locator('[data-teste="p3d-rot-clipe-Idle"]').click();
ok((await p.locator('[data-teste="p3d-rot-clipe-Wave"]').textContent())?.startsWith('1·'), 'Wave deveria ser o clipe 1·');
ok((await p.locator('[data-teste="p3d-rot-clipe-Idle"]').textContent())?.startsWith('2·'), 'Idle deveria ser o clipe 2·');
await p.locator('[data-teste="p3d-rot-clipe-Wave"]').click(); // desmarca
ok((await p.locator('[data-teste="p3d-rot-clipe-Idle"]').textContent())?.startsWith('1·'), 'remover o 1º deveria promover o Idle a 1·');

// ── 3) §175.1: automático determinístico (avatar sóbrio → calmo) ──
await p.locator('[data-teste="p3d-rot-auto"]').click();
await p.waitForTimeout(200);
const estado1 = await p.evaluate(() => ({
  clipes: [...document.querySelectorAll('[data-teste="p3d-rot-clipes"] [aria-pressed="true"]')].map((x) => x.textContent.replace(/^\d· /, '')),
  duracao: document.querySelector('[data-teste="p3d-rot-duracao"]')?.value,
  luzEstudio: document.querySelector('[data-teste="p3d-rot-luz"] [aria-checked="true"]')?.textContent,
}));
ok(estado1.duracao === '3200', `avatar sóbrio deveria montar 3.2s/clipe (veio ${estado1.duracao})`);
ok(estado1.luzEstudio === 'Estúdio', `avatar sóbrio deveria montar luz de Estúdio (veio ${estado1.luzEstudio})`);
ok(estado1.clipes.length >= 1, 'automático não escolheu clipes');
await p.locator('[data-teste="p3d-rot-auto"]').click();
await p.waitForTimeout(200);
const estado2 = await p.evaluate(() => ({
  clipes: [...document.querySelectorAll('[data-teste="p3d-rot-clipes"] [aria-pressed="true"]')].map((x) => x.textContent.replace(/^\d· /, '')),
  duracao: document.querySelector('[data-teste="p3d-rot-duracao"]')?.value,
}));
ok(JSON.stringify(estado1.clipes) === JSON.stringify(estado2.clipes) && estado1.duracao === estado2.duracao,
  'duas montagens automáticas deveriam ser IDÊNTICAS (determinismo §175.1)');

// ── 4) Tocar roda o showcase e restaura a cena do palco ──
// duração mínima p/ o teste não arrastar + luz NEON durante (palco está em estúdio)
await p.locator('[data-teste="p3d-rot-duracao"]').evaluate((el) => {
  const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
  set.call(el, '1200'); el.dispatchEvent(new Event('input', { bubbles: true }));
});
await p.evaluate(() => {
  [...document.querySelectorAll('[data-teste="p3d-rot-luz"] .avst5-p3d-chip')].find((x) => x.textContent === 'Neon')?.click();
});
const luzPalcoAntes = await p.evaluate(() => document.querySelector('[data-teste="p3d-luzes"] [aria-checked="true"]')?.textContent);
await p.locator('[data-teste="p3d-rot-tocar"]').click();
await p.waitForTimeout(700);
const apresentou = await p.evaluate(() => document.querySelector('[data-teste="palco-3d"]')?.hasAttribute('data-apresentando'));
ok(apresentou === true, 'Tocar não iniciou o showcase (data-apresentando ausente)');
const luzDurante = await p.evaluate(() => document.querySelector('[data-teste="p3d-luzes"] [aria-checked="true"]')?.textContent);
ok(luzDurante === 'Neon', `luz do roteiro deveria valer DURANTE o showcase (veio ${luzDurante})`);
await p.waitForFunction(() => !document.querySelector('[data-teste="palco-3d"]')?.hasAttribute('data-apresentando'), { timeout: 30000 });
await p.waitForTimeout(400);
const luzDepois = await p.evaluate(() => document.querySelector('[data-teste="p3d-luzes"] [aria-checked="true"]')?.textContent);
ok(luzDepois === luzPalcoAntes, `luz do palco deveria RESTAURAR após o showcase (antes ${luzPalcoAntes}, depois ${luzDepois})`);
await p.screenshot({ path: `${SAIDA}/showcase-editor.png` });

// ── 5) salvar persiste + excluir remove ──
await p.locator('[data-teste="p3d-rot-salvar"]').click();
await p.waitForTimeout(300);
const salvo = await p.evaluate(() => localStorage.getItem('dshow.avst5.p3d.roteiros.v1') ?? '');
ok(salvo.includes('rot_'), 'roteiro salvo não persistiu no localStorage');
ok(await p.locator('[data-teste="p3d-rot-salvos"] .avst5-p3d-chip', { hasText: 'Roteiro 1' }).count() === 1, 'chip do roteiro salvo ausente');
await p.locator('[data-teste="p3d-rot-salvos"] .avst5-p3d-cena-x').first().click();
await p.waitForTimeout(300);
const aposExcluir = await p.evaluate(() => localStorage.getItem('dshow.avst5.p3d.roteiros.v1') ?? '[]');
ok(!aposExcluir.includes('rot_'), 'excluir não removeu o roteiro do storage');

ok(erros.length === 0, `erros de página: ${erros.join(' | ')}`);

await b.close();
if (falhas.length) { console.error('FALHAS showcase-editor:\n- ' + falhas.join('\n- ')); process.exit(1); }
console.log('showcase-editor OK');
