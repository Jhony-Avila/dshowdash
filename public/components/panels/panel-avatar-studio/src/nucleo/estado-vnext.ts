// nucleo/estado-vnext.ts — AVATAR STATE vNEXT (AS6 L0 · §3390–§3396,
// lote 751–760, flag as6.estado_vnext — decisão #77).
// @version 1.0.0  @created 2026-08-08
//
// O AS6 §3390–§3392 pede estado versionado com schemaVersion /
// avatarVersion / updatedAt. MAPEAMENTO para o que JÁ EXISTE (nada de
// campo novo persistido — byte-stability):
//   schemaVersion → AvatarConfig.versao (VERSAO_CONFIG) e
//                   EstadoAvatar.schemaVersion (SCHEMA_VERSION_ATUAL);
//   avatarVersion → base_version do espelho §619 (AvatarStore.versao);
//   updatedAt     → atualizadoEm (servidor é a fonte do relógio).
//
// Este módulo entrega as DUAS peças que faltavam do L0:
//   1. Registro de migrações de SCHEMA (§3393): v1→v2→…, cada migração
//      pura, determinística e testável; NUNCA lança (falha = devolve o
//      dado original e reporta — o validarConfig continua sendo a rede
//      final de coerção). Difere do nucleo/migracoes.ts, que migra
//      CHAVES de storage (§299–§300) — aqui migra o CONTEÚDO.
//   2. Renderer Capability Registry (§3396): cada renderer DECLARA o
//      que suporta; a UI consulta em vez de espalhar `if (renderer)`.
//
// Regra de ouro: os registros nascem VAZIOS (schema atual = 1 nos dois
// modelos). Com zero migrações pendentes, migrar() é identidade — a
// flag ligada não muda um byte de nenhum avatar salvo. O primeiro bump
// real (ex.: vestuário multi-peça, lote 811+) adiciona a entrada aqui
// e SÓ aqui, com teste próprio.
import type { RendererId } from './contratos';

// ── 1. Motor de migrações de schema (§3393) ─────────────────────────

export interface MigracaoSchema {
  /** versão de origem (aplica quando o dado está NESTA versão) */
  de: number;
  /** versão de destino (sempre de + 1 — cadeia linear, sem saltos) */
  para: number;
  /** transformação PURA e determinística; recebe e devolve o dado bruto */
  migrar: (dado: Record<string, unknown>) => Record<string, unknown>;
  /** por que a migração existe (vira changelog auditável §3393) */
  motivo: string;
}

export interface RegistroMigracoes {
  /** nome do campo que carrega a versão no dado ('versao'/'schemaVersion') */
  campoVersao: string;
  /** versão atual do schema — dado nesta versão não migra */
  versaoAtual: number;
  /** cadeia ordenada v1→v2→… (validada em tempo de execução) */
  migracoes: MigracaoSchema[];
}

export interface ResultadoMigracao {
  dado: unknown;
  /** ids "de→para" aplicados NESTA chamada (vazio = já estava atual) */
  aplicadas: string[];
  /** true quando alguma migração lançou — dado devolvido é o ORIGINAL */
  falhou: boolean;
}

/**
 * Aplica as migrações pendentes de um registro sobre um dado bruto.
 * Determinística e total: entrada não-objeto, versão desconhecida (maior
 * que a atual ou não numérica) ou cadeia quebrada = devolve o original
 * sem tocar (o validarConfig segue como rede final). Nunca lança.
 */
export function migrarSchema(registro: RegistroMigracoes, bruto: unknown): ResultadoMigracao {
  if (bruto === null || typeof bruto !== 'object' || Array.isArray(bruto)) {
    return { dado: bruto, aplicadas: [], falhou: false };
  }
  const versaoDe = (d: unknown): number => {
    const v = (d as Record<string, unknown>)[registro.campoVersao];
    return typeof v === 'number' && Number.isFinite(v) ? v : registro.versaoAtual;
  };
  let atual = bruto as Record<string, unknown>;
  const aplicadas: string[] = [];
  // teto de passos = tamanho da cadeia (nunca laça para sempre)
  for (let passo = 0; passo < registro.migracoes.length; passo++) {
    const v = versaoDe(atual);
    if (v >= registro.versaoAtual) break;
    const proxima = registro.migracoes.find((m) => m.de === v);
    if (!proxima) break; // cadeia quebrada — para sem inventar
    try {
      const migrado = proxima.migrar(atual);
      // a migração é OBRIGADA a carimbar a versão de destino; se não
      // carimbou, carimbamos por ela (invariante da cadeia)
      const saida = { ...migrado, [registro.campoVersao]: proxima.para };
      aplicadas.push(`${proxima.de}→${proxima.para}`);
      atual = saida;
    } catch {
      return { dado: bruto, aplicadas: [], falhou: true };
    }
  }
  return { dado: atual, aplicadas, falhou: false };
}

