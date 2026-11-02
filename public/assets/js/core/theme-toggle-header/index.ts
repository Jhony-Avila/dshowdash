/**
 * Theme Toggle (Header) — controle VISÍVEL de tema claro/escuro no dashboard.
 * @version 3.4.0  — FONTE (TS). Irmão index.js é o shipado (transpile 1:1).
 * v3.4.0 — SYNC do Koala: grava `localStorage['koala.theme']` (toggle+boot); o iframe do Koala escuta
 *   o storage event e acompanha ao vivo. Sem loop (Koala não reescreve as chaves do dashboard). Aditivo.
 *
 * v3.3.0 — PERSISTÊNCIA REAL via `cm_theme`: no boot autenticado, o theme-manager-v2 do container-main
 *   é o ÚLTIMO a aplicar data-theme e lê `localStorage['cm_theme']` (default SYSTEM=>light se ausente).
 *   O toggle passa a gravar cm_theme=t. Mantém dshowdash_theme_prefs/theme-preference + POST servidor.
 * v3.2.0 — POST fire-and-forget /api/user/preferences {key:'theme'} com X-CSRF-Token (consistência servidor).
 *
 * v3.1.0 — GUARDAS ANTI-LOOP obrigatórias (provadas em browser real antes do go-live):
 *   (a) value-diff  — applyTheme SÓ muta se o valor for DIFERENTE do atual (setar o mesmo
 *                     valor também dispara mutação — guarda mais importante contra self-trigger).
 *   (b) reentrância — flag _applying: if (_applying) return; ... finally _applying=false.
 *   (c) anti-revert SEM observer vivo — um único setTimeout(500ms) pós-clique re-checa e
 *                     reaplica no MÁXIMO uma vez se algo reverteu. ZERO MutationObserver.
 *   (d) FUSÍVEL     — se aplicar >5x em 1s, o módulo se DESLIGA (remove listeners + timers)
 *                     e loga erro. Jamais volta a travar a página.
 * Mantém do v2 o que era certo: delegação em CAPTURA no document, z-index, persistência em
 * dshowdash_theme_prefs.theme + ThemeManager.setTheme, aria. ADITIVO (bundle/sw.js intocados).
 *
 * POST-MORTEM v2: MutationObserver(document.body,{subtree:true}) rodava a cada mutação — no boot
 * autenticado (DOM enorme) saturava a main-thread => hang. v3 removeu; v3.1 blinda com as guardas.
 */
'use strict';

type Theme = 'light' | 'dark';

const BOOT_KEY = 'dshowdash_theme_prefs';
const TM_KEY = 'theme-preference';
const CM_KEY = 'cm_theme';   // chave REAL lida pelo theme-manager-v2 do container-main no boot
const KOALA_KEY = 'koala.theme'; // SYNC: o Koala (iframe mesma origem) escuta storage desta chave
const HTML = document.documentElement;
let _last = 0;
let _applying = false;                         // (b) reentrância
let _fused = false;                            // (d) fusível disparado
let _applyTimes: number[] = [];                // (d) aplicações REAIS na janela de 1s
let _desired: Theme | null = null;             // (c) último tema desejado
let _revertTimer: ReturnType<typeof setTimeout> | null = null; // (c) timer único
let _interval: ReturnType<typeof setInterval> | null = null;   // re-injeção do botão
let _csrf: string | null = null;                               // token CSRF em cache

const SUN = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
const MOON = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';

function nowMs(): number { return (typeof performance !== 'undefined' && performance.now) ? performance.now() : +new Date(); }

function readBootPrefs(): Record<string, unknown> {
  try { return JSON.parse(localStorage.getItem(BOOT_KEY) || '{}') || {}; }
  catch (e) { return {}; }
}

