<?php
// MIG-001 degrau 1 (LOTE9; AZUL 26/11 noite) — o indicador do rodapé financeiro NÃO consulta mais a fonte legada INTEGRACAO.requisicoes.
// (1) estático: sem `requisicoes`, sem getConnection/db_connection, sem cache Redis, portão de acesso (_init.php) antes de tudo;
// (2) execução isolada (cópia do endpoint + ApiResponse REAL + _init.php vazio, numa pasta temporária própria): HTTP 503 e corpo
//     {ok:false, data:null, error:"LEGACY_SOURCE_UNAVAILABLE", meta.message} (MIG-001-R1: UNAVAILABLE, não RETIRED); nenhuma conexão tentada;
// (3) a baseline do detector de schema drift não carrega mais a linha do financial.php.
// Contraprova (só estática — o original abriria a config de produção): o financial.php da P87 falha em (1).
declare(strict_types=1);
$raiz = realpath(__DIR__ . '/../..');
$alvo = $argv[1] ?? ($raiz . '/api/status/financial.php');
$f = []; $n = 0; $ok = static function (bool $c, string $nome) use (&$f, &$n): void { $n++; if (!$c) { $f[] = $nome; } };
$src = (string)file_get_contents($alvo);
$cod = (string)preg_replace('#^\s*//.*$#m', '', $src);
$ok(!preg_match('/requisicoes/i', $cod), 'sem a tabela legada requisicoes');
$ok(!preg_match('/getConnection|db_connection|new\s+PDO|INTEGRACAO/i', $cod), 'sem conexão a banco');
$ok(!preg_match('/RedisHelper::(serveIfCached|cacheAndReturn)/', $cod), 'sem cache (o 503 não pode ser servido nem guardado como sucesso)');
$pi = strpos($cod, "_init.php"); $pe = strpos($cod, "ApiResponse::error");
$ok($pi !== false && $pe !== false && $pi < $pe, 'portão de acesso (_init.php) antes da resposta');
if (!isset($argv[1])) {
    $tmp = sys_get_temp_dir() . '/esq-fin-' . getmypid();
    mkdir("$tmp/api/status", 0700, true); mkdir("$tmp/api/_helpers", 0700, true);
    copy($alvo, "$tmp/api/status/financial.php");
    copy($raiz . '/api/_helpers/ApiResponse.php', "$tmp/api/_helpers/ApiResponse.php");
    file_put_contents("$tmp/api/status/_init.php", "<?php\nfunction getConnection(...\$a) { fwrite(STDERR, 'CONEXAO-TENTADA'); exit(9); }\n");
    file_put_contents("$tmp/prep.php", "<?php register_shutdown_function(static function () { fwrite(STDERR, 'HTTP=' . (int)http_response_code()); });\n");
    $cmd = escapeshellarg(PHP_BINARY) . ' -d auto_prepend_file=' . escapeshellarg("$tmp/prep.php") . ' ' . escapeshellarg("$tmp/api/status/financial.php");
    $p = proc_open($cmd, [1 => ['pipe', 'w'], 2 => ['pipe', 'w']], $pp);
    $out = stream_get_contents($pp[1]); $err = stream_get_contents($pp[2]); fclose($pp[1]); fclose($pp[2]); proc_close($p);
    foreach (['api/status/financial.php', 'api/status/_init.php', 'api/_helpers/ApiResponse.php', 'prep.php'] as $x) { @unlink("$tmp/$x"); }
    @rmdir("$tmp/api/status"); @rmdir("$tmp/api/_helpers"); @rmdir("$tmp/api"); @rmdir($tmp);   // só o temporário deste teste
    $j = json_decode($out, true);
    $ok(str_contains($err, 'HTTP=503'), 'HTTP 503 · stderr ' . substr($err, 0, 80));
    $ok(!str_contains($err, 'CONEXAO-TENTADA'), 'nenhuma conexão tentada');
    $ok(is_array($j) && $j['ok'] === false && $j['data'] === null && $j['error'] === 'LEGACY_SOURCE_UNAVAILABLE' && is_string($j['meta']['message'] ?? null), 'corpo {ok:false, data:null, error:LEGACY_SOURCE_RETIRED, meta.message} · veio ' . substr($out, 0, 120));
    $base = (string)@file_get_contents($raiz . '/scripts/.schema-drift-baseline.txt');
    $ok(!str_contains($base, 'api/status/financial.php:'), 'baseline do schema drift sem a linha do financial.php');
}
if ($f) { echo "[ERRO] teste-financial-retirado:\n - " . implode("\n - ", $f) . "\n"; exit(1); }
echo "[OK]   teste-financial-retirado: $n verificações (sem requisicoes/banco/cache, portão antes, 503 LEGACY_SOURCE_UNAVAILABLE sem conexão)\n";
