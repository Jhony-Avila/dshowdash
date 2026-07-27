import { PlaceholderScene } from "./placeholder-scene.js";
import { RainEffect } from "./rain.js";
import { SunEffect } from "./sun.js";
import { NightSkyEffect } from "./night-sky.js";
import { FogEffect } from "./fog.js";
import { SnowEffect } from "./snow.js";
import { CloudEffect } from "./clouds.js";
import { LightningEffect } from "./lightning.js";
const MODULE_ID = "panel-home.weather-fx.effects.scene-factory";
const VERSION = "0.2.0-ETAPA5";
function sceneForState(state) {
  switch (state.id) {
    case "ceu-limpo":
      return [state.isDay ? new SunEffect({ isDay: true }) : new NightSkyEffect({ isDay: false })];
    case "chuva-leve":
      return [new RainEffect({ intensity: 0.35, isDay: state.isDay })];
    case "chuva-forte":
      return [new RainEffect({ intensity: 0.85, isDay: state.isDay })];
    case "nevoa":
      return [new FogEffect({ isDay: state.isDay })];
    case "neve":
      return [new SnowEffect({ isDay: state.isDay })];
    case "nublado":
      return [new CloudEffect({ coverage: 0.85, isDay: state.isDay, overlay: false })];
    case "parcial-nublado":
      return [
        state.isDay ? new SunEffect({ isDay: true }) : new NightSkyEffect({ isDay: false }),
        new CloudEffect({ coverage: 0.45, isDay: state.isDay, overlay: true })
      ];
    case "tempestade":
      return [
        new RainEffect({ intensity: 0.9, isDay: state.isDay, palette: "storm" }),
        new LightningEffect({ isDay: state.isDay })
      ];
    default:
      return [new PlaceholderScene(state)];
  }
}
var scene_factory_default = sceneForState;
export {
  MODULE_ID,
  VERSION,
  scene_factory_default as default,
  sceneForState
};