function currentTheme(): Theme {
  const attr = HTML.getAttribute('data-theme');
  if (attr === 'light' || attr === 'dark') return attr;
  const t = readBootPrefs().theme;
  if (t === 'light' || t === 'dark') return t;
  return (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
}

// Desliga o módulo por completo (fusível): sem listeners, sem timers.
function teardown(): void {
  try { document.removeEventListener('click', onToggleEvent, true); } catch (e) {}
  try { document.removeEventListener('pointerdown', onToggleEvent, true); } catch (e) {}
  if (_interval) { try { clearInterval(_interval); } catch (e) {} _interval = null; }
  if (_revertTimer) { try { clearTimeout(_revertTimer); } catch (e) {} _revertTimer = null; }
}

function applyTheme(t: Theme): void {
  if (_fused || _applying) return;                       // (d) / (b)
  if (HTML.getAttribute('data-theme') === t) return;     // (a) value-diff -> no-op
  const now = nowMs();                                   // (d) fusível
  _applyTimes.push(now);
  while (_applyTimes.length && (now - _applyTimes[0]) > 1000) _applyTimes.shift();
  if (_applyTimes.length > 5) {
    _fused = true; teardown();
    try { console.error('[theme-toggle] FUSIVEL disparado (>5 reaplicacoes/1s) — modulo desligado para nao travar a pagina.'); } catch (e) {}
    return;
  }
  _applying = true;                                      // (b)
  try {
    HTML.classList.remove('theme-light', 'theme-dark', 'theme-auto');
    HTML.classList.add('theme-' + t);
    HTML.setAttribute('data-theme', t);
    try { const p = readBootPrefs(); p.theme = t; localStorage.setItem(BOOT_KEY, JSON.stringify(p)); } catch (e) {}
    try { localStorage.setItem(TM_KEY, t); } catch (e) {}
    try { localStorage.setItem(CM_KEY, t); } catch (e) {}   // <- persistência que o boot honra
    try { localStorage.setItem(KOALA_KEY, t); } catch (e) {} // SYNC: dispara storage event no iframe do Koala -> tema ao vivo
    try {
      const TM = (window as unknown as { ThemeManager?: { setTheme?: (t: string) => void } }).ThemeManager;
      if (TM && typeof TM.setTheme === 'function') TM.setTheme(t);
    } catch (e) {}
  } finally {
    _applying = false;                                    // (b)
  }
}

// (c) Anti-revert de DISPARO ÚNICO: um só timer, checa o último desejado. Sem observer, sem recursão.
function scheduleAntiRevert(desired: Theme): void {
  if (_fused) return;
  _desired = desired;
  if (_revertTimer) { clearTimeout(_revertTimer); }
  _revertTimer = setTimeout(() => {
    _revertTimer = null;
    if (_fused) return;
    if (_desired && HTML.getAttribute('data-theme') !== _desired) {
      applyTheme(_desired);
      paintAll();
    }
  }, 500);
}

// Persistência no SERVIDOR (app_user_preferences.theme). Fire-and-forget/try-catch: nunca bloqueia.
function fetchCsrf(cb: (t: string | null) => void): void {
  if (_csrf) { cb(_csrf); return; }
  try {
    fetch('/api/auth/check.php', { credentials: 'same-origin', headers: { 'Accept': 'application/json' } })
      .then((r) => (r && r.ok) ? r.json() : null)
      .then((d: any) => {
        const s = d && (d.data || d);
        const tok = s && ((s.session && s.session.csrf_token) || s.csrf_token);
        _csrf = tok || null;
        cb(_csrf);
      })
      .catch(() => cb(null));
  } catch (e) { cb(null); }
}

function persistServer(t: Theme): void {
  fetchCsrf((csrf) => {
    if (!csrf) return;
    try {
      fetch('/api/user/preferences', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf },
        body: JSON.stringify({ key: 'theme', value: t })
      }).then((r) => { if (r && r.status === 403) { _csrf = null; } }).catch(() => {});
    } catch (e) {}
  });
}

