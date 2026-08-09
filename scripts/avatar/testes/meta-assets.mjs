// testes/meta-assets.mjs — lote 891–900 (decisão #90, flag
// as6.meta_assets): METADADOS de asset (AS6 §150–§153/§227).
//   A) flag ON (shell novo): drawer de detalhes mostra a FICHA (autor/
//      origem/versão §151 + licença §152) e TAGS clicáveis (§227);
//      clicar numa tag fecha o drawer e dispara a busca `tag:<t>` na
//      grade; o operador tag: filtra de verdade (subconjunto próprio);
//   B) rollback §651: flag OFF = sem ficha/tags no drawer (byte a byte).
// @version 1.0.0  @created 2026-08-09
import { SAIDA, abrir, irParaHarness } from './navegador.mjs';

const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };

const irCategoria = async (p, nome) => {
  await p.evaluate((n) => { [...document.querySelectorAll('.avst5-cat')].find((x) => x.textContent.includes(n))?.click(); }, nome);
  await p.waitForTimeout(500);
};
const abrirDetalhe = async (p) => p.evaluate(() => {
  const card = [...document.querySelectorAll('.avst5-painel .avst-card')]
    .find((c) => !c.className.includes('avst-card-nenhum'));
  card?.querySelector('.avst-card-info-btn')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
});

// ── A) flag ON ──────────────────────────────────────────────────────
{
  const { navegador: b, pagina: p, erros } = await abrir({
    viewport: { width: 1500, height: 940 },
    init: () => { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true, 'as5.palco3d': false })); },
  });
  try {
    await irParaHarness(p, 'avst-harness.html', 1200);
    await irCategoria(p, 'Efeito');
    await abrirDetalhe(p);
    await p.waitForTimeout(500);
    // ficha §151/§152
    const ficha = await p.locator('[data-teste="det-metadados"]').textContent();
    ok(!!ficha && ficha.includes('Autor:'), 'ficha sem Autor (§151)');
    ok(!!ficha && ficha.includes('Origem:'), 'ficha sem Origem (§151)');
    ok(!!ficha && /v\d+\.\d+/.test(ficha), 'ficha sem versão (§151)');
    ok(!!ficha && ficha.includes('Licença:'), 'ficha sem Licença (§152)');
    // tags §227 — efeito tem tema+categoria+raridade+funcional+família ≥5
    const nTags = await p.locator('[data-teste="det-tag"]').count();
    ok(nTags >= 4, `poucas tags no drawer (${nTags})`);
    // clicar numa tag → drawer fecha + busca tag: aplicada na grade
    const tagTexto = (await p.locator('[data-teste="det-tag"]').first().textContent())?.replace('#', '') ?? '';
    await p.locator('[data-teste="det-tag"]').first().click();
    await p.waitForTimeout(500);
    ok(await p.locator('[data-teste="drawer-detalhe"]').count() === 0, 'drawer não fechou ao clicar na tag');
    const busca = await p.locator('input[aria-label="Buscar itens"]').inputValue();
    ok(busca === `tag:${tagTexto}`, `busca não recebeu a tag (esperava tag:${tagTexto}, veio "${busca}")`);
    ok(await p.locator('.avst5-painel .avst-card:not(.avst-card-nenhum)').count() >= 1,
      'busca por tag não devolveu nenhum item (a própria origem deveria casar)');
    // operador tag: filtra um SUBCONJUNTO PRÓPRIO (raridade épico)
    const filtro = await p.evaluate(() => {
      const input = document.querySelector('input[aria-label="Buscar itens"]');
      const setar = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      const contar = () => document.querySelectorAll('.avst5-painel .avst-card:not(.avst-card-nenhum)').length;
      setar.call(input, '');
      input.dispatchEvent(new Event('input', { bubbles: true }));
      return new Promise((res) => setTimeout(() => {
        const total = contar();
        setar.call(input, 'tag:epico');
        input.dispatchEvent(new Event('input', { bubbles: true }));
        setTimeout(() => res({ total, filtrado: contar() }), 350);
      }, 350));
    });
    ok(filtro.filtrado >= 1 && filtro.filtrado < filtro.total,
      `tag:epico deveria filtrar subconjunto próprio (${filtro.filtrado}/${filtro.total})`);
    await p.screenshot({ path: `${SAIDA}/meta-assets.png` });
    ok(erros.length === 0, `erros de página (ON): ${erros.join(' | ')}`);
  } catch (e) { falhas.push(`exceção (ON): ${e.message}`); }
  await b.close();
}

// ── B) rollback §651 ────────────────────────────────────────────────
{
  const { navegador: b, pagina: p, erros } = await abrir({
    viewport: { width: 1500, height: 940 },
    init: () => { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true, 'as5.palco3d': false, 'as6.meta_assets': false })); },
  });
  try {
    await irParaHarness(p, 'avst-harness.html', 1200);
    await irCategoria(p, 'Efeito');
    await abrirDetalhe(p);
    await p.waitForTimeout(500);
    ok(await p.locator('[data-teste="drawer-detalhe"]').count() === 1, 'drawer não abriu no cenário OFF');
    ok(await p.locator('[data-teste="det-metadados"]').count() === 0, 'flag OFF mas a ficha apareceu (§651)');
    ok(await p.locator('[data-teste="det-tag"]').count() === 0, 'flag OFF mas as tags apareceram (§651)');
    ok(erros.length === 0, `erros de página (OFF): ${erros.join(' | ')}`);
  } catch (e) { falhas.push(`exceção (OFF): ${e.message}`); }
  await b.close();
}

if (falhas.length) { console.error('FALHAS meta-assets:\n- ' + falhas.join('\n- ')); process.exit(1); }
console.log('meta-assets OK');
