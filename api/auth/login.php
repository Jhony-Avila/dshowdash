<?php
// Login API Controller
// @version 7.0.1-ENTERPRISE
// @description Controller orquestrador para autenticação (modularizado)
// v7.0.1: FIX - Removido use statement inválido (CorsPolicy é classe global)
// v7.0.0: Modularização completa - Controller/Service/Repository/Validator/Helpers
// v6.3.1: FIX - Corrigido coluna details -> event_context_json
// P3.8: FIX - Removido SessionGate::refresh() duplicado

declare(strict_types=1);

require_once __DIR__ . '/../_helpers/ApiResponse.php';
require_once __DIR__ . '/../../config/db_connection.php';
require_once __DIR__ . '/../core/CorsPolicy.php';
require_once __DIR__ . '/_rate_limit.php';
require_once __DIR__ . '/helpers/DeviceDetector.php';
require_once __DIR__ . '/validators/LoginValidator.php';
require_once __DIR__ . '/services/AuthService.php';

// ════════════════════════════════════════════════════════════════════════════
// SETUP
// ════════════════════════════════════════════════════════════════════════════

CorsPolicy::setupApiEndpoint([
    'methods' => ['POST', 'OPTIONS'],
    'no_cache' => true
]);

// ════════════════════════════════════════════════════════════════════════════
// VALIDAR REQUEST
// ════════════════════════════════════════════════════════════════════════════

$requestError = LoginValidator::validateRequest();
if ($requestError) {
    if ($requestError['code'] === 405) {
        header('Allow: POST, OPTIONS');
    }
    ApiResponse::error($requestError['error'], $requestError['code'], ['message' => $requestError['message']]);
}

// ════════════════════════════════════════════════════════════════════════════
// PROCESSAR PAYLOAD
// ════════════════════════════════════════════════════════════════════════════

$raw = file_get_contents('php://input') ?: '';
$payloadResult = LoginValidator::validatePayload($raw);

if (!$payloadResult['success']) {
    ApiResponse::error($payloadResult['error'], $payloadResult['code'], ['message' => $payloadResult['message']]);
}

$credentialsResult = LoginValidator::validateCredentials($payloadResult['data']);

if (!$credentialsResult['success']) {
    ApiResponse::error($credentialsResult['error'], $credentialsResult['code'], ['message' => $credentialsResult['message']]);
}

$login = $credentialsResult['login'];
$password = $credentialsResult['password'];

// ════════════════════════════════════════════════════════════════════════════
// CONTEXTO DO CLIENTE
// ════════════════════════════════════════════════════════════════════════════

$clientIp = DeviceDetector::getRealClientIp();
$deviceInfo = DeviceDetector::detectDevice();

// ════════════════════════════════════════════════════════════════════════════
// CONEXÃO COM BANCO
// ════════════════════════════════════════════════════════════════════════════

try {
    $pdo = getConnection('DSHOWDASH');
} catch (Exception $e) {
    error_log("LOGIN DB ERROR: " . $e->getMessage());
    ApiResponse::error(ApiResponse::ERR_DATABASE_ERROR, 503, ['message' => 'Erro de conexão com banco de dados']);
}

// ════════════════════════════════════════════════════════════════════════════
// RATE LIMIT
// ════════════════════════════════════════════════════════════════════════════

$rateLimit = new RateLimit($pdo);
$rateLimitCheck = $rateLimit->checkLimit($clientIp, $login);

if (!$rateLimitCheck['allowed']) {
    $retryAfter = $rateLimitCheck['retry_after'] ?? 300;
    error_log("LOGIN BLOCKED: IP=$clientIp, USER=$login (rate limit)");

    $authRepo = new AuthRepository($pdo);
    $authRepo->logSecurityEvent(null, 'login_blocked', 'warning', $clientIp, json_encode([
        'username' => $login,
        'reason' => $rateLimitCheck['reason'] ?? 'rate_limit_exceeded',
        'retry_after' => $retryAfter
    ]));

    ApiResponse::error('RATE_LIMITED', 429, [
        'message' => 'Muitas tentativas de login. Tente novamente mais tarde.',
        'retry_after' => $retryAfter,
        'reason' => $rateLimitCheck['reason'] ?? 'rate_limit_exceeded'
    ]);
}

// ════════════════════════════════════════════════════════════════════════════
// AUTENTICAÇÃO
// ════════════════════════════════════════════════════════════════════════════

$authService = new AuthService($pdo);
$result = $authService->authenticate($login, $password, $clientIp, $deviceInfo);

if (!$result['success']) {
    $rateLimit->recordAttempt($clientIp, $login, false);
    usleep(random_int(400000, 800000));
    ApiResponse::error($result['error'], $result['code'], ['message' => $result['message']]);
}

// ════════════════════════════════════════════════════════════════════════════
// SUCESSO
// ════════════════════════════════════════════════════════════════════════════

$rateLimit->recordAttempt($clientIp, $login, true);

ApiResponse::success([
    'user' => $result['user'],
    'session' => $result['session']
]);
