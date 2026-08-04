// services/Telemetria.ts — eventos avst:* do estúdio (AS3 critério nº 9).
// @version 2.0.0  @created 2026-07-29  @updated 2026-08-04 (mega 46:
// ring buffer local + assinatura p/ o painel dev de observabilidade)
//
// Sem PII: só nomes de categoria/raridade/ação. Entrega no EventBus do shell
// quando existir (padrão windowAdapter do dash) e num CustomEvent de fallback.
// Mega 46: os últimos eventos ficam num RING BUFFER em memória (nunca
// persiste, nunca sai da aba) p/ o viewer dev — observabilidade sem servidor.

interface JanelaShell extends Window {
  Core?: { windowAdapter?: { get?: (nome: string) => { emit?: (ev: string, dados?: unknown) => void } | undefined } };
}

export interface EventoTelemetria {
  evento: string;
  dados: Record<string, string | number | boolean>;
  em: number;
}

const LIMITE_BUFFER = 100;
const buffer: EventoTelemetria[] = [];
const ouvintes = new Set<() => void>();

export function telemetria(evento: string, dados: Record<string, string | number | boolean> = {}): void {
  const pacote = { ...dados, origem: 'panel-avatar-studio', em: Date.now() };
  try {
    (window as JanelaShell).Core?.windowAdapter?.get?.('EventBus')?.emit?.(`avst:${evento}`, pacote);
  } catch { /* shell ausente */ }
  try {
    window.dispatchEvent(new CustomEvent(`avst:${evento}`, { detail: pacote }));
  } catch { /* ambiente sem DOM */ }
  // mega 46: ring buffer local (o viewer dev assina)
  buffer.push({ evento, dados, em: pacote.em });
  if (buffer.length > LIMITE_BUFFER) buffer.shift();
  for (const fn of ouvintes) { try { fn(); } catch { /* ouvinte quebrado não derruba */ } }
}

/** mega 46: leitura p/ o painel dev (mais recente por último). */
export function eventosRecentes(): readonly EventoTelemetria[] {
  return buffer;
}

export function limparTelemetria(): void {
  buffer.length = 0;
  for (const fn of ouvintes) { try { fn(); } catch { /* idem */ } }
}

/** Assinatura simples (devolve o cancelamento). */
export function assinarTelemetria(fn: () => void): () => void {
  ouvintes.add(fn);
  return () => { ouvintes.delete(fn); };
}
