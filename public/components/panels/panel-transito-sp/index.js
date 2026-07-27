/**
 * panel-transito-sp — painel nativo de Trânsito de São Paulo (container-main).
 * @version 1.0.0
 * @description Contrato mount/unmount importado por convenção pelo PanelPort
 *   (/components/panels/panel-transito-sp/index.js). Consome /api/traffic/dashboard.php,
 *   renderiza cabeçalho + cards + mapa Leaflet (fluxo próprio + ocorrências clusterizadas) + listas.
 *   Leaflet é self-hosted (assets/js/libs/leaflet). Tema via tokens --transit-* (light/dark).
 */
'use strict';

const MODULE_ID = 'panels/panel-transito-sp';
const VERSION = '1.0.0';
const DASHBOARD_URL = '/api/traffic/dashboard.php';
const CSS_V = '20260720';
const LEAFLET_BASE = '/assets/js/libs/leaflet';
const AUTO_REFRESH_MS = 300000; // 5 min (alinhado ao TTL do backend; usa o mesmo cache, sem custo extra)
const MIN_REFRESH_MS = 15000;
const FETCH_TIMEOUT_MS = 12000;

const LEVEL_PT = { normal: 'Normal', moderate: 'Moderado', intense: 'Intenso', unavailable: 'Indisponível' };
const SEG_PT = { normal: 'Normal', moderate: 'Moderado', slow: 'Lento', intense: 'Intenso', critical: 'Crítico' };
const TYPE_PT = { accident: 'Acidente', closure: 'Interdição', roadworks: 'Obra', congestion: 'Congestionamento', hazard: 'Perigo na via', other: 'Ocorrência' };
const SEV_PT = { low: 'Baixa', moderate: 'Moderada', high: 'Alta', critical: 'Crítica' };

// estado do módulo (single-instance)
let _root = null, _refreshTimer = null, _abort = null, _lastRefresh = 0, _mounted = false;
let _map = null, _flowLayer = null, _incidentLayer = null, _tileLayer = null, _themeObserver = null;
let _data = null, _incidentFilter = 'all', _segById = {}, _incMarkers = {};

// ── util ────────────────────────────────────────────────────────────────
function el(html) { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; }
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
function isLight() { return document.documentElement.getAttribute('data-theme') === 'light'; }
function levelColors() {
  return isLight()
    ? { normal: '#15803d', moderate: '#a16207', slow: '#c2410c', intense: '#dc2626', critical: '#991b1b', none: '#9ca3af' }
    : { normal: '#22c55e', moderate: '#eab308', slow: '#f59e0b', intense: '#ef4444', critical: '#b91c1c', none: '#6b7280' };
}
function segColor(level) { const c = levelColors(); return c[level] || c.none; }
function fmtKm(v) { return (v == null) ? '—' : `${v} km`; }
function plural(n, sing, plur) { return `${n} ${n === 1 ? sing : plur}`; }
// −0% → 0% e nunca exibir null/NaN (§32)
function pctAbs(v) { const n = Math.abs(Number(v)); return (Number.isFinite(n) ? (n === 0 ? 0 : n) : 0); }
function relTime(iso) {
  try { const min = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
    if (min <= 0) return 'agora'; if (min === 1) return 'há 1 min'; if (min < 60) return `há ${min} min`;
    const h = Math.round(min / 60); return h === 1 ? 'há 1 h' : `há ${h} h`; } catch (e) { return ''; }
}
function fmtTime(iso) { try { return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }); } catch (e) { return ''; } }

