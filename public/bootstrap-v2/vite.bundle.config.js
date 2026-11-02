// ═══════════════════════════════════════════════════════════════
// Vite Bundle Config — Bootstrap-v2
// ═══════════════════════════════════════════════════════════════
// Usa Vite APENAS como bundler (não como framework React).
// Agrupa ~205 arquivos internos do bootstrap-v2 em um único bundle ES module.
//
// Entry:    bootstrap-v2/loader/index.js
// Output:   bootstrap-v2/dist/bootstrap.bundle.js
// Format:   ES module (compatível com <script type="module">)
// External: /core/*, /components/*, /assets/*, /boot/*, /platform/*, /app/*, /modules/*
//
// Uso: cd /var/www/dshowdash/public/react && npx vite build --config ../bootstrap-v2/vite.bundle.config.js
// ═══════════════════════════════════════════════════════════════

// defineConfig não é importado — é apenas um helper de tipo (identity function).
// Remover o import evita erro de resolução de módulo quando o config
// está fora do diretório /public/react/ onde o Vite está instalado.

// P1-01 (Etapa 3): raiz por variável (build fora da árvore viva); padrão = produção, como vite.components.config.js
const ROOT = process.env.VITE_BOOTSTRAP_ROOT || '/var/www/dshowdash/public';

// Prefixos de diretórios externos ao bootstrap-v2.
// Imports para esses paths são preservados no bundle (não bundlados).
const EXTERNAL_PREFIXES = [
  '/core/',
  '/components/',
  '/assets/',
  '/boot/',
  '/platform/',
  '/app/',
  '/modules/'
];

// Verifica se um module ID é externo ao bootstrap-v2.
// Recebe tanto paths brutos (/core/...) quanto resolvidos (/var/www/.../core/...).
function isExternal(id) {
  for (var i = 0; i < EXTERNAL_PREFIXES.length; i++) {
    if (id.startsWith(EXTERNAL_PREFIXES[i])) return true;
    if (id.startsWith(ROOT + EXTERNAL_PREFIXES[i])) return true;
  }
  return false;
}

// Converte paths resolvidos (filesystem) de volta para paths absolutos do browser.
// /var/www/dshowdash/public/core/runtime/strict-mode.js → /core/runtime/strict-mode.js
function toBrowserPath(id) {
  if (id.startsWith(ROOT + '/')) {
    return id.slice(ROOT.length);
  }
  return id;
}

export default {
  root: ROOT,
  build: {
    lib: {
      entry: 'bootstrap-v2/loader/index.ts',
      formats: ['es'],
      fileName: function() { return 'bootstrap.bundle.js'; }
    },
    outDir: 'bootstrap-v2/dist',
    emptyOutDir: true,
    minify: 'esbuild',
    sourcemap: false,
    rollupOptions: {
      external: isExternal,
      output: {
        // Gera um único arquivo — dynamic imports internos são inlined.
        // Dynamic imports externos são preservados como import() (são external).
        inlineDynamicImports: true,
        // Mapeia IDs resolvidos de volta para paths absolutos do browser.
        paths: toBrowserPath
      }
    }
  }
};
