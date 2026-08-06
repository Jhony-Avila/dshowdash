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

export interface Conjunto {
  id: string;
  nome: string;
  roupa: string;
  /** acessórios por slot (aplicados nos slots certos) */
  acessorios: string[];
  /** paleta §74 aplicada junto (opcional) */
  paleta?: string;
}

/** Curadoria FIXA sobre itens existentes do catálogo (zero arte nova). */
export const CONJUNTOS: Conjunto[] = [
  { id: 'cj_executivo', nome: 'Executivo total', roupa: 'rou_blazer_power', acessorios: ['ace_oculos_sol'], paleta: 'pal_executivo' },
  { id: 'cj_gamer', nome: 'Gamer pro', roupa: 'rou_gamer', acessorios: ['ace_headset'], paleta: 'pal_cyber' },
  { id: 'cj_gala', nome: 'Noite de gala', roupa: 'rou_gala_dshow', acessorios: ['ace_brinco'], paleta: 'pal_dshow' },
  { id: 'cj_heroi', nome: 'Herói de plantão', roupa: 'rou_armadura', acessorios: ['ace_capa_heroica'] },
  { id: 'cj_casual', nome: 'Sexta casual', roupa: 'rou_flanela', acessorios: ['ace_bone'] },
];

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
  for (const ac of conjunto.acessorios) {
    const slot = `acessorio_${itemPorId(ac)?.slot ?? 'cabeca'}`;
    aplicar(slot, ac);
  }

  const paleta = conjunto.paleta ? PALETAS_ROUPA.find((p) => p.id === conjunto.paleta) : undefined;
  const cores = paleta ? { ...atual.cores, ...paleta.canais } : atual.cores;

  return {
    config: validarConfig({ ...atual, camadas, cores }),
    substituidos,
    preservados,
  };
}
