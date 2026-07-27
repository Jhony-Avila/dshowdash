'use strict';
// =============================================================
// weather-fx / effects / scene-factory — roteamento ÚNICO estado→cena.
// O weather-controller chama sceneForState() e não conhece os efeitos
// concretos. Lote A+B: os 8 estados têm efeito REAL. Cenas SIMPLES (1
// efeito) e COMPOSTAS (2): tempestade = chuva-forte 'storm' + raios;
// parcial-nublado = Sun/NightSky REAL + nuvens overlay (sol/estrelas
// espiando). PlaceholderScene fica só como REDE DE SEGURANÇA (default,
// código desconhecido) — andaime, sai no go-live. Controller intocado.
// =============================================================
import type { EffectBase } from '../engine/effect-base.js';
import type { WeatherState } from '../weather/state-map.js';
import { PlaceholderScene } from './placeholder-scene.js';
import { RainEffect } from './rain.js';
import { SunEffect } from './sun.js';
import { NightSkyEffect } from './night-sky.js';
import { FogEffect } from './fog.js';
import { SnowEffect } from './snow.js';
import { CloudEffect } from './clouds.js';
import { LightningEffect } from './lightning.js';
export const MODULE_ID = 'panel-home.weather-fx.effects.scene-factory';
export const VERSION = '0.2.0-ETAPA5';

export function sceneForState(state: WeatherState): EffectBase[] {
  switch (state.id) {
    case 'ceu-limpo':
      return [state.isDay ? new SunEffect({ isDay: true }) : new NightSkyEffect({ isDay: false })];
    case 'chuva-leve':
      return [new RainEffect({ intensity: 0.35, isDay: state.isDay })];
    case 'chuva-forte':
      return [new RainEffect({ intensity: 0.85, isDay: state.isDay })];
    case 'nevoa':
      return [new FogEffect({ isDay: state.isDay })];
    case 'neve':
      return [new SnowEffect({ isDay: state.isDay })];
    case 'nublado':
      return [new CloudEffect({ coverage: 0.85, isDay: state.isDay, overlay: false })];
    case 'parcial-nublado':
      // cena COMPOSTA: Sun/NightSky real por baixo + nuvens esparsas por cima
      return [
        state.isDay ? new SunEffect({ isDay: true }) : new NightSkyEffect({ isDay: false }),
        new CloudEffect({ coverage: 0.45, isDay: state.isDay, overlay: true })
      ];
    case 'tempestade':
      // cena COMPOSTA: chuva-forte com céu 'storm' + raios (overlay)
      return [
        new RainEffect({ intensity: 0.9, isDay: state.isDay, palette: 'storm' }),
        new LightningEffect({ isDay: state.isDay })
      ];
    default:
      return [new PlaceholderScene(state)];   // rede de segurança (código WMO fora da tabela)
  }
}
export default sceneForState;