function paintAll(): void {
  const dark = currentTheme() === 'dark';
  const list = document.querySelectorAll('[data-dsd-theme-toggle]');
  for (let i = 0; i < list.length; i++) {
    const b = list[i] as HTMLElement;
    b.innerHTML = dark ? SUN : MOON;
    b.setAttribute('aria-pressed', String(dark));
    b.setAttribute('aria-label', dark ? 'Mudar para tema claro' : 'Mudar para tema escuro');
    b.setAttribute('title', dark ? 'Tema claro' : 'Tema escuro');
  }
}

function injectStyleOnce(): void {
  if (document.getElementById('dsd-theme-toggle-style')) return;
  const st = document.createElement('style');
  st.id = 'dsd-theme-toggle-style';
  st.textContent =
    '.dsd-theme-toggle{position:relative;z-index:20;display:inline-flex;align-items:center;justify-content:center;' +
    'width:34px;height:34px;padding:0;margin:0 4px;border-radius:8px;cursor:pointer;' +
    'border:1px solid var(--hdr-border,rgba(255,255,255,.08));background:transparent;' +
    'color:var(--hdr-text-muted,rgba(255,255,255,.6));transition:background .15s ease,color .15s ease,border-color .15s ease;}' +
    '.dsd-theme-toggle:hover{color:var(--hdr-text,rgba(255,255,255,.9));' +
    'background:var(--hdr-bg-scrolled,rgba(255,255,255,.06));border-color:var(--hdr-border-accent,rgba(99,102,241,.4));}' +
    '.dsd-theme-toggle:focus-visible{outline:2px solid var(--hdr-active,#6366f1);outline-offset:2px;}' +
    '.dsd-theme-toggle svg{display:block;pointer-events:none;}';
  document.head.appendChild(st);
}

function makeButton(): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'dsd-theme-toggle';
  btn.setAttribute('data-dsd-theme-toggle', '1');
  return btn;
}

// Barato: um querySelector; injeta só se faltar. NUNCA observa o DOM inteiro.
function ensureToggle(): boolean {
  const right = document.querySelector('.header-right');
  if (!right) return false;
  if (!right.querySelector('[data-dsd-theme-toggle]')) {
    injectStyleOnce();
    right.insertBefore(makeButton(), right.firstChild);
    paintAll();
  }
  return true;
}

// Delegação na CAPTURA: imune a stopPropagation e re-render.
function onToggleEvent(ev: Event): void {
  if (_fused) return;
  const target = ev.target as Element | null;
  const b = target && target.closest ? target.closest('[data-dsd-theme-toggle]') : null;
  if (!b) return;
  ev.preventDefault();
  ev.stopPropagation();
  const now = nowMs();
  if (now - _last < 250) return;   // debounce de clique
  _last = now;
  const desired: Theme = currentTheme() === 'dark' ? 'light' : 'dark';
  applyTheme(desired);
  paintAll();
  persistServer(desired);          // grava no servidor (sobrevive ao reload autenticado)
  scheduleAntiRevert(desired);     // (c)
}

// Só roda DEPOIS do boot (window.load) para JAMAIS competir com o bootstrap.
function start(): void {
  document.addEventListener('click', onToggleEvent, true);
  document.addEventListener('pointerdown', onToggleEvent, true);
  window.addEventListener('storage', (e: StorageEvent) => {
    if (e.key === BOOT_KEY || e.key === TM_KEY) paintAll();
  });
  // SYNC boot: alinha o Koala ao tema atual do dashboard já no carregamento (o iframe lê no boot / via storage).
  try { localStorage.setItem(KOALA_KEY, currentTheme()); } catch (e) {}
  ensureToggle();
  _interval = setInterval(() => {
    if (_fused) return;
    if (document.hidden) return;
    // SYNC heartbeat: mantém koala.theme = tema atual (setItem c/ valor IGUAL não dispara storage;
    // só dispara quando muda — ex.: theme-manager-v2 assenta o data-theme tarde no boot).
    try { localStorage.setItem(KOALA_KEY, currentTheme()); } catch (e) {}
    ensureToggle();
  }, 1000);
}

if (document.readyState === 'complete') {
  start();
} else {
  window.addEventListener('load', start);
}
