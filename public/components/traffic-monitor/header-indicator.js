/**
 * TrafficHeaderIndicator — indicador de trânsito de São Paulo no header (standalone).
 * @version 1.0.0
 * @description Auto-injeta um botão no `.header-right` (padrão theme-toggle, zero dependência
 *   de bundle/registry do header), faz polling de /api/traffic/summary.php e, ao clicar,
 *   navega para o painel `#/panel-transito-sp` no container-main (via navigateToRoute → nav.intent).
 *   Estados: normal(verde)/moderado(amarelo)/intenso(vermelho)/indisponível(cinza) — cor NUNCA
 *   é o único sinal (título + aria-label + valor + texto). Guarda document.hidden no polling.
 */
'use strict';

import { navigateToRoute } from '/components/header/components/_base/navigation-helper.js';

const MODULE_ID = 'traffic-header-indicator';
const ROUTE = '#/panel-transito-sp';
const SUMMARY_URL = '/api/traffic/summary.php';
const POLL_MS = 60000;        // configurável; trânsito "ao vivo"
const FETCH_TIMEOUT_MS = 8000;
const BTN_ATTR = 'data-traffic-indicator';

let _timer = null;
let _ensureTimer = null;
let _lastFetch = 0;
let _state = { level: 'unavailable', index: null, km: null, incidents: null, closures: null, updatedAt: null, stale: false };

const ICON = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 17h14M6.5 17l1-6.2A2 2 0 0 1 9.47 9h5.06a2 2 0 0 1 1.97 1.8L17.5 17"/><path d="M7 17v2M17 17v2"/><circle cx="8.5" cy="13.5" r="0.6" fill="currentColor"/><circle cx="15.5" cy="13.5" r="0.6" fill="currentColor"/></svg>';

const LEVEL_PT = { normal: 'Normal', moderate: 'Moderado', intense: 'Intenso', unavailable: 'Indisponível' };

function injectStyleOnce() {
  if (document.getElementById('traffic-indicator-style')) return;
  const st = document.createElement('style');
  st.id = 'traffic-indicator-style';
  st.textContent = `
.traffic-indicator{position:relative;z-index:20;display:inline-flex;align-items:center;gap:6px;height:34px;padding:0 9px;margin:0 4px;border-radius:8px;cursor:pointer;border:1px solid var(--hdr-border,rgba(255,255,255,.08));background:transparent;color:var(--hdr-text-muted,rgba(255,255,255,.65));transition:background .15s ease,color .15s ease,border-color .15s ease;font:600 12px/1 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;}
.traffic-indicator:hover{color:var(--hdr-text,rgba(255,255,255,.95));background:var(--hdr-bg-scrolled,rgba(255,255,255,.06));border-color:var(--hdr-border-accent,rgba(99,102,241,.4));}
.traffic-indicator:focus-visible{outline:2px solid var(--hdr-active,#6366f1);outline-offset:2px;}
.traffic-indicator[aria-pressed="true"]{border-color:var(--hdr-active,#6366f1);background:var(--hdr-bg-scrolled,rgba(99,102,241,.12));}
.traffic-indicator svg{display:block;pointer-events:none;flex:0 0 auto;}
.traffic-indicator .ti-dot{width:8px;height:8px;border-radius:50%;flex:0 0 auto;background:var(--ti-color,#9ca3af);box-shadow:0 0 6px var(--ti-glow,transparent);}
.traffic-indicator .ti-value{min-width:14px;text-align:center;color:var(--ti-color,inherit);font-variant-numeric:tabular-nums;}
.traffic-indicator[data-status="normal"]{--ti-color:#22c55e;--ti-glow:rgba(34,197,94,.5);}
.traffic-indicator[data-status="moderate"]{--ti-color:#eab308;--ti-glow:rgba(234,179,8,.5);}
.traffic-indicator[data-status="intense"]{--ti-color:#ef4444;--ti-glow:rgba(239,68,68,.55);}
.traffic-indicator[data-status="unavailable"]{--ti-color:#9ca3af;--ti-glow:transparent;}
:root[data-theme="light"] .traffic-indicator{color:var(--hdr-text-muted,rgba(0,0,0,.6));border-color:var(--hdr-border,rgba(0,0,0,.1));}
:root[data-theme="light"] .traffic-indicator[data-status="normal"]{--ti-color:#15803d;}
:root[data-theme="light"] .traffic-indicator[data-status="moderate"]{--ti-color:#a16207;}
:root[data-theme="light"] .traffic-indicator[data-status="intense"]{--ti-color:#dc2626;}
/* tooltip */
.traffic-tip{position:fixed;z-index:9999;max-width:260px;padding:10px 12px;border-radius:10px;background:var(--bg-tertiary,#1a1a1d);color:var(--text-primary,rgba(255,255,255,.92));border:1px solid var(--border-color,rgba(255,255,255,.1));box-shadow:0 8px 24px rgba(0,0,0,.35);font:400 12px/1.5 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;pointer-events:none;opacity:0;transform:translateY(-4px);transition:opacity .12s ease,transform .12s ease;}
.traffic-tip[data-show="1"]{opacity:1;transform:translateY(0);}
.traffic-tip strong{color:var(--text-primary,#fff);}
.traffic-tip .tt-muted{color:var(--text-muted,rgba(255,255,255,.55));}
`;
  document.head.appendChild(st);
}

