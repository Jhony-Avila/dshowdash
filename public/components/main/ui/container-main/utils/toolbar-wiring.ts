// toolbar-wiring.js — Proxy para módulo modular (Lote 11 fix)
// O bootstrap importa este arquivo; a lógica real está em ./toolbar-wiring/index.js
export { wireToolbar, setupRewireListener, info, healthCheck } from './toolbar-wiring/index.js';
import mod from './toolbar-wiring/index.js';
export default mod;
