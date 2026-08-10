// testes/cobertura-1240.mjs — lote 1231–1240 (decisão #126, sem flag
// própria — doutrina #62): i18n EN + a11y dos módulos da onda
// 1121–1220.
//   A) i18n: em EN, o CMS fase 2 traduz busca/CSV e o botão da toolbar
//      vira "Scene".
//   B) a11y: Escape fecha a caixa do Cenário; Escape fecha o drawer de
//      propriedades da dock; no CMS, Escape fecha a FICHA antes do
//      drawer; linha do CMS é operável por Enter.
// @version 1.0.0  @created 2026-08-10
import { abrir, irParaHarness } from './navegador.mjs';

const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };

// ── A+B no shell novo ───────────────────────────────────────────────
{
  const { navegador: b, pagina: p, erros } = await abrir({
    viewport: { width: 1500, height: 940 },
    init: () => { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true })); },
  });
  try {
    await irParaHarness(p, 'avst-harness.html', 1200);
    // Escape fecha a caixa do Cenário
    await p.locator('[data-teste="cen-tool-abrir"]').click();
    await p.waitForTimeout(300);
    ok(await p.locator('[data-teste="cen-caixa"]').count() === 1, 'caixa do Cenário não abriu');
    await p.keyboard.press('Escape');
    await p.waitForTimeout(300);
    ok(await p.locator('[data-teste="cen-caixa"]').count() === 0, 'Escape não fechou a caixa do Cenário');
    // Escape fecha o drawer de propriedades da dock
    await p.locator('.avst5-painel-btn[title="Cores e propriedades"]').click();
    await p.waitForTimeout(400);
    ok(await p.locator('[data-teste="insp-drawer"]').count() === 1, 'drawer de propriedades não abriu');
    await p.keyboard.press('Escape');
    await p.waitForTimeout(300);
    ok(await p.locator('[data-teste="insp-drawer"]').count() === 0, 'Escape não fechou o drawer de propriedades');
    // i18n EN: botão da toolbar vira "Scene"
    await p.evaluate(() => {
      localStorage.setItem('dshow.avst5.idioma.v1', 'en');
      window.dispatchEvent(new CustomEvent('avst5:idioma'));
    });
    await p.reload({ waitUntil: 'networkidle' });
    await p.waitForFunction(() => window.__pronto === true, { timeout: 20000 });
    await p.waitForTimeout(800);
    const rotulo = await p.locator('[data-teste="cen-tool-abrir"]').textContent();
    ok((rotulo ?? '').includes('Scene'), `toolbar em EN deveria dizer Scene (veio "${rotulo?.trim()}")`);
    ok(erros.length === 0, `erros de página: ${erros.join(' | ')}`);
  } catch (e) { falhas.push(`exceção (shell): ${e.message}`); }
  await b.close();
}

// ── B no CMS (Escape aninhado + Enter na linha) ─────────────────────
{
  const { navegador: b, pagina: p } = await abrir({
    viewport: { width: 1500, height: 940 },
    init: () => {
      localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true, 'as6.dock_inferior': false, 'as5.palco3d': false }));
      localStorage.setItem('dshow.avst5.idioma.v1', 'en');
    },
  });
  try {
    await irParaHarness(p, 'avst-harness.html', 1200);
    await p.evaluate(() => {
      const antigo = window.fetch;
      window.fetch = (u, o) => {
        const s = String(u instanceof Request ? u.url : u);
        if (s.includes('/api/avatar/cms.php')) {
          return Promise.resolve(new Response(JSON.stringify({ ok: true, data: { itens: [{ id: 1, key: 'k', name: 'Item Um' }], total: 1 } }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
        }
        return antigo(u, o);
      };
    });
    await p.keyboard.press('Control+k');
    await p.waitForTimeout(400);
    await p.keyboard.type('CMS');
    await p.waitForTimeout(300);
    await p.keyboard.press('Enter');
    await p.waitForTimeout(800);
    // i18n EN: busca traduzida
    const ph = await p.locator('[data-teste="cms-busca"] input').getAttribute('placeholder');
    ok((ph ?? '').includes('Search'), `busca do CMS em EN (veio "${ph}")`);
    // Enter na linha abre a ficha; Escape fecha a FICHA e mantém o drawer
    await p.locator('[data-teste="cms-linha"]').first().focus();
    await p.keyboard.press('Enter');
    await p.waitForTimeout(300);
    ok(await p.locator('[data-teste="cms-detalhe"]').count() === 1, 'Enter na linha não abriu a ficha');
    await p.keyboard.press('Escape');
    await p.waitForTimeout(300);
    ok(await p.locator('[data-teste="cms-detalhe"]').count() === 0, 'Escape não fechou a ficha');
    ok(await p.locator('[data-teste="cms-ro"]').count() === 1, 'Escape da ficha fechou o drawer inteiro (deveria manter)');
    await p.keyboard.press('Escape');
    await p.waitForTimeout(300);
    ok(await p.locator('[data-teste="cms-ro"]').count() === 0, 'segundo Escape deveria fechar o drawer');
  } catch (e) { falhas.push(`exceção (cms): ${e.message}`); }
  await b.close();
}

if (falhas.length) { console.error('[cobertura-1240] FALHAS:\n- ' + falhas.join('\n- ')); process.exit(1); }
console.log('[cobertura-1240] FALHAS: nenhuma');
console.log('[cobertura-1240] ERROS JS: nenhum');
