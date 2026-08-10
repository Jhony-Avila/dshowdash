// testes/dock-fit.mjs — onda 1291 (decisões #133–#134, flags
// as6.dock_fit + as6.ctx_barra): geometria CAUSAL do workspace com dock
// inferior + barra contextual legível (briefing UX do Jhony 2026-08-10).
//   A) ALTURA REAL: com chrome simulado do dashboard (190px acima +
//      12px abaixo), o shell mede o espaço disponível — nada estoura o
//      viewport, cards INTEIROS, um único scroll (nenhum vertical
//      concorrente no estado padrão), busca/tabs/título visíveis.
//      Válido em 1366×768, 1440×900, 1920×1080 e 1093×614 (~zoom 125%).
//   B) ESTADOS: compacta < padrão < expandida; em todos os estados o
//      card fica inteiro dentro da dock; D cicla; persistência v1 segue.
//   C) DIVISOR (#133): drag muda a altura 1:1; clamp nos limites
//      (nunca corta card / nunca esmaga o preview); persistência v2
//      versionada e validada; teclado ±24px; duplo clique = padrão;
//      estado nomeado limpa o custom.
//   D) BARRA CONTEXTUAL (#134): visível, contraste ≥4.5:1 nos DOIS
//      temas (nunca texto escuro em fundo escuro), texto orientado à
//      ação, X dispensa e persiste; pill de anúncio NÃO duplica a dica.
//   E) BUGFIX sem flag: .avst5-anuncio legível no tema claro.
//   F) ROLLBACK §651: flags OFF = geometria #112 byte a byte
//      (corpo calc(100vh−150px), painel 384px, dica na pill).
// @version 1.0.0  @created 2026-08-10
import { SAIDA, abrir, irParaHarness } from './navegador.mjs';

const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };

const contrasteDe = (corA, corB) => {
  const lum = (c) => {
    const m = c.match(/\d+(\.\d+)?/g)?.map(Number) ?? [0, 0, 0];
    const canais = c.trim().startsWith('color(') ? m.slice(0, 3) : m.slice(0, 3).map((v) => v / 255);
    const [r, g, b] = canais.map((s) => (s <= 0.03928 ? s / 12.92 : (((s + 0.055) / 1.055) ** 2.4)));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const [a, b2] = [lum(corA), lum(corB)];
  return (Math.max(a, b2) + 0.05) / (Math.min(a, b2) + 0.05);
};

// chrome de produção simulado: dashboard + cabeçalho do container ≈190px
const CHROME = () => {
  localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true }));
  const s = document.createElement('style');
  s.textContent = 'body{padding:190px 0 12px 0 !important; margin:0}';
  document.addEventListener('DOMContentLoaded', () => document.head.appendChild(s));
};

