// config.mjs — Configuracoes do servico de screenshots
// @version 1.0.0

import { readFileSync } from 'fs';
import { resolve } from 'path';

// Carregar .env do projeto raiz
function loadEnv() {
  try {
    const envPath = resolve('/var/www/dshowdash/.env');
    const lines = readFileSync(envPath, 'utf-8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const value = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch (e) {
    console.error('[config] Falha ao carregar .env:', e.message);
  }
}

loadEnv();

export const CONFIG = {
  BASE_URL: process.env.DSHOWDASH_URL || 'https://dshowdash.com.br',
  STORAGE_PATH: '/var/www/dshowdash/storage/media/images/screenshots',
  THUMBNAIL_PATH: '/var/www/dshowdash/storage/media/images/thumbnails/panels',
  LOG_PATH: '/var/www/dshowdash/storage/logs',

  // Viewport padrao (conforme solicitado: 1280x720)
  DEFAULT_WIDTH: 1280,
  DEFAULT_HEIGHT: 720,
  DEFAULT_FORMAT: 'jpeg',
  JPEG_QUALITY: 85,

  // Thumbnail
  THUMB_WIDTH: 400,
  THUMB_HEIGHT: 225,

  // Timeouts
  PAGE_TIMEOUT: 30000,
  NETWORK_IDLE_TIMEOUT: 5000,
  PANEL_MOUNT_TIMEOUT: 10000,

  // Batch
  DELAY_BETWEEN_PANELS: 5000, // 5s entre capturas (conforme solicitado)
  MAX_SCREENSHOTS_KEPT: 7,

  // Rate limit
  MIN_INTERVAL_SECONDS: 300,

  // Browser
  CHROMIUM_ARGS: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--disable-web-security',
    '--window-size=1280,720'
  ],

  // DB
  DB_HOST: process.env.DB_DSHOWDASH_HOST || '127.0.0.1',
  DB_PORT: parseInt(process.env.DB_DSHOWDASH_PORT || '3306', 10),
  DB_NAME: process.env.DB_DSHOWDASH_NAME || 'DSHOWDASH',
  DB_USER: process.env.DB_DSHOWDASH_USER || 'root',
  DB_PASS: process.env.DB_DSHOWDASH_PASS || '',

  // Auth (credenciais do servico de screenshot)
  AUTH_USER: process.env.SCREENSHOT_SERVICE_USER || '',
  AUTH_PASS: process.env.SCREENSHOT_SERVICE_PASS || '',
};
