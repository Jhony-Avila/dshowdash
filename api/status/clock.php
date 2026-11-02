<?php
// /api/status/clock.php
// Endpoint de relógio do sistema
// @version 2.3.0-ENTERPRISE
// @updated 2026-01-21
// P1.1: Migrado 'success' para 'ok' (contrato padronizado)
// P2.1: Migrado para ApiResponse
// FIX: Adicionado CORS centralizado

declare(strict_types=1);

require_once __DIR__ . '/../core/CorsPolicy.php';
require_once __DIR__ . '/../_helpers/ApiResponse.php';

CorsPolicy::setupApiEndpoint(['methods' => ['GET', 'OPTIONS']]);

$tz = new DateTimeZone('America/Sao_Paulo');
$now = new DateTime('now', $tz);

ApiResponse::success([
    'time' => $now->format('H:i'),
    'date' => $now->format('d/m/Y'),
    'day' => $now->format('l'),
    'timestamp' => $now->format('Y-m-d H:i:s'),
    'timestamp_iso' => $now->format('c'),
    'unix' => $now->getTimestamp(),
    'timezone' => 'America/Sao_Paulo',
    'utc_offset' => $now->format('P')
]);
