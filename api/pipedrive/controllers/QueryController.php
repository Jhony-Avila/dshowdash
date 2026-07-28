<?php
// Pipedrive / QueryController - consultas de leitura da base local (modulo)
// @version 1.0.0
// @created 2026-07-21
// @app Pipedrive Analytics
//
// GET /deals          lista paginada server-side (DataGrid §23.3)
// GET /custom-fields  definicoes de campos personalizados por entidade
declare(strict_types=1);

final class PipeQueryController
{
    public static function deals(string $method, array $segments, PDO $pdo): void
    {
        requireMethod(['GET']);
        $repo = new PipeSyncRepository($pdo);
        // GET /deals/{id} -> detalhe; GET /deals -> lista paginada
        if (isset($segments[1]) && $segments[1] !== '') {
            if (!ctype_digit((string)$segments[1])) { ApiResponse::error(ApiResponse::ERR_ID_REQUIRED, 400); }
            $det = $repo->dealDetail((int)$segments[1]);
            if ($det === null) { ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404, ['message' => 'Negócio não encontrado']); }
            ApiResponse::success($det, ['ts' => date('c')]);
            return;
        }
        $f = pipe_query(['page', 'per_page', 'sort', 'dir', 'q', 'status', 'stage_id', 'owner_id',
            'value_min', 'value_max', 'close_from', 'close_to', 'created_from', 'created_to',
            'lost_reason']);
        ApiResponse::success($repo->dealsPage($f), ['ts' => date('c')]);
    }

    public static function persons(string $method, array $segments, PDO $pdo): void
    {
        requireMethod(['GET']);
        $repo = new PipeSyncRepository($pdo);
        if (isset($segments[1]) && $segments[1] !== '') {
            if (!ctype_digit((string)$segments[1])) { ApiResponse::error(ApiResponse::ERR_ID_REQUIRED, 400); }
            $det = $repo->personDetail((int)$segments[1]);
            if ($det === null) { ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404, ['message' => 'Pessoa não encontrada']); }
            ApiResponse::success($det, ['ts' => date('c')]);
            return;
        }
        $f = pipe_query(['page', 'per_page', 'sort', 'dir', 'q', 'owner_id']);
        ApiResponse::success($repo->personsPage($f), ['ts' => date('c')]);
    }

    public static function organizations(string $method, array $segments, PDO $pdo): void
    {
        requireMethod(['GET']);
        $repo = new PipeSyncRepository($pdo);
        if (isset($segments[1]) && $segments[1] !== '') {
            if (!ctype_digit((string)$segments[1])) { ApiResponse::error(ApiResponse::ERR_ID_REQUIRED, 400); }
            $det = $repo->orgDetail((int)$segments[1]);
            if ($det === null) { ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404, ['message' => 'Organização não encontrada']); }
            ApiResponse::success($det, ['ts' => date('c')]);
            return;
        }
        $f = pipe_query(['page', 'per_page', 'sort', 'dir', 'q', 'owner_id']);
        ApiResponse::success($repo->organizationsPage($f), ['ts' => date('c')]);
    }

    public static function activities(string $method, array $segments, PDO $pdo): void
    {
        requireMethod(['GET']);
        $repo = new PipeSyncRepository($pdo);
        if (isset($segments[1]) && $segments[1] !== '') {
            if (!ctype_digit((string)$segments[1])) { ApiResponse::error(ApiResponse::ERR_ID_REQUIRED, 400); }
            $det = $repo->activityDetail((int)$segments[1]);
            if ($det === null) { ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404, ['message' => 'Atividade não encontrada']); }
            ApiResponse::success($det, ['ts' => date('c')]);
            return;
        }
        $f = pipe_query(['page', 'per_page', 'sort', 'dir', 'q', 'done', 'type', 'owner_id', 'due_from', 'due_to']);
        ApiResponse::success($repo->activitiesPage($f), ['ts' => date('c')]);
    }

    public static function leads(string $method, array $segments, PDO $pdo): void
    {
        requireMethod(['GET']);
        $repo = new PipeSyncRepository($pdo);
        // {id} de lead e UUID (nao numerico) — valida formato para nao virar SQL/param invalido.
        if (isset($segments[1]) && $segments[1] !== '') {
            if (!preg_match('/^[0-9a-fA-F-]{10,64}$/', (string)$segments[1])) { ApiResponse::error(ApiResponse::ERR_ID_REQUIRED, 400); }
            $det = $repo->leadDetail((string)$segments[1]);
            if ($det === null) { ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404, ['message' => 'Lead não encontrado']); }
            ApiResponse::success($det, ['ts' => date('c')]);
            return;
        }
        $f = pipe_query(['page', 'per_page', 'sort', 'dir', 'q', 'archived']);
        ApiResponse::success($repo->leadsPage($f), ['ts' => date('c')]);
    }

    public static function products(string $method, array $segments, PDO $pdo): void
    {
        requireMethod(['GET']);
        $repo = new PipeSyncRepository($pdo);
        if (isset($segments[1]) && $segments[1] !== '') {
            if (!ctype_digit((string)$segments[1])) { ApiResponse::error(ApiResponse::ERR_ID_REQUIRED, 400); }
            $det = $repo->productDetail((int)$segments[1]);
            if ($det === null) { ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404, ['message' => 'Produto não encontrado']); }
            ApiResponse::success($det, ['ts' => date('c')]);
            return;
        }
        $f = pipe_query(['page', 'per_page', 'sort', 'dir', 'q', 'category']);
        ApiResponse::success($repo->productsPage($f), ['ts' => date('c')]);
    }

    public static function notes(string $method, PDO $pdo): void
    {
        requireMethod(['GET']);
        $f = pipe_query(['page', 'per_page', 'sort', 'dir', 'q']);
        ApiResponse::success((new PipeSyncRepository($pdo))->notesPage($f), ['ts' => date('c')]);
    }

    public static function users(string $method, PDO $pdo): void
    {
        requireMethod(['GET']);
        $f = pipe_query(['page', 'per_page', 'sort', 'dir', 'q', 'active']);
        ApiResponse::success((new PipeSyncRepository($pdo))->usersPage($f), ['ts' => date('c')]);
    }

    public static function pipelines(string $method, PDO $pdo): void
    {
        requireMethod(['GET']);
        ApiResponse::success((new PipeSyncRepository($pdo))->pipelinesOverview(), ['ts' => date('c')]);
    }

    public static function kanban(string $method, PDO $pdo): void
    {
        requireMethod(['GET']);
        $pl = isset($_GET['pipeline_id']) && ctype_digit((string)$_GET['pipeline_id']) ? (int)$_GET['pipeline_id'] : null;
        ApiResponse::success((new PipeSyncRepository($pdo))->kanbanBoard($pl), ['ts' => date('c')]);
    }

    public static function alerts(string $method, PDO $pdo): void
    {
        requireMethod(['GET']);
        ApiResponse::success((new PipeSyncRepository($pdo))->commercialAlerts(), ['ts' => date('c')]);
    }

    public static function customFields(string $method, PDO $pdo): void
    {
        requireMethod(['GET']);
        $entity = $_GET['entity'] ?? 'deal';
        if (!in_array($entity, ['deal', 'person', 'organization', 'product', 'activity'], true)) {
            $entity = 'deal';
        }
        $repo = new PipeSyncRepository($pdo);
        ApiResponse::success(['entity' => $entity, 'fields' => $repo->customFields($entity)], ['ts' => date('c')]);
    }
}
