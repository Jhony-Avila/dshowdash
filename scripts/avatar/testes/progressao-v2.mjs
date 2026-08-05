// testes/progressao-v2.mjs — ONDA 231–260, LOTE 241–250 (§207–§231).
//  A) COLEÇÕES (§208/§209/§214, clássico): página com tags+criador,
//     GALERIA por item (estado explorado) e Experimentar segurando;
//  B) CONQUISTAS (§217/§218/§219/§221): tier no card, elo com a coleção
//     via recompensa, ordenação "mais difíceis" e painel Seus números;
//  C) ECONOMIA/ESTADO (§226–§228, shell): origem com coleção, badges de
//     estado, ARQUIVAR tira da grade padrão e "Só arquivados" mostra;
//  D) COMPARAÇÃO §231 (shell): diff agora inclui CORES e TÍTULO.
import { SAIDA, abrir, irParaHarness } from './navegador.mjs';

const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };

// ── A+B) modo CLÁSSICO: coleções + conquistas ──
{
  const { navegador: b, pagina: p, erros } = await abrir({ viewport: { width: 1500, height: 1100 } });
  await irParaHarness(p, 'avst-harness.html', 800);

  // A) coleções
  await p.evaluate(() => { [...document.querySelectorAll('.avst-cat')].find((x) => x.textContent.trim() === 'Coleções')?.click(); });
  await p.waitForTimeout(600);
  await p.locator('[data-teste="col-abrir"]').first().click();
  await p.waitForTimeout(500);
  ok(await p.locator('[data-teste="col-pagina"]').count() === 1, 'página da coleção não abriu');
  ok(await p.locator('[data-teste="col-tags"]').count() === 1, 'tags/criador §208 ausentes');
  ok((await p.locator('[data-teste="col-tags"] em').textContent()) === 'Dshow Originals', 'criador Dshow ausente');
  const nGaleria = await p.locator('[data-teste="col-galeria"] figure').count();
  ok(nGaleria >= 4, `galeria §214 deveria ter os itens da coleção (veio ${nGaleria})`);
  await p.locator('[data-teste="col-experimentar"]').dispatchEvent('pointerdown');
  await p.waitForTimeout(250);
  ok(await p.locator('[data-teste="col-experimenta"]').count() === 1, 'Experimentar (segurar) não abriu o destaque §209');
  await p.locator('[data-teste="col-experimentar"]').dispatchEvent('pointerup');
  await p.waitForTimeout(250);
  ok(await p.locator('[data-teste="col-experimenta"]').count() === 0, 'soltar não fechou o destaque');
  await p.screenshot({ path: `${SAIDA}/progressao-colecao.png` });

  // B) conquistas
  await p.evaluate(() => { [...document.querySelectorAll('.avst-cat')].find((x) => x.textContent.trim() === 'Conquistas')?.click(); });
  await p.waitForTimeout(700);
  ok(await p.locator('[data-teste="conq-tier"]').count() >= 3, 'tiers §217 ausentes nos cards');
  ok(await p.locator('[data-teste="conq-colecao"]').count() >= 1, 'elo conquista↔coleção §219 ausente');
  ok(await p.locator('[data-teste="conq-ordem"]').count() === 1, 'chips de ordenação §218 ausentes');
  await p.locator('[data-teste="ordem-dificeis"]').click();
  await p.waitForTimeout(400);
  const primeiro = await p.locator('[data-teste="conq-rank"] .avst-conquista').first().textContent();
  ok((primeiro ?? '').includes('Colecionador'), `mais difíceis deveria abrir com Colecionador 2/6 (veio ${(primeiro ?? '').slice(0, 40)})`);
  ok(await p.locator('[data-teste="conq-numeros"]').count() === 1, 'painel Seus números §221 ausente');
  ok(await p.locator('[data-teste="conq-numeros"] span[role="listitem"]').count() === 6, 'esperava 6 números §221');
  await p.screenshot({ path: `${SAIDA}/progressao-conquistas.png` });
  ok(erros.length === 0, `erros de página (clássico): ${erros.join(' | ')}`);
  await b.close();
}

