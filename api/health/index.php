<?php
// Health Check Endpoint
// @version 2.1.0-P06-ENTERPRISE

require_once __DIR__ . '/../core/CorsPolicy.php';

CorsPolicy::setupApiEndpoint([
    'methods' => ['GET', 'HEAD', 'OPTIONS'],
    'no_cache' => true
]);

$response = [
    'status' => 'healthy',
    'timestamp' => time(),
    'uptime' => time() - $_SERVER['REQUEST_TIME'],
    'version' => '3.0.0',
    'gates' => [
        'session' => file_exists(__DIR__ . '/../core/SessionGate.php'),
        'execution' => file_exists(__DIR__ . '/../core/ExecutionGate.php'),
        'cors' => file_exists(__DIR__ . '/../core/CorsPolicy.php')
    ]
];

header('Content-Type: application/json');
echo json_encode(['ok' => true, 'data' => $response], JSON_UNESCAPED_UNICODE);
