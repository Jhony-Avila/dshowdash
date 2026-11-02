#!/usr/bin/env node

// capture.mjs — Captura screenshot de um painel individual
// @version 2.0.0
// v2.0.0: Fix auth - fallback para login via formulario quando cookie-based auth
//         falha devido a race condition do SPA auth-guard
//
// Uso:
//   node capture.mjs --panel-id=panel-01 [--url=https://dshowdash.com.br/geral]
//   node capture.mjs --panel-id=panel-01 --width=1280 --height=720 --format=jpeg
//   node capture.mjs --panel-id=panel-01 --screenshot-id=145

import { chromium } from 'playwright';
import { CONFIG } from './config.mjs';
import { logger } from './utils/logger.mjs';
import { getPanel, getPanelRoute, insertScreenshot, updateScreenshotStatus, updatePanelThumbnail, closePool } from './db.mjs';
import { getSessionCookies, isLoginPage, loginViaPage } from './auth.mjs';
import { saveScreenshot, updateLatest, generateThumbnail, cleanOldScreenshots, getFileSize } from './storage.mjs';

// Parse CLI args
function parseArgs() {
  const args = {};
  for (const arg of process.argv.slice(2)) {
    const match = arg.match(/^--(\w[\w-]*)=(.+)$/);
    if (match) {
      args[match[1]] = match[2];
    } else if (arg.match(/^--(\w[\w-]*)$/)) {
      args[arg.slice(2)] = true;
    }
  }
  return args;
}

