'use strict';
// =============================================================
// weather-fx / effects / live-probe — sonda anti-leak COMPARTILHADA.
// Um contador único de EffectModules vivos: liveInc() no ctor de cada
// efeito, liveDec() no destroy (o efeito guarda um flag `counted` p/
// idempotência). healthCheck lê liveCount() UMA vez. Substitui os
// `_live` locais de test-fill/placeholder e cobre rain/sun/night.
// INVARIANTE (Lote B — cenas compostas):
//   cena SIMPLES (1 efeito): liveCount 1 estável, ≤2 no pico do crossfade;
//   cena COMPOSTA (tempestade/parcial = 2 efeitos): 2 estável, ≤4 no pico
//   (2 saindo + 2 entrando). Teto GERAL = 4. Acima de 4 = leak real.
// =============================================================
export const MODULE_ID = 'panel-home.weather-fx.effects.live-probe';
export const VERSION = '0.1.0-ETAPA4';

let _live = 0;
export function liveInc(): void { _live++; }
export function liveDec(): void { if (_live > 0) _live--; }   // clamp defensivo (nunca negativo)
export function liveCount(): number { return _live; }
