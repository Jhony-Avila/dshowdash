<?php
// ═══ APOSENTADO em 27/11/2026 (decisão do Jhony, 05:00) ═══ carrossel da tela inicial · slide-02.
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
// Carousel Slide 02 - Distribuicao de Status
// @version 2.3.0-P06-ENTERPRISE

require_once __DIR__ . '/../../_init.php';

$CACHE_KEY = 'carousel:slide-02';
$CACHE_TTL = RedisConfig::TTL_UI;

if (RedisHelper::serveIfCached($CACHE_KEY)) { exit; }

require_once '/var/www/dshowdash/config/db_connection.php';

try {
    $conn = getConnection('INTEGRACAO');

    $distribution = $conn->query("SELECT status, COUNT(*) as count, ROUND((COUNT(*) / (SELECT COUNT(*) FROM sync_jobs_history WHERE DATE(execution_start) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY))) * 100, 2) as percentage FROM sync_jobs_history WHERE DATE(execution_start) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) GROUP BY status ORDER BY count DESC")->fetchAll(PDO::FETCH_ASSOC);
    $total = array_sum(array_column($distribution, 'count'));

    $daily = $conn->query("SELECT DATE(execution_start) as date, SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success_count, SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as error_count, COUNT(*) as total FROM sync_jobs_history WHERE DATE(execution_start) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) GROUP BY DATE(execution_start) ORDER BY date ASC")->fetchAll(PDO::FETCH_ASSOC);

    $data = ['period' => '7 dias', 'total' => $total, 'distribution' => $distribution, 'daily' => $daily];

    $output = ApiResponse::buildSuccess($data, ['version' => '2.3.0-P06-ENTERPRISE']);
    RedisHelper::cacheAndReturn($CACHE_KEY, $output, $CACHE_TTL);

} catch (Exception $e) {
    RedisHelper::close();
    ApiResponse::error(ApiResponse::ERR_INTERNAL_ERROR, 500);
}
