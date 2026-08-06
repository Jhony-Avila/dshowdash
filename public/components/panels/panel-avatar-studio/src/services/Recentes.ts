// services/Recentes.ts — RECENTES do catálogo (mega 391 · §88, lote
// 391–400, flag as5.catalogo_v2).
// @version 1.0.0  @created 2026-08-06
//
// Ring de 8 ids na ORDEM de uso (itensUsados §85 é um Set sem ordem —
// aqui é a recência que importa). Local, best-effort, sem PII.
const CHAVE = 'dshow.avst5.recentes.v1';
const LIMITE = 8;

export function lerRecentes(): string[] {
  try {
    const b = JSON.parse(localStorage.getItem(CHAVE) ?? '[]');
    return Array.isArray(b) ? b.filter((x): x is string => typeof x === 'string').slice(0, LIMITE) : [];
  } catch { return []; }
}

export function registrarRecente(id: string): void {
  try {
    const lista = [id, ...lerRecentes().filter((x) => x !== id)].slice(0, LIMITE);
    localStorage.setItem(CHAVE, JSON.stringify(lista));
    window.dispatchEvent(new Event('avst:recentes')); // a grade reage na hora
  } catch { /* sem storage */ }
}
