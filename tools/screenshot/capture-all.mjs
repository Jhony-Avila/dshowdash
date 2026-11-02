#!/usr/bin/env node

// capture-all.mjs — Captura screenshots de todos os paineis ativos
// @version 2.0.0
// v2.0.0: Captura paralela com limite de 3 simultaneos (semaforo)
//
// Uso:
//   node capture-all.mjs
//   node capture-all.mjs --dry-run     # lista paineis sem capturar
//   node capture-all.mjs --delay=5000  # delay customizado entre capturas (ms)
//   node capture-all.mjs --concurrency=3  # limite de capturas paralelas (padrao: 3)

import { chromium } from 'playwright';
import { writeFile, readdir, unlink, stat } from 'fs/promises';
import { join } from 'path';
import { CONFIG } from './config.mjs';
import { logger } from './utils/logger.mjs';
import { getActivePanelsWithRoutes, closePool } from './db.mjs';
import { getSessionCookies } from './auth.mjs';
import { capturePanel } from './capture.mjs';

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

/**
 * Semaforo para limitar execucao paralela.
 * Permite no maximo `limit` tasks simultaneas.
 */
class Semaphore {
  constructor(limit) {
    this._limit = limit;
    this._running = 0;
    this._queue = [];
  }

  async acquire() {
    if (this._running < this._limit) {
      this._running++;
      return;
    }
    return new Promise(resolve => {
      this._queue.push(resolve);
    });
  }

  release() {
    this._running--;
    if (this._queue.length > 0) {
      this._running++;
      const next = this._queue.shift();
      next();
    }
  }
}

/**
 * Remove screenshot-batch JSONs com mais de `daysToKeep` dias.
 * Roda apos salvar o JSON do dia. Falhas individuais nao quebram o script.
 */
async function applyBatchLogsRetention(logDir, daysToKeep = 90) {
  try {
    const cutoff = Date.now() - daysToKeep * 24 * 60 * 60 * 1000;
    const files = await readdir(logDir);
    let removed = 0;
    for (const f of files) {
      if (!f.startsWith('screenshot-batch-') || !f.endsWith('.json')) continue;
      try {
        const fullPath = join(logDir, f);
        const st = await stat(fullPath);
        if (st.mtimeMs < cutoff) {
          await unlink(fullPath);
          removed++;
        }
      } catch (err) {
        logger.warn(`[retention] Falha em ${f}: ${err.message}`);
      }
    }
    if (removed > 0) {
      logger.info(`[retention] Removidos ${removed} batch logs > ${daysToKeep} dias`);
    }
  } catch (err) {
    logger.warn(`[retention] Erro geral: ${err.message}`);
  }
}

