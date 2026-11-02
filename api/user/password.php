<?php
declare(strict_types=1);

// /api/user/password.php - Alteracao de senha (endpoint alternativo)
// @version 2.1.0-ENTERPRISE - Migrado para requireCsrf()
// @updated 2026-01-21
// P1.2: Migrado CSRF manual para requireCsrf() centralizado
// NOTA: Endpoint principal e /api/users/change-password.php

require_once __DIR__ . '/../_helpers/ApiResponse.php';
require_once __DIR__ . '/../_helpers/AuthHelpers.php';
require_once __DIR__ . '/../../config/db_connection.php';
require_once __DIR__ . '/../core/CorsPolicy.php';
require_once __DIR__ . '/../core/SessionGate.php';

// Setup CORS e headers
CorsPolicy::setupApiEndpoint([
    'methods' => ['POST', 'OPTIONS'],
    'no_cache' => true
]);

// Validar metodo
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST, OPTIONS');
    ApiResponse::error(ApiResponse::ERR_METHOD_NOT_ALLOWED, 405);
}

// Inicializar sessao
SessionGate::start();

// Requer autenticacao
if (!SessionGate::validate()) {
    ApiResponse::error(ApiResponse::ERR_NOT_AUTHENTICATED, 401);
}

// P1.2: CSRF centralizado
requireCsrf();

$userId = SessionGate::getUserId();
$clientIp = $_SERVER['REMOTE_ADDR'] ?? 'unknown';

$input = json_decode(file_get_contents('php://input'), true);

if (!$input || empty($input['current_password']) || empty($input['new_password'])) {
    session_write_close();
    ApiResponse::error('MISSING_FIELDS', 400, ['message' => 'current_password e new_password sao obrigatorios']);
}

$currentPassword = $input['current_password'];
$newPassword = $input['new_password'];

// Minimo 8 caracteres (padrao de seguranca)
if (strlen($newPassword) < 8) {
    session_write_close();
    ApiResponse::error('WEAK_PASSWORD', 400, ['message' => 'Nova senha deve ter pelo menos 8 caracteres']);
}

if ($currentPassword === $newPassword) {
    session_write_close();
    ApiResponse::error('SAME_PASSWORD', 400, ['message' => 'A nova senha deve ser diferente da atual']);
}

try {
    $pdo = getConnection('DSHOWDASH');

    $stmt = $pdo->prepare("SELECT password FROM app_users WHERE id = ? AND deleted_at IS NULL");
    $stmt->execute([$userId]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        session_write_close();
        ApiResponse::error('USER_NOT_FOUND', 404, ['message' => 'Usuario nao encontrado']);
    }

    if (!password_verify($currentPassword, $user['password'])) {
        // Registrar tentativa falha
        $stmt = $pdo->prepare("
            INSERT INTO app_user_security_events (user_id, event_type, event_severity, ip_address, user_agent)
            VALUES (?, 'password_change_failed', 'warning', ?, ?)
        ");
        $stmt->execute([$userId, $clientIp, $_SERVER['HTTP_USER_AGENT'] ?? null]);

        error_log("PASSWORD_CHANGE_FAILED: user_id=$userId, ip=$clientIp");

        usleep(random_int(400000, 800000)); // Delay aleatorio
        session_write_close();
        ApiResponse::error('WRONG_PASSWORD', 400, ['message' => 'Senha atual incorreta']);
    }

    // Atualizar senha
    $newHash = password_hash($newPassword, PASSWORD_DEFAULT);
    $stmt = $pdo->prepare("UPDATE app_users SET password = ?, updated_at = NOW() WHERE id = ?");
    $stmt->execute([$newHash, $userId]);

    // Registrar evento de alteracao
    $stmt = $pdo->prepare("
        INSERT INTO app_user_security_events (user_id, event_type, event_severity, ip_address, user_agent)
        VALUES (?, 'password_change', 'info', ?, ?)
    ");
    $stmt->execute([$userId, $clientIp, $_SERVER['HTTP_USER_AGENT'] ?? null]);

    error_log("PASSWORD_CHANGED: user_id=$userId, ip=$clientIp");

    session_write_close();

    ApiResponse::success(null, ['message' => 'Senha alterada com sucesso', 'timestamp' => date('c')]);

} catch (PDOException $e) {
    error_log("[password.php] Database error: " . $e->getMessage());
    session_write_close();
    ApiResponse::error(ApiResponse::ERR_DATABASE_ERROR, 503, ['message' => 'Erro de conexao com banco de dados']);
} catch (Exception $e) {
    error_log("[password.php] Error: " . $e->getMessage());
    session_write_close();
    ApiResponse::error('INTERNAL_ERROR', 500, ['message' => 'Erro interno do servidor']);
}
