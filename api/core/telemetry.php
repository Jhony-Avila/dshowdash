<?php
// Telemetry API Endpoint
// @version 2.1.0-ENTERPRISE
// @updated 2026-01-21
// P0.1 FIX: Migrado para CorsPolicy::setupApiEndpoint()
// P1.2: Proteção alternativa (rate limit + validação origem) - endpoints sem CSRF

require_once __DIR__ . '/CorsPolicy.php';

CorsPolicy::setupApiEndpoint([
    'methods' => ['POST', 'OPTIONS'],
    'no_cache' => true
]);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
    exit;
}

// P1.2: Proteção alternativa para telemetria (sem CSRF)
$clientIp = isset($_SERVER['HTTP_CF_CONNECTING_IP']) ? $_SERVER['HTTP_CF_CONNECTING_IP'] : (isset($_SERVER['REMOTE_ADDR']) ? $_SERVER['REMOTE_ADDR'] : 'unknown');

// 1. Validar Content-Type
$contentType = isset($_SERVER['CONTENT_TYPE']) ? $_SERVER['CONTENT_TYPE'] : (isset($_SERVER['HTTP_CONTENT_TYPE']) ? $_SERVER['HTTP_CONTENT_TYPE'] : '');
if (stripos($contentType, 'application/json') === false) {
    http_response_code(415);
    echo json_encode(['ok' => false, 'error' => 'Content-Type must be application/json']);
    exit;
}

// 2. Validar Origin/Referer (mesmo domínio)
$allowedOrigins = ['https://dshowdash.com.br', 'https://www.dshowdash.com.br'];
$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
$referer = isset($_SERVER['HTTP_REFERER']) ? $_SERVER['HTTP_REFERER'] : '';
$isValidOrigin = false;
foreach ($allowedOrigins as $allowed) {
    if ($origin === $allowed || strpos($referer, $allowed) === 0) {
        $isValidOrigin = true;
        break;
    }
}
if (!$isValidOrigin && $origin !== '' && $referer !== '') {
    http_response_code(403);
    echo json_encode(['ok' => false, 'error' => 'Invalid origin']);
    exit;
}

// 3. Limitar tamanho do payload (max 100KB para telemetria)
$contentLength = isset($_SERVER['CONTENT_LENGTH']) ? (int)$_SERVER['CONTENT_LENGTH'] : 0;
if ($contentLength > 102400) {
    http_response_code(413);
    echo json_encode(['ok' => false, 'error' => 'Payload too large']);
    exit;
}

// 4. Rate limit simples por IP (usando arquivo temporário)
$rateLimitDir = sys_get_temp_dir() . '/dshow_ratelimit';
if (!is_dir($rateLimitDir)) @mkdir($rateLimitDir, 0755, true);
$rateLimitFile = $rateLimitDir . '/telemetry_' . md5($clientIp) . '.txt';
$now = time();
$windowSeconds = 60;
$maxRequests = 100;

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
    http_response_code(429);
    echo json_encode(['ok' => false, 'error' => 'Rate limit exceeded', 'retry_after' => $windowSeconds]);
    exit;
}
$requests[] = $now;
@file_put_contents($rateLimitFile, implode("\n", array_slice($requests, -$maxRequests)));

try {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);

    if (!$data || !isset($data['metrics']) || !is_array($data['metrics'])) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Invalid payload']);
        exit;
    }

    $sessionId = isset($data['sessionId']) ? $data['sessionId'] : 'unknown';
    $metrics = $data['metrics'];
    $count = count($metrics);

    $logDir = __DIR__ . '/../storage/logs/telemetry';
    if (!is_dir($logDir)) {
        mkdir($logDir, 0755, true);
    }

    $logFile = $logDir . '/telemetry-' . date('Y-m-d') . '.jsonl';

    $fp = fopen($logFile, 'a');
    if ($fp) {
        foreach ($metrics as $metric) {
            $entry = array_merge($metric, [
                'sessionId' => $sessionId,
                'server_time' => date('c'),
                'ip' => $clientIp
            ]);
            fwrite($fp, json_encode($entry) . "\n");
        }
        fclose($fp);
    }

    echo json_encode([
        'ok' => true,
        'data' => ['received' => $count],
        'meta' => ['timestamp' => date('c')]
    ]);

} catch (Exception $e) {
    http_response_code(500);
    error_log('telemetry error: ' . $e->getMessage());
    echo json_encode(['ok' => false, 'error' => 'Internal error']);
}