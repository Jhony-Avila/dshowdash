// nucleo/contratos.ts — CONTRATOS FORMAIS do Avatar Studio 5.0 (AS5 F1).
// @version 1.0.0  @created 2026-07-31
//
// Decisões obrigatórias do §606.2 viram TIPOS: identificadores, slots,
// categorias, raridades, estados de asset, regras de compatibilidade
// (§616–§617, declarativas — nada de condicional fixa na UI) e o contrato
// de asset alinhado ao modelo de dados §613–§615. O envelope de resposta
// segue §624. Este módulo NÃO importa nada — é a base da pirâmide.

/** Identificador público de asset (imutável, minúsculo, prefixado). */
export type AssetId = string; // convenção: `${prefixoCategoria}_${slug}`

export type Raridade = 'comum' | 'raro' | 'epico' | 'lendario' | 'mitico';
export type StatusAsset = 'rascunho' | 'revisao' | 'aprovado' | 'publicado' | 'depreciado' | 'arquivado';
export type RendererId = '2d' | '3d' | 'foto';
export type QualidadeTier = 'economico' | 'medio' | 'alto';

/** Papéis de arquivo por versão de asset (§615). */
export type PapelArquivo =
  | 'thumbnail' | 'preview' | 'source' | 'model' | 'texture' | 'animation'
  | 'fallback' | 'poster' | 'banner' | 'mask' | 'audio' | 'lod';

/** Slots FORMAIS de equipamento (união do 2D atual + 14 sockets 3D). */
export const SLOTS_EQUIPAMENTO = [
  // 2D em camadas ('roupa_sobre': multi-peça §3393 — decisão #95)
  'base', 'cabelo', 'olhos', 'boca', 'roupa', 'roupa_sobre',
  // onda 1414 (decisão #162): camadas FACIAIS novas — aditivas (ausentes
  // = serialização canônica idêntica; espelho no PHP $categorias)
  'barba', 'sobrancelha', 'nariz',
  // onda 1415 (#191): roupa inferior independente (rin_*)
  'roupa_inferior',
  'acessorio_cabeca', 'acessorio_rosto', 'acessorio_pescoco',
  // mega onda 1301+ (decisão #140, as6.acess_v2): slots FINOS aditivos —
  // ausentes = serialização canônica idêntica (checksum §619 estável)
  'acessorio_olhos', 'acessorio_orelha', 'acessorio_costas',
  'acessorio_flutuante', 'acessorio_companheiro',
  // onda 1404 (decisão #154, as6.slots_corpo): slots CORPORAIS aditivos
  'acessorio_pulso_e', 'acessorio_pulso_d', 'acessorio_mao_e', 'acessorio_mao_d',
  'acessorio_cintura', 'acessorio_pernas', 'acessorio_pes',
  'fundo', 'moldura', 'efeito', 'aura', 'banner', 'emblema', 'titulo',
  // 3D (decisão #41 — vocabulário fechado)
  'head', 'face', 'eyes', 'ears', 'neck', 'shoulders', 'back', 'waist',
  'wrist_l', 'wrist_r', 'hand_l', 'hand_r', 'companion', 'pet',
] as const;
export type SlotId = (typeof SLOTS_EQUIPAMENTO)[number];

/** Regras declarativas de compatibilidade (§617) — avaliadas por motor. */
export type Regra =
  | { rule: 'exclusive_slot'; slot: SlotId; conflictsWith: AssetId[] }
  | { rule: 'requires_renderer'; renderer: RendererId }
  | { rule: 'requires_species'; species: AssetId[] }
  | { rule: 'conflicts_with'; assets: AssetId[] }
  | { rule: 'requires_asset'; assets: AssetId[] }
  | { rule: 'hide_body_region'; regions: string[] }
  | { rule: 'min_schema_version'; version: number };

/** Contrato de ASSET no registry (espelho consultável de §613–§615). */
export interface AssetContrato {
  id: AssetId;
  nome: string;
  categoria: string;
  slot: SlotId | null;
  raridade: Raridade;
  status: StatusAsset;
  colecaoId: string | null;
  regras: Regra[];
  renderers: RendererId[];
  versao: number;
  metadata: Record<string, unknown>;
}

/** Contrato mínimo que TODO renderer adapter cumpre (§608: deriva do estado). */
export interface RendererAdapter<TSaida> {
  id: RendererId;
  /** renderização PURA: mesmo estado → mesma saída (determinismo é lei). */
  render(estado: EstadoAvatar): TSaida;
}

/** Envelope padrão de resposta de API (§624). */
export interface Envelope<T> {
  success: boolean;
  data: T | null;
  meta: Record<string, unknown>;
  errors: Array<{ code: string; message: string; field?: string; action?: string }>;
  traceId: string;
}

// ── Estado em DOMÍNIOS (§607) ───────────────────────────────────────

