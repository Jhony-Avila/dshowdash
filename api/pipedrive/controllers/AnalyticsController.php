<?php
// Pipedrive / AnalyticsController - rankings dedicados + previsao de fechamento.
// @version 1.1.0
// @created 2026-07-22
// @app Pipedrive Analytics
//
// v1.1.0 (2026-07-27): + GET /lost-reasons (Backlog 06 #30 e a taxa por motivo do #5).
//
// GET /lost-reasons modulo(50): motivos de perda — ranking, tendencia, etapa e dono.
// GET /rankings   modulo(50): vendedores/produtos/organizacoes por valor (base local).
// GET /forecast   modulo(50): valor x probabilidade por etapa e por mes (base local).
// GET /conversion modulo(50): win-rate, ciclo add->won e idade por etapa.
// GET /funnel     modulo(50): alcance/conversao/gargalo por etapa + comparacao (Fase 4).
// GET /summary    modulo(50): KPIs da janela + MESMA janela anterior (Fase 4).
// Todos sao leitura barata (nao chamam a API do Pipedrive).
declare(strict_types=1);

final class PipeAnalyticsController
{
    public static function rankings(string $method, PDO $pdo): void
    {
        requireMethod(['GET']);
        $q = pipe_query(['limit']);
        $limit = isset($q['limit']) && is_numeric($q['limit']) ? (int)$q['limit'] : 20;
        $limit = max(5, min($limit, 100));

        $repo = new PipeAnalyticsRepository($pdo);
        ApiResponse::success([
            'sellers'  => $repo->sellerRanking($limit),
            'products' => $repo->productRanking($limit),
            'orgs'     => $repo->orgRanking($limit),
            'limit'    => $limit,
        ], ['ts' => date('c')]);
    }

    public static function forecast(string $method, PDO $pdo): void
    {
        requireMethod(['GET']);
        $pl = isset($_GET['pipeline_id']) && ctype_digit((string)$_GET['pipeline_id'])
            ? (int)$_GET['pipeline_id'] : null;

        // #26 — mesmos recortes do Kanban, para o ponderado do quadro filtrado bater
        // com a lista que ele desenha. A tela de Previsao nao passa nenhum dos dois.
        $owner = isset($_GET['owner_id']) && ctype_digit((string)$_GET['owner_id']) ? (int)$_GET['owner_id'] : null;
        $prazo = isset($_GET['prazo']) && in_array($_GET['prazo'], PipeSyncRepository::KANBAN_PRAZOS, true)
            ? (string)$_GET['prazo'] : null;

        $repo = new PipeAnalyticsRepository($pdo);
        $fc = $repo->forecast($pl, $owner, $prazo);
        $fc['pipelines']   = $repo->pipelinesList();
        $fc['pipeline_id'] = $pl;
        ApiResponse::success($fc, ['ts' => date('c')]);
    }

    /** GET /funnel — funil visual (alcance/conversao/gargalo) + comparacao entre funis. */
    public static function funnel(string $method, PDO $pdo): void
    {
        requireMethod(['GET']);
        $repo = new PipeAnalyticsRepository($pdo);
        ApiResponse::success($repo->funnelAnalysis(), ['ts' => date('c')]);
    }

    public static function conversion(string $method, PDO $pdo): void
    {
        requireMethod(['GET']);
        $pl = isset($_GET['pipeline_id']) && ctype_digit((string)$_GET['pipeline_id'])
            ? (int)$_GET['pipeline_id'] : null;

        $repo = new PipeAnalyticsRepository($pdo);
        $cc = $repo->conversionCycle($pl);
        $cc['pipelines']   = $repo->pipelinesList();
        $cc['pipeline_id'] = $pl;
        ApiResponse::success($cc, ['ts' => date('c')]);
    }

    /**
     * GET /lost-reasons?months=12&pipeline_id= — analise dos motivos de perda (#30).
     * `months=0` abre o historico completo (a base tem perdas desde 2016).
     */
    public static function lostReasons(string $method, PDO $pdo): void
    {
        requireMethod(['GET']);
        $q = pipe_query(['months']);
        $months = isset($q['months']) && is_numeric($q['months']) ? (int)$q['months'] : 12;
        $pl = isset($_GET['pipeline_id']) && ctype_digit((string)$_GET['pipeline_id'])
            ? (int)$_GET['pipeline_id'] : null;

        $repo = new PipeAnalyticsRepository($pdo);
        $lr = $repo->lostReasons($months, $pl);
        $lr['pipeline_id'] = $pl;
        ApiResponse::success($lr, ['ts' => date('c')]);
    }

    /** GET /summary?days=30 — KPIs da janela + MESMA janela anterior (Fase 4). */
    public static function summary(string $method, PDO $pdo): void
    {
        requireMethod(['GET']);
        $q = pipe_query(['days']);
        $days = isset($q['days']) && is_numeric($q['days']) ? (int)$q['days'] : 30;

        $repo = new PipeAnalyticsRepository($pdo);
        ApiResponse::success($repo->summary($days), ['ts' => date('c')]);
    }
}
