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
  | 'acessorio' | 'fundo' | 'moldura' | 'efeito';

export type Raridade =
  | 'comum' | 'incomum' | 'raro' | 'epico' | 'lendario' | 'mitico' | 'exclusivo';

export type SlotCor = 'pele' | 'cabelo' | 'roupa' | 'destaque';

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
  /** slots de cor que este item usa (mostra o seletor correspondente) */
  usaCores?: SlotCor[];
  /** só compatível com estas bases (vazio = todas) — briefing §35 */
  requerBase?: string[];
  /** itens que não podem estar equipados junto — briefing §35 */
  incompativelCom?: string[];
}

export interface CategoriaMeta {
  id: CategoriaId;
  nome: string;
  obrigatoria: boolean;            // base sempre; demais aceitam 'nenhum'
}

// ── Configuração do avatar (persistida) ─────────────────────────────

export interface AvatarConfig {
  formato: 'camadas';              // discrimina do legado (URL de arquivo)
  versao: number;
  base: string;                    // id do item de base
  camadas: Partial<Record<Exclude<CategoriaId, 'base'>, string>>; // id por categoria ('nenhum' = ausente)
  cores: Record<SlotCor, string>;
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

// ── Histórico / favoritos / conquistas ──────────────────────────────

export interface HistoricoItem {
  id: number;
  tipo: 'camadas' | 'foto';
  config: AvatarConfig | null;
  url: string | null;
  criadoEm: string;
}

export interface Conquista {
  id: string;
  nome: string;
  descricao: string;
  conquistada: boolean;
  em: string | null;
}

// ── Estados de salvamento (briefing §25) ────────────────────────────

export type EstadoSalvar =
  | 'sem_alteracoes' | 'alteracoes_pendentes' | 'salvando' | 'salvo' | 'erro' | 'conflito';
