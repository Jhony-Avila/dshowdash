<?php
// Pipedrive / index.php - roteador PATH_INFO do modulo
// @version 1.0.0
// @created 2026-07-21
// @app Pipedrive Analytics
//
// Molde: api/datatables/index.php. nginx mapeia ^/api/pipedrive(/.*)?$ para este arquivo.
//
// Rotas:
//   GET    /status               estado da credencial/integracao (§7.5)
//   POST   /auth/validate        testa token, nao salva (admin)
//   POST   /auth/connect         valida + cifra + persiste (admin)
//   POST   /auth/reconnect       substitui credencial ativa (admin)
//   POST   /auth/disconnect      desativa credencial ativa (admin)
//   GET    /overview             metricas executivas da base local (modulo)
//   POST   /sync                 dispara rodada de sincronizacao (admin) — diagnostico
//   GET    /deals                lista paginada de negocios (DataGrid server-side)
//   GET    /custom-fields        definicoes de campos personalizados (?entity=deal|person|...)
//   POST   /webhook              receptor EXTERNO (Basic Auth) — antes dos gates de sessao
//   GET    /webhooks             lista/gestao dos webhooks no Pipedrive (admin)
//   POST   /webhooks/register    registra o webhook apontando ao receptor (admin)
//   DELETE /webhooks/{id}        remove um webhook no Pipedrive (admin)
//   GET    /queue                estado da fila de ingest (admin)
//   POST   /queue/drain          drena a fila manualmente — diagnostico (admin)
//   POST   /queue/requeue        reenfileira um job morto (admin)
//   GET    /metrics              series diaria/horaria + top produtos + ranking (modulo)
//   GET    /entity-stats         cards-resumo por entidade (modulo, 100% base local)
//   GET    /rankings             rankings dedicados vendedores/produtos/orgs (modulo)
//   GET    /forecast             previsao de fechamento valor x probabilidade (modulo)
//   GET    /conversion           win-rate + ciclo add->won + idade por etapa (modulo)
//   GET    /health               saude do sync: entidades/runs/fila/erros/uso API (modulo)
//   POST   /deal-products        sincroniza produtos dos negocios — CARO (admin)
//   POST   /reconcile            reconciliacao de exclusoes (deleted-scan/presence) (admin)
declare(strict_types=1);

@ini_set('display_errors', '0');   // nunca vazar stack/paths ao cliente

require_once __DIR__ . '/_init.php';

set_exception_handler(static function (\Throwable $e): void {
    error_log('[pipedrive] uncaught ' . get_class($e) . ': ' . $e->getMessage()
        . ' @ ' . $e->getFile() . ':' . $e->getLine());
    ApiResponse::error(ApiResponse::ERR_INTERNAL_ERROR, 500, [
        'message' => 'Erro interno ao processar a solicitacao.',
    ]);
});

$method   = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$path     = trim((string)($_SERVER['PATH_INFO'] ?? ''), '/');
$segments = $path === '' ? [] : explode('/', $path);

// Receptor de webhook (EXTERNO, Basic Auth) — precede SessionGate/CSRF: o Pipedrive
// nao tem sessao nem token CSRF; a autenticacao e por Basic Auth (creds no .env).
if (($segments[0] ?? '') === 'webhook') {
    PipeWebhookController::receive($method, getConnection('PIPE_DSHOW'));
    return;
}

SessionGate::start();
pipe_require_access();
AuthHelpers::requireCsrfForWrite();   // gate central de CSRF para POST/PUT/PATCH/DELETE

$pdo = getConnection('PIPE_DSHOW');

switch ($segments[0] ?? '') {
    case '':
    case 'status':
        PipeStatusController::status($method, $pdo);
        break;

    case 'auth':
        PipeAuthController::route($method, $segments, $pdo);
        break;

    case 'overview':
        PipeSyncController::overview($method, $pdo);
        break;

    case 'sync':
        PipeSyncController::sync($method, $pdo);
        break;

    case 'reconcile':
        PipeSyncController::reconcile($method, $pdo);
        break;

    case 'deals':
        PipeQueryController::deals($method, $segments, $pdo);
        break;

    case 'persons':
        PipeQueryController::persons($method, $segments, $pdo);
        break;

    case 'organizations':
        PipeQueryController::organizations($method, $segments, $pdo);
        break;

    case 'activities':
        PipeQueryController::activities($method, $segments, $pdo);
        break;

    case 'leads':
        PipeQueryController::leads($method, $segments, $pdo);
        break;

    case 'products':
        PipeQueryController::products($method, $segments, $pdo);
        break;

    case 'notes':
        PipeQueryController::notes($method, $pdo);
        break;

    case 'users':
        PipeQueryController::users($method, $pdo);
        break;

    case 'pipelines':
        PipeQueryController::pipelines($method, $pdo);
        break;

    case 'kanban':
        PipeQueryController::kanban($method, $pdo);
        break;

    case 'alerts':
        PipeQueryController::alerts($method, $pdo);
        break;

    case 'custom-fields':
        PipeQueryController::customFields($method, $pdo);
        break;

    case 'webhooks':
        PipeWebhookController::admin($method, $segments, $pdo);
        break;

    case 'queue':
        PipeWebhookController::queue($method, $segments, $pdo);
        break;

    case 'metrics':
        PipeMetricsController::metrics($method, $pdo);
        break;

    case 'entity-stats':
        PipeMetricsController::entityStats($method, $pdo);
        break;

    case 'rankings':
        PipeAnalyticsController::rankings($method, $pdo);
        break;

    case 'forecast':
        PipeAnalyticsController::forecast($method, $pdo);
        break;

    case 'conversion':
        PipeAnalyticsController::conversion($method, $pdo);
        break;

    case 'funnel':
        PipeAnalyticsController::funnel($method, $pdo);
        break;

    case 'summary':
        PipeAnalyticsController::summary($method, $pdo);
        break;

    case 'lost-reasons':
        PipeAnalyticsController::lostReasons($method, $pdo);
        break;

    case 'health':
        PipeHealthController::health($method, $pdo);
        break;

    case 'deal-products':
        PipeMetricsController::dealProducts($method, $pdo);
        break;

    default:
        ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404, [
            'message' => 'Rota desconhecida: /' . $path,
        ]);
}
