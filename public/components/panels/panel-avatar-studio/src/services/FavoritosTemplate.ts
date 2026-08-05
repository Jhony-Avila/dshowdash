// services/FavoritosTemplate.ts — lote 211–220 (§229/§326): favoritos da
// GALERIA de templates de foto. Local-first (nunca vai ao servidor — é
// preferência de UI, sem impacto em byte-estabilidade da foto salva).
// Espelha o estilo de Listas.ts: fail-safe por construção, ring curto.
const CHAVE = 'dshow.avst5.foto.tpl.fav.v1';
const TETO = 24;

/** Ids favoritados, do mais recente ao mais antigo. Sempre um array. */
export function favoritosTemplate(): string[] {
  try {
    const a = JSON.parse(localStorage.getItem(CHAVE) ?? '[]');
    if (!Array.isArray(a)) return [];
    return a.filter((x): x is string => typeof x === 'string').slice(0, TETO);
  } catch { return []; }
}

/** Alterna um id e devolve a nova lista (recém-favoritado vai ao topo). */
export function alternarFavoritoTemplate(id: string): string[] {
  const atual = favoritosTemplate();
  const prox = atual.includes(id) ? atual.filter((x) => x !== id) : [id, ...atual].slice(0, TETO);
  try { localStorage.setItem(CHAVE, JSON.stringify(prox)); } catch { /* sem storage */ }
  return prox;
}
