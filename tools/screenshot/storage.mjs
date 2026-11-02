// storage.mjs — Gerenciamento de arquivos para servico de screenshots
// @version 1.0.0

import { mkdir, readdir, unlink, stat, copyFile } from 'fs/promises';
import { join } from 'path';
import sharp from 'sharp';
import { CONFIG } from './config.mjs';
import { logger } from './utils/logger.mjs';

// Garante que o diretorio do painel existe
async function ensureDir(dirPath) {
  await mkdir(dirPath, { recursive: true });
}

// Salva screenshot no diretorio correto, retorna caminho relativo
export async function saveScreenshot(panelId, buffer, format = 'jpeg') {
  const panelDir = join(CONFIG.STORAGE_PATH, panelId);
  await ensureDir(panelDir);

  const now = new Date();
  const ts = now.toISOString().replace(/[T]/g, '_').replace(/[:.-]/g, '').slice(0, 15);
  const ext = format === 'jpeg' ? 'jpg' : format;
  const filename = `${ts}.${ext}`;
  const fullPath = join(panelDir, filename);

  // Processar com sharp para otimizar
  if (format === 'jpeg') {
    await sharp(buffer).jpeg({ quality: CONFIG.JPEG_QUALITY }).toFile(fullPath);
  } else if (format === 'webp') {
    await sharp(buffer).webp({ quality: CONFIG.JPEG_QUALITY }).toFile(fullPath);
  } else {
    await sharp(buffer).png().toFile(fullPath);
  }

  const relativePath = `screenshots/${panelId}/${filename}`;
  logger.info(`Screenshot salvo: ${relativePath}`);
  return { fullPath, relativePath, filename };
}

// Copia para latest.{ext}
export async function updateLatest(panelId, sourcePath, format = 'jpeg') {
  const ext = format === 'jpeg' ? 'jpg' : format;
  const latestPath = join(CONFIG.STORAGE_PATH, panelId, `latest.${ext}`);
  await copyFile(sourcePath, latestPath);
  return `screenshots/${panelId}/latest.${ext}`;
}

// Gera thumbnail reduzido
export async function generateThumbnail(sourcePath, panelId) {
  const thumbDir = join(CONFIG.THUMBNAIL_PATH);
  await ensureDir(thumbDir);

  const thumbPath = join(thumbDir, `${panelId}.jpg`);
  await sharp(sourcePath)
    .resize(CONFIG.THUMB_WIDTH, CONFIG.THUMB_HEIGHT, { fit: 'cover' })
    .jpeg({ quality: 80 })
    .toFile(thumbPath);

  logger.debug(`Thumbnail gerado: ${thumbPath}`);
  return thumbPath;
}

// Remove screenshots antigos (manter ultimos N)
export async function cleanOldScreenshots(panelId, keepCount = CONFIG.MAX_SCREENSHOTS_KEPT) {
  const panelDir = join(CONFIG.STORAGE_PATH, panelId);
  try {
    const files = await readdir(panelDir);
    // Filtrar apenas arquivos de screenshot (excluir latest.*)
    const screenshots = files
      .filter(f => !f.startsWith('latest.') && /\.(jpg|jpeg|png|webp)$/i.test(f))
      .sort()
      .reverse(); // mais recente primeiro

    if (screenshots.length <= keepCount) return;

    const toDelete = screenshots.slice(keepCount);
    for (const file of toDelete) {
      await unlink(join(panelDir, file));
      logger.debug(`Removido screenshot antigo: ${panelId}/${file}`);
    }
    logger.info(`Limpeza: removidos ${toDelete.length} screenshots antigos de ${panelId}`);
  } catch (e) {
    if (e.code !== 'ENOENT') {
      logger.warn(`Falha ao limpar screenshots de ${panelId}: ${e.message}`);
    }
  }
}

// Retorna tamanho do arquivo
export async function getFileSize(filePath) {
  const s = await stat(filePath);
  return s.size;
}