function loadLinkOnce(href, id) { if (document.getElementById(id)) return; const l = document.createElement('link'); l.id = id; l.rel = 'stylesheet'; l.href = href; document.head.appendChild(l); }
function loadScriptOnce(src, id) {
  return new Promise((res, rej) => {
    const ex = document.getElementById(id);
    if (ex) { if (window.L && id === 'leaflet-lib') return res(); ex.addEventListener('load', () => res()); ex.addEventListener('error', rej); if (ex.dataset.loaded) res(); return; }
    const s = document.createElement('script'); s.id = id; s.src = src;
    s.onload = () => { s.dataset.loaded = '1'; res(); }; s.onerror = () => rej(new Error('load ' + src));
    document.head.appendChild(s);
  });
}
async function ensureLeaflet() {
  loadLinkOnce(`${LEAFLET_BASE}/leaflet.css?v=1.9.4`, 'leaflet-css');
  loadLinkOnce(`${LEAFLET_BASE}/MarkerCluster.css?v=1.5.3`, 'leaflet-cluster-css');
  loadLinkOnce(`${LEAFLET_BASE}/MarkerCluster.Default.css?v=1.5.3`, 'leaflet-cluster-css2');
  if (!window.L) await loadScriptOnce(`${LEAFLET_BASE}/leaflet.min.js?v=1.9.4`, 'leaflet-lib');
  if (!window.L || !window.L.markerClusterGroup) await loadScriptOnce(`${LEAFLET_BASE}/leaflet.markercluster.min.js?v=1.5.3`, 'leaflet-cluster-lib');
  return window.L;
}

// ── mount ───────────────────────────────────────────────────────────────
function mount(contentEl, config) {
  if (_mounted) unmount();
  _mounted = true;
  _root = contentEl;
  loadLinkOnce(`/components/panels/panel-transito-sp/panel.css?v=${CSS_V}`, 'transit-panel-css');
  contentEl.innerHTML = '';
  contentEl.appendChild(buildShell());
  renderSkeleton();
  refresh(true);
  _refreshTimer = setInterval(() => { if (!document.hidden) refresh(false); }, AUTO_REFRESH_MS);
  document.addEventListener('visibilitychange', onVisibility);
  return Promise.resolve(true);
}

function onVisibility() { if (!document.hidden && Date.now() - _lastRefresh > AUTO_REFRESH_MS / 2) refresh(false); }

function buildShell() {
  const root = el(`<div class="transit-panel" data-display-title="Trânsito em São Paulo">
    <div class="tp-head">
      <div class="tp-head__title">
        <h1>Trânsito em São Paulo</h1>
        <p>Monitoramento em tempo real das condições de trânsito, ocorrências e principais vias da cidade.</p>
      </div>
      <div class="tp-head__meta">
        <span class="tp-situation" data-level="unavailable"><span class="dot"></span><span class="txt">Carregando…</span></span>
        <span class="tp-updated"></span>
        <button class="tp-refresh" type="button" aria-label="Atualizar dados de trânsito agora">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a9 9 0 1 1-2.6-6.4"/><path d="M21 3v6h-6"/></svg>
          <span>Atualizar agora</span>
        </button>
      </div>
    </div>
    <div class="tp-banner tp-banner--stale" role="status"><span></span></div>
    <div class="tp-banner tp-banner--error" role="alert"><span></span><button type="button">Tentar novamente</button></div>
    <div class="tp-cards"></div>
    <div class="tp-map-wrap">
      <div class="tp-map"></div>
      <div class="tp-map-legend" aria-hidden="true"><b>Fluxo</b>
        <span><i style="background:#22c55e"></i>Normal</span><span><i style="background:#eab308"></i>Moderado</span>
        <span><i style="background:#f59e0b"></i>Lento</span><span><i style="background:#ef4444"></i>Intenso</span><span><i style="background:#b91c1c"></i>Crítico</span>
      </div>
    </div>
    <div class="tp-lists">
      <div class="tp-list tp-list--roads"><div class="tp-list__head"><h2>Vias mais congestionadas</h2></div><div class="tp-list__body"></div></div>
      <div class="tp-list tp-list--incidents"><div class="tp-list__head"><h2>Ocorrências em andamento</h2>
        <div class="tp-list__filters">
          <button class="tp-chip" data-f="all" aria-pressed="true">Todas</button>
          <button class="tp-chip" data-f="accident" aria-pressed="false">Acidentes</button>
          <button class="tp-chip" data-f="closure" aria-pressed="false">Interdições</button>
          <button class="tp-chip" data-f="roadworks" aria-pressed="false">Obras</button>
          <button class="tp-chip" data-f="congestion" aria-pressed="false">Congestionamentos</button>
        </div></div><div class="tp-list__body"></div></div>
    </div>
  </div>`);

  root.querySelector('.tp-refresh').addEventListener('click', () => refresh(true, true));
  root.querySelector('.tp-banner--error button').addEventListener('click', () => refresh(true, true));
  root.querySelectorAll('.tp-chip').forEach(ch => ch.addEventListener('click', () => setFilter(ch.dataset.f)));
  return root;
}

