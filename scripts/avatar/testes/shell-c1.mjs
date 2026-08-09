// testes/shell-c1.mjs — AS5 F3 C1: preview no palco, Equipados, conflito, busca.
import { SAIDA, abrir, irParaHarness, relatorio } from './navegador.mjs';

const { navegador: b, pagina: p, erros } = await abrir({
  viewport: { width: 1500, height: 940 },
  init: () => { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true, 'as6.dock_inferior': false })); },
});
await irParaHarness(p, 'avst-harness.html', 1200);

const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };
const svgLen = () => p.locator('.avst5-palco svg').evaluate((el) => el.innerHTML.length);

// §64: hover muda o PALCO sem sujar o draft; sair restaura
const base = await svgLen();
await p.evaluate(() => { [...document.querySelectorAll('.avst5-cat')].find((x) => x.textContent.includes('Cabelo'))?.click(); });
await p.waitForTimeout(700);
const cards = p.locator('.avst5-painel .avst-card:not(.avst-card-ativo):not(.avst-card-nenhum)');
await cards.nth(1).hover();
await p.waitForTimeout(500);
const comHover = await svgLen();
ok(comHover !== base, 'hover não mudou o palco');
ok((await p.locator('.avst5-salvar').textContent())?.includes('Tudo salvo'), 'hover NÃO pode virar alteração');
await p.locator('.avst5-header').hover();
await p.waitForTimeout(400);
ok((await svgLen()) === base, 'sair do hover não restaurou o palco');

// §57: busca sem acento acha item acentuado
await p.locator('.avst5-painel input[type="search"]').fill('tranca');
await p.waitForTimeout(500);
const nomes = await p.locator('.avst5-painel .avst-card-nome').allTextContents();
ok(nomes.some((n) => n.toLowerCase().includes('tranç')), `busca sem acento falhou em Cabelo (${nomes.slice(0,3).join(',')})`);
await p.locator('.avst5-painel input[type="search"]').fill('');

// §70: aba Equipados lista slots com ações; bloquear persiste
await p.locator('.avst5-abas button', { hasText: 'Equipados' }).click();
await p.waitForTimeout(500);
ok(await p.locator('.avst5-eq-linha').count() >= 2, 'Equipados deveria listar base + itens');
await p.locator('.avst5-eq-linha[data-slot="cabelo"] button[title^="Bloquear"]').click();
await p.waitForTimeout(300);
ok(await p.locator('.avst5-eq-linha[data-slot="cabelo"] .avst5-eq-on').count() >= 1, 'bloqueio não marcou');

// §69.1: trocar item de slot BLOQUEADO abre modal; Cancelar preserva; Substituir aplica
await p.locator('.avst5-abas button', { hasText: 'Todos' }).click();
await p.waitForTimeout(500);
const antesConflito = await svgLen();
await p.evaluate(() => {
  const cs = [...document.querySelectorAll('.avst5-painel .avst-card')].filter((c) => !c.className.includes('avst-card-ativo') && !c.className.includes('avst-card-nenhum'));
  cs[3]?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
});
await p.waitForTimeout(500);
ok(await p.locator('.avst5-modal').count() === 1, 'modal de conflito não abriu p/ slot bloqueado');
await p.locator('.avst5-modal button', { hasText: 'Cancelar' }).click();
await p.waitForTimeout(400);
ok((await svgLen()) === antesConflito, 'Cancelar deveria preservar o item');
await p.evaluate(() => {
  const cs = [...document.querySelectorAll('.avst5-painel .avst-card')].filter((c) => !c.className.includes('avst-card-ativo') && !c.className.includes('avst-card-nenhum'));
  cs[3]?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
});
await p.waitForTimeout(400);
await p.locator('.avst5-modal button', { hasText: 'substituir' }).click();
await p.waitForTimeout(500);
ok((await svgLen()) !== antesConflito, 'Substituir deveria aplicar a troca');
await p.screenshot({ path: `${SAIDA}/c1-equipados.png` });

const ok_ = relatorio('shell-c1', falhas, erros);
await b.close();
process.exit(ok_ ? 0 : 1);
