// domain/types.ts — modelo de domínio do Avatar Studio (briefing §19/§36–§37).
// @version 1.0.0  @created 2026-07-29
//
// O avatar é montado por CAMADAS declarativas + paleta de cores recoloríveis.
// O config JSON (AvatarConfig) é o que persiste no banco; a renderização é
// determinística no motor (engine/) — front e backend compõem o MESMO SVG.

export interface ShellConfig {
  signal?: AbortSignal;
  flag?: { key: string; enabled: boolean; payload: unknown; source: string };
  [k: string]: unknown;
}

// ── Catálogo ────────────────────────────────────────────────────────

export type CategoriaId =
  | 'base' | 'cabelo' | 'olhos' | 'boca' | 'roupa'
  | 'acessorio' | 'fundo' | 'moldura' | 'efeito'
  // Expansão (decisão #33 — categorias 2D de baixo custo/alto valor):
  | 'aura' | 'banner' | 'emblema';

export type Raridade =
  | 'comum' | 'incomum' | 'raro' | 'epico' | 'lendario' | 'mitico' | 'exclusivo';

export type SlotCor = 'pele' | 'cabelo' | 'roupa' | 'destaque';

/**
 * Slots ADITIVOS de acessórios no 2D (4.6 §20, decisão #41):
 * até 3 acessórios simultâneos — um por região. Cada item declara o seu.
 */
export type SlotAcessorio = 'cabeca' | 'rosto' | 'pescoco';

/** Chaves possíveis em AvatarConfig.camadas ('acessorio' legado migra no validarConfig). */
export type CamadaId = Exclude<CategoriaId, 'base'> | `acessorio_${SlotAcessorio}`;

/**
 * §71 (AS5 F3 C2): valores de PROPRIEDADES de um asset equipado
 * (ex.: aura → { intensidade: 0.6, velocidade: 1.4 }). O vocabulário e os
 * limites por categoria vivem em engine/params.ts (PARAMS_POR_CATEGORIA);
 * validarConfig sanitiza e só persiste valores NÃO-padrão — mesmo visual
 * → mesmo JSON (princípio da publicação byte-estável, como `titulo`).
 */
export type ParamsAsset = Record<string, number>;

/** Poses futuras (AS3 decisão #23) — hoje só 'frontal' é produzida. */
export type PoseId = 'frontal' | 'tresquartos' | 'lateral' | 'pose' | 'poder';

export interface ItemCatalogo {
  id: string;
  categoria: CategoriaId;
  nome: string;
  descricao: string;
  raridade: Raridade;
  tema: string;                    // tecnologia, neon, executivo, casual, gamer…
  novo?: boolean;
  /** história do item (tooltip rica) — obrigatória de raro pra cima (AS3 §9) */
  lore?: string;
  /** fonte de arte ('dshow' padrão) — arquitetura multi-biblioteca (AS3 §7) */
  biblioteca?: string;
  /** false = olhos que não piscam no idle (visores/LEDs) — AS3 §5.1 */
  piscar?: boolean;
  /**
   * Trava ADITIVA (AS3 F3, decisão #25): 'conquista:<id>' ou 'evento:<id>'.
   * Itens sem este campo são livres; o desbloqueio vem do /api/avatar/vida.php.
   */
  bloqueadoPor?: string;
  /** slots de cor que este item usa (mostra o seletor correspondente) */
  usaCores?: SlotCor[];
  /** só compatível com estas bases (vazio = todas) — briefing §35 */
  requerBase?: string[];
  /** itens que não podem estar equipados junto — briefing §35 */
  incompativelCom?: string[];
  /**
   * Slot ADITIVO do acessório (decisão #41): cabeca | rosto | pescoco.
   * Só faz sentido em categoria 'acessorio'; ausente = 'cabeca'.
   */
  slot?: SlotAcessorio;
}

/** Grupos da navegação (Expansão — estrutura do briefing, espelho da taxonomia). */
export type GrupoId =
  | 'identidade' | 'corpo' | 'cabelo' | 'vestuario' | 'equipamentos'
  | 'poderes' | 'aparencia' | 'personalidade';

export interface CategoriaMeta {
  id: CategoriaId;
  nome: string;
  obrigatoria: boolean;            // base sempre; demais aceitam 'nenhum'
  grupo: GrupoId;                  // grupo colapsável na sidebar (Expansão)
}

