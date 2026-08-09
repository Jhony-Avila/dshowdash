// testes/palco-v2.mjs — ONDA 231–260, LOTE 231–240: PALCO v2 (§160–§172).
//  1) cenários prioritários v2 (§160.1–.4) e horas v2 (§162) nos chips;
//  2) trocar p/ Showroom LED + amanhecer reflete nos data-attrs e o CSS
//     do cenário novo pinta de verdade;
//  3) propriedades do cenário (§161): luz (brightness no palco), profundidade/
//     cor ambiente (overlay), cenário vivo (data-attr) e Zerar;
//  4) poder v2 (§154/§154.1): equipar efeito → ativar → NOME + raridade no
//     overlay, controles travados durante, cooldown com replay depois;
//  5) preview de poder no card (§155): hover anima, sair pausa;
//  6) contextos ranking/notificação no drawer §67 (§168) e presets de
//     composição do banner (§170.1) com deslocamento no SVG;
//  7) editor de título (§172): selo com nome real + alinhamento/escala.
import { SAIDA, abrir, irParaHarness } from './navegador.mjs';

const { navegador: b, pagina: p, erros } = await abrir({
  viewport: { width: 1500, height: 940 },
  init: () => {
    localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true, 'as6.dock_inferior': false, 'as5.palco3d': false }));
  },
});
await irParaHarness(p, 'avst-harness.html', 1000);

const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };
const svgPalco = () => p.evaluate(() => document.querySelector('.avst5-zoom svg')?.outerHTML ?? '');

// ── 1) chips v2 ──
ok(await p.locator('[data-teste="cenarios-2d"] button').count() === 10, 'esperava 10 cenários (6 clássicos + 4 v2)');
ok(await p.locator('[data-teste="horas-2d"] button').count() === 6, 'esperava 6 horas (3 clássicas + 3 v2)');

// ── 2) showroom + amanhecer ──
await p.locator('[data-teste="cenarios-2d"] button', { hasText: 'Showroom LED' }).click();
await p.locator('[data-teste="horas-2d"] button', { hasText: 'Amanhecer' }).click();
await p.waitForTimeout(300);
ok(await p.locator('.avst5-viewport[data-fundo="showroom"]').count() === 1, 'data-fundo=showroom não aplicou');
ok(await p.locator('.avst5-viewport[data-hora="amanhecer"]').count() === 1, 'data-hora=amanhecer não aplicou');
const bg = await p.evaluate(() => getComputedStyle(document.querySelector('.avst5-palco')).backgroundImage);
ok(bg.includes('gradient'), 'CSS do cenário Showroom não pintou (background-image sem gradient)');

// ── 3) propriedades do cenário §161 ──
ok(await p.locator('[data-teste="cenario-props"]').count() === 1, 'painel de propriedades §161 ausente');
await p.locator('[data-teste="cenario-abrir"]').click();
await p.locator('[data-teste="cen-luz"]').evaluate((el) => {
  const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
  set.call(el, '1.3'); el.dispatchEvent(new Event('input', { bubbles: true }));
});
await p.waitForTimeout(250);
const filtroPalco = await p.evaluate(() => document.querySelector('.avst5-palco')?.getAttribute('style') ?? '');
ok(filtroPalco.includes('brightness(1.3)'), `intensidade de luz não aplicou (style: ${filtroPalco})`);
await p.locator('[data-teste="cen-prof"]').evaluate((el) => {
  const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
  set.call(el, '0.8'); el.dispatchEvent(new Event('input', { bubbles: true }));
});
await p.locator('[data-teste="cen-amb-azul"]').click();
await p.waitForTimeout(250);
ok(await p.locator('[data-teste="cenario-props-overlay"]').count() === 1, 'overlay de profundidade/ambiente ausente');
await p.locator('[data-teste="cen-vivo"]').click();
await p.waitForTimeout(200);
ok(await p.locator('.avst5-viewport[data-cen-vivo]').count() === 1, 'cenário vivo não ligou (data-cen-vivo)');
const persistiu = await p.evaluate(() => localStorage.getItem('dshow.avst5.palco.cenario.v1') ?? '');
ok(persistiu.includes('"vivo":true'), 'propriedades do cenário não persistiram');
await p.locator('[data-teste="cen-zerar"]').click();
await p.waitForTimeout(250);
ok(await p.locator('[data-teste="cenario-props-overlay"]').count() === 0, 'Zerar não removeu o overlay');
await p.screenshot({ path: `${SAIDA}/palco-v2-cenario.png` });

// ── 4) poder v2 §154 — equipa um efeito e ativa no Studio ──
await p.evaluate(() => { [...document.querySelectorAll('.avst5-cat')].find((x) => x.textContent.includes('Efeito'))?.click(); });
await p.waitForTimeout(500);
await p.evaluate(() => {
  const card = [...document.querySelectorAll('.avst5-painel .avst-card')]
    .find((c) => !c.className.includes('avst-card-nenhum') && !c.className.includes('avst-card-bloqueado'));
  card?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
});
await p.waitForTimeout(400);
await p.locator('button[title="Modo Studio (apresentação)"]').click();
await p.waitForTimeout(400);
const btnPoder = p.locator('[data-teste="ativar-poder"]');
ok(await btnPoder.getAttribute('data-fase') === 'pronto', 'poder deveria começar PRONTO (§154.1)');
await btnPoder.click();
await p.waitForTimeout(500);
ok(await p.locator('[data-teste="poder-nome"]').count() === 1, 'NOME do poder ausente durante a reprodução (§154 item 7)');
ok(await p.locator('[data-teste="cenarios-2d"] button[disabled]').count() > 0, 'controles deveriam travar durante a reprodução (§154.1)');
await p.waitForTimeout(2600);
ok(await btnPoder.getAttribute('data-fase') === 'cooldown', 'fase cooldown não entrou após reproduzir');
ok((await btnPoder.textContent())?.includes('Recarregando'), 'rótulo de cooldown ausente');
await p.waitForTimeout(1600);
ok(await btnPoder.getAttribute('data-fase') === 'pronto', 'replay não liberou após o cooldown (§154 item 9)');
ok(await p.locator('[data-teste="cenarios-2d"] button[disabled]').count() === 0, 'controles não destravavam após o poder');

