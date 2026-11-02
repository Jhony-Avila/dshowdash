<?php
declare(strict_types=1);

// /api/devices/index.php - Gerenciamento de dispositivos do usuario
// @version 2.2.0-ENTERPRISE
// @updated 2026-01-21
// P1.2 FIX: Migrado para requireCsrf()
// P3.FIX: Corrigido SessionGate::start() e isActive()

require_once __DIR__ . '/../_helpers/ApiResponse.php';
require_once __DIR__ . '/../_helpers/AuthHelpers.php';
require_once __DIR__ . '/../../config/db_connection.php';
require_once __DIR__ . '/../core/CorsPolicy.php';
require_once __DIR__ . '/../core/SessionGate.php';

CorsPolicy::setupApiEndpoint([
    'methods' => ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    'no_cache' => true
]);

$method = $_SERVER['REQUEST_METHOD'] ?? '';
if (!in_array($method, ['GET', 'POST', 'PATCH', 'DELETE'], true)) {
    header('Allow: GET, POST, PATCH, DELETE, OPTIONS');
    ApiResponse::error(ApiResponse::ERR_METHOD_NOT_ALLOWED, 405);
}

SessionGate::start();

if (!SessionGate::isActive()) {
    ApiResponse::error(ApiResponse::ERR_NOT_AUTHENTICATED, 401);
}

$userId = SessionGate::getUserId();
$action = $_GET['action'] ?? 'list';

try {
    $pdo = getConnection('DSHOWDASH');
} catch (Exception $e) {
    error_log("[devices] DB Error: " . $e->getMessage());
    ApiResponse::error(ApiResponse::ERR_DATABASE_ERROR, 503);
}

// GET - Listar dispositivos
if ($method === 'GET' && $action === 'list') {
    $stmt = $pdo->prepare("SELECT id, device_id, device_name, device_type, browser, os, trust_level, is_current, last_seen_at, last_ip, created_at FROM app_user_devices WHERE user_id = ? AND deleted_at IS NULL ORDER BY last_seen_at DESC");
    $stmt->execute([$userId]);
    $devices = $stmt->fetchAll(PDO::FETCH_ASSOC);

    session_write_close();
    ApiResponse::success(['devices' => $devices, 'total' => count($devices)], ['timestamp' => date('c')]);
}

// GET - Dispositivo atual
if ($method === 'GET' && $action === 'current') {
    $stmt = $pdo->prepare("SELECT id, device_id, device_name, device_type, browser, os, trust_level, last_seen_at, last_ip FROM app_user_devices WHERE user_id = ? AND is_current = 1 AND deleted_at IS NULL LIMIT 1");
    $stmt->execute([$userId]);
    $device = $stmt->fetch(PDO::FETCH_ASSOC);

    session_write_close();
    ApiResponse::success(['device' => $device ?: null], ['timestamp' => date('c')]);
}

// POST - Registrar dispositivo
if ($method === 'POST' && $action === 'register') {
    requireCsrf();

    $input = json_decode(file_get_contents('php://input'), true) ?: [];
    $deviceId = $input['device_id'] ?? null;
    $fingerprint = $input['fingerprint'] ?? null;
    $deviceName = $input['device_name'] ?? 'Dispositivo Desconhecido';
    $deviceType = $input['device_type'] ?? 'desktop';
    $browser = $input['browser'] ?? $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown';
    $os = $input['os'] ?? 'Unknown';
    $ip = $_SERVER['REMOTE_ADDR'] ?? '';

    if (!$deviceId) {
        session_write_close();
        ApiResponse::error('DEVICE_ID_REQUIRED', 400, ['message' => 'Device ID obrigatorio']);
    }

    $stmt = $pdo->prepare("SELECT id FROM app_user_devices WHERE user_id = ? AND device_id = ? AND deleted_at IS NULL");
    $stmt->execute([$userId, $deviceId]);
    $existing = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($existing) {
        $pdo->prepare("UPDATE app_user_devices SET is_current = 1, last_seen_at = NOW(3), last_ip = ?, browser = ?, os = ?, updated_at = NOW(3) WHERE id = ?")->execute([$ip, $browser, $os, $existing['id']]);
        $pdo->prepare("UPDATE app_user_devices SET is_current = 0 WHERE user_id = ? AND id != ?")->execute([$userId, $existing['id']]);

        error_log("DEVICE_UPDATED: user_id=$userId, device_id={$existing['id']}");

        session_write_close();
        ApiResponse::success(['device_id' => (int)$existing['id'], 'action' => 'updated'], ['timestamp' => date('c')]);
    }

    $pdo->prepare("UPDATE app_user_devices SET is_current = 0 WHERE user_id = ?")->execute([$userId]);
    $pdo->prepare("INSERT INTO app_user_devices (user_id, device_id, fingerprint_sha256, device_name, device_type, browser, os, trust_level, is_current, last_seen_at, last_ip, ip_user) VALUES (?, ?, ?, ?, ?, ?, ?, 'unknown', 1, NOW(3), ?, ?)")->execute([$userId, $deviceId, $fingerprint, $deviceName, $deviceType, $browser, $os, $ip, $ip]);

    $newDeviceId = $pdo->lastInsertId();

    error_log("DEVICE_REGISTERED: user_id=$userId, device_id=$newDeviceId");

    session_write_close();
    ApiResponse::success(['device_id' => (int)$newDeviceId, 'action' => 'created'], ['timestamp' => date('c')]);
}