function makeButton() {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'traffic-indicator';
  btn.setAttribute(BTN_ATTR, '1');
  btn.setAttribute('data-status', 'unavailable');
  btn.setAttribute('data-uarps-trigger', 'trigger:header:open-traffic');
  btn.innerHTML = `<span class="ti-dot"></span>${ICON}<span class="ti-value">--</span>`;
  return btn;
}

function ensureButton() {
  const right = document.querySelector('.header-right');
  if (!right) return false;
  if (!right.querySelector('[' + BTN_ATTR + ']')) {
    injectStyleOnce();
    const btn = makeButton();
    // logo após o toggle de tema, se houver; senão no início
    right.insertBefore(btn, right.firstChild);
    paintAll();
  }
  return true;
}

function tooltipText() {
  const s = _state;
  if (s.level === 'unavailable' || s.index === null) {
    return 'Trânsito em São Paulo: dados indisponíveis no momento.\nClique para abrir o painel';
  }
  const parts = [];
  parts.push(`Trânsito em São Paulo: ${LEVEL_PT[s.level] || s.level}`);
  parts.push(`Índice geral: ${s.index}/100`);
  if (s.km !== null && s.km !== undefined) parts.push(`Estimativa de lentidão: ${s.km} km`);
  if (s.incidents !== null) parts.push(`${s.incidents} ocorrências ativas`);
  if (s.closures) parts.push(`${s.closures} interdições`);
  if (s.updatedAt) parts.push(`Atualizado ${relTime(s.updatedAt)}`);
  if (s.stale) parts.push('(dados possivelmente desatualizados)');
  parts.push('Clique para abrir o painel');
  return parts.join('\n');
}

function ariaLabel() {
  const s = _state;
  if (s.index === null) return 'Abrir painel de trânsito de São Paulo. Dados indisponíveis.';
  return `Abrir painel de trânsito de São Paulo. Situação ${LEVEL_PT[s.level] || s.level}, índice ${s.index} de 100.`;
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

function paintAll() {
  const list = document.querySelectorAll('[' + BTN_ATTR + ']');
  const s = _state;
  for (let i = 0; i < list.length; i++) {
    const b = list[i];
    b.setAttribute('data-status', s.level || 'unavailable');
    const val = b.querySelector('.ti-value');
    if (val) val.textContent = (s.index === null || s.index === undefined) ? '--' : String(s.index);
    b.setAttribute('title', tooltipText());
    b.setAttribute('aria-label', ariaLabel());
  }
}

// ── Custom tooltip acessível (hover + foco de teclado) ────────────────
let _tip = null;
function ensureTip() {
  if (_tip) return _tip;
  _tip = document.createElement('div');
  _tip.className = 'traffic-tip';
  _tip.setAttribute('role', 'tooltip');
  document.body.appendChild(_tip);
  return _tip;
}
function showTip(btn) {
  const tip = ensureTip();
  const s = _state;
  const rows = [];
  if (s.index === null) {
    rows.push('<strong>Trânsito em São Paulo</strong>');
    rows.push('<span class="tt-muted">Dados indisponíveis no momento.</span>');
  } else {
    rows.push(`<strong>Trânsito em SP: ${LEVEL_PT[s.level] || s.level}</strong>`);
    rows.push(`Índice geral: <strong>${s.index}/100</strong>`);
    if (s.km !== null) rows.push(`Estimativa de lentidão: ${s.km} km`);
    if (s.incidents !== null) rows.push(`${s.incidents} ocorrências ativas`);
    if (s.closures) rows.push(`${s.closures} interdições`);
    if (s.updatedAt) rows.push(`<span class="tt-muted">Atualizado ${relTime(s.updatedAt)}</span>`);
    if (s.stale) rows.push('<span class="tt-muted">dados possivelmente desatualizados</span>');
  }
  rows.push('<span class="tt-muted">Clique para abrir o painel</span>');
  tip.innerHTML = rows.join('<br>');
  const r = btn.getBoundingClientRect();
  tip.style.top = (r.bottom + 8) + 'px';
  tip.style.left = Math.max(8, Math.min(window.innerWidth - 272, r.left)) + 'px';
  tip.setAttribute('data-show', '1');
}
function hideTip() { if (_tip) _tip.setAttribute('data-show', '0'); }

// ── Fetch ──────────────────────────────────────────────────────────────
async function fetchSummary() {
  if (document.hidden) return;
  _lastFetch = Date.now();
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
  } catch (e) {
    clearTimeout(to);
    _state = { ..._state, level: 'unavailable', index: null };
  }
  paintAll();
}

// ── Eventos ─────────────────────────────────────────────────────────────
function onClick(ev) {
  const b = ev.target && ev.target.closest ? ev.target.closest('[' + BTN_ATTR + ']') : null;
  if (!b) return;
  ev.preventDefault();
  ev.stopPropagation();
  hideTip();
  navigateToRoute(ROUTE, MODULE_ID);
}
function onOver(ev) {
  const b = ev.target && ev.target.closest ? ev.target.closest('[' + BTN_ATTR + ']') : null;
  if (b) showTip(b);
}
function onOut(ev) {
  const b = ev.target && ev.target.closest ? ev.target.closest('[' + BTN_ATTR + ']') : null;
  if (b) hideTip();
}

function start() {
  document.addEventListener('click', onClick, true);
  document.addEventListener('mouseover', onOver, true);
  document.addEventListener('mouseout', onOut, true);
  document.addEventListener('focusin', onOver, true);
  document.addEventListener('focusout', onOut, true);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && Date.now() - _lastFetch > POLL_MS / 2) fetchSummary();
  });
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
