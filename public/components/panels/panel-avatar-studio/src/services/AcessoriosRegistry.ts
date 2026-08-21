// services/AcessoriosRegistry.ts — onda 1416 (MEGA_BRIEFING_01 P10-E, P6-A,
// P6-E, §616–§617; decisões #196–#197): CONTRATO DE FIT dos acessórios como
// DADO — occupancy por REGIÃO semântica, classe, fitProfile e regras
// declarativas (`requires/incompatibleWith/hides/replaces/occupies`) que
// alimentam o motor `avaliarRegras` (§617, nucleo/contratos.ts).
//
// NADA aqui muda o validarConfig nem o render de configs salvos: o registry
// é consultivo (UI de conflito nomeado, contador, avaliador §617). Bounds de
// câmera são o FOCO_ITEM_ASSET já medido (modoItem.ts) — sem duplicar dado.
// @version 1.0.0  @created 2026-08-21
import type { Regra } from '../nucleo/contratos';
import { avaliarRegras } from '../nucleo/contratos';
import type { EstadoAvatar } from '../nucleo/contratos';

/** Regiões SEMÂNTICAS do corpo (occupancy §616) — vocabulário fechado. */
export type RegiaoCorpo =
  | 'topo_cabeca' | 'testa' | 'olhos' | 'orelhas' | 'rosto_baixo'
  | 'pescoco' | 'torso' | 'costas' | 'cintura' | 'maos' | 'pernas' | 'pes'
  | 'orbita'; // flutuantes/companheiros — ao redor, nunca conflita com corpo

export type ClasseAcessorio =
  | 'funcional' | 'decorativo' | 'mascara' | 'headwear' | 'oculos'
  | 'mochila' | 'asas' | 'prop' | 'companheiro' | 'flutuante';

export type FitAcessorio = 'aberto' | 'justo' | 'fechado';

export interface FichaAcessorio {
  classe: ClasseAcessorio;
  occupies: RegiaoCorpo[];
  fit: FitAcessorio;
  /** ids que este item EXIGE equipados (raro; ex.: prop que pede luva) */
  requires?: string[];
  /** conflitos curados ALÉM do overlap de região */
  incompatibleWith?: string[];
  /** camadas que o item ESCONDE quando equipado (informativo p/ UI —
   *  o motor de render já aplica via compat-cabelo/compat-rosto) */
  hides?: Array<'cabelo' | 'barba'>;
}

const d = (classe: ClasseAcessorio, occupies: RegiaoCorpo[], fit: FitAcessorio = 'aberto',
  extra: Partial<FichaAcessorio> = {}): FichaAcessorio => ({ classe, occupies, fit, ...extra });

