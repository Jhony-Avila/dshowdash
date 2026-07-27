// ═══════════════════════════════════════════════════════════════
// Currency Rotator — pill rotativa unificada (Dólar → Yuan → Bitcoin)
// ───────────────────────────────────────────────────────────────
// Substitui as 3 pills (currency-usd-brl / -usd-cny / -btc) por UMA
// pill que alterna a cotação exibida em carrossel vertical.
//
// - UM componente com estado (config de ativos em ASSETS).
// - Reutiliza 100% os endpoints atuais (/api/currencies/get_*.php).
// - Clique abre o painel `panel-cotacao` do ativo EXIBIDO no momento,
//   via o contrato público de 3 canais (sessionStorage + CustomEvent + hash).
// - Rotação 5s (ROTATE_MS) · slide vertical ~280ms · pausa no hover.
// - Contrato do loader: mount()/unmount()/VERSION/id/capabilities +
//   export default = construtor com prototype.mount.
// @version 1.1.0 — pausa também no foco de teclado; honra polling_interval do banco
// ═══════════════════════════════════════════════════════════════
'use strict';

const VERSION = '1.1.0';
const id = 'currency-rotator';
const MODULE_ID = 'header/components/currency-rotator';
const capabilities = { type: 'indicator', reorderable: true, hideable: true, critical: false, rendersUI: true };

// ── Config ajustável ──────────────────────────────────────────
const ROTATE_MS = 5000;      // intervalo de troca da cotação exibida
const POLL_MS = 30000;       // intervalo de atualização dos valores (igual às pills)
const SLIDE_MS = 280;        // duração da transição de slide (deve casar com o CSS)
const SLIDE_H = 40;          // altura de cada slide em px (== altura interna da pill)
const FETCH_TIMEOUT = 12000; // timeout de cada fetch (igual às pills)
const SS_KEY = 'cotacao:asset';
const PANEL_ROUTE = '#/panel-cotacao';

// ── Ícones (copiados 1:1 das pills originais) ─────────────────
const ICON_USA = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect fill="#e0e0e0" height="336" rx="40" width="480" x="19.499" y="91.5"/><path d="m259.499 187.5h240v48h-240z" fill="#b73831"/><path d="m307.5 211.5h192v-24h-216a24 24 0 0 0 24 24z" fill="#d4483f"/><path d="m307.5 163.5h192v-24h-216a24 24 0 0 0 24 24z" fill="#f5f5f5"/><path d="m307.5 259.5h192v-24h-216a24 24 0 0 0 24 24z" fill="#f5f5f5"/><g fill="#b73831"><path d="m19.499 283.5h480v48h-480z"/><path d="m19.5 387.5a40 40 0 0 0 40 40h400a40 40 0 0 0 40-40v-8h-480z"/><path d="m459.5 91.5h-200v48h240v-8a40 40 0 0 0 -40-40z"/></g><path d="m259.5 283.5v-192h-200a40 40 0 0 0 -40 40v152z" fill="#2b66ba"/><path d="m43.5 94.877v132.623a32 32 0 0 0 32 32h184v-168h-200a39.781 39.781 0 0 0 -16 3.377z" fill="#3477cc"/><polygon fill="#e0e0e0" points="86.4,130.4 98.4,168 137.6,168 106.4,190.4 118.4,227.2 86.4,204 55.2,226.4 67.2,190.4 35.2,168 74.4,168"/><polygon fill="#fff" points="74.894,139.3 67.499,123.563 67.499,163.317 82.32,171.5 79.484,154.133 91.499,141.834"/></svg>';
const ICON_CHINA = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 496 496"><path fill="#DC3027" d="M496,369.6c0,27.2-21.6,46.4-48,46.4H48c-26.4,0-48-19.2-48-46.4V126.4C0,99.2,21.6,80,48,80h400c26.4,0,48,19.2,48,46.4V369.6z"/><polygon fill="#F8D12E" points="86.4,130.4 98.4,168 137.6,168 106.4,190.4 118.4,227.2 86.4,204 55.2,226.4 67.2,190.4 35.2,168 74.4,168"/></svg>';
const ICON_BTC = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><defs><linearGradient id="btc-grad" x1="6.105" x2="25.895" y1="6.105" y2="25.895" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fdc830"/><stop offset="1" stop-color="#f37335"/></linearGradient></defs><path d="m18 15h-5v-4h5a2 2 0 0 1 0 4zm1 2h-6v4h6a2 2 0 0 0 0-4zm11-1a14 14 0 1 1 -14-14 14.016 14.016 0 0 1 14 14zm-7 3a3.988 3.988 0 0 0 -1.965-3.425 3.963 3.963 0 0 0 .965-2.575 4 4 0 0 0 -4-4v-2h-2v2h-1v-2h-2v2h-3v2h1v10h-1v2h3v2h2v-2h1v2h2v-2h1a4 4 0 0 0 4-4z" fill="url(#btc-grad)"/></svg>';

