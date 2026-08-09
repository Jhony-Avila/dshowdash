// testes/dock-mag.mjs — lote 941–950 (AS6 §104–§105, flag as6.dock_mag;
// decisão #96): magnificação + momentum + snap da Asset Dock.
//   A) flag ON (clássico AAA): mover o cursor sobre a dock põe
//      `--avst6-mag` > 1 nos cards próximos (queda gaussiana — o mais
//      perto cresce mais) e sair limpa; drag com velocidade CONTINUA
//      rolando após soltar (momentum) e ASSENTA num múltiplo do passo
//      do card (snap §104); atributo [data-dock-mag] presente.
//   B) rollback §651: flag OFF = sem [data-dock-mag], sem var nos
//      cards e soltar o drag NÃO continua rolando (831–840 byte a byte).
// @version 1.0.0  @created 2026-08-09
import { SAIDA, abrir, irParaHarness } from './navegador.mjs';

const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };

const prepararItens = async (p) => {
  await p.evaluate(() => { [...document.querySelectorAll('.avst-cat')].find((x) => x.textContent.trim() === 'Roupa')?.click(); });
  await p.waitForTimeout(700);
};
const dockBox = (p) => p.evaluate(() => {
  const r = document.querySelector('[data-teste="dock-v3"] .avst-grade')?.getBoundingClientRect();
  return r ? { x: r.x, y: r.y, w: r.width, h: r.height } : null;
});
const scrollDock = (p) => p.evaluate(() => document.querySelector('[data-teste="dock-v3"] .avst-grade')?.scrollLeft ?? -1);
const arrastar = async (p, box, dist) => {
  const y = box.y + box.h * 0.5;
  const x0 = box.x + box.w * 0.7;
  await p.mouse.move(x0, y);
  await p.mouse.down();
  for (let i = 1; i <= 8; i++) await p.mouse.move(x0 - (dist / 8) * i, y);
  await p.mouse.up();
};

// ── A) flag ON ──────────────────────────────────────────────────────
{
  const { navegador: b, pagina: p, erros } = await abrir({
    viewport: { width: 1440, height: 900 },
    init: () => { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': false, 'as5.classico_aaa': true })); },
  });
  try {
    await irParaHarness(p, 'avst-harness.html', 1200);
    await prepararItens(p);
    ok(await p.locator('[data-teste="dock-v3"][data-dock-mag]').count() === 1,
      'dock sem [data-dock-mag] com a flag ON');
    const box = await dockBox(p);
    ok(!!box, 'grade da dock não encontrada');
    // §105: hover magnifica com queda gaussiana
    await p.mouse.move(box.x + 60, box.y + box.h / 2);
    await p.waitForTimeout(200);
    const mags = await p.evaluate(() => [...document.querySelectorAll('[data-teste="dock-v3"] .avst-card')]
      .map((c) => Number(c.style.getPropertyValue('--avst6-mag') || 1)));
    const acima = mags.filter((m) => m > 1.005);
    ok(acima.length >= 1, 'nenhum card magnificado no hover (§105)');
    ok(Math.max(...mags) <= 1.2, `magnificação além do teto (${Math.max(...mags)})`);
    // gaussiana: quem está mais perto do cursor cresce mais que o vizinho distante
    const primeiro = mags[0] ?? 1;
    const ultimoVisivel = mags[Math.min(mags.length - 1, 6)] ?? 1;
    ok(primeiro >= ultimoVisivel, 'queda gaussiana invertida (o distante cresceu mais)');
    // sair limpa
    await p.mouse.move(box.x + box.w / 2, box.y - 80);
    await p.waitForTimeout(200);
    const depois = await p.evaluate(() => [...document.querySelectorAll('[data-teste="dock-v3"] .avst-card')]
      .filter((c) => c.style.getPropertyValue('--avst6-mag')).length);
    ok(depois === 0, 'sair da dock não limpou a magnificação (§105)');
    // §104: momentum — soltar com velocidade continua rolando
    const s0 = await scrollDock(p);
    await arrastar(p, box, 260);
    const s1 = await scrollDock(p);
    ok(s1 > s0 + 150, `drag não rolou o esperado (${s0}→${s1})`);
    await p.waitForTimeout(120);
    const s2 = await scrollDock(p);
    ok(s2 > s1 + 8, `sem momentum após soltar (${s1}→${s2})`);
    // snap §104: assenta em múltiplo do passo do card
    await p.waitForTimeout(1500);
    const fim = await p.evaluate(() => {
      const el = document.querySelector('[data-teste="dock-v3"] .avst-grade');
      const card = el?.querySelector('.avst-card');
      if (!el || !card) return null;
      const gap = parseFloat(getComputedStyle(el).columnGap || '0') || 0;
      const passo = card.offsetWidth + gap; // layout, imune à magnificação
      const base = card.offsetLeft; // snap points = base + k·passo
      const resto = ((el.scrollLeft - base) % passo + passo) % passo;
      return { resto: Math.min(resto, passo - resto), maximo: el.scrollWidth - el.clientWidth, pos: el.scrollLeft };
    });
    ok(!!fim && (fim.resto < 2 || fim.pos > fim.maximo - 2),
      `rolagem não assentou no passo do card (resto=${fim?.resto})`);
    await p.screenshot({ path: `${SAIDA}/dock-mag.png` });
    ok(erros.length === 0, `erros de página (ON): ${erros.join(' | ')}`);
  } catch (e) { falhas.push(`exceção (ON): ${e.message}`); }
  await b.close();
}

// ── B) rollback §651 ────────────────────────────────────────────────
{
  const { navegador: b, pagina: p, erros } = await abrir({
    viewport: { width: 1440, height: 900 },
    init: () => { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': false, 'as5.classico_aaa': true, 'as6.dock_mag': false })); },
  });
  try {
    await irParaHarness(p, 'avst-harness.html', 1200);
    await prepararItens(p);
    ok(await p.locator('[data-teste="dock-v3"]').count() === 1, 'dock v3 deveria seguir presente (831–840)');
    ok(await p.locator('[data-teste="dock-v3"][data-dock-mag]').count() === 0,
      'flag OFF ainda marcou [data-dock-mag] (§651)');
    const box = await dockBox(p);
    await p.mouse.move(box.x + 60, box.y + box.h / 2);
    await p.waitForTimeout(200);
    const comVar = await p.evaluate(() => [...document.querySelectorAll('[data-teste="dock-v3"] .avst-card')]
      .filter((c) => c.style.getPropertyValue('--avst6-mag')).length);
    ok(comVar === 0, 'flag OFF magnificou cards (§651)');
    // sem momentum: depois de soltar, a rolagem PARA
    await arrastar(p, box, 260);
    const s1 = await scrollDock(p);
    await p.waitForTimeout(250);
    const s2 = await scrollDock(p);
    ok(Math.abs(s2 - s1) < 2, `flag OFF com momentum (${s1}→${s2}) (§651)`);
    ok(erros.length === 0, `erros de página (OFF): ${erros.join(' | ')}`);
  } catch (e) { falhas.push(`exceção (OFF): ${e.message}`); }
  await b.close();
}

if (falhas.length) { console.error('[dock-mag] FALHAS:\n- ' + falhas.join('\n- ')); process.exit(1); }
console.log('[dock-mag] FALHAS: nenhuma');
console.log('[dock-mag] ERROS JS: nenhum');