// ── Configuração do avatar (persistida) ─────────────────────────────

export interface AvatarConfig {
  formato: 'camadas';              // discrimina do legado (URL de arquivo)
  versao: number;
  base: string;                    // id do item de base
  camadas: Partial<Record<CamadaId, string>>; // id por camada ('nenhum' = ausente)
  cores: Record<SlotCor, string>;
  /** Título do personagem (Expansão §27) — exibido como selo, fora do SVG. */
  titulo?: string;
  /**
   * §71: propriedades por camada equipada (AUSENTE quando tudo é padrão).
   * Entra no hashConfig automaticamente (JSON.stringify) — thumbnails e
   * publicação reagem a mudanças de propriedade sem código extra.
   */
  params?: Partial<Record<CamadaId, ParamsAsset>>;
  /**
   * §73 (AS5 F3 C3): CANAIS DE COR por camada — override local da paleta
   * para UMA peça. Canal = família de cor que a arte já usa (usaCores do
   * item): 'roupa' recolore a peça, 'destaque' os detalhes — sem que a
   * troca vaze para aura/emblema/moldura (que usam o 'destaque' GLOBAL).
   * Sanitizado no validarConfig (só camadas equipadas, só canais que o
   * item declara, hex normalizado, valor igual ao global não persiste).
   */
  coresCamada?: Partial<Record<CamadaId, Partial<Record<SlotCor, string>>>>;
}

export interface AvatarDoUsuario {
  config: AvatarConfig | null;     // null = legado/URL ou nunca criado
  urlLegado: string | null;        // avatar_url atual do app_users (fallback/comparação)
  urlRender: string | null;        // SVG renderizado publicado (o que o header usa)
  atualizadoEm: string | null;
}

// ── Presets (briefing §12) ──────────────────────────────────────────

export interface Preset {
  id: string;
  nome: string;
  descricao: string;
  raridade: Raridade;
  config: Omit<AvatarConfig, 'versao' | 'formato'>;
}

// ── Foto estilizada (4.6 §21) ───────────────────────────────────────
// A foto só recebe assets de APRESENTAÇÃO — nunca roupa/corpo.

/** Megas 51–54 (§333/§334/§337/§340): ajustes NÃO destrutivos da foto.
 *  Todo campo é opcional e o VALOR NEUTRO é omitido — estilo sem ajustes
 *  rende byte a byte igual ao de antes (fotos já salvas intocadas). */
export interface AjustesFoto {
  /** 0.5–1.5 · 1 = neutro */
  brilho?: number;
  /** 0.5–1.5 · 1 = neutro */
  contraste?: number;
  /** 0–2 · 1 = neutro */
  saturacao?: number;
  /** -1 (fria) … 1 (quente) · 0 = neutro */
  temperatura?: number;
  /** 0–1 · 0 = sem vinheta */
  vinheta?: number;
  /** graus -180…180 · 0 = neutro (gira a FOTO dentro do medalhão) */
  rotacao?: number;
  espelhar?: boolean;
  /** §337: sombra de contato sob o medalhão */
  sombra?: boolean;
  // ── lote 111–120 (§332/§333/§334/§341) ──
  /** §341: FORMA do medalhão · 'circulo' = neutro (byte-estável) */
  forma?: 'circulo' | 'hexagono' | 'losango' | 'squircle';
  /** §334: desfoque do CENÁRIO atrás do medalhão · 0–1 · 0 = neutro */
  desfoqueFundo?: number;
  /** §334: granulação de filme · 0–1 · 0 = neutro */
  granulacao?: number;
  /** §333: filtro de cor global · 'nenhum' = neutro */
  filtroCor?: 'nenhum' | 'pb' | 'sepia';
  /** §332: zoom da FOTO dentro do medalhão · 1–1.6 · 1 = neutro */
  zoomFoto?: number;
  /** espessura do anel de destaque · 1–6 · 3 = neutro (o legado) */
  anel?: number;
}

