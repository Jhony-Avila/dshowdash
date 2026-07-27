// ═══════════════════════════════════════════════════════════════
// Vite Bundle Config — Componentes (Paramétrico)
// ═══════════════════════════════════════════════════════════════
// Bundla um componente por vez. Componente definido via env var COMPONENT.
//
// Uso: COMPONENT=preloader npx vite build --config ../components/vite.components.config.js
//
// Lote 1: preloader, session-manager, error-boundary
// Lote 2: context-provider, security, toast, _shared-integration, _shared-ui-feedback
// Lote 3A: feature-flags, login-modal
// Lote 4: app-shell, layout-manager
// Lote 6: sidebar
// Lote 7: nav-rail, footer
// Lote 9: main, overlay-layer
// Lote 10: panel-home, ticker
//
// External: /core/*, /components/* (exceto o componente sendo bundlado), /assets/*, /boot/*, /platform/*, /app/*, /modules/*
// ═══════════════════════════════════════════════════════════════

var ROOT = '/var/www/dshowdash/public';

var COMPONENT = process.env.COMPONENT;
if (!COMPONENT) {
  throw new Error('COMPONENT env var obrigatória. Uso: COMPONENT=preloader npx vite build --config ...');
}

var COMPONENTS = {
  // ═══ Lote 1 ═══
  'preloader': {
    entry: 'components/preloader/index.ts',
    outDir: 'components/preloader/dist',
    fileName: 'preloader.bundle.js'
  },
  'session-manager': {
    entry: 'components/session-manager/index.ts',
    outDir: 'components/session-manager/dist',
    fileName: 'session-manager.bundle.js'
  },
  'error-boundary': {
    entry: 'components/error-boundary/index.ts',
    outDir: 'components/error-boundary/dist',
    fileName: 'error-boundary.bundle.js'
  },
  // ═══ Lote 2 ═══
  'context-provider': {
    entry: 'components/context-provider/index.ts',
    outDir: 'components/context-provider/dist',
    fileName: 'context-provider.bundle.js'
  },
  'security': {
    entry: 'components/security/csrf-token-manager/index.ts',
    outDir: 'components/security/csrf-token-manager/dist',
    fileName: 'csrf-token-manager.bundle.js',
    internalDir: 'security'
  },
  'toast': {
    entry: 'components/toast/service/index.ts',
    outDir: 'components/toast/service/dist',
    fileName: 'toast-service.bundle.js',
    internalDir: 'toast'
  },
  '_shared-integration': {
    entry: 'components/_shared/permissions/integration.ts',
    outDir: 'components/_shared/permissions/dist',
    fileName: 'integration.bundle.js',
    internalDir: '_shared',
    keepExternal: [
      '/components/_shared/permissions/ui-feedback.ts',
      '/components/_shared/permissions/migration-bridge.ts'
    ]
  },
  '_shared-ui-feedback': {
    entry: 'components/_shared/permissions/ui-feedback.ts',
    outDir: 'components/_shared/permissions/dist',
    fileName: 'ui-feedback.bundle.js',
    internalDir: '_shared',
    emptyOutDir: false
  },
  // ═══ Lote 3A ═══
  'feature-flags': {
    entry: 'components/feature-flags/index.ts',
    outDir: 'components/feature-flags/dist',
    fileName: 'feature-flags.bundle.js'
  },
  'login-modal': {
    entry: 'components/login-modal/index.ts',
    outDir: 'components/login-modal/dist',
    fileName: 'login-modal.bundle.js'
  },
  // ═══ Lote 4 ═══
  'app-shell': {
    entry: 'components/app-shell/index.ts',
    outDir: 'components/app-shell/dist',
    fileName: 'app-shell.bundle.js',
    internalDir: 'app-shell',
    keepExternal: []
  },
  'header': {
    entry: 'components/header/_entry.ts',
    outDir: 'components/header/dist',
    fileName: 'header.bundle.js',
    keepExternal: [
      '/components/header/components/dist/header-components.bundle.js'
    ]
  },
  'layout-manager': {
    entry: 'components/layout-manager/index.ts',
    outDir: 'components/layout-manager/dist',
    fileName: 'layout-manager.bundle.js'
  },
  // ═══ Lote 6 ═══
  'sidebar': {
    entry: 'components/sidebar/_entry.ts',
    outDir: 'components/sidebar/dist',
    fileName: 'sidebar.bundle.js'
  },
  // ═══ Lote 7 ═══
  'nav-rail': {
    entry: 'components/nav-rail/index.ts',
    outDir: 'components/nav-rail/dist',
    fileName: 'nav-rail.bundle.js'
  },
  'footer': {
    entry: 'components/footer/index.ts',
    outDir: 'components/footer/dist',
    fileName: 'footer.bundle.js'
  },
  // ═══ Lote 9 ═══
  'main': {
    entry: 'components/main/_entry.ts',
    outDir: 'components/main/dist',
    fileName: 'main.bundle.js',
    keepInternal: ['/components/router/registry/', '/components/router/state/']
  },
  'overlay-layer': {
    entry: 'components/overlay-layer/index.ts',
    outDir: 'components/overlay-layer/dist',
    fileName: 'overlay-layer.bundle.js'
  },
  // ═══ Lote 10 ═══
  'panel-home': {
    entry: 'components/panel-home/index.ts',
    outDir: 'components/panel-home/dist',
    fileName: 'panel-home.bundle.js'
  },
  'ticker': {
    entry: 'components/ticker/index.ts',
    outDir: 'components/ticker/dist',
    fileName: 'ticker.bundle.js'
  },
};

