// ═══════════════════════════════════════════════════════════════
// Vite Bundle Config — Lote 3B+C (Core / Assets / Modules)
// ═══════════════════════════════════════════════════════════════
// Bundla um target por vez. Target definido via env var TARGET.
//
// Uso: TARGET=core-runtime npx vite build --config ../vite.lote3bc.config.js
//
// Targets:
//   core-runtime, core-kernel, event-bus, asset-loader, core-auth,
//   logger-global, telemetry-core, config-loader, environment-manager,
//   global-state
//
// NOTA: Todos os entries usam _entry.ts (não index.ts) porque os
// index.ts em produção são re-exports para o bundle. Compilar
// index.ts causaria loop circular.
// ═══════════════════════════════════════════════════════════════

var ROOT = process.env.LOTE3BC_ROOT || '/var/www/dshowdash/public';

var TARGET = process.env.TARGET;
var OUTDIR_OVERRIDE = process.env.LOTE3BC_OUTDIR || null; // ensaio: saída fora de produção
if (!TARGET) {
  throw new Error('TARGET env var obrigatória. Uso: TARGET=core-runtime npx vite build --config ...');
}

var TARGETS = {
  // ═══ Sub-lote B — Core ═══
  'core-runtime': {
    entry: 'core/runtime/_entry.ts',
    outDir: 'core/runtime/dist',
    fileName: 'runtime.bundle.js',
    internalPrefix: '/core/runtime/'
  },
  'core-kernel': {
    entry: 'core/kernel/_entry.ts',
    outDir: 'core/kernel/dist',
    fileName: 'kernel.bundle.js',
    internalPrefix: '/core/kernel/'
  },
  'event-bus': {
    entry: 'core/js/event-bus/_entry.ts',
    outDir: 'core/js/event-bus/dist',
    fileName: 'event-bus.bundle.js',
    internalPrefix: '/core/js/event-bus/'
  },
  'asset-loader': {
    entry: 'core/js/asset-loader/_entry.ts',
    outDir: 'core/js/asset-loader/dist',
    fileName: 'asset-loader.bundle.js',
    internalPrefix: '/core/js/asset-loader/'
  },
  'core-auth': {
    entry: 'core/auth/_entry.ts',
    outDir: 'core/auth/dist',
    fileName: 'auth.bundle.js',
    internalPrefix: '/core/auth/'
  },
  // ═══ Sub-lote C — Assets + Modules ═══
  'logger-global': {
    entry: 'assets/js/core/logger-global/_entry.ts',
    outDir: 'assets/js/core/logger-global/dist',
    fileName: 'logger-global.bundle.js',
    internalPrefix: '/assets/js/core/logger-global/',
    keepExternal: [
      '/assets/js/core/telemetry-core/'
    ]
  },
  'telemetry-core': {
    entry: 'assets/js/core/telemetry-core/_entry.ts',
    outDir: 'assets/js/core/telemetry-core/dist',
    fileName: 'telemetry-core.bundle.js',
    internalPrefix: '/assets/js/core/telemetry-core/'
  },
  'config-loader': {
    entry: 'assets/js/core/config-loader/_entry.ts',
    outDir: 'assets/js/core/config-loader/dist',
    fileName: 'config-loader.bundle.js',
    internalPrefix: '/assets/js/core/config-loader/',
    keepExternal: [
      '/assets/js/core/telemetry-core/',
      '/assets/js/core/api-client/'
    ]
  },
  'environment-manager': {
    entry: 'assets/js/core/environment-manager/_entry.ts',
    outDir: 'assets/js/core/environment-manager/dist',
    fileName: 'environment-manager.bundle.js',
    internalPrefix: '/assets/js/core/environment-manager/'
  },
  'global-state': {
    entry: 'modules/global-state/_entry.ts',
    outDir: 'modules/global-state/dist',
    fileName: 'global-state.bundle.js',
    internalPrefix: '/modules/global-state/'
  },
  // ═══ Lote 4 ═══
  'kernel-ui': {
    // 2026-07-30: era 'index.ts', que faz `export * from './dist/...bundle.js'`
    // — o build se alimentava do próprio artefato e descartava as fontes.
    // `_entry.ts` reexporta `kernel-governance-panel.js` (a fachada real).
    // Ver detect-circular-build.sh e /claude/docs/BUILD-CIRCULAR-MAPA-2026-07-30.md
    entry: 'core/kernel/ui/_entry.ts',
    outDir: 'core/kernel/ui/dist',
    fileName: 'kernel-ui.bundle.js',
    internalPrefix: '/core/kernel/ui/'
  },
  'enterprise-loader': {
    entry: 'core/js/enterprise-loader/index.ts',
    outDir: 'core/js/enterprise-loader/dist',
    fileName: 'enterprise-loader.bundle.js',
    internalPrefix: '/core/js/enterprise-loader/'
  },
  // ═══ Lote 5 — Frente C ═══
  'api-client': {
    entry: 'assets/js/core/api-client/index.ts',
    outDir: 'assets/js/core/api-client/dist',
    fileName: 'api-client.bundle.js',
    internalPrefix: '/assets/js/core/api-client/'
  },
  'theme-manager': {
    // 2026-07-30: era 'index.ts', que reexportava o proprio dist.
    // `_entry.ts` -> `_aggregator.ts`, fachada reconstruida lendo o bundle.
    entry: 'assets/js/core/theme-manager/_entry.ts',
    outDir: 'assets/js/core/theme-manager/dist',
    fileName: 'theme-manager.bundle.js',
    internalPrefix: '/assets/js/core/theme-manager/'
  },
  'theme-tokens-loader': {
    // 2026-07-30: era 'index.ts', que reexportava o proprio dist — o build
    // se alimentava do artefato e descartava as fontes. `_entry.ts` aponta
    // para `_aggregator.ts`, a fachada reconstruida lendo o bundle.
    entry: 'assets/js/core/theme-tokens-loader/_entry.ts',
    outDir: 'assets/js/core/theme-tokens-loader/dist',
    fileName: 'theme-tokens-loader.bundle.js',
    internalPrefix: '/assets/js/core/theme-tokens-loader/'
  },
  // ═══ Lote 5 — Frente A: Header Components Mega-Bundle ═══
  'header-components': {
    entry: 'components/header/components/_entry.ts',
    outDir: 'components/header/components/dist',
    fileName: 'header-components.bundle.js',
    internalPrefix: '/components/header/components/'
  },
  // ═══ Lote 8 — Router ═══
  'app-router': {
    entry: 'app/router/_entry.ts',
    outDir: 'app/router/dist',
    fileName: 'app-router.bundle.js',
    internalPrefix: ['/app/router/', '/components/router/']
  },
  // ═══ Lote 9 ═══
  'ui-orchestrator': {
    // 2026-07-30: era 'index.ts', que reexportava o proprio dist.
    // A fachada ja existe em fonte (`core/resolver.ts`, com default congelado
    // de 22 campos identico ao do bundle) — `_entry.ts` aponta para ela.
    entry: 'core/ui-orchestrator/_entry.ts',
    outDir: 'core/ui-orchestrator/dist',
    fileName: 'ui-orchestrator.bundle.js',
    internalPrefix: '/core/ui-orchestrator/'
  },
  'platform-runtime': {
    // 2026-07-30: era 'index.ts', que reexportava o proprio dist.
    // `_entry.ts` -> `_aggregator.ts`, fachada reconstruida lendo o bundle.
    entry: 'platform/runtime/_entry.ts',
    outDir: 'platform/runtime/dist',
    fileName: 'platform-runtime.bundle.js',
    internalPrefix: '/platform/runtime/'
  },
  'platform-shell': {
    // 2026-07-30: era 'index.ts', que reexportava o proprio dist — o build se
    // alimentava do artefato e descartava as fontes. `_entry.ts` aponta para
    // `_aggregator.ts`, a fachada reconstruida a partir dos 4 sub-shells reais.
    // Ver /claude/docs/BUILD-CIRCULAR-MAPA-2026-07-30.md
    entry: 'platform/shell/_entry.ts',
    outDir: 'platform/shell/dist',
    fileName: 'platform-shell.bundle.js',
    internalPrefix: '/platform/shell/',
    keepExternal: ['/platform/shell/layout-regions.ts']
  },
  // ═══ Lote 11 — Events Catalog ═══
  'events-catalog': {
    entry: 'core/runtime/events/catalog/_entry.ts',
    outDir: 'core/runtime/events/catalog/dist',
    fileName: 'events-catalog.bundle.js',
    internalPrefix: '/core/runtime/events/catalog/'
  }
};

