// services/Log.ts — LOGGING estruturado do estúdio (mega 86 · §291;
// mega 279 · §291 v2: 5º nível CRÍTICO com ring persistente).
// @version 1.1.0  @created 2026-08-04  @updated 2026-08-05
//
// Convenções: nível + evento curto + dados planos (sem PII — mesma regra
// da telemetria). aviso/erro também entram no ring buffer da telemetria
// (viewer dev §290 os mostra como log_aviso/log_erro); debug só aparece
// com a flag de dev ligada — produção fica silenciosa.
// CRÍTICO (§291 v2) = quebrou fluxo do usuário (save falhou de vez,
// motor 3D morreu sem recuperação): além de erro, entra num ring
// PERSISTENTE de 20 entradas (localStorage) que sobrevive ao reload —
// é o que o suporte lê quando o usuário só consegue dizer "quebrou".
import { telemetria } from './Telemetria';
import { flag } from '../nucleo/flags';

type Nivel = 'debug' | 'info' | 'aviso' | 'erro' | 'critico';

const CHAVE_CRITICOS = 'dshow.avst5.criticos.v1';
const MAX_CRITICOS = 20;

export interface RegistroCritico {
  quando: string;                  // ISO — suporte precisa da hora
  evento: string;
  dados: Record<string, string | number | boolean>;
}

/** Ring persistente dos críticos (§291 v2) — mais recente primeiro. */
export function lerCriticos(): RegistroCritico[] {
  try {
    const bruto = JSON.parse(localStorage.getItem(CHAVE_CRITICOS) ?? '[]');
    return Array.isArray(bruto) ? bruto as RegistroCritico[] : [];
  } catch { return []; }
}

export function limparCriticos(): void {
  try { localStorage.removeItem(CHAVE_CRITICOS); } catch { /* sem storage */ }
}

function persistirCritico(evento: string, dados: Record<string, string | number | boolean>): void {
  try {
    const lista = [{ quando: new Date().toISOString(), evento, dados }, ...lerCriticos()];
    localStorage.setItem(CHAVE_CRITICOS, JSON.stringify(lista.slice(0, MAX_CRITICOS)));
  } catch { /* quota/privado — o console já registrou */ }
}

function registrar(nivel: Nivel, evento: string, dados: Record<string, string | number | boolean> = {}): void {
  const linha = `[avst:${nivel}] ${evento}`;
  try {
    if (nivel === 'erro' || nivel === 'critico') console.error(linha, dados);
    else if (nivel === 'aviso') console.warn(linha, dados);
    else if (flag('as5.telemetria_painel')) console.info(linha, dados); // dev only
  } catch { /* console indisponível */ }
  if (nivel === 'aviso' || nivel === 'erro' || nivel === 'critico') telemetria(`log_${nivel}`, { evento, ...dados });
  if (nivel === 'critico') persistirCritico(evento, dados);
}

export const log = {
  debug: (evento: string, dados?: Record<string, string | number | boolean>) => registrar('debug', evento, dados),
  info: (evento: string, dados?: Record<string, string | number | boolean>) => registrar('info', evento, dados),
  aviso: (evento: string, dados?: Record<string, string | number | boolean>) => registrar('aviso', evento, dados),
  erro: (evento: string, dados?: Record<string, string | number | boolean>) => registrar('erro', evento, dados),
  critico: (evento: string, dados?: Record<string, string | number | boolean>) => registrar('critico', evento, dados),
};
