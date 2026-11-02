<?php
// API: Change Password
// @version 2.2.0-ENTERPRISE
// @since 2025-01
// @updated 2026-01-25 - Migrado para getConnection() centralizado
// v2.2.0: Removida getDbConnection() local

declare(strict_types=1);

require_once __DIR__ . '/../_helpers/ApiResponse.php';
require_once __DIR__ . '/../_helpers/AuthHelpers.php';
require_once __DIR__ . '/../core/CorsPolicy.php';
require_once __DIR__ . '/../core/SessionGate.php';
require_once __DIR__ . '/../../config/db_connection.php';

CorsPolicy::apply();
SessionGate::start();
AuthHelpers::requireAuth();

$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'POST') {
    ApiResponse::error('METHOD_NOT_ALLOWED', 405);
    exit;
}

AuthHelpers::requireCsrf();

$userId = $_SESSION['user_id'] ?? null;

if (!$userId) {
    ApiResponse::error('UNAUTHORIZED', 401);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

$currentPassword = $input['current_password'] ?? null;
$newPassword = $input['new_password'] ?? null;
$confirmPassword = $input['confirm_password'] ?? null;

if (!$currentPassword || !$newPassword || !$confirmPassword) {
    ApiResponse::error('MISSING_FIELDS', 400, ['message' => 'Todos os campos são obrigatórios']);
    exit;
}

if ($newPassword !== $confirmPassword) {
    ApiResponse::error('PASSWORD_MISMATCH', 400, ['message' => 'As senhas não coincidem']);
    exit;
}

if (strlen($newPassword) < 8) {
    ApiResponse::error('PASSWORD_TOO_SHORT', 400, ['message' => 'A senha deve ter pelo menos 8 caracteres']);
    exit;
}

try {
    $pdo = getConnection('DSHOWDASH');

    $stmt = $pdo->prepare("SELECT password FROM app_users WHERE id = ?");
    $stmt->execute([$userId]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        ApiResponse::error('USER_NOT_FOUND', 404);
        exit;
    }

    if (!password_verify($currentPassword, $user['password'])) {
        ApiResponse::error('INVALID_CURRENT_PASSWORD', 401, ['message' => 'Senha atual incorreta']);
        exit;
    }

    $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);

    $stmt = $pdo->prepare("UPDATE app_users SET password = ?, updated_at = NOW() WHERE id = ?");
    $stmt->execute([$hashedPassword, $userId]);

    ApiResponse::success(['message' => 'Senha alterada com sucesso']);

} catch (Exception $e) {
    error_log("ChangePassword error: " . $e->getMessage());
    ApiResponse::error('DATABASE_ERROR', 500);
}