// ── render: skeleton ─────────────────────────────────────────────────────
function renderSkeleton() {
  const cards = _root.querySelector('.tp-cards');
  cards.innerHTML = Array.from({ length: 5 }).map(() =>
    `<div class="tp-card"><div class="tp-skel" style="height:12px;width:60%"></div><div class="tp-skel" style="height:26px;width:45%"></div><div class="tp-skel" style="height:11px;width:75%"></div></div>`).join('');
  _root.querySelector('.tp-list--roads .tp-list__body').innerHTML = skelRows(6);
  _root.querySelector('.tp-list--incidents .tp-list__body').innerHTML = skelRows(5);
}
function skelRows(n) { return Array.from({ length: n }).map(() => `<div class="tp-row"><span class="tp-skel" style="height:28px;width:100%;grid-column:1/-1"></span></div>`).join(''); }

// ── fetch + render ───────────────────────────────────────────────────────
async function refresh(showSpin, manual) {
  const now = Date.now();
  if (manual && now - _lastRefresh < MIN_REFRESH_MS) return;
  _lastRefresh = now;
  const btn = _root && _root.querySelector('.tp-refresh');
  if (btn && showSpin) { btn.disabled = true; btn.setAttribute('aria-busy', 'true'); }
  if (_abort) _abort.abort();
  _abort = new AbortController();
  const to = setTimeout(() => _abort.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(DASHBOARD_URL, { signal: _abort.signal, headers: { Accept: 'application/json' } });
    clearTimeout(to);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const j = await res.json();
    if (!j || j.ok !== true || !j.data) throw new Error('payload inválido');
    _data = j.data;
    hideBanner('error');
    toggleBanner('stale', !!(_data.metadata && _data.metadata.stale),
      `Exibindo os últimos dados disponíveis${_data.summary && _data.summary.updatedAt ? `, atualizados ${relTime(_data.summary.updatedAt)}` : ''}.`);
    await ensureMap();
    renderAll();
  } catch (e) {
    clearTimeout(to);
    if (e.name === 'AbortError') return;
    if (!_data) { renderErrorState(); }
    toggleBanner('error', true, 'Não foi possível carregar os dados de trânsito neste momento.');
  } finally {
    if (btn) { btn.disabled = false; btn.removeAttribute('aria-busy'); }
  }
}

function renderAll() {
  renderSituation(); renderCards(); renderRoads(); renderIncidents(); renderMapData();
}

function renderSituation() {
  const s = _data.summary || {};
  const sit = _root.querySelector('.tp-situation');
  sit.setAttribute('data-level', s.level || 'unavailable');
  sit.querySelector('.txt').textContent = `Situação atual: ${LEVEL_PT[s.level] || '—'}`;
  const upd = _root.querySelector('.tp-updated');
  upd.textContent = s.updatedAt ? `Última atualização: ${fmtTime(s.updatedAt)}` : '';
}

const FAIXA_PT = { normal: 'Faixa normal: 0–34', moderate: 'Faixa moderada: 35–69', intense: 'Faixa intensa: 70–100' };