export interface EstadoAvatar {
  schemaVersion: number;
  identity: { nome: string | null; slug: string | null };
  body: {
    base: AssetId | null;
    morfos: Record<string, number>;
    /** megas 254–255 (§102/§118): OPCIONAIS — ausentes preservam o
     *  checksum de estados anteriores (mesma regra de params §71). */
    tipo?: string;
    postura?: string;
    /** megas 561–564 (§102.2): ajuste FINO — mesma regra de opcionais. */
    fino?: { largura?: number; altura?: number };
  };
  /** `params` (§71) e `coresCamada` (§73): regulagens por slot equipado —
   *  campos OPCIONAIS: ausentes quando nada foi regulado, preservando o
   *  checksum dos estados anteriores (sem bump de schemaVersion). */
  appearance: {
    cores: Record<string, string>;
    materiais: Record<string, number>;
    params?: Record<string, Record<string, number>>;
    coresCamada?: Record<string, Record<string, string>>;
    /** onda 1411 (#159): acabamento do render 2D — OPCIONAL (ausente
     *  preserva o checksum de estados anteriores; 'premium' único valor). */
    acabamento?: string;
    /** onda 1414 (#162): canais de rosto, expressão semântica e idade —
     *  OPCIONAIS (ausentes preservam o checksum; neutros nunca persistem). */
    coresFace?: Record<string, string>;
    expressao?: { preset: string; intensidade?: number };
    idade?: string;
  };
  equipment: Partial<Record<SlotId, AssetId>>;
  presentation: { titulo: AssetId | null; poderId: AssetId | null; pose: string | null; expressao: string | null };
  environment: { cenario: string | null; iluminacao: string | null; hora: string | null; clima: string | null };
  animation: { idle: string | null; gesto: string | null };
  renderer: { preferido: RendererId; qualidade: QualidadeTier | 'auto' };
}

export const SCHEMA_VERSION_ATUAL = 1;

export function estadoVazio(): EstadoAvatar {
  return {
    schemaVersion: SCHEMA_VERSION_ATUAL,
    identity: { nome: null, slug: null },
    body: { base: null, morfos: {} },
    appearance: { cores: {}, materiais: {} },
    equipment: {},
    presentation: { titulo: null, poderId: null, pose: null, expressao: null },
    environment: { cenario: null, iluminacao: null, hora: null, clima: null },
    animation: { idle: null, gesto: null },
    renderer: { preferido: '2d', qualidade: 'auto' },
  };
}

/** Serialização canônica: chaves ordenadas em TODOS os níveis. (Bug F1
 *  corrigido na F3 C2: o replacer em array do JSON.stringify era uma
 *  WHITELIST recursiva — descartava as chaves internas de equipment/body
 *  e igualava estados DIFERENTES, quebrando o lock otimista §619.1.) */
function serializarCanonico(v: unknown): string {
  if (v === null || typeof v !== 'object') return JSON.stringify(v) ?? 'null';
  if (Array.isArray(v)) return `[${v.map(serializarCanonico).join(',')}]`;
  const o = v as Record<string, unknown>;
  const chaves = Object.keys(o).filter((k) => o[k] !== undefined).sort();
  return `{${chaves.map((k) => `${JSON.stringify(k)}:${serializarCanonico(o[k])}`).join(',')}}`;
}

/** Checksum determinístico do estado (concorrência §619.1 / auditoria). */
export function checksumEstado(e: EstadoAvatar): string {
  const texto = serializarCanonico(e);
  let h = 5381;
  for (let i = 0; i < texto.length; i++) h = ((h * 33) ^ texto.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

/** Motor de regras (§617): responde se um asset pode equipar no estado. */
export function avaliarRegras(
  asset: Pick<AssetContrato, 'id' | 'regras' | 'slot'>,
  estado: EstadoAvatar,
  renderer: RendererId,
): { ok: boolean; motivo: string | null } {
  const equipados = new Set(Object.values(estado.equipment).filter(Boolean) as AssetId[]);
  for (const r of asset.regras) {
    switch (r.rule) {
      case 'requires_renderer':
        if (r.renderer !== renderer) return { ok: false, motivo: `exige renderer ${r.renderer}` };
        break;
      case 'requires_species':
        if (estado.body.base && !r.species.includes(estado.body.base)) {
          return { ok: false, motivo: 'incompatível com a espécie/base atual' };
        }
        break;
      case 'conflicts_with':
        for (const a of r.assets) if (equipados.has(a)) return { ok: false, motivo: `conflita com ${a}` };
        break;
      case 'requires_asset':
        if (!r.assets.some((a) => equipados.has(a))) return { ok: false, motivo: 'exige outro item equipado' };
        break;
      case 'exclusive_slot':
        for (const a of r.conflictsWith) if (equipados.has(a)) return { ok: false, motivo: `slot exclusivo: conflita com ${a}` };
        break;
      case 'min_schema_version':
        if (estado.schemaVersion < r.version) return { ok: false, motivo: 'estado antigo — atualize o avatar' };
        break;
      case 'hide_body_region':
        break; // instrução para o renderer, não bloqueia equipar
    }
  }
  return { ok: true, motivo: null };
}
