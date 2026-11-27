<?php
// Card 06 - Jobs com Falha Hoje
// @version 4.4.0-P06-ENTERPRISE
// @changelog v4.4.0-P06: Migrado para ApiResponse

require_once __DIR__ . '/../_init.php';
// SEC-002 lote S2 (27/11): portão de sessão antes do cache e do banco — 401 sem sessão; interno = CLI/loopback.
require_once __DIR__ . '/../../../core/AcessoSessao.php';
AcessoSessao::exigir();

$CACHE_KEY = 'card:06:failed:' . date('Y-m-d-H');
$CACHE_TTL = RedisConfig::TTL_MODULES;

// MIG-001 lote 1 (27/11, VINHO): com a flag global obs_monitoramento, o número sai do REGISTRO CENTRAL (OBS-001) no MESMO formato
// (cache próprio; registro fora = 503, nunca zero); sem a flag, o legado da INTEGRACAO abaixo, como sempre.
require_once __DIR__ . '/../../../obs/ObsConsumidor.php';
if (ObsConsumidor::ligado()) ObsConsumidor::responder($CACHE_KEY, (int) $CACHE_TTL, '4.4.0-P06-ENTERPRISE', fn(ObsExecucoes $o) => (fn($d) => ['value' => $d['falhas'], 'failed' => $d['falhas'], 'title' => 'Jobs com Falha'])($o->contagensDoDia(new DateTimeImmutable('now'))));

if (RedisHelper::serveIfCached($CACHE_KEY)) { exit; }
require_once '/var/www/dshowdash/config/db_connection.php';

try {
    $conn = getConnection('INTEGRACAO');
    $stmt = $conn->query("
        SELECT COUNT(*) as failed
        FROM sync_jobs_history
        WHERE DATE(execution_start) = CURDATE() AND status = 'error'
    ");
    $data = $stmt->fetch(PDO::FETCH_ASSOC);
    
    $output = ApiResponse::buildSuccess([
        'value' => isset($data['failed']) ? (int) $data['failed'] : null,   // MIG-001 INTEGRACAO (27/11, VINHO): a tela lê `value` (formatters.js); a API não mandava → o card mostrava sempre 0/--. Agora `value` = o número real ou null.
        'failed' => (int)($data['failed'] ?? 0),
        'title' => 'Jobs com Falha'
    ], ['version' => '4.4.0-P06-ENTERPRISE', 'cache' => 'miss']);
    
    RedisHelper::cacheAndReturn($CACHE_KEY, $output, $CACHE_TTL);

} catch (Exception $e) {
    RedisHelper::close();
    error_log(basename(dirname(__FILE__)) . ' error: ' . $e->getMessage());
    ApiResponse::error(ApiResponse::ERR_INTERNAL_ERROR, 500);
}
