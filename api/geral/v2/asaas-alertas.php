<?php
declare(strict_types=1);

/**
 * GET /api/geral/v2/asaas-alertas.php?limite=5000 — alertas "vencidas acima de R$ X" por empresa, no formato AlertOut do app.
 * Mesmas travas do cartão do Asaas: flag global geral_v2_asaas (ausente = 404) + a flag por pessoa financeiro_asaas_leitura. Só leitura.
 */
require_once __DIR__ . '/../_init.php';
require_once __DIR__ . '/../../feature-flags/resolver.php';
require_once __DIR__ . '/../GeralV2Asaas.php';

$flag = static function (string $k, ?int $u): bool {
    try { return (bool) ((new FeatureFlagResolver(getConnection('DSHOWDASH')))->resolve($k, $u)['enabled'] ?? false); }
    catch (Throwable $e) { error_log('[geral-v2] asaas-alertas flags: ' . get_class($e)); return false; }
};
if (!$flag('geral_v2_asaas', null)) ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404);
$usuario = geral_v2_portao();
if (!$flag('financeiro_asaas_leitura', $usuario)) ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404);
$lim = geral_v2_q('limite');
$cent = $lim !== null && preg_match('/^\d{1,10}(\.\d{1,2})?\z/', $lim) === 1 ? AsaasValor::centavos($lim) : 500000;   // padrão R$ 5.000,00
try {
    ApiResponse::success((new GeralV2Asaas(getConnection('DSHOWDASH')))->alertas(AsaasChaves::padrao()->rotulos(), new DateTimeImmutable('now'), $cent));
} catch (Throwable $e) {
    error_log('[geral-v2] asaas-alertas: ' . get_class($e));
    ApiResponse::error(ApiResponse::ERR_DATABASE_ERROR, 503);
}
