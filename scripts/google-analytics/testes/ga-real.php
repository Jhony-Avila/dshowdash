<?php
// Google Analytics — teste do provedor REAL (GaReal + GaGoogleClient) contra um Google FALSO local (`php -S` com _google-falso.php).
// Prova: JWT RS256 da conta de serviço aceito pela assinatura; as 14 funções + status + propriedades devolvem AS MESMAS chaves do GaMock com
// `meta.fonte = ga4-data-api`; cota esgotada (429) → GA_COTA_ESGOTADA; sem permissão → GA_SEM_ACESSO; sem configuração → 503 com pendências;
// chave errada → GA_CREDENCIAL_INVALIDA; base de teste só em 127.0.0.1; a chave privada nunca aparece em mensagens. Uso: php ga-real.php
declare(strict_types=1);
$falhas = 0; $n = 0;
$ok = static function (string $nome, bool $cond, string $det = '') use (&$falhas, &$n): void { $n++; if (!$cond) { $falhas++; echo "[ERRO] $nome" . ($det ? " — $det" : '') . "\n"; } };
$tmp = sys_get_temp_dir() . '/ga-real-' . getmypid(); @mkdir($tmp, 0700, true);
$novaChave = static function () { $k = openssl_pkey_new(['private_key_bits' => 2048, 'private_key_type' => OPENSSL_KEYTYPE_RSA]); openssl_pkey_export($k, $priv); return [$priv, openssl_pkey_get_details($k)['key']]; };
[$priv, $pub] = $novaChave(); [$privErrada] = $novaChave();
file_put_contents("$tmp/pub.pem", $pub);
$conta = static function (string $arq, string $chave): string { file_put_contents($arq, json_encode(['type' => 'service_account', 'client_email' => 'ga-leitura@teste.iam.gserviceaccount.com', 'private_key' => $chave, 'token_uri' => 'https://oauth2.googleapis.com/token'])); chmod($arq, 0600); return $arq; };
$conta("$tmp/sa.json", $priv); $conta("$tmp/sa-errada.json", $privErrada);
$porta = 0; $sock = stream_socket_server('tcp://127.0.0.1:0'); $porta = (int)substr(strrchr(stream_socket_get_name($sock, false), ':'), 1); fclose($sock);
$srv = proc_open([PHP_BINARY, '-d', 'error_log=/dev/null', '-S', "127.0.0.1:$porta", __DIR__ . '/_google-falso.php'], [1 => ['file', '/dev/null', 'w'], 2 => ['file', '/dev/null', 'w']], $p, null, ['FAKE_PUBKEY_FILE' => "$tmp/pub.pem"] + getenv());
for ($i = 0; $i < 50 && @fsockopen('127.0.0.1', $porta) === false; $i++) { usleep(100000); }
putenv('GA_CACHE_OFF=1'); putenv("GA_API_TEST_BASE=http://127.0.0.1:$porta"); putenv("GA_SERVICE_ACCOUNT_JSON=$tmp/sa.json"); putenv('GA_PROPERTY_ID=123456789'); putenv('GA_PROVIDER=real');
$_GET = []; $_SERVER['REQUEST_METHOD'] = 'GET';
require __DIR__ . '/../../../api/google-analytics/_libs.php';
try {
    $ok('base de teste aceita só 127.0.0.1', GaGoogleClient::baseTeste() === "http://127.0.0.1:$porta");
    putenv('GA_API_TEST_BASE=http://10.0.0.5:8080'); $ok('base fora do loopback é IGNORADA', GaGoogleClient::baseTeste() === null); putenv("GA_API_TEST_BASE=http://127.0.0.1:$porta");
    $ok('provedor real escolhido por GA_PROVIDER=real', ga_provider() instanceof GaReal);
    $real = new GaReal(); $mock = new GaMock(); $f = ga_filtros_de(['periodo' => '28d']);
    $st = $real->status();
    $ok('status: pronto com credencial válida (assinatura conferida pelo Google falso)', $st['pronto'] === true && $st['pendencias_para_real'] === [], json_encode($st['pendencias_para_real']));
    foreach (['overview', 'aquisicao', 'fluxoAquisicao', 'paginas', 'eventos', 'conversoes', 'ecommerce', 'usuarios', 'qualidade', 'alertas', 'insights', 'tempoReal', 'funil', 'jornada'] as $fn) {
        $r = $real->$fn($f); $m = $mock->$fn($f);
        $faltam = array_values(array_diff(array_keys($m), array_keys($r)));
        $ok("$fn: mesmas chaves do mock", $faltam === [], 'faltam ' . json_encode($faltam));
        $ok("$fn: meta.fonte = ga4-data-api", ($r['meta']['fonte'] ?? '') === 'ga4-data-api');
    }
    $p = $real->propriedades(); $ok('propriedades: conta e propriedade da Admin API', ($p['contas'][0]['propriedades'][0]['property_id'] ?? '') === '123456789');
    $o = $real->overview($f); $ok('overview: série atual e anterior separadas por date_range', count($o['serie']) === 6 && count($o['serie_anterior']) === 6 && $o['kpis'][2]['chave'] === 'sessoes');
    $c = $real->conversoes($f); $ok('conversões: generate_lead marcado como importante pela Admin API', in_array('generate_lead', array_column($c['importantes'], 'evento'), true));
    $e = $real->eventos($f); $ok('eventos: "scrool_" com aviso de grafia', (bool)array_filter($e['eventos'], static fn ($x) => $x['evento'] === 'scrool_50' && $x['diagnosticos'] !== []));
    $fu = $real->funil($f); $ok('funil: etapas do runFunnelReport', ($fu['etapas'][0]['usuarios'] ?? 0) === 1000 && count($fu['etapas']) === 6);
    $t = $real->tempoReal($f); $ok('tempo real: 5 e 30 minutos', $t['ativos_5min'] === 7 && $t['ativos_30min'] === 31);
    // erros tipados
    putenv('GA_PROPERTY_ID=999999999');
    try { (new GaReal())->overview($f); $ok('cota esgotada → exceção', false); } catch (GaIndisponivel $x) { $ok("429 → GA_COTA_ESGOTADA (503)", $x->codigo === "GA_COTA_ESGOTADA" && $x->status === 503, $x->codigo); }
    putenv('GA_PROPERTY_ID=403403403');
    try { (new GaReal())->overview($f); $ok('sem acesso → exceção', false); } catch (GaIndisponivel $x) { $ok('403 → GA_SEM_ACESSO', $x->codigo === 'GA_SEM_ACESSO'); }
    putenv('GA_PROPERTY_ID=123456789'); putenv("GA_SERVICE_ACCOUNT_JSON=$tmp/sa-errada.json");
    try { (new GaReal())->overview($f); $ok('chave errada → exceção', false); } catch (GaIndisponivel $x) { $ok('assinatura recusada → GA_CREDENCIAL_INVALIDA', $x->codigo === 'GA_CREDENCIAL_INVALIDA' && !str_contains($x->getMessage(), 'PRIVATE KEY')); }
    putenv('GA_SERVICE_ACCOUNT_JSON='); putenv('GA_PROPERTY_ID=');
    $s2 = (new GaReal())->status(); $ok('sem configuração: pronto=false com 2 pendências (sem a linha fixa antiga)', $s2['pronto'] === false && count($s2['pendencias_para_real']) === 2, json_encode($s2['pendencias_para_real']));
    try { (new GaReal())->overview($f); $ok('sem configuração → exceção', false); } catch (GaIndisponivel $x) { $ok('sem configuração → GA_PROVIDER_NAO_CONFIGURADO com pendências', $x->codigo === 'GA_PROVIDER_NAO_CONFIGURADO' && count($x->meta['pendencias'] ?? []) === 2); }
    putenv('GA_SERVICE_ACCOUNT_JSON={"type":"service_account"}'); putenv('GA_PROPERTY_ID=123456789');
    $s3 = (new GaReal())->status(); $ok('JSON colado na variável é recusado (tem de ser caminho)', $s3['pronto'] === false);
    try { ga_filtros_de(['inicio' => '31/10/2026', 'fim' => '2026-10-31']); $ok('filtro inválido → exceção', false); } catch (GaIndisponivel $x) { $ok('filtros sem exit: GA_PERIODO_INVALIDO 400', $x->codigo === 'GA_PERIODO_INVALIDO' && $x->status === 400); }
} finally {
    proc_terminate($srv); proc_close($srv);
    @array_map('unlink', glob("$tmp/*") ?: []); @rmdir($tmp);
}
echo ($falhas ? '[ERRO]' : '[OK]  ') . " ga-real: $n casos, $falhas falha(s)\n";
exit($falhas ? 1 : 0);
