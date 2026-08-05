// services/FavoritosCategorias.ts — FAVORITOS QUE CRESCEM (mega 229 · §229).
// @version 1.0.0  @created 2026-08-05
//
// §229: o favorito simples (estrela — Progresso.ts) vira três categorias:
//   RÁPIDOS      = favoritos de agora (a estrela de sempre, sem marca);
//   PERMANENTES  = marcados como "para sempre" (nunca saem do topo);
//   POR COLEÇÃO  = visão DERIVADA — favoritos agrupados pela coleção.
// Migração ADITIVA: a chave v1 da estrela fica intocada; só a marca de
// permanente ganha storage novo. Local-first, fail-safe por construção.
import { COLECOES } from './AvatarCatalog';

const CHAVE = 'dshow.avst5.favoritos.permanentes.v1';
const TETO = 200;

/** Ids marcados como PERMANENTES (sempre um Set — storage hostil = vazio). */
export function favoritosPermanentes(): Set<string> {
  try {
    const b = JSON.parse(localStorage.getItem(CHAVE) ?? '[]');
    return new Set(Array.isArray(b) ? b.filter((x): x is string => typeof x === 'string').slice(0, TETO) : []);
  } catch { return new Set(); }
}

/** Alterna a marca de permanente e devolve o novo Set. */
export function alternarPermanente(id: string): Set<string> {
  const atual = favoritosPermanentes();
  if (atual.has(id)) atual.delete(id);
  else atual.add(id);
  try { localStorage.setItem(CHAVE, JSON.stringify([...atual].slice(0, TETO))); } catch { /* sem storage */ }
  return atual;
}

/** §229: favoritos agrupados por COLEÇÃO (só coleções com ≥1 favorito). */
export function favoritosPorColecao(favs: Set<string>): Array<{ id: string; nome: string; itens: string[] }> {
  const saida: Array<{ id: string; nome: string; itens: string[] }> = [];
  for (const col of COLECOES) {
    const itens = col.itens.filter((i) => favs.has(i));
    if (itens.length) saida.push({ id: col.id, nome: col.nome, itens });
  }
  return saida;
}
