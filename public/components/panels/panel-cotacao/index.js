/**
 * panel-cotacao — Painel ÚNICO de cotação com abas (Dólar/Yuan/Bitcoin) no #main.
 * Binding do componente compartilhado (panel-cotacao-shared/render.js). @version 1.0.0
 */
import { createCotacaoPanel } from "/components/panels/panel-cotacao-shared/render.js";

const _panel = createCotacaoPanel();

export const MODULE_ID = _panel.MODULE_ID;
export const VERSION = _panel.VERSION;
export const mount = _panel.mount;
export const unmount = _panel.unmount;
export const destroy = _panel.destroy;
export const dispose = _panel.dispose;
export const healthCheck = _panel.healthCheck;
export const info = _panel.info;
export default _panel;
