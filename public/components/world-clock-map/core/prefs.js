/**
 * World Clock Map — persistência das cidades fixadas por usuário.
 * @version 0.2.0
 *
 * Fonte da verdade = servidor (API genérica /api/user/preferences, aceita array
 * como JSON sem schema novo). Espelho local (localStorage) só para render imediato
 * no boot — NUNCA como fonte única (senão não migra entre navegadores/dispositivos).
 *
 *   key servidor : world_clock.pinned_cities
 *   key local    : dsd:world-clock:pinned-cities   (convenção dsd:<modulo>:<recurso>)
 *
 * CSRF no POST: header X-CSRF-Token, token via window.SecurityCSRF → meta → cookie
 * → refresh por /api/auth/check.php (mesmo padrão de panel-nav-admin/nav-adapter).
 */
'use strict';

const SERVER_KEY = 'world_clock.pinned_cities';
const LOCAL_KEY = 'dsd:world-clock:pinned-cities';
const API = '/api/user/preferences';

/** Lê o espelho local (síncrono). Retorna array de ids ou null. */
export function readLocal() {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return null;
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : null;
  } catch (_e) { return null; }
}

function writeLocal(ids) {
  try { localStorage.setItem(LOCAL_KEY, JSON.stringify(ids)); } catch (_e) { /* noop */ }
}

/** Busca as cidades fixadas no servidor. Retorna array de ids ou null se indisponível. */
export async function fetchServer() {
  try {
    const res = await fetch(API, { method: 'GET', credentials: 'include', headers: { Accept: 'application/json' } });
    if (!res.ok) return null;
    const data = await res.json();
    const prefs = (data && data.preferences) ? data.preferences : data;
    const val = prefs ? prefs[SERVER_KEY] : undefined;
    return Array.isArray(val) ? val : null;
  } catch (_e) { return null; }
}

/** Grava as cidades fixadas (local imediato + servidor best-effort). */
export async function save(ids) {
  writeLocal(ids);
  try {
    const res = await fetch(API, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-CSRF-Token': await _csrf()
      },
      body: JSON.stringify({ key: SERVER_KEY, value: ids })
    });
    return res.ok;
  } catch (_e) { return false; }
}

// ===== CSRF =====
function _fromDomOrGlobal() {
  try {
    if (typeof window !== 'undefined' && window.SecurityCSRF && window.SecurityCSRF.getToken) {
      const t = window.SecurityCSRF.getToken();
      if (t) return t;
    }
  } catch (_e) { /* noop */ }
  const meta = document.querySelector('meta[name="csrf-token"]');
  if (meta && meta.getAttribute('content')) return meta.getAttribute('content');
  const m = document.cookie.split('; ').find((c) => c.indexOf('csrf_token=') === 0);
  if (m) return decodeURIComponent(m.split('=')[1]);
  return '';
}

async function _csrf() {
  const t = _fromDomOrGlobal();
  if (t) return t;
  // Fallback: renova via check.php (data.session.csrf_token).
  try {
    const res = await fetch('/api/auth/check.php', { method: 'GET', credentials: 'include', headers: { Accept: 'application/json' } });
    if (res.ok) {
      const json = await res.json();
      return (json && json.data && json.data.session && json.data.session.csrf_token) || '';
    }
  } catch (_e) { /* noop */ }
  return '';
}
