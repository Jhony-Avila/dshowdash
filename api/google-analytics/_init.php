<?php
// Google Analytics / _init.php — bootstrap do módulo
// @module  google-analytics.init
// @version 1.0.0
// @created 2026-07-30
//
// Molde: api/google-calendar/_init.php (que espelha outlook, que espelha pipedrive).
declare(strict_types=1);

// ── Núcleo compartilhado ────────────────────────────────────────
require_once __DIR__ . '/../core/CorsPolicy.php';
require_once __DIR__ . '/../core/SessionGate.php';
require_once __DIR__ . '/../_helpers/ApiResponse.php';
require_once __DIR__ . '/../_helpers/AuthHelpers.php';
// Bibliotecas, provedores e filtros (sem efeito HTTP) — também usados pela Ponte v2 (módulo de leitura `analytics`, Noite 2)
require_once __DIR__ . '/_libs.php';

// ── Controllers ─────────────────────────────────────────────────
require_once __DIR__ . '/controllers/StatusController.php';
require_once __DIR__ . '/controllers/ReportController.php';
require_once __DIR__ . '/controllers/AdminController.php';

CorsPolicy::setupApiEndpoint([
    'methods'  => ['GET', 'POST', 'OPTIONS'],
    'no_cache' => true,
]);

/**
 * Acesso ao módulo: qualquer usuário autenticado.
 *
 * ⚠️ A matriz de permissões da §71 (Administrador / Gestor / Analista / Comercial / Técnico /
 * Somente leitura) NÃO está implementada aqui, e isso é deliberado nesta fase: o modelo de
 * autorização real deste projeto é UARPS (`app_user_trigger_permissions` + `app_user_roles`),
 * e gravar permissão em tabela que ninguém lê criaria a ilusão de controle. Enquanto a Fase 1
 * é mock e só lê, o gate é autenticação. A §71 entra junto com a Fase 4, sobre UARPS.
 */
/** Nível mínimo do módulo (igual ao Pipedrive). */
const GA_MIN_LEVEL = 50;

function ga_require_access(): void
{
    // 31/10/2026 (Q-GA.3, achado DR-016): /conversions, /insights e o resumo devolvem totais REAIS do Pipedrive (GaCrm) — o
    // módulo exige o MESMO nível do painel do Pipedrive (`pipe_require_access`, 50). Abaixo disso: 403 INSUFFICIENT_LEVEL.
    AuthHelpers::requireAuth(GA_MIN_LEVEL);
}

/**
 * Filtros globais (§66) da query string. A normalização vive em `ga_filtros_de()` (_libs.php, sem `exit`, usada também pela Ponte);
 * aqui só convertemos o erro tipado no envelope HTTP de sempre.
 */
function ga_filtros(): array
{
    try {
        return ga_filtros_de($_GET);
    } catch (GaIndisponivel $e) {
        ApiResponse::error($e->codigo, $e->status, ['message' => $e->getMessage()] + $e->meta);
    }
}
