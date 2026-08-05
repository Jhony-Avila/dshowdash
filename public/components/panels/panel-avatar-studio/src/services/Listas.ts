// services/Listas.ts — LISTAS nomeadas de itens (lote 188–189 · §229–§230).
// @version 1.0.0  @created 2026-08-05
//
// "Favoritos que crescem": além da estrela simples (Progresso.ts), o
// usuário cria listas próprias ("Cyber", "Executivos"…) e agrupa itens.
// Local-first (mesma filosofia dos presets pessoais); ≤8 listas × ≤40
// itens; nomes sanitizados; ids de item validados pelo chamador.
const CHAVE = 'dshow.avst5.listas.v1';
const TETO_LISTAS = 8;
const TETO_ITENS = 40;

export interface ListaItens { id: string; nome: string; itens: string[] }

function gravar(l: ListaItens[]): void {
  try { localStorage.setItem(CHAVE, JSON.stringify(l.slice(0, TETO_LISTAS))); } catch { /* sem storage */ }
}

export function listarListas(): ListaItens[] {
  try {
    const b = JSON.parse(localStorage.getItem(CHAVE) ?? '[]');
    return Array.isArray(b)
      ? b.filter((x): x is ListaItens =>
        !!x && typeof x.id === 'string' && typeof x.nome === 'string' && Array.isArray(x.itens))
        .map((x) => ({ ...x, itens: x.itens.filter((i) => typeof i === 'string').slice(0, TETO_ITENS) }))
        .slice(0, TETO_LISTAS)
      : [];
  } catch { return []; }
}

export function sanitizarNomeLista(nome: string): string {
  return nome.replace(/[^\p{L}\p{N} \-]/gu, '').slice(0, 18).trim();
}

/** Cria e devolve a lista (null = nome vazio ou teto atingido). */
export function criarLista(nome: string): ListaItens | null {
  const limpo = sanitizarNomeLista(nome);
  const listas = listarListas();
  if (!limpo || listas.length >= TETO_LISTAS) return null;
  const nova: ListaItens = { id: `ls_${Date.now().toString(36)}_${listas.length}`, nome: limpo, itens: [] };
  gravar([...listas, nova]);
  return nova;
}

export function renomearLista(id: string, nome: string): void {
  const limpo = sanitizarNomeLista(nome);
  if (!limpo) return;
  gravar(listarListas().map((l) => (l.id === id ? { ...l, nome: limpo } : l)));
}

export function excluirLista(id: string): void {
  gravar(listarListas().filter((l) => l.id !== id));
}

/** Alterna o item na lista; devolve true se ficou DENTRO. */
export function alternarNaLista(listaId: string, itemId: string): boolean {
  let dentro = false;
  gravar(listarListas().map((l) => {
    if (l.id !== listaId) return l;
    if (l.itens.includes(itemId)) return { ...l, itens: l.itens.filter((i) => i !== itemId) };
    dentro = true;
    return { ...l, itens: [...l.itens, itemId].slice(0, TETO_ITENS) };
  }));
  return dentro;
}
