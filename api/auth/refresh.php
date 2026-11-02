<?php
// Session Refresh API Controller
// @version 8.0.0-ENTERPRISE
// @description Controller orquestrador para refresh de sessão (modularizado)
// @created 2026-01-25
// @updated 2026-01-25
// v8.0.0: INTEGRAÇÃO COMPLETA - LoggerTrait para logging estruturado
// v7.0.0: FASE 3 - #16 Request ID tracking integrado
// v6.0.0: FASE 1 - #6 Rate Limiting, #7 CSRF Rotation, #12 CSRF Age

declare(strict_types=1);

// ═══════════════════════════════════════════════════════════════
// CORS HEADERS + PREFLIGHT (ANTES DE QUALQUER COISA)
// ═══════════════════════════════════════════════════════════════
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowedOrigins = [
    'https://dshowdash.com.br',
    'https://www.dshowdash.com.br',
    'http://localhost:3000',
    'http://127.0.0.1:3000'
];

if ($origin && (in_array($origin, $allowedOrigins, true) || preg_match('#^https?://([\w-]+\.)?dshowdash\.com\.br$#', $origin))) {
    header("Access-Control-Allow-Origin: $origin");
    header('Access-Control-Allow-Credentials: true');
    header('Vary: Origin');
}
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept, X-Requested-With, X-CSRF-Token, Authorization');
header('Access-Control-Max-Age: 86400');

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// ═══════════════════════════════════════════════════════════════
// DEPENDÊNCIAS (após OPTIONS)
// ═══════════════════════════════════════════════════════════════
require_once __DIR__ . '/../_helpers/ApiResponse.php';
require_once __DIR__ . '/../../config/db_connection.php';
require_once __DIR__ . '/validators/RefreshValidator.php';
require_once __DIR__ . '/services/AuthService.php';
require_once __DIR__ . '/helpers/DeviceDetector.php';
require_once __DIR__ . '/_rate_limit.php';
require_once __DIR__ . '/../core/SessionGate.php';
require_once __DIR__ . '/../core/traits/LoggerTrait.php';

// Helper class para usar LoggerTrait
class RefreshLogger { use LoggerTrait; }

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0, private');
header('Pragma: no-cache');

// ═══════════════════════════════════════════════════════════════
// #16: REQUEST ID TRACKING (início do request)
// ═══════════════════════════════════════════════════════════════
$requestId = SessionGate::getRequestId();
header("X-Request-ID: $requestId");

// ═══════════════════════════════════════════════════════════════
// VALIDAR REQUEST METHOD
// ═══════════════════════════════════════════════════════════════
$requestError = RefreshValidator::validateRequest();
if ($requestError) {
    header('Allow: POST, OPTIONS');
    RefreshLogger::logWarning('refresh', 'invalid_method', ['request_id' => $requestId]);
    ApiResponse::error($requestError['error'], $requestError['code'], [
        'message' => $requestError['message'],
        'request_id' => $requestId
    ]);
}

// ═══════════════════════════════════════════════════════════════
// CONTEXTO DO CLIENTE (antes de rate limit)
// ═══════════════════════════════════════════════════════════════
$clientIp = DeviceDetector::getRealClientIp();

// ═══════════════════════════════════════════════════════════════
// #6: RATE LIMITING (antes de processar)
// ═══════════════════════════════════════════════════════════════
try {
    $pdo = getConnection('DSHOWDASH');
    $rateLimit = new RateLimit($pdo);
    $rateLimitCheck = $rateLimit->checkLimit($clientIp, 'refresh_attempt');
    
    if (!$rateLimitCheck['allowed']) {
        $retryAfter = $rateLimitCheck['retry_after'] ?? 300;
        RefreshLogger::logWarning('refresh', 'rate_limited', [
            'ip' => $clientIp,
            'retry_after' => $retryAfter,
            'request_id' => $requestId
        ]);
        ApiResponse::error('RATE_LIMITED', 429, [
            'message' => 'Muitas tentativas. Tente novamente mais tarde.',
            'retry_after' => $retryAfter,
            'request_id' => $requestId
        ]);
    }
} catch (\Exception $e) {
    RefreshLogger::logError('refresh', 'rate_limit_error', [
        'error' => $e->getMessage(),
        'request_id' => $requestId
    ]);
}

// ═══════════════════════════════════════════════════════════════
// LER SESSÃO (READ-ONLY, SEM INICIAR SESSÃO PHP)
// ═══════════════════════════════════════════════════════════════
$sessionData = RefreshValidator::readSessionData();
$csrfToken = RefreshValidator::extractCsrfToken();

