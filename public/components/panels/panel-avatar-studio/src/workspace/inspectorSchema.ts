// workspace/inspectorSchema.ts — SCHEMA do Inspector contextual (AS6
// §181–§186). @version 1.0.0  @created 2026-08-09  (lote 921–930,
// decisão #94, flag as6.inspector)
//
// O Inspector é dirigido por DADO, não por if/else espalhado: cada
// categoria declara quais grupos fazem sentido (§181 — "mostrar apenas
// o que faz sentido naquele momento"), quais camadas do config ela
// enxerga e quais slots de cor expõe (§182). Mudar o comportamento de
// uma categoria = mudar UMA linha aqui.
import type { CamadaId, CategoriaId } from '../domain/types';

export type GrupoInspectorId =
  | 'identidade' | 'propriedades' | 'cores' | 'compatibilidade' | 'acoes';

/** Rótulos dos grupos (§183 — Categoria/Propriedades/Compatibilidade/Ações). */
export const ROTULO_GRUPO: Record<GrupoInspectorId, string> = {
  identidade: 'Identidade',
  propriedades: 'Propriedades',
  cores: 'Cores',
  compatibilidade: 'Compatibilidade',
  acoes: 'Ações',
};

/** §182: grupos POR CATEGORIA, na ordem do briefing (Roupa põe cor na
 *  frente; categorias sem params não ganham grupo de propriedades). */
export const GRUPOS_POR_CATEGORIA: Record<CategoriaId, GrupoInspectorId[]> = {
  // onda 1414 (#162): categorias faciais novas
  sobrancelha: ['identidade', 'cores', 'acoes'],
  nariz: ['identidade', 'acoes'],
  barba: ['identidade', 'cores', 'compatibilidade', 'acoes'],
  base: ['identidade', 'propriedades', 'cores', 'acoes'],
  cabelo: ['identidade', 'propriedades', 'cores', 'acoes'],
  olhos: ['identidade', 'propriedades', 'cores', 'acoes'],
  boca: ['identidade', 'propriedades', 'cores', 'acoes'],
  roupa: ['identidade', 'cores', 'propriedades', 'compatibilidade', 'acoes'],
  // §3393 (decisão #95): sobrepeça segue o schema da roupa
  roupa_sobre: ['identidade', 'cores', 'propriedades', 'compatibilidade', 'acoes'],
  acessorio: ['identidade', 'propriedades', 'compatibilidade', 'acoes'],
  fundo: ['identidade', 'acoes'],
  moldura: ['identidade', 'propriedades', 'acoes'],
  efeito: ['identidade', 'propriedades', 'compatibilidade', 'acoes'],
  aura: ['identidade', 'propriedades', 'cores', 'compatibilidade', 'acoes'],
  banner: ['identidade', 'acoes'],
  emblema: ['identidade', 'propriedades', 'acoes'],
};

/** Camadas do config que a categoria enxerga (§181 — nada de mostrar
 *  botas editando cabelo). Acessórios são os 3 slots aditivos (#41). */
export function camadasDaCategoria(categoria: CategoriaId): CamadaId[] {
  if (categoria === 'base') return [];
  if (categoria === 'acessorio') return ['acessorio_cabeca', 'acessorio_rosto', 'acessorio_pescoco'];
  return [categoria];
}

/** Estado do accordion (§185–§189): 'todos' = estado completo §189
 *  (primeiro uso); um id = expansão inteligente §186 (o grupo usado
 *  fica aberto, os demais recolhem); null = compacto §188 (só
 *  ícones+títulos). Preferência local, nunca no config do avatar. */
export type AberturaInspector = GrupoInspectorId | 'todos' | null;
export const CHAVE_INSPECTOR = 'dshow.avst6.inspector.v1';
export function lerGrupoAberto(): AberturaInspector {
  try {
    const b = JSON.parse(localStorage.getItem(CHAVE_INSPECTOR) ?? 'null');
    if (!b || typeof b !== 'object') return 'todos';
    const ids: Array<GrupoInspectorId | 'todos' | null> = [
      'identidade', 'propriedades', 'cores', 'compatibilidade', 'acoes', 'todos', null];
    return ids.includes(b.aberto) ? b.aberto : 'todos';
  } catch { return 'todos'; }
}
export function gravarGrupoAberto(aberto: AberturaInspector): void {
  try { localStorage.setItem(CHAVE_INSPECTOR, JSON.stringify({ aberto })); } catch { /* sem storage */ }
}