export async function capturePanel(options = {}) {
  const {
    panelId,
    url: explicitUrl,
    width = CONFIG.DEFAULT_WIDTH,
    height = CONFIG.DEFAULT_HEIGHT,
    format = CONFIG.DEFAULT_FORMAT,
    screenshotId,
    cookies, // cookies pre-autenticados (reutilizacao no batch)
    browser: sharedBrowser, // browser compartilhado (reutilizacao no batch)
  } = options;

  if (!panelId) {
    throw new Error('--panel-id e obrigatorio');
  }

  logger.info(`Iniciando captura: ${panelId} (${width}x${height}, ${format})`);

  // 1. Buscar painel no banco
  const panel = await getPanel(panelId);
  if (!panel) {
    throw new Error(`Painel nao encontrado: ${panelId}`);
  }
  if (!panel.is_active) {
    throw new Error(`Painel inativo: ${panelId}`);
  }

  // 2. Determinar URL (SPA usa hash routing)
  // getPanelRoute retorna route_hash do banco (ex: "#/admin/navegacao")
  let targetUrl = explicitUrl;
  if (!targetUrl) {
    const routeHash = await getPanelRoute(panelId);
    if (!routeHash) {
      throw new Error(`Rota nao encontrada para painel: ${panelId}`);
    }
    targetUrl = `${CONFIG.BASE_URL}/${routeHash}`;
  }

  logger.info(`URL alvo: ${targetUrl}`);

  // 3. Inserir registro pending no banco (se nao temos screenshotId)
  let ssId = screenshotId ? parseInt(screenshotId, 10) : null;
  if (!ssId) {
    ssId = await insertScreenshot(panelId, {
      screenshotPath: `screenshots/${panelId}/pending`,
      width,
      height,
      format,
      status: 'pending',
    });
  }

  let browser = sharedBrowser;
  let ownsBrowser = false;

  try {
    // 4. Obter cookies de sessao
    const sessionCookies = cookies || await getSessionCookies();

    // 5. Lancar browser (se nao compartilhado)
    if (!browser) {
      browser = await chromium.launch({
        args: CONFIG.CHROMIUM_ARGS,
      });
      ownsBrowser = true;
      logger.debug('Browser lancado');
    }

    // 6. Criar context com viewport e cookies
    const context = await browser.newContext({
      viewport: { width: parseInt(width, 10), height: parseInt(height, 10) },
      ignoreHTTPSErrors: true,
    });
    await context.addCookies(sessionCookies);

    // 7. Navegar e capturar
    const page = await context.newPage();

    try {
      await page.goto(targetUrl, {
        waitUntil: 'domcontentloaded',
        timeout: CONFIG.PAGE_TIMEOUT,
      });

      // 7.1 Verificar se caimos na tela de login (race condition do SPA auth-guard)
      if (await isLoginPage(page)) {
        logger.warn('Detectada tela de login — cookie-based auth falhou, usando fallback via formulario');

        // Fazer login via formulario
        await loginViaPage(page);

        // Navegar novamente para a URL alvo
        logger.info(`Re-navegando para: ${targetUrl}`);
        await page.goto(targetUrl, {
          waitUntil: 'domcontentloaded',
          timeout: CONFIG.PAGE_TIMEOUT,
        });
      }

      // Aguardar montagem do painel no SPA
      // Apos navegacao hash, o SPA precisa montar o conteudo do painel
      // Seletores em ordem de prioridade para o elemento de conteudo
      const CONTENT_SELECTORS = [
        '.dsd-container__content',
        '[data-slot="content"]',
        '.panel-container',
        '[data-panel-id]',
      ];
      let contentElement = null;
      try {
        await page.waitForSelector(CONTENT_SELECTORS.join(', '), {
          state: 'visible',
          timeout: CONFIG.PANEL_MOUNT_TIMEOUT,
        });
        // Encontrar o elemento de conteudo na ordem de prioridade
        for (const sel of CONTENT_SELECTORS) {
          contentElement = await page.locator(sel).first().elementHandle();
          if (contentElement) {
            logger.info(`Seletor de conteudo encontrado: ${sel} para ${panelId}`);
            break;
          }
        }
      } catch {
        logger.warn(`Seletor de painel nao encontrado em ${panelId}, capturando viewport atual`);
      }

      // Pausa extra para dados async, graficos e animacoes finalizarem
      await page.waitForTimeout(8000);

      // Ocultar elementos de overlay (footer, ticker, statusbar, nav-rail)
      // para capturar apenas o conteudo limpo do painel
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

      // 8. Capturar screenshot (apenas conteudo do painel, sem sidebar/header/footer)
      let buffer;
      if (contentElement) {
        buffer = await contentElement.screenshot({
          type: format === 'jpeg' ? 'jpeg' : 'png',
          quality: format === 'jpeg' ? CONFIG.JPEG_QUALITY : undefined,
        });
        logger.info(`Screenshot do elemento de conteudo capturado: ${panelId}`);
      } else {
        buffer = await page.screenshot({
          type: format === 'jpeg' ? 'jpeg' : 'png',
          quality: format === 'jpeg' ? CONFIG.JPEG_QUALITY : undefined,
          fullPage: false,
        });
        logger.warn(`Fallback: screenshot do viewport completo para ${panelId}`);
      }

      logger.info(`Screenshot capturado: ${panelId} (${buffer.length} bytes raw)`);

      // 9. Salvar arquivo
      const { fullPath, relativePath } = await saveScreenshot(panelId, buffer, format);

      // 10. Atualizar latest
      const latestPath = await updateLatest(panelId, fullPath, format);

      // 11. Gerar thumbnail
      await generateThumbnail(fullPath, panelId);

      // 12. Obter tamanho final
      const fileSize = await getFileSize(fullPath);

      // 13. Atualizar banco
      await updateScreenshotStatus(ssId, 'success', { fileSize });
      await updatePanelThumbnail(panelId, latestPath);

      // 14. Limpar antigos
      await cleanOldScreenshots(panelId);

      logger.info(`Captura concluida com sucesso: ${panelId} -> ${relativePath} (${fileSize} bytes)`);

      return { success: true, panelId, path: relativePath, fileSize, screenshotId: ssId };

    } finally {
      await page.close();
      await context.close();
    }

  } catch (error) {
    logger.error(`Falha na captura de ${panelId}: ${error.message}`);

    // Atualizar status de erro no banco
    if (ssId) {
      try {
        await updateScreenshotStatus(ssId, 'error', { errorMessage: error.message });
      } catch (dbErr) {
        logger.error(`Falha ao atualizar status de erro: ${dbErr.message}`);
      }
    }

    return { success: false, panelId, error: error.message, screenshotId: ssId };

  } finally {
    if (ownsBrowser && browser) {
      await browser.close();
      logger.debug('Browser fechado');
    }
  }
}

// Execucao direta via CLI
const args = parseArgs();
if (args['panel-id']) {
  capturePanel({
    panelId: args['panel-id'],
    url: args['url'],
    width: args['width'] ? parseInt(args['width'], 10) : undefined,
    height: args['height'] ? parseInt(args['height'], 10) : undefined,
    format: args['format'],
    screenshotId: args['screenshot-id'],
  })
    .then(result => {
      if (result.success) {
        logger.info(`OK: ${result.panelId} -> ${result.path}`);
        process.exit(0);
      } else {
        logger.error(`FALHA: ${result.panelId} -> ${result.error}`);
        process.exit(1);
      }
    })
    .catch(err => {
      logger.error(`Erro fatal: ${err.message}`);
      process.exit(1);
    })
    .finally(() => closePool());
}
