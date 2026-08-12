// services/VariantesAssets.ts — VARIANTES DE COR por asset (onda 1401,
// decisão #150; briefing de elevação: variantes ≠ modelos).
// @version 1.0.0  @created 2026-08-12
//
// Registry em DADOS (mesmo padrão de MetadadosAssets/SUBCATEGORIA_POR_
// ASSET): a arte em engine/partes/* NUNCA é tocada. Uma variante é um
// preset nomeado de canais §73 — aplicar = escrever `coresCamada` da
// camada equipada via comPaleta (§74). NADA novo persiste: salvos ficam
// byte-estáveis por construção e o PHP não muda. A variante ativa é
// DERIVADA (canais efetivos == canais da variante), nunca gravada.
//
// Regra dos dados: canais de cada variante ⊆ usaCores do asset (o
// validarConfig descarta canal não declarado — variante fora da regra
// simplesmente não "pega"; o teste da onda confere o registry inteiro).
import type { AvatarConfig, CamadaId, ItemCatalogo, SlotCor, VarianteCor } from '../domain/types';
import { slotFinoDoAsset } from '../workspace/acessorios';

/** Variantes curadas dos assets EXISTENTES (population 1402+ adiciona as
 *  suas junto com a arte). Ordem = ordem de exibição; a 1ª NÃO é padrão —
 *  o padrão é sempre "Original" (sem override, nada persiste). */
export const VARIANTES_POR_ASSET: Record<string, VarianteCor[]> = {
  // ── Cabeça ──
  ace_bone: [
    { id: 'var_grafite', nome: 'Grafite', canais: { roupa: '#2b2f3a', destaque: '#8a93a6' } },
    { id: 'var_rubi', nome: 'Rubi', canais: { roupa: '#521624', destaque: '#ff5f8f' } },
    { id: 'var_esmeralda', nome: 'Esmeralda', canais: { roupa: '#16241c', destaque: '#39d98a' } },
    { id: 'var_gelo', nome: 'Gelo', canais: { roupa: '#c4c9d6', destaque: '#4c9de8' } },
  ],
  ace_chapeu_mago: [
    { id: 'var_arcano', nome: 'Arcano', canais: { roupa: '#1a1035', destaque: '#4cd9e8' } },
    { id: 'var_solar', nome: 'Solar', canais: { roupa: '#3a2c14', destaque: '#e8b64c' } },
    { id: 'var_sombrio', nome: 'Sombrio', canais: { roupa: '#14161d', destaque: '#5b3d8a' } },
  ],
  ace_boina: [
    { id: 'var_carmim', nome: 'Carmim', canais: { destaque: '#c94c5e' } },
    { id: 'var_oliva', nome: 'Oliva', canais: { destaque: '#7a8a4c' } },
    { id: 'var_marinho', nome: 'Marinho', canais: { destaque: '#2d4a8a' } },
  ],
  ace_tiara_led: [
    { id: 'var_ciano', nome: 'Ciano', canais: { destaque: '#4cd9e8' } },
    { id: 'var_magenta', nome: 'Magenta', canais: { destaque: '#ff5f8f' } },
    { id: 'var_lima', nome: 'Lima', canais: { destaque: '#39d98a' } },
    { id: 'var_ambar', nome: 'Âmbar', canais: { destaque: '#e8b64c' } },
  ],
  // ── Rosto e olhos ──
  ace_oculos_sol: [
    { id: 'var_ouro', nome: 'Ouro', canais: { destaque: '#c9a75a' } },
    { id: 'var_prata', nome: 'Prata', canais: { destaque: '#8a93a6' } },
    { id: 'var_neon', nome: 'Neon', canais: { destaque: '#ff5f8f' } },
  ],
  ace_viseira_vr: [
    { id: 'var_plasma', nome: 'Plasma', canais: { destaque: '#7c5cff' } },
    { id: 'var_ciano', nome: 'Ciano', canais: { destaque: '#4cd9e8' } },
    { id: 'var_ambar', nome: 'Âmbar', canais: { destaque: '#e8b64c' } },
  ],
  // ── Orelhas e áudio ──
  ace_fone: [
    { id: 'var_violeta', nome: 'Violeta', canais: { destaque: '#7c5cff' } },
    { id: 'var_verde', nome: 'Verde gamer', canais: { destaque: '#39d98a' } },
    { id: 'var_gelo', nome: 'Gelo', canais: { destaque: '#4c9de8' } },
  ],
  ace_headset: [
    { id: 'var_violeta', nome: 'Violeta', canais: { destaque: '#7c5cff' } },
    { id: 'var_rubi', nome: 'Rubi', canais: { destaque: '#ff5f8f' } },
    { id: 'var_lima', nome: 'Lima', canais: { destaque: '#39d98a' } },
  ],
  // ── Pescoço ──
  ace_cachecol: [
    { id: 'var_vinho', nome: 'Vinho', canais: { destaque: '#8a2d3d' } },
    { id: 'var_creme', nome: 'Creme', canais: { destaque: '#d6c9a8' } },
    { id: 'var_petroleo', nome: 'Petróleo', canais: { destaque: '#1f4a52' } },
  ],
  ace_medalha: [
    { id: 'var_ouro', nome: 'Ouro', canais: { destaque: '#e8b64c' } },
    { id: 'var_prata', nome: 'Prata', canais: { destaque: '#aeb6c4' } },
    { id: 'var_bronze', nome: 'Bronze', canais: { destaque: '#b0793d' } },
  ],
  // ── Costas ──
  ace_capa_heroica: [
    { id: 'var_escarlate', nome: 'Escarlate', canais: { destaque: '#c93a3a' } },
    { id: 'var_real', nome: 'Azul real', canais: { destaque: '#2d4a8a' } },
    { id: 'var_noite', nome: 'Noite', canais: { destaque: '#5b3d8a' } },
  ],
  ace_mochila_jato: [
    { id: 'var_turbina', nome: 'Turbina', canais: { destaque: '#4cd9e8' } },
    { id: 'var_plasma', nome: 'Plasma', canais: { destaque: '#7c5cff' } },
    { id: 'var_solar', nome: 'Solar', canais: { destaque: '#e8b64c' } },
  ],
  // ── Especiais ──
  ace_drone: [
    { id: 'var_ciano', nome: 'Ciano', canais: { destaque: '#4cd9e8' } },
    { id: 'var_magenta', nome: 'Magenta', canais: { destaque: '#ff5f8f' } },
    { id: 'var_lima', nome: 'Lima', canais: { destaque: '#39d98a' } },
  ],
};

