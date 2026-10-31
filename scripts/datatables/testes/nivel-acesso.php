<?php
// DataTables — teste de NÍVEL (31/10/2026, APP DSHOW Mega V2 · P0): a API exige nível 80 (equipe) no SERVIDOR, para leitura e escrita.
// Roda o index.php real em subprocessos (sessão sintética): sem sessão → 401; níveis 0/50/79 → 403 INSUFFICIENT_LEVEL em leituras e em
// ESCRITAS (o gate vem antes do CSRF e do banco); nível 80/100 passam do gate (o código seguinte pode ser 4xx/5xx sem banco — nunca 401/403
// de nível). Uso: php nivel-acesso.php (exit 1 em falha).
declare(strict_types=1);
$h = __DIR__ . '/_executar-rota.php';
$falhas = 0; $n = 0;
$rodar = static function (string $metodo, string $rota, string $nivel) use ($h): array {
    $p = proc_open([PHP_BINARY, '-d', 'error_log=/dev/null', '-d', 'display_errors=0', $h, $metodo, $rota, $nivel], [1 => ['pipe', 'w'], 2 => ['pipe', 'w']], $pipes);
    $out = stream_get_contents($pipes[1]); $err = stream_get_contents($pipes[2]); proc_close($p);
    preg_match('/HTTP=(\d+)/', $err, $m);
    return [(int)($m[1] ?? 0), $out];
};
$rotas = [['GET', 'dashboard'], ['GET', 'connections'], ['GET', 'infrastructure'], ['POST', 'connections'], ['DELETE', 'connections/1'], ['POST', 'servers'], ['POST', 'alerts/1/resolve']];
$casos = [];
foreach ($rotas as [$m, $r]) {
    $casos[] = [$m, $r, 'sem-sessao', 401, 'AUTH_REQUIRED'];
    foreach (['0', '50', '79'] as $lv) $casos[] = [$m, $r, $lv, 403, 'INSUFFICIENT_LEVEL'];
}
foreach ($casos as [$metodo, $rota, $nivel, $esp, $trecho]) {
    $n++;
    [$cod, $corpo] = $rodar($metodo, $rota, $nivel);
    if ($cod !== $esp || !str_contains($corpo, $trecho)) { $falhas++; echo "[ERRO] $metodo /$rota nível $nivel → HTTP $cod (esperado $esp, trecho $trecho)\n"; }
}
foreach ([['GET', 'dashboard', '80'], ['GET', 'dashboard', '100']] as [$metodo, $rota, $nivel]) {
    $n++;
    [$cod, $corpo] = $rodar($metodo, $rota, $nivel);
    if (in_array($cod, [401, 403], true) || str_contains($corpo, 'INSUFFICIENT_LEVEL') || str_contains($corpo, 'AUTH_REQUIRED')) { $falhas++; echo "[ERRO] $metodo /$rota nível $nivel barrado (HTTP $cod)\n"; }
}
echo ($falhas ? '[ERRO]' : '[OK]  ') . " nivel-acesso (datatables): $n casos, $falhas falha(s)\n";
exit($falhas ? 1 : 0);