/** Registry dos 75 acessórios do catálogo + premium 1416 (#196). */
export const ACESSORIOS_REGISTRY: Record<string, FichaAcessorio> = {
  // ── cabeça (24) ──
  ace_fone: d('funcional', ['orelhas']), ace_headset: d('funcional', ['orelhas']),
  ace_bone: d('headwear', ['topo_cabeca'], 'justo'), ace_boina: d('headwear', ['topo_cabeca'], 'justo'),
  ace_gorro_natal: d('headwear', ['topo_cabeca'], 'justo'), ace_chapeu_mago: d('headwear', ['topo_cabeca'], 'justo'),
  ace_chapeu_bruxa: d('headwear', ['topo_cabeca'], 'justo'), ace_fedora: d('headwear', ['topo_cabeca'], 'justo'),
  ace_cartola: d('headwear', ['topo_cabeca'], 'justo'), ace_chapeu_cowboy: d('headwear', ['topo_cabeca'], 'justo'),
  ace_chapeu_chef: d('headwear', ['topo_cabeca'], 'justo'),
  ace_coroa: d('decorativo', ['topo_cabeca']), ace_tiara_led: d('decorativo', ['testa']),
  ace_chifres_oni: d('decorativo', ['topo_cabeca']), ace_antena: d('funcional', ['topo_cabeca']),
  ace_aureola: d('decorativo', ['orbita']), ace_bandana_testa: d('decorativo', ['testa']),
  ace_flor_lotus: d('decorativo', ['topo_cabeca']), ace_laco_fita: d('decorativo', ['topo_cabeca']),
  ace_diadema_perolas: d('decorativo', ['testa']),
  ace_capuz_sombrio: d('headwear', ['topo_cabeca', 'testa'], 'fechado'),
  ace_capuz_ninja: d('headwear', ['topo_cabeca', 'testa', 'rosto_baixo'], 'fechado', { hides: ['barba'] }),
  ace_veu_mistico: d('headwear', ['topo_cabeca', 'testa'], 'fechado'),
  ace_viseira_vr: d('oculos', ['olhos', 'testa'], 'fechado'),
  // ── rosto (18) ──
  ace_oculos: d('oculos', ['olhos'], 'justo'), ace_oculos_sol: d('oculos', ['olhos'], 'justo'),
  ace_oculos_3d: d('oculos', ['olhos'], 'justo'), ace_oculos_redondos: d('oculos', ['olhos'], 'justo'),
  ace_oculos_gatinho: d('oculos', ['olhos'], 'justo'), ace_oculos_pixel: d('oculos', ['olhos'], 'justo'),
  ace_viseira_esporte: d('oculos', ['olhos'], 'justo'), ace_monoculo: d('oculos', ['olhos'], 'justo'),
  ace_tapa_olho: d('funcional', ['olhos'], 'justo'),
  ace_brinco: d('decorativo', ['orelhas']), ace_piercing: d('decorativo', ['rosto_baixo']),
  ace_pintura_guerra: d('decorativo', ['rosto_baixo']),
  ace_mascara_neon: d('mascara', ['rosto_baixo'], 'fechado', { hides: ['barba'] }),
  ace_mascara_oni: d('mascara', ['olhos', 'rosto_baixo'], 'fechado', { hides: ['barba'] }),
  ace_mascara_kitsune: d('mascara', ['olhos', 'rosto_baixo'], 'fechado', { hides: ['barba'] }),
  ace_mascara_teatro: d('mascara', ['olhos', 'rosto_baixo'], 'fechado', { hides: ['barba'] }),
  ace_mascara_hoquei: d('mascara', ['olhos', 'rosto_baixo'], 'fechado', { hides: ['barba'] }),
  ace_medico_peste: d('mascara', ['olhos', 'rosto_baixo'], 'fechado', { hides: ['barba'] }),
  // ── pescoço (10) ──
  ace_cachecol: d('decorativo', ['pescoco'], 'justo'), ace_lenco_bandana: d('decorativo', ['pescoco'], 'justo'),
  ace_corrente: d('decorativo', ['pescoco']), ace_colar_perolas: d('decorativo', ['pescoco']),
  ace_medalha: d('decorativo', ['pescoco']), ace_cracha_dshow: d('decorativo', ['pescoco']),
  ace_gravata_borboleta: d('decorativo', ['pescoco']),
  ace_capa_heroica: d('decorativo', ['pescoco', 'costas']),
  ace_mochila_jato: d('mochila', ['costas']), ace_drone: d('flutuante', ['orbita']),
  // ── costas (4) ──
  ace_asas_energia: d('asas', ['costas']), ace_bolsa_mensageiro: d('mochila', ['costas']),
  ace_bolsa_tatica: d('mochila', ['costas']), ace_bolsa_couro: d('mochila', ['costas']),
  // ── companheiros (8) e flutuantes (4) — órbita: nunca conflitam ──
  ace_gato_sombra: d('companheiro', ['orbita']), ace_robo_assistente: d('companheiro', ['orbita']),
  ace_robo_bit: d('companheiro', ['orbita']), ace_robo_aranha: d('companheiro', ['orbita']),
  ace_robo_guardiao: d('companheiro', ['orbita']), ace_espirito_chama: d('companheiro', ['orbita']),
  ace_espirito_agua: d('companheiro', ['orbita']), ace_espirito_estelar: d('companheiro', ['orbita']),
  ace_runa_circulo: d('flutuante', ['orbita']), ace_runa_protecao: d('flutuante', ['orbita']),
  ace_runa_glifo: d('flutuante', ['orbita']), ace_runa_orbital: d('flutuante', ['orbita']),
  // ── corporais (7) ──
  ace_relogio_pulso: d('funcional', ['maos'], 'justo'), ace_pulseira_led: d('decorativo', ['maos'], 'justo'),
  ace_luva_couro: d('funcional', ['maos'], 'justo'), ace_anel_sinete: d('decorativo', ['maos'], 'justo'),
  ace_cinto_couro: d('funcional', ['cintura'], 'justo'), ace_joelheiras: d('funcional', ['pernas'], 'justo'),
  ace_tenis_neon: d('funcional', ['pes'], 'justo'),
  // ── onda 1416: premium (#196) ──
  ace_px_oculos: d('oculos', ['olhos'], 'justo'),
  ace_px_coroa: d('decorativo', ['topo_cabeca']),
  ace_px_colar: d('decorativo', ['pescoco']),
  ace_px_mochila: d('mochila', ['costas']),
  ace_px_asas: d('asas', ['costas']),
  ace_px_brinco: d('decorativo', ['orelhas']),
  ace_px_relogio: d('funcional', ['maos'], 'justo'),
  ace_px_cetro: d('prop', ['maos']),
  ace_px_drone: d('flutuante', ['orbita']),
  ace_px_gato: d('companheiro', ['orbita']),
  // ── onda 1415: calçados premium ──
  ace_px_tenis: d('funcional', ['pes'], 'justo'),
  ace_px_social: d('funcional', ['pes'], 'justo'),
  ace_px_bota: d('funcional', ['pes'], 'justo'),
};