// ── A) altura real disponível — multi-resolução + zoom equivalente ──
for (const vp of [
  { width: 1366, height: 768 }, { width: 1440, height: 900 },
  { width: 1920, height: 1080 }, { width: 1093, height: 614 },
]) {
  const { navegador: b, pagina: p, erros } = await abrir({ viewport: vp, init: CHROME });
  try {
    await irParaHarness(p, 'avst-harness.html', 1200);
    const g = await p.evaluate(() => {
      const r = (s) => document.querySelector(s)?.getBoundingClientRect() ?? null;
      const ps = document.querySelector('.avst5-painel-scroll');
      const card = r('.avst5-painel .avst-card');
      return {
        inner: window.innerHeight,
        shell: r('.avst5-shell'), corpo: r('.avst5-corpo'),
        viewport: r('.avst5-viewport'), painel: r('.avst5-painel'),
        card: card ? { top: card.top, bottom: card.bottom, h: card.height } : null,
        busca: r('.avst-busca'), tabs: r('.avst5-abas'), titulo: r('.avst-painel-titulo'),
        psScrollExtra: ps ? ps.scrollHeight - ps.clientHeight : -1,
        scrollX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        varAlt: document.querySelector('.avst5-shell')?.style.getPropertyValue('--avst5-alt') ?? '',
      };
    });
    const rot = `${vp.width}×${vp.height}`;
    ok(g.varAlt !== '', `(${rot}) --avst5-alt não foi medida`);
    // piso funcional 430px: abaixo dele o app degrada com scroll (1093×614)
    const cabe = vp.height - 202 >= 430;
    if (cabe) {
      ok(g.shell.bottom <= g.inner + 1, `(${rot}) shell estourou o viewport (${Math.round(g.shell.bottom)} > ${g.inner})`);
      ok(g.card && g.card.bottom <= g.inner + 1, `(${rot}) card CORTADO pela janela (bottom=${Math.round(g.card?.bottom ?? -1)})`);
      ok(g.psScrollExtra <= 1, `(${rot}) scroll vertical concorrente na dock padrão (${g.psScrollExtra}px)`);
      ok(g.viewport.height >= 200, `(${rot}) preview esmagado (${Math.round(g.viewport.height)}px)`);
      ok(g.painel.height >= 200, `(${rot}) dock esmagada (${Math.round(g.painel.height)}px)`);
    } else {
      // extremo: conteúdo segue ACESSÍVEL (scroll), nunca inacessível
      ok(g.card && g.card.h >= 90, `(${rot}) card ilegível no extremo (${Math.round(g.card?.h ?? 0)}px)`);
    }
    ok(g.card && g.card.top >= g.painel.top, `(${rot}) card fora da dock`);
    ok(!!g.busca && !!g.tabs && !!g.titulo, `(${rot}) busca/tabs/título sumiram`);
    ok(g.scrollX <= 0, `(${rot}) scroll HORIZONTAL da aplicação (${g.scrollX}px)`);
    ok(erros.length === 0, `(${rot}) erros de página: ${erros.join(' | ')}`);
    if (vp.width === 1366) await p.screenshot({ path: `${SAIDA}/dock-fit-1366.png` });
  } catch (e) { falhas.push(`exceção (${vp.width}): ${e.message}`); }
  await b.close();
}

// ── A2) moldura REAL do dashboard (onda 1292, #135): janela
//    maximizada `height:100vh` começando abaixo da barra superior +
//    TASKBAR FIXA no rodapé ("Central do sistema") — os dois estouros
//    do screenshot de produção 2026-08-10 ────────────────────────────
for (const vp of [{ width: 1440, height: 900 }, { width: 1300, height: 803 }]) {
  const { navegador: b, pagina: p, erros } = await abrir({
    viewport: vp,
    init: () => {
      localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true }));
      document.addEventListener('DOMContentLoaded', () => {
        const s = document.createElement('style');
        s.textContent = 'body{margin:0;padding:0}'
          + '#host{position:relative;margin-top:48px;height:100vh !important;min-height:0 !important;overflow:hidden}';
        document.head.appendChild(s);
        const barra = document.createElement('div');
        barra.id = 'taskbar-sim';
        barra.style.cssText = 'position:fixed;left:0;right:0;bottom:0;height:40px;background:#111;z-index:50';
        document.body.appendChild(barra);
      });
    },
  });
  try {
    await irParaHarness(p, 'avst-harness.html', 1600);
    const g = await p.evaluate(() => {
      const shell = document.querySelector('.avst5-shell').getBoundingClientRect();
      const card = document.querySelector('.avst5-painel .avst-card')?.getBoundingClientRect();
      const taskTop = document.getElementById('taskbar-sim').getBoundingClientRect().top;
      const ps = document.querySelector('.avst5-painel-scroll');
      return {
        shellBottom: shell.bottom, taskTop,
        cardBottom: card?.bottom ?? -1,
        psExtra: ps ? ps.scrollHeight - ps.clientHeight : -1,
        alt: document.querySelector('.avst5-shell').style.getPropertyValue('--avst5-alt'),
      };
    });
    const rot = `moldura ${vp.width}×${vp.height}`;
    ok(g.alt !== '', `(${rot}) --avst5-alt não medida`);
    ok(g.shellBottom <= g.taskTop + 1,
      `(${rot}) shell invadiu a taskbar fixa (${Math.round(g.shellBottom)} > ${Math.round(g.taskTop)})`);
    ok(g.cardBottom > 0 && g.cardBottom <= g.taskTop + 1,
      `(${rot}) card CORTADO pela taskbar/janela (bottom=${Math.round(g.cardBottom)}, teto=${Math.round(g.taskTop)})`);
    ok(g.psExtra <= 1, `(${rot}) scroll vertical concorrente (${g.psExtra}px)`);
    ok(erros.length === 0, `(${rot}) erros de página: ${erros.join(' | ')}`);
    if (vp.width === 1300) await p.screenshot({ path: `${SAIDA}/dock-fit-moldura.png` });
  } catch (e) { falhas.push(`exceção (moldura ${vp.width}): ${e.message}`); }
  await b.close();
}

