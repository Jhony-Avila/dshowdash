// testes/cms-ro2.mjs — lote 1181–1190 (decisão #120, flag as6.cms_ro2):
// CMS READ-ONLY fase 2 (AS6 Parte 15) — busca, detalhe e export CSV.
//   A) endpoint: php -l + prova estática (busca/categoria/detalhe
//      sanitizados por whitelist; segue GET-only sem escrita).
//   B) flag ON (mock de dados via wrap do fetch do harness): busca
//      envia &busca= e filtra; clicar numa linha abre a FICHA; export
//      CSV baixa .csv com cabeçalho e linhas.
//   C) rollback §651: flag OFF = drawer do #108 (sem busca/CSV/ficha).
// @version 1.0.0  @created 2026-08-09
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { abrir, irParaHarness } from './navegador.mjs';

const RAIZ = resolve(import.meta.dirname, '..', '..', '..');
const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };

// ── A) endpoint ─────────────────────────────────────────────────────
execSync(`php -l "${join(RAIZ, 'api', 'avatar', 'cms.php')}"`, { stdio: 'pipe' });
const php = readFileSync(join(RAIZ, 'api', 'avatar', 'cms.php'), 'utf8');
ok(php.includes("preg_match('/^[\\p{L}\\p{N} _\\-\\.]{1,40}$/u', $busca)"), 'busca sem whitelist no endpoint');
ok(php.includes("listar === 'detalhe'") && php.includes('NAO_ENCONTRADO'), 'detalhe ausente do endpoint');
ok(!/INSERT|UPDATE|DELETE|REPLACE/i.test(php.replace(/\/\*[\s\S]*?\*\//g, '')), 'cms.php ganhou escrita (proibido)');

const DADOS = Array.from({ length: 5 }, (_, i) => ({
  id: i + 1, key: `asset_${i + 1}`, name: i === 2 ? 'Capacete Neon' : `Item ${i + 1}`,
  asset_type: 'svg_layer', status: 'published', categoria: 'acessorio', raridade: 'comum',
}));

const ligarMock = (p) => p.evaluate((dados) => {
  const antigo = window.fetch;
  window.fetch = (u, o) => {
    const s = String(u instanceof Request ? u.url : u);
    if (s.includes('/api/avatar/cms.php')) {
      const url = new URL(s, location.origin);
      const busca = (url.searchParams.get('busca') ?? '').toLowerCase();
      const itens = dados.filter((d) => !busca || d.name.toLowerCase().includes(busca) || d.key.includes(busca));
      return Promise.resolve(new Response(JSON.stringify({ ok: true, data: { itens, total: itens.length } }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
    }
    return antigo(u, o);
  };
}, DADOS);

const abrirCms = async (p) => {
  await p.keyboard.press('Control+k');
  await p.waitForTimeout(400);
  await p.keyboard.type('CMS');
  await p.waitForTimeout(300);
  await p.keyboard.press('Enter');
  await p.waitForTimeout(800);
};

// ── B) flag ON ──────────────────────────────────────────────────────
{
  const { navegador: b, pagina: p, erros } = await abrir({
    viewport: { width: 1500, height: 940 },
    init: () => {
      localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true, 'as6.dock_inferior': false, 'as5.palco3d': false }));
      // captura downloads (CSV) sem depender do gerenciador do navegador
      window.__dl = null;
      const clickReal = HTMLAnchorElement.prototype.click;
      HTMLAnchorElement.prototype.click = function () {
        if (this.download) { window.__dl = { nome: this.download, href: this.href }; return; }
        return clickReal.call(this);
      };
    },
  });
  try {
    await irParaHarness(p, 'avst-harness.html', 1200);
    await ligarMock(p);
    await abrirCms(p);
    ok(await p.locator('[data-teste="cms-tabela"]').count() === 1, 'tabela não veio com o mock');
    ok(await p.locator('[data-teste="cms-linha"]').count() === 5, 'esperava 5 linhas');
    // busca filtra via &busca=
    await p.locator('[data-teste="cms-busca"] input').fill('neon');
    await p.waitForTimeout(700);
    ok(await p.locator('[data-teste="cms-linha"]').count() === 1, 'busca não filtrou p/ 1 linha');
    // ficha de detalhe
    await p.locator('[data-teste="cms-linha"]').first().click();
    await p.waitForTimeout(300);
    ok(await p.locator('[data-teste="cms-detalhe"]').count() === 1, 'ficha de detalhe não abriu');
    ok(await p.evaluate(() => document.querySelector('[data-teste="cms-detalhe"]')?.textContent?.includes('Capacete Neon')), 'ficha sem o asset clicado');
    await p.locator('[data-teste="cms-detalhe-fechar"]').click();
    await p.waitForTimeout(200);
    ok(await p.locator('[data-teste="cms-detalhe"]').count() === 0, 'ficha não fechou');
    // export CSV
    await p.locator('[data-teste="cms-csv"]').click();
    await p.waitForTimeout(300);
    const dl = await p.evaluate(() => window.__dl);
    ok(!!dl && dl.nome.endsWith('.csv'), `export não baixou .csv (${JSON.stringify(dl?.nome)})`);
    const csv = dl ? decodeURIComponent(dl.href.split(',')[1] ?? '') : '';
    ok(csv.startsWith('id;key;name') && csv.includes('Capacete Neon'), 'CSV sem cabeçalho/linhas esperados');
    ok(erros.length === 0, `erros de página (ON): ${erros.join(' | ')}`);
  } catch (e) { falhas.push(`exceção (ON): ${e.message}`); }
  await b.close();
}

// ── C) rollback §651 ────────────────────────────────────────────────
{
  const { navegador: b, pagina: p } = await abrir({
    viewport: { width: 1500, height: 940 },
    init: () => { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true, 'as6.dock_inferior': false, 'as5.palco3d': false, 'as6.cms_ro2': false })); },
  });
  try {
    await irParaHarness(p, 'avst-harness.html', 1200);
    await ligarMock(p);
    await abrirCms(p);
    ok(await p.locator('[data-teste="cms-busca"]').count() === 0, 'flag OFF ainda mostra busca');
    ok(await p.locator('[data-teste="cms-csv"]').count() === 0, 'flag OFF ainda mostra CSV');
    await p.locator('[data-teste="cms-linha"]').first().click();
    await p.waitForTimeout(300);
    ok(await p.locator('[data-teste="cms-detalhe"]').count() === 0, 'flag OFF ainda abre ficha');
  } catch (e) { falhas.push(`exceção (OFF): ${e.message}`); }
  await b.close();
}

if (falhas.length) { console.error('[cms-ro2] FALHAS:\n- ' + falhas.join('\n- ')); process.exit(1); }
console.log('[cms-ro2] FALHAS: nenhuma');
console.log('[cms-ro2] ERROS JS: nenhum');
