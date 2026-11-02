<?php
// Auth Health Check Endpoint
// @version 1.0.0-ENTERPRISE
// @created 2026-01-25
// #15: Endpoint público para verificar saúde do sistema de auth

declare(strict_types=1);

// CORS + Preflight
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
header('Access-Control-Allow-Headers: Content-Type, Accept');
header('Access-Control-Max-Age: 86400');

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once __DIR__ . '/../core/SessionGate.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');

// Verificar se é request interno (admin) ou público
$isInternal = false;
$authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';

if (strpos($authHeader, 'Bearer ') === 0) {
    // Poderia validar token de admin aqui
    $isInternal = true;
}

// Query param para modo detalhado (apenas interno)
$detailed = isset($_GET['detailed']) && $_GET['detailed'] === 'true';

if ($detailed && $isInternal) {
    // Resposta detalhada para admins
    $health = SessionGate::healthCheck();
    
    // Adicionar info de dependências
    $health['dependencies'] = [
        'cookie_params' => file_exists(__DIR__ . '/_cookie_params.php'),
        'rate_limit' => file_exists(__DIR__ . '/_rate_limit.php'),
        'session_read_service' => file_exists(__DIR__ . '/services/SessionReadService.php')
    ];
    
    echo json_encode([
        'ok' => true,
        'data' => $health,
        'error' => null
    ], JSON_PRETTY_PRINT);
} else {
    // Resposta pública simplificada
    $health = SessionGate::publicHealthInfo();
    
    echo json_encode([
        'ok' => true,
        'data' => $health,
        'error' => null
    ]);
}