function renderCards() {
  const s = _data.summary || {};
  const trendTxt = { worsening: 'piorando', improving: 'melhorando', stable: 'estável', unknown: '' }[s.trend] || '';

  // §3.5 — comparação SEMPRE contra o fluxo livre (não é histórico); rótulo honesto.
  const cmpTxt = (s.comparisonPercentage == null) ? '—'
    : (s.comparisonPercentage > 0 ? `<span class="up">${pctAbs(s.comparisonPercentage)}% abaixo do fluxo livre</span>`
      : (s.comparisonPercentage < 0 ? `<span class="down">${pctAbs(s.comparisonPercentage)}% acima do fluxo livre</span>` : 'no nível do fluxo livre'));

  // §3.1/§8.2 — nunca "0 segmentos" ao lado de km vindo de ocorrências.
  let segSub;
  if (s.estimatedCongestionKm == null) segSub = 'Segmentos não calculados';
  else if (s.congestedSegmentCount == null) segSub = 'Segmentos não calculados · estimativa';
  else if (s.congestedSegmentCount === 0) segSub = 'Extensão estimada por ocorrências';
  else segSub = `${plural(s.congestedSegmentCount, 'segmento de fluxo', 'segmentos de fluxo')} · estimativa`;

  // §3.2/§33 — composição COMPLETA e pluralizada; a soma fecha com o total.
  const comp = [
    ['interdição', 'interdições', s.closures],
    ['acidente', 'acidentes', s.accidents],
    ['obra', 'obras', s.roadworks],
    ['congestionamento', 'congestionamentos', s.congestion],
    ['perigo na via', 'perigos na via', s.hazard],
    ['outra', 'outras', s.other],
  ];
  const catList = comp.filter(c => (c[2] || 0) > 0).sort((a, b) => (b[2] || 0) - (a[2] || 0))
    .map(c => plural(c[2] || 0, c[0], c[1]));
  const occSub = catList.length ? catList.join(' · ') : 'sem ocorrências ativas';
  const occTitle = catList.join(', ') + ((s.endedIncidents || 0) > 0 ? ` · ${plural(s.endedIncidents, 'encerrada oculta', 'encerradas ocultas')}` : '');

  const cards = _root.querySelector('.tp-cards');
  cards.innerHTML = `
    <div class="tp-card tp-card--index" data-level="${s.level || 'unavailable'}"
         title="Índice 0–100 ponderado pela extensão das vias monitoradas somada a uma penalidade por ocorrências. ${esc(FAIXA_PT[s.level] || '')}">
      <div class="tp-card__label">Índice geral</div>
      <div class="tp-card__value">${s.trafficIndex == null ? '—' : s.trafficIndex}<small>/100</small></div>
      <div class="tp-card__sub">${LEVEL_PT[s.level] || '—'}${trendTxt ? ` · ${trendTxt}` : ''}${FAIXA_PT[s.level] ? ` · ${FAIXA_PT[s.level].replace('Faixa ', '').replace(':', '')}` : ''}</div>
    </div>
    <div class="tp-card" title="Soma aproximada da extensão dos segmentos abaixo do limiar de velocidade mais a extensão das ocorrências de congestionamento. Estimativa, não é dado oficial.">
      <div class="tp-card__label">Lentidão estimada</div>
      <div class="tp-card__value">${s.estimatedCongestionKm == null ? '—' : s.estimatedCongestionKm}<small>km</small></div>
      <div class="tp-card__sub">${segSub}</div>
    </div>
    <div class="tp-card">
      <div class="tp-card__label">Velocidade média</div>
      <div class="tp-card__value">${s.averageCurrentSpeedKmh == null ? '—' : Math.round(s.averageCurrentSpeedKmh)}<small>km/h</small></div>
      <div class="tp-card__sub">Fluxo livre: ${s.averageFreeFlowSpeedKmh == null ? '—' : Math.round(s.averageFreeFlowSpeedKmh)} km/h${s.speedReductionPercentage != null ? ` · <span class="up">−${pctAbs(s.speedReductionPercentage)}%</span>` : ''}</div>
    </div>
    <div class="tp-card" title="${esc(occTitle)}">
      <div class="tp-card__label">Ocorrências ativas</div>
      <div class="tp-card__value">${s.activeIncidents == null ? '—' : s.activeIncidents}</div>
      <div class="tp-card__sub">${occSub}</div>
    </div>
    <div class="tp-card">
      <div class="tp-card__label">Comparação</div>
      <div class="tp-card__value" style="font-size:19px">${cmpTxt}</div>
      <div class="tp-card__sub">Referência: velocidade de fluxo livre das vias</div>
    </div>`;
}

