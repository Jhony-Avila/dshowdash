const VERSION = "1.3.0-P2-ENTERPRISE";
const MODULE_ID = "components.accordion.module.constants";
const STYLE_PATHS = Object.freeze({
  TOKENS: "/components/accordion/styles/accordion.tokens.css",
  MAIN: "/components/accordion/styles/accordion.css"
});
function healthCheck() {
  const checks = {
    versionDefined: !!VERSION,
    moduleIdDefined: !!MODULE_ID,
    stylePathsDefined: !!STYLE_PATHS
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return {
    status: passed === total ? "HEALTHY" : "DEGRADED",
    score: passed,
    maxScore: total,
    scoreDisplay: `${passed}/${total}`,
    checks,
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    stylePaths: STYLE_PATHS,
    healthCheck: healthCheck(),
    timestamp: Date.now()
  };
}
var constants_default = { VERSION, MODULE_ID, STYLE_PATHS, healthCheck, info };
export {
  MODULE_ID,
  STYLE_PATHS,
  VERSION,
  constants_default as default,
  healthCheck,
  info
};
