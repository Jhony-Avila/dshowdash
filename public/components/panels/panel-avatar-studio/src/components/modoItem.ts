// components/modoItem.ts — enquadramento do thumbnail MODO ITEM (onda
// 1401, decisão #150; briefing de elevação §12: asset protagonista).
// @version 1.0.0  @created 2026-08-12
//
// O card mostra o ASSET isolado (só a camada dele) num viewBox que o
// enquadra com ocupação ~78% (faixa §12: 70–85%). Os bounds por asset
// são MEDIDOS por scripts/avatar/medir-foco-item.mjs (getBBox headless)
// e BAKED aqui — o runtime é 100% determinístico, zero DOM. Asset novo
// sem medição cai no PRESET da subcategoria (§12) e, em último caso, no
// canvas inteiro. Doutrina #83: rodar o script + revisar o diff no
// MESMO commit da arte nova (population 1402+).
import { subcategoriaDoAsset } from '../workspace/acessorios';

// gerado por scripts/avatar/medir-foco-item.mjs — revisar o diff no mesmo commit
export const FOCO_ITEM_ASSET: Record<string, string> = {
  ace_antena: '124 4 64 64',
  ace_asas_energia: '2 7 236 236',
  ace_aureola: '82 -8 77 77',
  ace_boina: '56 0 126 126',
  ace_bone: '49 -15 172 172',
  ace_brinco: '150 104 40 40',
  ace_cachecol: '78 153 90 90',
  ace_capa_heroica: '25 119 191 191',
  ace_chapeu_bruxa: '38 -24 163 163',
  ace_chapeu_mago: '45 -22 151 151',
  ace_chifres_oni: '69 -6 101 101',
  ace_colar_perolas: '79 161 81 81',
  ace_coroa: '76 2 87 87',
  ace_corrente: '74 163 92 92',
  ace_cracha_dshow: '92 180 56 56',
  ace_drone: '154 18 85 85',
  ace_fone: '41 11 159 159',
  ace_gato_sombra: '171 112 56 56',
  ace_gorro_natal: '52 6 145 145',
  ace_gravata_borboleta: '87 163 67 67',
  ace_headset: '30 18 179 179',
  ace_lenco_bandana: '79 171 82 82',
  ace_mascara_neon: '66 95 108 108',
  ace_medalha: '81 175 60 60',
  ace_mochila_jato: '33 122 174 174',
  ace_monoculo: '102 83 81 81',
  ace_oculos: '58 46 123 123',
  ace_oculos_3d: '53 44 133 133',
  ace_oculos_sol: '56 45 128 128',
  ace_piercing: '128 73 40 40',
  ace_pintura_guerra: '71 76 97 97',
  ace_tapa_olho: '46 22 149 149',
  ace_tiara_led: '53 4 134 134',
  ace_viseira_vr: '38 27 164 164',
};

/** Presets §12 por SUBCATEGORIA — fallback para arte nova ainda não
 *  medida (derivados da mediana das medições reais por região). */
export const FOCO_ITEM_SUBCATEGORIA: Record<string, string> = {
  chapeus: '45 -20 160 160',
  'adornos-cabeca': '60 -10 130 130',
  capuzes: '40 -15 170 170',
  oculos: '55 40 130 130',
  'tapa-olhos': '50 25 145 145',
  'headsets-vr': '40 25 165 165',
  mascaras: '60 85 120 120',
  'rosto-marcas': '70 70 110 110',
  brincos: '140 95 60 60',
  fones: '35 15 170 170',
  colares: '75 155 90 90',
  lencos: '75 155 95 95',
  insignias: '85 170 70 70',
  gravatas: '85 160 70 70',
  capas: '25 115 195 195',
  mochilas: '30 115 180 180',
  asas: '0 5 240 240',
  aureolas: '80 -10 80 80',
  companheiros: '145 15 95 95',
  pets: '160 100 70 70',
  pulseiras: '60 60 120 120',
};

/** viewBox do Modo Item: medição do asset → preset da subcategoria →
 *  canvas inteiro (nunca falha; ocupação só degrada com aviso visual). */
export function focoItemDe(assetId: string): string {
  const medido = FOCO_ITEM_ASSET[assetId];
  if (medido) return medido;
  const sub = subcategoriaDoAsset(assetId);
  return (sub && FOCO_ITEM_SUBCATEGORIA[sub.id]) || '0 0 240 240';
}
