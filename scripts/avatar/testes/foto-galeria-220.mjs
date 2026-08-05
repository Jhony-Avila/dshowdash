// testes/foto-galeria-220.mjs — LOTE 211–220: GALERIA de templates de foto
// (§326/§344/§349/§229). Cobre:
//  1) templates PRO novos carregam os campos da onda 161–200 no aplicar
//     (camadasFoto blend/opacidade + luz local + tipografia) — antes o
//     aplicarTemplate só levava camadas/cor/título;
//  2) troca de template SUBSTITUI a decoração (sem resíduo) e PRESERVA a
//     legenda do usuário;
//  3) filtro por categoria estreita a lista;
//  4) favoritar persiste (local-first) e o filtro "Favoritos" mostra;
//  5) destaque determinístico da semana (§251) marca UM template.
// Lição herdada (onda-200): a tipografia só entra no SVG quando há LEGENDA
// (o selo do título usa fonte fixa) — por isso o teste seta a legenda antes.
import { abrir, irParaHarness } from './navegador.mjs';

const { navegador: b, pagina: p, erros } = await abrir({ viewport: { width: 1500, height: 940 } });
await irParaHarness(p, 'avst-harness.html', 800);

const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };

// ── entra no Estilizar com foto sintética ──
await p.evaluate(() => { [...document.querySelectorAll('.avst-cat')].find((x) => x.textContent.trim() === 'Foto')?.click(); });
await p.waitForTimeout(600);
await p.evaluate(async () => {
  const c = document.createElement('canvas');
  c.width = 480; c.height = 480;
  const g = c.getContext('2d');
  g.fillStyle = '#39d98a'; g.fillRect(0, 0, 480, 480);
  const blob = await new Promise((r) => c.toBlob(r, 'image/png'));
  const dt = new DataTransfer();
  dt.items.add(new File([blob], 'galeria.png', { type: 'image/png' }));
  const input = document.querySelector('input[type="file"]');
  input.files = dt.files;
  input.dispatchEvent(new Event('change', { bubbles: true }));
});
await p.waitForSelector('.avst-foto-acoes', { timeout: 10000 });
await p.evaluate(() => { [...document.querySelectorAll('.avst-foto-acoes button')].find((x) => x.textContent.includes('Estilizar'))?.click(); });
await p.waitForSelector('[data-teste="ajustes-foto"]', { timeout: 10000 });
const svgDe = () => p.evaluate(() => document.querySelector('.avst-ft-preview svg')?.outerHTML ?? '');

// galeria ligada por padrão (flag as5.foto_galeria)
ok(await p.locator('[data-teste="templates-foto"]').count() === 1, 'grade de templates ausente');
ok(await p.locator('[data-teste="tpl-filtros"]').count() === 1, 'barra de filtros da galeria ausente (flag?)');
ok(await p.locator('[data-teste="tpl-tpl_neon_tokyo"]').count() === 1, 'template novo Neon Tokyo não apareceu');

// legenda do usuário ANTES do template (para a tipografia entrar no render)
await p.locator('[data-teste="legenda-foto"]').evaluate((el) => {
  const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
  set.call(el, 'Dshow'); el.dispatchEvent(new Event('input', { bubbles: true }));
});
await p.waitForTimeout(300);

// ── 1) aplica Neon Tokyo → campos ricos entram ──
await p.locator('[data-teste="tpl-tpl_neon_tokyo"] .avst-ft-template').click();
await p.waitForTimeout(400);
const rico = await svgDe();
ok(rico.includes('mix-blend-mode:screen'), 'camadasFoto (blend screen) do template não entrou no SVG');
ok(rico.includes('luz'), 'luz local do template não entrou no SVG');
ok(rico.includes('ui-monospace'), 'tipografia (mono) do template não entrou no SVG');
ok(rico.includes('Dshow'), 'legenda do usuário sumiu ao aplicar o template');

// ── 2) troca p/ Minimal Clean (simples) → decoração substituída, legenda mantida ──
await p.locator('[data-teste="tpl-tpl_minimal_clean"] .avst-ft-template').click();
await p.waitForTimeout(400);
const simples = await svgDe();
ok(!simples.includes('mix-blend-mode:screen'), 'resíduo de blend após trocar de template (§339 decoração deveria ser substituída)');
ok(!simples.includes('ui-monospace'), 'resíduo de tipografia após trocar de template');
ok(simples.includes('Dshow'), 'legenda do usuário deveria sobreviver à troca de template');

// ── 3) filtro por categoria estreita ──
await p.locator('[data-teste="tpl-filtro-cyber"]').click();
await p.waitForTimeout(250);
ok(await p.locator('[data-teste="tpl-tpl_neon_tokyo"]').count() === 1, 'filtro cyber escondeu o Neon Tokyo');
ok(await p.locator('[data-teste="tpl-tpl_minimal_clean"]').count() === 0, 'filtro cyber não escondeu o Minimal Clean');

// ── 4) favoritar persiste e filtro Favoritos mostra ──
await p.locator('[data-teste="tpl-filtro-todos"]').click();
await p.waitForTimeout(150);
await p.locator('[data-teste="tpl-fav-tpl_data_oracle"]').click();
await p.waitForTimeout(200);
const favSalvo = await p.evaluate(() => localStorage.getItem('dshow.avst5.foto.tpl.fav.v1') ?? '');
ok(favSalvo.includes('tpl_data_oracle'), 'favorito não persistiu no localStorage');
await p.locator('[data-teste="tpl-filtro-favoritos"]').click();
await p.waitForTimeout(200);
ok(await p.locator('[data-teste="tpl-tpl_data_oracle"]').count() === 1, 'filtro Favoritos não mostrou o item favoritado');
ok(await p.locator('[data-teste="tpl-tpl_neon_tokyo"]').count() === 0, 'filtro Favoritos mostrou um não-favorito');

// ── 5) destaque da semana marca EXATAMENTE um ──
await p.locator('[data-teste="tpl-filtro-todos"]').click();
await p.waitForTimeout(200);
const destaques = await p.evaluate(() => [...document.querySelectorAll('[data-teste="templates-foto"] .avst-ft-template small')].filter((s) => s.textContent.includes('da semana')).length);
ok(destaques === 1, `destaque da semana deveria marcar 1 template (marcou ${destaques})`);

ok(erros.length === 0, `erros de página: ${erros.join(' | ')}`);

await b.close();
if (falhas.length) { console.error('FALHAS foto-galeria-220:\n- ' + falhas.join('\n- ')); process.exit(1); }
console.log('foto-galeria-220 OK');
