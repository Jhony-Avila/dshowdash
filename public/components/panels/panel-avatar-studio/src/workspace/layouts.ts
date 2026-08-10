// workspace/layouts.ts — LAYOUTS NOMEADOS do workspace (AS6 Parte 1,
// lote 1251–1260, decisão #128, flag as6.layouts).
// @version 1.0.0  @created 2026-08-10
//
// Três slots fixos (A/B/C) guardam a GEOMETRIA do workspace: largura da
// nav, largura/estado do painel (lateral OU dock) e recolhimento. Puro
// storage — quem aplica é o shell (setters) + evento p/ o PainelCatalogo
// reler a altura da dock. Nada aqui toca o avatar (geometria ≠ estado).
export type SlotLayout = 'A' | 'B' | 'C';

export interface LayoutWorkspace {
  esq: number;
  dir: number;
  dock: 'compacta' | 'padrao' | 'expandida';
  fechado: boolean;
}

const CHAVE = 'dshow.avst6.layouts.v1';
export const EVENTO_DOCK_ESTADO = 'avst6:dock-estado';

type Mapa = Partial<Record<SlotLayout, LayoutWorkspace>>;

function lerMapa(): Mapa {
  try {
    const m = JSON.parse(localStorage.getItem(CHAVE) ?? '{}');
    return m && typeof m === 'object' ? m as Mapa : {};
  } catch { return {}; }
}

export function lerLayout(slot: SlotLayout): LayoutWorkspace | null {
  const l = lerMapa()[slot];
  return l && typeof l.esq === 'number' && typeof l.dir === 'number' ? l : null;
}

export function gravarLayout(slot: SlotLayout, layout: LayoutWorkspace): void {
  try { localStorage.setItem(CHAVE, JSON.stringify({ ...lerMapa(), [slot]: layout })); } catch { /* sem storage */ }
}
