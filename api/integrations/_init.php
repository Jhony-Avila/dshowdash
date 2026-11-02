<?php
// /api/integrations/_init.php
// Inicialização padrão para integrations
// @version 1.0.0-ENTERPRISE
// @created 2026-01-21

declare(strict_types=1);

require_once __DIR__ . '/../core/CorsPolicy.php';
require_once __DIR__ . '/../core/helpers/RedisHelper.php';
require_once __DIR__ . '/../core/helpers/InputValidator.php';

CorsPolicy::setupApiEndpoint([
    'methods' => ['GET', 'POST', 'OPTIONS'],
    'no_cache' => true
]);

// TTL padrão para este módulo
if (!defined('INTEGRATIONS_CACHE_TTL')) {
    define('INTEGRATIONS_CACHE_TTL', RedisConfig::TTL_MODULES);
}
