/**
 * currency-panel/index.js — PONTE clique→painel ÚNICO de cotação + título + CHECADOR DE ALERTAS de preço.
 * @version 3.2.0
 * Standalone (carregado no index.html; não toca nos pills/bundle). Além de abrir o painel, roda um checador
 * de alertas de preço em 2º plano (app-wide, enquanto a aba estiver aberta): lê os alertas do localStorage
 * (setados pelo painel), busca o spot dos ativos alertados e dispara Toast + Notification ao cruzar o alvo.
 */
import { navigateToRoute } from "/components/header/components/_base/navigation-helper.js";

const MODULE_ID = "header.currency-panel-bridge";
const ROUTE = "#/panel-cotacao";
const SS_KEY = "cotacao:asset";
const PANEL_ID = "panel-cotacao";
const PANEL_TITLE = "Cotações";
const ALERTS_KEY = "dsd:cotacao:alerts";
const PILL_ASSET = {
  "currency-usd-brl-component": "usd-brl",
  "currency-usd-cny-component": "usd-cny",
  "currency-btc-component": "btc"
};
const NAMES = { "usd-brl": "Dólar", "usd-cny": "Yuan", "btc": "Bitcoin" };
const FMT = { "usd-brl": "brl", "usd-cny": "num", "btc": "usd" };
const SELECTOR = Object.keys(PILL_ASSET).map((c) => "." + c).join(",");

function ensureTitleHint() {
  if (document.querySelector(`[data-panel-id="${PANEL_ID}"][data-display-title]`)) return;
  const hint = document.createElement("div");
  hint.setAttribute("data-panel-id", PANEL_ID);
  hint.setAttribute("data-display-title", PANEL_TITLE);
  hint.hidden = true; hint.style.display = "none";
  document.body.appendChild(hint);
}

// ---- Alertas ----
function readAlerts() { try { const a = JSON.parse(localStorage.getItem(ALERTS_KEY)); return Array.isArray(a) ? a : []; } catch (_) { return []; } }
function writeAlerts(l) { try { localStorage.setItem(ALERTS_KEY, JSON.stringify(l)); } catch (_) {} }
function fmtP(v, fmt) {
  if (v == null || isNaN(v)) return "--";
  if (fmt === "usd") return "$" + Number(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 4, maximumFractionDigits: 4 });
}
function notify(al, cur) {
  const nm = NAMES[al.asset] || al.asset, fmt = FMT[al.asset] || "num";
  const msg = `${nm} ${al.dir === "above" ? "subiu acima de" : "caiu abaixo de"} ${fmtP(al.price, fmt)} — atual ${fmtP(cur, fmt)}`;
  try { if (window.Toast && window.Toast.warning) window.Toast.warning(msg); } catch (_) {}
  try { if (typeof Notification !== "undefined" && Notification.permission === "granted") new Notification("Alerta de cotação", { body: msg }); } catch (_) {}
}
let _checking = false;
async function checkAlerts() {
  if (_checking) return; const alerts = readAlerts(); if (!alerts.length) return;
  _checking = true;
  try {
    const assets = [...new Set(alerts.map((a) => a.asset))], spot = {};
    for (const a of assets) {
      try { const r = await fetch(`/api/currencies/history.php?asset=${encodeURIComponent(a)}&range=1D`, { headers: { Accept: "application/json" } }); const j = await r.json(); if (j && j.ok && j.data && j.data.quote) spot[a] = j.data.quote.current; } catch (_) {}
    }
    const remaining = [], fired = [];
    for (const al of alerts) {
      const cur = spot[al.asset];
      if (cur == null) { remaining.push(al); continue; }
      const hit = al.dir === "above" ? cur >= al.price : cur <= al.price;
      if (hit) fired.push({ al, cur }); else remaining.push(al);
    }
    if (fired.length) { writeAlerts(remaining); for (const f of fired) notify(f.al, f.cur); }
  } finally { _checking = false; }
}

let _inited = false;
function init() {
  if (_inited) return;
  _inited = true;
  ensureTitleHint();
  document.addEventListener("click", (e) => {
    const pill = e.target.closest(SELECTOR);
    if (!pill) return;
    const cls = Object.keys(PILL_ASSET).find((c) => pill.classList.contains(c));
    if (!cls) return;
    const asset = PILL_ASSET[cls];
    try { sessionStorage.setItem(SS_KEY, asset); } catch (_) {}
    try { window.dispatchEvent(new CustomEvent("cotacao:asset", { detail: asset })); } catch (_) {}
    navigateToRoute(ROUTE, MODULE_ID);
  }, true);
  // checador de alertas em 2º plano (só faz fetch se houver alertas)
  setTimeout(checkAlerts, 8000);
  setInterval(() => { if (!document.hidden) checkAlerts(); }, 60000);
  // checa na hora quando o painel cria/edita um alerta (pode já estar cruzado)
  window.addEventListener("cotacao:alerts-changed", () => checkAlerts());
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
else init();

export { init, MODULE_ID };
