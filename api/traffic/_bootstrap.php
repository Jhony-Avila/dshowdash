<?php
/**
 * Traffic API - bootstrap comum dos endpoints.
 * @version 1.0.0
 * Define no escopo do include: $TRAFFIC_CFG (array) e $TRAFFIC_PROVIDER (TrafficProvider).
 * Aplica CORS e (opcionalmente) exige sessão. Molde: api/currencies/*.
 */

require_once __DIR__ . '/../core/CorsPolicy.php';
require_once __DIR__ . '/../core/helpers/RedisHelper.php';
require_once __DIR__ . '/../_helpers/ApiResponse.php';
require_once __DIR__ . '/../../config/db_connection.php'; // dispara loadEnv() → getenv()
require_once __DIR__ . '/providers/ProviderFactory.php';
require_once __DIR__ . '/TrafficService.php';

CorsPolicy::setupApiEndpoint(['methods' => ['GET', 'OPTIONS'], 'no_cache' => false]);

$TRAFFIC_CFG = require __DIR__ . '/config.php';

// Acesso: aberto por padrão (dado público); opcional exigir sessão DShowDash.
if (!empty($TRAFFIC_CFG['security']['require_auth'])) {
    require_once __DIR__ . '/../core/SessionGate.php';
    $__session = SessionGate::validate();
    if (!$__session) {
        ApiResponse::error(ApiResponse::ERR_NOT_AUTHENTICATED, 401, ['authenticated' => false]);
    }
}

$TRAFFIC_PROVIDER = ProviderFactory::make($TRAFFIC_CFG);
