// db.mjs — Modulo de banco de dados para servico de screenshots
// @version 1.0.0

import mysql from 'mysql2/promise';
import { CONFIG } from './config.mjs';
import { logger } from './utils/logger.mjs';

let pool = null;

export function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: CONFIG.DB_HOST,
      port: CONFIG.DB_PORT,
      database: CONFIG.DB_NAME,
      user: CONFIG.DB_USER,
      password: CONFIG.DB_PASS,
      waitForConnections: true,
      connectionLimit: 5,
      queueLimit: 0,
      charset: 'utf8mb4',
    });
    logger.info('Pool MySQL criado');
  }
  return pool;
}

export async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
    logger.info('Pool MySQL fechado');
  }
}

// Busca painel por ID
export async function getPanel(panelId) {
  const p = getPool();
  const [rows] = await p.execute(
    'SELECT * FROM panel_registry WHERE panel_id = ?',
    [panelId]
  );
  return rows[0] || null;
}

// Busca todos os paineis ativos com rotas associadas (retorna route_hash)
export async function getActivePanelsWithRoutes() {
  const p = getPool();
  const [rows] = await p.execute(`
    SELECT
      pr.panel_id,
      pr.title,
      pr.is_active,
      pr.thumbnail_path,
      (
        SELECT r2.route_hash
        FROM app_nav_route r2
        JOIN app_nav_route_resolution_active a2 ON a2.route_id = r2.route_id
        JOIN app_nav_route_resolution_revision rev2 ON rev2.resolution_rev_id = a2.resolution_rev_id
        JOIN app_nav_destination d2 ON d2.destination_id = rev2.destination_id
        WHERE d2.destination_key = pr.panel_id AND d2.destination_type = 'panel' AND r2.is_active = 1
        ORDER BY r2.route_id ASC
        LIMIT 1
      ) AS route_hash
    FROM panel_registry pr
    JOIN app_nav_destination d ON d.destination_key = pr.panel_id AND d.destination_type = 'panel'
    JOIN app_nav_route_resolution_revision rev ON rev.destination_id = d.destination_id
    JOIN app_nav_route_resolution_active a ON a.resolution_rev_id = rev.resolution_rev_id
    JOIN app_nav_route r ON r.route_id = a.route_id AND r.is_active = 1
    WHERE pr.is_active = 1
    GROUP BY pr.panel_id, pr.title, pr.is_active, pr.thumbnail_path, pr.sort_order
    ORDER BY pr.sort_order, pr.panel_id
  `);
  return rows;
}

// Busca rota de um painel especifico (retorna route_hash ex: "#/admin/navegacao")
export async function getPanelRoute(panelId) {
  const p = getPool();
  const [rows] = await p.execute(`
    SELECT r.route_hash
    FROM panel_registry pr
    JOIN app_nav_destination d ON d.destination_key = pr.panel_id AND d.destination_type = 'panel'
    JOIN app_nav_route_resolution_revision rev ON rev.destination_id = d.destination_id
    JOIN app_nav_route_resolution_active a ON a.resolution_rev_id = rev.resolution_rev_id
    JOIN app_nav_route r ON r.route_id = a.route_id AND r.is_active = 1
    WHERE pr.panel_id = ?
    ORDER BY r.route_id ASC
    LIMIT 1
  `, [panelId]);
  return rows[0]?.route_hash || null;
}

// Insere registro de screenshot
export async function insertScreenshot(panelId, data) {
  const p = getPool();
  const [result] = await p.execute(`
    INSERT INTO panel_screenshots (panel_id, screenshot_path, captured_at, width, height, file_size, format, status, error_message)
    VALUES (?, ?, NOW(), ?, ?, ?, ?, ?, ?)
  `, [
    panelId,
    data.screenshotPath,
    data.width || CONFIG.DEFAULT_WIDTH,
    data.height || CONFIG.DEFAULT_HEIGHT,
    data.fileSize || 0,
    data.format || CONFIG.DEFAULT_FORMAT,
    data.status || 'success',
    data.errorMessage || null,
  ]);
  return result.insertId;
}

// Atualiza status do screenshot
export async function updateScreenshotStatus(screenshotId, status, data = {}) {
  const p = getPool();
  await p.execute(`
    UPDATE panel_screenshots
    SET status = ?, error_message = ?, file_size = ?
    WHERE id = ?
  `, [status, data.errorMessage || null, data.fileSize || 0, screenshotId]);
}

// Atualiza thumbnail_path em panel_registry
export async function updatePanelThumbnail(panelId, thumbnailPath) {
  const p = getPool();
  await p.execute(`
    UPDATE panel_registry
    SET thumbnail_path = ?, thumbnail_updated_at = NOW()
    WHERE panel_id = ?
  `, [thumbnailPath, panelId]);
}
