const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.ui.accessibility-presets.presets-config";
const PRESETS = {
  default: {
    name: "Default",
    description: "Configura\xE7\xF5es padr\xE3o",
    cssVars: {},
    bodyClasses: [],
    settings: {}
  },
  "high-contrast": {
    name: "High Contrast",
    description: "Alto contraste para melhor legibilidade",
    cssVars: {
      "--color-background": "#000000",
      "--color-surface": "#1a1a1a",
      "--color-text": "#ffffff",
      "--color-text-muted": "#e0e0e0",
      "--color-primary": "#ffff00",
      "--color-border": "#ffffff"
    },
    bodyClasses: ["a11y-high-contrast"],
    settings: { contrast: "high" }
  },
  "large-text": {
    name: "Large Text",
    description: "Texto ampliado para melhor leitura",
    cssVars: {
      "--font-size-base": "18px",
      "--font-size-sm": "16px",
      "--font-size-lg": "22px",
      "--font-size-xl": "26px",
      "--line-height-base": "1.6"
    },
    bodyClasses: ["a11y-large-text"],
    settings: { fontSize: "large" }
  },
  "reduced-motion": {
    name: "Reduced Motion",
    description: "Remove anima\xE7\xF5es e transi\xE7\xF5es",
    cssVars: {
      "--transition-duration": "0ms",
      "--animation-duration": "0ms"
    },
    bodyClasses: ["a11y-reduced-motion"],
    settings: { reduceMotion: true }
  },
  "focus-visible": {
    name: "Enhanced Focus",
    description: "Indicadores de foco mais vis\xEDveis",
    cssVars: {
      "--focus-outline-width": "3px",
      "--focus-outline-offset": "2px",
      "--focus-outline-color": "#0066ff"
    },
    bodyClasses: ["a11y-focus-visible"],
    settings: { enhancedFocus: true }
  },
  "dyslexia-friendly": {
    name: "Dyslexia Friendly",
    description: "Configura\xE7\xF5es para dislexia",
    cssVars: {
      "--font-family-base": "OpenDyslexic, Arial, sans-serif",
      "--letter-spacing": "0.05em",
      "--word-spacing": "0.16em",
      "--line-height-base": "1.8"
    },
    bodyClasses: ["a11y-dyslexia-friendly"],
    settings: { dyslexiaMode: true }
  },
  "low-vision": {
    name: "Low Vision",
    description: "Otimizado para baixa vis\xE3o",
    cssVars: {
      "--font-size-base": "20px",
      "--font-weight-base": "500",
      "--color-text": "#000000",
      "--color-background": "#fffef0",
      "--line-height-base": "1.7"
    },
    bodyClasses: ["a11y-low-vision"],
    settings: { lowVision: true }
  },
  "cognitive": {
    name: "Cognitive",
    description: "Interface simplificada",
    cssVars: {
      "--content-max-width": "600px",
      "--paragraph-spacing": "1.5em"
    },
    bodyClasses: ["a11y-cognitive"],
    settings: { simplifiedUI: true }
  }
};
const presetConfigs = PRESETS;
function getPresetConfig(presetName) {
  return PRESETS[presetName] || PRESETS.default;
}
var presets_config_default = {
  PRESETS,
  presetConfigs,
  getPresetConfig
};
export {
  MODULE_ID,
  PRESETS,
  VERSION,
  presets_config_default as default,
  getPresetConfig,
  presetConfigs
};
