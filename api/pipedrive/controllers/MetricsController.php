<?php
// Pipedrive / MetricsController - series agregadas + produtos por negocio
// @version 1.0.0
// @created 2026-07-21
// @app Pipedrive Analytics
//
// GET  /metrics         modulo(50): series diaria/horaria + top produtos + ranking (base local).
// POST /deal-products   admin(80)+CSRF: sincroniza produtos dos negocios (CARO — 1 call/deal).
declare(strict_types=1);

final class PipeMetricsController
{
    public static function metrics(string $method, PDO $pdo): void
    {
        requireMethod(['GET']);
        $q = pipe_query(['days']);
        $days = isset($q['days']) && is_numeric($q['days']) ? (int)$q['days'] : 90;
        $days = max(7, min($days, 365));

        $m = new PipeMetricsRepository($pdo);
        ApiResponse::success([
            'daily'        => $m->readDaily($days),
            'hourly'       => $m->readHourly(72),
            'top_products' => $m->topProducts(15),
            'owners'       => $m->ownerLeaderboard(10),
            'coverage'     => $m->productsCoverage(),
            'days'         => $days,
        ], ['ts' => date('c')]);
    }

    /** GET /entity-stats?entity=persons|organizations|products|activities|leads|notes — cards-resumo (base local). */
    public static function entityStats(string $method, PDO $pdo): void
    {
        requireMethod(['GET']);
        $q = pipe_query(['entity']);
        $entity = (string)($q['entity'] ?? '');
        // Allow-list: a entidade NUNCA entra em SQL; so escolhe qual consulta constante roda.
        if (!in_array($entity, PipeMetricsRepository::entidadesComStats(), true)) {
            ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 422, [
                'reason' => 'ENTIDADE_INVALIDA',
                'aceitas' => PipeMetricsRepository::entidadesComStats(),
            ]);
        }
        $m = new PipeMetricsRepository($pdo);
        ApiResponse::success($m->entityStats($entity), ['ts' => date('c')]);
    }

    public static function dealProducts(string $method, PDO $pdo): void
    {
        requireMethod(['POST']);
        AuthHelpers::requireAuth(80); // rotina cara (consome token) — so admin

        $body = pipe_body();
        $opts = ['run_type' => 'manual'];
        if (isset($body['maxDeals']) && is_numeric($body['maxDeals'])) { $opts['maxDeals'] = (int)$body['maxDeals']; }
        if (array_key_exists('onlyActive', $body)) { $opts['onlyActive'] = (bool)$body['onlyActive']; }

        $svc = new PipeSyncService($pdo);
        $r = $svc->syncDealProducts($opts);
        if (($r['error'] ?? '') === 'SEM_CREDENCIAL') {
            ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 422, ['reason' => 'SEM_CREDENCIAL']);
        }
        ApiResponse::success($r, ['action' => 'deal-products']);
    }
}
