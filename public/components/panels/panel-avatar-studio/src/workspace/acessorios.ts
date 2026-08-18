// workspace/acessorios.ts — REGISTRY de subcategorias/regiões/slots da
// categoria-mãe ACESSÓRIOS (mega onda 1301+, decisão #140, flags
// as6.acess_v2/as6.acess_hub; briefing do Jhony 2026-08-11).
// @version 1.0.0  @created 2026-08-11
//
// Princípios (briefing §2/§4/§7/§32 + doutrina do projeto):
// • SUBCATEGORIAS e REGIÕES são DADOS (este arquivo) — adicionar uma
//   subcategoria nova nunca exige mudança estrutural no código.
// • SLOTS são posições corporais POUCAS e ESTÁVEIS (extensão do
//   mecanismo aditivo da decisão #41) — a lista canônica vive em
//   domain/types.ts (SlotAcessorio) e é consumida por validarConfig,
//   contratos §619, adaptadores, render e espelho PHP.
// • BYTE-STABILITY (#141): a arte em partes/* NÃO muda (item.slot
//   legado intocado); um avatar salvo NUNCA é re-slotado na leitura.
//   A classificação fina abaixo vale para a UI (hub, navegação,
//   conflitos) e para NOVOS equipamentos; o render aceita as chaves
//   finas como aceita as legadas (campo ausente = byte a byte).
// • Estado por subcategoria (§32): ATIVA = tem arte hoje;
//   EM_PREPARACAO = infra pronta aguardando arte do Jhony (§72 etc.);
//   OCULTA = não aparece. Nada vazio é publicado como completo.
import type { SlotAcessorio } from '../domain/types';
import { flag } from '../nucleo/flags'; // onda 1404 (#154): gate dos slots corporais

export type EstadoSubcategoria = 'ativa' | 'em_preparacao' | 'oculta';

export interface RegiaoAcessorio {
  id: string;
  nome: string;
}

export interface SubcategoriaAcessorio {
  id: string;
  nome: string;
  regiao: string;
  /** slot fino que os itens desta subcategoria ocupam ao equipar */
  slot: SlotAcessorio;
  estado: EstadoSubcategoria;
  /** slots ADICIONAIS que esta subcategoria bloqueia (conflito §10 do
   *  briefing — ex.: headset VR cobre os olhos) */
  conflitaComSlots?: SlotAcessorio[];
}

/** Regiões (briefing §3) — agrupamento visual do hub. */
export const REGIOES_ACESSORIO: RegiaoAcessorio[] = [
  { id: 'cabeca', nome: 'Cabeça' },
  { id: 'rosto-olhos', nome: 'Rosto e olhos' },
  { id: 'orelhas', nome: 'Orelhas e áudio' },
  { id: 'pescoco', nome: 'Pescoço' },
  { id: 'costas', nome: 'Costas e bolsas' },
  { id: 'especiais', nome: 'Especiais' },
  // onda 1404 (#154, as6.slots_corpo): regiões CORPORAIS (só corpo inteiro)
  { id: 'bracos', nome: 'Braços e mãos' },
  { id: 'corpo-baixo', nome: 'Cintura, pernas e pés' },
];

