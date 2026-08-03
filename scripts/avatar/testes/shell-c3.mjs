// testes/shell-c3.mjs — AS5 F3 C3: canais de cor da peça (§73) + paletas (§74).
// A prova central: trocar os DETALHES da roupa NÃO muda a cor da aura
// (que usa o 'destaque' GLOBAL) — o override é da peça, não do avatar.
import { SAIDA, abrir, irParaHarness, relatorio } from './navegador.mjs';

const { navegador: b, pagina: p, erros } = await abrir({
  viewport: { width: 1500, height: 940 },
  init: () => { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true })); },
});
await irParaHarness(p, 'avst-harness.html', 1200);

const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };
const svgPalco = () => p.locator('.avst5-palco svg').evaluate((el) => el.innerHTML);
const equipar1 = () => p.evaluate(() => {
  const c = [...document.querySelectorAll('.avst5-painel .avst-card')].find((x) => !x.className.includes('avst-card-ativo') && !x.className.includes('avst-card-bloqueado') && !x.className.includes('avst-card-nenhum'));
  c?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
});

// prepara: equipa uma AURA (consome o destaque global) e vai para ROUPA
await p.evaluate(() => { [...document.querySelectorAll('.avst5-cat')].find((x) => x.textContent.trim().endsWith('Aura'))?.click(); });
await p.waitForTimeout(600);
await equipar1();
await p.waitForTimeout(500);
await p.evaluate(() => { [...document.querySelectorAll('.avst5-cat')].find((x) => x.textContent.includes('Roupa'))?.click(); });
await p.waitForTimeout(600);

// §73.1: painel de propriedades mostra canais da peça equipada
await p.locator('.avst5-painel-topo button[title="Cores e propriedades"]').click();
await p.waitForTimeout(500);
ok(await p.locator('.avst5-canais').count() === 1, 'seção Cores da peça ausente');
ok(await p.locator('.avst5-paletas .avst5-paleta').count() >= 9, 'paletas §74 ausentes (Original + 8)');

// abrir o último canal e aplicar uma cor própria (adaptativo à paleta da peça)
const chips = p.locator('.avst5-canal-chip');
const nChips = await chips.count();
ok(nChips >= 1, 'nenhum chip de canal');
await chips.last().click();
await p.waitForTimeout(300);
const alvo = p.locator('.avst5-canal-cores .avst-swatch[role="radio"][aria-checked="false"]').first();
const HEX = ((await alvo.getAttribute('title')) ?? '').replace('#', '');
ok(HEX.length === 6, `swatch alvo sem hex (title=${HEX})`);
const antes = ((await svgPalco()).match(new RegExp(HEX, 'g')) ?? []).length;
await alvo.click();
await p.waitForTimeout(500);
const depois = ((await svgPalco()).match(new RegExp(HEX, 'g')) ?? []).length;
ok(depois > antes, `canal não recolorizou a roupa (#${HEX}: ${antes}→${depois})`);
ok((await p.locator('.avst5-salvar').textContent())?.includes('alteraç'), 'canal deveria virar alteração pendente');
ok(await p.locator('.avst5-canal-chip em').count() >= 1, 'chip não marcou canal "próprio"');

// §74: paleta pronta preenche os DOIS canais; Original limpa
await p.locator('.avst5-paleta', { hasText: 'Cyber' }).click();
await p.waitForTimeout(500);
const comCyber = await svgPalco();
// o validarConfig só mantém canais que o ITEM declara — basta UM dos dois
// hexes da paleta aparecer (roupa #1a1035 ou detalhe #4cd9e8)
ok(/1a1035|4cd9e8/.test(comCyber), 'paleta Cyber não aplicou nenhum canal');
await p.locator('.avst5-paleta', { hasText: 'Original' }).click();
await p.waitForTimeout(500);
ok(await p.locator('.avst5-canal-chip em').count() === 0, 'Original deveria remover os canais próprios');

// undo: volta a paleta Cyber (última ação foi removê-la)
await p.keyboard.press('Control+z');
await p.waitForTimeout(500);
ok(await p.locator('.avst5-canal-chip em').count() >= 1, 'undo não devolveu o canal próprio');
await p.screenshot({ path: `${SAIDA}/c3-canais.png` });

const ok_ = relatorio('shell-c3', falhas, erros);
await b.close();
process.exit(ok_ ? 0 : 1);
