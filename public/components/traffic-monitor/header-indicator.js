/**
 * TrafficHeaderIndicator — indicador de trânsito de São Paulo no header (standalone).
 * @version 2.0.0
 * @changelog v2.0.0 — Correção visual light/dark (briefing UX §3–§9): container com tokens
 *   de superfície do header (sem fundo preto no light), popover rico no lugar do tooltip
 *   (hierarquia, ícones Lucide inline, ação "Abrir painel"), estados de carregando /
 *   desatualizado / erro / sem dados, interação por hover + clique + Esc + teclado,
 *   posicionamento com clamp de viewport, aria-expanded/aria-controls.
 * @description Auto-injeta um botão no `.header-right` (padrão theme-toggle, zero dependência
 *   de bundle/registry do header), faz polling de /api/traffic/summary.php e, ao clicar na
 *   ação do popover, navega para `#/panel-transito-sp` (via navigateToRoute → nav.intent).
 *   Cor NUNCA é o único sinal (badge textual + aria-label + valor).
 */
'use strict';

import { navigateToRoute } from '/components/header/components/_base/navigation-helper.js';

const MODULE_ID = 'traffic-header-indicator';
const ROUTE = '#/panel-transito-sp';
const SUMMARY_URL = '/api/traffic/summary.php';
const POLL_MS = 60000;          // trânsito "ao vivo"
const FETCH_TIMEOUT_MS = 8000;
const STALE_MS = 15 * 60000;    // dados com mais de 15 min = desatualizados
const BTN_ATTR = 'data-traffic-indicator';
const POP_ID = 'traffic-popover';
const HOVER_OPEN_MS = 150;
const HOVER_CLOSE_MS = 260;

let _timer = null;
let _ensureTimer = null;
let _lastFetch = 0;
let _loading = false;
let _fetchError = false;
let _state = { level: 'unavailable', index: null, km: null, incidents: null, closures: null, updatedAt: null, stale: false };
let _hasData = false;           // já recebemos ao menos um payload válido?

// ── Ícones (Lucide, inline — o header não usa bundle React) ───────────
const svg = (inner, size) =>
  `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;

const IC = {
  car: svg('<path d="m21 8-2 2-1.5-3.7A2 2 0 0 0 15.646 5H8.4a2 2 0 0 0-1.903 1.257L5 10 3 8"/><path d="M7 14h.01"/><path d="M17 14h.01"/><rect width="18" height="8" x="3" y="10" rx="2"/><path d="M5 18v2"/><path d="M19 18v2"/>', 16),
  gauge: svg('<path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/>', 14),
  alerta: svg('<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>', 14),
  interdicao: svg('<rect x="2" y="6" width="20" height="8" rx="1"/><path d="M17 14v7"/><path d="M7 14v7"/><path d="M17 3v3"/><path d="M7 3v3"/><path d="M10 14 2.3 6.3"/><path d="m14 6 7.7 7.7"/><path d="m8 6 8 8"/>', 14),
  relogio: svg('<circle cx="12" cy="12" r="10"/><path d="M12 6v6h4"/>', 14),
  atualizar: svg('<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>', 13),
  seta: svg('<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>', 13),
  erro: svg('<circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/>', 14),
};

const LEVEL_PT = { normal: 'Normal', moderate: 'Moderado', intense: 'Intenso', unavailable: 'Indisponível' };

// ── Estilos (tokens do header em ambos os temas; sem hardcode de tema) ─
function injectStyleOnce() {
  if (document.getElementById('traffic-indicator-style')) return;
  const st = document.createElement('style');
  st.id = 'traffic-indicator-style';
  st.textContent = `
