// Tema do Koala (light/dark). Fonte única; o anti-FOUC em index.html aplica antes do paint.
export type Theme = 'light' | 'dark';
const KEY = 'koala.theme';

/** Tema efetivo: explícito salvo (light|dark) ou, se ausente/auto, segue o SO (prefers-color-scheme). */
export function readTheme(): Theme {
  try { const t = localStorage.getItem(KEY); if (t === 'light' || t === 'dark') return t; } catch { /* noop */ }
  try { return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'; } catch { return 'light'; }
}

export function applyTheme(t: Theme): void {
  document.documentElement.setAttribute('data-theme', t);
}

export function setTheme(t: Theme): void {
  try { localStorage.setItem(KEY, t); } catch { /* noop */ }
  applyTheme(t);
}

// SYNC com o dashboard (mesma origem): quando `koala.theme` muda por FORA — o toggle do dashboard
// escreve a chave —, o storage event dispara AQUI (frames que NÃO fizeram a escrita, ex.: este iframe)
// e aplicamos o tema AO VIVO, sem reload. NÃO reescrevemos a chave (sem loop). O toggle próprio do
// Koala continua autônomo; o próximo toggle do dashboard re-sincroniza. Emite `koala:theme` p/ a UI.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e: StorageEvent) => {
    if (e.key === KEY && (e.newValue === 'light' || e.newValue === 'dark')) {
      applyTheme(e.newValue);
      try { window.dispatchEvent(new CustomEvent('koala:theme', { detail: e.newValue })); } catch { /* noop */ }
    }
  });
}
