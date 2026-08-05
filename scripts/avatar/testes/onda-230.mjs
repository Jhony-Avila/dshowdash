// testes/onda-230.mjs — LOTE 221–230, megas 228–230:
//  A) TIMELINE no shell (§220, flag as5.timeline_shell): botão no header,
//     drawer com marcos agrupados por mês, memória §246 exibida, badges de
//     missões e atalho "Gerenciar na Evolução";
//  B) FAVORITOS QUE CRESCEM (§229, flag as5.favoritos_categorias): sub-
//     filtros Todos/Rápidos/Permanentes/Por coleção na visão de favoritos,
//     permanente no TOPO da ordem padrão e agrupamento por coleção real;
//  C) MINHA VITRINE (§1076/§1077, flag as5.vitrine_pessoal): blocos com
//     reordenação ACESSÍVEL persistida + galerias locais de presets.
import { SAIDA, abrir, irParaHarness } from './navegador.mjs';

// ── A) TIMELINE no shell (§220) ─────────────────────────────────────
const { navegador: b1, pagina: p1, erros: erros1 } = await abrir({
  viewport: { width: 1500, height: 940 },
  init: () => {
    const cfg = {
      formato: 'camadas', versao: 3, base: 'bas_classica',
      camadas: { cabelo: 'cab_curto', olhos: 'olh_padrao', boca: 'boc_sorriso', roupa: 'rou_camiseta', fundo: 'fun_estudio' },
      cores: { pele: '#e8b88a', cabelo: '#3b2a1d', roupa: '#3c6df0', destaque: '#7c5cff' },
    };
    localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true, 'as5.palco3d': false }));
    localStorage.setItem('dshow.avst5.evolucao.v1', JSON.stringify([
      { id: 'evo_a', quando: 1751328000000, origem: 'primeiro', config: cfg },
      { id: 'evo_b', quando: 1754179200000, origem: 'salvo', config: cfg, nota: 'Look da China' },
    ]));
    localStorage.setItem('dshow.avst5.missoes.v1', JSON.stringify(['corporativo']));
  },
});
await irParaHarness(p1, 'avst-harness.html', 1000);

const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };

ok(await p1.locator('[data-teste="timeline-abrir"]').count() === 1, 'botão da timeline ausente (flag as5.timeline_shell?)');
await p1.locator('[data-teste="timeline-abrir"]').click();
await p1.waitForSelector('[data-teste="timeline-shell"]', { timeout: 8000 });
ok(await p1.locator('[data-teste="tl-mes"]').count() === 2, 'esperava 2 grupos de mês (jul + ago)');
ok(await p1.locator('[data-teste="tl-marco"]').count() === 2, 'esperava 2 marcos na linha do tempo');
const ordem = await p1.locator('[data-teste="tl-marco"] strong').allTextContents();
ok(ordem[0] === 'Salvamento' && ordem[1] === 'Primeiro avatar', `mais recente deveria vir primeiro (veio ${ordem.join(' | ')})`);
ok((await p1.locator('[data-teste="tl-nota"]').textContent())?.includes('Look da China'), 'memória §246 ausente na timeline');
ok(await p1.locator('[data-teste="tl-badges"] .avst-perfil-badge').count() === 1, 'badge de missão concluída ausente');
await p1.screenshot({ path: `${SAIDA}/timeline-shell.png` });
await p1.locator('[data-teste="tl-abrir-evolucao"]').click();
await p1.waitForSelector('[data-teste="evolucao"]', { timeout: 8000 });
ok(await p1.locator('[data-teste="timeline-shell"]').count() === 0, 'timeline deveria fechar ao abrir a Evolução');
ok(erros1.length === 0, `erros de página (timeline): ${erros1.join(' | ')}`);
await b1.close();