/** Subcategorias (briefing §4) — só DADOS; ordem = ordem de exibição. */
export const SUBCATEGORIAS_ACESSORIO: SubcategoriaAcessorio[] = [
  // Cabeça
  { id: 'chapeus', nome: 'Chapéus e bonés', regiao: 'cabeca', slot: 'cabeca', estado: 'ativa' },
  { id: 'adornos-cabeca', nome: 'Adornos de cabeça', regiao: 'cabeca', slot: 'cabeca', estado: 'ativa' },
  // onda 1402 (#151): ATIVA — 3 artes reais chegaram (população §11: só
  // esvazia "em preparação" quando a subcategoria está REALMENTE pronta)
  { id: 'capuzes', nome: 'Capuzes e véus', regiao: 'cabeca', slot: 'cabeca', estado: 'ativa' },
  // Rosto e olhos
  { id: 'oculos', nome: 'Óculos', regiao: 'rosto-olhos', slot: 'olhos', estado: 'ativa' },
  { id: 'tapa-olhos', nome: 'Tapa-olhos', regiao: 'rosto-olhos', slot: 'olhos', estado: 'ativa' },
  { id: 'headsets-vr', nome: 'Headsets VR', regiao: 'rosto-olhos', slot: 'cabeca', estado: 'ativa', conflitaComSlots: ['olhos'] },
  { id: 'rosto-marcas', nome: 'Pinturas e piercings', regiao: 'rosto-olhos', slot: 'rosto', estado: 'ativa' },
  { id: 'mascaras', nome: 'Máscaras', regiao: 'rosto-olhos', slot: 'rosto', estado: 'ativa', conflitaComSlots: ['olhos'] }, // 1381: arte nova
  // Orelhas e áudio
  { id: 'brincos', nome: 'Brincos', regiao: 'orelhas', slot: 'orelha', estado: 'ativa' },
  { id: 'fones', nome: 'Fones e headsets', regiao: 'orelhas', slot: 'orelha', estado: 'ativa' },
  // Pescoço
  { id: 'colares', nome: 'Colares e correntes', regiao: 'pescoco', slot: 'pescoco', estado: 'ativa' },
  { id: 'lencos', nome: 'Cachecóis e lenços', regiao: 'pescoco', slot: 'pescoco', estado: 'ativa' },
  { id: 'insignias', nome: 'Medalhas e crachás', regiao: 'pescoco', slot: 'pescoco', estado: 'ativa' },
  { id: 'gravatas', nome: 'Gravatas', regiao: 'pescoco', slot: 'pescoco', estado: 'ativa' }, // 1381: arte nova
  // Costas e bolsas
  { id: 'capas', nome: 'Capas', regiao: 'costas', slot: 'costas', estado: 'ativa' },
  { id: 'mochilas', nome: 'Mochilas', regiao: 'costas', slot: 'costas', estado: 'ativa' },
  // onda 1403 (#153): população das subcategorias vazias (pedido do Jhony)
  { id: 'bolsas', nome: 'Mochilas e bolsas', regiao: 'costas', slot: 'costas', estado: 'ativa' },
  { id: 'asas', nome: 'Asas', regiao: 'costas', slot: 'costas', estado: 'ativa' }, // 1381: arte nova
  // Especiais
  { id: 'aureolas', nome: 'Auréolas', regiao: 'especiais', slot: 'flutuante', estado: 'ativa' },
  { id: 'companheiros', nome: 'Companheiros', regiao: 'especiais', slot: 'companheiro', estado: 'ativa' },
  { id: 'pets', nome: 'Pets', regiao: 'especiais', slot: 'companheiro', estado: 'ativa' }, // 1381: arte nova
  // onda 1403 (#153): população das subcategorias vazias
  { id: 'robos', nome: 'Robôs', regiao: 'especiais', slot: 'companheiro', estado: 'ativa' },
  { id: 'espiritos', nome: 'Espíritos', regiao: 'especiais', slot: 'companheiro', estado: 'ativa' },
  { id: 'runas', nome: 'Runas e círculos', regiao: 'especiais', slot: 'flutuante', estado: 'ativa' },
  // onda 1404 (#154, as6.slots_corpo): regiões CORPORAIS — subcategorias
  // ATIVAS com o gate da flag (subcategoriasCorporaisAtivas); a arte só
  // desenha no corpo inteiro (renderCorpo). Pares L/R: a subcategoria
  // pousa no lado ESQUERDO por padrão; o item declara o slot exato.
  { id: 'pulseiras', nome: 'Pulseiras e relógios', regiao: 'bracos', slot: 'pulso_e', estado: 'ativa' },
  { id: 'luvas-aneis', nome: 'Luvas e anéis', regiao: 'bracos', slot: 'mao_e', estado: 'ativa' },
  { id: 'cintos', nome: 'Cintos e faixas', regiao: 'corpo-baixo', slot: 'cintura', estado: 'ativa' },
  { id: 'tornozeleiras', nome: 'Pernas e tornozelos', regiao: 'corpo-baixo', slot: 'pernas', estado: 'ativa' },
  { id: 'calcados', nome: 'Calçados', regiao: 'corpo-baixo', slot: 'pes', estado: 'ativa' },
];

/** Classificação FINA dos 30 assets existentes (briefing §5 — sem
 *  duplicar registro; a arte e o item.slot legado ficam intocados). */