// PATCH - Alterar nivel de confianca
if ($method === 'PATCH' && $action === 'trust') {
    requireCsrf();

    $input = json_decode(file_get_contents('php://input'), true) ?: [];
    $deviceId = $input['id'] ?? $_GET['id'] ?? null;
    $trustLevel = $input['trust_level'] ?? null;

    if (!$deviceId || !$trustLevel) {
        session_write_close();
        ApiResponse::error('MISSING_PARAMS', 400, ['message' => 'ID e trust_level obrigatorios']);
    }

    if (!in_array($trustLevel, ['unknown', 'low', 'medium', 'high', 'trusted'], true)) {
        session_write_close();
        ApiResponse::error('INVALID_TRUST_LEVEL', 400, ['message' => 'Trust level invalido']);
    }

    $stmt = $pdo->prepare("UPDATE app_user_devices SET trust_level = ?, updated_at = NOW(3) WHERE id = ? AND user_id = ?");
    $stmt->execute([$trustLevel, $deviceId, $userId]);

    error_log("DEVICE_TRUST_CHANGED: user_id=$userId, device_id=$deviceId, level=$trustLevel");

    session_write_close();
    ApiResponse::success(['updated' => $stmt->rowCount() > 0], ['timestamp' => date('c')]);
}

// PATCH - Renomear dispositivo
if ($method === 'PATCH' && $action === 'rename') {
    requireCsrf();

    $input = json_decode(file_get_contents('php://input'), true) ?: [];
    $deviceId = $input['id'] ?? $_GET['id'] ?? null;
    $deviceName = $input['device_name'] ?? null;

    if (!$deviceId || !$deviceName) {
        session_write_close();
        ApiResponse::error('MISSING_PARAMS', 400, ['message' => 'ID e device_name obrigatorios']);
    }

    $stmt = $pdo->prepare("UPDATE app_user_devices SET device_name = ?, updated_at = NOW(3) WHERE id = ? AND user_id = ?");
    $stmt->execute([$deviceName, $deviceId, $userId]);

    error_log("DEVICE_RENAMED: user_id=$userId, device_id=$deviceId");

    session_write_close();
    ApiResponse::success(['updated' => $stmt->rowCount() > 0], ['timestamp' => date('c')]);
}

// DELETE - Remover dispositivo
if ($method === 'DELETE') {
    requireCsrf();

    $deviceId = $_GET['id'] ?? null;
    if (!$deviceId) {
        session_write_close();
        ApiResponse::error('ID_REQUIRED', 400, ['message' => 'ID obrigatorio']);
    }

    $stmt = $pdo->prepare("UPDATE app_user_devices SET deleted_at = NOW(3), is_current = 0 WHERE id = ? AND user_id = ?");
    $stmt->execute([$deviceId, $userId]);

    error_log("DEVICE_DELETED: user_id=$userId, device_id=$deviceId");

    session_write_close();
    ApiResponse::success(['deleted' => $stmt->rowCount() > 0], ['timestamp' => date('c')]);
}

session_write_close();
ApiResponse::error('INVALID_ACTION', 400, ['message' => 'Acao invalida']);
