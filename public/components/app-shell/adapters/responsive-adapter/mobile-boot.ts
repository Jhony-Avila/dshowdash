// mobile-boot.ts — Track E — bootstrap ADITIVO do mobile shell, atras da flag as6.mobile_shell.
// Carregado por <script type="module"> no index.html. NAO toca o app-shell.bundle.js (congelado).
// Fail-closed: ausencia / valor invalido / excecao => OFF. Flag OFF => NENHUM import dos modulos mobile.
// EXPORTS: activate, deactivate, isActive.
const FLAG = 'as6.mobile_shell';
const STORE = 'dshow.shell.flags.v1';

function flagOn(): boolean {
  try {
    const raw = localStorage.getItem(STORE);
    if (!raw) return false;
    const f = JSON.parse(raw);
    return !!(f && f[FLAG] === true);
  } catch {
    return false;
  }
}

let _booted = false;

export async function activate(): Promise<void> {
  if (_booted) return;            // idempotente
  if (!flagOn()) return;          // OFF => zero import dos modulos mobile
  _booted = true;
  try {
    const mk = await import('./mobile-marker.js');
    mk.initMobileMarker();
  } catch (e) {
    _booted = false;              // permite retry; NUNCA derruba o desktop
    try { console.error('[mobile-boot] init falhou:', e); } catch { /* ok */ }
  }
}

export async function deactivate(): Promise<void> {
  if (!_booted) return;           // idempotente
  _booted = false;
  try { const mk = await import('./mobile-marker.js'); (mk.teardownMobileMarker && mk.teardownMobileMarker()); } catch { /* ok */ }
  try { const sh = await import('./mobile-shell.js'); (sh.teardownMobileShell && sh.teardownMobileShell()); } catch { /* ok */ }
  try { var el = document.getElementById('app-shell'); if (el) el.removeAttribute('data-mobile'); } catch { /* ok */ }
}

export function isActive(): boolean { return _booted; }

// Auto-boot uma unica vez. O curador interno do marker cuida de resize/orientation/mutations.
if (typeof document !== 'undefined') {
  const run = () => { void activate(); };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run, { once: true });
  } else {
    run();
  }
  try { (window as any).__mobileBoot = { activate, deactivate, isActive }; } catch { /* ok */ }
}

export default { activate, deactivate, isActive };
