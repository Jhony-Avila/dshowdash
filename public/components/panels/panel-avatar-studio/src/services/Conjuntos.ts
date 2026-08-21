// services/Conjuntos.ts — CONJUNTOS de roupa (lote 551–560 · §72.1/§72.3,
// flag as5.roupas_camada).
// @version 1.0.0  @created 2026-08-06
//
// §72 pede a roupa dividida em peças (superior/inferior/calçado…) — isso
// exige ARTE nova por peça (trilho semi-B, registrado). O que é REAL sem
// arte: §72.1 CONJUNTOS — looks curados que aplicam VÁRIOS slots de uma
// vez (roupa + acessórios + paleta), com a proteção §72.3: bloqueios são
// PRESERVADOS (aplicação parcial) e o retorno LISTA o que substituiu e o
// que preservou — o chamador anuncia, nada é silencioso.
import type { AvatarConfig } from '../domain/types';
import { PALETAS_ROUPA, itemPorId, validarConfig } from './AvatarCatalog';
import { flag } from '../nucleo/flags'; // onda 1415 (#191)

export interface Conjunto {
  id: string;
  nome: string;
  roupa: string;
  /** acessórios por slot (aplicados nos slots certos) */
  acessorios: string[];
  /** paleta §74 aplicada junto (opcional) */
  paleta?: string;
  // onda 1415 (#191): OUTFITS premium — campos ADITIVOS (conjuntos antigos
  // byte a byte); aparecem na UI só com as6.roupa_premium (conjuntosAtivos)
  roupaSobre?: string;
  roupaInferior?: string;
  calcado?: string;
  acabamento?: 'premium';
}

/** Curadoria FIXA sobre itens existentes do catálogo (zero arte nova). */
export const CONJUNTOS: Conjunto[] = [
  { id: 'cj_executivo', nome: 'Executivo total', roupa: 'rou_blazer_power', acessorios: ['ace_oculos_sol'], paleta: 'pal_executivo' },
  { id: 'cj_gamer', nome: 'Gamer pro', roupa: 'rou_gamer', acessorios: ['ace_headset'], paleta: 'pal_cyber' },
  { id: 'cj_gala', nome: 'Noite de gala', roupa: 'rou_gala_dshow', acessorios: ['ace_brinco'], paleta: 'pal_dshow' },
  { id: 'cj_heroi', nome: 'Herói de plantão', roupa: 'rou_armadura', acessorios: ['ace_capa_heroica'] },
  { id: 'cj_casual', nome: 'Sexta casual', roupa: 'rou_flanela', acessorios: ['ace_bone'] },
  // onda 1415 (#191): Golden Outfits O01–O06 — looks premium completos
  { id: 'cj_o01_boardroom', nome: 'O01 · Boardroom', roupa: 'rou_px_blazer', roupaInferior: 'rin_social', calcado: 'ace_px_social', acessorios: [], acabamento: 'premium' },
  { id: 'cj_o02_offduty', nome: 'O02 · Off-duty', roupa: 'rou_px_camiseta', roupaSobre: 'sob_px_cardiga', roupaInferior: 'rin_jeans', calcado: 'ace_px_tenis', acessorios: [], acabamento: 'premium' },
  { id: 'cj_o03_street', nome: 'O03 · Street', roupa: 'rou_px_hoodie', roupaInferior: 'rin_jogger', calcado: 'ace_px_tenis', acessorios: ['ace_bone'], acabamento: 'premium' },
  { id: 'cj_o04_smart', nome: 'O04 · Smart casual', roupa: 'rou_px_camisa', roupaInferior: 'rin_jeans', calcado: 'ace_px_social', acessorios: [], acabamento: 'premium' },
  { id: 'cj_o05_inverno', nome: 'O05 · Inverno', roupa: 'rou_px_sobretudo', roupaInferior: 'rin_social', calcado: 'ace_px_bota', acessorios: ['ace_cachecol'], acabamento: 'premium' },
  { id: 'cj_o06_noite', nome: 'O06 · Noite de gala', roupa: 'rou_px_gala', roupaInferior: 'rin_social', calcado: 'ace_px_social', acessorios: [], acabamento: 'premium' },
];

/** onda 1415 (#191): conjuntos VISÍVEIS — premium só com a flag (§651). */
export function conjuntosAtivos(): Conjunto[] {
  return CONJUNTOS.filter((c) => c.acabamento !== 'premium' || flag('as6.roupa_premium'));
}

const CHAVE_BLOQUEIOS = 'dshow.avst5.bloqueios.v1';

function bloqueios(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(CHAVE_BLOQUEIOS) ?? '[]') as string[]); }
  catch { return new Set(); }
}

export interface ResultadoConjunto {
  config: AvatarConfig;
  substituidos: string[];  // nomes do que SAIU
  preservados: string[];   // nomes do que ficou por BLOQUEIO (§72.3)
}

/** §72.1/§72.3: aplica o conjunto respeitando slots bloqueados. */
export function aplicarConjunto(atual: AvatarConfig, conjunto: Conjunto): ResultadoConjunto {
  const trava = bloqueios();
  const camadas: Record<string, string | undefined> = { ...atual.camadas };
  const substituidos: string[] = [];
  const preservados: string[] = [];

  const aplicar = (slot: string, id: string) => {
    const anterior = camadas[slot];
    if (trava.has(slot)) {
      preservados.push(itemPorId(anterior ?? '')?.nome ?? slot);
      return; // §72.3: bloqueado fica — aplicação PARCIAL
    }
    if (anterior && anterior !== id) substituidos.push(itemPorId(anterior)?.nome ?? anterior);
    camadas[slot] = id;
  };

  aplicar('roupa', conjunto.roupa);
  // onda 1415 (#191): outfits premium — camadas extras aditivas
  if (conjunto.roupaSobre) aplicar('roupa_sobre', conjunto.roupaSobre);
  if (conjunto.roupaInferior) aplicar('roupa_inferior', conjunto.roupaInferior);
  if (conjunto.calcado) aplicar('acessorio_pes', conjunto.calcado);
  for (const ac of conjunto.acessorios) {
    const slot = `acessorio_${itemPorId(ac)?.slot ?? 'cabeca'}`;
    aplicar(slot, ac);
  }

  const paleta = conjunto.paleta ? PALETAS_ROUPA.find((p) => p.id === conjunto.paleta) : undefined;
  const cores = paleta ? { ...atual.cores, ...paleta.canais } : atual.cores;

  return {
    // outfit premium marca o acabamento (a flag decide o render §651)
    config: validarConfig({ ...atual, camadas, cores, ...(conjunto.acabamento === 'premium' ? { acabamento: 'premium' as const } : {}) }),
    substituidos,
    preservados,
  };
}