export const SUBCATEGORIA_POR_ASSET: Record<string, string> = {
  ace_bone: 'chapeus', ace_chapeu_mago: 'chapeus', ace_gorro_natal: 'chapeus',
  // taxonomia v2 (#146/§8 do briefing corretivo): coroa é ADORNO, não
  // cobertura — muda só a navegação; slot continua 'cabeca'
  ace_chapeu_bruxa: 'chapeus', ace_coroa: 'adornos-cabeca', ace_boina: 'chapeus',
  ace_chifres_oni: 'adornos-cabeca', ace_antena: 'adornos-cabeca', ace_tiara_led: 'adornos-cabeca',
  ace_oculos: 'oculos', ace_oculos_sol: 'oculos', ace_oculos_3d: 'oculos', ace_monoculo: 'oculos',
  ace_tapa_olho: 'tapa-olhos',
  ace_viseira_vr: 'headsets-vr',
  // onda 1381 (#148): arte nova
  ace_mascara_neon: 'mascaras', ace_gravata_borboleta: 'gravatas',
  ace_asas_energia: 'asas', ace_gato_sombra: 'pets',
  ace_pintura_guerra: 'rosto-marcas', ace_piercing: 'rosto-marcas',
  ace_brinco: 'brincos',
  ace_fone: 'fones', ace_headset: 'fones',
  ace_corrente: 'colares', ace_colar_perolas: 'colares',
  ace_cachecol: 'lencos', ace_lenco_bandana: 'lencos',
  ace_medalha: 'insignias', ace_cracha_dshow: 'insignias',
  ace_capa_heroica: 'capas',
  ace_mochila_jato: 'mochilas',
  ace_aureola: 'aureolas',
  ace_drone: 'companheiros',
  // onda 1402 (#151): população Cabeça e Rosto — 20 artes novas
  ace_fedora: 'chapeus', ace_cartola: 'chapeus',
  ace_chapeu_cowboy: 'chapeus', ace_chapeu_chef: 'chapeus',
  ace_bandana_testa: 'adornos-cabeca', ace_flor_lotus: 'adornos-cabeca',
  ace_laco_fita: 'adornos-cabeca', ace_diadema_perolas: 'adornos-cabeca',
  ace_oculos_redondos: 'oculos', ace_oculos_gatinho: 'oculos',
  ace_viseira_esporte: 'oculos', ace_oculos_pixel: 'oculos',
  ace_capuz_sombrio: 'capuzes', ace_capuz_ninja: 'capuzes', ace_veu_mistico: 'capuzes',
  ace_mascara_oni: 'mascaras', ace_mascara_kitsune: 'mascaras',
  ace_mascara_teatro: 'mascaras', ace_medico_peste: 'mascaras', ace_mascara_hoquei: 'mascaras',
  // onda 1403 (#153): bolsas + robôs + espíritos + runas — 14 artes novas
  ace_bolsa_mensageiro: 'bolsas', ace_bolsa_tatica: 'bolsas', ace_bolsa_couro: 'bolsas',
  ace_robo_assistente: 'robos', ace_robo_bit: 'robos',
  ace_robo_aranha: 'robos', ace_robo_guardiao: 'robos',
  ace_espirito_chama: 'espiritos', ace_espirito_agua: 'espiritos', ace_espirito_estelar: 'espiritos',
  ace_runa_circulo: 'runas', ace_runa_protecao: 'runas',
  ace_runa_glifo: 'runas', ace_runa_orbital: 'runas',
  // onda 1404 (#154): artes-prova dos slots CORPORAIS (1 por slot)
  ace_relogio_pulso: 'pulseiras', ace_pulseira_led: 'pulseiras',
  ace_luva_couro: 'luvas-aneis', ace_anel_sinete: 'luvas-aneis',
  ace_cinto_couro: 'cintos', ace_joelheiras: 'tornozeleiras', ace_tenis_neon: 'calcados',
};

const POR_ID = new Map(SUBCATEGORIAS_ACESSORIO.map((s) => [s.id, s]));

export function subcategoriaDoAsset(assetId: string): SubcategoriaAcessorio | undefined {
  const sub = SUBCATEGORIA_POR_ASSET[assetId];
  return sub ? POR_ID.get(sub) : undefined;
}

/** onda 1404 (#154): slots que só existem com as6.slots_corpo ligada. */
export const SLOTS_CORPORAIS: readonly SlotAcessorio[] = [
  'pulso_e', 'pulso_d', 'mao_e', 'mao_d', 'cintura', 'pernas', 'pes',
];
export function slotCorporal(s: SlotAcessorio): boolean {
  return (SLOTS_CORPORAIS as readonly string[]).includes(s);
}

/** Slot fino de um asset (fallback: slot legado declarado pela arte).
 *  onda 1404: a arte corporal declara o slot exato (pulso_d, mao_e…) —
 *  o registry só define o padrão da subcategoria. */
export function slotFinoDoAsset(assetId: string, slotLegado: SlotAcessorio): SlotAcessorio {
  if (slotCorporal(slotLegado)) return slotLegado; // arte manda no lado L/R
  return subcategoriaDoAsset(assetId)?.slot ?? slotLegado;
}

export function subcategoriasDaRegiao(regiao: string): SubcategoriaAcessorio[] {
  return SUBCATEGORIAS_ACESSORIO.filter((s) => s.regiao === regiao && s.estado !== 'oculta'
    // onda 1404 (#154): corporais somem sem a flag (rollback = navegação anterior)
    && (!slotCorporal(s.slot) || flag('as6.slots_corpo')));
}

/** Conflito entre duas subcategorias: mesmo slot OU bloqueio declarado. */
export function subcategoriasConflitam(a: SubcategoriaAcessorio, b: SubcategoriaAcessorio): boolean {
  if (a.slot === b.slot) return true;
  return Boolean(a.conflitaComSlots?.includes(b.slot) || b.conflitaComSlots?.includes(a.slot));
}
