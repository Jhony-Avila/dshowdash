// testes/home-compacto.mjs — Home §26.1 (densidade) + regressão dos harnesses gerados.
import { BASE, SAIDA, abrir, abrirAba3d, fotografarCanvas, irParaHarness, relatorio } from './navegador.mjs';

const { navegador: b, pagina: p, erros } = await abrir({ viewport: { width: 1440, height: 1000 }, webgl: false });

const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };

// ── harness da Home (gerado pelo script novo) ──
await irParaHarness(p, 'ger-harness.html', 1200);

const padAntes = await p.locator('.ger-sec').first().evaluate((el) => getComputedStyle(el).paddingTop);
ok(await p.locator('[data-densidade="conforto"]').count() === 1, 'densidade padrão deveria ser conforto');

await p.locator('.ger-periodos[aria-label="Densidade"] button', { hasText: 'Compacto' }).click();
await p.waitForTimeout(400);
ok(await p.locator('[data-densidade="compacto"]').count() === 1, 'data-densidade não virou compacto');
const padDepois = await p.locator('.ger-sec').first().evaluate((el) => getComputedStyle(el).paddingTop);
ok(parseFloat(padDepois) < parseFloat(padAntes), `padding deveria encolher (${padAntes} → ${padDepois})`);
await p.screenshot({ path: `${SAIDA}/cp1-compacto.png` });

// persiste no reload
await p.reload({ waitUntil: 'networkidle' });
await p.waitForFunction(() => window.__pronto === true, { timeout: 20000 });
await p.waitForTimeout(800);
ok(await p.locator('[data-densidade="compacto"]').count() === 1, 'compacto não persistiu no reload');
await p.locator('.ger-periodos[aria-label="Densidade"] button', { hasText: 'Conforto' }).click();

// ── regressão: harness do Avatar Studio gerado pelo script ──
await irParaHarness(p, 'avst-harness.html', 1000);
ok(await p.locator('nav.avst-categorias button.avst-cat').count() > 5, 'estúdio 2D não montou pelo harness gerado');
const temEstilo = await p.locator('nav.avst-categorias').evaluate((el) => getComputedStyle(el).display !== 'inline');
ok(temEstilo, 'CSS do avatar não carregou (harness sem estilo)');

const ok_ = relatorio('home-compacto', falhas, erros);
await b.close();
process.exit(ok_ ? 0 : 1);
