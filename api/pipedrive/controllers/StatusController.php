<?php
// Pipedrive / StatusController - status da integracao (header §7.5 + tela Config)
// @version 1.0.0
// @created 2026-07-21
// @app Pipedrive Analytics
declare(strict_types=1);

final class PipeStatusController
{
    /** GET /status — estado da credencial/integracao. Sem token. */
    public static function status(string $method, PDO $pdo): void
    {
        requireMethod(['GET']);
        $repo = new PipeAccountRepository($pdo);
        ApiResponse::success($repo->publicStatus(), ['ts' => date('c')]);
    }
}
