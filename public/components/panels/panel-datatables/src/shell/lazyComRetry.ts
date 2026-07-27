// shell/lazyComRetry.ts — React.lazy resiliente a falha de carregamento de chunk.
// @version 1.0.1  @created 2026-07-21
//
// PROBLEMA (Fase 1): o `React.lazy` puro CACHEIA a rejeição. Se o import de um
// chunk falha (ex.: "Unable to preload CSS" — asset hasheado apagado por um
// rebuild com a sessão aberta), a promessa rejeitada fica presa: re-renderizar
// (o que o "Tentar novamente" do ErrorBoundary faz) re-lança o MESMO erro e a
// tela nunca recupera.
//
// Este wrapper resolve o lado TRANSIENTE: ao falhar, espera um instante e
// RE-IMPORTA uma vez (nova tentativa de rede). Blips de rede curam sozinhos,
// sem reload. A recuperação de BUILD NOVO (hash apagado, que um re-import do
// mesmo asset não cura) fica com o `preloadRecovery` (reload guardado) e, em
// último caso, com o botão do ErrorBoundary, que recarrega quando o erro é de
// chunk (ver `ehErroDeChunk`).
import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

/** Espera `ms` sem depender de Date/Math (indisponíveis em alguns contextos). */
function esperar(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Importa com `tentativas` re-imports adicionais em caso de falha. `tentativas=1`
 * → no máximo 2 idas ao módulo. O atraso dá tempo a um blip de rede passar.
 */
function importarComRetry<T>(factory: () => Promise<T>, tentativas: number): Promise<T> {
  return factory().catch((err) => {
    if (tentativas <= 0) throw err;
    return esperar(350).then(() => importarComRetry(factory, tentativas - 1));
  });
}

/**
 * Igual a `React.lazy`, mas com 1 re-import automático antes de propagar o erro.
 * A assinatura do factory é a mesma que já usamos no App (`.then(m => ({default}))`).
 * `ComponentType<any>` espelha EXATAMENTE a assinatura do `React.lazy` — é o que
 * preserva os props de cada rota (ex.: `ir` do Overview) na inferência.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function lazyComRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
): LazyExoticComponent<T> {
  return lazy(() => importarComRetry(factory, 1));
}

/**
 * Reconhece erros de carregamento de chunk (CSS/JS) em todos os navegadores.
 * Usado pelo ErrorBoundary: quando o erro é destes, "Tentar novamente" recarrega
 * a página (busca o build novo) em vez de só re-renderizar — que re-lançaria o
 * mesmo erro, já que o asset hasheado antigo não existe mais.
 */
export function ehErroDeChunk(err: unknown): boolean {
  const msg = (err instanceof Error ? err.message : String(err ?? '')).toLowerCase();
  return (
    msg.includes('unable to preload css') ||
    msg.includes('failed to fetch dynamically imported module') ||
    msg.includes('error loading dynamically imported module') ||
    msg.includes('importing a module script failed') ||
    msg.includes('failed to load module script') ||
    /loading (css )?chunk .* failed/.test(msg)
  );
}
