/**
 * world-clock-map/index.js — PONTE clique→painel no #main + abertura por link direto.
 * @version 3.1.0
 *
 * Módulo standalone (mesmo padrão de currency-panel/index.js): escuta o clique do
 * relógio do header por DELEGAÇÃO (sem tocar no real-time-clock nem no bundle do
 * header) e navega para o painel nativo `panel-relogio-mundial`, montado no
 * container-main pelo PanelLifecycleController (import por convenção, zero DB/rota/manifest).
 *
 * A lógica do mapa vive no painel React (/components/panels/panel-relogio-mundial/),
 * com ./panel.js (createWorldClock) preservado como fallback vanilla.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ABERTURA POR LINK DIRETO (v3.1.0)
 *
 * MEDIDO EM 2026-07-30: o app-shell NÃO honra o hash no carregamento a frio. Abrir
 * `https://dshowdash.com.br/#/panel-relogio-mundial` numa aba nova cai em "Principal"
 * com o hash intacto na barra de endereços. Não é específico deste painel — o mesmo
 * acontece com `#/panel-ads` (testado como controle). O roteador do shell só reage a
 * `hashchange`, e num boot a frio esse evento nunca dispara.
 *
 * Consequência: o link compartilhável do Relógio Mundial — cujo propósito inteiro é
 * reproduzir uma configuração — não abria o painel para quem recebia o link.
 *
 * A CORREÇÃO AQUI É DELIBERADAMENTE LOCAL. Consertar o roteador do shell seria mexer
 * num componente de boot com histórico de bundles circulares, para além do escopo
 * deste módulo. Esta ponte já sabe navegar (é o que faz no clique do header); ela
 * passa a também disparar a navegação UMA VEZ quando a URL pede este painel e o
 * shell terminou de subir. O resto do app fica intocado.
 */
'use strict';

import { navigateToRoute } from '/components/header/components/_base/navigation-helper.js';

export const MODULE_ID = 'world-clock-map.bridge';
export const VERSION = '3.1.0';

const ROUTE = '#/panel-relogio-mundial';
const CLOCK_SELECTOR = '.real-time-clock-component';

/** Sinal de que o shell montou o container onde o painel vive. */
const SHELL_PRONTO = '.dsd-container__content';
/** Sinal de que o painel JÁ está montado (não navegar por cima). */
const PAINEL_MONTADO = '[data-wcm-react-root], .wcm-panel';

/**
 * Orçamento generoso de propósito: quando o link chega com a sessão expirada, o
 * caminho é login → boot do shell → container. Com 15 s a janela estourava ainda na
 * tela de login e a abertura nunca acontecia — a primeira versão desta correção
 * funcionava só quando a sessão já estava quente.
 */
const ESPERA_MAX_MS = 45000;
const INTERVALO_MS = 250;
/** Tempo dado ao shell para montar o painel antes de tentar o caminho alternativo. */
const CONFIRMA_MS = 1800;

let _inited = false;
let _aberturaTentada = false;

/** A URL atual pede este painel? Aceita o hash da rota ou o marcador de link compartilhado. */
function urlPedeEstePainel() {
  try {
    if (window.location.hash.startsWith(ROUTE)) return true;
    return new URLSearchParams(window.location.search).get('wc') === '1';
  } catch (_e) {
    return false;
  }
}

/**
 * Espera o shell subir e navega uma única vez.
 *
 * Poll em vez de evento porque não há um sinal público e estável de "shell pronto"
 * neste projeto; o container-main aparecer no DOM é o critério observável. O teto de
 * 15 s existe para o poll não virar um timer imortal numa página que nunca sobe.
 */
function abrirPorLinkDireto() {
  if (_aberturaTentada || !urlPedeEstePainel()) return;
  _aberturaTentada = true;

  const limite = Date.now() + ESPERA_MAX_MS;
  const timer = setInterval(() => {
    // Já montou (por qualquer caminho): nada a fazer.
    if (document.querySelector(PAINEL_MONTADO)) {
      clearInterval(timer);
      return;
    }
    if (Date.now() > limite) {
      clearInterval(timer);
      return;
    }
    if (!document.querySelector(SHELL_PRONTO)) return;

    clearInterval(timer);
    navegarEConfirmar();
  }, INTERVALO_MS);
}

/**
 * Navega e VERIFICA. Duas rotas para o mesmo destino, na ordem certa:
 *
 *  1. `navigateToRoute` — o caminho oficial do shell (eventos de navegação).
 *  2. Se em CONFIRMA_MS o painel não montou, força um `hashchange` de verdade
 *     (limpa o hash e repõe). O roteador só reage a MUDANÇA de hash, e num link
 *     direto o hash já chega com o valor final — do ponto de vista dele, nada mudou.
 *
 * Verificar em vez de confiar é o ponto: a primeira versão só chamava (1) e dava
 * "sucesso" enquanto o usuário olhava para o painel Principal.
 */
function navegarEConfirmar() {
  // Sem o hash na barra, `navigateToRoute` não encontra o roteador "já na rota".
  try {
    if (window.location.hash.startsWith(ROUTE)) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  } catch (_e) { /* segue mesmo assim */ }

  navigateToRoute(ROUTE, MODULE_ID);

  setTimeout(() => {
    if (document.querySelector(PAINEL_MONTADO)) {
      // Deixa a barra de endereços coerente com o que está na tela, sem disparar
      // outro hashchange (replaceState não dispara).
      try {
        window.history.replaceState(null, '', window.location.pathname + window.location.search + ROUTE);
      } catch (_e) { /* cosmético */ }
      return;
    }
    // Caminho alternativo: hashchange real.
    try {
      window.location.hash = '';
      setTimeout(() => { window.location.hash = ROUTE; }, 60);
    } catch (_e) { /* nada mais a fazer */ }
  }, CONFIRMA_MS);
}

function init() {
  if (_inited) return;
  _inited = true;

  document.addEventListener('click', (e) => {
    const clock = e.target.closest(CLOCK_SELECTOR);
    if (!clock) return;
    navigateToRoute(ROUTE, MODULE_ID);
  }, true);

  abrirPorLinkDireto();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();

export { init, abrirPorLinkDireto };
