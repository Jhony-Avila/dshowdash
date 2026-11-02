#!/usr/bin/env node

// capture-batch-24.mjs — Captura screenshots dos 24 paineis sem thumbnail
// que possuem rota no app-router (16 footer + 8 status)
// Usa URLs explicitas pois esses paineis nao tem rota em app_nav_route_resolution_active

import { chromium } from 'playwright';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { CONFIG } from './config.mjs';
import { logger } from './utils/logger.mjs';
import { closePool } from './db.mjs';
import { getSessionCookies } from './auth.mjs';
import { capturePanel } from './capture.mjs';

const PANELS = [
  // 16 footer panels com rota no app-router
  { panelId: 'panel-footer-activity',  url: 'https://dshowdash.com.br/#/footer/activity' },
  { panelId: 'panel-footer-api',       url: 'https://dshowdash.com.br/#/footer/api' },
  { panelId: 'panel-footer-cpu',       url: 'https://dshowdash.com.br/#/footer/cpu' },
  { panelId: 'panel-footer-disk',      url: 'https://dshowdash.com.br/#/footer/disk' },
  { panelId: 'panel-footer-docs',      url: 'https://dshowdash.com.br/#/footer/docs' },
  { panelId: 'panel-footer-file',      url: 'https://dshowdash.com.br/#/footer/file' },
  { panelId: 'panel-footer-financial', url: 'https://dshowdash.com.br/#/footer/financial' },
  { panelId: 'panel-footer-globe',     url: 'https://dshowdash.com.br/#/footer/globe' },
  { panelId: 'panel-footer-memory',    url: 'https://dshowdash.com.br/#/footer/memory' },
  { panelId: 'panel-footer-registry',  url: 'https://dshowdash.com.br/#/footer/registry' },
  { panelId: 'panel-footer-server',    url: 'https://dshowdash.com.br/#/footer/server' },
  { panelId: 'panel-footer-settings',  url: 'https://dshowdash.com.br/#/footer/settings' },
  { panelId: 'panel-footer-shield',    url: 'https://dshowdash.com.br/#/footer/shield' },
  { panelId: 'panel-footer-status',    url: 'https://dshowdash.com.br/#/footer/status' },
  { panelId: 'panel-footer-support',   url: 'https://dshowdash.com.br/#/footer/support' },
  { panelId: 'panel-footer-wifi',      url: 'https://dshowdash.com.br/#/footer/wifi' },
  // 8 status panels
  { panelId: 'panel-status-currency-btc',         url: 'https://dshowdash.com.br/#/status/currency-btc' },
  { panelId: 'panel-status-currency-usd-brl',     url: 'https://dshowdash.com.br/#/status/currency-usd-brl' },
  { panelId: 'panel-status-currency-usd-cny',     url: 'https://dshowdash.com.br/#/status/currency-usd-cny' },
  { panelId: 'panel-status-email-integration',     url: 'https://dshowdash.com.br/#/status/email' },
  { panelId: 'panel-status-instagram-messenger',   url: 'https://dshowdash.com.br/#/status/instagram' },
  { panelId: 'panel-status-weather-sp',            url: 'https://dshowdash.com.br/#/status/weather' },
  { panelId: 'panel-status-wechat-integration',    url: 'https://dshowdash.com.br/#/status/wechat' },
  { panelId: 'panel-status-whatsapp-integration',  url: 'https://dshowdash.com.br/#/status/whatsapp' },
];

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  const startTime = Date.now();
  logger.info('=== CAPTURA BATCH: 24 PAINEIS SEM THUMBNAIL ===');

  // 1. Autenticar
  let cookies;
  try {
    cookies = await getSessionCookies();
  } catch (err) {
    logger.error(`Falha na autenticacao: ${err.message}`);
    process.exit(1);
  }

  // 2. Lancar browser
  const browser = await chromium.launch({ args: CONFIG.CHROMIUM_ARGS });
  logger.info('Browser lancado');

  // 3. Capturar cada painel
  const results = { success: 0, error: 0, details: [] };

  for (let i = 0; i < PANELS.length; i++) {
    const { panelId, url } = PANELS[i];
    logger.info(`[${i + 1}/${PANELS.length}] Capturando ${panelId}...`);

    try {
      const result = await capturePanel({ panelId, url, cookies, browser });
      if (result.success) {
        results.success++;
        results.details.push({ panelId, status: 'success', path: result.path });
        logger.info(`  OK: ${result.path} (${result.fileSize} bytes)`);
      } else {
        results.error++;
        results.details.push({ panelId, status: 'error', error: result.error });
        logger.error(`  FALHA: ${result.error}`);
      }
    } catch (err) {
      results.error++;
      results.details.push({ panelId, status: 'error', error: err.message });
      logger.error(`  ERRO: ${err.message}`);
    }

    if (i < PANELS.length - 1) {
      await sleep(CONFIG.DELAY_BETWEEN_PANELS);
    }
  }

  // 4. Fechar browser
  await browser.close();

  // 5. Relatorio
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const report = {
    timestamp: new Date().toISOString(),
    duration_seconds: parseFloat(elapsed),
    total: PANELS.length,
    success: results.success,
    error: results.error,
    details: results.details,
  };

  logger.info('=== RELATORIO ===');
  logger.info(`Total: ${PANELS.length} | Sucesso: ${results.success} | Erros: ${results.error} | Tempo: ${elapsed}s`);

  const logPath = join(CONFIG.LOG_PATH, `screenshot-batch-24-${new Date().toISOString().slice(0, 10)}.json`);
  try {
    await writeFile(logPath, JSON.stringify(report, null, 2));
    logger.info(`Relatorio salvo: ${logPath}`);
  } catch (err) {
    logger.warn(`Falha ao salvar relatorio: ${err.message}`);
  }

  if (results.error > 0) {
    logger.warn('Paineis com erro:');
    for (const d of results.details.filter(d => d.status === 'error')) {
      logger.warn(`  - ${d.panelId}: ${d.error}`);
    }
  }
}

main()
  .catch(err => { logger.error(`Erro fatal: ${err.message}`); process.exit(1); })
  .finally(() => closePool());
