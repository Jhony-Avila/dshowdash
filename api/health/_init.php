<?php
// /api/health/_init.php
// Inicialização padrão para endpoints de health
// @version 1.0.0-ENTERPRISE
// @created 2026-01-21
//
// Uso: require_once __DIR__ . '/_init.php';

declare(strict_types=1);

require_once __DIR__ . '/../core/CorsPolicy.php';

// Setup CORS e headers padrão para health endpoints
// Métodos: GET, OPTIONS (read-only)
// Cache: no-store (dados em tempo real)
CorsPolicy::setupApiEndpoint([
    'methods' => ['GET', 'OPTIONS'],
    'no_cache' => true
]);
