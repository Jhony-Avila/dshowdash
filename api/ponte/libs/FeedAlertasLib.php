<?php
declare(strict_types=1);

/**
 * /api/ponte/libs/FeedAlertasLib.php — LEITURA `feed_alertas.listar` pela Ponte v2: o feed de alertas da Início do app (ESQUERDA, 25/11/2026 noite).
 * Junta, no formato AlertOut (contrato da ACIMA_ESQUERDA, app/20261125-pipedrive-c2/CONTRATO-ALERTAS-APP.md), os alertas que o Dash JÁ calcula:
 *   Pipedrive  PipeAnalyticsRepository::alertasApp (parado ≥ 30 d, sem próxima atividade, valor ≥ R$ 50.000 sem dono ativo)
 *   Asaas      GeralV2Asaas::alertas (vencidas acima de R$ 5.000 por empresa; empresa sem leitura = info "não é zero")
 * Nada de cópia de regra: os limiares são os PADRÕES do contrato e o app não os escolhe (até o Jhony decidir).
 * Asaas só com as MESMAS travas do cartão: flag global `geral_v2_asaas` + flag por pessoa `financeiro_asaas_leitura` (senão `sem_permissao`).
 * Uma fonte que falha não derruba a outra: `fontes.<x>` = ok | indisponivel | sem_permissao; os alertas de uma fonte que não está `ok` NÃO
 * entram (o app mostra "—" para ela, nunca "sem alertas"). Ordem: critical → warning → info, depois o mais antigo (`first_seen_at`), depois `id`.
 */

const FEED_ALERTAS_MAX = 500;
const FEED_ALERTAS_SEV = ['critical' => 0, 'warning' => 1, 'info' => 2];

/**
 * Núcleo puro (testável sem banco): cada fonte é uma função. `pipedrive()` devolve o array do alertasApp ou null (leitura indisponível);
 * `asaas()` o array do GeralV2Asaas::alertas; `podeAsaas()` diz se a pessoa passa nas travas do Asaas (só então `asaas()` é chamada).
 */
function feed_alertas_montar(callable $pipedrive, callable $asaas, callable $podeAsaas, ?int $agora = null): array
{
    $fontes = []; $alertas = [];
    $junta = static function (string $nome, callable $ler) use (&$fontes, &$alertas): void {
        try {
            $r = $ler();
            if (!is_array($r) || !is_array($r['alertas'] ?? null)) { $fontes[$nome] = 'indisponivel'; return; }
            foreach ($r['alertas'] as $a) { if (is_array($a) && is_string($a['id'] ?? null)) { $alertas[] = $a; } }
            $fontes[$nome] = 'ok';
        } catch (Throwable $e) {
            error_log('[ponte] feed_alertas ' . $nome . ': ' . get_class($e));
            $fontes[$nome] = 'indisponivel';
        }
    };
    $junta('pipedrive', $pipedrive);
    $pode = false;
    try { $pode = (bool)$podeAsaas(); } catch (Throwable $e) { error_log('[ponte] feed_alertas flags do asaas: ' . get_class($e)); }
    if ($pode) { $junta('asaas', $asaas); } else { $fontes['asaas'] = 'sem_permissao'; }

    usort($alertas, static function (array $a, array $b): int {
        $s = (FEED_ALERTAS_SEV[$a['severity'] ?? ''] ?? 3) <=> (FEED_ALERTAS_SEV[$b['severity'] ?? ''] ?? 3);
        if ($s !== 0) { return $s; }
        $fa = $a['first_seen_at'] ?? null; $fb = $b['first_seen_at'] ?? null;
        if ($fa !== $fb) { return $fa === null ? 1 : ($fb === null ? -1 : strcmp((string)$fa, (string)$fb)); }
        return strcmp($a['id'], $b['id']);
    });
    return ['gerado_em' => gmdate('Y-m-d\TH:i:s\Z', $agora ?? time()), 'fontes' => $fontes, 'total' => count($alertas),
            'alertas' => array_slice($alertas, 0, FEED_ALERTAS_MAX)];
}

/** Fontes reais (só carregadas quando a ação roda; os repositórios não entram em toda chamada da ponte). */
function feed_alertas_ler(PDO $pdo, int $userId): array
{
    require_once __DIR__ . '/../../pipedrive/repositories/AnalyticsRepository.php';
    require_once __DIR__ . '/../../geral/GeralV2Asaas.php';
    require_once __DIR__ . '/../../feature-flags/resolver.php';
    return feed_alertas_montar(
        static fn () => (new PipeAnalyticsRepository(getConnection('PIPE_DSHOW')))->alertasApp(),
        static fn () => (new GeralV2Asaas($pdo))->alertas(AsaasChaves::padrao()->rotulos(), new DateTimeImmutable('now'), 500000),
        static function () use ($pdo, $userId): bool {
            $r = new FeatureFlagResolver($pdo);
            return (bool)($r->resolve('geral_v2_asaas', null)['enabled'] ?? false) && (bool)($r->resolve('financeiro_asaas_leitura', $userId)['enabled'] ?? false);
        }
    );
}
