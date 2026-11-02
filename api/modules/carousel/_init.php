<?php
// /api/modules/carousel/_init.php
// Inicialização padrão para carousel
// @version 2.0.0-ENTERPRISE
// v2.0.0: Adicionado RedisHelper centralizado
// @created 2026-01-21

declare(strict_types=1);

require_once __DIR__ . '/../../core/CorsPolicy.php';
require_once __DIR__ . '/../../core/helpers/RedisHelper.php';

CorsPolicy::setupApiEndpoint([
    'methods' => ['GET', 'OPTIONS'],
    'no_cache' => true
]);

if (!defined('CAROUSEL_CACHE_TTL')) {
    define('CAROUSEL_CACHE_TTL', RedisConfig::TTL_UI);
}