var tgt = TARGETS[TARGET];
if (!tgt) {
  throw new Error('Target desconhecido: ' + TARGET + '. Válidos: ' + Object.keys(TARGETS).join(', '));
}

// Prefixos de diretórios externos.
var EXTERNAL_PREFIXES = [
  '/core/',
  '/components/',
  '/assets/',
  '/boot/',
  '/platform/',
  '/app/',
  '/modules/',
  '/bootstrap-v2/'
];

// Verifica se um module ID é externo.
function isExternal(id) {
  var browserId = id;
  if (id.startsWith(ROOT + '/')) {
    browserId = id.slice(ROOT.length);
  }

  if (tgt.keepExternal) {
    for (var j = 0; j < tgt.keepExternal.length; j++) {
      var kePath = tgt.keepExternal[j];
      if (browserId === kePath || browserId.startsWith(kePath)) return true;
    }
  }

  var prefix = tgt.internalPrefix;
  if (Array.isArray(prefix)) {
    for (var k = 0; k < prefix.length; k++) {
      if (browserId.startsWith(prefix[k])) return false;
    }
  } else if (browserId.startsWith(prefix)) {
    return false;
  }

  for (var i = 0; i < EXTERNAL_PREFIXES.length; i++) {
    if (browserId.startsWith(EXTERNAL_PREFIXES[i])) return true;
  }
  return false;
}