/**
 * Registro de migrações do AvatarConfig (campo `versao`, atual = 2).
 * O VERSAO_CONFIG do catálogo é a fonte da versão atual; espelhado aqui
 * como literal para manter este módulo na base da pirâmide (sem import
 * de services/).
 *
 * v1→v2 (lote 931–940, decisão #95 — PRIMEIRA migração real): o schema
 * v2 introduz a camada OPCIONAL `camadas.roupa_sobre` (vestuário
 * multi-peça §3393). Um config v1 é um v2 válido sem o campo — a
 * migração é o CARIMBO de versão (o motor grava `versao: 2`); nenhum
 * byte de camada muda e nenhum avatar salvo muda de render.
 */
export const MIGRACOES_CONFIG: RegistroMigracoes = {
  campoVersao: 'versao',
  versaoAtual: 2,
  migracoes: [
    {
      de: 1,
      para: 2,
      migrar: (dado) => dado, // carimbo puro — v1 ⊂ v2 (campo novo opcional)
      motivo: 'v2: camada opcional camadas.roupa_sobre (vestuário multi-peça §3393, decisão #95)',
    },
  ],
};

/** Registro de migrações do EstadoAvatar (campo `schemaVersion`, atual = 1). */
export const MIGRACOES_ESTADO: RegistroMigracoes = {
  campoVersao: 'schemaVersion',
  versaoAtual: 1,
  migracoes: [],
};

/** Fachadas com o registro certo já aplicado. */
export const migrarConfigVNext = (bruto: unknown): ResultadoMigracao => migrarSchema(MIGRACOES_CONFIG, bruto);
export const migrarEstadoVNext = (bruto: unknown): ResultadoMigracao => migrarSchema(MIGRACOES_ESTADO, bruto);

// ── 2. Renderer Capability Registry (§3396) ─────────────────────────

/** O que cada renderer DECLARA suportar (vocabulário §3396 traduzido). */
export interface CapacidadesRenderer {
  suportaMorfos: boolean;          // §412–§414 (3D: escala; 2D: transform §102)
  suportaFisica: boolean;          // spring bones/vento (§302) — ninguém hoje
  suportaPoderes: boolean;         // partículas/poder §153–§156
  suportaLuz3d: boolean;           // luzes reais (chave/preencher/rim §452)
  suportaFotoHQ: boolean;          // captura §506/§329 (supersampling)
  suportaFundoAnimado: boolean;    // clima/partículas de cenário
  suportaAnimacao: boolean;        // clipes/máquina §432–§433
  suportaCanaisCor: boolean;       // canais §73 (2D nato; 3D §420–§421)
}

/**
 * Declaração por renderer (§3396) — consulta única no lugar de
 * `if (renderer === …)` espalhado (§3395). O id segue RendererId de
 * contratos.ts; 'foto' é o pipeline de captura 2D do Photo Studio.
 */
export const CAPACIDADES_RENDERER: Record<RendererId, CapacidadesRenderer> = {
  '2d': {
    suportaMorfos: true, suportaFisica: false, suportaPoderes: true,
    suportaLuz3d: false, suportaFotoHQ: false, suportaFundoAnimado: true,
    suportaAnimacao: false, suportaCanaisCor: true,
  },
  '3d': {
    suportaMorfos: true, suportaFisica: false, suportaPoderes: false,
    suportaLuz3d: true, suportaFotoHQ: true, suportaFundoAnimado: false,
    suportaAnimacao: true, suportaCanaisCor: true,
  },
  foto: {
    suportaMorfos: true, suportaFisica: false, suportaPoderes: false,
    suportaLuz3d: false, suportaFotoHQ: true, suportaFundoAnimado: false,
    suportaAnimacao: false, suportaCanaisCor: true,
  },
};

export function capacidadesDe(id: RendererId): CapacidadesRenderer {
  return CAPACIDADES_RENDERER[id];
}
