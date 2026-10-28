<?php
declare(strict_types=1);

// /api/notifications/index.php - Gerenciamento de notificacoes
// @version 2.3.0-ENTERPRISE
// @updated 2026-01-21
// P1.2 FIX: Migrado para requireCsrf()
// P3.FIX: Corrigido SessionGate::start() e isActive()
// v2.3.0: Migrado para InputValidator

require_once __DIR__ . '/../_helpers/ApiResponse.php';
require_once __DIR__ . '/../_helpers/AuthHelpers.php';
require_once __DIR__ . '/../../config/db_connection.php';
require_once __DIR__ . '/../core/CorsPolicy.php';
require_once __DIR__ . '/../core/SessionGate.php';
require_once __DIR__ . '/../core/helpers/InputValidator.php';

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
$validator = InputValidator::fromGet();
$action = $validator->string('action', 'list', ['maxLength' => 50]);

try {
    $pdo = getConnection('DSHOWDASH');
} catch (Exception $e) {
    error_log("[notifications] DB Error: " . $e->getMessage());
    ApiResponse::error(ApiResponse::ERR_DATABASE_ERROR, 503);
}

// GET - Listar notificacoes
if ($method === 'GET' && $action === 'list') {
    $unreadOnly = $validator->string('unread', '0', ['maxLength' => 1]) === '1';
    $limit = min($validator->int('limit', 50), 100);

    $sql = "
        SELECT id, notification_type, category, title, message, priority,
               is_read, read_at, action_url, created_at, expires_at
        FROM app_notifications
        WHERE user_id = ?
          AND (expires_at IS NULL OR expires_at > NOW())
    ";
    if ($unreadOnly) {
        $sql .= " AND is_read = 0";
    }
    $sql .= " ORDER BY priority DESC, created_at DESC LIMIT ?";

    $stmt = $pdo->prepare($sql);
    $stmt->bindValue(1, $userId, PDO::PARAM_INT);
    $stmt->bindValue(2, $limit, PDO::PARAM_INT);
    $stmt->execute();
    $notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $stmt = $pdo->prepare("SELECT COUNT(*) FROM app_notifications WHERE user_id = ? AND is_read = 0 AND (expires_at IS NULL OR expires_at > NOW())");
    $stmt->execute([$userId]);
    $unreadCount = (int)$stmt->fetchColumn();

    session_write_close();

    ApiResponse::success([
        'notifications' => $notifications,
        'unread_count' => $unreadCount,
        'total' => count($notifications)
    ], ['timestamp' => date('c')]);
}

// GET - Contar nao lidas
if ($method === 'GET' && $action === 'count') {
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM app_notifications WHERE user_id = ? AND is_read = 0 AND (expires_at IS NULL OR expires_at > NOW())");
    $stmt->execute([$userId]);
    $count = (int)$stmt->fetchColumn();

    session_write_close();

    ApiResponse::success(['unread_count' => $count], ['timestamp' => date('c')]);
}

// POST - Criar notificacao
if ($method === 'POST' && $action === 'create') {
    requireCsrf();

    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input || empty($input['title'])) {
        session_write_close();
        ApiResponse::error('TITLE_REQUIRED', 400, ['message' => 'Titulo obrigatorio']);
    }

    $targetUserId = $input['user_id'] ?? $userId;
    $type = $input['type'] ?? 'info';
    $category = $input['category'] ?? 'general';
    $title = substr($input['title'], 0, 200);
    $message = isset($input['message']) ? substr($input['message'], 0, 1000) : null;
    $priority = $input['priority'] ?? 'normal';
    $actionUrl = isset($input['action_url']) ? substr($input['action_url'], 0, 500) : null;
    $expiresAt = $input['expires_at'] ?? null;

    $stmt = $pdo->prepare("
        INSERT INTO app_notifications
        (user_id, notification_type, category, title, message, priority, action_url, expires_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute([$targetUserId, $type, $category, $title, $message, $priority, $actionUrl, $expiresAt]);

    $notificationId = $pdo->lastInsertId();

    error_log("NOTIFICATION_CREATED: user_id=$userId, notification_id=$notificationId");

    session_write_close();

    ApiResponse::success(['id' => (int)$notificationId], ['message' => 'Notificacao criada', 'timestamp' => date('c')]);
}

// PATCH - Marcar como lida
if ($method === 'PATCH' && $action === 'read') {
    requireCsrf();

    $notificationIdRaw = $validator->string('id', '', ['maxLength' => 20]);
    $notificationId = $notificationIdRaw === 'all' ? 'all' : ($validator->id('id', false) ?: null);

    if ($notificationIdRaw === 'all') {
        $stmt = $pdo->prepare("UPDATE app_notifications SET is_read = 1, read_at = NOW(3) WHERE user_id = ? AND is_read = 0");
        $stmt->execute([$userId]);

        error_log("NOTIFICATIONS_MARKED_ALL_READ: user_id=$userId, count=" . $stmt->rowCount());

        session_write_close();

        ApiResponse::success(['marked' => $stmt->rowCount()], ['message' => 'Todas marcadas como lidas', 'timestamp' => date('c')]);
    }

    if (!$notificationId) {
        session_write_close();
        ApiResponse::error('ID_REQUIRED', 400, ['message' => 'ID obrigatorio']);
    }

    $stmt = $pdo->prepare("UPDATE app_notifications SET is_read = 1, read_at = NOW(3) WHERE id = ? AND user_id = ?");
    $stmt->execute([$notificationId, $userId]);

    session_write_close();

    ApiResponse::success(['marked' => $stmt->rowCount() > 0], ['timestamp' => date('c')]);
}

// DELETE - Excluir notificacao
if ($method === 'DELETE') {
    requireCsrf();

    $notificationId = $validator->id('id', false);
    if (!$notificationId) {
        session_write_close();
        ApiResponse::error('ID_REQUIRED', 400, ['message' => 'ID obrigatorio']);
    }

    $stmt = $pdo->prepare("DELETE FROM app_notifications WHERE id = ? AND user_id = ?");
    $stmt->execute([$notificationId, $userId]);

    error_log("NOTIFICATION_DELETED: user_id=$userId, notification_id=$notificationId");

    session_write_close();

    ApiResponse::success(['deleted' => $stmt->rowCount() > 0], ['timestamp' => date('c')]);
}

session_write_close();
ApiResponse::error('INVALID_ACTION', 400, ['message' => 'Acao invalida']);
