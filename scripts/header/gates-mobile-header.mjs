#!/usr/bin/env node
// scripts/header/gates-mobile-header.mjs — consolida os audit.json em MÉTRICAS + GATES do lote.
// @version 1.1.0  @created 2026-09-11 (lote as6.mobile_header_v2 — doc 23)
//
// Entrada: um diretório com subpastas de auditoria (cada uma com audit.json), nomeadas por cenário:
//   before-prod/      produção, flag OFF (baseline)
//   off/              preview do candidato, flag OFF  → identidade com before-prod (FLAG_OFF_IDENTITY)
//   on/               preview, flag ON, matriz completa (dark)
//   on-light/ on-safe/ on-ticker-off/ on-rm/ on-zoom/ on-long/ on-badge1/ on-badge3/ on-leak/  variantes
// Saída: <dir>/METRICAS.txt (antes/depois) + <dir>/GATES.txt (PASS/FAIL) + JSON consolidado. Exit 1 se algum gate FAIL.
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const DIR = process.argv[2] || '/tmp/mh2';
const ler = (n) => { const p = join(DIR, n, 'audit.json'); return existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : null; };
const cen = (a) => (a ? a.scenarios.filter((s) => s.ok) : []);
const sum = (arr) => arr.reduce((x, y) => x + y, 0);
const compactos = (a) => cen(a).filter((s) => s.m1?.html?.mode === 'compact' || s.vw <= 768 || (s.vh <= 480));

const gates = {}; const met = {}; const notas = [];
const gate = (k, ok, det = '') => { gates[k] = { ok: !!ok, det }; };

const before = ler('before-prod'), off = ler('off'), on = ler('on');
if (!before || !on) { console.error('faltam before-prod/ e on/'); process.exit(2); }

// ───────── métricas antes/depois (cenários compactos = mobile/tablet) ─────────
const metr = (a) => {
  const cs = compactos(a);
  const ctrl = cs.flatMap((s) => s.m1.controls);
  return {
    cenarios: cs.length,
    controlesVisiveis: ctrl.length,
    controlesMenores44: ctrl.filter((c) => c.minSide < 44).length,
    controlesToqueErrado: ctrl.filter((c) => c.hits < 5).length,
    controlesSemNome: sum(cs.map((s) => s.m1.unnamed)),
    colisoes: sum(cs.map((s) => s.m1.collisions)),
    badgeCortado: sum(cs.map((s) => s.m1.badgeClipped)),
    titulosDuplicados: sum(cs.map((s) => s.m1.dupTitles)),
    overflowDoc: sum(cs.map((s) => s.m1.docOverflow)),
    overlapHeader: sum(cs.map((s) => s.m1.headerOverlap)),
    overlapTicker: sum(cs.map((s) => s.m1.tickerOverlap)),
    mainEscondido: sum(cs.map((s) => s.m1.mainHidden)),
    layoutShiftScroll: sum(cs.map((s) => s.layoutShift)),
    larguraHeaderRight: Math.max(...cs.map((s) => s.m1.controls.reduce((m, c) => Math.max(m, c.x + c.w), 0))),
    alturaTopo375: cs.find((s) => s.vw === 375 && s.route === 'dash')?.m1.rects.main.y ?? null,
    focoFalhas: sum(cs.map((s) => s.focus?.fail ?? 0)),
    consoleErros: sum(cen(a).map((s) => s.cerr.length)),
    pageErros: sum(cen(a).map((s) => s.perr.length)),
    requisicoesFalhas: sum(cen(a).map((s) => s.freq.length)),
    faixasAvatar375: (() => { const s = cs.find((x) => x.vw === 375 && x.route === 'avatar'); if (!s || !s.m1.avatar) return null; let n = 1 /* header */; if (s.m1.tickerVisible) n++; if (s.m1.avatar.contHeaderVisible) n++; if (s.m1.avatar.barra) n++; return n; })(),
    barraVcTop375: cs.find((x) => x.vw === 375 && x.route === 'avatar')?.m1.avatar?.barraTop ?? null,
  };
};
met.antes = metr(before); met.depois = metr(on);

