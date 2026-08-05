// services/Evolucao.ts — EVOLUÇÃO do avatar (lote 181–187 · §241–§246).
// @version 1.0.0  @created 2026-08-05
//
// Linha de evolução local: cada SALVAMENTO com mudança real vira um MARCO
// (config completo + origem + data). Alimenta a linha §241, o antes/depois
// §242, o álbum §243, a timeline "tipo git" §244, o diário §245 e as
// MEMÓRIAS §246 (nota livre por marco, sanitizada). Ring ≤24 — configs
// são JSON pequenos; nada disso é destrutivo nem obrigatório.
import type { AvatarConfig } from '../domain/types';
import { hashConfig } from './AvatarCatalog';

const CHAVE = 'dshow.avst5.evolucao.v1';
const TETO = 24;

export type OrigemMarco = 'salvo' | 'preset' | 'consultor' | 'restauracao' | 'primeiro';

export interface MarcoEvolucao {
  id: string;
  quando: number; // epoch ms
  origem: OrigemMarco;
  config: AvatarConfig;
  /** §246: memória — nota livre curta (sanitizada) */
  nota?: string;
}

function gravar(l: MarcoEvolucao[]): void {
  try { localStorage.setItem(CHAVE, JSON.stringify(l.slice(-TETO))); } catch { /* sem storage */ }
}

export function marcosEvolucao(): MarcoEvolucao[] {
  try {
    const b = JSON.parse(localStorage.getItem(CHAVE) ?? '[]');
    return Array.isArray(b)
      ? b.filter((m): m is MarcoEvolucao =>
        !!m && typeof m.id === 'string' && typeof m.quando === 'number'
        && !!m.config && typeof m.config === 'object').slice(-TETO)
      : [];
  } catch { return []; }
}

/** Registra um marco (dedupe pelo hash do último — salvar 2× não duplica). */
export function registrarMarco(config: AvatarConfig, origem: OrigemMarco): void {
  const lista = marcosEvolucao();
  const ultimo = lista[lista.length - 1];
  if (ultimo && hashConfig(ultimo.config) === hashConfig(config)) return;
  lista.push({
    id: `evo_${Date.now().toString(36)}_${lista.length}`,
    quando: Date.now(),
    origem: lista.length === 0 ? 'primeiro' : origem,
    config,
  });
  gravar(lista);
}

/** §246: memória do marco — mesma whitelist da legenda da foto, ≤80. */
export function definirNotaMarco(id: string, nota: string): void {
  const limpa = nota.replace(/[^\p{L}\p{N} .,!?'\-]/gu, '').slice(0, 80).trim();
  gravar(marcosEvolucao().map((m) => {
    if (m.id !== id) return m;
    if (!limpa) { const { nota: _n, ...resto } = m; return resto as MarcoEvolucao; }
    return { ...m, nota: limpa };
  }));
}

export function excluirMarco(id: string): void {
  gravar(marcosEvolucao().filter((m) => m.id !== id));
}

export const ROTULO_ORIGEM: Record<OrigemMarco, string> = {
  primeiro: 'Primeiro avatar',
  salvo: 'Salvamento',
  preset: 'Preset aplicado',
  consultor: 'Consultor',
  restauracao: 'Restauração',
};
