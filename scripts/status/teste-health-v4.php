<?php
// HL-001 (LOTE9; AZUL, 27/11 noite) — endpoint do health: (A) avaliador v4 (5 críticos, informativo, relógio, build, disco);
// (B) responder: fotografia > 16 KiB ou inválida = 503; (C) bloco v3 dos bancos remotos executado ISOLADO (sem sondas TCP: tempo baixo;
// sem projeção = UNKNOWN e DEGRADED; projeção fresca ok = OK); (D) health.php: sem fsockopen e a rota contract=4 DEPOIS do portão de IP.
declare(strict_types=1);
$raiz = realpath(__DIR__ . '/../..');
require $raiz . '/api/core/HealthOperacionalV4.php';
$f = []; $n = 0; $ok = static function (bool $c, string $nome) use (&$f, &$n): void { $n++; if (!$c) { $f[] = $nome; } };
$SHA = str_repeat('a', 40); $T = 1_800_000_000;
$amostra = static fn (string $st = 'ok', int $idade = 1, array $x = []) => ['state' => $st, 'at' => $T - $idade, 'durationMs' => 3] + $x;
$foto = static function (array $mud = []) use ($amostra, $SHA): array {
  $s = ['database' => $amostra(), 'disk' => $amostra('ok', 1, ['usedPercent' => 50]), 'memory' => $amostra(), 'session' => $amostra(), 'redis' => $amostra(), 'remote_databases' => $amostra('retired')];
  foreach ($mud as $k => $v) { if ($v === null) { unset($s[$k]); } else { $s[$k] = $v; } }
  return ['version' => 4, 'build' => $SHA, 'samples' => $s];
};
$av = static fn (array $fo, string $b = '') => HealthOperacionalV4::avaliar($fo, $b === '' ? $SHA : $b, $T);
$r = $av($foto()); $ok($r['state'] === 'HEALTHY' && $r['publication']['allowed'] === true, 'tudo fresco e ok: HEALTHY, publicação liberada');
foreach (['database', 'disk', 'memory', 'session', 'redis'] as $c) {
  $ok(in_array($c, $av($foto([$c => null]))['publication']['blocking'], true), "crítico $c ausente bloqueia");
  $ok(in_array($c, $av($foto([$c => $amostra('ok', 16, $c === 'disk' ? ['usedPercent' => 50] : [])]))['publication']['blocking'], true), "crítico $c vencido (16 s) bloqueia");
}
$ok(in_array('build', $av($foto(), str_repeat('b', 40))['publication']['blocking'], true), 'identidade CONHECIDA e diferente da fotografia bloqueia');
foreach ([null, '', 'lixo'] as $desc) {
  $u = HealthOperacionalV4::avaliar($foto(), $desc, $T);
  $ok($u['publication']['allowed'] === true && $u['state'] === 'DEGRADED' && ($u['identity'] ?? '') === 'unknown' && in_array('build', $u['publication']['warnings'], true) && $u['build'] === null,
      'identidade desconhecida (' . var_export($desc, true) . '): só aviso informativo, nunca 503 geral');
}
$ok(in_array('version', $av(['version' => 3] + $foto())['publication']['blocking'], true), 'fotografia com version ≠ 4 bloqueia');
$d = static fn (float $p) => $av($foto(['disk' => $amostra('ok', 1, ['usedPercent' => $p])]));
$ok($d(84.9)['checks']['disk']['state'] === 'ok' && $d(85)['checks']['disk']['state'] === 'warning' && $d(85)['publication']['allowed'] && $d(92)['checks']['disk']['state'] === 'failed' && !$d(92)['publication']['allowed'] && $d(101)['checks']['disk']['state'] === 'invalid', 'disco: <85 ok · 85 aviso (segue) · 92 bloqueia · >100 inválido');
$ok(in_array('redis', $av($foto(['redis' => $amostra('retired')]))['publication']['blocking'], true), 'crítico "retired" é inválido e bloqueia');
$x = $av($foto(['remote_databases' => null])); $ok($x['publication']['allowed'] && $x['state'] === 'DEGRADED' && in_array('remote_databases', $x['publication']['warnings'], true), 'remote_databases ausente: só aviso (DEGRADED, publicação liberada)');
$ok($av($foto(['database' => ['state' => 'ok', 'at' => $T + 2, 'durationMs' => 1]]))['publication']['allowed'], 'relógio: amostra 2 s no futuro conta como fresca (tolerância)');
$ok(in_array('database', $av($foto(['database' => ['state' => 'ok', 'at' => $T + 3, 'durationMs' => 1]]))['publication']['blocking'], true), 'relógio: 3 s no futuro = inválida, bloqueia');
$y = $av($foto(['database' => $amostra('failed')])); $ok($y['state'] === 'UNHEALTHY' && in_array('database', $y['publication']['blocking'], true), 'falha crítica não é rebaixada pelos checks seguintes');
$ok(!$av(['version' => 4, 'build' => $SHA, 'samples' => 'lixo'])['publication']['allowed'], 'samples malformado bloqueia');
// (B) responder (subprocesso: código HTTP)
$tmp = sys_get_temp_dir() . '/esq-hv4-' . getmypid(); mkdir($tmp, 0700);
$prep = "$tmp/prep.php"; file_put_contents($prep, "<?php register_shutdown_function(static function () { fwrite(STDERR, 'HTTP=' . (int)http_response_code() . ';'); });\n");
$resp = static function (string $conteudo, string $build) use ($tmp, $prep, $raiz): string {
  file_put_contents("$tmp/foto.json", $conteudo);
  file_put_contents("$tmp/run.php", "<?php require " . var_export($raiz . '/api/core/HealthOperacionalV4.php', true) . "; HealthOperacionalV4::responder(" . var_export("$tmp/foto.json", true) . ", " . var_export($build, true) . ");\n");
  $p = proc_open(escapeshellarg(PHP_BINARY) . ' -d auto_prepend_file=' . escapeshellarg($prep) . ' ' . escapeshellarg("$tmp/run.php"), [1 => ['pipe', 'w'], 2 => ['pipe', 'w']], $pp);
  stream_get_contents($pp[1]); $e = stream_get_contents($pp[2]); fclose($pp[1]); fclose($pp[2]); proc_close($p); return $e;
};
$agora = time(); $boa = json_encode(['version' => 4, 'build' => $SHA, 'samples' => array_map(static fn ($k) => ['state' => 'ok', 'at' => $agora, 'durationMs' => 1] + ($k === 'disk' ? ['usedPercent' => 40] : []), array_combine($c5 = ['database', 'disk', 'memory', 'session', 'redis'], $c5))]);
$ok(str_contains($resp($boa, $SHA), 'HTTP=200'), 'responder: fotografia boa = 200');
$ok(str_contains($resp($boa . str_repeat(' ', 16384), $SHA), 'HTTP=503'), 'responder: fotografia > 16 KiB = 503');
$ok(str_contains($resp('{não é json', $SHA), 'HTTP=503'), 'responder: JSON inválido = 503');
// (C) bloco v3 dos bancos remotos, isolado
$h = (string)file_get_contents($raiz . '/api/health.php');
$bloco = substr($h, (int)strpos($h, '// 3b. Bancos REMOTOS'), (int)strpos($h, '// 4. Disk Space') - (int)strpos($h, '// 3b. Bancos REMOTOS'));
// TRAVA: nunca executar um bloco que abra conexão (a contraprova com o health.php antigo chegou a sondar o host remoto real em 27/11)
$temSonda = (bool)preg_match('/fsockopen|stream_socket_client|curl_|getConnection|new\s+PDO/i', $bloco);
$roda3b = static function (?string $proj) use ($bloco, $tmp, $temSonda): array {
  if ($temSonda) { return [['status' => 'NAO-EXECUTADO', 'checks' => ['remote_databases' => ['status' => 'NAO-EXECUTADO', 'INTEGRACAO' => ['status' => 'NAO-EXECUTADO'], 'DSHOW_PROD' => ['status' => 'NAO-EXECUTADO', 'host' => 'x']]]], 0.0]; }
  $arq = "$tmp/remote.json"; if ($proj === null) { if (is_file($arq)) { rename($arq, $arq . '.' . uniqid() . '.antigo'); } } else { file_put_contents($arq, $proj); }   // sem apagar
  putenv('HEALTH_REMOTE_V4_FILE=' . $arq); $health = ['status' => 'HEALTHY', 'checks' => []]; $t0 = microtime(true);
  // HL-001-R1: o bloco usa HealthAgregado/ReleaseIdentidade e os auxiliares do health.php ($piorar, $dur)
  require_once __DIR__ . '/../../api/core/HealthAgregado.php'; require_once __DIR__ . '/../../api/core/ReleaseIdentidade.php';
  $piorar = static function (string $novo) use (&$health): void { $health['status'] = HealthAgregado::piorar($health['status'], $novo); };
  $dur = static function (string $k): void {};
  eval($bloco); return [$health, (microtime(true) - $t0) * 1000];
};
[$h1, $ms] = $roda3b(null);
$ok($h1['checks']['remote_databases']['INTEGRACAO']['status'] === 'UNKNOWN' && $h1['checks']['remote_databases']['status'] === 'DOWN' && $h1['status'] === 'DEGRADED' && $ms < 50, 'v3 sem projeção: UNKNOWN por banco, DEGRADED (só informativo), ' . round($ms, 1) . ' ms (sem sondas)');
[$h2] = $roda3b(json_encode(['versao' => 1, 'gerado_em' => time(), 'release' => null, 'bancos' => ['INTEGRACAO' => ['estado' => 'ok'], 'DSHOW_PROD' => ['estado' => 'ok']]]));   // formato R1
$ok($h2['checks']['remote_databases']['status'] === 'OK' && $h2['status'] === 'HEALTHY' && !isset($h2['checks']['remote_databases']['DSHOW_PROD']['host']), 'v3 com projeção fresca ok: OK, HEALTHY, sem host publicado');
[$h3] = $roda3b(json_encode(['versao' => 1, 'gerado_em' => time() - 61, 'release' => null, 'bancos' => ['INTEGRACAO' => ['estado' => 'ok'], 'DSHOW_PROD' => ['estado' => 'falhou']]]));   // coletor parado
$ok($h3['checks']['remote_databases']['INTEGRACAO']['status'] === 'UNKNOWN' && $h3['checks']['remote_databases']['DSHOW_PROD']['status'] === 'UNKNOWN' && $h3['checks']['remote_databases']['coleta'] === 'vencida' && $h3['status'] === 'DEGRADED', 'v3: fotografia de 61 s (coletor parado) = vencida: UNKNOWN nos dois bancos, só informativo (HL-001-R1)');
putenv('HEALTH_REMOTE_V4_FILE');
exec('mv ' . escapeshellarg($tmp) . ' ' . escapeshellarg('/backup/esquerda/' . date('Ymd-His') . '-teste-health-v4-' . getmypid()));   // nada de rm (regra 27/11): vai para o backup
// (E) identidade do build pelo arquivo da release (sem variável de ambiente)
require_once $raiz . '/api/core/ReleaseIdentidade.php';
$base = sys_get_temp_dir() . '/esq-rel-' . getmypid(); mkdir($base, 0700);
$sha = 'abcdef012345' . str_repeat('6', 28); $rel = "$base/abcdef012345-20261127-0100"; mkdir("$rel/api", 0700, true); file_put_contents("$rel/RELEASE_SHA", $sha . "\n");
symlink($rel, "$base/servido");
$ok(ReleaseIdentidade::sha("$rel/api/..") === $sha && ReleaseIdentidade::sha("$base/servido/api/..") === $sha, 'identidade: RELEASE_SHA da release (também pelo link simbólico servido)');
$rel2 = "$base/ffffff000000-20261127-0100"; mkdir($rel2); file_put_contents("$rel2/RELEASE_SHA", $sha);
$ok(ReleaseIdentidade::sha($rel2) === null, 'identidade: arquivo ≠ nome da release = desconhecida');
$rel3 = "$base/sem-arquivo"; mkdir($rel3); $rel4 = "$base/lixo"; mkdir($rel4); file_put_contents("$rel4/RELEASE_SHA", 'xyz');
$ok(ReleaseIdentidade::sha($rel3) === null && ReleaseIdentidade::sha($rel4) === null && ReleaseIdentidade::sha("$base/nao-existe") === null, 'identidade: sem arquivo / inválido / pasta inexistente = desconhecida');
$rel5 = "$base/clone-de-teste"; mkdir($rel5); file_put_contents("$rel5/RELEASE_SHA", $sha);
$ok(ReleaseIdentidade::sha($rel5) === $sha, 'identidade: pasta fora do formato <sha12>-… vale só pelo arquivo');
exec('mv ' . escapeshellarg($base) . ' ' . escapeshellarg('/backup/esquerda/' . date('Ymd-His') . '-teste-health-v4-release-' . getmypid()));   // nada de rm (regra 27/11): vai para o backup
// (D) estático
$ok(!str_contains($h, 'fsockopen'), 'health.php sem sondas TCP (fsockopen)');
$ok(!preg_match('/HEALTH_TRUSTED_PROXIES|HEALTH_ALLOWED_IPS|DSHOW_RELEASE_SHA/', $h) && str_contains($h, "ClienteIp::naLista(\$clientIp, ['127.0.0.1', '::1'])") && !str_contains($h, '10.0.0.0/8'), 'detalhe só para loopback; nenhuma configuração manual (sem variáveis de proxy, monitor ou SHA)');
$ok(str_contains($h, "ReleaseIdentidade::sha(__DIR__ . '/..')"), 'v4 usa a identidade da release servida');
$pGate = strpos($h, 'if (!$isAuthorized)'); $pV4 = strpos($h, "(\$_GET['contract'] ?? '') === '4'");
$ok($pGate !== false && $pV4 !== false && $pGate < $pV4, 'rota contract=4 só depois do portão de IP (anônimo recebe a resposta básica)');
if ($f) { echo "[ERRO] teste-health-v4:\n - " . implode("\n - ", $f) . "\n"; exit(1); }
echo "[OK]   teste-health-v4: $n verificações (v4: 5 críticos, aviso informativo, relógio ±2 s, build, disco 85/92; responder 16 KiB; v3 sem sondas; rota após o portão)\n";
