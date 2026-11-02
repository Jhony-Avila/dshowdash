<?php
declare(strict_types=1);

// /api/auth/verify.php
// Verifica se a sessão é válida (HEAD/GET)
// @version 6.0.0-ENTERPRISE
// @updated 2026-01-25
// v6.0.0: P1 FIX - Usa SessionGate::readOnly() para HEAD, zero session_start manual

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
header('Access-Control-Allow-Methods: GET, HEAD, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept, X-Requested-With, X-CSRF-Token, Authorization');
header('Access-Control-Max-Age: 86400');

// OPTIONS → 204 e SAIR IMEDIATAMENTE (sem sessão, sem cookie)
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// ═══════════════════════════════════════════════════════════════
// DEPENDÊNCIAS (após OPTIONS)
// ═══════════════════════════════════════════════════════════════
require_once __DIR__ . '/../_helpers/ApiResponse.php';
require_once __DIR__ . '/../core/SessionGate.php';

header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0, private');
header('Pragma: no-cache');

$method = $_SERVER['REQUEST_METHOD'] ?? '';

// ═══════════════════════════════════════════════════════════════
// HEAD: Verificação rápida SEM emitir cookie
// P1 FIX: Usa SessionGate::readOnly() ao invés de session_start manual
// ═══════════════════════════════════════════════════════════════
if ($method === 'HEAD') {
    if (empty($_COOKIE['DSHOWSESS'])) {
        http_response_code(401);
        exit;
    }

    // P1 FIX: Leitura via SessionGate (sem emitir cookie)
    $sessionData = SessionGate::readOnly();
    $isValid = !empty($sessionData['user_id']);
    http_response_code($isValid ? 200 : 401);
    exit;
}

// ═══════════════════════════════════════════════════════════════
// Validar método (apenas GET permitido após HEAD)
// ═══════════════════════════════════════════════════════════════
if ($method !== 'GET') {
    header('Allow: GET, HEAD, OPTIONS');
    header('Content-Type: application/json; charset=utf-8');
    http_response_code(405);
    echo json_encode(['ok' => false, 'data' => null, 'error' => 'METHOD_NOT_ALLOWED']);
    exit;
}

// ═══════════════════════════════════════════════════════════════
// GET: Verificação completa
// ═══════════════════════════════════════════════════════════════
header('Content-Type: application/json; charset=utf-8');

if (empty($_COOKIE['DSHOWSESS'])) {
    http_response_code(401);
    echo json_encode([
        'ok' => false,
        'data' => null,
        'error' => 'NOT_AUTHENTICATED',
        'meta' => ['authenticated' => false]
    ]);
    exit;
}

// Usar SessionGate para verificação completa
SessionGate::start();

if (!SessionGate::validate()) {
    session_write_close();
    http_response_code(401);
    echo json_encode([
        'ok' => false,
        'data' => null,
        'error' => 'NOT_AUTHENTICATED',
        'meta' => ['authenticated' => false]
    ]);
    exit;
}

$user = SessionGate::getUser();
$expiresIn = isset($_SESSION['expire_time']) ? ($_SESSION['expire_time'] - time()) : 604800;

session_write_close();

echo json_encode([
    'ok' => true,
    'data' => [
        'authenticated' => true,
        'user' => $user,
        'expires_in' => max(0, $expiresIn)
    ],
    'error' => null
]);
