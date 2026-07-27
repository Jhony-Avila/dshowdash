const MODULE_ID = "main-kernel-console";
const VERSION = "1.0.0-ENTERPRISE";
let _kernel = null;
function registerCommands(kernel) {
  if (typeof window === "undefined") return;
  _kernel = kernel;
  window.mk = {
    // Status
    status: () => {
      const info2 = _kernel.info();
      const health = _kernel.healthCheck();
      console.log("%c MainKernel Status", "font-weight: bold; color: #4CAF50;");
      console.log(`Version: ${info2.data.version}`);
      console.log(`Status: ${info2.data.status}`);
      console.log(`Health: ${health.status} (${health.score.percentage}%)`);
      console.log(`Features: ${info2.data.featuresCount}`);
      console.log(`Uptime: ${Math.round(info2.data.uptime / 1e3)}s`);
      return health;
    },
    // Listar features
    list: () => {
      const result = _kernel.listFeatures();
      console.log("%c Features", "font-weight: bold; color: #2196F3;");
      console.table(result.data.features);
      return result.data.features;
    },
    // Listar por status
    listByStatus: (status) => {
      const result = _kernel.getFeaturesByStatus(status);
      console.log(`%c Features [${status}]`, "font-weight: bold; color: #FF9800;");
      console.table(result.data.features);
      return result.data.features;
    },
    // Habilitar feature
    enable: (id) => {
      console.log(`Enabling feature: ${id}...`);
      const result = _kernel.enableFeature(id);
      if (result.ok) {
        console.log(`%c \u2713 Feature ${id} enabled`, "color: #4CAF50;");
      } else {
        console.log(`%c \u2717 Failed: ${result.errors[0]?.message}`, "color: #f44336;");
      }
      return result;
    },
    // Desabilitar feature
    disable: (id, reason) => {
      console.log(`Disabling feature: ${id}...`);
      const result = _kernel.disableFeature(id, reason || "console");
      if (result.ok) {
        console.log(`%c \u2713 Feature ${id} disabled`, "color: #FF9800;");
      } else {
        console.log(`%c \u2717 Failed: ${result.errors[0]?.message}`, "color: #f44336;");
      }
      return result;
    },
    // Health check
    health: () => {
      const health = _kernel.healthCheck();
      console.log("%c Health Check", "font-weight: bold; color: #9C27B0;");
      console.log(`Status: ${health.status}`);
      console.log(`Score: ${health.score.passed}/${health.score.total} (${health.score.percentage}%)`);
      console.log("Features:");
      Object.entries(health.features).forEach(([id, h]) => {
        const icon = h.status === "HEALTHY" ? "\u2713" : h.status === "DEGRADED" ? "\u26A0" : "\u2717";
        const color = h.status === "HEALTHY" ? "#4CAF50" : h.status === "DEGRADED" ? "#FF9800" : "#f44336";
        console.log(`  %c${icon} ${id}: ${h.status}`, `color: ${color};`);
      });
      return health;
    },
    // Métricas
    metrics: () => {
      const result = _kernel.getFeatureMetrics();
      console.log("%c Metrics", "font-weight: bold; color: #00BCD4;");
      console.log("Kernel:", result.data.kernel);
      console.log("Totals:", result.data.totals);
      console.log("Features:", result.data.features);
      return result.data;
    },
    // Exportar diagnóstico
    export: () => {
      const diag = _kernel.exportDiagnostics();
      console.log("%c Diagnostics Exported", "font-weight: bold; color: #607D8B;");
      console.log("Copy the object below:");
      console.log(JSON.stringify(diag, null, 2));
      return diag;
    },
    // Ajuda
    help: () => {
      console.log("%c MainKernel Console Commands", "font-weight: bold; font-size: 14px; color: #673AB7;");
      console.log("");
      console.log("  mk.status()           - Show kernel status");
      console.log("  mk.list()             - List all features");
      console.log("  mk.listByStatus(s)    - List features by status");
      console.log("  mk.enable(id)         - Enable a feature");
      console.log("  mk.disable(id)        - Disable a feature");
      console.log("  mk.health()           - Run health check");
      console.log("  mk.metrics()          - Show metrics");
      console.log("  mk.export()           - Export diagnostics JSON");
      console.log("  mk.help()             - Show this help");
      console.log("");
      console.log("Status values: registered, enabled, disabled, degraded, error");
    }
  };
  console.log("%c MainKernel Console Ready - Type mk.help() for commands", "color: #673AB7;");
}
function unregisterCommands() {
  if (typeof window !== "undefined" && window.mk) {
    delete window.mk;
  }
  _kernel = null;
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, registered: !!_kernel };
}
var console_commands_default = {
  MODULE_ID,
  VERSION,
  registerCommands,
  unregisterCommands,
  info
};
export {
  MODULE_ID,
  VERSION,
  console_commands_default as default,
  info,
  registerCommands,
  unregisterCommands
};
