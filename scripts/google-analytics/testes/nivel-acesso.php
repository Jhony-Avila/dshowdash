<?php
// Google Analytics — teste de NÍVEL (Q-GA.3, 31/10/2026): o módulo exige o mesmo nível do Pipedrive (50) no SERVIDOR.
// Roda o index.php real em subprocessos (sessão sintética). Rotas com dado real do CRM e as demais: abaixo de 50 → 403; sem sessão → 401;
// nível 50 → passa do gate (rota /status não toca banco). Uso: php nivel-acesso.php (exit 1 em falha).
declare(strict_types=1);
$h = __DIR__ . '/_executar-rota.php';
$falhas = 0; $n = 0;
$rodar = static function (string $rota, string $nivel) use ($h): array {
    $p = proc_open([PHP_BINARY, '-d', 'error_log=/dev/null', '-d', 'display_errors=0', $h, $rota, $nivel], [1 => ['pipe', 'w'], 2 => ['pipe', 'w']], $pipes);
    $out = stream_get_contents($pipes[1]); $err = stream_get_contents($pipes[2]); proc_close($p);
    preg_match('/HTTP=(\d+)/', $err, $m);
    return [(int)($m[1] ?? 0), $out];
};
$casos = [];
foreach (['conversions', 'insights', 'header/summary', 'overview', 'alerts', 'status', 'properties', 'quotas'] as $r) {
    $casos[] = [$r, 'sem-sessao', 401, 'AUTH_REQUIRED'];
    $casos[] = [$r, '10', 403, 'INSUFFICIENT_LEVEL'];
    $casos[] = [$r, '49', 403, 'INSUFFICIENT_LEVEL'];
}
$casos[] = ['status', '50', 200, '"ok":true'];
$casos[] = ['status', '100', 200, '"ok":true'];
foreach ($casos as [$rota, $nivel, $esp, $trecho]) {
    $n++;
    [$cod, $corpo] = $rodar($rota, $nivel);
    $ok = $cod === $esp && str_contains($corpo, $trecho) && !str_contains($corpo, 'crm_leads');
    if (!$ok) { $falhas++; echo "[ERRO] /$rota nível $nivel → HTTP $cod (esperado $esp, trecho $trecho)\n"; }
}
echo ($falhas ? '[ERRO]' : '[OK]  ') . " nivel-acesso: $n casos, $falhas falha(s)\n";
exit($falhas ? 1 : 0);
