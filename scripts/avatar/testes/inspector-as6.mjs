// testes/inspector-as6.mjs — lote 921–930 (decisão #94, flag
// as6.inspector): Inspector contextual (AS6 §181–§189).
//   A) flag ON (shell novo): botão de propriedades abre o INSPECTOR
//      schema-driven; grupos mudam com a categoria (§181/§182 — base sem
//      compatibilidade, roupa com); accordion de UM aberto (§185) com
//      memória persistida (§186); fechar tudo = compacto §188; ações
//      (favoritar/detalhes) funcionam; largura §187 alarga o painel.
//   B) rollback §651: flag OFF = seção Cores+Propriedades anterior,
//      sem [data-teste="inspector"] no DOM.
// @version 1.0.0  @created 2026-08-09
import { SAIDA, abrir, irParaHarness } from './navegador.mjs';

const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };

const irCategoria = async (p, nome) => {
  await p.evaluate((n) => { [...document.querySelectorAll('.avst5-cat')].find((x) => x.textContent.includes(n))?.click(); }, nome);
  await p.waitForTimeout(400);
};
const abrirPropriedades = async (p) => {
  await p.evaluate(() => { document.querySelector('button[title="Cores e propriedades"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
  await p.waitForTimeout(400);
};

// ── A) flag ON ──────────────────────────────────────────────────────
{
  const { navegador: b, pagina: p, erros } = await abrir({
    viewport: { width: 1500, height: 940 },
    init: () => { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true, 'as5.palco3d': false })); },
  });
  try {
    await irParaHarness(p, 'avst-harness.html', 1200);
    await abrirPropriedades(p);
    ok(await p.locator('[data-teste="inspector"]').count() === 1, 'inspector não montou com a flag ligada');
    // §181/§182: contexto — base NÃO tem compatibilidade; identidade tem item
    ok(await p.locator('[data-teste="insp-grupo-identidade"]').count() === 1, 'grupo identidade ausente (base)');
    ok(await p.locator('[data-teste="insp-grupo-compatibilidade"]').count() === 0,
      'base não deveria ter grupo de compatibilidade (§181)');
    ok((await p.locator('[data-teste="insp-corpo-identidade"]').textContent() ?? '').length > 3,
      'identidade aberta por padrão deveria mostrar o item equipado');
    // §189: primeiro uso = estado COMPLETO (todos os grupos abertos)
    ok(await p.locator('[data-teste="inspector"] [data-teste^="insp-corpo-"]').count() >= 3,
      'primeiro uso deveria abrir o inspector completo (§189)');
    // troca de categoria → schema muda (§182)
    await irCategoria(p, 'Roupa');
    ok(await p.locator('[data-teste="insp-grupo-compatibilidade"]').count() === 1,
      'roupa deveria ter grupo de compatibilidade (§182)');
    // §185: accordion de UM aberto — abrir Cores fecha Identidade
    await p.locator('[data-teste="insp-grupo-cores"]').click();
    await p.waitForTimeout(250);
    ok(await p.locator('[data-teste="insp-corpo-cores"]').count() === 1, 'grupo Cores não abriu');
    ok(await p.locator('[data-teste="insp-corpo-identidade"]').count() === 0,
      'accordion deveria fechar a Identidade ao abrir Cores (§185)');
    ok(await p.locator('[data-teste="insp-corpo-cores"] .avst-cores').count() === 1,
      'miolo de Cores (componente existente) deveria renderizar no grupo (§182)');
    // §186: memória — recarregar mantém Cores aberto
    await irParaHarness(p, 'avst-harness.html', 1200);
    await abrirPropriedades(p);
    ok(await p.locator('[data-teste="insp-corpo-cores"]').count() === 1,
      'grupo aberto não persistiu no reload (§186)');
    // §188: fechar tudo = compacto (só cabeçalhos)
    await p.locator('[data-teste="insp-grupo-cores"]').click();
    await p.waitForTimeout(250);
    ok(await p.locator('[data-teste="inspector"] [data-teste^="insp-corpo-"]').count() === 0,
      'fechar o grupo aberto deveria deixar o inspector compacto (§188)');
    // ações §183: detalhes abre o drawer do asset
    await p.locator('[data-teste="insp-grupo-acoes"]').click();
    await p.waitForTimeout(250);
    const nAcoes = await p.locator('[data-teste="insp-acoes-item"]').count();
    ok(nAcoes >= 1, 'ações deveriam listar o item equipado da categoria');
    await p.locator('[data-teste="insp-detalhes"]').first().click();
    await p.waitForTimeout(500);
    ok(await p.locator('[data-teste="drawer-detalhe"]').count() === 1, 'Detalhes não abriu o drawer do asset');
    await p.evaluate(() => { document.querySelector('.avst5-detalhe button[title="Fechar"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    await p.waitForTimeout(300);
    ok(await p.locator('[data-teste="drawer-detalhe"]').count() === 0, 'drawer do asset não fechou');
    // favoritar alterna
    const antes = await p.locator('[data-teste="insp-fav"]').first().getAttribute('aria-pressed');
    await p.locator('[data-teste="insp-fav"]').first().click();
    await p.waitForTimeout(250);
    const depois = await p.locator('[data-teste="insp-fav"]').first().getAttribute('aria-pressed');
    ok(antes !== depois, 'Favoritar não alternou (aria-pressed)');
    // §187: largura — o painel direito alarga (var --avst5-dir = 560px)
    await p.locator('[data-teste="insp-largura"]').click();
    await p.waitForTimeout(250);
    const dir = await p.evaluate(() => document.querySelector('.avst5-shell')?.style.getPropertyValue('--avst5-dir'));
    ok(dir === '560px', `largura §187 não aplicou (veio "${dir}")`);
    await p.screenshot({ path: `${SAIDA}/inspector-as6.png` });
    ok(erros.length === 0, `erros de página (ON): ${erros.join(' | ')}`);
  } catch (e) { falhas.push(`exceção (ON): ${e.message}`); }
  await b.close();
}

// ── B) rollback §651 ────────────────────────────────────────────────
{
  const { navegador: b, pagina: p, erros } = await abrir({
    viewport: { width: 1500, height: 940 },
    init: () => { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true, 'as5.palco3d': false, 'as6.inspector': false })); },
  });
  try {
    await irParaHarness(p, 'avst-harness.html', 1200);
    await abrirPropriedades(p);
    ok(await p.locator('[data-teste="inspector"]').count() === 0, 'flag OFF ainda montou o inspector (§651)');
    ok(await p.locator('.avst5-propriedades .avst-cores').count() === 1,
      'flag OFF deveria voltar à seção Cores+Propriedades anterior');
    ok(erros.length === 0, `erros de página (OFF): ${erros.join(' | ')}`);
  } catch (e) { falhas.push(`exceção (OFF): ${e.message}`); }
  await b.close();
}

if (falhas.length) { console.error('[inspector-as6] FALHAS:\n- ' + falhas.join('\n- ')); process.exit(1); }
console.log('[inspector-as6] FALHAS: nenhuma');
console.log('[inspector-as6] ERROS JS: nenhum');
