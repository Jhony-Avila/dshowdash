// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: main-kernel-console
// PURPOSE: MainKernel Console Commands
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   registerCommands() — exported function
//   unregisterCommands() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (window as any).mk
// ═══════════════════════════════════════════════════════════════
'use strict';

export const MODULE_ID = 'main-kernel-console';
export const VERSION = '1.0.0-ENTERPRISE';

interface KernelConsoleApi {
  info(): { ok: boolean; data: { version: string; status: string; featuresCount: number; uptime: number; [key: string]: unknown }; [key: string]: unknown };
  healthCheck(): { status: string; score: { passed: number; total: number; percentage: number }; features: Record<string, { status: string; [key: string]: unknown }>; [key: string]: unknown };
  listFeatures(): { ok: boolean; data: { features: Array<{ id: string; version: string; status: string; [key: string]: unknown }>; [key: string]: unknown }; [key: string]: unknown };
  getFeaturesByStatus(status: string): { ok: boolean; data: { features: Array<Record<string, unknown>>; [key: string]: unknown }; [key: string]: unknown };
  enableFeature(id: string): { ok: boolean; errors?: Array<{ message: string; [key: string]: unknown }>; [key: string]: unknown };
  disableFeature(id: string, reason: string): { ok: boolean; errors?: Array<{ message: string; [key: string]: unknown }>; [key: string]: unknown };
  getFeatureMetrics(): { ok: boolean; data: { kernel: Record<string, unknown>; totals: Record<string, unknown>; features: Record<string, unknown>; [key: string]: unknown }; [key: string]: unknown };
  exportDiagnostics(): Record<string, unknown>;
  [key: string]: unknown;
}

let _kernel: KernelConsoleApi | null = null;

/**
 * Registra comandos no objeto window para acesso via console
 */
export function registerCommands(kernel: KernelConsoleApi) {
  if (typeof window === 'undefined') return;
  
  _kernel = kernel;
  
  // Namespace principal
  (window as any).mk = {
    // Status
    status: () => {
      const info = _kernel!.info();
      const health = _kernel!.healthCheck();
      console.log('%c MainKernel Status', 'font-weight: bold; color: #4CAF50;');
      console.log(`Version: ${info.data.version}`);
      console.log(`Status: ${info.data.status}`);
      console.log(`Health: ${health.status} (${health.score.percentage}%)`);
      console.log(`Features: ${info.data.featuresCount}`);
      console.log(`Uptime: ${Math.round(info.data.uptime / 1000)}s`);
      return health;
    },
    
    // Listar features
    list: () => {
      const result = _kernel!.listFeatures();
      console.log('%c Features', 'font-weight: bold; color: #2196F3;');
      console.table(result.data.features);
      return result.data.features;
    },
    
    // Listar por status
    listByStatus: (status: string) => {
      const result = _kernel!.getFeaturesByStatus(status);
      console.log(`%c Features [${status}]`, 'font-weight: bold; color: #FF9800;');
      console.table(result.data.features);
      return result.data.features;
    },
    
    // Habilitar feature
    enable: (id: string) => {
      console.log(`Enabling feature: ${id}...`);
      const result = _kernel!.enableFeature(id);
      if (result.ok) {
        console.log(`%c ✓ Feature ${id} enabled`, 'color: #4CAF50;');
      } else {
        // @ts-expect-error strict migration — TS18048
        console.log(`%c ✗ Failed: ${result.errors[0]?.message}`, 'color: #f44336;');
      }
      return result;
    },
    
    // Desabilitar feature
    disable: (id: string, reason?: string) => {
      console.log(`Disabling feature: ${id}...`);
      const result = _kernel!.disableFeature(id, reason || 'console');
      if (result.ok) {
        console.log(`%c ✓ Feature ${id} disabled`, 'color: #FF9800;');
      } else {
        // @ts-expect-error strict migration — TS18048
        console.log(`%c ✗ Failed: ${result.errors[0]?.message}`, 'color: #f44336;');
      }
      return result;
    },
    
    // Health check
    health: () => {
      const health = _kernel!.healthCheck();
      console.log('%c Health Check', 'font-weight: bold; color: #9C27B0;');
      console.log(`Status: ${health.status}`);
      console.log(`Score: ${health.score.passed}/${health.score.total} (${health.score.percentage}%)`);
      console.log('Features:');
      Object.entries(health.features).forEach(([id, h]: [string, { status: string; [key: string]: unknown }]) => {
        const icon = h.status === 'HEALTHY' ? '✓' : h.status === 'DEGRADED' ? '⚠' : '✗';
        const color = h.status === 'HEALTHY' ? '#4CAF50' : h.status === 'DEGRADED' ? '#FF9800' : '#f44336';
        console.log(`  %c${icon} ${id}: ${h.status}`, `color: ${color};`);
      });
      return health;
    },
    
    // Métricas
    metrics: () => {
      const result = _kernel!.getFeatureMetrics();
      console.log('%c Metrics', 'font-weight: bold; color: #00BCD4;');
      console.log('Kernel:', result.data.kernel);
      console.log('Totals:', result.data.totals);
      console.log('Features:', result.data.features);
      return result.data;
    },
    
    // Exportar diagnóstico
    export: () => {
      const diag = _kernel!.exportDiagnostics();
      console.log('%c Diagnostics Exported', 'font-weight: bold; color: #607D8B;');
      console.log('Copy the object below:');
      console.log(JSON.stringify(diag, null, 2));
      return diag;
    },
    
    // Ajuda
    help: () => {
      console.log('%c MainKernel Console Commands', 'font-weight: bold; font-size: 14px; color: #673AB7;');
      console.log('');
      console.log('  mk.status()           - Show kernel status');
      console.log('  mk.list()             - List all features');
      console.log('  mk.listByStatus(s)    - List features by status');
      console.log('  mk.enable(id)         - Enable a feature');
      console.log('  mk.disable(id)        - Disable a feature');
      console.log('  mk.health()           - Run health check');
      console.log('  mk.metrics()          - Show metrics');
      console.log('  mk.export()           - Export diagnostics JSON');
      console.log('  mk.help()             - Show this help');
      console.log('');
      console.log('Status values: registered, enabled, disabled, degraded, error');
    }
  };
  
  console.log('%c MainKernel Console Ready - Type mk.help() for commands', 'color: #673AB7;');
}

/**
 * Remove comandos do window
 */
export function unregisterCommands() {
  if (typeof window !== 'undefined' && (window as any).mk) {
    delete (window as any).mk;
  }
  _kernel = null;
}

export function info() {
  return { moduleId: MODULE_ID, version: VERSION, registered: !!_kernel };
}

export default {
  MODULE_ID,
  VERSION,
  registerCommands,
  unregisterCommands,
  info
};
