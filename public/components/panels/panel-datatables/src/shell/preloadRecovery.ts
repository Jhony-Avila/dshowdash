// shell/preloadRecovery.ts — auto-recuperação de "build novo no meio da sessão".
// @version 1.0.0  @created 2026-07-21
//
// O bug relatado: rebuild com a sessão aberta + `emptyOutDir: true` apaga os
// chunks hasheados antigos; a aba em voo tenta pré-carregar um hash que já não
// existe → o Vite dispara o evento cancelável `vite:preloadError`. Um re-import
// do MESMO hash não cura (o asset sumiu) — só recarregar a página, que traz um
// manifest/entry novos com os hashes atuais.
//
// Regras (condições do dono):
//   • no MÁXIMO 1 reload automático por sessão (guarda em sessionStorage) — sem
//     loop de reload;
//   • a guarda é LIMPA no primeiro render de rota bem-sucedido (limparGuardaReload,
//     chamada pelo App) — não fica presa bloqueando recuperações futuras;
//   • `preventDefault()` só quando de fato vamos recarregar (senão deixamos o erro
//     propagar para o ErrorBoundary, cujo botão recarrega sob ação explícita);
//   • `location.reload()` preserva a URL inteira, inclusive o hash → a aba atual
//     (ex.: Bancos) é mantida após o reload.

const CHAVE_GUARDA = 'dt.preload.reload';

/**
 * Instala o listener de `vite:preloadError`. Retorna a função de cleanup para o
 * App remover o listener ao desmontar (não vaza para o resto do app-shell).
 */
export function instalarPreloadRecovery(): () => void {
  const onErro = (e: Event): void => {
    let jaTentou = false;
    try { jaTentou = sessionStorage.getItem(CHAVE_GUARDA) === '1'; } catch { /* modo privado */ }

    if (jaTentou) {
      // Já recarregamos 1x nesta sessão e ainda falha (deploy genuinamente
      // quebrado): não recarrega de novo. Deixa propagar para o ErrorBoundary,
      // que mostra a mensagem e um botão de recarregar sob ação do usuário.
      return;
    }

    try { sessionStorage.setItem(CHAVE_GUARDA, '1'); } catch { /* modo privado: segue sem guarda */ }
    e.preventDefault();          // suprime o rethrow do Vite: nós assumimos a recuperação
    window.location.reload();    // preserva o hash → mantém a aba atual
  };

  window.addEventListener('vite:preloadError', onErro);
  return () => window.removeEventListener('vite:preloadError', onErro);
}

/**
 * Zera a guarda de reload. O App chama isto quando uma ROTA renderiza com
 * sucesso — sinal de que não estamos num ciclo de falha. Assim uma falha NOVA,
 * mais tarde na sessão, ainda pode disparar seu próprio (único) reload.
 */
export function limparGuardaReload(): void {
  try { sessionStorage.removeItem(CHAVE_GUARDA); } catch { /* ignora */ }
}
