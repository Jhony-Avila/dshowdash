<?php
// /api/monitoring/_init.php
// Inicialização padrão para endpoints de monitoring
// @version 1.0.0-ENTERPRISE
// @created 2026-01-21
//
// Uso: require_once __DIR__ . '/_init.php';

declare(strict_types=1);

require_once __DIR__ . '/../core/CorsPolicy.php';
require_once __DIR__ . '/../_helpers/ApiResponse.php';

// Setup CORS e headers padrão para monitoring endpoints
// Métodos: GET, POST, OPTIONS (read + write operations)
// Cache: no-store (dados em tempo real)
CorsPolicy::setupApiEndpoint([
    'methods' => ['GET', 'POST', 'OPTIONS'],
    'no_cache' => true
]);