// ── C+D) SHELL: economia/arquivar + comparação de presets ──
{
  const { navegador: b, pagina: p, erros } = await abrir({
    viewport: { width: 1500, height: 940 },
    init: () => {
      localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true, 'as5.palco3d': false }));
      // D) dois presets que diferem em COR e TÍTULO (camadas idênticas)
      const base = {
        formato: 'camadas', versao: 3, base: 'bas_classica',
        camadas: { cabelo: 'cab_curto', olhos: 'olh_padrao', boca: 'boc_sorriso', roupa: 'rou_camiseta', fundo: 'fun_estudio' },
        cores: { pele: '#e8b88a', cabelo: '#3b2a1d', roupa: '#3c6df0', destaque: '#7c5cff' },
      };
      localStorage.setItem('dshow.avst5.presets.v1', JSON.stringify([
        { id: 'pa', nome: 'Look A', tags: [], favorito: false, criadoEm: '2026-08-01T00:00:00Z', renderizador: '2d', config: { ...base, titulo: 'tit_estrategista' } },
        { id: 'pb', nome: 'Look B', tags: [], favorito: false, criadoEm: '2026-08-02T00:00:00Z', renderizador: '2d', config: { ...base, cores: { ...base.cores, destaque: '#39d98a' }, titulo: 'tit_pro_player' } },
      ]));
    },
  });
  await irParaHarness(p, 'avst-harness.html', 1000);

  // C) detalhe: estados + arquivar
  await p.evaluate(() => { [...document.querySelectorAll('.avst5-cat')].find((x) => x.textContent.includes('Fundo'))?.click(); });
  await p.waitForTimeout(500);
  const nomeArquivado = await p.evaluate(() => {
    const card = [...document.querySelectorAll('.avst5-painel .avst-card')]
      .find((c) => !c.className.includes('avst-card-nenhum') && !c.className.includes('avst-card-ativo'));
    const nome = card?.querySelector('.avst-card-nome')?.textContent ?? '';
    card?.querySelector('.avst-card-info-btn')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    return nome;
  });
  await p.waitForTimeout(500);
  ok(await p.locator('[data-teste="det-estados"]').count() === 1, 'badges de estado §228 ausentes');
  ok((await p.locator('[data-teste="det-economia"]').textContent())?.includes('Origem:'), 'linha de economia §226 ausente');
  await p.locator('[data-teste="det-arquivar"]').click();
  await p.waitForTimeout(300);
  ok((await p.locator('[data-teste="det-estados"]').textContent())?.includes('Arquivado'), 'badge Arquivado não apareceu');
  await p.locator('[data-teste="drawer-detalhe"] button[title="Fechar"]').click();
  await p.waitForTimeout(400);
  const aindaNaGrade = await p.evaluate((nome) =>
    [...document.querySelectorAll('.avst5-painel .avst-card .avst-card-nome')].some((x) => x.textContent === nome), nomeArquivado);
  ok(!aindaNaGrade, `item arquivado "${nomeArquivado}" deveria sumir da grade padrão (§228)`);
  await p.locator('.avst-fpop-abrir').click();
  await p.locator('[data-teste="filtro-arquivados"] input').check();
  await p.evaluate(() => document.querySelector('.avst-fpop-fundo')?.click());
  await p.waitForTimeout(400);
  const soEle = await p.evaluate((nome) =>
    [...document.querySelectorAll('.avst5-painel .avst-card .avst-card-nome')].map((x) => x.textContent).filter((x) => x === nome).length, nomeArquivado);
  ok(soEle === 1, '"Só arquivados" não mostrou o item arquivado');

  // D) comparação §231 com cores + título
  await p.evaluate(() => { [...document.querySelectorAll('.avst5-abas [role="tab"], .avst5-abas button')].find((x) => x.textContent.trim() === 'Presets')?.click(); });
  await p.waitForTimeout(600);
  await p.locator('[data-teste="preset-comparar"]').nth(0).click();
  await p.locator('[data-teste="preset-comparar"]').nth(1).click();
  await p.waitForTimeout(400);
  ok(await p.locator('[data-teste="presets-comparar"]').count() === 1, 'painel de comparação §231 não abriu');
  const difs = (await p.locator('[data-teste="presets-difs"]').textContent()) ?? '';
  ok(difs.includes('cor destaque'), `diff §231 sem a COR (veio: ${difs.slice(0, 80)})`);
  ok(difs.includes('título'), 'diff §231 sem o TÍTULO');
  await p.screenshot({ path: `${SAIDA}/progressao-comparar.png` });
  ok(erros.length === 0, `erros de página (shell): ${erros.join(' | ')}`);
  await b.close();
}

if (falhas.length) { console.error('FALHAS progressao-v2:\n- ' + falhas.join('\n- ')); process.exit(1); }
console.log('progressao-v2 OK');
