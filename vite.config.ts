import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@app': path.resolve(__dirname, 'app'),
      '@core': path.resolve(__dirname, 'public/core'),
      '@components': path.resolve(__dirname, 'public/components'),
      '@platform': path.resolve(__dirname, 'public/platform'),
      '@assets': path.resolve(__dirname, 'public/assets')
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
});
