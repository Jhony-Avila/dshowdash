// services/Log.ts — LOGGING estruturado do estúdio (mega 86 · §291).
// @version 1.0.0  @created 2026-08-04
//
// Convenções: nível + evento curto + dados planos (sem PII — mesma regra
// da telemetria). aviso/erro também entram no ring buffer da telemetria
// (viewer dev §290 os mostra como log_aviso/log_erro); debug só aparece
// com a flag de dev ligada — produção fica silenciosa.
import { telemetria } from './Telemetria';
import { flag } from '../nucleo/flags';

type Nivel = 'debug' | 'info' | 'aviso' | 'erro';

function registrar(nivel: Nivel, evento: string, dados: Record<string, string | number | boolean> = {}): void {
  const linha = `[avst:${nivel}] ${evento}`;
  try {
    if (nivel === 'erro') console.error(linha, dados);
    else if (nivel === 'aviso') console.warn(linha, dados);
    else if (flag('as5.telemetria_painel')) console.info(linha, dados); // dev only
  } catch { /* console indisponível */ }
  if (nivel === 'aviso' || nivel === 'erro') telemetria(`log_${nivel}`, { evento, ...dados });
}

export const log = {
  debug: (evento: string, dados?: Record<string, string | number | boolean>) => registrar('debug', evento, dados),
  info: (evento: string, dados?: Record<string, string | number | boolean>) => registrar('info', evento, dados),
  aviso: (evento: string, dados?: Record<string, string | number | boolean>) => registrar('aviso', evento, dados),
  erro: (evento: string, dados?: Record<string, string | number | boolean>) => registrar('erro', evento, dados),
};
