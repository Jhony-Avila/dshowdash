// testes/i18n-paineis.mjs — lote 521–530 (§296): i18n dos painéis.
//   • EN: filtros de Conquistas (All/Achieved/Pending), chips de hora/luz
//     do palco (Warm/Night/Auto), botões de Presets (Export ALL) — tudo
//     com PT canônico intocado por padrão
// @version 1.0.0  @created 2026-08-06
import { SAIDA, abrir, irParaHarness, relatorio } from './navegador.mjs';

const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };

// clássico: Conquistas em EN (idioma salvo antes)
const { navegador: b, pagina: p, erros } = await abrir({
  viewport: { width: 1500, height: 940 },
  init: () => { localStorage.setItem('dshow.avst5.idioma.v1', 'en'); },
});
try {
  await irParaHarness(p, 'avst-harness.html', 1200);
  await p.evaluate(() => { [...document.querySelectorAll('.avst-cat')].find((x) => x.textContent.trim() === 'Conquistas')?.click(); });
  await p.waitForSelector('[data-teste="conq-filtros"]', { timeout: 15000 });
  const filtros = await p.locator('[data-teste="conq-filtros"]').textContent();
  ok((filtros ?? '').includes('Achieved') && (filtros ?? '').includes('Pending'),
    `filtros de conquistas não traduziram: ${filtros}`);
} catch (e) { falhas.push(`exceção: ${e.message}`); }
await b.close();

// shell: palco em EN (hora/luz/Auto) + Presets
const { navegador: b2, pagina: p2, erros: erros2 } = await abrir({
  viewport: { width: 1500, height: 940 },
  init: () => {
    localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true }));
    localStorage.setItem('dshow.avst5.idioma.v1', 'en');
  },
});
try {
  await irParaHarness(p2, 'avst-harness.html', 1200);
  // Presets ANTES do modo studio (o drawer fecha no studio)
  await p2.evaluate(() => { [...document.querySelectorAll('button')].find((x) => x.textContent.trim() === 'Presets')?.click(); });
  await p2.waitForSelector('.avst5-presets', { timeout: 8000 });
  ok((await p2.locator('.avst5-presets').textContent())?.includes('Export ALL'),
    'Presets não traduziu Export ALL');
  await p2.locator('button[title*="Studio"]').first().click();
  await p2.waitForTimeout(500);
  const horas = await p2.locator('[data-teste="horas-2d"]').textContent();
  ok((horas ?? '').includes('Afternoon') && (horas ?? '').includes('Night'),
    `horas não traduziram: ${horas}`);
  ok(await p2.locator('[data-teste="luz-auto"]', { hasText: 'Auto' }).count() === 1, 'chip Auto sumiu em EN');
  await p2.screenshot({ path: `${SAIDA}/i18n-paineis.png` });
} catch (e) { falhas.push(`exceção no shell: ${e.message}`); }
await b2.close();

// PT canônico intocado (sem idioma salvo)
const { navegador: b3, pagina: p3, erros: erros3 } = await abrir({ viewport: { width: 1500, height: 940 } });
try {
  await irParaHarness(p3, 'avst-harness.html', 1200);
  await p3.evaluate(() => { [...document.querySelectorAll('.avst-cat')].find((x) => x.textContent.trim() === 'Conquistas')?.click(); });
  await p3.waitForSelector('[data-teste="conq-filtros"]', { timeout: 15000 });
  ok((await p3.locator('[data-teste="conq-filtros"]').textContent())?.includes('Conquistadas'),
    'PT canônico das conquistas mudou');
} catch (e) { falhas.push(`exceção no PT: ${e.message}`); }

const ok_ = relatorio('i18n-paineis', falhas, [...erros, ...erros2, ...erros3]);
await b3.close();
process.exit(ok_ ? 0 : 1);
