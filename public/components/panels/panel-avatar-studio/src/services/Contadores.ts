// services/Contadores.ts — contadores LOCAIS de uso (mega 246 · §221).
// @version 1.0.0  @created 2026-08-05
//
// §221 pede "seus números" (poderes ativados, apresentações…) — medidos
// em eventos locais simples (nunca telemetria de rede; §290 é à parte).
const CHAVE = 'dshow.avst5.contadores.v1';

export function lerContadores(): Record<string, number> {
  try {
    const b = JSON.parse(localStorage.getItem(CHAVE) ?? '{}');
    if (!b || typeof b !== 'object') return {};
    const saida: Record<string, number> = {};
    for (const [k, v] of Object.entries(b)) {
      if (typeof v === 'number' && Number.isFinite(v) && v >= 0) saida[k.slice(0, 32)] = Math.floor(v);
    }
    return saida;
  } catch { return {}; }
}

export function incrementar(chave: string): void {
  try {
    const c = lerContadores();
    c[chave] = (c[chave] ?? 0) + 1;
    localStorage.setItem(CHAVE, JSON.stringify(c));
  } catch { /* sem storage */ }
}
