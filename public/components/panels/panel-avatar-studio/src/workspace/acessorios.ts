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
];

/** Subcategorias (briefing §4) — só DADOS; ordem = ordem de exibição. */
export const SUBCATEGORIAS_ACESSORIO: SubcategoriaAcessorio[] = [
  // Cabeça
  { id: 'chapeus', nome: 'Chapéus e bonés', regiao: 'cabeca', slot: 'cabeca', estado: 'ativa' },
  { id: 'adornos-cabeca', nome: 'Adornos de cabeça', regiao: 'cabeca', slot: 'cabeca', estado: 'ativa' },
  { id: 'capuzes', nome: 'Capuzes e véus', regiao: 'cabeca', slot: 'cabeca', estado: 'em_preparacao' },
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
  { id: 'asas', nome: 'Asas', regiao: 'costas', slot: 'costas', estado: 'ativa' }, // 1381: arte nova
  // Especiais
  { id: 'aureolas', nome: 'Auréolas', regiao: 'especiais', slot: 'flutuante', estado: 'ativa' },
  { id: 'companheiros', nome: 'Companheiros', regiao: 'especiais', slot: 'companheiro', estado: 'ativa' },
  { id: 'pets', nome: 'Pets', regiao: 'especiais', slot: 'companheiro', estado: 'ativa' }, // 1381: arte nova
  // Braços/mãos/pernas/pés (briefing §4): aguardando arte (§72)
  { id: 'pulseiras', nome: 'Pulseiras e relógios', regiao: 'especiais', slot: 'flutuante', estado: 'oculta' },
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
};

const POR_ID = new Map(SUBCATEGORIAS_ACESSORIO.map((s) => [s.id, s]));

export function subcategoriaDoAsset(assetId: string): SubcategoriaAcessorio | undefined {
  const sub = SUBCATEGORIA_POR_ASSET[assetId];
  return sub ? POR_ID.get(sub) : undefined;
}

/** Slot fino de um asset (fallback: slot legado declarado pela arte). */
export function slotFinoDoAsset(assetId: string, slotLegado: SlotAcessorio): SlotAcessorio {
  return subcategoriaDoAsset(assetId)?.slot ?? slotLegado;
}

export function subcategoriasDaRegiao(regiao: string): SubcategoriaAcessorio[] {
  return SUBCATEGORIAS_ACESSORIO.filter((s) => s.regiao === regiao && s.estado !== 'oculta');
}

/** Conflito entre duas subcategorias: mesmo slot OU bloqueio declarado. */
export function subcategoriasConflitam(a: SubcategoriaAcessorio, b: SubcategoriaAcessorio): boolean {
  if (a.slot === b.slot) return true;
  return Boolean(a.conflitaComSlots?.includes(b.slot) || b.conflitaComSlots?.includes(a.slot));
}
