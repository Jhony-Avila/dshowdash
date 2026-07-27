import { CATEGORIES } from "../categories.js";
const MODULE_ID = "sidebar-contracts-visual";
const VERSION = "1.3.0-ES6";
const VISUAL_CONTRACTS = {
  effects: {
    module: "parallax",
    version: "5.0.0",
    category: CATEGORIES.VISUAL,
    methods: {
      parallax: { original: "enable", args: ["container?"], returns: "void", requiresEl: true },
      disableParallax: { original: "disable", args: [], returns: "void" }
    },
    legacyMethods: {
      enableParallax: "parallax",
      disableParallax: "disableParallax"
    }
  },
  transitions: {
    module: "animated-transitions",
    version: "5.0.0",
    category: CATEGORIES.VISUAL,
    methods: {
      animate: { original: "animateElement", args: ["element", "direction", "type?"], returns: "void" },
      expand: { original: "animateSectionExpand", args: ["sectionEl"], returns: "void" },
      collapse: { original: "animateSectionCollapse", args: ["sectionEl"], returns: "void" },
      enable: { original: "enable", args: [], returns: "void" },
      disable: { original: "disable", args: [], returns: "void" }
    },
    legacyMethods: {
      animateElement: "animate",
      animateSectionExpand: "expand",
      animateSectionCollapse: "collapse",
      enableAnimations: "enable",
      disableAnimations: "disable"
    }
  }
};
var visual_default = VISUAL_CONTRACTS;
export {
  MODULE_ID,
  VERSION,
  VISUAL_CONTRACTS,
  visual_default as default
};
