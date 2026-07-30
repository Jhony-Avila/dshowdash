// services/Progresso.ts — itens já usados + favoritos (AS3 F2c, §8/§16).
// @version 1.0.0  @created 2026-07-30
//
// "Usado" = já esteve equipado no editor alguma vez (alimenta o progresso
// das coleções). Favoritos alimentam o filtro da grade. Ambos por navegador
// (localStorage); quando as conquistas server-side chegarem (F3), este
// módulo passa a espelhar o backend — a interface não muda.
import type { AvatarConfig } from '../domain/types';

const CHAVE_USADOS = 'dshow.avatar.usados.v1';
const CHAVE_FAVORITOS = 'dshow.avatar.favoritos.v1';

function ler(chave: string): Set<string> {
  try {
    const bruto = localStorage.getItem(chave);
    const lista = bruto ? JSON.parse(bruto) : [];
    return new Set(Array.isArray(lista) ? lista.filter((x) => typeof x === 'string') : []);
  } catch { return new Set(); }
}

function gravar(chave: string, valores: Set<string>): void {
  try { localStorage.setItem(chave, JSON.stringify([...valores].slice(0, 500))); } catch { /* sem espaço */ }
}

export function itensUsados(): Set<string> {
  return ler(CHAVE_USADOS);
}

/** Marca tudo que está equipado no config como "já usado". */
export function registrarUso(config: AvatarConfig): void {
  const usados = ler(CHAVE_USADOS);
  const antes = usados.size;
  usados.add(config.base);
  for (const id of Object.values(config.camadas)) if (id) usados.add(id);
  if (usados.size !== antes) gravar(CHAVE_USADOS, usados);
}

export function favoritos(): Set<string> {
  return ler(CHAVE_FAVORITOS);
}

export function alternarFavorito(id: string): Set<string> {
  const favs = ler(CHAVE_FAVORITOS);
  if (favs.has(id)) favs.delete(id);
  else favs.add(id);
  gravar(CHAVE_FAVORITOS, favs);
  return favs;
}
