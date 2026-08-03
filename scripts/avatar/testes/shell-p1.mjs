// testes/shell-p1.mjs — AS5 F3 P1': filtros em popover (§56), aleatório
// inteligente respeitando bloqueios (§90) e comparação por tecla (§65.3).
import { SAIDA, abrir, irParaHarness, relatorio } from './navegador.mjs';

const { navegador: b, pagina: p, erros } = await abrir({
  viewport: { width: 1500, height: 940 },
  init: () => { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true })); },
});
await irParaHarness(p, 'avst-harness.html', 1200);

const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };
const svgPalco = () => p.locator('.avst5-palco svg').evaluate((el) => el.innerHTML);

// §56: popover abre com contadores por raridade; filtro vira chip removível
await p.evaluate(() => { [...document.querySelectorAll('.avst5-cat')].find((x) => x.textContent.includes('Cabelo'))?.click(); });
await p.waitForTimeout(600);
await p.locator('.avst-fpop-abrir').click();
await p.waitForTimeout(300);
ok(await p.locator('.avst-fpop').count() === 1, 'popover de filtros não abriu');
const textoRar = await p.locator('.avst-fpop-raridades').textContent();
ok(/\(\d+\)/.test(textoRar ?? ''), 'contadores §56.2 ausentes no popover');
await p.locator('.avst-fpop-rar:not(:disabled)').first().click();
await p.waitForTimeout(300);
ok(await p.locator('.avst-fpop-abrir em').textContent() === '1', 'badge de filtros ativos errado');
await p.locator('.avst-fpop-fundo').click(); // fecha pelo backdrop
await p.waitForTimeout(300);
ok(await p.locator('.avst-fchips .avst-fchip').count() >= 2, 'chips ativos §56.1 ausentes (filtro + limpar)');
await p.locator('.avst-fchips .avst-fchip').first().click(); // remove pelo ×
await p.waitForTimeout(300);
ok(await p.locator('.avst-fchips').count() === 0, 'remover chip não limpou o filtro');
await p.screenshot({ path: `${SAIDA}/p1-filtros.png` });

// §90: bloquear o cabelo e rodar aleatório COMPLETO — cabelo não pode mudar
await p.locator('.avst5-abas button', { hasText: 'Equipados' }).click();
await p.waitForTimeout(500);
const nomeCabelo = await p.locator('.avst5-eq-linha[data-slot="cabelo"] .avst5-eq-nome').textContent();
await p.locator('.avst5-eq-linha[data-slot="cabelo"] button[title^="Bloquear"]').click();
await p.waitForTimeout(300);
const antesAlea = await svgPalco();
await p.locator('.avst5-alea > button').click();
await p.waitForTimeout(300);
ok(await p.locator('.avst5-alea-menu').count() === 1, 'menu do aleatório não abriu');
await p.locator('.avst5-alea-menu button', { hasText: 'Completo' }).click();
await p.waitForTimeout(600);
ok((await svgPalco()) !== antesAlea, 'aleatório não mudou o palco');
const cabeloDepois = await p.locator('.avst5-eq-linha[data-slot="cabelo"] .avst5-eq-nome').textContent();
ok(cabeloDepois === nomeCabelo, `aleatório trocou slot BLOQUEADO (${nomeCabelo} → ${cabeloDepois})`);
ok((await p.locator('.avst5-salvar').textContent())?.includes('alteraç'), 'aleatório deveria virar alteração');

// §65.3: segurar V mostra o ORIGINAL persistido; soltar volta ao draft
const comMudancas = await svgPalco();
await p.keyboard.down('v');
await p.waitForTimeout(400);
ok(await p.locator('.avst5-comparando').count() === 1, 'badge de comparação ausente');
const originalTela = await svgPalco();
ok(originalTela !== comMudancas, 'segurar V não mostrou o original');
await p.keyboard.up('v');
await p.waitForTimeout(400);
ok((await svgPalco()) === comMudancas, 'soltar V não voltou ao draft');
// botão press-and-hold no palco também funciona
await p.locator('.avst5-comparar').dispatchEvent('pointerdown');
await p.waitForTimeout(300);
ok((await svgPalco()) === originalTela, 'botão Original (segurar) não mostrou o persistido');
await p.locator('.avst5-comparar').dispatchEvent('pointerup');
await p.waitForTimeout(300);
await p.screenshot({ path: `${SAIDA}/p1-aleatorio.png` });

const ok_ = relatorio('shell-p1', falhas, erros);
await b.close();
process.exit(ok_ ? 0 : 1);
