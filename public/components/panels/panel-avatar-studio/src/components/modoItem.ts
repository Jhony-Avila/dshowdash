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
  ace_anel_sinete: '128 170 80 80',
  ace_antena: '124 4 64 64',
  ace_asas_energia: '2 7 236 236',
  ace_aureola: '82 -8 77 77',
  ace_bandana_testa: '56 20 144 144',
  ace_boina: '56 0 126 126',
  ace_bolsa_couro: '139 141 79 79',
  ace_bolsa_mensageiro: '18 105 146 146',
  ace_bolsa_tatica: '20 123 126 126',
  ace_bone: '49 -15 172 172',
  ace_brinco: '150 104 40 40',
  ace_cachecol: '78 153 90 90',
  ace_capa_heroica: '25 119 191 191',
  ace_capuz_ninja: '54 31 136 136',
  ace_capuz_sombrio: '39 20 163 163',
  ace_cartola: '40 -18 159 159',
  ace_chapeu_bruxa: '38 -24 163 163',
  ace_chapeu_chef: '59 -4 123 123',
  ace_chapeu_cowboy: '28 -19 183 183',
  ace_chapeu_mago: '45 -22 151 151',
  ace_chifres_oni: '69 -6 101 101',
  ace_cinto_couro: '70 172 100 100',
  ace_colar_perolas: '79 161 81 81',
  ace_coroa: '76 2 87 87',
  ace_corrente: '74 163 92 92',
  ace_cracha_dshow: '92 180 56 56',
  ace_diadema_perolas: '61 8 118 118',
  ace_drone: '154 18 85 85',
  ace_espirito_agua: '165 107 67 67',
  ace_espirito_chama: '166 109 64 64',
  ace_espirito_estelar: '172 112 53 53',
  ace_fedora: '35 -14 169 169',
  ace_flor_lotus: '130 44 57 57',
  ace_fone: '41 11 159 159',
  ace_gato_sombra: '171 112 56 56',
  ace_gorro_natal: '52 6 145 145',
  ace_gravata_borboleta: '87 163 67 67',
  ace_headset: '30 18 179 179',
  ace_joelheiras: '70 236 100 100',
  ace_laco_fita: '118 36 64 64',
  ace_lenco_bandana: '79 171 82 82',
  ace_luva_couro: '32 166 80 80',
  ace_mascara_hoquei: '70 74 100 100',
  ace_mascara_kitsune: '68 69 103 103',
  ace_mascara_neon: '66 95 108 108',
  ace_mascara_oni: '72 88 95 95',
  ace_mascara_teatro: '74 77 92 92',
  ace_medalha: '81 175 60 60',
  ace_medico_peste: '68 79 104 104',
  ace_mochila_jato: '33 122 174 174',
  ace_monoculo: '102 83 81 81',
  ace_oculos: '58 46 123 123',
  ace_oculos_3d: '53 44 133 133',
  ace_oculos_gatinho: '60 44 121 121',
  ace_oculos_pixel: '58 46 123 123',
  ace_oculos_redondos: '60 48 121 121',
  ace_oculos_sol: '56 45 128 128',
  ace_piercing: '128 73 40 40',
  ace_pintura_guerra: '71 76 97 97',
  ace_pulseira_led: '128 146 80 80',
  ace_relogio_pulso: '32 146 80 80',
  ace_robo_aranha: '162 141 72 72',
  ace_robo_assistente: '162 98 70 70',
  ace_robo_bit: '166 106 60 60',
  ace_robo_guardiao: '162 102 72 72',
  ace_runa_circulo: '61 -6 118 118',
  ace_runa_glifo: '157 57 62 62',
  ace_runa_orbital: '16 16 206 206',
  ace_runa_protecao: '35 80 58 58',
  ace_tapa_olho: '46 22 149 149',
  ace_tenis_neon: '60 290 120 120',
  // onda 1415 (#191): calçados premium (slot pes — foco no corpo inteiro)
  ace_px_tenis: '60 300 120 120',
  ace_px_social: '60 302 120 120',
  ace_px_bota: '60 284 120 120',
  ace_tiara_led: '53 4 134 134',
  ace_veu_mistico: '41 17 159 159',
  ace_viseira_esporte: '57 45 126 126',
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
  bolsas: '20 110 150 150',
  robos: '160 100 75 75',
  espiritos: '162 105 65 65',
  runas: '30 10 190 190',
  // onda 1404 (#154): CORPORAIS — recorte da REGIÃO no corpo inteiro 240×400
  // (o Modo Item mostra o asset SOBRE o corpo: sozinho ele não comunica)
  pulseiras: '32 146 80 80',
  'luvas-aneis': '32 166 80 80',
  cintos: '70 172 100 100',
  tornozeleiras: '70 236 100 100',
  calcados: '60 290 120 120',
};

/** viewBox do Modo Item: medição do asset → preset da subcategoria →
 *  canvas inteiro (nunca falha; ocupação só degrada com aviso visual). */
export function focoItemDe(assetId: string): string {
  const medido = FOCO_ITEM_ASSET[assetId];
  if (medido) return medido;
  const sub = subcategoriaDoAsset(assetId);
  return (sub && FOCO_ITEM_SUBCATEGORIA[sub.id]) || '0 0 240 240';
}
