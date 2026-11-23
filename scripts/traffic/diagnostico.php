<?php
declare(strict_types=1);
// scripts/traffic/diagnostico.php — UMA consulta de fluxo à TomTom no centro de SP, para ver o que o provedor responde (23/11/2026).
// Rodar como o usuário do php-fpm, dentro da release:  sudo -u www-data php scripts/traffic/diagnostico.php
// Imprime SÓ: provedor, status HTTP, classe da falha e o código/mensagem de erro que a TomTom devolveu. NUNCA a URL nem a chave.
// Custa 1 chamada da cota diária.
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
require_once __DIR__ . '/../../config/db_connection.php';   // carrega o ambiente da release (como o Trânsito faz)
require_once __DIR__ . '/../../api/traffic/lib/http.php';
$cfg = require __DIR__ . '/../../api/traffic/config.php';
$chave = getenv('TOMTOM_TRAFFIC_API_KEY');
echo 'provedor configurado: ', $cfg['provider'] ?? '?', ' · chave presente: ', ($chave !== false && $chave !== '') ? 'sim' : 'NÃO', "\n";
if ($chave === false || $chave === '') exit(2);
$t = $cfg['tomtom']; $c = $cfg['center'];
$url = $t['base_url'] . $t['endpoints']['flow_segment'] . '?point=' . rawurlencode($c['lat'] . ',' . $c['lng']) . '&unit=KMPH&key=' . rawurlencode($chave);
unset($chave);
$r = traffic_http_get($url, (int) $t['timeout_flow']);
unset($url);
$classe = traffic_http_classificar($r['status'], $r['json']);
echo 'status HTTP: ', $r['status'], ' · classe: ', $classe, "\n";
$j = $r['json'] ?? [];
if ($classe === 'ok') {
    $f = $j['flowSegmentData'] ?? [];
    echo 'fluxo: velocidade atual ', $f['currentSpeed'] ?? 'AUSENTE', ' km/h · livre ', $f['freeFlowSpeed'] ?? 'AUSENTE', " km/h\n";
} else {
    // só os campos de erro conhecidos da TomTom (nada de corpo inteiro)
    foreach (['error', 'httpStatusCode', 'detailedError'] as $k) {
        if (isset($j[$k])) echo $k, ': ', is_array($j[$k]) ? json_encode(array_intersect_key($j[$k], array_flip(['code', 'message', 'target']))) : (string) $j[$k], "\n";
    }
}
exit($classe === 'ok' ? 0 : 1);
