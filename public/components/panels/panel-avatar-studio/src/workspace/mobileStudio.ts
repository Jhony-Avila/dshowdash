// workspace/mobileStudio.ts — TRACK C: decisão CENTRALIZADA de layout mobile.
//
// Uma única fonte de verdade: a composição mobile ativa quando a flag
// `as6.mobile_studio` está ON **e** o viewport é estreito/baixo — derivado do
// CONTEÚDO, não de user-agent. O grid desktop de 5 colunas (nav 176 + palco 1fr
// + catálogo 380 + alças) precisa de ~928px p/ respirar; abaixo disso ele degrada
// e no celular fica inutilizável (a 375px sobra ~11px p/ o palco). Por isso o
// stack vertical entra em telas ESTREITAS (≤768) ou BAIXAS (≤520 — celular em
// paisagem). Tablet em paisagem (1024×768) e desktop seguem no grid aprovado.
//
// NÃO usa navigator.userAgent (§2: sem UA-sniffing). Reage a resize/orientação
// via matchMedia. Retorna false quando a flag está OFF → desktop byte a byte.
// @version 1.0.0  @created 2026-08-28 (Track C — Marco 1)
import { useEffect, useState } from 'react';
import { flag } from '../nucleo/flags';

/** Breakpoints derivados do conteúdo (ver AVATAR_STUDIO_MOBILE_DESIGN_SPEC). */
export const MOBILE_MAX_W = 768; // ≤ tablet-portrait: grid de 5 col não cabe
export const MOBILE_MAX_H = 520; // celular em paisagem (altura baixa)
export const MOBILE_MEDIA = `(max-width: ${MOBILE_MAX_W}px), (max-height: ${MOBILE_MAX_H}px)`;

function medirEstreito(): boolean {
  try { return window.matchMedia(MOBILE_MEDIA).matches; } catch { return false; }
}

/** True quando a composição mobile deve valer (flag ON + viewport estreito/baixo). */
export function useMobileStudio(): boolean {
  const [estreito, setEstreito] = useState<boolean>(medirEstreito);
  useEffect(() => {
    let mq: MediaQueryList | null = null;
    try { mq = window.matchMedia(MOBILE_MEDIA); } catch { mq = null; }
    const ao = () => setEstreito(medirEstreito());
    ao(); // sincroniza no mount (SSR/hidratação)
    mq?.addEventListener?.('change', ao);
    window.addEventListener('resize', ao, { passive: true });
    window.addEventListener('orientationchange', ao);
    return () => {
      mq?.removeEventListener?.('change', ao);
      window.removeEventListener('resize', ao);
      window.removeEventListener('orientationchange', ao);
    };
  }, []);
  return flag('as6.mobile_studio') && estreito;
}

/** Guard do botão VOLTAR no celular (cert corretiva). Enquanto a composição
 *  mobile está ativa, um "voltar" (popstate) fecha primeiro a camada interna
 *  aberta — sheet de ferramenta, drawer de detalhes, modal genérico — em vez de
 *  sair do módulo. Reusa o handler de Escape já existente no shell (dispara um
 *  keydown Escape), então não duplica lógica de fechamento. Se nada estiver
 *  aberto, deixa o voltar propagar para o host. No-op quando inativo. */
export function useBackGuard(ativo: boolean): void {
  useEffect(() => {
    if (!ativo) return;
    // camadas internas em ordem de prioridade + seletor do respectivo fechar
    const OVERLAYS: Array<[string, string]> = [
      ['.avst5-ferr-fundo', '.avst5-ferr-fechar'],
      ['.avst5-detalhe', '.avst5-det-fechar, .avst5-detalhe [aria-label*="echar"], .avst5-detalhe button'],
      ['.avst5-modal-fundo:not(.avst5-ferr-fundo)', '.avst5-modal-fechar, .avst5-modal-fundo [aria-label*="echar"]'],
      ['.avst5-paleta-cmd', '.avst5-paleta-fechar'],
    ];
    const overlayAberto = () => OVERLAYS.find(([sel]) => document.querySelector(sel));
    let armado = false;
    const armar = () => { if (!armado) { try { history.pushState({ avstBackGuard: true }, ''); armado = true; } catch { /* sem history */ } } };
    const mo = new MutationObserver(() => { if (overlayAberto()) armar(); });
    try { mo.observe(document.body, { childList: true, subtree: true }); } catch { /* sem DOM */ }
    const aoVoltar = () => {
      const aberto = overlayAberto();
      if (aberto) {
        // fecha a camada de cima: clica o botão de fechar (fallback: Escape)
        const fechar = document.querySelector<HTMLElement>(aberto[1]);
        if (fechar) fechar.click();
        else { document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); }
        armado = false; if (overlayAberto()) armar();
      }
      // sem overlay: não re-arma → o voltar segue para o host
    };
    window.addEventListener('popstate', aoVoltar);
    return () => { mo.disconnect(); window.removeEventListener('popstate', aoVoltar); };
  }, [ativo]);
}

/** Teclado virtual: usa VisualViewport (evento confiável, sem timeout arbitrário)
 *  p/ (a) marcar data-avst-kb no <html> quando o teclado abre e (b) publicar a
 *  altura ocupada em --avst-kb. O CSS mobile usa isso p/ tirar a barra de salvar
 *  de cima do teclado e o browser rola o campo focado (scroll-margin). No-op se
 *  a composição mobile não está ativa ou não há VisualViewport. */
export function useTecladoVirtual(ativo: boolean): void {
  useEffect(() => {
    if (!ativo) return;
    const vv = window.visualViewport;
    if (!vv) return;
    const raiz = document.documentElement;
    const ao = () => {
      const kb = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      raiz.style.setProperty('--avst-kb', `${Math.round(kb)}px`);
      if (kb > 80) raiz.setAttribute('data-avst-kb', '1');
      else raiz.removeAttribute('data-avst-kb');
    };
    vv.addEventListener('resize', ao);
    vv.addEventListener('scroll', ao);
    ao();
    return () => {
      vv.removeEventListener('resize', ao);
      vv.removeEventListener('scroll', ao);
      raiz.removeAttribute('data-avst-kb');
      raiz.style.removeProperty('--avst-kb');
    };
  }, [ativo]);
}