// ── 5) §155 preview de poder no card ──
await p.locator('button[title="Voltar à edição (Esc)"]').click().catch(() => p.keyboard.press('Escape'));
await p.waitForTimeout(300);
const cardEfeito = p.locator('.avst5-painel .avst-card:not(.avst-card-nenhum)').first();
await cardEfeito.hover();
await p.waitForTimeout(300);
ok(await p.locator('[data-teste="poder-preview"]').count() === 1, 'hover no card não animou o poder (§155)');
await p.locator('.avst5-painel-topo').hover();
await p.waitForTimeout(300);
ok(await p.locator('[data-teste="poder-preview"]').count() === 0, 'sair do card não pausou o preview (§155)');

// ── 6) §168 contextos + §170.1 presets do banner ──
await p.evaluate(() => { [...document.querySelectorAll('.avst5-cat')].find((x) => x.textContent.includes('Banner'))?.click(); });
await p.waitForTimeout(500);
await p.evaluate(() => {
  const card = [...document.querySelectorAll('.avst5-painel .avst-card')]
    .find((c) => !c.className.includes('avst-card-nenhum'));
  card?.querySelector('.avst-card-info-btn')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
});
await p.waitForTimeout(500);
ok(await p.locator('[data-teste="ctx-ranking"]').count() === 1, 'contexto Ranking (§168) ausente no drawer');
ok(await p.locator('[data-teste="ctx-notificacao"]').count() === 1, 'contexto Notificação (§168) ausente');
ok(await p.locator('[data-teste="banner-presets"]').count() === 1, 'presets de composição §170.1 ausentes');
await p.locator('[data-teste="banner-comp-direita"]').click();
await p.waitForTimeout(400);
ok((await svgPalco()).includes('translate(24 0)'), 'preset "banner à direita" não deslocou o banner no SVG (§170.1)');
await p.locator('[data-teste="drawer-detalhe"] button[title="Fechar"]').click().catch(() => undefined);
await p.waitForTimeout(300);

// ── 7) §172 editor de título — título entra via RASCUNHO recuperado
// (no shell o título não é categoria da grade; o rascunho §629 carrega
// um config completo COM titulo e o botão Continuar o aplica) ──
await p.evaluate(() => {
  const cfg = {
    formato: 'camadas', versao: 3, base: 'bas_classica',
    camadas: { cabelo: 'cab_curto', olhos: 'olh_padrao', boca: 'boc_sorriso', roupa: 'rou_camiseta', fundo: 'fun_estudio' },
    cores: { pele: '#e8b88a', cabelo: '#3b2a1d', roupa: '#3c6df0', destaque: '#7c5cff' },
    titulo: 'tit_estrategista',
  };
  localStorage.setItem('dshow.avst5.rascunho.v1',
    JSON.stringify({ config: cfg, versaoBase: 0, em: new Date().toISOString(), aba: 'teste-palco-v2' }));
});
await p.reload({ waitUntil: 'networkidle' });
await p.waitForFunction(() => window.__pronto === true, { timeout: 20000 });
await p.waitForTimeout(900);
await p.locator('[data-teste="rascunho"] button', { hasText: 'Continuar' }).click();
await p.waitForTimeout(500);
await p.locator('button[title="Modo Studio (apresentação)"]').click();
await p.waitForTimeout(400);
if (await p.locator('[data-teste="titulo-selo"]').count() === 1) {
  ok(await p.locator('[data-teste="titulo-editor"]').count() === 1, 'editor de título §172 ausente no Studio');
  await p.locator('[data-teste="titulo-al-esquerda"]').click();
  await p.waitForTimeout(200);
  ok(await p.locator('.avst5-titulo-selo.avst5-ts-esquerda').count() === 1, 'alinhamento à esquerda não aplicou');
  await p.locator('[data-teste="titulo-esc-g"]').click();
  await p.waitForTimeout(200);
  ok(await p.locator('.avst5-titulo-selo.avst5-ts-g').count() === 1, 'escala G do título não aplicou');
  const prefTitulo = await p.evaluate(() => localStorage.getItem('dshow.avst5.palco.titulo.v1') ?? '');
  ok(prefTitulo.includes('esquerda'), 'preferências do título não persistiram');
} else {
  falhas.push('selo do título não apareceu no Studio após equipar título');
}
await p.screenshot({ path: `${SAIDA}/palco-v2-titulo.png` });

ok(erros.length === 0, `erros de página: ${erros.join(' | ')}`);

await b.close();
if (falhas.length) { console.error('FALHAS palco-v2:\n- ' + falhas.join('\n- ')); process.exit(1); }
console.log('palco-v2 OK');