// Converte paths filesystem → browser absoluto.
function toBrowserPath(id) {
  if (id.startsWith(ROOT + '/')) {
    return id.slice(ROOT.length);
  }
  return id;
}

// Plugin Rollup: corrige paths relativos no output final.
// O Rollup emite paths como './assets/js/core/...' para externals
// resolvidos relativamente ao outDir. O paths() callback não cobre
// dynamic imports com inlineDynamicImports:true.
// renderChunk faz post-processing no chunk renderizado.
function fixExternalPathsPlugin() {
  function fixCode(code) {
    var result = code;
    for (var i = 0; i < EXTERNAL_PREFIXES.length; i++) {
      var pfx = EXTERNAL_PREFIXES[i].slice(1);
      var escapedPfx = pfx.replace(/\//g, '\\/');
      // \s* (espaco OPCIONAL) cobre minificado (from"./) e nao-minificado (from "./)
      result = result.replace(
        new RegExp('from(\\s*)"\\.\\/(' + escapedPfx + ')', 'g'),
        'from$1"/$2'
      );
      result = result.replace(
        new RegExp('import\\((\\s*)"\\.\\/(' + escapedPfx + ')', 'g'),
        'import($1"/$2'
      );
      result = result.replace(
        new RegExp('import(\\s+)"\\.\\/(' + escapedPfx + ')', 'g'),
        'import$1"/$2'
      );
    }
    return result;
  }
  return {
    name: 'fix-external-paths',
    // BUGFIX 2026-06-05: renderChunk roda ANTES de o Rollup relativizar
    // externals estaticos vindos de import RELATIVO (ex header-components ->
    // ../core/navigation-adapter). generateBundle roda DEPOIS de todos os
    // renderChunk (incl. minify) -> garante a reescrita no codigo FINAL.
    renderChunk: function(code) { return fixCode(code); },
    generateBundle: function(_options, bundle) {
      for (var f in bundle) {
        var ch = bundle[f];
        if (ch && ch.type === 'chunk' && typeof ch.code === 'string') {
          ch.code = fixCode(ch.code);
        }
      }
    }
  };
}

export default {
  root: ROOT,
  build: {
    lib: {
      entry: tgt.entry,
      formats: ['es'],
      fileName: function() { return tgt.fileName; }
    },
    outDir: OUTDIR_OVERRIDE || tgt.outDir,
    emptyOutDir: true,
    minify: 'esbuild',
    sourcemap: false,
    rollupOptions: {
      external: isExternal,
      plugins: [fixExternalPathsPlugin()],
      output: {
        inlineDynamicImports: true,
        paths: toBrowserPath
      }
    }
  }
};
