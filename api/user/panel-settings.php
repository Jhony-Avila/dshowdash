<?php
declare(strict_types=1);

// /api/user/panel-settings.php - Configuracoes de paineis do usuario
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
    'methods' => ['GET', 'POST', 'OPTIONS'],
    'no_cache' => true
]);

// Validar metodo
$method = $_SERVER['REQUEST_METHOD'] ?? '';
if ($method !== 'GET' && $method !== 'POST') {
    header('Allow: GET, POST, OPTIONS');
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
$panelId = $pathParts[0] ?? null;

try {
    $pdo = getConnection('DSHOWDASH');

    if ($method === 'GET') {
        $stmt = $pdo->prepare("SELECT panel_id, settings_json, is_visible, position FROM app_user_panel_settings WHERE user_id = :uid AND deleted_at IS NULL");
        $stmt->execute([':uid' => $userId]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $settings = [];
        foreach ($rows as $row) {
            $settings[$row['panel_id']] = [
                'settings' => $row['settings_json'] ? json_decode($row['settings_json'], true) : [],
                'is_visible' => (bool)$row['is_visible'],
                'position' => (int)$row['position']
            ];
        }

        session_write_close();
        ApiResponse::success(['settings' => $settings], ['timestamp' => date('c')]);
    }

    if ($method === 'POST') {
        // P1.2: CSRF centralizado
        requireCsrf();

        if (!$panelId) {
            session_write_close();
            ApiResponse::error('MISSING_PANEL_ID', 400, ['message' => 'Panel ID obrigatorio']);
        }

        $input = json_decode(file_get_contents('php://input'), true);

        $stmt = $pdo->prepare("SELECT id FROM app_user_panel_settings WHERE user_id = :uid AND panel_id = :pid AND deleted_at IS NULL");
        $stmt->execute([':uid' => $userId, ':pid' => $panelId]);
        $existing = $stmt->fetch(PDO::FETCH_ASSOC);

        $settingsJson = isset($input['settings']) ? json_encode($input['settings']) : null;
        $isVisible = isset($input['is_visible']) ? ($input['is_visible'] ? 1 : 0) : 1;
        $position = isset($input['position']) ? (int)$input['position'] : 0;

        if ($existing) {
            $stmt = $pdo->prepare("UPDATE app_user_panel_settings SET settings_json = COALESCE(:sj, settings_json), is_visible = :vis, position = :pos, updated_at = NOW() WHERE id = :id");
            $stmt->execute([':sj' => $settingsJson, ':vis' => $isVisible, ':pos' => $position, ':id' => $existing['id']]);
        } else {
            $stmt = $pdo->prepare("INSERT INTO app_user_panel_settings (user_id, panel_id, settings_json, is_visible, position) VALUES (:uid, :pid, :sj, :vis, :pos)");
            $stmt->execute([':uid' => $userId, ':pid' => $panelId, ':sj' => $settingsJson, ':vis' => $isVisible, ':pos' => $position]);
        }

        error_log("PANEL_SETTINGS_SAVED: user_id=$userId, panel_id=$panelId");

        session_write_close();
        ApiResponse::success(null, ['message' => 'Configuracao salva', 'timestamp' => date('c')]);
    }

} catch (PDOException $e) {
    error_log("[panel-settings.php] Error: " . $e->getMessage());
    session_write_close();
    ApiResponse::error(ApiResponse::ERR_DATABASE_ERROR, 500, ['message' => 'Erro interno']);
}
