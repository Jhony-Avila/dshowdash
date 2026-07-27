const VERSION = "1.0.0-MODULAR";
const MODULE_ID = "container-main:image-virtualizer";
const LOAD_STRATEGIES = Object.freeze({
  LAZY: "lazy",
  EAGER: "eager",
  VIEWPORT: "viewport",
  PROGRESSIVE: "progressive"
});
const IMAGE_STATES = Object.freeze({
  IDLE: "idle",
  LOADING: "loading",
  LOADED: "loaded",
  ERROR: "error",
  PLACEHOLDER: "placeholder"
});
const IMAGE_QUALITY = Object.freeze({
  THUMBNAIL: "thumbnail",
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  ORIGINAL: "original"
});
const DEFAULT_CONFIG = Object.freeze({
  rootMargin: "100px",
  threshold: 0.1,
  placeholderColor: "#f0f0f0",
  fadeInDuration: 300,
  retryAttempts: 2,
  retryDelay: 1e3,
  maxConcurrent: 4,
  enableWebP: true,
  enableAvif: false,
  cacheDuration: 36e5
});
var constants_default = {
  VERSION,
  MODULE_ID,
  LOAD_STRATEGIES,
  IMAGE_STATES,
  IMAGE_QUALITY,
  DEFAULT_CONFIG
};
export {
  DEFAULT_CONFIG,
  IMAGE_QUALITY,
  IMAGE_STATES,
  LOAD_STRATEGIES,
  MODULE_ID,
  VERSION,
  constants_default as default
};
