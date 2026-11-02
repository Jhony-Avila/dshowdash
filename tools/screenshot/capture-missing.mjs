#!/usr/bin/env node

// capture-missing.mjs — Captura screenshots dos paineis sem thumbnail
// @version 1.0.0
// Usa URL fallback https://dshowdash.com.br/#/PANEL_ID para paineis sem rota
// Usa waitUntil 'load' (nao 'networkidle') para evitar timeout em SPAs com WebSocket

import { chromium } from 'playwright';
import { CONFIG } from './config.mjs';
import { logger } from './utils/logger.mjs';
import { getPool, closePool, insertScreenshot, updateScreenshotStatus, updatePanelThumbnail } from './db.mjs';
import { getSessionCookies, isLoginPage, loginViaPage } from './auth.mjs';
import { saveScreenshot, updateLatest, generateThumbnail, cleanOldScreenshots, getFileSize } from './storage.mjs';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const CONTENT_SELECTORS = [
  '.dsd-container__content',
  '[data-slot="content"]',
  '.panel-container',
  '[data-panel-id]',
];

async function captureSingle(page, panelId, url) {
  logger.info(`Navegando para: ${url}`);

  await page.goto(url, {
    waitUntil: 'load',
    timeout: 60000,
  });

  // Verificar se caimos na tela de login
  if (await isLoginPage(page)) {
    logger.warn('Detectada tela de login — usando fallback via formulario');
    await loginViaPage(page);
    logger.info(`Re-navegando para: ${url}`);
    await page.goto(url, {
      waitUntil: 'load',
      timeout: 60000,
    });
  }

  // Aguardar montagem do painel
  let contentElement = null;
  try {
    await page.waitForSelector(CONTENT_SELECTORS.join(', '), {
      state: 'visible',
      timeout: 15000,
    });
    for (const sel of CONTENT_SELECTORS) {
      contentElement = await page.locator(sel).first().elementHandle();
      if (contentElement) {
        logger.info(`Seletor encontrado: ${sel}`);
        break;
      }
    }
  } catch {
    logger.warn(`Seletor de painel nao encontrado em ${panelId}, usando viewport`);
  }

  // Pausa para dados async, graficos e animacoes
  await page.waitForTimeout(10000);

  // Ocultar overlays
  await page.addStyleTag({ content: `
    .dsd-shell__region--ticker,
    .dsd-shell__region--footer,
    .dsd-shell__region--statusbar,
    .news-ticker-component,
    .nav-rail,
    .nav-rail__footer,
    [class*="footer-toolbar"],
    [class*="status-bar"],
    [class*="statusbar"] {
      display: none !important;
    }
  `});

  // Capturar
  const format = CONFIG.DEFAULT_FORMAT;
  let buffer;
  if (contentElement) {
    buffer = await contentElement.screenshot({
      type: format === 'jpeg' ? 'jpeg' : 'png',
      quality: format === 'jpeg' ? CONFIG.JPEG_QUALITY : undefined,
    });
    logger.info(`Screenshot do elemento capturado: ${panelId}`);
  } else {
    buffer = await page.screenshot({
      type: format === 'jpeg' ? 'jpeg' : 'png',
      quality: format === 'jpeg' ? CONFIG.JPEG_QUALITY : undefined,
      fullPage: false,
    });
    logger.warn(`Fallback: viewport completo para ${panelId}`);
  }

  return buffer;
}

async function main() {
  const startTime = Date.now();

  // 1. Buscar paineis sem thumbnail
  const p = getPool();
  const [rows] = await p.execute(`
    SELECT panel_id, title
    FROM panel_registry
    WHERE (thumbnail_path IS NULL OR thumbnail_path = '')
    AND is_active = 1
    AND panel_id NOT LIKE 'panel-footer-%'
    AND panel_id NOT LIKE 'panel-status-%'
    ORDER BY panel_id
  `);

  logger.info(`=== CAPTURA DE ${rows.length} PAINEIS SEM THUMBNAIL ===`);

  if (rows.length === 0) {
    logger.info('Nenhum painel sem thumbnail encontrado');
    return;
  }

  for (const row of rows) {
    logger.info(`  ${row.panel_id}: ${row.title}`);
  }

  // 2. Autenticar
  const cookies = await getSessionCookies();
  logger.info('Autenticacao OK');

  // 3. Lancar browser
  const browser = await chromium.launch({ args: CONFIG.CHROMIUM_ARGS });
  logger.info('Browser lancado');

  const results = { success: 0, error: 0, details: [] };

  for (let i = 0; i < rows.length; i++) {
    const { panel_id: panelId, title } = rows[i];
    const url = `${CONFIG.BASE_URL}/#/${panelId}`;

    logger.info(`\n[${i + 1}/${rows.length}] ${panelId} (${title})`);

    const context = await browser.newContext({
      viewport: { width: CONFIG.DEFAULT_WIDTH, height: CONFIG.DEFAULT_HEIGHT },
      ignoreHTTPSErrors: true,
    });
    await context.addCookies(cookies);
    const page = await context.newPage();

    let ssId = null;

    try {
      // Inserir registro pending
      ssId = await insertScreenshot(panelId, {
        screenshotPath: `screenshots/${panelId}/pending`,
        width: CONFIG.DEFAULT_WIDTH,
        height: CONFIG.DEFAULT_HEIGHT,
        format: CONFIG.DEFAULT_FORMAT,
        status: 'pending',
      });

      const buffer = await captureSingle(page, panelId, url);
      logger.info(`Capturado: ${panelId} (${buffer.length} bytes)`);

      // Salvar
      const { fullPath, relativePath } = await saveScreenshot(panelId, buffer, CONFIG.DEFAULT_FORMAT);
      const latestPath = await updateLatest(panelId, fullPath, CONFIG.DEFAULT_FORMAT);
      await generateThumbnail(fullPath, panelId);
      const fileSize = await getFileSize(fullPath);

      // Atualizar banco
      await updateScreenshotStatus(ssId, 'success', { fileSize });
      await updatePanelThumbnail(panelId, latestPath);
      await cleanOldScreenshots(panelId);

      results.success++;
      results.details.push({ panelId, status: 'success', path: relativePath, fileSize });
      logger.info(`OK: ${panelId} -> ${relativePath} (${fileSize} bytes)`);
    } catch (err) {
      results.error++;
      results.details.push({ panelId, status: 'error', error: err.message });
      logger.error(`FALHA: ${panelId} -> ${err.message}`);
      if (ssId) {
        try { await updateScreenshotStatus(ssId, 'error', { errorMessage: err.message }); } catch {}
      }
    } finally {
      await page.close();
      await context.close();
    }

    // Delay entre capturas
    if (i < rows.length - 1) {
      await sleep(3000);
    }
  }

  await browser.close();

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  logger.info(`\n=== RELATORIO ===`);
  logger.info(`Total: ${rows.length} | Sucesso: ${results.success} | Erros: ${results.error} | Tempo: ${elapsed}s`);

  if (results.error > 0) {
    logger.warn('Paineis com erro:');
    for (const d of results.details.filter(d => d.status === 'error')) {
      logger.warn(`  - ${d.panelId}: ${d.error}`);
    }
  }

  // Listar sucessos
  if (results.success > 0) {
    logger.info('Paineis capturados:');
    for (const d of results.details.filter(d => d.status === 'success')) {
      logger.info(`  + ${d.panelId}: ${d.path} (${d.fileSize} bytes)`);
    }
  }
}

main()
  .catch(err => {
    logger.error(`Erro fatal: ${err.message}`);
    process.exit(1);
  })
  .finally(() => closePool());