// ── B) estados + C) divisor — 1440×900 com chrome ───────────────────
{
  const { navegador: b, pagina: p, erros } = await abrir({ viewport: { width: 1440, height: 900 }, init: CHROME });
  try {
    await irParaHarness(p, 'avst-harness.html', 1200);
    const alturaDock = () => p.evaluate(() => Math.round(document.querySelector('.avst5-painel').getBoundingClientRect().height));
    const cardDentro = () => p.evaluate(() => {
      const d = document.querySelector('.avst5-painel').getBoundingClientRect();
      const c = document.querySelector('.avst5-painel .avst-card')?.getBoundingClientRect();
      return !!c && c.bottom <= d.bottom + 1 && c.top >= d.top - 1;
    });
    const hPadrao = await alturaDock();
    ok(await cardDentro(), 'padrão: card cortado dentro da dock');
    await p.locator('[data-teste="dock-altura"]').click(); // → expandida
    await p.waitForTimeout(400);
    const hExp = await alturaDock();
    ok(hExp > hPadrao + 40, `expandida deveria crescer (${hPadrao}→${hExp})`);
    await p.locator('[data-teste="dock-altura"]').click(); // → compacta
    await p.waitForTimeout(400);
    const hComp = await alturaDock();
    ok(hComp < hPadrao, `compacta deveria ser menor que padrão (${hComp}≥${hPadrao})`);
    ok(await cardDentro(), 'compacta: card cortado');
    await p.screenshot({ path: `${SAIDA}/dock-fit-compacta.png` });
    await p.locator('[data-teste="dock-altura"]').click(); // → padrão
    await p.waitForTimeout(400);

    // C) DIVISOR: drag com pointer capture
    const alca = await p.locator('[data-teste="dock-alca"]').boundingBox();
    ok(!!alca, 'divisor não renderizou');
    const cx = alca.x + alca.width / 2;
    const cy = alca.y + alca.height / 2;
    await p.mouse.move(cx, cy);
    await p.mouse.down();
    await p.mouse.move(cx, cy - 120, { steps: 8 }); // puxa p/ cima = dock maior
    await p.mouse.up();
    await p.waitForTimeout(300);
    const hDrag = await alturaDock();
    ok(hDrag > hPadrao + 80, `drag p/ cima não cresceu a dock (${hPadrao}→${hDrag})`);
    ok(await cardDentro(), 'custom: card cortado após drag');
    const v2 = await p.evaluate(() => JSON.parse(localStorage.getItem('dshow.avst6.dockalt.v2') ?? 'null'));
    ok(v2?.v === 2 && Math.abs(v2.alt - hDrag) <= 3, `persistência v2 divergente (${JSON.stringify(v2)} vs ${hDrag})`);
    // clamp superior: nunca esmaga o preview além de 74% do corpo
    const alca2 = await p.locator('[data-teste="dock-alca"]').boundingBox();
    await p.mouse.move(alca2.x + 40, alca2.y + 3);
    await p.mouse.down();
    await p.mouse.move(alca2.x + 40, 0, { steps: 6 });
    await p.mouse.up();
    await p.waitForTimeout(300);
    const corpoH = await p.evaluate(() => document.querySelector('.avst5-corpo').getBoundingClientRect().height);
    const hMax = await alturaDock();
    ok(hMax <= corpoH * 0.75 + 2, `clamp superior falhou (${hMax} > 75% de ${Math.round(corpoH)})`);
    ok(await cardDentro(), 'clamp superior: card cortado');
    // teclado: setas mudam ±24
    await p.locator('[data-teste="dock-alca"]').focus();
    await p.keyboard.press('ArrowDown');
    await p.waitForTimeout(250);
    const hTecla = await alturaDock();
    ok(Math.abs(hMax - hTecla - 24) <= 3, `ArrowDown deveria descer ~24px (${hMax}→${hTecla})`);
    // duplo clique = volta ao padrão e LIMPA o custom
    await p.locator('[data-teste="dock-alca"]').dblclick();
    await p.waitForTimeout(400);
    ok(Math.abs(await alturaDock() - hPadrao) <= 3, 'duplo clique não voltou ao padrão');
    ok(await p.evaluate(() => localStorage.getItem('dshow.avst6.dockalt.v2')) === null,
      'duplo clique não limpou a preferência custom');
    // valor INVÁLIDO no storage é ignorado (validação da persistência)
    await p.evaluate(() => localStorage.setItem('dshow.avst6.dockalt.v2', JSON.stringify({ v: 1, alt: 9999 })));
    await p.reload({ waitUntil: 'networkidle' });
    await p.waitForFunction(() => window.__pronto === true, { timeout: 20000 });
    await p.waitForTimeout(800);
    ok(await p.evaluate(() => !document.querySelector('.avst5-painel[data-dock-custom]')),
      'preferência inválida (v errada) deveria ser ignorada');
    ok(erros.length === 0, `erros de página (estados): ${erros.join(' | ')}`);
  } catch (e) { falhas.push(`exceção (estados/divisor): ${e.message}`); }
  await b.close();
}

