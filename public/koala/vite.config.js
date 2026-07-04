import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// App Koala Docs — buildado ESTÁTICO, servido por nginx em /koala/.
export default defineConfig({
  base: '/koala/',
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
  },
});