function countCongestedSegments() {
  const flow = (_data.flow || []);
  return flow.filter(f => f.freeFlowSpeedKmh && f.currentSpeedKmh != null && (f.roadClosure || f.currentSpeedKmh < f.freeFlowSpeedKmh * 0.65)).length;
}

// ── listas ────────────────────────────────────────────────────────────────
function reduction(f) { return (f.freeFlowSpeedKmh && f.currentSpeedKmh != null) ? (1 - f.currentSpeedKmh / f.freeFlowSpeedKmh) : -1; }

function renderRoads() {
  const body = _root.querySelector('.tp-list--roads .tp-list__body');
  const flow = (_data.flow || []).slice().filter(f => f.freeFlowSpeedKmh && f.currentSpeedKmh != null)
    .sort((a, b) => reduction(b) - reduction(a)).slice(0, 10);
  if (!flow.length) { body.innerHTML = `<div class="tp-empty">Sem dados de fluxo no momento.</div>`; return; }
  body.innerHTML = flow.map((f, i) => {
    const red = Math.round(reduction(f) * 100);
    const c = segColor(f.congestionLevel);
    return `<div class="tp-row" role="button" tabindex="0" data-seg="${esc(f.id)}">
      <span class="tp-row__rank">${i + 1}</span>
      <span class="tp-row__main"><strong>${esc(f.roadName || 'Via')}</strong>
        <span>${Math.round(f.currentSpeedKmh)} km/h · normal ${Math.round(f.freeFlowSpeedKmh)} · −${red}%</span></span>
      <span class="tp-row__badge" style="background:${c}">${SEG_PT[f.congestionLevel] || f.congestionLevel}</span>
    </div>`;
  }).join('');
  body.querySelectorAll('.tp-row').forEach(r => {
    const go = () => focusSegment(r.dataset.seg, r);
    r.addEventListener('click', go);
    r.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
  });
}

function incidentRank(i) {
  const sevW = { critical: 0, high: 1, moderate: 2, low: 3 }[i.severity] ?? 4;
  const typeW = { closure: 0, accident: 1, congestion: 2, roadworks: 3, hazard: 4, other: 5 }[i.type] ?? 6;
  return sevW * 100 + typeW * 10 - Math.min(9, (i.delaySeconds || 0) / 600);
}

function renderIncidents() {
  const body = _root.querySelector('.tp-list--incidents .tp-list__body');
  // §3.3 — "Em andamento" NÃO exibe encerradas; não presumir que a ocorrência continua ativa.
  let inc = (_data.incidents || []).filter(i => (i.status || 'active') !== 'ended');
  if (_incidentFilter !== 'all') inc = inc.filter(i => i.type === _incidentFilter);
  inc.sort((a, b) => incidentRank(a) - incidentRank(b));
  if (!inc.length) { body.innerHTML = `<div class="tp-empty">Nenhuma ocorrência relevante identificada no momento.</div>`; return; }
  const LIST_CAP = 100;
  const total = inc.length;
  const shown = inc.slice(0, LIST_CAP);
  const sevColor = { critical: '#b91c1c', high: '#ef4444', moderate: '#eab308', low: '#6b7280' };
  body.innerHTML = shown.map(i => `<div class="tp-row" role="button" tabindex="0" data-inc="${esc(i.id)}">
      <span class="tp-row__rank">${typeIcon(i.type)}</span>
      <span class="tp-row__main"><strong>${esc(TYPE_PT[i.type] || 'Ocorrência')}${i.roadName ? ' · ' + esc(i.roadName) : ''}</strong>
        <span>${esc(i.title || '')}${i.delaySeconds ? ` · +${Math.round(i.delaySeconds / 60)} min` : ''}</span></span>
      <span class="tp-row__badge" style="background:${sevColor[i.severity] || '#6b7280'}">${SEV_PT[i.severity] || i.severity}</span>
    </div>`).join('') + (total > LIST_CAP ? `<div class="tp-empty" style="padding:10px">Mostrando ${LIST_CAP} de ${total} — refine pelos filtros acima. Todas aparecem no mapa.</div>` : '');
  body.querySelectorAll('.tp-row').forEach(r => {
    const go = () => focusIncident(r.dataset.inc, r);
    r.addEventListener('click', go);
    r.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
  });
}
function typeIcon(t) { return ({ accident: '⚠', closure: '⛔', roadworks: '🚧', congestion: '🚗', hazard: '❗', other: '•' })[t] || '•'; }

