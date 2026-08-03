// services/RegistryService.ts — cliente do ASSET REGISTRY (AS5 F1, §618).
// @version 1.0.0  @created 2026-07-31
//
// Consome /api/avatar/registry.php (envelope §624) ATRÁS da flag
// as5.registry_api. Enquanto a flag estiver desligada — ou em qualquer
// falha — o catálogo TS local continua sendo a fonte (fallback F0):
// nenhuma tela depende deste serviço para funcionar.
import { flag } from '../nucleo/flags';
import type { AssetContrato, Envelope, Regra } from '../nucleo/contratos';

const URL = '/api/avatar/registry.php';

export interface FiltrosRegistry {
  categoria?: string;
  colecao?: string;
  raridade?: string;
  renderer?: '2d' | '3d';
  busca?: string;
  favorito?: boolean;
  ordenacao?: 'padrao' | 'nome' | 'raridade' | 'recentes';
  pagina?: number;
  porPagina?: number;
}

export interface PaginaAssets {
  assets: Array<Pick<AssetContrato, 'id' | 'nome' | 'categoria' | 'raridade'> & {
    descricaoCurta: string | null; renderers: string[]; premium: boolean;
    thumbnailUrl: string | null; colecao: string | null;
  }>;
  total: number;
  pagina: number;
  paginas: number;
}

export function registryAtivo(): boolean {
  return flag('as5.registry_api');
}

async function pedir<T>(params: Record<string, string>): Promise<T | null> {
  try {
    const qs = new URLSearchParams(params).toString();
    const r = await fetch(`${URL}?${qs}`, { credentials: 'include', cache: 'no-store' });
    if (!r.ok) return null;
    const corpo = (await r.json()) as Envelope<T>;
    return corpo.success ? corpo.data : null;
  } catch { return null; } // qualquer falha → chamador cai no catálogo TS
}

/** Lista paginada (§618.1). null = indisponível → use o catálogo local. */
export async function listarAssets(f: FiltrosRegistry = {}): Promise<PaginaAssets | null> {
  interface Bruto {
    assets: Array<{ key: string; name: string; short_description: string | null;
      supported_renderers: string; is_premium: number; thumbnail_url: string | null;
      categoria: string; raridade: string | null; colecao: string | null }>;
  }
  const params: Record<string, string> = { recurso: 'assets' };
  if (f.categoria) params.categoria = f.categoria;
  if (f.colecao) params.colecao = f.colecao;
  if (f.raridade) params.raridade = f.raridade;
  if (f.renderer) params.renderer = f.renderer;
  if (f.busca) params.busca = f.busca;
  if (f.favorito) params.favorito = '1';
  if (f.ordenacao) params.ordenacao = f.ordenacao;
  if (f.pagina) params.pagina = String(f.pagina);
  if (f.porPagina) params.por_pagina = String(f.porPagina);

  // meta vem no envelope — pedir<T> devolve só data, então refazemos aqui
  try {
    const qs = new URLSearchParams(params).toString();
    const r = await fetch(`${URL}?${qs}`, { credentials: 'include', cache: 'no-store' });
    if (!r.ok) return null;
    const corpo = (await r.json()) as Envelope<Bruto> & { meta: { total?: number; pagina?: number; paginas?: number } };
    if (!corpo.success || !corpo.data) return null;
    return {
      assets: corpo.data.assets.map((a) => ({
        id: a.key,
        nome: a.name,
        categoria: a.categoria,
        raridade: (a.raridade ?? 'comum') as PaginaAssets['assets'][number]['raridade'],
        descricaoCurta: a.short_description,
        renderers: (a.supported_renderers ?? '').split(',').filter(Boolean),
        premium: !!a.is_premium,
        thumbnailUrl: a.thumbnail_url,
        colecao: a.colecao,
      })),
      total: Number(corpo.meta?.total ?? 0),
      pagina: Number(corpo.meta?.pagina ?? 1),
      paginas: Number(corpo.meta?.paginas ?? 1),
    };
  } catch { return null; }
}

/** Detalhe + regras declarativas (motor avaliarRegras do núcleo). */
export async function obterAsset(id: string): Promise<{ regras: Regra[]; bruto: Record<string, unknown> } | null> {
  interface Bruto { asset: Record<string, unknown> & { regras?: Array<{ rule_type: string; rule_json: string | null }> } }
  const d = await pedir<Bruto>({ recurso: 'asset', id });
  if (!d?.asset) return null;
  const regras: Regra[] = [];
  for (const r of d.asset.regras ?? []) {
    try {
      const corpo = r.rule_json ? JSON.parse(r.rule_json) as Record<string, unknown> : {};
      regras.push({ rule: r.rule_type, ...corpo } as unknown as Regra);
    } catch { /* regra malformada é ignorada — fail-safe */ }
  }
  return { regras, bruto: d.asset };
}

export async function listarCategorias(): Promise<Array<{ key: string; nome: string; slot: string | null; grupo: string | null }> | null> {
  interface Bruto { categorias: Array<{ key: string; name: string; slot_key: string | null; grupo: string | null }> }
  const d = await pedir<Bruto>({ recurso: 'categorias' });
  return d?.categorias.map((c) => ({ key: c.key, nome: c.name, slot: c.slot_key, grupo: c.grupo })) ?? null;
}
