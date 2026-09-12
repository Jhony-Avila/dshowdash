// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (10.0.0)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-lotties-management/core/catalogo
// PURPOSE: FONTE ÚNICA do catálogo de animações do painel. Não duplica lista alguma: lê o módulo canônico
//          /assets/animacoes/index.js (o mesmo consumido pelo footer/registry) e normaliza os itens
//          (id, arquivo, nome, URL válida, disponibilidade verificada por HEAD).
// NOTA:    o módulo canônico ainda resolve os arquivos internamente em /components/animacoes/ (diretório
//          inexistente — bug do módulo, que vive fora do repositório em public/assets); por isso o painel
//          monta as URLs aqui com LOTTIES_BASE_PATH (/assets/animacoes/, origem válida).
// IMPORTS: LOTTIES_BASE_PATH from ./lifecycle.js · /assets/animacoes/index.js (dinâmico, em runtime)
// PROVIDES: carregarModulo(), carregarCatalogo(), garantirLottie(), reset(), MODULO_CANONICO, VERSION, MODULE_ID
// ═══════════════════════════════════════════════════════════════
'use strict';
import { LOTTIES_BASE_PATH } from './lifecycle.js';

export const VERSION = '10.0.0';
export const MODULE_ID = 'panel-lotties-management/core/catalogo';
export const MODULO_CANONICO = '/assets/animacoes/index.js';

export interface ItemCatalogo { id: string; file: string; name: string; url: string; disponivel: boolean | null }
export interface Catalogo { origem: string; base: string; versao: string | null; itens: ItemCatalogo[] }
interface ModuloAnimacoes {
  init?: (opcoes?: Record<string, unknown>) => Promise<void>;
  info?: () => { availableAnimations?: Record<string, { file: string; name?: string }>; version?: string };
  getVersion?: () => string;
  default?: ModuloAnimacoes;
}

let _mod: ModuloAnimacoes | null = null;

export async function carregarModulo(): Promise<ModuloAnimacoes> {
  if (_mod) return _mod;
  const m = (await import(/* @vite-ignore */ MODULO_CANONICO)) as ModuloAnimacoes;
  _mod = (m && typeof m.info === 'function') ? m : (m && m.default && typeof m.default.info === 'function' ? m.default : m);
  return _mod;
}

/** Catálogo normalizado a partir do módulo canônico; verifica cada arquivo na origem válida (HEAD). */
export async function carregarCatalogo(opcoes: { verificarArquivos?: boolean } = {}): Promise<Catalogo> {
  const mod = await carregarModulo();
  const info = typeof mod.info === 'function' ? mod.info() : {};
  const lista = (info && info.availableAnimations) || {};
  const itens: ItemCatalogo[] = Object.keys(lista).map((id) => ({ id, file: lista[id].file, name: lista[id].name || id, url: LOTTIES_BASE_PATH + lista[id].file, disponivel: null }));
  if (opcoes.verificarArquivos !== false) {
    await Promise.all(itens.map(async (it) => { try { const r = await fetch(it.url, { method: 'HEAD', cache: 'no-store' }); it.disponivel = r.ok; } catch { it.disponivel = false; } }));
  }
  return { origem: MODULO_CANONICO, base: LOTTIES_BASE_PATH, versao: (info && info.version) || (typeof mod.getVersion === 'function' ? mod.getVersion() : null), itens };
}

/** Garante a biblioteca lottie-web pelo próprio módulo canônico (init carrega a CDN); true se `lottie` existir. */
export async function garantirLottie(): Promise<boolean> {
  const g = globalThis as unknown as { lottie?: unknown };
  if (typeof g.lottie !== 'undefined') return true;
  const mod = await carregarModulo();
  if (typeof mod.init === 'function') { try { await mod.init({ preloadLottie: true }); } catch { /* cai na checagem abaixo */ } }
  return typeof g.lottie !== 'undefined';
}

export function reset() { _mod = null; }
export default { VERSION, MODULE_ID, MODULO_CANONICO, carregarModulo, carregarCatalogo, garantirLottie, reset };