function setFilter(f) {
  _incidentFilter = f;
  _root.querySelectorAll('.tp-chip').forEach(c => c.setAttribute('aria-pressed', String(c.dataset.f === f)));
  if (_data) renderIncidents();
}

function toggleBanner(kind, show, text) {
  const b = _root.querySelector(`.tp-banner--${kind}`);
  if (!b) return;
  if (text) b.querySelector('span').textContent = text;
  b.setAttribute('data-show', show ? '1' : '0');
}
function hideBanner(kind) { toggleBanner(kind, false); }
function renderErrorState() {
  _root.querySelector('.tp-cards').innerHTML = `<div class="tp-empty" style="grid-column:1/-1">Não foi possível carregar os dados de trânsito.</div>`;
}

// ── mapa ────────────────────────────────────────────────────────────────
function tileUrl() {
  return isLight()
    ? 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
}
async function ensureMap() {
  if (_map) return;
  let L;
  try { L = await ensureLeaflet(); } catch (e) { return; }
  if (!L || !_root) return;
  const host = _root.querySelector('.tp-map');
  if (!host) return;
  const c = (_data && _data.metadata && _data.metadata.center) || { lat: -23.5505, lng: -46.6333 };
  _map = L.map(host, { zoomControl: true, attributionControl: true }).setView([c.lat, c.lng], 12);
  _tileLayer = L.tileLayer(tileUrl(), { maxZoom: 18, subdomains: 'abcd',
    attribution: '&copy; OpenStreetMap &copy; CARTO' }).addTo(_map);
  _flowLayer = L.layerGroup().addTo(_map);
  _incidentLayer = L.markerClusterGroup ? L.markerClusterGroup({ maxClusterRadius: 45 }) : L.layerGroup();
  _map.addLayer(_incidentLayer);
  // fit aos bounds da cidade
  if (_data && _data.metadata && _data.metadata.bounds) {
    const b = _data.metadata.bounds;
    _map.fitBounds([[b.south, b.west], [b.north, b.east]]);
  }
  // troca de tema → troca tiles
  _themeObserver = new MutationObserver(() => { if (_tileLayer) _tileLayer.setUrl(tileUrl()); });
  _themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  setTimeout(() => _map && _map.invalidateSize(), 60);
}

function renderMapData() {
  if (!_map || !window.L) return;
  const L = window.L;
  _flowLayer.clearLayers(); _incidentLayer.clearLayers(); _segById = {}; _incMarkers = {};

  (_data.flow || []).forEach(f => {
    const g = f.geometry; if (!g || g.type !== 'LineString' || !Array.isArray(g.coordinates)) return;
    const latlngs = g.coordinates.map(p => [p[1], p[0]]);
    const line = L.polyline(latlngs, { color: segColor(f.congestionLevel), weight: 6, opacity: 0.85, lineCap: 'round' });
    line.bindTooltip(`${esc(f.roadName || 'Via')} · ${Math.round(f.currentSpeedKmh)} km/h`, { sticky: true });
    line.addTo(_flowLayer);
    _segById[f.id] = { line, latlngs };
  });

  (_data.incidents || []).forEach(i => {
    const g = i.geometry; let ll = null;
    if (g && g.type === 'Point' && Array.isArray(g.coordinates)) ll = [g.coordinates[1], g.coordinates[0]];
    else if (g && g.type === 'LineString' && g.coordinates && g.coordinates[0]) ll = [g.coordinates[0][1], g.coordinates[0][0]];
    if (!ll) return;
    const sevColor = { critical: '#b91c1c', high: '#ef4444', moderate: '#eab308', low: '#6b7280' }[i.severity] || '#6b7280';
    const icon = L.divIcon({ className: 'tp-inc-marker', html: `<div style="width:26px;height:26px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:${sevColor};border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center"><span style="transform:rotate(45deg);font-size:13px">${typeIcon(i.type)}</span></div>`, iconSize: [26, 26], iconAnchor: [13, 26] });
    const m = L.marker(ll, { icon });
    m.bindPopup(incidentPopup(i, sevColor));
    m.addTo(_incidentLayer);
    _incMarkers[i.id] = { marker: m, ll };
  });
}

