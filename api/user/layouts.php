<?php
declare(strict_types=1);

// /api/user/layouts.php - Layouts de UI do usuario
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
$layoutKey = $pathParts[0] ?? null;

try {
    $pdo = getConnection('DSHOWDASH');

    if ($method === 'GET') {
        $stmt = $pdo->prepare("SELECT layout_key, layout_name, layout_json, is_default FROM app_user_ui_layouts WHERE user_id = :uid AND is_active = 1 AND deleted_at IS NULL ORDER BY is_default DESC, layout_name ASC");
        $stmt->execute([':uid' => $userId]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $layouts = [];
        $defaultKey = null;
        foreach ($rows as $row) {
            $layouts[] = [
                'key' => $row['layout_key'],
                'name' => $row['layout_name'],
                'config' => $row['layout_json'] ? json_decode($row['layout_json'], true) : []
            ];
            if ($row['is_default']) $defaultKey = $row['layout_key'];
        }

        session_write_close();
        ApiResponse::success(['layouts' => $layouts, 'items' => $layouts, 'defaultKey' => $defaultKey], ['timestamp' => date('c')]);
    }

    if ($method === 'POST') {
        // P1.2: CSRF centralizado
        requireCsrf();

        $input = json_decode(file_get_contents('php://input'), true);
        $key = $input['key'] ?? null;
        $config = $input['config'] ?? [];
        $isDefault = !empty($input['isDefault']);

        if (!$key) {
            session_write_close();
            ApiResponse::error('MISSING_KEY', 400, ['message' => 'Key obrigatoria']);
        }

        if ($isDefault) {
            $stmt = $pdo->prepare("UPDATE app_user_ui_layouts SET is_default = 0 WHERE user_id = :uid");
            $stmt->execute([':uid' => $userId]);
        }

        $stmt = $pdo->prepare("SELECT id FROM app_user_ui_layouts WHERE user_id = :uid AND layout_key = :key AND deleted_at IS NULL");
        $stmt->execute([':uid' => $userId, ':key' => $key]);
        $existing = $stmt->fetch(PDO::FETCH_ASSOC);

        $layoutJson = json_encode($config);

        if ($existing) {
            $stmt = $pdo->prepare("UPDATE app_user_ui_layouts SET layout_json = :lj, is_default = :def, is_active = 1, updated_at = NOW() WHERE id = :id");
            $stmt->execute([':lj' => $layoutJson, ':def' => $isDefault ? 1 : 0, ':id' => $existing['id']]);
        } else {
            $stmt = $pdo->prepare("INSERT INTO app_user_ui_layouts (user_id, layout_key, layout_name, layout_json, is_default, is_active) VALUES (:uid, :key, :name, :lj, :def, 1)");
            $stmt->execute([':uid' => $userId, ':key' => $key, ':name' => $key, ':lj' => $layoutJson, ':def' => $isDefault ? 1 : 0]);
        }

        error_log("LAYOUT_SAVED: user_id=$userId, key=$key");

        session_write_close();
        ApiResponse::success(null, ['message' => 'Layout salvo', 'timestamp' => date('c')]);
    }

    if ($method === 'DELETE') {
        // P1.2: CSRF centralizado
        requireCsrf();

        if (!$layoutKey) {
            session_write_close();
            ApiResponse::error('MISSING_KEY', 400, ['message' => 'Layout key obrigatoria']);
        }

        $stmt = $pdo->prepare("UPDATE app_user_ui_layouts SET deleted_at = NOW() WHERE user_id = :uid AND layout_key = :key");
        $stmt->execute([':uid' => $userId, ':key' => $layoutKey]);

        error_log("LAYOUT_DELETED: user_id=$userId, key=$layoutKey");

        session_write_close();
        ApiResponse::success(null, ['message' => 'Layout excluido', 'timestamp' => date('c')]);
    }

} catch (PDOException $e) {
    error_log("[layouts.php] Error: " . $e->getMessage());
    session_write_close();
    ApiResponse::error(ApiResponse::ERR_DATABASE_ERROR, 500, ['message' => 'Erro interno']);
}
