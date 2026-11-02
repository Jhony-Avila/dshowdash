<?php
// /api/status/_init.php
// Inicialização padrão para endpoints de status
// @version 2.0.0-ENTERPRISE
// @created 2026-01-21
// @updated 2026-01-21
//
// v2.0.0: Adicionado RedisHelper centralizado
//
// Uso: require_once __DIR__ . '/_init.php';

declare(strict_types=1);

require_once __DIR__ . '/../core/CorsPolicy.php';
require_once __DIR__ . '/../core/helpers/RedisHelper.php';
// ApiResponse entra AQUI, e não em cada endpoint (2026-07-30).
//
// Quatro endpoints — cpu, disk, memory e network — chamavam `ApiResponse::` sem
// requerer a classe e devolviam `500 com corpo VAZIO`. Os quatro painéis de
// footer correspondentes ficavam mudos, sem erro visível em lugar nenhum: o
// fatal do PHP não vira JSON, então o front recebia resposta vazia e seguia.
//
// Todo endpoint de status usa ApiResponse; deixar o require a cargo de cada
// arquivo garante que o próximo nasça com o mesmo defeito. `require_once` nos
// que já o carregam é inofensivo.
require_once __DIR__ . '/../_helpers/ApiResponse.php';

// Setup CORS e headers padrão para status endpoints
// Métodos: GET, OPTIONS (read-only)
// Cache: no-store (dados em tempo real)
CorsPolicy::setupApiEndpoint([
    'methods' => ['GET', 'OPTIONS'],
    'no_cache' => true
]);

// TTL padrão para status endpoints (disponível globalmente)
if (!defined('STATUS_CACHE_TTL')) {
    define('STATUS_CACHE_TTL', RedisConfig::TTL_STATUS);
}
