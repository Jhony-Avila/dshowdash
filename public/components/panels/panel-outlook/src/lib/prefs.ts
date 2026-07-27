// lib/prefs.ts — preferências do usuário (localStorage por ora; store real =
// outlook_user_preferences §28.7, Fase 2). Compartilha as chaves de layout/densidade
// com o ViewOptions da Central, mantendo tudo em sincronia.
// @version 1.0.0  @created 2026-07-21

const K = {
  sig: 'ol_signature',
  sigAuto: 'ol_sign_auto',
  layout: 'ol_layout',
  density: 'ol_density',
};

function get(k: string, def: string): string {
  try { return localStorage.getItem(k) ?? def; } catch { return def; }
}
function set(k: string, v: string): void {
  try { localStorage.setItem(k, v); } catch { /* modo privado */ }
}

export function getSignature(): string { return get(K.sig, ''); }
export function setSignature(v: string): void { set(K.sig, v); }

export function getSignAuto(): boolean { return get(K.sigAuto, '1') === '1'; }
export function setSignAuto(b: boolean): void { set(K.sigAuto, b ? '1' : '0'); }

export type PrefLayout = 'right' | 'bottom' | 'off';
export type PrefDensity = 'comfortable' | 'compact';

export function getLayout(): PrefLayout {
  const v = get(K.layout, 'right');
  return v === 'bottom' || v === 'off' ? v : 'right';
}
export function setLayout(v: PrefLayout): void { set(K.layout, v); }

export function getDensity(): PrefDensity {
  return get(K.density, 'comfortable') === 'compact' ? 'compact' : 'comfortable';
}
export function setDensity(v: PrefDensity): void { set(K.density, v); }
