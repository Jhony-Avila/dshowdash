<?php
declare(strict_types=1);

// /api/telemetry/index.php - Telemetria persistida
// @version 3.0.0-ENTERPRISE - P1 Security: Auth + CSRF obrigatórios
// @updated 2026-01-23
// P1: Telemetria autenticada - exige sessão + usuário + CSRF

require_once __DIR__ . '/../_helpers/ApiResponse.php';
require_once __DIR__ . '/../../config/db_connection.php';
require_once __DIR__ . '/../core/CorsPolicy.php';
require_once __DIR__ . '/../_helpers/AuthHelpers.php';

// Setup CORS e headers
CorsPolicy::setupApiEndpoint([
    'methods' => ['GET', 'POST', 'OPTIONS'],
    'headers' => ['Content-Type', 'X-CSRF-Token'],
    'no_cache' => true
]);

$method = $_SERVER['REQUEST_METHOD'] ?? '';

// GET - Health check (publico)
if ($method === 'GET') {
    ApiResponse::success([
        'service' => 'telemetry',
        'version' => '3.0.0',
        'database' => 'DSHOWDASH',
        'status' => 'ok'
    ], ['timestamp' => date('c')]);
}

// Validar metodo
if ($method !== 'POST') {
    header('Allow: GET, POST, OPTIONS');
    ApiResponse::error(ApiResponse::ERR_METHOD_NOT_ALLOWED, 405);
}

// P1: Exigir autenticação
$user = requireAuth();
$userId = $user['id'];

// P1: Exigir CSRF válido
requireCsrf();

// Validar Content-Type
$contentType = $_SERVER['CONTENT_TYPE'] ?? $_SERVER['HTTP_CONTENT_TYPE'] ?? '';
if (stripos($contentType, 'application/json') === false) {
    ApiResponse::error('Content-Type must be application/json', 415);
}

// Limitar tamanho do payload (max 100KB para telemetria geral)
$contentLength = (int)($_SERVER['CONTENT_LENGTH'] ?? 0);
if ($contentLength > 102400) {
    ApiResponse::error('Payload too large', 413);
}

// Rate limit por usuário autenticado
$clientIp = $_SERVER['HTTP_CF_CONNECTING_IP'] ?? $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$rateLimitDir = sys_get_temp_dir() . '/dshow_ratelimit';
if (!is_dir($rateLimitDir)) {
    @mkdir($rateLimitDir, 0755, true);
}
$rateLimitFile = $rateLimitDir . '/telemetry_user_' . $userId . '.txt';
$now = time();
$windowSeconds = 60;
$maxRequests = 60;

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

// POST - Registrar eventos
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data) {
    ApiResponse::error(ApiResponse::ERR_INVALID_JSON, 400, ['message' => 'JSON invalido']);
}

try {
    $pdo = getConnection('DSHOWDASH');
} catch (Exception $e) {
    session_write_close();
    ApiResponse::success(['persisted' => false, 'reason' => 'db_unavailable'], ['timestamp' => date('c')]);
}

$events = $data['events'] ?? [$data];
$inserted = 0;
$errors = 0;

$stmt = $pdo->prepare("
    INSERT INTO app_telemetry_events
    (user_id, event_type, event_name, component_name, payload_json, duration_ms, page_url, referrer_url, user_agent, ip_address)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
");

$userAgent = substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 500);
$ipAddress = $clientIp;

foreach ($events as $event) {
    $eventType = $event['type'] ?? $event['event_type'] ?? 'action';
    // 'event' vem PRIMEIRO: é a chave que o telemetry-core realmente emite (core/normalizer.ts
    // monta { type, event, component, context, data }). Sem ela, 260 de 261 eventos gravavam
    // event_name='unknown' — a telemetria voltou a persistir em 2026-07-28 e persistia lixo.
    // As demais chaves ficam para quem posta no formato antigo.
    $eventName = $event['event'] ?? $event['name'] ?? $event['event_name'] ?? $event['action'] ?? 'unknown';
    $component = $event['component'] ?? $event['component_name'] ?? $event['module'] ?? null;
    $payload = isset($event['data']) || isset($event['payload']) ? json_encode($event['data'] ?? $event['payload']) : null;
    // Métricas trazem o valor em metric.value (com metric.unit); só 'data.duration' perdia isso.
    $duration = $event['duration'] ?? $event['duration_ms'] ?? $event['data']['duration'] ?? null;
    if ($duration === null && isset($event['metric']['value']) && is_numeric($event['metric']['value'])) {
        $duration = $event['metric']['value'];
    }
    // A rota do SPA vive em context.route — 'url'/'page_url' nunca chegam do telemetry-core.
    $pageUrl = $event['url'] ?? $event['page_url'] ?? $event['context']['route'] ?? null;
    $referrer = $event['referrer'] ?? $event['referrer_url'] ?? null;

    try {
        $stmt->execute([
            $userId,
            substr($eventType, 0, 50),
            substr($eventName, 0, 100),
            $component ? substr($component, 0, 100) : null,
            $payload,
            $duration,
            $pageUrl ? substr($pageUrl, 0, 500) : null,
            $referrer ? substr($referrer, 0, 500) : null,
            $userAgent,
            $ipAddress
        ]);
        $inserted++;
    } catch (Exception $e) {
        $errors++;
        error_log("Telemetry insert error: " . $e->getMessage());
    }
}

session_write_close();

ApiResponse::success([
    'persisted' => true,
    'inserted' => $inserted,
    'errors' => $errors
], ['timestamp' => date('c')]);