// ── Formatação (espelha os Formatters das pills) ──────────────
function fmtNum(v) { return (v === null || v === undefined) ? '--' : Number(v).toFixed(2); }
function fmtUsdK(v) {
  if (v === null || v === undefined) return '--';
  return (v >= 1000) ? `$${(v / 1000).toFixed(2)}K` : `$${Number(v).toFixed(2)}`;
}
function fmtPct(v) {
  if (v === null || v === undefined || isNaN(v)) return '--';
  return `${v > 0 ? '+' : ''}${Number(v).toFixed(2)}%`;
}

// ── Config de ativos: adicionar um 4º ativo = 1 entrada aqui ──
const ASSETS = [
  { key: 'usd-brl', title: 'Dólar (USD/BRL)', icon: ICON_USA,   endpoint: '/api/currencies/get_usd_brl.php', pickVal: function (d) { return d.rate; }, pickChg: function (d) { return d.percent_change; }, fmtVal: fmtNum },
  { key: 'usd-cny', title: 'Yuan (USD/CNY)',  icon: ICON_CHINA, endpoint: '/api/currencies/get_usd_cny.php', pickVal: function (d) { return d.rate; }, pickChg: function (d) { return d.percent_change; }, fmtVal: fmtNum },
  { key: 'btc',     title: 'Bitcoin (BTC/USD)', icon: ICON_BTC, endpoint: '/api/currencies/get_btc.php',     pickVal: function (d) { return d.usd; },  pickChg: function (d) { return d.usd_24h_change; }, fmtVal: fmtUsdK }
];

// ── Injeção de CSS própria (padrão das pills) ─────────────────
(function loadCSS() {
  const cssPath = '/components/header/components/currency-rotator/component.css';
  if (!document.querySelector(`link[href="${cssPath}"]`)) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = cssPath;
    document.head.appendChild(link);
  }
})();

function CurrencyRotatorComponent(options) {
  options = options || {};
  this.container = options.container;
  // Propriedades exigidas pelo contrato/governança do loader
  this.VERSION = VERSION;
  this.id = id;
  this.capabilities = capabilities;

  // Intervalo de atualização: honra o polling_interval do banco (options.config,
  // injetado pelo components-loader); cai no default POLL_MS se ausente/inválido.
  const cfgPoll = options.config && Number(options.config.pollingInterval);
  this.pollMs = (cfgPoll && cfgPoll > 0) ? cfgPoll : POLL_MS;

  this.element = null;
  this.track = null;
  this.isDestroyed = false;
  this.rotIndex = 0;          // 0..N (N = clone do 1º ativo, para loop contínuo)
  this.data = {};             // { key: { value, chg } | null }

  this._rotTimer = null;
  this._pollTimer = null;
  this._resetTimer = null;
  this._hovered = false;      // pausa a rotação enquanto sob o mouse OU com foco de teclado
  this._focused = false;

  // handlers (guardados para remoção limpa no unmount)
  this._onEnter = null;
  this._onLeave = null;
  this._onFocus = null;
  this._onBlur = null;
  this._onClick = null;
  this._onKey = null;
  this._onVis = null;
}

CurrencyRotatorComponent.prototype.mount = function () {
  const self = this;
  if (this.isDestroyed) return Promise.resolve();
  this.render();
  // fetch inicial + polling em background (não bloqueia o mount)
  this.fetchAll();
  this.startPolling();
  this.startRotation();
  return Promise.resolve();
};