async function main() {
  const args = parseArgs();
  const dryRun = !!args['dry-run'];
  const delay = parseInt(args['delay'] || CONFIG.DELAY_BETWEEN_PANELS || '1000', 10);
  const concurrency = parseInt(args['concurrency'] || '3', 10);
  const startTime = Date.now();

  logger.info('=== CAPTURA BATCH DE SCREENSHOTS ===');
  logger.info(`Modo: PARALELO (${concurrency} simultaneos)`);
  logger.info(`Delay entre capturas: ${delay}ms`);

  // 1. Buscar todos os paineis ativos com rotas
  const panels = await getActivePanelsWithRoutes();

  if (panels.length === 0) {
    logger.warn('Nenhum painel ativo com rota encontrado');
    return;
  }

  logger.info(`Paineis ativos com rotas: ${panels.length}`);

  // Filtrar paineis sem rota (route_hash NULL)
  const validPanels = panels.filter(p => {
    if (!p.route_hash) {
      logger.warn(`Painel ${p.panel_id} (${p.title}) sem route_hash — pulando`);
      return false;
    }
    return true;
  });

  logger.info(`Paineis com rota valida: ${validPanels.length} (${panels.length - validPanels.length} sem rota)`);

  if (dryRun) {
    logger.info('--- DRY RUN: listando paineis ---');
    for (const panel of validPanels) {
      const route = panel.route_hash.startsWith('/') ? panel.route_hash : `/${panel.route_hash}`;
      logger.info(`  ${panel.panel_id}: ${panel.title} -> ${CONFIG.BASE_URL}${route}`);
    }
    logger.info('--- FIM DRY RUN ---');
    return;
  }

  // 2. Autenticar uma vez
  let cookies;
  try {
    cookies = await getSessionCookies();
  } catch (err) {
    logger.error(`Falha na autenticacao: ${err.message}`);
    process.exit(1);
  }

  // 3. Lancar browser UMA VEZ
  const browser = await chromium.launch({
    args: CONFIG.CHROMIUM_ARGS,
  });
  logger.info('Browser lancado (compartilhado)');

  // 4. Capturar paineis em PARALELO com semaforo
  const results = { success: 0, error: 0, skipped: 0, details: [] };
  const semaphore = new Semaphore(concurrency);
  let completed = 0;

  const tasks = validPanels.map((panel, i) => {
    return (async () => {
      await semaphore.acquire();
      try {
        const route = panel.route_hash.startsWith('/') ? panel.route_hash : `/${panel.route_hash}`;
        const url = `${CONFIG.BASE_URL}${route}`;

        completed++;
        logger.info(`[${completed}/${validPanels.length}] Capturando ${panel.panel_id} (${panel.title})...`);

        try {
          const result = await capturePanel({
            panelId: panel.panel_id,
            url,
            cookies,
            browser,
          });

          if (result.success) {
            results.success++;
            results.details.push({ panelId: panel.panel_id, status: 'success', path: result.path });
          } else {
            results.error++;
            results.details.push({ panelId: panel.panel_id, status: 'error', error: result.error });
          }
        } catch (err) {
          results.error++;
          results.details.push({ panelId: panel.panel_id, status: 'error', error: err.message });
          logger.error(`Erro inesperado em ${panel.panel_id}: ${err.message}`);
        }
      } finally {
        semaphore.release();
      }
    })();
  });

  // Aguardar todas as capturas paralelas
  await Promise.all(tasks);

  // 5. Fechar browser
  await browser.close();
  logger.info('Browser fechado');

  // 6. Relatorio final
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const report = {
    timestamp: new Date().toISOString(),
    duration_seconds: parseFloat(elapsed),
    total: validPanels.length,
    skipped_no_route: panels.length - validPanels.length,
    success: results.success,
    error: results.error,
    concurrency,
    details: results.details,
  };

  logger.info('=== RELATORIO ===');
  logger.info(`Total: ${validPanels.length} | Sucesso: ${results.success} | Erros: ${results.error} | Sem rota: ${panels.length - validPanels.length} | Tempo: ${elapsed}s | Concorrencia: ${concurrency}`);

  // Salvar log do batch
  const logDate = new Date().toISOString().slice(0, 10);
  const logPath = join(CONFIG.LOG_PATH, `screenshot-batch-${logDate}.json`);
  try {
    await writeFile(logPath, JSON.stringify(report, null, 2));
    logger.info(`Relatorio salvo: ${logPath}`);
  } catch (err) {
    logger.warn(`Falha ao salvar relatorio: ${err.message}`);
  }

  // Retention: remover screenshot-batch JSONs > 90 dias
  await applyBatchLogsRetention(CONFIG.LOG_PATH, 90);

  // Listar erros se houver
  if (results.error > 0) {
    logger.warn('Paineis com erro:');
    for (const d of results.details.filter(d => d.status === 'error')) {
      logger.warn(`  - ${d.panelId}: ${d.error}`);
    }
  }
}

main()
  .catch(err => {
    logger.error(`Erro fatal no batch: ${err.message}`);
    process.exit(1);
  })
  .finally(() => closePool());