var comp = COMPONENTS[COMPONENT];
if (!comp) {
  throw new Error('Componente desconhecido: ' + COMPONENT + '. Válidos: ' + Object.keys(COMPONENTS).join(', '));
}

// Prefixos de diretórios externos.
var EXTERNAL_PREFIXES = [
  '/core/',
  '/components/',
  '/assets/',
  '/boot/',
  '/platform/',
  '/app/',
  '/modules/'
];

// Verifica se um module ID é externo.
function isExternal(id) {
  // 1. keepExternal — arquivos dentro do componente que devem ficar lazy
  if (comp.keepExternal) {
    for (var j = 0; j < comp.keepExternal.length; j++) {
      var kePath = comp.keepExternal[j];
      if (id === kePath || id === ROOT + kePath) return true;
    }
  }

  // 1b. keepInternal — paths de fora que devem ser bundlados
  if (comp.keepInternal) {
    for (var ki = 0; ki < comp.keepInternal.length; ki++) {
      if (id.startsWith(comp.keepInternal[ki]) || id.startsWith(ROOT + comp.keepInternal[ki])) return false;
    }
  }

  // 2. Arquivos do próprio componente: NÃO são external
  var componentDir = comp.internalDir || COMPONENT;
  var internalPrefix = '/components/' + componentDir + '/';
  var internalPrefixFull = ROOT + internalPrefix;

  if (id.startsWith(internalPrefix) || id.startsWith(internalPrefixFull)) {
    return false;
  }

  // 3. Checar contra prefixos externos (raw e resolved)
  for (var i = 0; i < EXTERNAL_PREFIXES.length; i++) {
    if (id.startsWith(EXTERNAL_PREFIXES[i])) return true;
    if (id.startsWith(ROOT + EXTERNAL_PREFIXES[i])) return true;
  }
  return false;
}

// Converte paths resolvidos de volta para paths absolutos do browser.
function toBrowserPath(id) {
  if (id.startsWith(ROOT + '/')) {
    return id.slice(ROOT.length);
  }
  return id;
}

export default {
  root: ROOT,
  plugins: [],
  build: {
    lib: {
      entry: comp.entry,
      formats: ['es'],
      fileName: function () { return comp.fileName; }
    },
    outDir: comp.outDir,
    emptyOutDir: comp.emptyOutDir !== undefined ? comp.emptyOutDir : true,
    minify: 'esbuild',
    sourcemap: false,
    rollupOptions: {
      external: isExternal,
      output: {
        inlineDynamicImports: true,
        paths: toBrowserPath
      }
    }
  }
};
