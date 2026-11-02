<?php
declare(strict_types=1);

// /api/auth/check.php
// @version 5.2.0-AVATAR-FIX
// @updated 2026-01-29
// v5.2.0: Adicionado busca de avatar_url do banco app_users
// v5.1.0: P0.3 FIX - SEMPRE retorna csrf_token

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
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept, X-Requested-With, X-CSRF-Token, Authorization');
header('Access-Control-Max-Age: 86400');

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once __DIR__ . '/../_helpers/ApiResponse.php';
require_once __DIR__ . '/../../config/db_connection.php';
require_once __DIR__ . '/../core/SessionGate.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0, private');
header('Pragma: no-cache');

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') {
    header('Allow: GET, OPTIONS');
    http_response_code(405);
    echo json_encode(['ok' => false, 'data' => null, 'error' => 'METHOD_NOT_ALLOWED']);
    exit;
}

SessionGate::start();

if (empty($_SESSION['csrf'])) {
    $_SESSION['csrf'] = bin2hex(random_bytes(32));
}

$csrfToken = $_SESSION['csrf'];

if (empty($_COOKIE['DSHOWSESS'])) {
    session_write_close();
    echo json_encode([
        'ok' => true,
        'data' => [
            'authenticated' => false,
            'user' => null,
            'session' => [
                'csrf_token' => $csrfToken
            ]
        ],
        'error' => null
    ]);
    exit;
}

$authenticated = SessionGate::validate();

if (!$authenticated) {
    session_write_close();
    echo json_encode([
        'ok' => true,
        'data' => [
            'authenticated' => false,
            'user' => null,
            'session' => [
                'csrf_token' => $csrfToken
            ]
        ],
        'error' => null
    ]);
    exit;
}

$sessionToken = session_id();
$userId = SessionGate::getUserId();
$now = time();
$lastActivity = date('Y-m-d\TH:i:s\Z', $now);

$dbSession = null;
$avatarUrl = null;

try {
    $pdo = getConnection('DSHOWDASH');
    
    $stmt = $pdo->prepare("
        UPDATE app_user_sessions 
        SET last_activity_at = NOW(3) 
        WHERE session_token = ? AND user_id = ? AND is_active = 1
    ");
    $stmt->execute([$sessionToken, $userId]);
    
    $stmtSession = $pdo->prepare("
        SELECT session_token, csrf_token, expires_at, last_activity_at, device_type, browser, os, origin_ip
        FROM app_user_sessions 
        WHERE session_token = ? AND user_id = ? AND is_active = 1
        LIMIT 1
    ");
    $stmtSession->execute([$sessionToken, $userId]);
    $dbSession = $stmtSession->fetch();
    
    // v5.2.0: Buscar avatar_url do usuário
    $stmtAvatar = $pdo->prepare("
        SELECT avatar_url 
        FROM app_users 
        WHERE id = ? 
        LIMIT 1
    ");
    $stmtAvatar->execute([$userId]);
    $userRow = $stmtAvatar->fetch();
    if ($userRow && !empty($userRow['avatar_url'])) {
        $avatarUrl = $userRow['avatar_url'];
    }
    
} catch (Exception $e) {
    // Silently fail
}

$_SESSION['last_activity'] = $now;

$sessionData = [
    'token' => $sessionToken,
    'expires_at' => isset($_SESSION['expire_time']) ? date('Y-m-d\TH:i:s\Z', $_SESSION['expire_time']) : null,
    'last_activity_at' => $lastActivity,
    'csrf_token' => $csrfToken
];

if ($dbSession) {
    $sessionData['device_type'] = $dbSession['device_type'];
    $sessionData['browser'] = $dbSession['browser'];
    $sessionData['os'] = $dbSession['os'];
    $sessionData['origin_ip'] = $dbSession['origin_ip'];
}

// v5.2.0: Incluir avatar_url no usuário
$userData = SessionGate::getUser();
if ($userData && $avatarUrl) {
    $userData['avatar_url'] = $avatarUrl;
}

session_write_close();

echo json_encode([
    'ok' => true,
    'data' => [
        'authenticated' => true,
        'user' => $userData,
        'session' => $sessionData
    ],
    'error' => null
]);
