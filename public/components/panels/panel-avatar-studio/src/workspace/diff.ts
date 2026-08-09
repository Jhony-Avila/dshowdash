// workspace/diff.ts — DIFF campo a campo do avatar (AS6 §350/§322,
// lote 961–970, decisão #98, flag as6.diff_v6).
// @version 1.0.0  @created 2026-08-09
//
// "O que mudou?" (§322) deve ter resposta LEGÍVEL: campo a campo, com
// nomes reais do catálogo — nunca ids. Puro e determinístico:
// (antes, depois) → lista ordenada de mudanças. Também mantém o
// HISTÓRICO local dos últimos salvamentos (ring ≤10) para a resposta
// "o que mudou da última vez?" continuar disponível depois do save.
import type { AvatarConfig, CamadaId, SlotCor } from '../domain/types';
import { CATEGORIAS, itemPorId, tituloPorId } from '../services/AvatarCatalog';

export interface CampoDiff {
  campo: string;                 // rótulo legível ("Cabelo", "Cor · roupa")
  de: string;                    // valor anterior legível ("—" quando vazio)
  para: string;                  // valor novo legível
  tipo: 'trocado' | 'adicionado' | 'removido' | 'ajustado';
}

const nomeItem = (id?: string): string => (id && id !== 'nenhum' ? (itemPorId(id)?.nome ?? id) : '');
const nomeCamada = (chave: string): string => {
  if (chave.startsWith('acessorio')) {
    const slot = chave.split('_')[1];
    return `Acessório${slot ? ` · ${slot}` : ''}`;
  }
  return CATEGORIAS.find((c) => c.id === chave)?.nome ?? chave;
};
const NOME_SLOT_COR: Record<SlotCor, string> = { pele: 'pele', cabelo: 'cabelo', roupa: 'roupa', destaque: 'destaque' };

function porItem(saida: CampoDiff[], campo: string, de?: string, para?: string): void {
  const a = nomeItem(de);
  const b = nomeItem(para);
  if (a === b) return;
  saida.push({
    campo,
    de: a || '—',
    para: b || '—',
    tipo: !a ? 'adicionado' : !b ? 'removido' : 'trocado',
  });
}

/** Diff campo a campo, legível e ordenado (§350). */
export function diffCampos(antes: AvatarConfig, depois: AvatarConfig): CampoDiff[] {
  const d: CampoDiff[] = [];
  porItem(d, 'Base', antes.base, depois.base);
  const chaves = [...new Set([...Object.keys(antes.camadas), ...Object.keys(depois.camadas)])] as CamadaId[];
  for (const c of chaves.sort()) porItem(d, nomeCamada(c), antes.camadas[c], depois.camadas[c]);
  // título (§27) — nome real do catálogo
  if ((antes.titulo ?? '') !== (depois.titulo ?? '')) {
    const a = antes.titulo ? (tituloPorId(antes.titulo)?.nome ?? antes.titulo) : '';
    const b = depois.titulo ? (tituloPorId(depois.titulo)?.nome ?? depois.titulo) : '';
    d.push({ campo: 'Título', de: a || '—', para: b || '—', tipo: !a ? 'adicionado' : !b ? 'removido' : 'trocado' });
  }
  // cores globais por slot
  for (const s of Object.keys(NOME_SLOT_COR) as SlotCor[]) {
    if (antes.cores[s] !== depois.cores[s]) {
      d.push({ campo: `Cor · ${NOME_SLOT_COR[s]}`, de: antes.cores[s], para: depois.cores[s], tipo: 'ajustado' });
    }
  }
  // corpo/postura (§102/§118) + ajuste fino (§102.2)
  if ((antes.corpo ?? '') !== (depois.corpo ?? '')) {
    d.push({ campo: 'Tipo corporal', de: antes.corpo ?? 'médio', para: depois.corpo ?? 'médio', tipo: 'ajustado' });
  }
  if ((antes.postura ?? '') !== (depois.postura ?? '')) {
    d.push({ campo: 'Postura', de: antes.postura ?? 'neutra', para: depois.postura ?? 'neutra', tipo: 'ajustado' });
  }
  if (JSON.stringify(antes.corpoFino ?? {}) !== JSON.stringify(depois.corpoFino ?? {})) {
    d.push({ campo: 'Ajuste fino', de: resumoFino(antes.corpoFino), para: resumoFino(depois.corpoFino), tipo: 'ajustado' });
  }
  // §71: propriedades por camada, param a param
  const camadasParams = [...new Set([...Object.keys(antes.params ?? {}), ...Object.keys(depois.params ?? {})])];
  for (const c of camadasParams.sort()) {
    const pa = antes.params?.[c as CamadaId] ?? {};
    const pb = depois.params?.[c as CamadaId] ?? {};
    const ids = [...new Set([...Object.keys(pa), ...Object.keys(pb)])];
    for (const id of ids.sort()) {
      if (pa[id] !== pb[id]) {
        d.push({
          campo: `${nomeCamada(c)} · ${id}`,
          de: pa[id] !== undefined ? String(pa[id]) : 'padrão',
          para: pb[id] !== undefined ? String(pb[id]) : 'padrão',
          tipo: 'ajustado',
        });
      }
    }
  }
  // §73: canais de cor por camada
  const camadasCanais = [...new Set([...Object.keys(antes.coresCamada ?? {}), ...Object.keys(depois.coresCamada ?? {})])];
  for (const c of camadasCanais.sort()) {
    const ca = antes.coresCamada?.[c as CamadaId] ?? {};
    const cb = depois.coresCamada?.[c as CamadaId] ?? {};
    const canais = [...new Set([...Object.keys(ca), ...Object.keys(cb)])] as SlotCor[];
    for (const canal of canais.sort()) {
      if (ca[canal] !== cb[canal]) {
        d.push({
          campo: `${nomeCamada(c)} · canal ${NOME_SLOT_COR[canal]}`,
          de: ca[canal] ?? 'global',
          para: cb[canal] ?? 'global',
          tipo: 'ajustado',
        });
      }
    }
  }
  return d;
}

function resumoFino(f?: { largura?: number; altura?: number }): string {
  if (!f || (!f.largura && !f.altura)) return 'neutro';
  return [f.largura ? `largura ${f.largura}×` : '', f.altura ? `altura ${f.altura}×` : ''].filter(Boolean).join(' · ');
}

// ── Histórico local de salvamentos (§350 + "como volto atrás?" §322) ──
export const CHAVE_HIST_DIFF = 'dshow.avst6.diff.hist.v1';
export interface EntradaHistDiff { em: string; total: number; resumo: string[] }

export function lerHistoricoDiff(): EntradaHistDiff[] {
  try {
    const b = JSON.parse(localStorage.getItem(CHAVE_HIST_DIFF) ?? '[]');
    return Array.isArray(b) ? b.filter((x): x is EntradaHistDiff =>
      !!x && typeof x.em === 'string' && typeof x.total === 'number' && Array.isArray(x.resumo)).slice(-10) : [];
  } catch { return []; }
}

export function gravarHistoricoDiff(diffs: CampoDiff[]): void {
  if (!diffs.length) return;
  try {
    const entrada: EntradaHistDiff = {
      em: new Date().toISOString(),
      total: diffs.length,
      resumo: diffs.slice(0, 6).map((x) => `${x.campo}: ${x.de} → ${x.para}`),
    };
    localStorage.setItem(CHAVE_HIST_DIFF, JSON.stringify([...lerHistoricoDiff(), entrada].slice(-10)));
  } catch { /* sem storage */ }
}
