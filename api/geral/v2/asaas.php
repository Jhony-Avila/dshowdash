<?php
declare(strict_types=1);

/**
 * GET /api/geral/v2/asaas.php — cartão do Asaas da Geral V2 (ACIMA_ESQUERDA, 25/11 noite). INERTE por padrão:
 *   1) flag global `geral_v2_asaas` (nova; ausente = desligada) → senão 404;
 *   2) sessão + nível ≥ 50 (o portão comum da Geral V2);
 *   3) a pessoa precisa da flag do Asaas `financeiro_asaas_leitura` (a mesma do resumo do Asaas) → senão 404 (nunca mostra dinheiro a quem não pode).
 * Só leitura do banco local; nunca chama o Asaas.
 */
require_once __DIR__ . '/../_init.php';
require_once __DIR__ . '/../../feature-flags/resolver.php';
require_once __DIR__ . '/../GeralV2Asaas.php';

$flag = static function (string $k, ?int $u): bool {
    try { return (bool) ((new FeatureFlagResolver(getConnection('DSHOWDASH')))->resolve($k, $u)['enabled'] ?? false); }
    catch (Throwable $e) { error_log('[geral-v2] asaas flags: ' . get_class($e)); return false; }
};
if (!$flag('geral_v2_asaas', null)) ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404);
$usuario = geral_v2_portao();
// DDI-001 (GPT DATA + critério do GPT Warps, 28/11): só com CONCESSÃO PESSOAL vigente (decisor único FinanceiroAcesso), decidida ANTES de
// qualquer leitura; sem concessão (inclusive global/rollout ligados) = 403; falha da consulta individual = 503; nunca com valores.
require_once __DIR__ . '/../../_helpers/FinanceiroAcesso.php';
FinanceiroAcesso::exigir((int) $usuario);
try {
    $pdo = getConnection('DSHOWDASH');
    ApiResponse::success((new GeralV2Asaas($pdo))->cartao(AsaasChaves::padrao()->rotulos(), new DateTimeImmutable('now')));
} catch (Throwable $e) {
    error_log('[geral-v2] asaas: ' . get_class($e));
    ApiResponse::error(ApiResponse::ERR_DATABASE_ERROR, 503);   // "—" na tela, nunca zero
}
