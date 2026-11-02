<?php
declare(strict_types=1);

// /api/user/saved-views.php - Views salvos do usuario
// @version 2.1.0-ENTERPRISE - Migrado para requireCsrf()
// @updated 2026-01-21
// P1.2: Migrado CSRF manual para requireCsrf() centralizado

require_once __DIR__ . '/../_helpers/ApiResponse.php';
require_once __DIR__ . '/../_helpers/AuthHelpers.php';
require_once __DIR__ . '/../../config/db_connection.php';
require_once __DIR__ . '/../core/CorsPolicy.php';
require_once __DIR__ . '/../core/SessionGate.php';

// Setup CORS e headers
CorsPolicy::setupApiEndpoint([
    'methods' => ['GET', 'POST', 'DELETE', 'OPTIONS'],
    'no_cache' => true
]);

// Validar metodo
$method = $_SERVER['REQUEST_METHOD'] ?? '';
if (!in_array($method, ['GET', 'POST', 'DELETE'], true)) {
    header('Allow: GET, POST, DELETE, OPTIONS');
    ApiResponse::error(ApiResponse::ERR_METHOD_NOT_ALLOWED, 405);
}

// Inicializar sessao
SessionGate::start();

// Requer autenticacao
if (!SessionGate::validate()) {
    ApiResponse::error(ApiResponse::ERR_NOT_AUTHENTICATED, 401);
}

$userId = SessionGate::getUserId();
$pathParts = explode('/', trim($_SERVER['PATH_INFO'] ?? '', '/'));
$viewId = $pathParts[0] ?? null;

try {
    $pdo = getConnection('DSHOWDASH');

    if ($method === 'GET') {
        $stmt = $pdo->prepare("SELECT id, view_key, view_label, view_type, view_json, is_default, is_shared, usage_count, last_used_at FROM app_user_saved_views WHERE user_id = :uid AND deleted_at IS NULL ORDER BY is_default DESC, view_label ASC");
        $stmt->execute([':uid' => $userId]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $views = [];
        foreach ($rows as $row) {
            $views[] = [
                'id' => (int)$row['id'],
                'key' => $row['view_key'],
                'label' => $row['view_label'],
                'type' => $row['view_type'],
                'config' => $row['view_json'] ? json_decode($row['view_json'], true) : [],
                'isDefault' => (bool)$row['is_default'],
                'isShared' => (bool)$row['is_shared'],
                'usageCount' => (int)$row['usage_count'],
                'lastUsedAt' => $row['last_used_at']
            ];
        }

        session_write_close();
        ApiResponse::success(['views' => $views], ['timestamp' => date('c')]);
    }

    if ($method === 'POST') {
        // P1.2: CSRF centralizado
        requireCsrf();

        $input = json_decode(file_get_contents('php://input'), true);
        $key = $input['key'] ?? null;
        $label = $input['label'] ?? $key;
        $type = $input['type'] ?? 'custom';
        $config = $input['config'] ?? [];
        $isDefault = !empty($input['isDefault']);

        if (!$key) {
            session_write_close();
            ApiResponse::error('MISSING_KEY', 400, ['message' => 'Key obrigatoria']);
        }

        if ($isDefault) {
            $stmt = $pdo->prepare("UPDATE app_user_saved_views SET is_default = 0 WHERE user_id = :uid");
            $stmt->execute([':uid' => $userId]);
        }

        $stmt = $pdo->prepare("SELECT id FROM app_user_saved_views WHERE user_id = :uid AND view_key = :key AND deleted_at IS NULL");
        $stmt->execute([':uid' => $userId, ':key' => $key]);
        $existing = $stmt->fetch(PDO::FETCH_ASSOC);

        $viewJson = json_encode($config);

        if ($existing) {
            $stmt = $pdo->prepare("UPDATE app_user_saved_views SET view_label = :label, view_type = :type, view_json = :vj, is_default = :def, updated_at = NOW() WHERE id = :id");
            $stmt->execute([':label' => $label, ':type' => $type, ':vj' => $viewJson, ':def' => $isDefault ? 1 : 0, ':id' => $existing['id']]);
            $newId = $existing['id'];
        } else {
            $stmt = $pdo->prepare("INSERT INTO app_user_saved_views (user_id, view_key, view_label, view_type, view_json, is_default) VALUES (:uid, :key, :label, :type, :vj, :def)");
            $stmt->execute([':uid' => $userId, ':key' => $key, ':label' => $label, ':type' => $type, ':vj' => $viewJson, ':def' => $isDefault ? 1 : 0]);
            $newId = $pdo->lastInsertId();
        }

        error_log("SAVED_VIEW_CREATED: user_id=$userId, key=$key");

        session_write_close();
        ApiResponse::success(['id' => (int)$newId], ['message' => 'View salva', 'timestamp' => date('c')]);
    }

    if ($method === 'DELETE') {
        // P1.2: CSRF centralizado
        requireCsrf();

        if (!$viewId) {
            session_write_close();
            ApiResponse::error('MISSING_ID', 400, ['message' => 'View ID obrigatorio']);
        }

        $stmt = $pdo->prepare("UPDATE app_user_saved_views SET deleted_at = NOW() WHERE user_id = :uid AND id = :id");
        $stmt->execute([':uid' => $userId, ':id' => (int)$viewId]);

        error_log("SAVED_VIEW_DELETED: user_id=$userId, view_id=$viewId");

        session_write_close();
        ApiResponse::success(null, ['message' => 'View excluida', 'timestamp' => date('c')]);
    }

} catch (PDOException $e) {
    error_log("[saved-views.php] Error: " . $e->getMessage());
    session_write_close();
    ApiResponse::error(ApiResponse::ERR_DATABASE_ERROR, 500, ['message' => 'Erro interno']);
}
