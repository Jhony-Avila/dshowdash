<?php
// /api/modules/cards/_init.php
// Inicialização padrão para cards
// @version 3.0.0-P06-ENTERPRISE
// @changelog v3.0.0-P06: Adicionado ApiResponse para contrato unificado
// @changelog v2.0.0: Adicionado RedisHelper centralizado

declare(strict_types=1);

require_once __DIR__ . '/../../core/CorsPolicy.php';
require_once __DIR__ . '/../../core/helpers/RedisHelper.php';
require_once __DIR__ . '/../../_helpers/ApiResponse.php';

CorsPolicy::setupApiEndpoint([
    'methods' => ['GET', 'OPTIONS'],
    'no_cache' => true
]);

if (!defined('CARD_CACHE_TTL')) {
    define('CARD_CACHE_TTL', RedisConfig::TTL_MODULES);
}
