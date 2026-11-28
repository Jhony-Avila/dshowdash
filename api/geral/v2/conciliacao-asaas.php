<?php
declare(strict_types=1);

/**
 * GET /api/geral/v2/conciliacao-asaas.php?dias=30 — conciliação Asaas × Precifica por empresa e por dia (ACIMA_ESQUERDA, 25/11 noite).
 * INERTE: flag global nova `geral_v2_conciliacao_asaas` (ausente = 404) + a flag por pessoa `financeiro_asaas_leitura`. Só leitura.
 */
require_once __DIR__ . '/../_init.php';
require_once __DIR__ . '/../../feature-flags/resolver.php';
require_once __DIR__ . '/../GeralV2Conciliacao.php';

$flag = static function (string $k, ?int $u): bool {
    try { return (bool) ((new FeatureFlagResolver(getConnection('DSHOWDASH')))->resolve($k, $u)['enabled'] ?? false); }
    catch (Throwable $e) { error_log('[geral-v2] conciliacao flags: ' . get_class($e)); return false; }
};
if (!$flag('geral_v2_conciliacao_asaas', null)) ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404);
$usuario = geral_v2_portao();
// DDI-001 (GPT DATA + critério do GPT Warps, 28/11): só com CONCESSÃO PESSOAL vigente (decisor único FinanceiroAcesso), decidida ANTES de
// qualquer leitura; sem concessão (inclusive global/rollout ligados) = 403; falha da consulta individual = 503; nunca com valores.
require_once __DIR__ . '/../../_helpers/FinanceiroAcesso.php';
FinanceiroAcesso::exigir((int) $usuario);
$d = geral_v2_q('dias');
$dias = $d !== null && preg_match('/^\d{1,2}\z/', $d) === 1 ? (int) $d : 30;
$pasta = getenv('DSHOW_ASAAS_CHAVES_DIR'); $pasta = is_string($pasta) && $pasta !== '' ? $pasta : dirname(__DIR__, 3) . '/config/asaas';
try {
    ApiResponse::success((new GeralV2Conciliacao(getConnection('DSHOWDASH'), $pasta))->comparar(AsaasChaves::padrao()->rotulos(), new DateTimeImmutable('now'), $dias));
} catch (Throwable $e) {
    error_log('[geral-v2] conciliacao: ' . get_class($e));
    ApiResponse::error(ApiResponse::ERR_DATABASE_ERROR, 503);
}