// ── D) barra contextual + E) anúncio — contraste nos DOIS temas ─────
for (const tema of ['dark', 'light']) {
  const { navegador: b, pagina: p } = await abrir({
    viewport: { width: 1440, height: 900 },
    init: () => { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true })); },
  });
  try {
    await irParaHarness(p, 'avst-harness.html', 1200);
    await p.evaluate((tm) => document.documentElement.setAttribute('data-theme', tm), tema);
    await p.waitForTimeout(400);
    const medir = await p.evaluate(() => {
      const fundoDe = (el) => {
        let n = el;
        while (n && n !== document.body) {
          const bg = getComputedStyle(n).backgroundColor;
          if (bg && !bg.includes('0, 0, 0, 0') && bg !== 'transparent') return bg;
          n = n.parentElement;
        }
        return 'rgb(0,0,0)';
      };
      const barra = document.querySelector('[data-teste="ctx-barra"]');
      const span = barra?.querySelector('span');
      const strong = barra?.querySelector('strong');
      return barra && span && strong ? {
        fundo: fundoDe(barra),
        texto: getComputedStyle(span).color,
        titulo: getComputedStyle(strong).color,
        conteudo: barra.textContent,
      } : null;
    });
    ok(!!medir, `(${tema}) barra contextual não renderizou`);
    if (medir) {
      ok(contrasteDe(medir.texto, medir.fundo) >= 4.5,
        `(${tema}) contraste do TEXTO da barra ${contrasteDe(medir.texto, medir.fundo).toFixed(2)}:1 < 4.5:1`);
      ok(contrasteDe(medir.titulo, medir.fundo) >= 4.5,
        `(${tema}) contraste do TÍTULO da barra < 4.5:1`);
      ok(!medir.conteudo.includes('Contexto:'), `(${tema}) barra ainda usa o texto técnico antigo`);
    }
    // troca de categoria atualiza o conteúdo SEM duplicar na pill
    await p.evaluate(() => { [...document.querySelectorAll('.avst5-cat')].find((x) => x.textContent.includes('Olhos'))?.click(); });
    await p.waitForTimeout(500);
    const dupla = await p.evaluate(() => ({
      barra: document.querySelector('[data-teste="ctx-barra"]')?.textContent ?? '',
      pill: document.querySelector('.avst5-anuncio')?.textContent ?? '',
    }));
    ok(dupla.barra.includes('Olhos'), `(${tema}) barra não seguiu a troca de categoria`);
    ok(!dupla.pill.includes('Contexto:'), `(${tema}) dica duplicada na pill de anúncio`);
    // E) pill de anúncio legível (bugfix sem flag): dispara um anúncio real
    await p.evaluate(() => { document.querySelectorAll('.avst5-painel .avst-card')[2]?.click(); });
    await p.waitForTimeout(400);
    const pill = await p.evaluate(() => {
      const el = document.querySelector('.avst5-anuncio');
      if (!el) return null;
      return { texto: getComputedStyle(el).color, fundo: getComputedStyle(el).backgroundColor };
    });
    if (pill) {
      ok(contrasteDe(pill.texto, pill.fundo) >= 4.5,
        `(${tema}) pill de anúncio ilegível (${contrasteDe(pill.texto, pill.fundo).toFixed(2)}:1)`);
    }
    // X dispensa e persiste
    if (tema === 'light') {
      await p.locator('[data-teste="ctx-barra-fechar"]').click();
      await p.waitForTimeout(300);
      ok(await p.evaluate(() => !document.querySelector('[data-teste="ctx-barra"]')), 'X não dispensou a barra');
      ok(await p.evaluate(() => localStorage.getItem('dshow.avst6.ctxbar.v1')) === '0', 'dispensa não persistiu');
      await p.screenshot({ path: `${SAIDA}/dock-fit-light.png` });
    }
  } catch (e) { falhas.push(`exceção (barra ${tema}): ${e.message}`); }
  await b.close();
}

