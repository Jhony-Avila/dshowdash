/**
 * panel-relogio-mundial — Painel "Relógio Mundial" (mapa-múndi) no #main.
 * @version 1.0.0
 *
 * Binding do motor compartilhado (world-clock-map/panel.js). Montado no
 * container-main pelo PanelLifecycleController quando a rota #/panel-relogio-mundial
 * é acionada (import por convenção: /components/panels/panel-relogio-mundial/index.js).
 */
import { createWorldClock } from '/components/world-clock-map/panel.js';

const _panel = createWorldClock();

export const MODULE_ID = _panel.MODULE_ID;
export const VERSION = _panel.VERSION;
export const mount = _panel.mount;
export const unmount = _panel.unmount;
export const destroy = _panel.destroy;
export const dispose = _panel.dispose;
export const healthCheck = _panel.healthCheck;
export const info = _panel.info;
export default _panel;