/** Variantes de um asset (vazio = asset sem variantes; UI não mostra nada). */
export function variantesDe(assetId: string): VarianteCor[] {
  return VARIANTES_POR_ASSET[assetId] ?? [];
}

/** Camada onde um item vive quando equipado ('base' não tem camada). */
export function camadaDoAsset(item: ItemCatalogo): CamadaId | null {
  if (item.categoria === 'base') return null;
  if (item.categoria === 'acessorio') {
    return `acessorio_${slotFinoDoAsset(item.id, item.slot ?? 'cabeca')}`;
  }
  return item.categoria as CamadaId;
}

/** Cor EFETIVA de um canal na camada (override §73 → global). */
function corEfetiva(config: AvatarConfig, camada: CamadaId, canal: SlotCor): string {
  return (config.coresCamada?.[camada]?.[canal] ?? config.cores[canal]).toLowerCase();
}

/**
 * Variante ATIVA derivada (nunca persistida): todos os canais da variante
 * batem com os canais efetivos da camada. null = "Original"/personalizado.
 */
export function varianteAtiva(assetId: string, camada: CamadaId, config: AvatarConfig): string | null {
  if (config.camadas[camada] !== assetId) return null;
  for (const v of variantesDe(assetId)) {
    const bate = (Object.entries(v.canais) as Array<[SlotCor, string]>)
      .every(([canal, hex]) => corEfetiva(config, camada, canal) === hex.toLowerCase());
    if (bate) return v.id;
  }
  return null;
}
