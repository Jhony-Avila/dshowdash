// testes/shell-telemetria.mjs — mega 46: viewer LOCAL de telemetria (§290)
// atrás da flag as5.telemetria_painel; aberto pela paleta §566; lista viva,
// export JSON e limpar. Sem a flag, o comando nem aparece.
// @version 1.0.0  @created 2026-08-04
import { SAIDA, abrir, irParaHarness, relatorio } from './navegador.mjs';

const { navegador: b, pagina: p, erros } = await abrir({
  viewport: { width: 1500, height: 940 },
  init: () => {
    localStorage.setItem('dshow.avst.flags.v1',
      JSON.stringify({ 'as5.novo_shell': true, 'as6.dock_inferior': false, 'as5.telemetria_painel': true }));
  },
});
await irParaHarness(p, 'avst-harness.html', 1000);

const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };

// gera eventos: liga/desliga o som (som_alternou §290)
await p.locator('[data-teste="som-toggle"]').click();
await p.waitForTimeout(200);
await p.locator('[data-teste="som-toggle"]').click();
await p.waitForTimeout(200);

// R1: paleta → "Telemetria local (dev)" abre o viewer com eventos
await p.keyboard.press('Control+k');
await p.waitForSelector('[data-teste="paleta-comandos"]', { timeout: 5000 });
await p.locator('[data-teste="paleta-comandos"] input').fill('telemetria');
await p.waitForTimeout(300);
await p.keyboard.press('Enter');
await p.waitForSelector('[data-teste="telemetria-dev"]', { timeout: 5000 });
const itens = await p.locator('[data-teste="tlm-lista"] li').count();
ok(itens >= 1, `viewer deveria listar eventos (${itens})`);
await p.screenshot({ path: `${SAIDA}/telemetria-dev.png` });

// R2: export JSON — intercepta e parseia (array com evento/em)
const exportado = await p.evaluate(async () => {
  const original = HTMLAnchorElement.prototype.click;
  let pego = null;
  HTMLAnchorElement.prototype.click = function () { pego = { href: this.href, nome: this.download }; };
  document.querySelector('[data-teste="tlm-exportar"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  for (let i = 0; i < 50 && !pego; i += 1) await new Promise((r) => setTimeout(r, 100));
  HTMLAnchorElement.prototype.click = original;
  if (!pego) return null;
  const corpo = JSON.parse(await fetch(pego.href).then((r) => r.text()));
  return { nome: pego.nome, n: corpo.length, temForma: corpo.every((e) => e.evento && e.em) };
});
ok((exportado?.n ?? 0) >= 1 && exportado?.temForma === true, 'export da telemetria sem a forma esperada');
ok(/^dshow-telemetria-.+\.json$/.test(exportado?.nome ?? ''), `nome do export inesperado (${exportado?.nome})`);

// R3: limpar zera a lista
await p.locator('[data-teste="tlm-limpar"]').click();
await p.waitForTimeout(300);
ok(await p.locator('[data-teste="tlm-lista"] li').count() === 0, 'limpar não zerou a lista');
await p.keyboard.press('Escape');
await p.waitForTimeout(300);
ok(await p.locator('[data-teste="telemetria-dev"]').count() === 0, 'Esc não fechou o viewer');

// R4: SEM a flag, o comando não existe na paleta (fail-safe OFF)
const ctx2 = await b.newContext({ viewport: { width: 1500, height: 940 } });
await ctx2.addInitScript(() => {
  localStorage.setItem('dshow.avst5.tour.v1', 'feito');
  localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true, 'as6.dock_inferior': false }));
});
const p2 = await ctx2.newPage();
await p2.goto('http://127.0.0.1:8901/avst-harness.html', { waitUntil: 'networkidle' });
await p2.waitForFunction(() => window.__pronto === true, { timeout: 20000 });
await p2.keyboard.press('Control+k');
await p2.waitForSelector('[data-teste="paleta-comandos"]', { timeout: 5000 });
await p2.locator('[data-teste="paleta-comandos"] input').fill('telemetria');
await p2.waitForTimeout(300);
ok(await p2.locator('[data-teste="paleta-comandos"] li button', { hasText: 'Telemetria' }).count() === 0,
  'comando de telemetria deveria sumir sem a flag');

const ok_ = relatorio('shell-telemetria', falhas, erros);
await b.close();
process.exit(ok_ ? 0 : 1);
