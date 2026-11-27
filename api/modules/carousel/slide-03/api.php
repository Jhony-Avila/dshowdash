<?php
// ═══ APOSENTADO em 27/11/2026 (decisão do Jhony, 05:00) ═══ carrossel da tela inicial · slide-03.
// Motivo: o require abaixo aponta para api/modules/_init.php, que não existe → o endpoint respondia 500 desde sempre; nenhuma tela, menu,
// rota ou cron o consome (o componente public/components/carousel não chama /api/modules/carousel). Saiu da lista da MIG-001 (ficam 51).
// Agora: guarda de sessão (401 sem sessão, como o resto da API) e depois 410 "aposentado". O código legado fica abaixo, preservado e INALCANÇÁVEL.
// Religar = decisão nova: corrigir o caminho para __DIR__ . '/../_init.php' e manter a guarda de sessão. VINHO (ACIMA_ESQUERDA).
require_once __DIR__ . '/../../../core/AcessoSessao.php';
AcessoSessao::exigir();
require_once __DIR__ . '/../../../_helpers/ApiResponse.php';
ApiResponse::error('APOSENTADO', 410, ['aposentado_em' => '2026-11-27']);   // mesmo envelope do resto da API: {ok:false, data:null, error}
exit;
// ─── código legado (aposentado; não executa) ───
// Carousel Slide 03 - Execucoes por Hora
// @version 2.3.0-P06-ENTERPRISE

require_once __DIR__ . '/../../_init.php';

$CACHE_KEY = 'carousel:slide-03';
$CACHE_TTL = RedisConfig::TTL_METRICS;

if (RedisHelper::serveIfCached($CACHE_KEY)) { exit; }

require_once '/var/www/dshowdash/config/db_connection.php';

try {
    $conn = getConnection('INTEGRACAO');

    $hourly = $conn->query("SELECT HOUR(execution_start) as hour, SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success_count, SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as error_count, COUNT(*) as total FROM sync_jobs_history WHERE execution_start >= DATE_SUB(NOW(), INTERVAL 24 HOUR) GROUP BY HOUR(execution_start) ORDER BY hour ASC")->fetchAll(PDO::FETCH_ASSOC);

    $totalSuccess = array_sum(array_column($hourly, 'success_count'));
    $totalError = array_sum(array_column($hourly, 'error_count'));

    $data = ['period' => '24 horas', 'total_success' => $totalSuccess, 'total_error' => $totalError, 'total' => $totalSuccess + $totalError, 'hourly' => $hourly];

    $output = ApiResponse::buildSuccess($data, ['version' => '2.3.0-P06-ENTERPRISE']);
    RedisHelper::cacheAndReturn($CACHE_KEY, $output, $CACHE_TTL);

} catch (Exception $e) {
    RedisHelper::close();
    ApiResponse::error(ApiResponse::ERR_INTERNAL_ERROR, 500);
}