/** lote 161–164 (§338/§339/§342): id e config POR CAMADA decorativa. */
export type CamadaFotoId = 'fundo' | 'banner' | 'aura' | 'efeito' | 'moldura' | 'emblema';
/** §342: blends SEGUROS agrupados (modo avançado; 'normal' = neutro) */
export type BlendFoto = 'normal' | 'multiply' | 'screen' | 'overlay' | 'soft-light';
export interface CamadaFotoCfg {
  /** §338.2 ocultar (não destrutivo — o id continua equipado) */
  oculta?: boolean;
  /** 0.2–1 · 1 = neutro */
  opacidade?: number;
  blend?: BlendFoto;
  /** §339: SÓ o efeito pode trocar de plano (ordem protegida) */
  plano?: 'atras' | 'frente';
}
/** lote 166 (§343): tipografia CONTROLADA (fontes aprovadas, sem upload) */
export interface TipografiaFoto {
  fonte?: 'sistema' | 'mono' | 'serif';
  peso?: 400 | 600 | 800;
  tamanho?: 'p' | 'm' | 'g';
  /** hex aprovado pela paleta (normalizado no serviço) */
  cor?: string;
  contorno?: boolean;
  caixaAlta?: boolean;
}

// ── lote 221–230 (§323.2/§324.2/§344/§345) ──────────────────────────
/** mega 223: elementos da composição que aceitam POSIÇÃO manual. */
export type ElementoPosFoto = 'legenda' | 'subtitulo' | 'selo' | 'emblema';
/** mega 223 (§323.2/§324.2): posição em unidades do viewBox (240-base).
 *  AUSENTE = posição legada byte a byte (fotos salvas intocadas). */
export type PosFoto = Partial<Record<ElementoPosFoto, { x: number; y: number }>>;
/** mega 224 (§344): o TÍTULO como componente visual — escala dentro de
 *  limites e versão compacta. Ausente = selo legado byte a byte. */
export interface SeloCfgFoto {
  /** 'm' = neutro (omitido) */
  escala?: 'p' | 'm' | 'g';
  /** §344: versão compacta (pílula menor, nome abreviado) */
  compacto?: boolean;
}

export interface EstiloFoto {
  camadas: {
    fundo?: string;
    banner?: string;
    aura?: string;
    efeito?: string;
    moldura?: string;
    emblema?: string;
  };
  titulo?: string;
  cores: { destaque: string };
  /** megas 51–54 — ausente = sem ajustes (render idêntico ao legado) */
  ajustes?: AjustesFoto;
  /** mega 115 (§344): legenda LIVRE curta (sanitizada aqui e no PHP) */
  legenda?: string;
  /** lote 161–164 (§338): painel de camadas — ausente = render legado */
  camadasFoto?: Partial<Record<CamadaFotoId, CamadaFotoCfg>>;
  /** lote 165 (§334): luz LOCAL no medalhão · intensidade -1…1 (0 = fora) */
  luzLocal?: { tipo: 'radial' | 'linear'; intensidade: number };
  /** lote 166 (§343) — ausente = tipografia legada byte a byte */
  tipografia?: TipografiaFoto;
  /** lote 167 (§343.1): subtítulo (cargo/contexto) — formatos WIDE */
  subtitulo?: string;
  /** mega 223 (§323.2/§324.2): posições manuais — ausente = layout legado */
  pos?: PosFoto;
  /** mega 224 (§344): título-componente — ausente = selo legado */
  seloCfg?: SeloCfgFoto;
}

// ── Histórico / favoritos / conquistas ──────────────────────────────

export interface HistoricoItem {
  id: number;
  tipo: 'camadas' | 'foto' | '3d';
  config: AvatarConfig | null;
  url: string | null;
  criadoEm: string;
  /** nome dado pelo usuário (4.6 §22) — null = sem nome */
  nome: string | null;
  /** fixada = nunca sai na poda de retenção (4.6 §22) */
  fixado: boolean;
  /** esta é a versão ativa agora (header/menu/perfil) */
  ativo: boolean;
  /** número sequencial da versão (v1, v2…) */
  versao: number;
}

export interface Conquista {
  id: string;
  nome: string;
  descricao: string;
  /** categoria do registro (4.6 §8.3): criacao/exploracao/colecao/dedicacao/maestria */
  categoria: string;
  conquistada: boolean;
  em: string | null;
  /** item liberado por esta conquista (desbloqueio ADITIVO — decisão #25) */
  recompensa: string | null;
  /** progresso auditável rumo ao alvo (4.6 §8.3) */
  progresso: { atual: number; alvo: number };
}

// ── Estados de salvamento (briefing §25) ────────────────────────────

export type EstadoSalvar =
  | 'sem_alteracoes' | 'alteracoes_pendentes' | 'salvando' | 'salvo' | 'erro' | 'conflito';
