/**
 * world-clock-map/index.js — PONTE clique→painel no #main.
 * @version 3.0.0
 *
 * Módulo standalone (mesmo padrão de currency-panel/index.js): escuta o clique do
 * relógio do header por DELEGAÇÃO (sem tocar no real-time-clock nem no bundle do
 * header) e navega para o painel nativo `panel-relogio-mundial`, montado no
 * container-main pelo PanelLifecycleController (import por convenção, zero DB/rota/manifest).
 *
 * A lógica do mapa vive em ./panel.js (createWorldClock), consumida pelo binding
 * /components/panels/panel-relogio-mundial/index.js.
 */
'use strict';

import { navigateToRoute } from '/components/header/components/_base/navigation-helper.js';

export const MODULE_ID = 'world-clock-map.bridge';
export const VERSION = '3.0.0';

const ROUTE = '#/panel-relogio-mundial';
const CLOCK_SELECTOR = '.real-time-clock-component';

let _inited = false;
function init() {
  if (_inited) return;
  _inited = true;
  document.addEventListener('click', (e) => {
    const clock = e.target.closest(CLOCK_SELECTOR);
    if (!clock) return;
    navigateToRoute(ROUTE, MODULE_ID);
  }, true);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();

export { init };