// ── B) FAVORITOS QUE CRESCEM (§229) — modo clássico ─────────────────
const { navegador: b2, pagina: p2, erros: erros2 } = await abrir({
  viewport: { width: 1500, height: 940 },
  init: () => {
    localStorage.setItem('dshow.avatar.favoritos.v1', JSON.stringify(['fun_circuito', 'fun_synthwave', 'fun_estudio']));
    localStorage.setItem('dshow.avst5.favoritos.permanentes.v1', JSON.stringify(['fun_circuito']));
  },
});
await irParaHarness(p2, 'avst-harness.html', 800);
await p2.evaluate(() => { [...document.querySelectorAll('.avst-cat')].find((x) => x.textContent.trim() === 'Fundo')?.click(); });
await p2.waitForTimeout(500);
// liga "Só favoritos" no popover de filtros
await p2.locator('.avst-fpop-abrir').click();
await p2.locator('.avst-fpop-opcao input[type="checkbox"]').first().check();
await p2.keyboard.press('Escape');
await p2.evaluate(() => document.querySelector('.avst-fpop-fundo')?.click());
await p2.waitForTimeout(400);
ok(await p2.locator('[data-teste="fav-categorias"]').count() === 1, 'sub-filtros §229 ausentes na visão de favoritos');
const cards = () => p2.locator('.avst-grade [role="option"]').count();
ok(await cards() === 3, `esperava 3 favoritos de Fundos (veio ${await cards()})`);
// permanente vem PRIMEIRO na ordem padrão (§229)
const primeiro = await p2.locator('.avst-grade [role="option"] .avst-card-nome').first().textContent();
ok((primeiro ?? '').includes('Placa-Mãe'), `permanente (Placa-Mãe) deveria abrir a lista (veio ${primeiro})`);
await p2.locator('[data-teste="fav-cat-permanentes"]').click();
await p2.waitForTimeout(300);
ok(await cards() === 1, `Permanentes deveria mostrar 1 (veio ${await cards()})`);
await p2.locator('[data-teste="fav-cat-rapidos"]').click();
await p2.waitForTimeout(300);
ok(await cards() === 2, `Rápidos deveria mostrar 2 (veio ${await cards()})`);
await p2.locator('[data-teste="fav-cat-colecao"]').click();
await p2.waitForTimeout(300);
ok(await p2.locator('[data-teste="fav-col-col_cyber_nexus"]').count() === 1, 'coleção Cyber Nexus ausente no agrupamento');
await p2.locator('[data-teste="fav-col-col_cyber_nexus"]').click();
await p2.waitForTimeout(300);
ok(await cards() === 1, `Por coleção (Cyber Nexus) deveria mostrar 1 (veio ${await cards()})`);
await p2.screenshot({ path: `${SAIDA}/favoritos-229.png` });
ok(erros2.length === 0, `erros de página (favoritos): ${erros2.join(' | ')}`);
await b2.close();

// ── C) MINHA VITRINE (§1076/§1077) — aba Conquistas ─────────────────
const { navegador: b3, pagina: p3, erros: erros3 } = await abrir({
  viewport: { width: 1500, height: 1200 },
  init: () => {
    const cfg = {
      formato: 'camadas', versao: 3, base: 'bas_classica',
      camadas: { cabelo: 'cab_curto', olhos: 'olh_padrao', boca: 'boc_sorriso', roupa: 'rou_camiseta', fundo: 'fun_estudio' },
      cores: { pele: '#e8b88a', cabelo: '#3b2a1d', roupa: '#3c6df0', destaque: '#7c5cff' },
    };
    localStorage.setItem('dshow.avst5.presets.v1', JSON.stringify([
      { id: 'pr1', nome: 'Look Cyber', tags: [], favorito: true, criadoEm: '2026-08-01T00:00:00Z', renderizador: '2d', config: cfg },
    ]));
  },
});
await irParaHarness(p3, 'avst-harness.html', 800);
await p3.evaluate(() => { [...document.querySelectorAll('.avst-cat')].find((x) => x.textContent.trim() === 'Conquistas')?.click(); });
await p3.waitForTimeout(800);
ok(await p3.locator('[data-teste="minha-vitrine"]').count() === 1, 'Minha Vitrine ausente (flag as5.vitrine_pessoal?)');
ok(await p3.locator('[data-teste="minha-vitrine"] .avst-mv-bloco').count() === 6, 'esperava 6 blocos na vitrine');
// reordenação acessível persiste (§1076)
const antes = await p3.locator('.avst-mv-bloco header strong').first().textContent();
await p3.locator('[data-teste="mv-descer-avatar"]').click();
await p3.waitForTimeout(200);
const depois = await p3.locator('.avst-mv-bloco header strong').first().textContent();
ok(antes !== depois, 'descer o bloco Avatar deveria mudar o primeiro da lista');
const ordemSalva = await p3.evaluate(() => localStorage.getItem('dshow.avst5.vitrine.ordem.v1') ?? '');
ok(ordemSalva.startsWith('["presets"'), `ordem nova não persistiu (${ordemSalva.slice(0, 30)}…)`);
// §1077: cria galeria e guarda o preset nela
await p3.locator('[data-teste="mv-gal-nova"]').fill('Executivos');
await p3.keyboard.press('Enter');
await p3.waitForTimeout(300);
ok(await p3.locator('[data-teste="mv-gal-corpo"]').count() === 1, 'galeria criada não abriu');
await p3.locator('[data-teste="mv-gal-item-preset:pr1"]').click();
await p3.waitForTimeout(300);
const galSalva = await p3.evaluate(() => localStorage.getItem('dshow.avst5.galerias.v1') ?? '');
ok(galSalva.includes('preset:pr1') && galSalva.includes('Executivos'), 'preset não entrou na galeria persistida');
await p3.screenshot({ path: `${SAIDA}/minha-vitrine.png` });
ok(erros3.length === 0, `erros de página (vitrine): ${erros3.join(' | ')}`);
await b3.close();

if (falhas.length) { console.error('FALHAS onda-230:\n- ' + falhas.join('\n- ')); process.exit(1); }
console.log('onda-230 OK');
