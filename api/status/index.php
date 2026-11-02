<?php
// Status API - Index Enterprise
// @version 2.1.0-ENTERPRISE
// @updated 2026-01-21
// P0.1 FIX: Usa CorsPolicy como fonte única
// P1.1 FIX: Contrato unificado (ok em vez de success)
// P2.1 FIX: Migrado para ApiResponse

require_once __DIR__ . '/../core/CorsPolicy.php';
require_once __DIR__ . '/../_helpers/ApiResponse.php';

CorsPolicy::setupApiEndpoint([
    'methods' => ['GET', 'OPTIONS'],
    'no_cache' => true
]);

ApiResponse::success([
    'endpoints' => [
        'activity' => '/api/status/activity.php',
        'server' => '/api/status/server.php',
        'database' => '/api/status/database.php',
        'cpu' => '/api/status/cpu.php',
        'memory' => '/api/status/memory.php',
        'disk' => '/api/status/disk.php',
        'network' => '/api/status/network.php',
        'integrations' => '/api/status/integrations.php',
        'calendar' => '/api/status/calendar.php',
        'bookmarks' => '/api/status/bookmarks.php',
        'goals' => '/api/status/goals.php',
        'mercadolivre' => '/api/status/mercadolivre.php'
    ],
    'version' => '2.1.0-ENTERPRISE'
]);
