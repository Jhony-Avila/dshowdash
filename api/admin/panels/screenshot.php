<?php
/**
 * Panel Screenshot API — Trigger screenshot capture
 * @version 1.1.0
 * @created 2026-03-29
 * @updated 2026-03-30
 *
 * POST /api/admin/panels/:id/screenshot → Dispara captura de screenshot
 * Body: { width?, height?, format?, url? }
 * url: URL explicita para captura (usado para paineis sem rota no banco)
 */

declare(strict_types=1);

require_once __DIR__ . '/../../admin/_init.php';
require_once __DIR__ . '/../../_helpers/ApiResponse.php';
require_once __DIR__ . '/../../_helpers/AuthHelpers.php';
require_once __DIR__ . '/../../../config/db_connection.php';
require_once __DIR__ . '/../../core/SessionGate.php';
require_once __DIR__ . '/../../core/UARPSGate.php';

header('Content-Type: application/json; charset=utf-8');

const UARPS_TRIGGER_SCREENSHOT = 'gate:admin:panels:screenshot';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($method !== 'POST') {
    ApiResponse::error(ApiResponse::ERR_METHOD_NOT_ALLOWED, 405);
}

try {
    handlePostScreenshot();
} catch (Throwable $e) {
    ApiResponse::exception($e);
}

function handlePostScreenshot(): void {
    $session = SessionGate::requireAuth();
    $userId = (int)($session['user_id'] ?? $session['id'] ?? 0);
    if ($userId > 0) {
        UARPSGate::enforceTrigger($userId, UARPS_TRIGGER_SCREENSHOT, 'api/admin/panels/screenshot');
    }
    requireCsrfForWrite();

    // Get panel_id from query param or PATH_INFO
    $panelId = $_GET['panel_id'] ?? '';
    if ($panelId === '') {
        // Try extracting from REQUEST_URI: /api/admin/panels/{id}/screenshot
        $uri = $_SERVER['REQUEST_URI'] ?? '';
        if (preg_match('#/api/admin/panels/([a-zA-Z0-9_-]+)/screenshot#', $uri, $m)) {
            $panelId = $m[1];
        }
    }

    if ($panelId === '') {
        ApiResponse::error(ApiResponse::ERR_ID_REQUIRED, 400, ['message' => 'panel_id obrigatorio']);
    }

    $pdo = getConnection('DSHOWDASH');

    // Check panel exists and is active
    $check = $pdo->prepare("SELECT panel_id, is_active, route FROM panel_registry WHERE panel_id = ?");
    $check->execute([$panelId]);
    $panel = $check->fetch(PDO::FETCH_ASSOC);

    if (!$panel) {
        ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404, ['message' => "Painel '$panelId' nao encontrado"]);
    }

    if (!(int)$panel['is_active']) {
        ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 400, ['message' => 'Painel esta inativo. Ative-o antes de capturar screenshot.']);
    }

    // Rate limit: max 1 screenshot per panel per 5 minutes
    $rateCheck = $pdo->prepare("
        SELECT captured_at FROM panel_screenshots
        WHERE panel_id = ? AND captured_at > DATE_SUB(NOW(), INTERVAL 5 MINUTE)
        ORDER BY captured_at DESC LIMIT 1
    ");
    $rateCheck->execute([$panelId]);
    $recent = $rateCheck->fetch(PDO::FETCH_ASSOC);

    if ($recent) {
        $lastCapture = $recent['captured_at'];
        $retryAfter = 300 - (time() - strtotime($lastCapture));
        ApiResponse::error('RATE_LIMITED', 429, [
            'message' => 'Screenshot ja foi capturado recentemente',
            'last_capture' => $lastCapture,
            'retry_after_seconds' => max(0, $retryAfter),
        ]);
    }

    // Parse optional body
    $body = json_decode(file_get_contents('php://input'), true) ?? [];
    $width  = isset($body['width'])  ? min(3840, max(320, (int)$body['width']))  : 1920;
    $height = isset($body['height']) ? min(2160, max(240, (int)$body['height'])) : 1080;
    $format = in_array($body['format'] ?? 'webp', ['webp', 'png', 'jpg'], true) ? ($body['format'] ?? 'webp') : 'webp';

    // Determine capture URL: explicit body.url > panel route > fallback hash route
    $captureUrl = '';
    if (!empty($body['url']) && is_string($body['url'])) {
        // Validate URL — must be same-origin (dshowdash.com.br)
        $parsed = parse_url($body['url']);
        $host = $parsed['host'] ?? '';
        if (str_ends_with($host, 'dshowdash.com.br') || $host === 'localhost' || $host === '127.0.0.1') {
            $captureUrl = $body['url'];
        }
    }
    if ($captureUrl === '' && !empty($panel['route'])) {
        $captureUrl = 'https://dshowdash.com.br/' . ltrim($panel['route'], '/');
    }
    if ($captureUrl === '') {
        $captureUrl = 'https://dshowdash.com.br/#/' . $panelId;
    }

    // Insert pending screenshot record
    $screenshotPath = "screenshots/{$panelId}/" . date('Y-m-d_His') . ".{$format}";

    $insert = $pdo->prepare("
        INSERT INTO panel_screenshots (panel_id, screenshot_path, width, height, format, status, captured_at)
        VALUES (?, ?, ?, ?, ?, 'pending', NOW())
    ");
    $insert->execute([$panelId, $screenshotPath, $width, $height, $format]);
    $screenshotId = (int)$pdo->lastInsertId();

    // Dispatch background capture
    $cmd = sprintf(
        'node /var/www/dshowdash/tools/screenshot-service/capture.mjs --panel-id=%s --screenshot-id=%d --url=%s > /dev/null 2>&1 &',
        escapeshellarg($panelId),
        $screenshotId,
        escapeshellarg($captureUrl)
    );
    exec($cmd);

    ApiResponse::success([
        'screenshot_id'     => $screenshotId,
        'panel_id'          => $panelId,
        'status'            => 'pending',
        'estimated_seconds' => 15,
        'capture_url'       => $captureUrl,
    ], [
        'message' => 'Captura de screenshot iniciada',
    ]);
}
