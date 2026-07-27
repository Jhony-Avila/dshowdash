/**
 * panel-cotacao-shared/render.js — Painel ÚNICO de cotação com ABAS (Dólar/Yuan/Bitcoin) no #main.
 * @version 3.0.0
 * Google-Finance-like: área/linha/velas, indicadores (SMA/EMA/Bollinger/Volume/Máx-Mín), comparação c/ legenda,
 * estatísticas, tempo real 1D, preferências persistidas, acessibilidade (ARIA + teclado nas abas).
 */
import { renderChart, computeSMA, computeEMA, computeBollinger, computeRSI, computeMACD } from "./chart.js";
import * as Prefs from "./prefs.js";

const API = "/api/currencies/history.php";
const CSS_HREF = "/components/panels/panel-cotacao-shared/panel.css";
const SS_KEY = "cotacao:asset";
const RANGES = [
  { key: "1D", label: "1D" }, { key: "5D", label: "5D" }, { key: "1M", label: "1M" },
  { key: "6M", label: "6M" }, { key: "YTD", label: "AAD" }, { key: "1A", label: "1A" },
  { key: "5A", label: "5A" }, { key: "MAX", label: "MÁX" }
];
const ASSETS = {
  "usd-brl": { name: "Dólar dos Estados Unidos / Real brasileiro", tab: "Dólar", fmt: "brl" },
  "usd-cny": { name: "Dólar americano / Yuan chinês", tab: "Yuan", fmt: "num" },
  "btc":     { name: "Bitcoin / Dólar americano", tab: "Bitcoin", fmt: "usd" }
};
const ORDER = ["usd-brl", "usd-cny", "btc"];
const TYPES = [{ v: "area", l: "Área" }, { v: "line", l: "Linha" }, { v: "candle", l: "Velas" }];
const INDS = [
  { k: "sma", l: "Média móvel (SMA 20)" }, { k: "ema", l: "Média exp. (EMA 20)" },
  { k: "bollinger", l: "Bandas de Bollinger" }, { k: "markers", l: "Marcar Máx/Mín" },
  { k: "rsi", l: "RSI (14)" }, { k: "macd", l: "MACD (12/26/9)" },
  { k: "volume", l: "Volume", btcOnly: true }
];
const COMPARE_COLOR = "var(--accent-primary)";
const isBtc = (a) => a === "btc";
const canCandle = (a) => isBtc(a);

function pad2(n) { return n < 10 ? "0" + n : "" + n; }
function fmtPrice(v, fmt) {
  if (v == null || isNaN(v)) return "--";
  if (fmt === "usd") return "$" + Number(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 4, maximumFractionDigits: 4 });
}
function fmtPct(v) { return (v >= 0 ? "+" : "") + Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + "%"; }
function fmtAbs(v, fmt) { return (v >= 0 ? "+" : "-") + fmtPrice(Math.abs(v), fmt); }
function fmtStamp(ms) {
  const d = new Date(ms || Date.now());
  return d.getUTCDate() + "/" + pad2(d.getUTCMonth() + 1) + ", " + pad2(d.getUTCHours()) + ":" + pad2(d.getUTCMinutes()) + ":" + pad2(d.getUTCSeconds()) + " UTC";
}
function loadCSS() { if (!document.querySelector(`link[href="${CSS_HREF}"]`)) { const l = document.createElement("link"); l.rel = "stylesheet"; l.href = CSS_HREF; document.head.appendChild(l); } }
function ssAsset() { try { const a = sessionStorage.getItem(SS_KEY); return (a && ASSETS[a]) ? a : null; } catch (_) { return null; } }