CurrencyRotatorComponent.prototype.render = function () {
  const self = this;
  const N = ASSETS.length;

  this.element = document.createElement('div');
  this.element.className = 'currency-rotator-component';
  this.element.dataset.status = 'loading';
  this.element.setAttribute('role', 'button');
  this.element.setAttribute('tabindex', '0');
  this.element.setAttribute('aria-label', 'Cotações — clique para abrir o painel');
  this.element.title = ASSETS[0].title;

  const viewport = document.createElement('div');
  viewport.className = 'cr-viewport';
  this.track = document.createElement('div');
  this.track.className = 'cr-track';

  // Slides na ordem + 1 clone do primeiro (loop contínuo sem "salto" visível)
  const seq = ASSETS.concat([ASSETS[0]]);
  for (let i = 0; i < seq.length; i++) this.track.appendChild(this._buildSlide(seq[i]));

  viewport.appendChild(this.track);
  this.element.appendChild(viewport);
  this._applyIndex(false);

  if (this.container) this.container.appendChild(this.element);

  // Interações
  this._onClick = function () { self._openCurrent(); };
  this._onKey = function (e) { if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') { e.preventDefault(); self._openCurrent(); } };
  // Pausa no hover E no foco de teclado — só retoma quando não há mouse nem foco.
  this._onEnter = function () { self._hovered = true; self._syncRotation(); };
  this._onLeave = function () { self._hovered = false; self._syncRotation(); };
  this._onFocus = function () { self._focused = true; self._syncRotation(); };
  this._onBlur = function () { self._focused = false; self._syncRotation(); };
  this._onVis = function () { if (!document.hidden) self.fetchAll(); };

  this.element.addEventListener('click', this._onClick);
  this.element.addEventListener('keydown', this._onKey);
  this.element.addEventListener('mouseenter', this._onEnter);
  this.element.addEventListener('mouseleave', this._onLeave);
  this.element.addEventListener('focus', this._onFocus);
  this.element.addEventListener('blur', this._onBlur);
  document.addEventListener('visibilitychange', this._onVis);
};

// Retoma a rotação só quando não há mouse sobre a pill nem foco de teclado.
CurrencyRotatorComponent.prototype._syncRotation = function () {
  if (this._hovered || this._focused) this.stopRotation();
  else this.startRotation();
};

CurrencyRotatorComponent.prototype._buildSlide = function (asset) {
  const slide = document.createElement('div');
  slide.className = 'cr-slide';
  slide.dataset.asset = asset.key;
  slide.innerHTML =
    `<div class="currency-icon">${asset.icon}</div>` +
    `<div class="currency-data"><span class="currency-value">--</span><span class="currency-trend">--</span></div>`;
  return slide;
};

CurrencyRotatorComponent.prototype.currentAsset = function () {
  return ASSETS[this.rotIndex % ASSETS.length];
};

// Aplica o transform do track. animate=false => sem transição (snap do loop).
CurrencyRotatorComponent.prototype._applyIndex = function (animate) {
  if (!this.track) return;
  this.track.style.transition = animate ? '' : 'none';
  this.track.style.transform = `translateY(${-this.rotIndex * SLIDE_H}px)`;
  if (!animate) {
    // força reflow para o snap valer antes de reabilitar a transição
    void this.track.offsetHeight;
    this.track.style.transition = '';
  }
};

CurrencyRotatorComponent.prototype.advance = function () {
  const self = this;
  if (this.isDestroyed || !this.track) return;
  const N = ASSETS.length;
  this.rotIndex += 1;
  this._applyIndex(true);
  if (this.element) this.element.title = this.currentAsset().title;

  // Chegou no clone (posição N == 1º ativo): após a transição, snap para 0.
  if (this.rotIndex >= N) {
    if (this._resetTimer) clearTimeout(this._resetTimer);
    this._resetTimer = setTimeout(function () {
      if (self.isDestroyed) return;
      self.rotIndex = 0;
      self._applyIndex(false);
      if (self.element) self.element.title = self.currentAsset().title;
    }, SLIDE_MS + 60);
  }
};

CurrencyRotatorComponent.prototype.startRotation = function () {
  const self = this;
  if (this.isDestroyed) return;
  this.stopRotation();
  this._rotTimer = setInterval(function () { self.advance(); }, ROTATE_MS);
};

CurrencyRotatorComponent.prototype.stopRotation = function () {
  if (this._rotTimer) { clearInterval(this._rotTimer); this._rotTimer = null; }
  if (this._resetTimer) { clearTimeout(this._resetTimer); this._resetTimer = null; }
};

// ── Dados ─────────────────────────────────────────────────────
CurrencyRotatorComponent.prototype.startPolling = function () {
  const self = this;
  if (this.isDestroyed) return;
  if (this._pollTimer) clearInterval(this._pollTimer);
  this._pollTimer = setInterval(function () {
    if (document.hidden) return; // não faz polling em aba oculta (igual às pills)
    self.fetchAll();
  }, this.pollMs);
};

CurrencyRotatorComponent.prototype.fetchAll = function () {
  const self = this;
  for (let i = 0; i < ASSETS.length; i++) this.fetchAsset(ASSETS[i]);
};

CurrencyRotatorComponent.prototype.fetchAsset = function (asset) {
  const self = this;
  if (this.isDestroyed) return Promise.resolve();
  const controller = new AbortController();
  const timeoutId = setTimeout(function () { controller.abort(); }, FETCH_TIMEOUT);
  return fetch(asset.endpoint, { signal: controller.signal, headers: { 'Content-Type': 'application/json' } })
    .then(function (r) {
      clearTimeout(timeoutId);
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(function (j) {
      if (self.isDestroyed) return;
      if (!j || !j.ok || !j.data) throw new Error('API_ERROR');
      const val = asset.pickVal(j.data);
      const chg = asset.pickChg(j.data);
      if (val === null || val === undefined) throw new Error('NO_VALUE');
      self.data[asset.key] = { value: val, chg: (chg === null || chg === undefined) ? 0 : chg };
      self._renderAsset(asset);
      if (self.element) self.element.dataset.status = 'ok';
    })
    .catch(function () {
      clearTimeout(timeoutId);
      if (self.isDestroyed) return;
      // mantém o último valor bom; só mostra "--" se nunca houve dado
      if (!self.data[asset.key]) { self.data[asset.key] = null; self._renderAsset(asset); }
    });
};

CurrencyRotatorComponent.prototype._renderAsset = function (asset) {
  if (!this.element) return;
  const s = this.data[asset.key];
  const slides = this.element.querySelectorAll('.cr-slide[data-asset="' + asset.key + '"]');
  for (let i = 0; i < slides.length; i++) {
    const valueEl = slides[i].querySelector('.currency-value');
    const trendEl = slides[i].querySelector('.currency-trend');
    if (!valueEl || !trendEl) continue;
    if (s) {
      valueEl.textContent = asset.fmtVal(s.value);
      trendEl.textContent = fmtPct(s.chg);
      trendEl.className = 'currency-trend ' + (s.chg >= 0 ? 'positive' : 'negative');
    } else {
      valueEl.textContent = '--';
      trendEl.textContent = '--';
      trendEl.className = 'currency-trend';
    }
  }
};

// ── Clique → abre painel do ativo exibido (contrato de 3 canais) ──
CurrencyRotatorComponent.prototype._openCurrent = function () {
  const asset = this.currentAsset();
  try { sessionStorage.setItem(SS_KEY, asset.key); } catch (_) { /* noop */ }
  try { window.dispatchEvent(new CustomEvent('cotacao:asset', { detail: asset.key })); } catch (_) { /* noop */ }
  try { window.location.hash = PANEL_ROUTE; } catch (_) { /* noop */ }
};

CurrencyRotatorComponent.prototype.unmount = function () {
  this.isDestroyed = true;
  this.stopRotation();
  if (this._pollTimer) { clearInterval(this._pollTimer); this._pollTimer = null; }
  if (this.element) {
    if (this._onClick) this.element.removeEventListener('click', this._onClick);
    if (this._onKey) this.element.removeEventListener('keydown', this._onKey);
    if (this._onEnter) this.element.removeEventListener('mouseenter', this._onEnter);
    if (this._onLeave) this.element.removeEventListener('mouseleave', this._onLeave);
    if (this._onFocus) this.element.removeEventListener('focus', this._onFocus);
    if (this._onBlur) this.element.removeEventListener('blur', this._onBlur);
  }
  if (this._onVis) document.removeEventListener('visibilitychange', this._onVis);
  if (this.element) { this.element.remove(); this.element = null; }
  this.track = null;
  return Promise.resolve();
};

CurrencyRotatorComponent.prototype.healthCheck = function () {
  const checks = {
    isMounted: !!this.element,
    hasTrack: !!this.track,
    rotationActive: !!this._rotTimer,
    pollingActive: !!this._pollTimer,
    hasData: Object.keys(this.data).length > 0
  };
  const passed = Object.values(checks).filter(Boolean).length;
  return {
    status: passed >= 4 ? 'HEALTHY' : passed >= 2 ? 'DEGRADED' : 'UNHEALTHY',
    score: passed, maxScore: 5, checks, version: VERSION, moduleId: MODULE_ID, id
  };
};

CurrencyRotatorComponent.prototype.info = function () {
  return { version: VERSION, moduleId: MODULE_ID, id, capabilities, mounted: !!this.element, assets: ASSETS.map(function (a) { return a.key; }), rotIndex: this.rotIndex };
};

var currency_rotator_default = CurrencyRotatorComponent;
export {
  CurrencyRotatorComponent,
  MODULE_ID,
  VERSION,
  capabilities,
  currency_rotator_default as default,
  id
};
