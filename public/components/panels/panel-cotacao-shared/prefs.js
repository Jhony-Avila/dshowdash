/**
 * panel-cotacao-shared/prefs.js — Persistência das preferências do painel de cotação (ativo/período/tipo/indicadores).
 * @version 1.0.0
 * Fonte da verdade = servidor (/api/user/preferences, key/value genérico). Espelho local p/ boot imediato.
 * Padrão copiado de world-clock-map/core/prefs.js (CSRF via SecurityCSRF→meta→cookie→check.php).
 */
'use strict';
const SERVER_KEY = "cotacao.prefs";
const LOCAL_KEY = "dsd:cotacao:prefs";
const API = "/api/user/preferences";

export function readLocal() {
  try { const raw = localStorage.getItem(LOCAL_KEY); if (!raw) return null; const o = JSON.parse(raw); return (o && typeof o === "object") ? o : null; } catch (_) { return null; }
}
function writeLocal(obj) { try { localStorage.setItem(LOCAL_KEY, JSON.stringify(obj)); } catch (_) {} }

export async function fetchServer() {
  try {
    const res = await fetch(API, { method: "GET", credentials: "include", headers: { Accept: "application/json" } });
    if (!res.ok) return null;
    const data = await res.json();
    const prefs = (data && data.preferences) ? data.preferences : data;
    const val = prefs ? prefs[SERVER_KEY] : undefined;
    return (val && typeof val === "object") ? val : null;
  } catch (_) { return null; }
}

export async function save(obj) {
  writeLocal(obj);
  try {
    const res = await fetch(API, {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json", Accept: "application/json", "X-CSRF-Token": await _csrf() },
      body: JSON.stringify({ key: SERVER_KEY, value: obj })
    });
    return res.ok;
  } catch (_) { return false; }
}

function _fromDomOrGlobal() {
  try { if (typeof window !== "undefined" && window.SecurityCSRF && window.SecurityCSRF.getToken) { const t = window.SecurityCSRF.getToken(); if (t) return t; } } catch (_) {}
  const meta = document.querySelector('meta[name="csrf-token"]');
  if (meta && meta.getAttribute("content")) return meta.getAttribute("content");
  const m = document.cookie.split("; ").find((c) => c.indexOf("csrf_token=") === 0);
  if (m) return decodeURIComponent(m.split("=")[1]);
  return "";
}
async function _csrf() {
  const t = _fromDomOrGlobal(); if (t) return t;
  try { const res = await fetch("/api/auth/check.php", { method: "GET", credentials: "include", headers: { Accept: "application/json" } });
    if (res.ok) { const j = await res.json(); return (j && j.data && j.data.session && j.data.session.csrf_token) || ""; } } catch (_) {}
  return "";
}
