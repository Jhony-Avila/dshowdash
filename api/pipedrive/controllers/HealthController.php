<?php
// Pipedrive / HealthController - painel de saude da sincronizacao (backlog #39).
// @version 1.0.0
// @created 2026-07-22
// @app Pipedrive Analytics
//
// GET /health  modulo(50): estado por entidade (ultima rodada + watermark + atraso),
//              rodadas recentes, fila (pendentes/mortos), erros recentes e uso da API.
//              Leitura barata da base local — nao chama a API do Pipedrive.
declare(strict_types=1);

final class PipeHealthController
{
    public static function health(string $method, PDO $pdo): void
    {
        requireMethod(['GET']);

        $hr = new PipeHealthRepository($pdo);
        $qr = new PipeQueueRepository($pdo);
        $sr = new PipeSyncRepository($pdo);

        ApiResponse::success([
            'entities' => $hr->entities(),
            'runs'     => $sr->recentRuns(10),
            'queue'    => ['stats' => $qr->stats(), 'dead' => $qr->recentDead(10)],
            'errors'   => $hr->recentErrors(15),
            'api_24h'  => $hr->apiUsage(24),
            'generated_at' => date('c'),
        ], ['ts' => date('c')]);
    }
}
