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
  // ── onda 1402 (#151): variantes da população Cabeça e Rosto ──
  ace_fedora: [
    { id: 'var_grafite', nome: 'Grafite', canais: { roupa: '#2b2f3a', destaque: '#8a93a6' } },
    { id: 'var_caramelo', nome: 'Caramelo', canais: { roupa: '#7a5a34', destaque: '#e8b64c' } },
    { id: 'var_meianoite', nome: 'Meia-noite', canais: { roupa: '#1a1035', destaque: '#7c5cff' } },
  ],
  ace_cartola: [
    { id: 'var_ouro', nome: 'Faixa ouro', canais: { destaque: '#c9a75a' } },
    { id: 'var_vinho', nome: 'Faixa vinho', canais: { destaque: '#8a2d3d' } },
    { id: 'var_esmeralda', nome: 'Faixa esmeralda', canais: { destaque: '#2d8a5e' } },
  ],
  ace_chapeu_cowboy: [
    { id: 'var_ouro', nome: 'Fivela ouro', canais: { destaque: '#e8b64c' } },
    { id: 'var_turquesa', nome: 'Turquesa', canais: { destaque: '#4cd9c8' } },
    { id: 'var_couro', nome: 'Couro cru', canais: { destaque: '#b0793d' } },
  ],
  ace_bandana_testa: [
    { id: 'var_rubi', nome: 'Rubi', canais: { destaque: '#c93a3a' } },
    { id: 'var_lima', nome: 'Lima', canais: { destaque: '#39d98a' } },
    { id: 'var_ciano', nome: 'Ciano', canais: { destaque: '#4cd9e8' } },
    { id: 'var_ambar', nome: 'Âmbar', canais: { destaque: '#e8b64c' } },
  ],
  ace_flor_lotus: [
    { id: 'var_rosa', nome: 'Rosa', canais: { destaque: '#ff8fb3' } },
    { id: 'var_lavanda', nome: 'Lavanda', canais: { destaque: '#a98fe8' } },
    { id: 'var_gelo', nome: 'Gelo', canais: { destaque: '#bcd9ee' } },
  ],
  ace_laco_fita: [
    { id: 'var_rosa', nome: 'Rosa', canais: { destaque: '#ff8fb3' } },
    { id: 'var_vinho', nome: 'Vinho', canais: { destaque: '#8a2d3d' } },
    { id: 'var_marinho', nome: 'Marinho', canais: { destaque: '#2d4a8a' } },
  ],
  ace_diadema_perolas: [
    { id: 'var_ouro', nome: 'Ouro', canais: { destaque: '#c9a75a' } },
    { id: 'var_prata', nome: 'Prata', canais: { destaque: '#aeb6c4' } },
    { id: 'var_rose', nome: 'Rosê', canais: { destaque: '#d69a8e' } },
  ],
  ace_oculos_redondos: [
    { id: 'var_ouro', nome: 'Ouro', canais: { destaque: '#c9a75a' } },
    { id: 'var_prata', nome: 'Prata', canais: { destaque: '#aeb6c4' } },
    { id: 'var_grafite', nome: 'Grafite', canais: { destaque: '#3a3f4c' } },
  ],
  ace_oculos_gatinho: [
    { id: 'var_noite', nome: 'Noite', canais: { destaque: '#20242e' } },
    { id: 'var_rosa', nome: 'Rosa', canais: { destaque: '#ff5f8f' } },
    { id: 'var_tartaruga', nome: 'Tartaruga', canais: { destaque: '#8a5a2d' } },
  ],
  ace_viseira_esporte: [
    { id: 'var_ciano', nome: 'Ciano', canais: { destaque: '#4cd9e8' } },
    { id: 'var_magenta', nome: 'Magenta', canais: { destaque: '#ff5f8f' } },
    { id: 'var_lima', nome: 'Lima', canais: { destaque: '#39d98a' } },
  ],
  ace_oculos_pixel: [
    { id: 'var_noite', nome: 'Noite', canais: { destaque: '#20242e' } },
    { id: 'var_violeta', nome: 'Violeta', canais: { destaque: '#7c5cff' } },
    { id: 'var_verde', nome: 'Verde fósforo', canais: { destaque: '#39d98a' } },
  ],
  ace_capuz_sombrio: [
    { id: 'var_abismo', nome: 'Abismo', canais: { roupa: '#14161d', destaque: '#5b3d8a' } },
    { id: 'var_sangue', nome: 'Sangue', canais: { roupa: '#2a1216', destaque: '#c93a3a' } },
    { id: 'var_floresta', nome: 'Floresta', canais: { roupa: '#16241c', destaque: '#39d98a' } },
  ],
  ace_capuz_ninja: [
    { id: 'var_noturno', nome: 'Noturno', canais: { roupa: '#1a1e2a', destaque: '#4c9de8' } },
    { id: 'var_carmesim', nome: 'Carmesim', canais: { roupa: '#3a1418', destaque: '#ff5f8f' } },
    { id: 'var_oliva', nome: 'Oliva', canais: { roupa: '#242a18', destaque: '#a8b84c' } },
  ],
  ace_veu_mistico: [
    { id: 'var_lavanda', nome: 'Lavanda', canais: { destaque: '#a98fe8' } },
    { id: 'var_ciano', nome: 'Ciano', canais: { destaque: '#4cd9e8' } },
    { id: 'var_rosa', nome: 'Rosa', canais: { destaque: '#ff8fb3' } },
  ],
  ace_mascara_oni: [
    { id: 'var_ouro', nome: 'Chifres ouro', canais: { destaque: '#e8b64c' } },
    { id: 'var_osso', nome: 'Chifres osso', canais: { destaque: '#e8e2d0' } },
    { id: 'var_turquesa', nome: 'Chifres turquesa', canais: { destaque: '#4cd9c8' } },
  ],
  ace_mascara_kitsune: [
    { id: 'var_vermelho', nome: 'Marcas vermelhas', canais: { destaque: '#c93a3a' } },
    { id: 'var_azul', nome: 'Marcas azuis', canais: { destaque: '#4c9de8' } },
    { id: 'var_violeta', nome: 'Marcas violetas', canais: { destaque: '#7c5cff' } },
  ],
  ace_mascara_teatro: [
    { id: 'var_ouro', nome: 'Ouro', canais: { destaque: '#c9a75a' } },
    { id: 'var_prata', nome: 'Prata', canais: { destaque: '#aeb6c4' } },
    { id: 'var_jade', nome: 'Jade', canais: { destaque: '#2d8a5e' } },
  ],
  ace_medico_peste: [
    { id: 'var_ambar', nome: 'Lentes âmbar', canais: { destaque: '#e8b64c' } },
    { id: 'var_verde', nome: 'Lentes verdes', canais: { destaque: '#39d98a' } },
    { id: 'var_rubi', nome: 'Lentes rubi', canais: { destaque: '#c93a3a' } },
  ],
  ace_mascara_hoquei: [
    { id: 'var_rubi', nome: 'Riscos rubi', canais: { destaque: '#c93a3a' } },
    { id: 'var_ciano', nome: 'Riscos ciano', canais: { destaque: '#4cd9e8' } },
    { id: 'var_violeta', nome: 'Riscos violeta', canais: { destaque: '#7c5cff' } },
  ],
  // ── onda 1403 (#153): variantes da população de subcategorias vazias ──
  ace_bolsa_mensageiro: [
    { id: 'var_laranja', nome: 'Fecho laranja', canais: { destaque: '#e8843d' } },
    { id: 'var_ciano', nome: 'Fecho ciano', canais: { destaque: '#4cd9e8' } },
    { id: 'var_lima', nome: 'Fecho lima', canais: { destaque: '#39d98a' } },
  ],
  ace_bolsa_tatica: [
    { id: 'var_areia', nome: 'Faixas areia', canais: { destaque: '#c9b27a' } },
    { id: 'var_rubi', nome: 'Faixas rubi', canais: { destaque: '#c93a3a' } },
    { id: 'var_ciano', nome: 'Faixas ciano', canais: { destaque: '#4cd9e8' } },
  ],
  ace_bolsa_couro: [
    { id: 'var_ouro', nome: 'Fivela ouro', canais: { destaque: '#c9a75a' } },
    { id: 'var_prata', nome: 'Fivela prata', canais: { destaque: '#aeb6c4' } },
    { id: 'var_bronze', nome: 'Fivela bronze', canais: { destaque: '#b0793d' } },
  ],
  ace_robo_assistente: [
    { id: 'var_ciano', nome: 'Olhos ciano', canais: { destaque: '#4cd9e8' } },
    { id: 'var_lima', nome: 'Olhos lima', canais: { destaque: '#39d98a' } },
    { id: 'var_ambar', nome: 'Olhos âmbar', canais: { destaque: '#e8b64c' } },
  ],
  ace_robo_bit: [
    { id: 'var_verde', nome: 'Visor verde', canais: { destaque: '#39d98a' } },
    { id: 'var_magenta', nome: 'Visor magenta', canais: { destaque: '#ff5f8f' } },
    { id: 'var_ambar', nome: 'Visor âmbar', canais: { destaque: '#e8b64c' } },
  ],
  ace_robo_aranha: [
    { id: 'var_rubi', nome: 'Sensores rubi', canais: { destaque: '#ff5f5f' } },
    { id: 'var_ciano', nome: 'Sensores ciano', canais: { destaque: '#4cd9e8' } },
    { id: 'var_lima', nome: 'Sensores lima', canais: { destaque: '#39d98a' } },
  ],
  ace_robo_guardiao: [
    { id: 'var_violeta', nome: 'Núcleo violeta', canais: { destaque: '#7c5cff' } },
    { id: 'var_ciano', nome: 'Núcleo ciano', canais: { destaque: '#4cd9e8' } },
    { id: 'var_ouro', nome: 'Núcleo ouro', canais: { destaque: '#e8b64c' } },
  ],
  ace_espirito_chama: [
    { id: 'var_dourada', nome: 'Chama dourada', canais: { destaque: '#ffd75e' } },
    { id: 'var_azul', nome: 'Chama azul', canais: { destaque: '#4c9de8' } },
    { id: 'var_esmeralda', nome: 'Chama esmeralda', canais: { destaque: '#39d98a' } },
  ],
  ace_espirito_agua: [
    { id: 'var_gelo', nome: 'Brilho gelo', canais: { destaque: '#bcd9ee' } },
    { id: 'var_lavanda', nome: 'Brilho lavanda', canais: { destaque: '#a98fe8' } },
    { id: 'var_verde', nome: 'Brilho verde-mar', canais: { destaque: '#4cd9c8' } },
  ],
  ace_espirito_estelar: [
    { id: 'var_violeta', nome: 'Nebulosa violeta', canais: { destaque: '#a98fe8' } },
    { id: 'var_ciano', nome: 'Nebulosa ciano', canais: { destaque: '#4cd9e8' } },
    { id: 'var_rosa', nome: 'Nebulosa rosa', canais: { destaque: '#ff8fb3' } },
  ],
  ace_runa_circulo: [
    { id: 'var_ouro', nome: 'Runas ouro', canais: { destaque: '#e8b64c' } },
    { id: 'var_ciano', nome: 'Runas ciano', canais: { destaque: '#4cd9e8' } },
    { id: 'var_carmesim', nome: 'Runas carmesim', canais: { destaque: '#ff5f5f' } },
  ],
  ace_runa_protecao: [
    { id: 'var_ouro', nome: 'Traço ouro', canais: { destaque: '#e8b64c' } },
    { id: 'var_gelo', nome: 'Traço gelo', canais: { destaque: '#4c9de8' } },
    { id: 'var_lima', nome: 'Traço lima', canais: { destaque: '#39d98a' } },
  ],
  ace_runa_glifo: [
    { id: 'var_violeta', nome: 'Arcano violeta', canais: { destaque: '#7c5cff' } },
    { id: 'var_ambar', nome: 'Arcano âmbar', canais: { destaque: '#e8b64c' } },
    { id: 'var_rosa', nome: 'Arcano rosa', canais: { destaque: '#ff5f8f' } },
  ],
  ace_runa_orbital: [
    { id: 'var_ciano', nome: 'Órbita ciano', canais: { destaque: '#4cd9e8' } },
    { id: 'var_violeta', nome: 'Órbita violeta', canais: { destaque: '#7c5cff' } },
    { id: 'var_lima', nome: 'Órbita lima', canais: { destaque: '#39d98a' } },
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
