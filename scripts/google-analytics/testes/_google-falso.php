<?php
// Google FALSO para os testes do GaReal (roteador do `php -S 127.0.0.1:<porta>`). Imita: /token (confere a ASSINATURA RS256 da asserção com a
// chave pública do teste e o escopo analytics.readonly), Data API v1beta (runReport, runRealtimeReport, metadata), v1alpha (runFunnelReport) e
// Admin API v1beta (accountSummaries, dataStreams, keyEvents). Propriedade 999999999 = cota esgotada (429); 403403403 = sem permissão. Sem rede externa.
declare(strict_types=1);
header('Content-Type: application/json');
$uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
$corpo = file_get_contents('php://input') ?: '';
$b64d = static fn (string $s): string => (string)base64_decode(strtr($s, '-_', '+/') . str_repeat('=', (4 - strlen($s) % 4) % 4));
$erro = static function (int $st, string $status, string $msg): void { http_response_code($st); echo json_encode(['error' => ['code' => $st, 'status' => $status, 'message' => $msg]]); exit; };

if ($uri === '/token') {
    parse_str($corpo, $f);
    $partes = explode('.', (string)($f['assertion'] ?? ''));
    if (($f['grant_type'] ?? '') !== 'urn:ietf:params:oauth:grant-type:jwt-bearer' || count($partes) !== 3) { $erro(400, 'INVALID_ARGUMENT', 'grant'); }
    $pub = openssl_pkey_get_public((string)file_get_contents((string)getenv('FAKE_PUBKEY_FILE')));
    $ok = openssl_verify($partes[0] . '.' . $partes[1], $b64d($partes[2]), $pub, OPENSSL_ALGO_SHA256) === 1;
    $claims = json_decode($b64d($partes[1]), true);
    if (!$ok || ($claims['scope'] ?? '') !== 'https://www.googleapis.com/auth/analytics.readonly' || ($claims['exp'] ?? 0) <= time()) { $erro(401, 'UNAUTHENTICATED', 'invalid_grant'); }
    echo json_encode(['access_token' => 'tok-teste', 'expires_in' => 3600, 'token_type' => 'Bearer']); exit;
}
if (($_SERVER['HTTP_AUTHORIZATION'] ?? '') !== 'Bearer tok-teste') { $erro(401, 'UNAUTHENTICATED', 'token'); }
if (!preg_match('#properties/(\d+)#', $uri, $m) && !str_contains($uri, 'accountSummaries')) { $erro(404, 'NOT_FOUND', 'rota'); }
$prop = $m[1] ?? '';
if ($prop === '999999999') { $erro(429, 'RESOURCE_EXHAUSTED', 'quota'); }
if ($prop === '403403403') { $erro(403, 'PERMISSION_DENIED', 'perm'); }
$q = json_decode($corpo ?: '{}', true) ?: [];
$cota = ['tokensPerDay' => ['consumed' => 10, 'remaining' => 199990]];

if (str_contains($uri, 'accountSummaries')) { echo json_encode(['accountSummaries' => [['account' => 'accounts/1', 'displayName' => 'Conta Teste', 'propertySummaries' => [['property' => 'properties/123456789', 'displayName' => 'Site Teste', 'propertyType' => 'PROPERTY_TYPE_ORDINARY']]]]]); exit; }
if (str_ends_with($uri, '/dataStreams')) { echo json_encode(['dataStreams' => [['name' => 'properties/123456789/dataStreams/55', 'displayName' => 'Web', 'type' => 'WEB_DATA_STREAM', 'webStreamData' => ['measurementId' => 'G-TESTE', 'defaultUri' => 'https://exemplo.invalid']]]]); exit; }
if (str_ends_with($uri, '/keyEvents')) { echo json_encode(['keyEvents' => [['eventName' => 'generate_lead'], ['eventName' => 'clicou_whatsapp']]]); exit; }
if (str_ends_with($uri, '/metadata')) { echo json_encode(['name' => "properties/$prop/metadata", 'dimensions' => [], 'metrics' => []]); exit; }

$dimNomes = array_map(static fn ($d) => $d['name'], $q['dimensions'] ?? []);
$metNomes = array_map(static fn ($x) => $x['name'], $q['metrics'] ?? []);
$valorDim = static function (string $d, int $i): string {
    return match ($d) {
        'date' => date('Ymd', strtotime("-$i days")), 'sessionDefaultChannelGroup' => ['Organic Search', 'Direct', 'Paid Search'][$i % 3], 'sessionCampaignName' => ['(not set)', 'black-friday', '(organic)'][$i % 3],
        'sessionSource' => ['google', '(direct)', 'facebook'][$i % 3], 'sessionMedium' => ['cpc', '(none)', 'organic'][$i % 3], 'sessionSourceMedium' => ['google / cpc', '(direct) / (none)'][$i % 2],
        'pagePath', 'landingPage' => ['/', '/contato', '/paineis-led'][$i % 3], 'pageTitle' => ['Início', 'Contato', 'Painéis'][$i % 3],
        'eventName' => ['page_view', 'session_start', 'generate_lead', 'scrool_50', 'time_5segundos'][$i % 5], 'deviceCategory' => ['mobile', 'desktop', 'tablet'][$i % 3],
        'region' => ['State of Sao Paulo', 'Minas Gerais', 'Parana'][$i % 3], 'unifiedScreenName' => ['Início', 'Contato'][$i % 2], 'minutesAgo' => str_pad((string)$i, 2, '0', STR_PAD_LEFT),
        'cohort' => 'S' . (1 + intdiv($i, 3)), 'cohortNthWeek' => str_pad((string)($i % 3), 4, '0', STR_PAD_LEFT), 'itemName' => 'Painel ' . $i, default => 'x' . $i,
    };
};
if (str_contains($uri, ':runFunnelReport')) {
    $passos = $q['funnel']['steps'] ?? [];
    $rows = []; $u = 1000; foreach ($passos as $i => $p) { $rows[] = ['dimensionValues' => [['value' => ($i + 1) . '. ' . $p['name']]], 'metricValues' => [['value' => (string)$u]]]; $u = intdiv($u * 6, 10); }
    echo json_encode(['funnelTable' => ['rows' => $rows], 'propertyQuota' => $cota]); exit;
}
$rows = [];
if (str_contains($uri, ':runRealtimeReport') && !$dimNomes) {
    foreach ($q['minuteRanges'] ?? [] as $r) { $rows[] = ['dimensionValues' => [['value' => $r['name']]], 'metricValues' => [['value' => $r['name'] === '5' ? '7' : '31']]]; }
} else {
    $n = $dimNomes ? (isset($q['cohortSpec']) ? 12 : 6) : 1;
    $faixas = count($q['dateRanges'] ?? []);
    for ($i = 0; $i < $n; $i++) {
        foreach ($faixas > 1 ? range(0, $faixas - 1) : [null] as $fx) {
            $dv = array_map(static fn ($d) => ['value' => $valorDim($d, $i)], $dimNomes);
            if ($fx !== null) { $dv[] = ['value' => 'date_range_' . $fx]; }
            $mv = array_map(static fn ($m) => ['value' => (string)(in_array($m, ['engagementRate'], true) ? 0.55 : ($fx === 1 ? 80 : 100) + $i * 7)], $metNomes);
            $rows[] = ['dimensionValues' => $dv, 'metricValues' => $mv];
        }
    }
}
echo json_encode(['rows' => $rows, 'rowCount' => count($rows), 'propertyQuota' => $cota]);
