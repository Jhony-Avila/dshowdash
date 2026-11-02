// initial-route.js — o app-shell não honra o hash no BOOT A FRIO.
// @version 1.0.0  @created 2026-07-30
//
// O DEFEITO, MEDIDO (2026-07-30, navegador real, contexto limpo por medição):
//   abrir https://dshowdash.com.br/#/panel-ads direto (link, favorito, F5) monta o
//   painel "Principal" — o home — enquanto a URL segue exibindo #/panel-ads. O mesmo
//   vale para #/panel-datatables e #/panel-01: os três montavam conteúdo IDÊNTICO
//   (35.722 bytes). Navegar para o mesmo hash DEPOIS do boot monta o painel certo.
//
// NÃO É CORRIDA DE ASSINATURA. A linha do tempo mostra o hash correto já no primeiro
// script (0 ms) e ZERO eventos `hashchange` durante todo o boot — porque o hash nunca
// muda. O shell só navega em resposta a MUDANÇA de rota; ninguém lê a rota inicial.
//
// POR QUE UM MÓDULO STANDALONE, E NÃO O CONSERTO NA ORIGEM:
//   quem carrega o painel no boot é `container-bootstrap`, que NÃO é servido como
//   arquivo — ele vive dentro de `/components/main/dist/main.bundle.js`. Rebuildar
//   bundle de boot é desaconselhado neste projeto (a fonte derivou do bundle; o
//   `container-bootstrap.ts` está 4 meses atrás do `.js`). Mesmo motivo pelo qual o
//   `gcal-header-popover` existe como módulo à parte. Aqui não se toca no roteador
//   nem no bundle: usa-se a API pública `RouterGlobal.navigate`, a mesma que a
//   sidebar usa e que o `core/policies/navigation-contract` sanciona.
//
// POR QUE `navigate()` E NÃO UM `hashchange` SINTÉTICO:
//   medido lado a lado — `dispatchEvent(new HashChangeEvent(...))` NÃO monta o painel
//   (o shell não escuta esse caminho); `RouterGlobal.navigate(rota)` monta. A terceira
//   variante (trocar para '#/' e voltar) também monta, mas pisca no home e gera duas
//   montagens; foi descartada.

const VERSION = '1.0.0';
const MODULE_ID = 'app.router.initial-route';

// A rota é lida AGORA, na análise do módulo, antes que qualquer navegação posterior
// possa sobrescrevê-la.
const ROTA_INICIAL = (typeof window !== 'undefined' && window.location) ? window.location.hash : '';

// Rotas que não pedem painel nenhum: nada a repetir.
const NEUTRAS = new Set(['', '#', '#/', '#!', '#/home']);

// Raiz do painel que o shell monta por padrão. É o sinal de que o boot caiu no home
// em vez de honrar a rota — e é o que impede navegação redundante em painéis que já
// se viram sozinhos (o Relógio Mundial tem contorno próprio na ponte dele).
const RAIZ_DO_HOME = '#main .dsd-container__content [data-geral-react-root]';

const LIMITE_MS = 12000;   // desiste em silêncio: home é melhor que container vazio
const INTERVALO_MS = 150;

function log(nivel, msg) {
  try {
    const l = window.LoggerGlobal || window.logger;
    if (l && typeof l[nivel] === 'function') { l[nivel](`[${MODULE_ID}] ${msg}`); return; }
  } catch { /* logger é opcional */ }
  if (nivel === 'error' || nivel === 'warn') console[nivel](`[${MODULE_ID}] ${msg}`);
}

function roteador() {
  const rg = window.RouterGlobal || window.Router;
  return (rg && typeof rg.navigate === 'function') ? rg : null;
}

async function honrarRotaInicial() {
  if (NEUTRAS.has(ROTA_INICIAL)) return;
  // Roda uma vez por carga de página, mesmo que o módulo seja importado duas vezes.
  if (window.__initialRouteAplicada) return;
  window.__initialRouteAplicada = true;

  const prazo = Date.now() + LIMITE_MS;
  while (Date.now() < prazo) {
    // O usuário navegou por conta própria enquanto esperávamos: a rota inicial
    // perdeu a validade e forçá-la seria roubar o controle dele.
    if (window.location.hash !== ROTA_INICIAL) {
      log('debug', `rota mudou para ${window.location.hash} durante a espera; nada a fazer`);
      return;
    }

    const rg = roteador();
    const caiuNoHome = !!document.querySelector(RAIZ_DO_HOME);

    // Só age quando as DUAS condições valem: roteador pronto E o shell realmente
    // caiu no home. Se o painel certo já subiu (contorno próprio), não há o que
    // corrigir — navegar de novo só causaria uma remontagem extra.
    if (rg && caiuNoHome) {
      try {
        rg.navigate(ROTA_INICIAL);
        document.documentElement.setAttribute('data-initial-route-honrada', ROTA_INICIAL);
        log('info', `rota inicial honrada: ${ROTA_INICIAL}`);
      } catch (e) {
        log('warn', `navigate() falhou para ${ROTA_INICIAL}: ${e && e.message}`);
      }
      return;
    }

    await new Promise((r) => setTimeout(r, INTERVALO_MS));
  }

  log('warn', `desisti de honrar ${ROTA_INICIAL}: roteador ou shell não ficaram prontos em ${LIMITE_MS}ms`);
}

// `load` garante que os bundles de boot já foram avaliados; o laço acima cobre o
// resto do caminho, que é assíncrono.
if (typeof window !== 'undefined') {
  if (document.readyState === 'complete') void honrarRotaInicial();
  else window.addEventListener('load', () => { void honrarRotaInicial(); }, { once: true });
}

export { VERSION, MODULE_ID, ROTA_INICIAL, honrarRotaInicial };
export default { VERSION, MODULE_ID, honrarRotaInicial };
