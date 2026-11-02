<?php
declare(strict_types=1);

// /api/user/preferences.php - Preferencias do usuario
// @version 2.1.0-ENTERPRISE
// @updated 2026-01-21
// P1.2 FIX: Migrado para requireCsrf()

require_once __DIR__ . '/../_helpers/ApiResponse.php';
require_once __DIR__ . '/../_helpers/AuthHelpers.php';
require_once __DIR__ . '/../../config/db_connection.php';
require_once __DIR__ . '/../core/CorsPolicy.php';
require_once __DIR__ . '/../core/SessionGate.php';

CorsPolicy::setupApiEndpoint([
    'methods' => ['GET', 'POST', 'OPTIONS'],
    'no_cache' => true
]);

$method = $_SERVER['REQUEST_METHOD'] ?? '';
if (!in_array($method, ['GET', 'POST'], true)) {
    header('Allow: GET, POST, OPTIONS');
    ApiResponse::error(ApiResponse::ERR_METHOD_NOT_ALLOWED, 405);
}

// FIX: init() não existe, usar start(); isAuthenticated() não existe, usar validate()
SessionGate::start();

if (!SessionGate::validate()) {
    ApiResponse::error(ApiResponse::ERR_NOT_AUTHENTICATED, 401);
}

$userId = SessionGate::getUserId();

try {
    $pdo = getConnection('DSHOWDASH');

    if ($method === 'GET') {
        $stmt = $pdo->prepare("SELECT pref_key, pref_value, pref_type FROM app_user_preferences WHERE user_id = :uid AND deleted_at IS NULL");
        $stmt->execute([':uid' => $userId]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $preferences = [];
        foreach ($rows as $row) {
            $val = $row['pref_value'];
            if ($row['pref_type'] === 'json') $val = json_decode($val, true);
            elseif ($row['pref_type'] === 'number') $val = (float)$val;
            elseif ($row['pref_type'] === 'boolean') $val = $val === '1' || $val === 'true';
            $preferences[$row['pref_key']] = $val;
        }

        session_write_close();
        ApiResponse::success(['preferences' => (object)$preferences], ['timestamp' => date('c')]);
    }

    if ($method === 'POST') {
        requireCsrf();

        $input = json_decode(file_get_contents('php://input'), true);
        $key = $input['key'] ?? null;
        $value = $input['value'] ?? null;

        if (!$key) {
            session_write_close();
            ApiResponse::error('MISSING_KEY', 400, ['message' => 'Key obrigatoria']);
        }

        $type = 'string';
        $storeValue = $value;
        if (is_array($value)) { $type = 'json'; $storeValue = json_encode($value); }
        elseif (is_bool($value)) { $type = 'boolean'; $storeValue = $value ? '1' : '0'; }
        elseif (is_numeric($value)) { $type = 'number'; $storeValue = (string)$value; }

        $stmt = $pdo->prepare("SELECT id FROM app_user_preferences WHERE user_id = :uid AND pref_key = :key AND deleted_at IS NULL");
        $stmt->execute([':uid' => $userId, ':key' => $key]);
        $existing = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($existing) {
            $stmt = $pdo->prepare("UPDATE app_user_preferences SET pref_value = :val, pref_type = :type, updated_at = NOW() WHERE id = :id");
            $stmt->execute([':val' => $storeValue, ':type' => $type, ':id' => $existing['id']]);
        } else {
            $stmt = $pdo->prepare("INSERT INTO app_user_preferences (user_id, pref_key, pref_value, pref_type) VALUES (:uid, :key, :val, :type)");
            $stmt->execute([':uid' => $userId, ':key' => $key, ':val' => $storeValue, ':type' => $type]);
        }

        error_log("PREFERENCE_SAVED: user_id=$userId, key=$key");

        session_write_close();
        ApiResponse::success(null, ['message' => 'Preferencia salva', 'timestamp' => date('c')]);
    }

} catch (PDOException $e) {
    error_log("[preferences.php] Error: " . $e->getMessage());
    session_write_close();
    ApiResponse::error(ApiResponse::ERR_DATABASE_ERROR, 500, ['message' => 'Erro interno']);
}