function incidentPopup(i, sevColor) {
  const rows = [];
  rows.push(`<span class="sev" style="background:${sevColor}">${SEV_PT[i.severity] || i.severity}</span>`);
  rows.push(`<h4>${esc(TYPE_PT[i.type] || 'Ocorrência')}${i.roadName ? ' · ' + esc(i.roadName) : ''}</h4>`);
  if (i.title) rows.push(`<div class="row">${esc(i.title)}</div>`);
  if (i.from || i.to) rows.push(`<div class="row">Trecho: ${esc(i.from || '?')} → ${esc(i.to || '?')}</div>`);
  if (i.direction) rows.push(`<div class="row">Sentido: ${esc(i.direction)}</div>`);
  if (i.delaySeconds) rows.push(`<div class="row">Atraso estimado: ${Math.round(i.delaySeconds / 60)} min</div>`);
  if (i.lengthMeters) rows.push(`<div class="row">Extensão: ${(i.lengthMeters / 1000).toFixed(1)} km</div>`);
  if (i.startTime) rows.push(`<div class="row">Início: ${fmtTime(i.startTime)}</div>`);
  if (i.endTime) rows.push(`<div class="row">Previsão: ${fmtTime(i.endTime)}</div>`);
  if (i.updatedAt) rows.push(`<div class="row" style="opacity:.7">Atualizado ${relTime(i.updatedAt)}</div>`);
  return `<div class="tp-inc-popup">${rows.join('')}</div>`;
}

function focusSegment(id, rowEl) {
  markActive(rowEl, '.tp-list--roads');
  const s = _segById[id]; if (!s || !_map) return;
  _map.fitBounds(s.line.getBounds(), { maxZoom: 15, padding: [40, 40] });
  const orig = s.line.options.weight;
  s.line.setStyle({ weight: 10 }); setTimeout(() => s.line.setStyle({ weight: orig }), 1400);
}
function focusIncident(id, rowEl) {
  markActive(rowEl, '.tp-list--incidents');
  const m = _incMarkers[id]; if (!m || !_map) return;
  _map.setView(m.ll, 15, { animate: true });
  m.marker.openPopup();
}
function markActive(rowEl, scope) {
  _root.querySelectorAll(`${scope} .tp-row`).forEach(r => r.classList.remove('is-active'));
  if (rowEl) rowEl.classList.add('is-active');
}

// ── unmount ─────────────────────────────────────────────────────────────
function unmount() {
  if (_refreshTimer) { clearInterval(_refreshTimer); _refreshTimer = null; }
  document.removeEventListener('visibilitychange', onVisibility);
  if (_abort) { try { _abort.abort(); } catch (e) {} _abort = null; }
  if (_themeObserver) { try { _themeObserver.disconnect(); } catch (e) {} _themeObserver = null; }
  if (_map) { try { _map.remove(); } catch (e) {} _map = null; }
  _flowLayer = _incidentLayer = _tileLayer = null; _segById = {}; _incMarkers = {};
  _data = null; _incidentFilter = 'all';
  if (_root) { _root.innerHTML = ''; _root = null; }
  _mounted = false;
  return Promise.resolve();
}

function healthCheck() { return { status: _mounted ? 'HEALTHY' : 'IDLE', moduleId: MODULE_ID, version: VERSION, hasMap: !!_map, hasData: !!_data, timestamp: Date.now() }; }
function info() { return { moduleId: MODULE_ID, version: VERSION, mounted: _mounted, provider: _data && _data.provider }; }

const _panel = { mount, unmount, destroy: unmount, dispose: unmount, healthCheck, info, VERSION, MODULE_ID };
export { mount, unmount, healthCheck, info, VERSION, MODULE_ID };
export const destroy = unmount;
export const dispose = unmount;
export default _panel;