// ── F) rollback §651: flags OFF = geometria #112 byte a byte ────────
{
  const { navegador: b, pagina: p, erros } = await abrir({
    viewport: { width: 1440, height: 900 },
    init: () => {
      localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({
        'as5.novo_shell': true, 'as6.dock_fit': false, 'as6.ctx_barra': false,
      }));
    },
  });
  try {
    await irParaHarness(p, 'avst-harness.html', 1200);
    const g = await p.evaluate(() => ({
      fit: !!document.querySelector('.avst5-shell[data-dock-fit]'),
      corpoH: getComputedStyle(document.querySelector('.avst5-corpo')).height,
      painelH: Math.round(document.querySelector('.avst5-painel').getBoundingClientRect().height),
      alca: !!document.querySelector('[data-teste="dock-alca"]'),
      barra: !!document.querySelector('[data-teste="ctx-barra"]'),
    }));
    ok(!g.fit, 'flag OFF ainda marca [data-dock-fit]');
    ok(g.corpoH === '750px', `flag OFF: corpo deveria voltar a calc(100vh−150px)=750px (veio ${g.corpoH})`);
    ok(g.painelH === 384, `flag OFF: dock deveria voltar aos 384px fixos (veio ${g.painelH})`);
    ok(!g.alca && !g.barra, 'flag OFF ainda monta alça/barra');
    await p.evaluate(() => { [...document.querySelectorAll('.avst5-cat')].find((x) => x.textContent.includes('Olhos'))?.click(); });
    await p.waitForTimeout(400);
    ok(await p.evaluate(() => (document.querySelector('.avst5-anuncio')?.textContent ?? '').includes('Contexto:')),
      'flag OFF: dica deveria voltar à pill de anúncio');
    ok(erros.length === 0, `erros de página (OFF): ${erros.join(' | ')}`);
  } catch (e) { falhas.push(`exceção (OFF): ${e.message}`); }
  await b.close();
}

if (falhas.length) { console.error('[dock-fit] FALHAS:\n- ' + falhas.join('\n- ')); process.exit(1); }
console.log('[dock-fit] FALHAS: nenhuma');
console.log('[dock-fit] ERROS JS: nenhum');
