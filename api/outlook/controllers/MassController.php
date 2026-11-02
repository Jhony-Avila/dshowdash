<?php
// Outlook / MassController - envio em massa (§23)
// @version 1.0.0
// @created 2026-07-21
// @app Integracao Outlook
//
// O envio em massa real precisa de FILA + throttling + backoff + lotes (§23.2) e da
// tabela outlook_mass_send_jobs (§28.9) + worker — Fase 3. Ate la o modo real devolve
// placeholder. No modo de testes, o MockController simula o job (progresso por tempo).
declare(strict_types=1);

final class OutlookMassController
{
    public static function route(string $method, array $segments, ?PDO $pdo = null): void
    {
        unset($pdo, $segments);
        if ($method === 'GET') {
            ApiResponse::success(['available' => false, 'message' => 'O envio em massa entra na Fase 3 (fila + throttling).']);
            return;
        }
        ApiResponse::error(ApiResponse::ERR_DATABASE_ERROR, 503, [
            'message' => 'Envio em massa indisponível até a fila de processamento (Fase 3).',
        ]);
    }
}