export function fichaDe(id: string): FichaAcessorio | undefined {
  return ACESSORIOS_REGISTRY[id];
}

/** Verbo do conflito por classe (P6-A: "Asas substituem Mochila"). */
const VERBO: Partial<Record<ClasseAcessorio, string>> = {
  asas: 'substituem', mochila: 'substitui', mascara: 'cobre', oculos: 'disputa',
  headwear: 'disputa',
};

/** Conflito NOMEADO entre dois itens (null = convivem). Órbita nunca
 *  conflita; overlap de região OU incompatibilidade curada conflitam. */
export function conflitoNomeado(
  aId: string, bId: string,
  nomeDe: (id: string) => string,
): string | null {
  if (aId === bId) return null;
  const a = fichaDe(aId);
  const b = fichaDe(bId);
  if (!a || !b) return null;
  if (a.incompatibleWith?.includes(bId) || b.incompatibleWith?.includes(aId)) {
    return `${nomeDe(aId)} não combina com ${nomeDe(bId)}`;
  }
  const overlap = a.occupies.filter((r) => r !== 'orbita' && b.occupies.includes(r));
  if (!overlap.length) return null;
  const verbo = VERBO[a.classe] ?? 'disputa';
  return `${nomeDe(aId)} ${verbo} ${nomeDe(bId)} (região: ${overlap.join(', ')})`;
}

/** Regras declarativas §617 do item — consumíveis por `avaliarRegras`. */
export function regrasDe(id: string): Regra[] {
  const f = fichaDe(id);
  if (!f) return [];
  const regras: Regra[] = [];
  if (f.incompatibleWith?.length) regras.push({ rule: 'conflicts_with', assets: f.incompatibleWith });
  if (f.requires?.length) regras.push({ rule: 'requires_asset', assets: f.requires });
  if (f.hides?.length) regras.push({ rule: 'hide_body_region', regions: f.hides });
  return regras;
}

/** Avalia o item contra um estado §607 via motor §617 (fachada). */
export function podeEquipar(id: string, estado: EstadoAvatar): { ok: boolean; motivo: string | null } {
  return avaliarRegras({ id, regras: regrasDe(id), slot: null }, estado, '2d');
}
