const VERSION = "1.0.0-AAA";
const MODULE_ID = "app-shell-animation-api";
const ANIMATIONS = Object.freeze({
  FADE_IN: "fade-in",
  FADE_OUT: "fade-out",
  SLIDE_IN_LEFT: "slide-in-left",
  SLIDE_IN_RIGHT: "slide-in-right",
  SLIDE_IN_UP: "slide-in-up",
  SLIDE_IN_DOWN: "slide-in-down",
  SLIDE_OUT_LEFT: "slide-out-left",
  SLIDE_OUT_RIGHT: "slide-out-right",
  SCALE_IN: "scale-in",
  SCALE_OUT: "scale-out",
  BOUNCE: "bounce",
  SHAKE: "shake",
  PULSE: "pulse",
  SPIN: "spin"
});
const EASINGS = Object.freeze({
  LINEAR: "linear",
  EASE: "ease",
  EASE_IN: "ease-in",
  EASE_OUT: "ease-out",
  EASE_IN_OUT: "ease-in-out",
  EASE_IN_CUBIC: "cubic-bezier(0.55, 0.055, 0.675, 0.19)",
  EASE_OUT_CUBIC: "cubic-bezier(0.215, 0.61, 0.355, 1)",
  EASE_IN_OUT_CUBIC: "cubic-bezier(0.645, 0.045, 0.355, 1)",
  EASE_IN_BACK: "cubic-bezier(0.6, -0.28, 0.735, 0.045)",
  EASE_OUT_BACK: "cubic-bezier(0.175, 0.885, 0.32, 1.275)",
  SPRING: "cubic-bezier(0.68, -0.55, 0.265, 1.55)"
});
export {
  ANIMATIONS,
  EASINGS,
  MODULE_ID,
  VERSION
};
