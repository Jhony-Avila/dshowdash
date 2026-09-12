import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// App Koala Docs — buildado ESTÁTICO, servido por nginx em /koala/.
export default defineConfig({
  base: '/koala/',
  plugins: [react()],
  // Piloto TS/JS (lote chore/dshow-cleanup-dedup-v1): a FONTE é o .ts; o JS só existe em dist/ (saída do
  // build). Ordem explícita evita que um .js irmão esquecido ao lado da fonte volte a sombrear o .ts
  // (o padrão do Vite resolve '.js' antes de '.ts' em imports sem extensão).
  resolve: { extensions: ['.ts', '.tsx', '.mts', '.mjs', '.js', '.jsx', '.json'] },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
  },
});
