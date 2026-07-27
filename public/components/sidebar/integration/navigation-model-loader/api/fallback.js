import { track } from "../telemetry/tracker.js";
const VERSION = "7.4.0-P2-ENTERPRISE";
const MODULE_ID = "sidebar.integration.navigation-model-loader.api.fallback";
const FALLBACK_MODEL = {
  version: "fallback-1.0",
  generated: null,
  sections: [
    {
      id: "main",
      label: "Principal",
      icon: "home",
      items: [
        {
          id: "dashboard",
          label: "Dashboard",
          icon: "dashboard",
          path: "/dashboard",
          permission: null
        }
      ]
    },
    {
      id: "admin",
      label: "Administra\xE7\xE3o",
      icon: "settings",
      items: [
        {
          id: "settings",
          label: "Configura\xE7\xF5es",
          icon: "settings",
          path: "/settings",
          permission: "admin"
        }
      ]
    }
  ],
  metadata: {
    isFallback: true,
    reason: "api-unavailable"
  }
};
const getFallbackModel = (reason = "unknown") => {
  track("fallback:used", { reason });
  return {
    ...FALLBACK_MODEL,
    generated: Date.now(),
    metadata: {
      ...FALLBACK_MODEL.metadata,
      reason,
      generatedAt: (/* @__PURE__ */ new Date()).toISOString()
    }
  };
};
const isFallbackModel = (model) => model?.metadata?.isFallback === true;
export {
  FALLBACK_MODEL,
  MODULE_ID,
  VERSION,
  getFallbackModel,
  isFallbackModel
};
