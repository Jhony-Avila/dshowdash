<?php
// /api/status/settings.php
// @version 2.1.0-ENTERPRISE
// @updated 2026-01-21
// P1.1: Migrado 'success' para 'ok'
// P2.1: Migrado para ApiResponse
// P3.5 FIX: Adicionado CORS centralizado

require_once __DIR__ . '/_init.php';
require_once __DIR__ . '/../_helpers/ApiResponse.php';

ApiResponse::success([
    'status' => 'online',
    'theme' => 'dark',
    'language' => 'pt-BR',
    'notifications' => true,
    'auto_refresh' => true
]);