/* ── Botão do header ─────────────────────────────────────────── */
.traffic-indicator{position:relative;z-index:20;display:inline-flex;align-items:center;gap:8px;height:36px;padding:0 11px;margin:0 4px;border-radius:10px;cursor:pointer;border:1px solid var(--hdr-border,rgba(255,255,255,.08));background:var(--hdr-bg,transparent);color:var(--hdr-text-muted,rgba(255,255,255,.65));transition:background .15s ease,color .15s ease,border-color .15s ease,box-shadow .15s ease;font:600 13px/1 system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;}
.traffic-indicator:hover{color:var(--hdr-text,rgba(255,255,255,.95));background:var(--hdr-bg-scrolled,rgba(255,255,255,.06));border-color:var(--hdr-border-accent,rgba(99,102,241,.4));box-shadow:0 1px 4px rgba(0,0,0,.12);}
.traffic-indicator:focus-visible{outline:2px solid var(--hdr-active,#6366f1);outline-offset:2px;}
.traffic-indicator[aria-expanded="true"]{color:var(--hdr-text,rgba(255,255,255,.95));background:var(--hdr-bg-scrolled,rgba(255,255,255,.06));border-color:var(--hdr-border-accent,rgba(99,102,241,.45));}
.traffic-indicator svg{display:block;pointer-events:none;flex:0 0 auto;}
.traffic-indicator .ti-dot{width:8px;height:8px;border-radius:50%;flex:0 0 auto;background:var(--ti-color,#9ca3af);box-shadow:0 0 5px var(--ti-glow,transparent);}
.traffic-indicator .ti-value{min-width:16px;text-align:center;color:var(--ti-color,inherit);font-variant-numeric:tabular-nums;font-weight:700;}
.traffic-indicator.is-loading .ti-dot{animation:ti-pulse 1.1s ease-in-out infinite;}
@keyframes ti-pulse{50%{opacity:.35;}}
.traffic-indicator[data-status="normal"]{--ti-color:var(--hdr-success,#22c55e);--ti-glow:color-mix(in srgb,var(--hdr-success,#22c55e) 50%,transparent);}
.traffic-indicator[data-status="moderate"]{--ti-color:var(--hdr-warning,#eab308);--ti-glow:color-mix(in srgb,var(--hdr-warning,#eab308) 50%,transparent);}
.traffic-indicator[data-status="intense"]{--ti-color:var(--hdr-danger,#ef4444);--ti-glow:color-mix(in srgb,var(--hdr-danger,#ef4444) 55%,transparent);}
.traffic-indicator[data-status="unavailable"]{--ti-color:var(--hdr-text-muted,#9ca3af);--ti-glow:transparent;}

/* ── Popover ─────────────────────────────────────────────────── */
.traffic-pop{--tp-bg:#17171d;--tp-border:rgba(255,255,255,.1);--tp-text:rgba(255,255,255,.92);--tp-muted:rgba(255,255,255,.55);--tp-row:rgba(255,255,255,.04);--tp-link:#818cf8;
position:fixed;z-index:9999;width:320px;padding:14px;border-radius:12px;background:var(--tp-bg);color:var(--tp-text);border:1px solid var(--tp-border);box-shadow:0 12px 32px rgba(0,0,0,.35);font:400 12.5px/1.5 system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;opacity:0;transform:translateY(-4px);pointer-events:none;transition:opacity .14s ease,transform .14s ease;}
.traffic-pop[data-show="1"]{opacity:1;transform:translateY(0);pointer-events:auto;}
:root[data-theme="light"] .traffic-pop,:root.theme-light .traffic-pop{--tp-bg:#ffffff;--tp-border:rgba(0,0,0,.12);--tp-text:rgba(0,0,0,.88);--tp-muted:rgba(0,0,0,.55);--tp-row:rgba(0,0,0,.035);--tp-link:#4f46e5;box-shadow:0 12px 28px rgba(15,23,42,.16);}
.traffic-pop .tp-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:10px;}
.traffic-pop .tp-title{font-weight:700;font-size:13px;}
.traffic-pop .tp-badge{padding:2px 9px;border-radius:12px;font-size:10.5px;font-weight:700;color:var(--tp-lv,#9ca3af);background:color-mix(in srgb,var(--tp-lv,#9ca3af) 14%,transparent);white-space:nowrap;}
.traffic-pop[data-level="normal"]{--tp-lv:var(--hdr-success,#22c55e);}
.traffic-pop[data-level="moderate"]{--tp-lv:var(--hdr-warning,#eab308);}
.traffic-pop[data-level="intense"]{--tp-lv:var(--hdr-danger,#ef4444);}
.traffic-pop .tp-indice{display:flex;align-items:baseline;justify-content:space-between;gap:8px;padding:9px 11px;border-radius:9px;background:var(--tp-row);margin-bottom:9px;}
.traffic-pop .tp-indice-rot{font-size:11px;color:var(--tp-muted);font-weight:600;}
.traffic-pop .tp-indice-val{font-size:19px;font-weight:800;color:var(--tp-lv,var(--tp-text));font-variant-numeric:tabular-nums;}
.traffic-pop .tp-indice-val small{font-size:11.5px;font-weight:600;color:var(--tp-muted);}
.traffic-pop .tp-rows{display:flex;flex-direction:column;gap:6px;margin-bottom:10px;}
.traffic-pop .tp-row{display:flex;align-items:center;gap:8px;}
.traffic-pop .tp-row svg{flex:0 0 auto;color:var(--tp-muted);}
.traffic-pop .tp-row strong{font-variant-numeric:tabular-nums;}
.traffic-pop .tp-row.tp-muted{color:var(--tp-muted);font-size:11.5px;}
.traffic-pop .tp-aviso{display:flex;align-items:center;gap:7px;padding:7px 10px;border-radius:8px;font-size:11.5px;margin-bottom:9px;color:var(--hdr-warning,#eab308);background:color-mix(in srgb,var(--hdr-warning,#eab308) 11%,transparent);}
.traffic-pop .tp-aviso.tp-erro{color:var(--hdr-danger,#ef4444);background:color-mix(in srgb,var(--hdr-danger,#ef4444) 10%,transparent);}
.traffic-pop .tp-aviso svg{flex:0 0 auto;}
.traffic-pop .tp-retry{margin-left:auto;display:inline-flex;align-items:center;gap:4px;border:0;background:transparent;color:inherit;font:700 11px/1 inherit;cursor:pointer;padding:3px 6px;border-radius:6px;}
.traffic-pop .tp-retry:hover{background:color-mix(in srgb,currentColor 12%,transparent);}
.traffic-pop .tp-acao{display:flex;align-items:center;gap:6px;width:100%;border:0;background:transparent;color:var(--tp-link);font:700 12.5px/1 inherit;cursor:pointer;padding:9px 4px 2px;border-top:1px solid var(--tp-border);margin-top:2px;}
.traffic-pop .tp-acao:hover{text-decoration:underline;}
.traffic-pop .tp-acao:focus-visible{outline:2px solid var(--hdr-active,#6366f1);outline-offset:2px;border-radius:6px;}
.traffic-pop .tp-spin{display:inline-block;width:11px;height:11px;border:2px solid var(--tp-border);border-top-color:var(--tp-muted);border-radius:50%;animation:ti-spin .8s linear infinite;}
@keyframes ti-spin{to{transform:rotate(360deg);}}
@media (prefers-reduced-motion:reduce){.traffic-pop,.traffic-indicator{transition-duration:.01ms!important;}.traffic-indicator.is-loading .ti-dot,.traffic-pop .tp-spin{animation-duration:1.5s;}}
`;
  document.head.appendChild(st);
}

// ── Botão ──────────────────────────────────────────────────────────────
function makeButton() {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'traffic-indicator';
  btn.setAttribute(BTN_ATTR, '1');
  btn.setAttribute('data-status', 'unavailable');
  btn.setAttribute('data-uarps-trigger', 'trigger:header:open-traffic');
  btn.setAttribute('aria-haspopup', 'dialog');
  btn.setAttribute('aria-expanded', 'false');
  btn.setAttribute('aria-controls', POP_ID);
  btn.innerHTML = `<span class="ti-dot"></span>${IC.car}<span class="ti-value">--</span>`;
  return btn;
}

function ensureButton() {
  const right = document.querySelector('.header-right');
  if (!right) return false;
  if (!right.querySelector('[' + BTN_ATTR + ']')) {
    injectStyleOnce();
    right.insertBefore(makeButton(), right.firstChild);
    paintAll();
  }
  return true;
}

function ariaLabel() {
  const s = _state;
  if (s.index === null) return 'Trânsito em São Paulo: dados indisponíveis. Abrir detalhes.';
  return `Trânsito em São Paulo: ${LEVEL_PT[s.level] || s.level}, índice ${s.index} de 100. Abrir detalhes.`;
}

function relTime(iso) {
  try {
    const t = new Date(iso).getTime();
    const diff = Math.max(0, Date.now() - t);
    const min = Math.round(diff / 60000);
    if (min <= 0) return 'agora';
    if (min === 1) return 'há 1 minuto';
    if (min < 60) return `há ${min} minutos`;
    const h = Math.round(min / 60);
    return h === 1 ? 'há 1 hora' : `há ${h} horas`;
  } catch (e) { return ''; }
}

function isStale() {
  if (_state.stale) return true;
  if (!_state.updatedAt) return false;
  try { return Date.now() - new Date(_state.updatedAt).getTime() > STALE_MS; } catch (e) { return false; }
}

function paintAll() {
  const list = document.querySelectorAll('[' + BTN_ATTR + ']');
  for (let i = 0; i < list.length; i++) {
    const b = list[i];
    b.setAttribute('data-status', _state.level || 'unavailable');
    b.classList.toggle('is-loading', _loading);
    const val = b.querySelector('.ti-value');
    if (val) val.textContent = (_state.index === null || _state.index === undefined) ? '—' : String(_state.index);
    b.setAttribute('aria-label', ariaLabel());
    b.removeAttribute('title'); // tooltip nativo não deve competir com o popover
  }
  if (_pop && _pop.getAttribute('data-show') === '1') renderPop();
}

// ── Popover ────────────────────────────────────────────────────────────
let _pop = null;
let _pinned = false;
let _openTimer = null;
let _closeTimer = null;

function ensurePop() {
  if (_pop) return _pop;
  _pop = document.createElement('div');
  _pop.id = POP_ID;
  _pop.className = 'traffic-pop';
  _pop.setAttribute('role', 'dialog');
  _pop.setAttribute('aria-label', 'Detalhes do trânsito em São Paulo');
  _pop.addEventListener('mouseenter', () => clearTimeout(_closeTimer));
  _pop.addEventListener('mouseleave', () => { if (!_pinned) scheduleClose(); });
  _pop.addEventListener('click', (ev) => {
    const acao = ev.target.closest('[data-tp-acao]');
    if (acao) { closePop(); navigateToRoute(ROUTE, MODULE_ID); return; }
    const retry = ev.target.closest('[data-tp-retry]');
    if (retry) { fetchSummary(); renderPop(); }
  });
  document.body.appendChild(_pop);
  return _pop;
}

function renderPop() {
  const pop = ensurePop();
  const s = _state;
  pop.setAttribute('data-level', s.level || 'unavailable');
  const partes = [];

  // Cabeçalho (§7.1)
  const badge = s.index === null
    ? '<span class="tp-badge">Indisponível</span>'
    : `<span class="tp-badge">${LEVEL_PT[s.level] || s.level}</span>`;
  partes.push(`<div class="tp-head"><span class="tp-title">Trânsito em São Paulo</span>${badge}</div>`);

  // Avisos de estado (§9)
  if (_loading) {
    partes.push('<div class="tp-aviso" style="color:var(--tp-muted);background:var(--tp-row);"><span class="tp-spin" aria-hidden></span> Atualizando…</div>');
  } else if (_fetchError && _hasData) {
    partes.push(`<div class="tp-aviso tp-erro">${IC.erro} Não foi possível atualizar <button type="button" class="tp-retry" data-tp-retry>${IC.atualizar} Tentar de novo</button></div>`);
  } else if (isStale() && _hasData) {
    partes.push(`<div class="tp-aviso">${IC.relogio} Dados desatualizados <button type="button" class="tp-retry" data-tp-retry>${IC.atualizar} Atualizar</button></div>`);
  }

  if (s.index === null) {
    // Sem dados (§9.4) — nunca mostrar 0
    if (!_loading && !_fetchError) partes.push('<div class="tp-rows"><div class="tp-row tp-muted">Trânsito indisponível no momento.</div></div>');
    if (_fetchError && !_hasData) partes.push(`<div class="tp-aviso tp-erro">${IC.erro} Não foi possível atualizar <button type="button" class="tp-retry" data-tp-retry>${IC.atualizar} Tentar de novo</button></div>`);
  } else {
    // Índice principal (§7.2)
    partes.push(`<div class="tp-indice"><span class="tp-indice-rot">Índice geral</span><span class="tp-indice-val">${s.index}<small>/100</small></span></div>`);
    // Informações com ícones (§7.3)
    const rows = [];
    if (s.km !== null && s.km !== undefined) rows.push(`<div class="tp-row">${IC.gauge}<span>Estimativa de lentidão: <strong>${s.km} km</strong></span></div>`);
    if (s.incidents !== null && s.incidents !== undefined) rows.push(`<div class="tp-row">${IC.alerta}<span>Ocorrências ativas: <strong>${s.incidents}</strong></span></div>`);
    if (s.closures) rows.push(`<div class="tp-row">${IC.interdicao}<span>Interdições: <strong>${s.closures}</strong></span></div>`);
    if (s.updatedAt) rows.push(`<div class="tp-row tp-muted">${IC.relogio}<span>Atualizado ${relTime(s.updatedAt)}</span></div>`);
    if (rows.length) partes.push(`<div class="tp-rows">${rows.join('')}</div>`);
  }

  // Ação (§7.4)
  partes.push(`<button type="button" class="tp-acao" data-tp-acao>Abrir painel de Trânsito ${IC.seta}</button>`);
  pop.innerHTML = partes.join('');
}

function positionPop(btn) {
  const pop = ensurePop();
  const r = btn.getBoundingClientRect();
  const w = 320;
  const margem = 8;
  // alinhado pela direita do botão, sem sair da viewport (§6.3)
  let left = r.right - w;
  left = Math.max(margem, Math.min(left, window.innerWidth - w - margem));
  pop.style.top = Math.round(r.bottom + 8) + 'px';
  pop.style.left = Math.round(left) + 'px';
}

function openPop(btn) {
  clearTimeout(_openTimer); clearTimeout(_closeTimer);
  renderPop();
  positionPop(btn);
  ensurePop().setAttribute('data-show', '1');
  btn.setAttribute('aria-expanded', 'true');
}

function closePop() {
  clearTimeout(_openTimer); clearTimeout(_closeTimer);
  _pinned = false;
  if (_pop) _pop.setAttribute('data-show', '0');
  const list = document.querySelectorAll('[' + BTN_ATTR + ']');
  for (let i = 0; i < list.length; i++) list[i].setAttribute('aria-expanded', 'false');
}

function isOpen() { return !!_pop && _pop.getAttribute('data-show') === '1'; }
function scheduleClose() { clearTimeout(_closeTimer); _closeTimer = setTimeout(() => { if (!_pinned) closePop(); }, HOVER_CLOSE_MS); }

// ── Fetch ──────────────────────────────────────────────────────────────
async function fetchSummary() {
  if (document.hidden) return;
  _lastFetch = Date.now();
  _loading = true;
  paintAll();
  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(SUMMARY_URL, { signal: ctrl.signal, headers: { 'Accept': 'application/json' } });
    clearTimeout(to);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const j = await res.json();
    if (!j || j.ok !== true || !j.data) throw new Error('payload inválido');
    const d = j.data;
    _state = {
      level: d.level || 'unavailable',
      index: (d.trafficIndex === null || d.trafficIndex === undefined) ? null : Number(d.trafficIndex),
      km: (d.estimatedCongestionKm === null || d.estimatedCongestionKm === undefined) ? null : d.estimatedCongestionKm,
      incidents: (d.activeIncidents === null || d.activeIncidents === undefined) ? null : d.activeIncidents,
      closures: d.closures || 0,
      updatedAt: d.updatedAt || null,
      stale: !!d.stale,
    };
    _hasData = _state.index !== null;
    _fetchError = false;
  } catch (e) {
    clearTimeout(to);
    _fetchError = true;
    // preserva o último dado válido (§9.1); sem dado nenhum → indisponível
    if (!_hasData) _state = { ..._state, level: 'unavailable', index: null };
  }
  _loading = false;
  paintAll();
}

// ── Eventos ────────────────────────────────────────────────────────────
function btnDe(ev) { return ev.target && ev.target.closest ? ev.target.closest('[' + BTN_ATTR + ']') : null; }

function onClick(ev) {
  const b = btnDe(ev);
  if (b) {
    ev.preventDefault();
    ev.stopPropagation();
    if (isOpen() && _pinned) { closePop(); return; }
    _pinned = true;
    openPop(b);
    return;
  }
  // clique fora fecha (o clique dentro do popover é tratado no listener do próprio popover)
  if (isOpen() && _pop && !_pop.contains(ev.target)) closePop();
}
function onOver(ev) {
  const b = btnDe(ev);
  if (!b) return;
  clearTimeout(_closeTimer);
  if (isOpen()) return;
  _openTimer = setTimeout(() => openPop(b), HOVER_OPEN_MS);
}
function onOut(ev) {
  const b = btnDe(ev);
  if (!b) return;
  clearTimeout(_openTimer);
  if (!_pinned) scheduleClose();
}
function onKey(ev) {
  if (ev.key === 'Escape' && isOpen()) { closePop(); }
}

function start() {
  document.addEventListener('click', onClick, true);
  document.addEventListener('mouseover', onOver, true);
  document.addEventListener('mouseout', onOut, true);
  document.addEventListener('keydown', onKey, true);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && Date.now() - _lastFetch > POLL_MS / 2) fetchSummary();
  });
  window.addEventListener('resize', () => { if (isOpen()) { const b = document.querySelector('[' + BTN_ATTR + ']'); if (b) positionPop(b); } });
  ensureButton();
  fetchSummary();
  // injeção do botão: retry rápido (header pode montar depois), barato e guardado (padrão theme-toggle)
  _ensureTimer = setInterval(() => { if (!document.hidden) ensureButton(); }, 1000);
  // polling de dados: intervalo longo
  _timer = setInterval(() => { if (!document.hidden) fetchSummary(); }, POLL_MS);
}

if (document.readyState === 'complete') start();
else window.addEventListener('load', start);

export { MODULE_ID };
