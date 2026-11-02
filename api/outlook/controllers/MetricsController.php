<?php
// Outlook / MetricsController - GET /header-counter (badge do header)
// @version 1.0.0
// @created 2026-07-21
declare(strict_types=1);

final class OutlookMetricsController
{
    public static function headerCounter(string $method, PDO $pdo): void
    {
        if ($method !== 'GET') {
            ApiResponse::error(ApiResponse::ERR_METHOD_NOT_ALLOWED, 405);
            return;
        }
        $userId = getCurrentUserId();
        $tz = (string)($_SESSION['timezone'] ?? 'America/Sao_Paulo');
        try {
            $svc = new OutlookMetricsService($pdo, new OutlookAuthService($pdo));
            $data = $svc->headerCounter($userId, $tz);
        } catch (\Throwable $e) {
            error_log('[outlook] headerCounter falhou: ' . $e->getMessage());
            $data = ['received_today' => 0, 'unread' => 0, 'updated_at' => gmdate('c'), 'degraded' => true];
        }
        // Cache curto no cliente: o front tambem faz polling de 60s.
        ApiResponse::success($data);
    }

    /**
     * Dashboard gerencial (§24). No modo real (graph) as series dependem da camada de
     * sincronizacao/metricas locais (Fase 2) — aqui devolve placeholder ate la.
     * No modo mock, o MockController serve os dados computados.
     */
    public static function dashboard(string $method, PDO $pdo, array $segments): void
    {
        unset($pdo, $segments);
        if ($method !== 'GET') { ApiResponse::error(ApiResponse::ERR_METHOD_NOT_ALLOWED, 405); return; }
        ApiResponse::success([
            'available' => false,
            'reason'    => 'requires_sync',
            'message'   => 'O dashboard gerencial usa métricas locais alimentadas pela sincronização (Fase 2). '
                         . 'Conecte uma conta e ative a sincronização para ver os indicadores.',
        ]);
    }
}
