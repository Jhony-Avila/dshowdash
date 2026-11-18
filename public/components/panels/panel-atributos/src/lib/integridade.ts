// panel-atributos/src/lib/integridade.ts — funções PURAS do hotfix de integridade (18/11): decisões de gravação concorrente das telas
// Unidades (DSHOW-071), Kits (DSHOW-064/065), Dicionário (DSHOW-070) e Vincular (ações opostas). Testes: scripts/atributos/testes/hotfix-puras.sh.

// ── DSHOW-071 · Unidades ─────────────────────────────────────────────────────────────────────────────────────────────────────
/** ✕, Esc e clique no fundo só fecham o editor quando NÃO há gravação em curso. */
export const decidirFechar = (salvando: boolean): boolean => !salvando;

/** Marca o início de UMA gravação; devolve false se já há outra em curso (Enter repetido, duplo clique). */
export function iniciarGravacao(ref: { current: boolean }): boolean {
  if (ref.current) return false;
  ref.current = true;
  return true;
}

export interface FotografiaUnidade { nome: string; grandeza: string | null; fator_base: string | null }
/** O que a tela viu ao abrir o editor (enviado como `antes`; o servidor compara com a linha travada). */
export const fotografiaUnidade = (u: { nome: string; grandeza: string | null; fator_base: string | null }): FotografiaUnidade =>
  ({ nome: u.nome, grandeza: u.grandeza ?? null, fator_base: u.fator_base ?? null });