export function createCotacaoPanel() {
  const MODULE_ID = "panels/panel-cotacao";
  const VERSION = "3.0.0";
  const S = {
    root: null, asset: "usd-brl", range: "1D", chartType: "area", compareAsset: null,
    ind: { sma: false, ema: false, bollinger: false, markers: false, rsi: false, macd: false, volume: false },
    chartCtl: null, timer: null, reqId: 0, data: null, compareData: null, mounted: false,
    onResize: null, onExtAsset: null, _docClose: null, _onKey: null, _prefsLoaded: false, fullscreen: false
  };

  async function fetchSeries(a, range, extras) {
    let url = `${API}?asset=${encodeURIComponent(a)}&range=${encodeURIComponent(range)}`;
    if (extras) url += `&extras=${encodeURIComponent(extras)}`;
    const r = await fetch(url, { headers: { Accept: "application/json" } });
    if (!r.ok) throw new Error("HTTP " + r.status);
    const j = await r.json();
    if (!j || !j.ok) throw new Error((j && j.error) || "API_ERROR");
    return j.data;
  }

  const el = () => S.root;
  function closeDD() { el().querySelectorAll(".cp-dd.open").forEach(d => d.classList.remove("open")); }

  function prefsSnapshot() { return { asset: S.asset, range: S.range, chartType: S.chartType, ind: { ...S.ind } }; }
  function savePrefs() { if (S._prefsLoaded) Prefs.save(prefsSnapshot()); }
  function applyPrefs(p, keepAsset) {
    if (!p) return;
    if (!keepAsset && p.asset && ASSETS[p.asset]) S.asset = p.asset;
    if (p.range && RANGES.some(r => r.key === p.range)) S.range = p.range;
    if (p.chartType && TYPES.some(t => t.v === p.chartType)) S.chartType = p.chartType;
    if (p.ind && typeof p.ind === "object") for (const k in S.ind) if (typeof p.ind[k] === "boolean") S.ind[k] = p.ind[k];
    if (S.chartType === "candle" && !canCandle(S.asset)) S.chartType = "area";
  }

  function build() {
    const p = el();
    p.classList.add("cotacao-panel");
    p.innerHTML = `
      <div class="cp-inner">
        <div class="cp-tabs" role="tablist" aria-label="Ativo">${ORDER.map((a, i) => `<button type="button" class="cp-tab" role="tab" data-asset="${a}" aria-selected="false" tabindex="${i === 0 ? 0 : -1}">${ASSETS[a].tab}</button>`).join("")}</div>
        <div class="cp-head">
          <div class="cp-name"></div>
          <div class="cp-price"></div>
          <div class="cp-change"><span class="cp-arrow"></span><span class="cp-chg-pct"></span><span class="cp-chg-abs"></span><span class="cp-today">Hoje</span></div>
          <div class="cp-updated"></div>
        </div>
        <div class="cp-toolbar">
          <div class="cp-dd" data-dd="type"><button class="cp-dd-btn" type="button" aria-haspopup="true">Área ▾</button><div class="cp-dd-menu" role="menu">
            ${TYPES.map(t => `<button type="button" role="menuitemradio" data-val="${t.v}">${t.l}</button>`).join("")}</div></div>
          <div class="cp-dd" data-dd="compare"><button class="cp-dd-btn" type="button" aria-haspopup="true">Comparar ▾</button><div class="cp-dd-menu" role="menu"></div></div>
          <div class="cp-dd" data-dd="ind"><button class="cp-dd-btn cp-ind-btn" type="button" aria-haspopup="true">Indicadores ▾</button><div class="cp-dd-menu cp-ind-menu" role="menu">
            ${INDS.map(o => `<button type="button" role="menuitemcheckbox" data-ind="${o.k}"${o.btcOnly ? ' data-btconly="1"' : ""}><span class="cp-chk"></span>${o.l}</button>`).join("")}</div></div>
          <div class="cp-actions">
            <div class="cp-dd" data-dd="alerts"><button class="cp-dd-btn cp-alert-btn" type="button" aria-haspopup="true" title="Alertas de preço">🔔 Alertas</button><div class="cp-dd-menu cp-alert-menu" role="menu"></div></div>
            <button class="cp-act" type="button" data-act="csv" title="Exportar CSV" aria-label="Exportar CSV">⭳ CSV</button>
            <button class="cp-act" type="button" data-act="png" title="Exportar imagem PNG" aria-label="Exportar PNG">⭳ PNG</button>
            <button class="cp-act cp-act-full" type="button" data-act="full" title="Tela cheia" aria-label="Tela cheia">⤢</button>
          </div>
        </div>
        <div class="cp-legend" hidden></div>
        <div class="cp-chart-wrap"><div class="cp-chart"></div><div class="cp-state" hidden></div></div>
        <div class="cp-periods"></div>
        <div class="cp-stats"></div>
      </div>`;

    // abas
    p.querySelectorAll(".cp-tab").forEach(b => b.addEventListener("click", () => switchAsset(b.dataset.asset)));
    p.querySelector(".cp-tabs").addEventListener("keydown", onTabsKey);

    // períodos
    const per = p.querySelector(".cp-periods");
    RANGES.forEach(r => {
      const b = document.createElement("button");
      b.type = "button"; b.className = "cp-per" + (r.key === S.range ? " is-sel" : "");
      b.textContent = r.label; b.dataset.range = r.key; b.setAttribute("aria-pressed", r.key === S.range ? "true" : "false");
      b.addEventListener("click", () => setRange(r.key));
      per.appendChild(b);
    });

    // tipo de gráfico
    p.querySelectorAll('[data-dd="type"] .cp-dd-menu button').forEach(btn => btn.addEventListener("click", () => setChartType(btn.dataset.val)));

    // comparar
    p.querySelector('[data-dd="compare"] .cp-dd-menu').addEventListener("click", (e) => {
      const b = e.target.closest("button[data-val]"); if (!b) return;
      S.compareAsset = b.dataset.val === "none" ? null : b.dataset.val;
      updateCompareBtn(); closeDD(); savePrefs(); load();
    });

    // indicadores (multi-seleção: mantém o menu aberto -> stopPropagation p/ o closeDD global não fechar)
    p.querySelector('[data-dd="ind"] .cp-ind-menu').addEventListener("click", (e) => {
      e.stopPropagation();
      const b = e.target.closest("button[data-ind]"); if (!b || b.classList.contains("is-disabled")) return;
      const k = b.dataset.ind; S.ind[k] = !S.ind[k];
      syncIndUI(); savePrefs(); drawChart();
    });

    // toggles de dropdown
    p.querySelectorAll(".cp-dd-btn").forEach(btn => btn.addEventListener("click", (e) => { e.stopPropagation(); const dd = btn.parentElement; const was = dd.classList.contains("open"); closeDD(); if (!was) dd.classList.add("open"); }));
    S._docClose = () => closeDD();
    document.addEventListener("click", S._docClose);

    // ações: exportar CSV/PNG, tela cheia
    p.querySelector('.cp-actions').addEventListener("click", (e) => {
      const b = e.target.closest("button[data-act]"); if (!b) return;
      if (b.dataset.act === "csv") exportCSV();
      else if (b.dataset.act === "png") exportPNG();
      else if (b.dataset.act === "full") toggleFullscreen();
    });
    // menu de alertas
    p.querySelector('.cp-alert-menu').addEventListener("click", onAlertMenuClick);
    p.querySelector('.cp-alert-menu').addEventListener("submit", onAlertSubmit);
    renderAlertsMenu();
    S._onKey = (e) => {
      if (e.key === "Escape" && S.fullscreen) { toggleFullscreen(); return; }
      if (!S.root || e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = (e.target && e.target.tagName) || "";
      if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
      if (!S.fullscreen && !S.root.matches(":hover")) return;  // atalhos só com o mouse sobre o painel (evita conflito global)
      const idx = "12345678".indexOf(e.key);
      if (idx >= 0 && RANGES[idx]) { setRange(RANGES[idx].key); e.preventDefault(); return; }
      const k = e.key.toLowerCase();
      if (k === "a") { setChartType("area"); e.preventDefault(); }
      else if (k === "l") { setChartType("line"); e.preventDefault(); }
      else if (k === "v" && canCandle(S.asset)) { setChartType("candle"); e.preventDefault(); }
    };
    document.addEventListener("keydown", S._onKey);
  }

  function exportCSV() {
    if (!S.data) return;
    const s = S.data.series || {}, pts = s.points || [], vol = s.volume || [];
    const vmap = {}; for (const v of vol) vmap[v[0]] = v[1];
    const hasVol = vol.length > 0;
    let csv = "data_utc;preco" + (hasVol ? ";volume" : "") + "\n";
    for (const p of pts) {
      csv += new Date(p[0]).toISOString() + ";" + String(p[1]).replace(".", ",") + (hasVol ? ";" + (vmap[p[0]] != null ? String(vmap[p[0]]) : "") : "") + "\n";
    }
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob), a = document.createElement("a");
    a.href = url; a.download = `cotacao-${S.asset}-${S.range}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  function toggleFullscreen() {
    S.fullscreen = !S.fullscreen;
    S.root.classList.toggle("cp-fullscreen", S.fullscreen);
    const btn = el().querySelector('.cp-act-full'); if (btn) { btn.classList.toggle("is-on", S.fullscreen); btn.setAttribute("aria-pressed", S.fullscreen ? "true" : "false"); }
    drawChart();
  }

  // ---- Exportar PNG (serializa o SVG com estilos resolvidos → canvas) ----
  function _inlineStyles(src, dst) {
    const props = ["fill", "stroke", "stroke-width", "stroke-dasharray", "opacity", "stroke-opacity", "fill-opacity", "color", "font-size", "font-family", "font-weight", "text-anchor"];
    const cs = getComputedStyle(src); let style = "";
    for (const p of props) { const v = cs.getPropertyValue(p); if (v) style += p + ":" + v + ";"; }
    dst.setAttribute("style", style);
    const sc = src.children, dc = dst.children;
    for (let i = 0; i < sc.length && i < dc.length; i++) _inlineStyles(sc[i], dc[i]);
  }
  function exportPNG() {
    const svg = el().querySelector(".cp-chart-svg"); if (!svg) return;
    const r = svg.getBoundingClientRect(), W = Math.round(r.width), H = Math.round(r.height);
    const clone = svg.cloneNode(true); _inlineStyles(svg, clone);
    clone.setAttribute("width", W); clone.setAttribute("height", H); clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    let bg = (getComputedStyle(S.root).backgroundColor || "").trim();
    if (!bg || bg === "rgba(0, 0, 0, 0)") bg = (getComputedStyle(document.documentElement).getPropertyValue("--bg-primary") || "#0b0b0f").trim();
    const xml = new XMLSerializer().serializeToString(clone), img = new Image();
    img.onload = () => {
      try {
        const scale = 2, canvas = document.createElement("canvas"); canvas.width = W * scale; canvas.height = H * scale;
        const c = canvas.getContext("2d"); c.scale(scale, scale); c.fillStyle = bg || "#0b0b0f"; c.fillRect(0, 0, W, H); c.drawImage(img, 0, 0, W, H);
        canvas.toBlob((blob) => { if (!blob) return; const url = URL.createObjectURL(blob), a = document.createElement("a"); a.href = url; a.download = `cotacao-${S.asset}-${S.range}.png`; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1500); }, "image/png");
      } catch (_) { if (window.Toast) window.Toast.error("Não foi possível exportar a imagem."); }
    };
    img.onerror = () => { if (window.Toast) window.Toast.error("Falha ao gerar a imagem."); };
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(xml);
  }

  // ---- Alertas de preço (localStorage; a ponte do header checa em 2º plano) ----
  const ALERTS_KEY = "dsd:cotacao:alerts";
  function readAlerts() { try { const a = JSON.parse(localStorage.getItem(ALERTS_KEY)); return Array.isArray(a) ? a : []; } catch (_) { return []; } }
  function writeAlerts(list) { try { localStorage.setItem(ALERTS_KEY, JSON.stringify(list)); } catch (_) {} }
  function parseNumBR(s) { if (!s) return NaN; return parseFloat(String(s).replace(/\./g, "").replace(",", ".").replace(/[^0-9.\-]/g, "")); }
  function renderAlertsMenu() {
    const menu = el().querySelector(".cp-alert-menu"); if (!menu) return;
    const cfg = ASSETS[S.asset], all = readAlerts();
    const cur = S.data && S.data.quote ? S.data.quote.current : null;
    menu.innerHTML =
      `<form class="cp-alert-form">
         <div class="cp-alert-row">
           <select name="dir" class="cp-alert-sel"><option value="above">Subir acima de</option><option value="below">Cair abaixo de</option></select>
           <input name="price" class="cp-alert-inp" type="text" inputmode="decimal" placeholder="${cur != null ? fmtPrice(cur, cfg.fmt) : "preço"}" />
         </div>
         <button type="submit" class="cp-alert-add">+ Alerta (${cfg.tab})</button>
       </form>
       <div class="cp-alert-list">${all.length ? all.map(a => `<div class="cp-alert-item"><span>${ASSETS[a.asset] ? ASSETS[a.asset].tab : a.asset} ${a.dir === "above" ? "≥" : "≤"} ${fmtPrice(a.price, ASSETS[a.asset] ? ASSETS[a.asset].fmt : "num")}</span><button type="button" class="cp-alert-del" data-id="${a.id}" aria-label="Remover">✕</button></div>`).join("") : `<div class="cp-alert-empty">Nenhum alerta.</div>`}</div>`;
    const btn = el().querySelector(".cp-alert-btn"); if (btn) btn.classList.toggle("is-on", all.length > 0);
  }
  function onAlertSubmit(e) {
    e.preventDefault(); e.stopPropagation();
    const form = e.target.closest(".cp-alert-form"); if (!form) return;
    const dir = form.dir.value, price = parseNumBR(form.price.value);
    if (isNaN(price)) { if (window.Toast) window.Toast.warning("Informe um preço válido."); return; }
    const all = readAlerts(); all.push({ id: "a" + Date.now() + Math.floor(performance.now() % 1000), asset: S.asset, dir, price }); writeAlerts(all);
    if (typeof Notification !== "undefined" && Notification.permission === "default") { try { Notification.requestPermission(); } catch (_) {} }
    renderAlertsMenu();
    try { window.dispatchEvent(new CustomEvent("cotacao:alerts-changed")); } catch (_) {}
    if (window.Toast) window.Toast.success("Alerta criado.");
  }
  function onAlertMenuClick(e) { e.stopPropagation(); const del = e.target.closest(".cp-alert-del"); if (!del) return; writeAlerts(readAlerts().filter(a => a.id !== del.dataset.id)); renderAlertsMenu(); }

  function onTabsKey(e) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft" && e.key !== "Home" && e.key !== "End") return;
    e.preventDefault();
    const i = ORDER.indexOf(S.asset);
    let n = i;
    if (e.key === "ArrowRight") n = (i + 1) % ORDER.length;
    else if (e.key === "ArrowLeft") n = (i - 1 + ORDER.length) % ORDER.length;
    else if (e.key === "Home") n = 0;
    else if (e.key === "End") n = ORDER.length - 1;
    switchAsset(ORDER[n]);
    const btn = el().querySelector(`.cp-tab[data-asset="${ORDER[n]}"]`); if (btn) btn.focus();
  }

  function updateTabs() {
    el().querySelectorAll(".cp-tab").forEach(b => {
      const sel = b.dataset.asset === S.asset;
      b.classList.toggle("is-sel", sel); b.setAttribute("aria-selected", sel ? "true" : "false"); b.tabIndex = sel ? 0 : -1;
    });
  }
  function updateCompareBtn() { el().querySelector('[data-dd="compare"] .cp-dd-btn').textContent = (S.compareAsset ? ASSETS[S.compareAsset].tab : "Comparar") + " ▾"; }
  function fillCompareMenu() {
    const menu = el().querySelector('[data-dd="compare"] .cp-dd-menu');
    const opts = [{ val: "none", label: "Nenhum" }].concat(ORDER.filter(a => a !== S.asset).map(a => ({ val: a, label: ASSETS[a].tab })));
    menu.innerHTML = opts.map(o => `<button type="button" role="menuitemradio" data-val="${o.val}"${(S.compareAsset || "none") === o.val ? ' class="is-sel"' : ""}>${o.label}</button>`).join("");
    updateCompareBtn();
  }
  function syncTypeUI() {
    const p = el();
    p.querySelector('[data-dd="type"] .cp-dd-btn').textContent = (TYPES.find(t => t.v === S.chartType) || TYPES[0]).l + " ▾";
    p.querySelectorAll('[data-dd="type"] .cp-dd-menu button').forEach(b => {
      const dis = b.dataset.val === "candle" && !canCandle(S.asset);
      b.classList.toggle("is-disabled", dis); b.classList.toggle("is-sel", b.dataset.val === S.chartType);
      if (dis) b.setAttribute("aria-disabled", "true"); else b.removeAttribute("aria-disabled");
    });
    p.querySelector(".cp-chart").classList.toggle("cp-as-line", S.chartType === "line");
  }
  function syncIndUI() {
    const btc = isBtc(S.asset);
    el().querySelectorAll('[data-dd="ind"] .cp-ind-menu button[data-ind]').forEach(b => {
      const k = b.dataset.ind, dis = b.dataset.btconly === "1" && !btc;
      b.classList.toggle("is-disabled", dis);
      b.classList.toggle("is-on", !!S.ind[k] && !dis);
      b.setAttribute("aria-checked", (!!S.ind[k] && !dis) ? "true" : "false");
    });
    const anyOn = Object.values(S.ind).some(Boolean);
    el().querySelector(".cp-ind-btn").classList.toggle("is-on", anyOn);
  }
  function syncPeriodsUI() { el().querySelectorAll(".cp-per").forEach(b => { const sel = b.dataset.range === S.range; b.classList.toggle("is-sel", sel); b.setAttribute("aria-pressed", sel ? "true" : "false"); }); }
  function syncToolbarUI() { syncTypeUI(); syncIndUI(); syncPeriodsUI(); fillCompareMenu(); updateTabs(); }

  function setState(msg, kind) {
    const st = el().querySelector(".cp-state");
    if (!msg) { st.hidden = true; st.innerHTML = ""; return; }
    st.hidden = false; st.className = "cp-state cp-state-" + (kind || "loading");
    st.innerHTML = kind === "error" ? `<div class="cp-err">${msg}<button class="cp-retry" type="button">Tentar novamente</button></div>` : `<div class="cp-spin"></div>`;
    if (kind === "error") st.querySelector(".cp-retry").addEventListener("click", load);
  }

  function renderHeader(data) {
    const p = el(), q = data.quote || {}, cfg = ASSETS[S.asset];
    p.querySelector(".cp-name").textContent = cfg.name;
    p.querySelector(".cp-price").textContent = fmtPrice(q.current, cfg.fmt);
    const up = (q.change_pct || 0) >= 0, chg = p.querySelector(".cp-change");
    chg.classList.toggle("is-up", up); chg.classList.toggle("is-down", !up);
    chg.querySelector(".cp-arrow").textContent = up ? "▲" : "▼";
    chg.querySelector(".cp-chg-pct").textContent = q.change_pct != null ? fmtPct(q.change_pct) : "--";
    chg.querySelector(".cp-chg-abs").textContent = q.change_abs != null ? "(" + fmtAbs(q.change_abs, cfg.fmt) + ")" : "";
    p.querySelector(".cp-updated").textContent = fmtStamp(q.ts);
  }

  function renderStats(data) {
    const box = el().querySelector(".cp-stats"); if (!box) return;
    const s = data.series || {}, cfg = ASSETS[S.asset], pts = s.points || [];
    if (!pts.length) { box.innerHTML = ""; return; }
    let hi = -Infinity, lo = Infinity; for (const p of pts) { if (p[1] > hi) hi = p[1]; if (p[1] < lo) lo = p[1]; }
    const cell = (k, v, cls) => `<div class="cp-stat"><span class="cp-stat-k">${k}</span><span class="cp-stat-v ${cls || ""}">${v}</span></div>`;
    const pc = s.change_pct;
    box.innerHTML =
      cell("Fecho ant.", s.prev_close != null ? fmtPrice(s.prev_close, cfg.fmt) : "--") +
      cell("Abertura", s.first != null ? fmtPrice(s.first, cfg.fmt) : "--") +
      cell("Máxima", fmtPrice(hi, cfg.fmt)) + cell("Mínima", fmtPrice(lo, cfg.fmt)) +
      cell("Variação (período)", pc != null ? fmtPct(pc) : "--", pc == null ? "" : (pc >= 0 ? "cp-stat-up" : "cp-stat-down"));
  }

  function renderLegend() {
    const leg = el().querySelector(".cp-legend");
    if (!S.compareData) { leg.hidden = true; leg.innerHTML = ""; return; }
    const cfg = ASSETS[S.asset], s = S.data.series || {};
    const cp = s.change_pct;
    const cpts = S.compareData.points || [];
    const cchg = cpts.length >= 2 && cpts[0][1] ? ((cpts[cpts.length - 1][1] - cpts[0][1]) / cpts[0][1]) * 100 : null;
    leg.hidden = false;
    leg.innerHTML =
      `<span class="cp-leg cp-leg-a"><span class="cp-leg-dot"></span>${cfg.tab} <em class="${cp >= 0 ? "up" : "down"}">${cp != null ? fmtPct(cp) : ""}</em></span>` +
      `<span class="cp-leg cp-leg-b"><span class="cp-leg-dot"></span>${S.compareData.label} <em class="${(cchg || 0) >= 0 ? "up" : "down"}">${cchg != null ? fmtPct(cchg) : ""}</em></span>`;
  }

  function drawChart() {
    if (!S.root || !S.data) return;
    const mount = el().querySelector(".cp-chart");
    if (S.chartCtl) { S.chartCtl.destroy(); S.chartCtl = null; }
    const cfg = ASSETS[S.asset], s = S.data.series || {}, pts = s.points || [];
    const overlays = [];
    if (S.ind.sma) overlays.push({ kind: "sma", points: computeSMA(pts, 20), color: "var(--warning)" });
    if (S.ind.ema) overlays.push({ kind: "ema", points: computeEMA(pts, 20), color: "var(--accent-secondary)" });
    if (S.ind.bollinger) { const b = computeBollinger(pts, 20, 2); overlays.push({ kind: "bollinger", upper: b.upper, mid: b.mid, lower: b.lower }); }
    const oscillators = [];
    if (S.ind.rsi) { const r = computeRSI(pts, 14); if (r.length) oscillators.push({ kind: "rsi", points: r }); }
    if (S.ind.macd) { const m = computeMACD(pts, 12, 26, 9); if (m.macd.length) oscillators.push({ kind: "macd", macd: m.macd, signal: m.signal, hist: m.hist }); }
    const useCandle = S.chartType === "candle" && S.data.has_ohlc && (S.data.candles || []).length;
    // fallback: pediu Velas mas os candles não vieram (fonte indisponível/rate-limit) → mostra Área
    const drawType = useCandle ? "candle" : (S.chartType === "candle" ? "area" : S.chartType);
    const volOn = S.ind.volume && S.data.has_volume;
    // altura dinâmica: gráfico principal + strip de volume + sub-painéis de osciladores
    const mainBase = S.fullscreen ? Math.max(360, window.innerHeight - 360) : 320;
    mount.style.height = (mainBase + (volOn ? 48 : 0) + oscillators.length * 68) + "px";
    const opts = {
      type: drawType, points: pts, prevClose: s.prev_close, direction: s.direction,
      fmt: cfg.fmt, range: S.range, pair: S.data.pair, intraday: S.range === "1D",
      compare: S.compareData || null, overlays, oscillators,
      candles: useCandle ? S.data.candles : null,
      volume: volOn ? (s.volume || null) : null,
      markers: S.ind.markers
    };
    mount.classList.toggle("cp-as-line", S.chartType === "line");
    S.chartCtl = renderChart(mount, opts);
  }

  async function load() {
    if (!S.mounted) return;
    const my = ++S.reqId;
    setState("carregando", "loading");
    try {
      const extras = (S.chartType === "candle" && canCandle(S.asset)) ? "ohlc" : "";
      const data = await fetchSeries(S.asset, S.range, extras);
      if (my !== S.reqId || !S.mounted) return;
      S.data = data;
      S.compareData = null;
      if (S.compareAsset && S.compareAsset !== S.asset) {
        try { const cd = await fetchSeries(S.compareAsset, S.range, ""); if (my !== S.reqId || !S.mounted) return;
          S.compareData = { label: ASSETS[S.compareAsset].tab, points: (cd.series || {}).points || [], color: COMPARE_COLOR }; } catch (_) { S.compareData = null; }
      }
      renderHeader(data); setState(null); drawChart(); renderStats(data); renderLegend();
      if (!el().querySelector('[data-dd="alerts"]').classList.contains("open")) renderAlertsMenu();
    } catch (e) {
      if (my !== S.reqId || !S.mounted) return;
      setState("Não foi possível carregar a série.", "error");
    }
  }

  function switchAsset(a) {
    if (!ASSETS[a] || a === S.asset) return;
    S.asset = a;
    try { sessionStorage.setItem(SS_KEY, a); } catch (_) {}
    if (S.compareAsset === a) S.compareAsset = null;
    if (S.chartType === "candle" && !canCandle(a)) S.chartType = "area";
    updateTabs(); syncTypeUI(); syncIndUI(); fillCompareMenu(); restartTimer(); savePrefs(); load();
  }
  function setRange(range) { if (S.range === range) return; S.range = range; syncPeriodsUI(); restartTimer(); savePrefs(); load(); }
  function setChartType(t) {
    if (t === "candle" && !canCandle(S.asset)) return;
    if (S.chartType === t) { closeDD(); return; }
    const wasCandle = S.chartType === "candle", nowCandle = t === "candle";
    S.chartType = t; syncTypeUI(); closeDD(); savePrefs();
    if (wasCandle !== nowCandle) load(); else drawChart();  // candle precisa de extras=ohlc
  }
  function restartTimer() { if (S.timer) { clearInterval(S.timer); S.timer = null; } if (S.range === "1D") S.timer = setInterval(() => { if (S.mounted && !document.hidden) load(); }, 30000); }

  function mount(root) {
    loadCSS();
    S.root = root; S.mounted = true;
    S.asset = "usd-brl"; S.range = "1D"; S.chartType = "area"; S.compareAsset = null;
    S.ind = { sma: false, ema: false, bollinger: false, markers: false, rsi: false, macd: false, volume: false };
    S.data = null; S.compareData = null; S._prefsLoaded = false;
    applyPrefs(Prefs.readLocal(), false);
    const sa = ssAsset(); if (sa) S.asset = sa;
    if (S.chartType === "candle" && !canCandle(S.asset)) S.chartType = "area";
    build(); syncToolbarUI();
    S.onResize = () => { if (S.mounted && S.data) drawChart(); };
    window.addEventListener("resize", S.onResize);
    S.onExtAsset = (e) => { if (e && e.detail && ASSETS[e.detail]) switchAsset(e.detail); };
    window.addEventListener("cotacao:asset", S.onExtAsset);
    restartTimer();
    load();
    // preferências do servidor (fonte da verdade) — aplica sem sobrescrever o ativo vindo do pill
    Prefs.fetchServer().then(p => {
      S._prefsLoaded = true;
      if (p && S.mounted) { applyPrefs(p, !!sa); syncToolbarUI(); restartTimer(); load(); }
    }).catch(() => { S._prefsLoaded = true; });
    return Promise.resolve(true);
  }

  function unmount() {
    S.mounted = false;
    if (S.timer) { clearInterval(S.timer); S.timer = null; }
    if (S.chartCtl) { S.chartCtl.destroy(); S.chartCtl = null; }
    if (S.onResize) { window.removeEventListener("resize", S.onResize); S.onResize = null; }
    if (S.onExtAsset) { window.removeEventListener("cotacao:asset", S.onExtAsset); S.onExtAsset = null; }
    if (S._docClose) { document.removeEventListener("click", S._docClose); S._docClose = null; }
    if (S._onKey) { document.removeEventListener("keydown", S._onKey); S._onKey = null; }
    if (S.root) { S.root.classList.remove("cp-fullscreen"); S.root.innerHTML = ""; S.root = null; }
    S.fullscreen = false;
    S.data = null; S.compareData = null;
    return Promise.resolve(true);
  }

  const destroy = () => unmount();
  const dispose = () => unmount();
  const healthCheck = () => ({ status: "HEALTHY", checks: { mounted: S.mounted }, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() });
  const info = () => ({ moduleId: MODULE_ID, version: VERSION, asset: S.asset, mounted: S.mounted });
  return { mount, unmount, destroy, dispose, healthCheck, info, VERSION, MODULE_ID };
}
