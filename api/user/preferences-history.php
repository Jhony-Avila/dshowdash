<?php
declare(strict_types=1);

// /api/user/preferences-history.php
// @version 2.1.0-ENTERPRISE - Migrado para requireCsrf()
// @updated 2026-01-21
// P1.2: Migrado CSRF manual para requireCsrf() centralizado
// P0.1 FIX: Migrado para CorsPolicy::setupApiEndpoint()
// P1.1 FIX: Contrato padronizado para 'ok'

require_once __DIR__ . '/../core/CorsPolicy.php';
require_once __DIR__ . '/../core/SessionGate.php';
require_once __DIR__ . '/../_helpers/ApiResponse.php';
require_once __DIR__ . '/../_helpers/AuthHelpers.php';
require_once __DIR__ . '/../../config/db_connection.php';

CorsPolicy::setupApiEndpoint([
    'methods' => ['GET', 'POST', 'OPTIONS'],
    'no_cache' => true
]);

SessionGate::start();

if (!SessionGate::validate()) {
    ApiResponse::error(ApiResponse::ERR_NOT_AUTHENTICATED, 401);
}

$userId = SessionGate::getUserId();
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

function timeAgo($datetime) {
    $time = strtotime($datetime);
    $diff = time() - $time;
    if ($diff < 60) return 'agora';
    if ($diff < 3600) return floor($diff / 60) . ' min atrás';
    if ($diff < 86400) return floor($diff / 3600) . ' h atrás';
    if ($diff < 604800) return floor($diff / 86400) . ' dias atrás';
    return date('d/m/Y', $time);
}

try {
    $pdo = getConnection('DSHOWDASH');
    
    if ($method === 'GET') {
        $limit = isset($_GET['limit']) ? min((int)$_GET['limit'], 100) : 50;
        
        $stmt = $pdo->prepare("
            SELECT id, action, pref_key, old_value, new_value, created_at
            FROM app_user_preferences_history
            WHERE user_id = ?
            ORDER BY created_at DESC
            LIMIT ?
        ");
        $stmt->execute([$userId, $limit]);
        $history = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $formatted = array_map(function($item) {
            return [
                'id' => (int)$item['id'],
                'action' => $item['action'],
                'key' => $item['pref_key'],
                'oldValue' => $item['old_value'],
                'newValue' => $item['new_value'],
                'timestamp' => $item['created_at'],
                'timeAgo' => timeAgo($item['created_at'])
            ];
        }, $history);
        
        ApiResponse::success(['history' => $formatted], ['timestamp' => date('c')]);
    }
    
    if ($method === 'POST') {
        // P1.2: CSRF centralizado
        requireCsrf();
        
        $input = json_decode(file_get_contents('php://input'), true);
        $action = $input['action'] ?? null;
        $key = $input['key'] ?? null;
        
        if (!$action || !$key) {
            ApiResponse::error('MISSING_FIELDS', 400, ['message' => 'Campos obrigatórios: action, key']);
        }
        
        $validActions = ['create', 'update', 'delete', 'reset'];
        if (!in_array($action, $validActions, true)) {
            ApiResponse::error('INVALID_ACTION', 400, ['message' => 'Action inválida']);
        }
        
        $stmt = $pdo->prepare("
            INSERT INTO app_user_preferences_history (user_id, action, pref_key, old_value, new_value)
            VALUES (?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $userId,
            $action,
            $key,
            $input['old_value'] ?? null,
            $input['new_value'] ?? null
        ]);
        
        ApiResponse::success(['id' => $pdo->lastInsertId()], ['timestamp' => date('c')]);
    }
    
    ApiResponse::error('METHOD_NOT_ALLOWED', 405, ['message' => 'Método não permitido']);
    
} catch (PDOException $e) {
    error_log('preferences-history error: ' . $e->getMessage());
    ApiResponse::error(ApiResponse::ERR_DATABASE_ERROR, 500);
}
