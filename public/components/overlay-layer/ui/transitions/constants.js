const VERSION = "1.0.0";
const MODULE_ID = "overlay-layer-transitions";
const DEFAULT_CONFIG = {
  enabled: true,
  defaultTransition: "fade",
  defaultDuration: 300,
  useReducedMotion: true,
  cssPrefix: "overlay-transition"
};
const BUILTIN_TRANSITIONS = {
  "none": {
    enter: null,
    exit: null,
    duration: 0,
    easing: "linear"
  },
  "fade": {
    enter: {
      from: { opacity: "0" },
      to: { opacity: "1" }
    },
    exit: {
      from: { opacity: "1" },
      to: { opacity: "0" }
    },
    duration: 300,
    easing: "ease-out"
  },
  "scale": {
    enter: {
      from: { opacity: "0", transform: "scale(0.9)" },
      to: { opacity: "1", transform: "scale(1)" }
    },
    exit: {
      from: { opacity: "1", transform: "scale(1)" },
      to: { opacity: "0", transform: "scale(0.9)" }
    },
    duration: 250,
    easing: "ease-out"
  },
  "scale-up": {
    enter: {
      from: { opacity: "0", transform: "scale(0.8)" },
      to: { opacity: "1", transform: "scale(1)" }
    },
    exit: {
      from: { opacity: "1", transform: "scale(1)" },
      to: { opacity: "0", transform: "scale(1.1)" }
    },
    duration: 300,
    easing: "cubic-bezier(0.34, 1.56, 0.64, 1)"
  },
  "slide-up": {
    enter: {
      from: { opacity: "0", transform: "translateY(20px)" },
      to: { opacity: "1", transform: "translateY(0)" }
    },
    exit: {
      from: { opacity: "1", transform: "translateY(0)" },
      to: { opacity: "0", transform: "translateY(20px)" }
    },
    duration: 300,
    easing: "ease-out"
  },
  "slide-down": {
    enter: {
      from: { opacity: "0", transform: "translateY(-20px)" },
      to: { opacity: "1", transform: "translateY(0)" }
    },
    exit: {
      from: { opacity: "1", transform: "translateY(0)" },
      to: { opacity: "0", transform: "translateY(-20px)" }
    },
    duration: 300,
    easing: "ease-out"
  },
  "slide-left": {
    enter: {
      from: { opacity: "0", transform: "translateX(100%)" },
      to: { opacity: "1", transform: "translateX(0)" }
    },
    exit: {
      from: { opacity: "1", transform: "translateX(0)" },
      to: { opacity: "0", transform: "translateX(100%)" }
    },
    duration: 350,
    easing: "ease-out"
  },
  "slide-right": {
    enter: {
      from: { opacity: "0", transform: "translateX(-100%)" },
      to: { opacity: "1", transform: "translateX(0)" }
    },
    exit: {
      from: { opacity: "1", transform: "translateX(0)" },
      to: { opacity: "0", transform: "translateX(-100%)" }
    },
    duration: 350,
    easing: "ease-out"
  },
  "zoom": {
    enter: {
      from: { opacity: "0", transform: "scale(0.5)" },
      to: { opacity: "1", transform: "scale(1)" }
    },
    exit: {
      from: { opacity: "1", transform: "scale(1)" },
      to: { opacity: "0", transform: "scale(0.5)" }
    },
    duration: 300,
    easing: "cubic-bezier(0.175, 0.885, 0.32, 1.275)"
  },
  "flip": {
    enter: {
      from: { opacity: "0", transform: "perspective(400px) rotateX(-90deg)" },
      to: { opacity: "1", transform: "perspective(400px) rotateX(0)" }
    },
    exit: {
      from: { opacity: "1", transform: "perspective(400px) rotateX(0)" },
      to: { opacity: "0", transform: "perspective(400px) rotateX(90deg)" }
    },
    duration: 400,
    easing: "ease-in-out"
  },
  "bounce": {
    enter: {
      from: { opacity: "0", transform: "scale(0.3)" },
      to: { opacity: "1", transform: "scale(1)" }
    },
    exit: {
      from: { opacity: "1", transform: "scale(1)" },
      to: { opacity: "0", transform: "scale(0.3)" }
    },
    duration: 400,
    easing: "cubic-bezier(0.68, -0.55, 0.265, 1.55)"
  }
};
export {
  BUILTIN_TRANSITIONS,
  DEFAULT_CONFIG,
  MODULE_ID,
  VERSION
};