// ═══════════════════════════════════════════════════════════════
// VALIDAR CSRF
// ═══════════════════════════════════════════════════════════════
$csrfError = RefreshValidator::validateCsrf($csrfToken, $sessionData['csrf']);
if ($csrfError) {
    try {
        $pdo = $pdo ?? getConnection('DSHOWDASH');
        $authService = new AuthService($pdo);
        $authService->logCsrfFailure($clientIp, 'refresh', $sessionData['user_id']);
        
        if (isset($rateLimit)) {
            $rateLimit->recordAttempt($clientIp, 'refresh_attempt', false);
        }
    } catch (\Exception $e) {
        RefreshLogger::logError('refresh', 'csrf_log_error', [
            'error' => $e->getMessage(),
            'request_id' => $requestId
        ]);
    }
    
    RefreshLogger::logSecurity('refresh', 'csrf_validation_failed', [
        'ip' => $clientIp,
        'user_id' => $sessionData['user_id'] ?? null,
        'request_id' => $requestId
    ]);
    
    ApiResponse::error($csrfError['error'], $csrfError['code'], [
        'message' => $csrfError['message'],
        'request_id' => $requestId
    ]);
}

// ═══════════════════════════════════════════════════════════════
// #12: VALIDAR IDADE DO CSRF TOKEN
// ═══════════════════════════════════════════════════════════════
$csrfCreatedAt = $sessionData['csrf_created_at'] ?? null;
if ($csrfCreatedAt !== null) {
    $csrfAge = time() - $csrfCreatedAt;
    if ($csrfAge > SessionGate::CSRF_TOKEN_MAX_AGE) {
        RefreshLogger::logSecurity('refresh', 'csrf_token_expired', [
            'age' => $csrfAge,
            'max_age' => SessionGate::CSRF_TOKEN_MAX_AGE,
            'user_id' => $sessionData['user_id'] ?? null,
            'request_id' => $requestId
        ]);
        ApiResponse::error('CSRF_EXPIRED', 403, [
            'message' => 'Token de segurança expirado. Recarregue a página.',
            'token_age' => $csrfAge,
            'request_id' => $requestId
        ]);
    }
}

// ═══════════════════════════════════════════════════════════════
// VALIDAR AUTENTICAÇÃO (após CSRF)
// ═══════════════════════════════════════════════════════════════
$authError = RefreshValidator::validateAuth($sessionData['user_id']);
if ($authError) {
    RefreshLogger::logWarning('refresh', 'unauthorized', ['request_id' => $requestId]);
    ApiResponse::error($authError['error'], $authError['code'], [
        'message' => $authError['message'],
        'request_id' => $requestId
    ]);
}

// ═══════════════════════════════════════════════════════════════
// CONEXÃO COM BANCO
// ═══════════════════════════════════════════════════════════════
try {
    $pdo = $pdo ?? getConnection('DSHOWDASH');
} catch (\Exception $e) {
    RefreshLogger::logError('refresh', 'db_connection_error', [
        'error' => $e->getMessage(),
        'request_id' => $requestId
    ]);
    ApiResponse::error(ApiResponse::ERR_DATABASE_ERROR, 503, [
        'message' => 'Erro de conexão com banco de dados',
        'request_id' => $requestId
    ]);
}

// ═══════════════════════════════════════════════════════════════
// EXECUTAR REFRESH VIA SERVICE
// ═══════════════════════════════════════════════════════════════
$authService = new AuthService($pdo);

$userId = $sessionData['user_id'];
$sessionToken = $_COOKIE['DSHOWSESS'] ?? '';

$result = $authService->refreshSession($userId, $sessionToken, $clientIp);

if (!$result['success']) {
    if (isset($rateLimit)) {
        $rateLimit->recordAttempt($clientIp, 'refresh_attempt', false);
    }
    
    RefreshLogger::logError('refresh', 'refresh_failed', [
        'user_id' => $userId,
        'error' => $result['error'],
        'request_id' => $requestId
    ]);
    
    ApiResponse::error($result['error'], $result['code'] ?? 500, [
        'message' => $result['message'],
        'request_id' => $result['request_id'] ?? $requestId
    ]);
}

// Limpar rate limit após sucesso
if (isset($rateLimit)) {
    $rateLimit->clearAttempts($clientIp, 'refresh_attempt');
}

RefreshLogger::logInfo('refresh', 'refresh_success', [
    'user_id' => $userId,
    'request_id' => $requestId
]);

// ═══════════════════════════════════════════════════════════════
// SUCESSO (com novo CSRF token rotacionado - #7)
// ═══════════════════════════════════════════════════════════════
ApiResponse::success([
    'message' => $result['data']['message'] ?? 'Sessão renovada com sucesso',
    'csrf_token' => $result['data']['csrf_token'] ?? null,
    'expires_at' => $result['data']['expires_at'] ?? null,
    'request_id' => $result['request_id'] ?? $requestId
]);
