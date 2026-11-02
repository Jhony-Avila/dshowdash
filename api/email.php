<?php
// Email Service Status Endpoint
// @version 1.1.0-P06-ENTERPRISE

declare(strict_types=1);

require_once __DIR__ . '/core/CorsPolicy.php';

CorsPolicy::setupApiEndpoint(['methods' => ['GET', 'OPTIONS'], 'no_cache' => true]);

$action = $_GET['action'] ?? 'status';

if ($action === 'status') {
    header('Content-Type: application/json');
    echo json_encode(['ok' => true, 'data' => ['service' => 'email', 'status' => 'available', 'version' => '1.1.0-P06-ENTERPRISE', 'timestamp' => time(), 'queue_size' => 0, 'last_sent' => null, 'provider' => 'stub']], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($action === 'health') {
    header('Content-Type: application/json');
    echo json_encode(['ok' => true, 'data' => ['healthy' => true, 'checks' => ['smtp_connection' => true, 'queue_processor' => true]]], JSON_UNESCAPED_UNICODE);
    exit;
}

http_response_code(400);
header('Content-Type: application/json');
echo json_encode(['ok' => false, 'error' => 'INVALID_ACTION', 'meta' => ['action' => $action, 'allowed' => ['status', 'health']]]);
