// services/Telemetria.ts — eventos avst:* do estúdio (AS3 critério nº 9).
// @version 1.0.0  @created 2026-07-29
//
// Sem PII: só nomes de categoria/raridade/ação. Entrega no EventBus do shell
// quando existir (padrão windowAdapter do dash) e num CustomEvent de fallback.

interface JanelaShell extends Window {
  Core?: { windowAdapter?: { get?: (nome: string) => { emit?: (ev: string, dados?: unknown) => void } | undefined } };
}

export function telemetria(evento: string, dados: Record<string, string | number | boolean> = {}): void {
  const pacote = { ...dados, origem: 'panel-avatar-studio', em: Date.now() };
  try {
    (window as JanelaShell).Core?.windowAdapter?.get?.('EventBus')?.emit?.(`avst:${evento}`, pacote);
  } catch { /* shell ausente */ }
  try {
    window.dispatchEvent(new CustomEvent(`avst:${evento}`, { detail: pacote }));
  } catch { /* ambiente sem DOM */ }
}
