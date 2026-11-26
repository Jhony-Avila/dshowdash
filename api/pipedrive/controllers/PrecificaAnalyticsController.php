<?php
/**
 * GET /api/pipedrive/precifica-analytics?from=&to=&seller= — Precifica Analytics (contrato precifica-analytics.md v1.1, leitura pelo Dash).
 * Sessão + nível do módulo (pipe_require_access, ≥ 50) já checados no roteador; o escopo (todos ≥ 80 / meus) é decidido aqui.
 */
declare(strict_types=1);

final class PipePrecificaAnalyticsController
{
    public static function get(string $method): void
    {
        requireMethod(['GET']);
        $q = static fn (string $k): ?string => is_string($_GET[$k] ?? null) ? $_GET[$k] : null;
        $agora = new DateTimeImmutable('now', new DateTimeZone('UTC'));
        $per = PrecificaAnalytics::periodo($q('from'), $q('to'), $agora);
        $vend = $q('seller');
        if ($per === null || ($vend !== null && !preg_match('/^(-|[0-9]{1,18})$/', $vend))) {
            ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 400, ['message' => 'Período ou vendedor inválido.']);
            return;
        }
        $u = AuthHelpers::getCurrentUser() ?? [];
        try { $pdo = getConnection('DSHOWDASH'); } catch (Throwable $e) { error_log('[precifica-analytics] conexão: ' . get_class($e)); $pdo = null; }
        $out = (new PrecificaAnalytics($pdo, $agora))->ler($per[0], $per[1], AuthHelpers::getCurrentUserLevel(), (string) ($u['email'] ?? ''), $vend);
        ApiResponse::success($out, ['ts' => date('c')]);
    }
}
