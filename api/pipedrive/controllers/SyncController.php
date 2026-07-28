<?php
// Pipedrive / SyncController - disparo de sync (admin) e leitura do overview (modulo)
// @version 1.0.0
// @created 2026-07-21
// @app Pipedrive Analytics
//
// POST /sync      admin(80)+CSRF: dispara uma rodada (incremental|full). Diagnostico/
//                 recuperacao — NAO e o "sincronizar agora" de usuario (doc 03 §7).
// GET  /overview  modulo(50): metricas executivas da BASE LOCAL (nao chama a API).
declare(strict_types=1);

final class PipeSyncController
{
    public static function sync(string $method, PDO $pdo): void
    {
        requireMethod(['POST']);
        AuthHelpers::requireAuth(80); // rotina administrativa protegida

        $body = pipe_body();
        $mode = (($body['mode'] ?? 'incremental') === 'full') ? 'full' : 'incremental';
        $opts = ['run_type' => 'manual'];
        foreach (['limit', 'maxPages', 'maxItems'] as $k) {
            if (isset($body[$k]) && is_numeric($body[$k])) { $opts[$k] = (int)$body[$k]; }
        }

        $svc = new PipeSyncService($pdo);
        $r = $svc->run($mode, $opts);

        if (!($r['ok'] ?? false) && ($r['error'] ?? '') === 'SEM_CREDENCIAL') {
            ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 422, [
                'reason'  => 'SEM_CREDENCIAL',
                'message' => $r['message'] ?? 'Nenhuma credencial ativa.',
            ]);
        }
        ApiResponse::success($r, ['action' => 'sync']);
    }

    // POST /reconcile  admin(80)+CSRF: reconciliacao de exclusoes (doc 03 §4).
    // body {strategy?:'deleted-scan'|'presence', dry_run?:bool, maxPages?, maxItems?}
    public static function reconcile(string $method, PDO $pdo): void
    {
        requireMethod(['POST']);
        AuthHelpers::requireAuth(80);

        $body = pipe_body();
        $opts = ['run_type' => 'manual'];
        if (($body['strategy'] ?? '') === 'presence') { $opts['strategy'] = 'presence'; }
        if (!empty($body['dry_run'])) { $opts['dry_run'] = true; }
        foreach (['maxPages', 'maxItems', 'limit'] as $k) {
            if (isset($body[$k]) && is_numeric($body[$k])) { $opts[$k] = (int)$body[$k]; }
        }

        $svc = new PipeReconcileService($pdo);
        $r = $svc->reconcile($opts);
        if (($r['error'] ?? '') === 'SEM_CREDENCIAL') {
            ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 422, ['reason' => 'SEM_CREDENCIAL']);
        }
        ApiResponse::success($r, ['action' => 'reconcile']);
    }

    public static function overview(string $method, PDO $pdo): void
    {
        requireMethod(['GET']);
        $repo = new PipeSyncRepository($pdo);
        ApiResponse::success([
            'overview' => $repo->overview(),
            'runs'     => $repo->recentRuns(8),
            'cursors'  => $repo->cursors(),
        ], ['ts' => date('c')]);
    }
}
