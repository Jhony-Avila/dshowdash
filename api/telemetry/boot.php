<?php
declare(strict_types=1);
// /api/telemetry/boot.php
// @version 3.0.0-ENTERPRISE - P1 Security: Auth + CSRF obrigatórios
// @updated 2026-01-23
// P1: Telemetria autenticada - exige sessão + usuário + CSRF

require_once __DIR__ . '/../../config/db_connection.php';
require_once __DIR__ . '/../core/CorsPolicy.php';
require_once __DIR__ . '/../_helpers/ApiResponse.php';
require_once __DIR__ . '/../_helpers/AuthHelpers.php';

CorsPolicy::setupApiEndpoint([
    'methods' => ['POST', 'OPTIONS'],
    'headers' => ['Content-Type', 'X-CSRF-Token']
]);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    ApiResponse::error('METHOD_NOT_ALLOWED', 405);
}

// P1: Exigir autenticação
$user = requireAuth();
$userId = $user['id'];

// P1: Exigir CSRF válido
requireCsrf();

// Validar Content-Type
$contentType = isset($_SERVER['CONTENT_TYPE']) ? $_SERVER['CONTENT_TYPE'] : (isset($_SERVER['HTTP_CONTENT_TYPE']) ? $_SERVER['HTTP_CONTENT_TYPE'] : '');
if (stripos($contentType, 'application/json') === false) {
    ApiResponse::error('Content-Type must be application/json', 415);
}

// Limitar tamanho do payload (max 50KB para boot)
$contentLength = isset($_SERVER['CONTENT_LENGTH']) ? (int)$_SERVER['CONTENT_LENGTH'] : 0;
if ($contentLength > 51200) {
    ApiResponse::error('Payload too large', 413);
}

// Rate limit por usuário autenticado
$clientIp = isset($_SERVER['HTTP_CF_CONNECTING_IP']) ? $_SERVER['HTTP_CF_CONNECTING_IP'] : (isset($_SERVER['REMOTE_ADDR']) ? $_SERVER['REMOTE_ADDR'] : 'unknown');
$rateLimitDir = sys_get_temp_dir() . '/dshow_ratelimit';
if (!is_dir($rateLimitDir)) @mkdir($rateLimitDir, 0755, true);
$rateLimitFile = $rateLimitDir . '/boot_user_' . $userId . '.txt';
$now = time();
$windowSeconds = 60;
$maxRequests = 30;

$requests = [];
if (file_exists($rateLimitFile)) {
    $lines = explode("\n", file_get_contents($rateLimitFile));
    foreach ($lines as $t) {
        if ($t !== '' && (int)$t > ($now - $windowSeconds)) {
            $requests[] = (int)$t;
        }
    }
}
if (count($requests) >= $maxRequests) {
    ApiResponse::error('Rate limit exceeded', 429, ['retry_after' => $windowSeconds]);
}
$requests[] = $now;
@file_put_contents($rateLimitFile, implode("\n", array_slice($requests, -$maxRequests)));

$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data) {
    ApiResponse::error('INVALID_JSON', 400);
}

try {
    $pdo = getConnection('DSHOWDASH');
} catch (Exception $e) {
    ApiResponse::success(['persisted' => false, 'reason' => 'db_unavailable']);
}

$meta = isset($data['meta']) ? $data['meta'] : [];
$boot = isset($data['boot']) ? $data['boot'] : [];
$performance = isset($data['performance']) ? $data['performance'] : [];
$quality = isset($data['quality']) ? $data['quality'] : [];
$environment = isset($data['environment']) ? $data['environment'] : [];

$stmt = $pdo->prepare("
    INSERT INTO app_boot_reports 
    (user_id, report_id, boot_id, app_version, build_hash, duration_ms, components_loaded, 
     fcp_ms, lcp_ms, cls_score, fid_ms, ttfb_ms, quality_score, long_tasks, 
     user_agent, viewport_width, viewport_height, connection_type, report_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
");

$webVitals = isset($performance['webVitals']) ? $performance['webVitals'] : [];
$viewport = isset($environment['viewport']) ? $environment['viewport'] : [];
$connection = isset($environment['connection']) ? $environment['connection'] : [];

try {
    $stmt->execute([
        $userId,
        isset($meta['reportId']) ? $meta['reportId'] : null,
        isset($meta['bootId']) ? $meta['bootId'] : null,
        isset($meta['version']) ? $meta['version'] : null,
        isset($meta['buildHash']) ? $meta['buildHash'] : null,
        isset($boot['durationMs']) ? $boot['durationMs'] : null,
        isset($boot['componentsLoaded']) ? $boot['componentsLoaded'] : 0,
        isset($webVitals['FCP']) ? $webVitals['FCP'] : null,
        isset($webVitals['LCP']) ? $webVitals['LCP'] : null,
        isset($webVitals['CLS']) ? $webVitals['CLS'] : null,
        isset($webVitals['FID']) ? $webVitals['FID'] : null,
        isset($webVitals['TTFB']) ? $webVitals['TTFB'] : null,
        isset($quality['score']) ? $quality['score'] : null,
        isset($quality['longTasks']) ? $quality['longTasks'] : 0,
        isset($environment['userAgent']) ? substr($environment['userAgent'], 0, 500) : null,
        isset($viewport['width']) ? $viewport['width'] : null,
        isset($viewport['height']) ? $viewport['height'] : null,
        isset($connection['effectiveType']) ? $connection['effectiveType'] : null,
        json_encode($data)
    ]);
    ApiResponse::success(['persisted' => true, 'id' => $pdo->lastInsertId()]);
} catch (Exception $e) {
    error_log("Boot report insert error: " . $e->getMessage());
    ApiResponse::success(['persisted' => false, 'reason' => 'Erro interno']);
}