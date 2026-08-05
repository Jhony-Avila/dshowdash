// services/PresetsExport.ts — PRESETS DE EXPORTAÇÃO da foto (mega 253 · §369).
// @version 1.0.0  @created 2026-08-05
//
// §369: combos NOMEADOS de exportação (formato + escala + transparência +
// lado do medalhão) aplicáveis em 1 clique. Local-first, ≤4, fail-safe.
import type { FormatoFotoId } from '../engine/render-foto';

const CHAVE = 'dshow.avst5.foto.export.v1';
const TETO = 4;

export interface PresetExport {
  id: string;
  nome: string;
  formato: FormatoFotoId;
  escala: 1 | 2 | 4;
  transparente: boolean;
  lado: 'esquerda' | 'direita';
}

const FORMATOS_VALIDOS: readonly string[] = ['perfil', 'header', 'banner', 'wallpaper'];

function sanitizar(bruto: unknown): PresetExport | null {
  if (!bruto || typeof bruto !== 'object') return null;
  const p = bruto as Record<string, unknown>;
  if (typeof p.id !== 'string' || typeof p.nome !== 'string' || !p.nome.trim()) return null;
  return {
    id: p.id.slice(0, 40),
    nome: p.nome.trim().slice(0, 20),
    formato: FORMATOS_VALIDOS.includes(p.formato as string) ? p.formato as FormatoFotoId : 'perfil',
    escala: p.escala === 2 || p.escala === 4 ? p.escala : 1,
    transparente: p.transparente === true,
    lado: p.lado === 'direita' ? 'direita' : 'esquerda',
  };
}

export function listarPresetsExport(): PresetExport[] {
  try {
    const b = JSON.parse(localStorage.getItem(CHAVE) ?? '[]');
    if (!Array.isArray(b)) return [];
    return b.map(sanitizar).filter((x): x is PresetExport => x !== null).slice(0, TETO);
  } catch { return []; }
}

/** Salva o combo atual com nome automático ("Export N"). null = teto. */
export function salvarPresetExport(dados: Omit<PresetExport, 'id' | 'nome'>): PresetExport | null {
  const lista = listarPresetsExport();
  if (lista.length >= TETO) return null;
  const novo = sanitizar({
    ...dados,
    id: `xp_${Date.now().toString(36)}_${lista.length}`,
    nome: `Export ${lista.length + 1}`,
  });
  if (!novo) return null;
  try { localStorage.setItem(CHAVE, JSON.stringify([...lista, novo])); } catch { /* sem storage */ }
  return novo;
}

export function excluirPresetExport(id: string): void {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(listarPresetsExport().filter((p) => p.id !== id)));
  } catch { /* sem storage */ }
}
