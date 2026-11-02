<?php
// Errors Index API
// @version 2.1.0-P06-ENTERPRISE

require_once __DIR__ . '/../core/CorsPolicy.php';
CorsPolicy::setupApiEndpoint(['methods' => ['GET', 'OPTIONS']]);
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Content-Type: application/json');
echo json_encode(['ok' => true, 'data' => ['error_count' => 0, 'errors' => []], 'meta' => ['timestamp' => date('c'), 'version' => '2.1.0-P06-ENTERPRISE']], JSON_UNESCAPED_UNICODE);
