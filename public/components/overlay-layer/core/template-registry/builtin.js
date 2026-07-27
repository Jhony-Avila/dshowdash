const VERSION = "4.0.0-P4-ENTERPRISE";
const MODULE_ID = "overlay-layer.core.template-registry.builtin";
const BUILTIN_TEMPLATES = {
  "confirm": {
    type: "dialog",
    scope: "global",
    config: {
      blocking: true,
      closable: true,
      backdrop: true,
      backdropClose: false,
      escapeClose: true,
      priority: 80,
      transition: "scale"
    },
    meta: { template: "confirm", builtin: true }
  },
  "alert": {
    type: "dialog",
    scope: "global",
    config: {
      blocking: true,
      closable: true,
      backdrop: true,
      backdropClose: false,
      escapeClose: true,
      priority: 85,
      transition: "scale"
    },
    meta: { template: "alert", builtin: true }
  },
  "toast-success": {
    type: "toast",
    scope: "global",
    config: {
      blocking: false,
      closable: true,
      backdrop: false,
      timeout: 5e3,
      priority: 30,
      transition: "slide-up"
    },
    meta: { template: "toast-success", variant: "success", builtin: true }
  },
  "toast-error": {
    type: "toast",
    scope: "global",
    config: {
      blocking: false,
      closable: true,
      backdrop: false,
      timeout: 8e3,
      priority: 35,
      transition: "slide-up"
    },
    meta: { template: "toast-error", variant: "error", builtin: true }
  },
  "toast-warning": {
    type: "toast",
    scope: "global",
    config: {
      blocking: false,
      closable: true,
      backdrop: false,
      timeout: 6e3,
      priority: 32,
      transition: "slide-up"
    },
    meta: { template: "toast-warning", variant: "warning", builtin: true }
  },
  "toast-info": {
    type: "toast",
    scope: "global",
    config: {
      blocking: false,
      closable: true,
      backdrop: false,
      timeout: 5e3,
      priority: 30,
      transition: "slide-up"
    },
    meta: { template: "toast-info", variant: "info", builtin: true }
  },
  "loading": {
    type: "loading",
    scope: "global",
    config: {
      blocking: true,
      closable: false,
      backdrop: true,
      backdropClose: false,
      escapeClose: false,
      priority: 70,
      transition: "fade"
    },
    meta: { template: "loading", builtin: true }
  },
  "modal": {
    type: "modal",
    scope: "global",
    config: {
      blocking: true,
      closable: true,
      backdrop: true,
      backdropClose: true,
      escapeClose: true,
      priority: 60,
      transition: "fade"
    },
    meta: { template: "modal", builtin: true }
  },
  "drawer-left": {
    type: "drawer",
    scope: "global",
    config: {
      blocking: false,
      closable: true,
      backdrop: true,
      backdropClose: true,
      escapeClose: true,
      priority: 50,
      transition: "slide-right"
    },
    meta: { template: "drawer-left", position: "left", builtin: true }
  },
  "drawer-right": {
    type: "drawer",
    scope: "global",
    config: {
      blocking: false,
      closable: true,
      backdrop: true,
      backdropClose: true,
      escapeClose: true,
      priority: 50,
      transition: "slide-left"
    },
    meta: { template: "drawer-right", position: "right", builtin: true }
  },
  "sheet-bottom": {
    type: "sheet",
    scope: "global",
    config: {
      blocking: false,
      closable: true,
      backdrop: true,
      backdropClose: true,
      escapeClose: true,
      priority: 45,
      transition: "slide-up"
    },
    meta: { template: "sheet-bottom", position: "bottom", builtin: true }
  }
};
export {
  BUILTIN_TEMPLATES,
  MODULE_ID,
  VERSION
};