// ───────── gates ─────────
const onC = compactos(on);
const todosOn = cen(on);
gate('HEADER_BOOT', todosOn.length === on.scenarios.length && todosOn.every((s) => s.m1.v2?.active === true), `${todosOn.length}/${on.scenarios.length} cenários montaram com o módulo ativo`);
gate('FLAG_ON_MOBILE', onC.every((s) => s.m1.html.v2attr === 'on' && s.m1.html.mode === 'compact'), `${onC.length} cenários compactos com html[data-mobile-header-v2=on][data-mh2-mode=compact]`);
gate('HEADER_OVERLAP', sum(todosOn.map((s) => s.m1.headerOverlap)) === 0, `soma=${sum(todosOn.map((s) => s.m1.headerOverlap))}`);
gate('TICKER_OVERLAP', sum(todosOn.map((s) => s.m1.tickerOverlap)) === 0, `soma=${sum(todosOn.map((s) => s.m1.tickerOverlap))}`);
gate('MAIN_HIDDEN_BEHIND_HEADER', sum(todosOn.map((s) => s.m1.mainHidden)) === 0, `soma=${sum(todosOn.map((s) => s.m1.mainHidden))}`);
gate('HEADER_TICKER_MAIN_STACK', todosOn.every((s) => s.m1.stackGap === 0), `gaps=${todosOn.map((s) => s.m1.stackGap).join(',')}`);
gate('DOCUMENT_HORIZONTAL_OVERFLOW', sum(todosOn.map((s) => s.m1.docOverflow)) === 0, `soma=${sum(todosOn.map((s) => s.m1.docOverflow))}`);
gate('BODY_OVERFLOW_X', sum(todosOn.map((s) => s.m1.docOverflow)) === 0, 'idem DOCUMENT_HORIZONTAL_OVERFLOW');
const ctrlOn = onC.flatMap((s) => s.m1.controls);
const maisOn = onC.map((s) => s.mais).filter((m) => m && m.open);
gate('TOUCH_TARGETS_44', ctrlOn.every((c) => c.minSide >= 44) && maisOn.every((m) => m.small === 0), `${ctrlOn.filter((c) => c.minSide < 44).length} controles <44 na barra · ${sum(maisOn.map((m) => m.small))} no menu Mais (${maisOn.length} menus medidos)`);
gate('HEADER_TOUCH_FAILURES', ctrlOn.filter((c) => c.minSide < 44).length === 0, '');
gate('WRONG_TOUCH_ACTIVATIONS', ctrlOn.every((c) => c.hits === 5) && maisOn.every((m) => m.wrong === 0) && sum(onC.map((s) => s.m1.collisions)) === 0, `errados=${ctrlOn.filter((c) => c.hits < 5).length} colisões=${sum(onC.map((s) => s.m1.collisions))} menu=${sum(maisOn.map((m) => m.wrong))}`);
gate('UNNAMED_CONTROLS', sum(todosOn.map((s) => s.m1.unnamed)) === 0, `soma=${sum(todosOn.map((s) => s.m1.unnamed))}`);
gate('SCREEN_READER_NAMES', sum(todosOn.map((s) => s.m1.unnamed)) === 0, 'idem UNNAMED_CONTROLS');
gate('BADGE_CLIPPED', sum(todosOn.map((s) => s.m1.badgeClipped)) === 0, `soma=${sum(todosOn.map((s) => s.m1.badgeClipped))}`);
gate('DUPLICATE_VISIBLE_TITLES', sum(todosOn.map((s) => s.m1.dupTitles)) === 0, `soma=${sum(todosOn.map((s) => s.m1.dupTitles))}`);
gate('LAYOUT_SHIFT_ON_SCROLL', sum(todosOn.map((s) => s.layoutShift)) === 0, `soma=${sum(todosOn.map((s) => s.layoutShift))}`);
const focos = todosOn.map((s) => s.focus).filter(Boolean);
gate('KEYBOARD', focos.every((f) => (f.checked ?? 0) >= 3), `controles alcançados por Tab: ${focos.map((f) => f.checked).join(',')}`);
gate('VISIBLE_FOCUS', sum(focos.map((f) => f.fail ?? 0)) === 0, `falhas=${sum(focos.map((f) => f.fail ?? 0))}`);
gate('FOCUS_VISIBLE_FAILURES', sum(focos.map((f) => f.fail ?? 0)) === 0, '');
gate('MENU_MAIS', maisOn.length > 0 && maisOn.every((m) => m.inViewport && m.closedByEscape && m.focusInside), `${maisOn.length} menus: dentro do viewport=${maisOn.every((m) => m.inViewport)} esc=${maisOn.every((m) => m.closedByEscape)}`);
gate('POPOVERS_NOT_CLIPPED', todosOn.every((s) => !s.menu || !s.menu.open || s.menu.inViewport), 'menu de perfil dentro do viewport em todos');
// console/erros: NOVOS em relação ao baseline (a produção já tem erros de fetch pré-existentes, não deste lote)
const assin = (s) => s.cerr.map((t) => t.replace(/\[cid-[a-z0-9]+\]/g, '').replace(/\d{1,2}\/\d{1,2}\/\d{4}, \d{2}:\d{2}:\d{2}/g, '').replace(/\[[\d :.-]+\]/g, '').trim().slice(0, 90));
// baseline de console = produção OFF ∪ preview OFF (mesmo ambiente do candidato com o módulo INATIVO): um erro que
// ocorre com a flag OFF é ruído do ambiente (ex.: 'Error loading user permissions' intermitente), não deste lote
const baseAssin = new Set([...cen(before), ...(off ? cen(off) : [])].flatMap(assin));
const novosCerr = todosOn.flatMap((s) => assin(s).filter((a) => ![...baseAssin].some((b) => a.startsWith(b.slice(0, 60)))));
gate('CONSOLE_ERRORS', novosCerr.length === 0, `novos vs baseline=${novosCerr.length} (baseline total=${sum(cen(before).map((s) => s.cerr.length))}, candidato total=${sum(todosOn.map((s) => s.cerr.length))})${novosCerr.length ? ' :: ' + novosCerr.slice(0, 3).join(' | ') : ''}`);
gate('PAGE_ERRORS', sum(todosOn.map((s) => s.perr.length)) === 0, `soma=${sum(todosOn.map((s) => s.perr.length))}`);
const baseReq = new Set([...cen(before), ...(off ? cen(off) : [])].flatMap((s) => s.freq.map((u) => u.replace(/^https?:\/\/[^/]+/, ''))));
const novosReq = todosOn.flatMap((s) => s.freq.map((u) => u.replace(/^https?:\/\/[^/]+/, '')).filter((u) => !baseReq.has(u)));
gate('FAILED_REQUESTS_RELEVANT', novosReq.length === 0, `novas falhas vs baseline=${novosReq.length}${novosReq.length ? ' :: ' + [...new Set(novosReq)].slice(0, 4).join(' | ') : ''}`);
// desktop parity (1440): geometria do topo idêntica com flag OFF (prod) e ON (candidato)
const d0 = cen(before).find((s) => s.vw === 1440 && s.route === 'dash'), d1 = todosOn.find((s) => s.vw === 1440 && s.route === 'dash');
// controles comparados como CONJUNTO (sel + tamanho + y): a ordem/x dos filhos de .header-right varia entre boots da própria prod
const geo = (cs) => JSON.stringify(cs.map((c) => `${c.sel}|${c.w}x${c.h}|y${c.y}`).sort());
const parity = d0 && d1 && ['headerRegion', 'ticker', 'main'].every((k) => JSON.stringify(d0.m1.rects[k]) === JSON.stringify(d1.m1.rects[k])) && d0.m1.controls.length === d1.m1.controls.length && geo(d0.m1.controls) === geo(d1.m1.controls) && d1.m1.html.mode === 'wide';
gate('DESKTOP_PARITY', parity, d0 && d1 ? `1440: regiões ${['headerRegion', 'ticker', 'main'].map((k) => JSON.stringify(d0.m1.rects[k]) === JSON.stringify(d1.m1.rects[k]) ? 'ok' : k + '≠').join('/')} · controles ${d0.m1.controls.length}→${d1.m1.controls.length} geometria(sel,w,h,y)=${geo(d0.m1.controls) === geo(d1.m1.controls) ? 'idêntica' : 'DIFERE'} · modo=${d1.m1.html.mode}` : 'cenário 1440 ausente');
// flag OFF identity: preview OFF == prod OFF (geometria, tokens, controles, meta, atributos)
if (off) {
  const pares = cen(off).map((s) => [s, cen(before).find((b) => b.tag === s.tag)]).filter(([, b]) => b);
  // a ORDEM dos filhos de .header-right varia entre boots na própria produção (corrida entre header-components.bundle e os
  // botões standalone hie-*/traffic — medido: 5/18 boots diferem com o módulo INATIVO) → comparação insensível à ordem
  const multiset = (arr) => JSON.stringify(arr.slice().sort());
  const ctrlSet = (cs) => multiset(cs.map((c) => `${c.sel}|${c.w}x${c.h}`));
  const iguais = pares.filter(([s, b]) => JSON.stringify(s.m1.rects) === JSON.stringify(b.m1.rects) && JSON.stringify(s.m1.tokens) === JSON.stringify(b.m1.tokens) && s.m1.meta === b.m1.meta && s.m1.html.v2attr === null && s.m1.v2 && s.m1.v2.active === false && multiset(s.m1.headerRightChildren) === multiset(b.m1.headerRightChildren) && ctrlSet(s.m1.controls) === ctrlSet(b.m1.controls));
  gate('FLAG_OFF_IDENTITY', pares.length > 0 && iguais.length === pares.length, `${iguais.length}/${pares.length} cenários idênticos (rects+tokens+meta+atributos+conjunto de componentes+controles c/ geometria; ordem dos filhos ignorada — corrida pré-existente); módulo presente e inativo=${cen(off).every((s) => s.m1.v2 && s.m1.v2.active === false)}`);
} else gate('FLAG_OFF_IDENTITY', false, 'off/ ausente');
// safe area
const safe = ler('on-safe');
if (safe) {
  const cs = compactos(safe);
  const ok = cs.every((s) => s.m1.headerOverlap === 0 && s.m1.stackGap === 0 && s.m1.underSafe === 0 && s.m1.rects.headerRegion.h === (parseFloat(s.m1.tokens['--shell-header-content-height']) || 56) + Number(safe.safeTop) /* conteúdo (56 ≤768 · 60 acima, ex.: landscape 844) + safe, contado UMA vez */ && s.m1.rects.siteHeader.y === Number(safe.safeTop));
  gate('SAFE_AREA_TOP', cs.length > 0 && ok, `safe=${safe.safeTop}px: região=${cs.map((s) => s.m1.rects.headerRegion.h).join(',')} · conteúdo começa em y=${cs.map((s) => s.m1.rects.siteHeader.y).join(',')} · controles acima da safe=${sum(cs.map((s) => s.m1.underSafe))} · barra VC y=${cs.filter((s) => s.route === 'avatar').map((s) => s.m1.avatar?.barraTop).join(',')} padTop=${cs.filter((s) => s.route === 'avatar').map((s) => s.m1.avatar?.barraPadTop).join(',')}`);
  const land = cs.filter((s) => s.vw > s.vh);
  gate('SAFE_AREA_LANDSCAPE', land.length > 0 && land.every((s) => s.m1.headerOverlap === 0 && s.m1.stackGap === 0 && s.m1.underSafe === 0 && s.m1.docOverflow === 0), `${land.length} cenários landscape com safe simulada`);
} else { gate('SAFE_AREA_TOP', false, 'on-safe/ ausente'); gate('SAFE_AREA_LANDSCAPE', false, 'on-safe/ ausente'); }
// ticker oculto → espaço some
const tOff = ler('on-ticker-off');
gate('TICKER_HIDDEN_COLLAPSES', !!tOff && cen(tOff).length > 0 && cen(tOff).every((s) => s.m1.tickerVisible === false && s.m1.html.tickerAttr === 'off' && s.m1.stackGap === 0 && s.m1.rects.main.y === s.m1.rects.headerRegion.b), tOff ? `main.y=${cen(tOff).map((s) => s.m1.rects.main.y).join(',')} header.b=${cen(tOff).map((s) => s.m1.rects.headerRegion.b).join(',')}` : 'on-ticker-off/ ausente');
// Avatar Studio: uma identidade dominante + título externo na a11y + barra sem safe duplicada
const av = todosOn.filter((s) => s.route === 'avatar' && s.m1.avatar);
gate('AVATAR_STUDIO_INTEGRATION', av.length > 0 && av.filter((s) => s.m1.html.mode === 'compact').every((s) => s.m1.avatar.contAttr === 'owned' && s.m1.avatar.contHeaderVisible === false && s.m1.avatar.contTitleInA11y === true && s.m1.avatar.contTitleRole === 'heading' && s.m1.dupTitles === 0 && (s.m1.avatar.barraPadTop === '8px' || s.m1.avatar.barraPadTop === '10px') /* 8px = media ≤767; 10px = base (landscape/tablet); nunca 8/10+safe */) && av.filter((s) => s.m1.html.mode === 'wide').every((s) => s.m1.avatar.contAttr === 'owned' && s.m1.avatar.contHeaderVisible === true), `${av.length} cenários AS · compactos: ext oculto=${av.filter((s) => s.m1.html.mode === 'compact').every((s) => s.m1.avatar.contHeaderVisible === false)} heading=${av.filter((s) => s.m1.html.mode === 'compact').every((s) => s.m1.avatar.contTitleRole === 'heading')} padTop=${[...new Set(av.map((s) => s.m1.avatar.barraPadTop))].join('/')} · desktop: ext visível=${av.filter((s) => s.m1.html.mode === 'wide').every((s) => s.m1.avatar.contHeaderVisible === true)}`);
// leak / restauração
const lk = ler('on-leak');
const L = lk ? cen(lk).map((s) => s.leak).filter(Boolean) : [];
gate('LISTENER_OR_OBSERVER_LEAKS', L.length > 0 && L.every((l) => l.before && l.after && l.before.listeners === l.after.listeners && l.before.observers === l.after.observers && l.before.moved === l.after.moved && l.restored.info.listeners === 0 && l.restored.info.observers === 0 && l.restored.info.moved === 0 && l.restored.info.a11yPatches === 0 && l.restored.more === false && l.restored.css === false && !/data-mobile-header-v2|data-shell-ticker|data-mh2/.test(l.restored.html) && l.restored.notifRole === null && l.restored.right >= l.before.moved + 1 /* todos os movidos devolvidos + botão Mais/menu removidos (o wrapper count não serve: movidos incluem botões standalone) */ && l.reactivated.active === true && l.reactivated.observers === l.before.observers && l.reactivated.listeners === l.before.listeners), L.length ? L.map((l) => `right OFF=${l.restored?.right} (movidos=${l.before?.moved}) · 3 trocas: listeners ${l.before?.listeners}→${l.after?.listeners} observers ${l.before?.observers}→${l.after?.observers} moved ${l.before?.moved}→${l.after?.moved} · deactivate: ${JSON.stringify({ l: l.restored?.info.listeners, o: l.restored?.info.observers, m: l.restored?.info.moved, css: l.restored?.css, more: l.restored?.more, meta: l.restored?.meta })} · reactivate ×2: o=${l.reactivated?.observers} l=${l.reactivated?.listeners}`).join(' || ') : 'on-leak/ ausente');
// variantes: reduced motion / zoom / nome longo / badge / light — todas sem overflow, sem toque <44, sem títulos duplicados
for (const [nome, dir] of [['REDUCED_MOTION', 'on-rm'], ['ZOOM_200', 'on-zoom'], ['LONG_NAME', 'on-long'], ['BADGE_1', 'on-badge1'], ['BADGE_3', 'on-badge3'], ['LIGHT_THEME', 'on-light']]) {
  const a = ler(dir); const cs = a ? compactos(a) : [];
  const ok = cs.length > 0 && cs.every((s) => s.m1.docOverflow === 0 && s.m1.headerOverlap === 0 && s.m1.stackGap === 0 && s.m1.controls.every((c) => c.minSide >= 44 && c.hits === 5) && s.m1.badgeClipped === 0 && s.m1.dupTitles === 0 && s.layoutShift === 0);
  const extra = dir === 'on-light' ? (cs.every((s) => s.m1.html.theme === 'light') ? ' tema=light confirmado' : ' TEMA NÃO É LIGHT') : dir.startsWith('on-badge') ? ` badge=${[...new Set(cs.map((s) => s.m1.badgeInfo?.text))].join('/')} pe=${[...new Set(cs.map((s) => s.m1.badgeInfo?.pe))].join('/')}` : dir === 'on-long' ? ` nome truncado: ${cs.every((s) => s.m1.controls.find((c) => c.sel.includes('user-menu'))?.w <= s.vw) ? 'ok' : 'ESTOURA'}` : '';
  gate(nome, ok && (dir !== 'on-light' || cs.every((s) => s.m1.html.theme === 'light')), `${cs.length} cenários${extra}`);
}

const falhas = Object.entries(gates).filter(([, g]) => !g.ok).map(([k]) => k);
const linhas = [];
linhas.push('# MÉTRICAS — antes (produção, flag OFF) → depois (candidato, flag ON) · cenários compactos (≤768 / landscape phone / tablet)');
for (const k of Object.keys(met.antes)) linhas.push(`${k.padEnd(26)} ${String(met.antes[k]).padStart(8)}  →  ${String(met.depois[k]).padStart(8)}`);
writeFileSync(join(DIR, 'METRICAS.txt'), linhas.join('\n') + '\n');
const gl = Object.entries(gates).map(([k, g]) => `${k}=${g.ok ? 'PASS' : 'FAIL'}${g.det ? '   # ' + g.det : ''}`);
writeFileSync(join(DIR, 'GATES.txt'), gl.join('\n') + '\n');
writeFileSync(join(DIR, 'consolidado.json'), JSON.stringify({ metricas: met, gates, geradoEm: new Date().toISOString() }, null, 1));
console.log(linhas.join('\n')); console.log(''); console.log(gl.join('\n'));
console.log(falhas.length ? `\nGATES_FAIL=${falhas.join(',')}` : '\nGATES_ALL_PASS');
process.exit(falhas.length ? 1 : 0);
