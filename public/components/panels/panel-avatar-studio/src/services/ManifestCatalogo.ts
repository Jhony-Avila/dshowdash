// services/ManifestCatalogo.ts — ASSET MANIFEST por categoria (mega 271 ·
// §267), com streaming §274 (metadados antes do asset) e cache §277.
// @version 1.0.0  @created 2026-08-05
//
// Fonte primária: o próprio catálogo embutido (derivação PURA — nunca
// diverge do que renderiza). Com a flag as5.fundacoes_v2, um manifest
// REMOTO opcional (/assets/avatars/manifests/<categoria>.json) pode
// sobrepor metadados de DISPONIBILIDADE (atualização dinâmica §267) —
// nunca a arte: item desconhecido no catálogo é ignorado com aviso.
// Rollback §651 = flag off → derivação local pura, zero rede.
import type { CategoriaId, Raridade } from '../domain/types';
import { itensDe } from './AvatarCatalog';
import { flag } from '../nucleo/flags';
import { lembrar } from './CacheNiveis';
import { log } from './Log';

export interface EntradaManifest {
  id: string;
  nome: string;
  raridade: Raridade;
  tema: string;
  biblioteca: string;              // 'dshow' padrão — multi-biblioteca (AS3 §7)
  dependencias: string[];          // §267: requerBase
  incompatibilidades: string[];    // §267: incompativelCom
  indisponivel?: boolean;          // só via remoto (ex.: recolhido p/ ajuste)
}

export interface ManifestCategoria {
  categoria: CategoriaId;
  versao: number;
  origem: 'catalogo' | 'remoto';
  itens: EntradaManifest[];
}

function derivarLocal(categoria: CategoriaId): ManifestCategoria {
  return {
    categoria,
    versao: 1,
    origem: 'catalogo',
    itens: itensDe(categoria).map((i) => ({
      id: i.id,
      nome: i.nome,
      raridade: i.raridade,
      tema: i.tema,
      biblioteca: i.biblioteca ?? 'dshow',
      dependencias: i.requerBase ?? [],
      incompatibilidades: i.incompativelCom ?? [],
    })),
  };
}

/** Overrides remotos válidos: só DISPONIBILIDADE de itens já conhecidos. */
function aplicarRemoto(base: ManifestCategoria, bruto: unknown): ManifestCategoria {
  if (!bruto || typeof bruto !== 'object') return base;
  const lista = (bruto as { indisponiveis?: unknown }).indisponiveis;
  if (!Array.isArray(lista)) return base;
  const conhecidos = new Set(base.itens.map((i) => i.id));
  const marcar = new Set<string>();
  for (const id of lista) {
    if (typeof id !== 'string') continue;
    if (!conhecidos.has(id)) { log.aviso('manifest_id_desconhecido', { id }); continue; }
    marcar.add(id);
  }
  if (marcar.size === 0) return base;
  return {
    ...base,
    origem: 'remoto',
    itens: base.itens.map((i) => (marcar.has(i.id) ? { ...i, indisponivel: true } : i)),
  };
}

const TTL_REMOTO_MS = 5 * 60_000; // §277: 5 min — atualização dinâmica sem marretar a rede

/** Manifest da categoria (§267). Sempre resolve — remoto é só camada. */
export async function manifestoDaCategoria(categoria: CategoriaId): Promise<ManifestCategoria> {
  const local = derivarLocal(categoria);
  if (!flag('as5.fundacoes_v2')) return local;
  try {
    const bruto = await lembrar(`manifest:${categoria}`, TTL_REMOTO_MS, async () => {
      const r = await fetch(`/assets/avatars/manifests/${categoria}.json`, { cache: 'no-store' });
      if (r.status === 404) return null;           // sem override publicado — normal
      if (!r.ok) throw new Error(`http ${r.status}`);
      return await r.json() as unknown;
    });
    return bruto === null ? local : aplicarRemoto(local, bruto);
  } catch {
    return local; // rede fora = catálogo embutido (§277 degrada limpo)
  }
}
