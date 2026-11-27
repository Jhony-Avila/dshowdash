<?php
// teste-health-timeouts (AZUL, 27/11): timeouts DEFINITIVOS versionados (scripts/health/timeouts.json) e as 3 camadas do coletor —
// proposta → arquivo versionado → timeouts.json do diretório de trabalho; cada camada só SOBE (≥ proposta, ≤ 2000 ms).
// Roda o coletor REAL (--medir 5) numa cópia temporária, com o banco e o Redis apontados para lugar nenhum (sem rede: host 127.0.0.1, porta fechada).
declare(strict_types=1);
$raiz = realpath(__DIR__ . '/../..'); $f = []; $n = 0; $ok = static function (bool $c, string $nome) use (&$f, &$n): void { $n++; if (!$c) { $f[] = $nome; } };
$v = json_decode((string) file_get_contents("$raiz/scripts/health/timeouts.json"), true);
$ok(is_array($v) && $v['database'] === 100 && $v['redis'] === 50 && $v['session'] === 50 && $v['disk'] === 30 && $v['memory'] === 20, 'arquivo versionado = os valores definitivos (100/50/50/30/20)');
$ok(str_contains((string) ($v['_medicao'] ?? ''), 'ac2e099d') && str_contains((string) ($v['_pendente'] ?? ''), 'build'), 'arquivo registra a medição e a pendência do build');
$tmp = sys_get_temp_dir() . '/esq-timeouts-' . getmypid(); mkdir("$tmp/scripts/health", 0700, true); mkdir("$tmp/work", 0700);
copy("$raiz/scripts/health/coletor-health.php", "$tmp/scripts/health/coletor-health.php");
exec('cp -a ' . escapeshellarg("$raiz/api") . ' ' . escapeshellarg("$tmp/api"));
$vig = static function (?array $versionado, ?array $trabalho) use ($tmp): ?array {
    foreach (["$tmp/scripts/health/timeouts.json" => $versionado, "$tmp/work/timeouts.json" => $trabalho] as $arq => $c) {
        if (is_file($arq)) { rename($arq, $arq . '.' . uniqid() . '.antigo'); }   // sem apagar
        if ($c !== null) { file_put_contents($arq, json_encode($c)); }
    }
    $env = 'HEALTH_FOTO_DIR=' . escapeshellarg("$tmp/work") . ' HEALTH_DASH_CONFIG=' . escapeshellarg("$tmp/nao-existe.php") . ' DB_INTEGRACAO_HOST=127.0.0.1 DB_INTEGRACAO_PORT=9 DB_DSHOW_PROD_HOST=127.0.0.1 DB_DSHOW_PROD_PORT=9';
    exec("$env " . escapeshellarg(PHP_BINARY) . ' ' . escapeshellarg("$tmp/scripts/health/coletor-health.php") . ' --medir 5 2>/dev/null', $o);
    foreach ($o as $l) { if (str_starts_with($l, 'timeouts vigentes: ')) { return json_decode(substr($l, 19), true); } }
    return null;
};
$P = ['database' => 100, 'redis' => 50, 'session' => 50, 'disk' => 30, 'memory' => 20];
$ok($vig($v, null) === $P, 'só o versionado: vigentes = definitivos');
$ok($vig(null, null) === $P, 'sem arquivo nenhum: vigentes = proposta do código');
$ok($vig(['database' => 300] + $P, null)['database'] === 300, 'versionado pode SUBIR um check (300)');
$ok($vig($P, ['database' => 40, 'disk' => 90])  === ['database' => 100, 'redis' => 50, 'session' => 50, 'disk' => 90, 'memory' => 20], 'diretório de trabalho: 40 (abaixo) ignorado, 90 (acima) sobe');
$ok($vig(['database' => 300] + $P, ['database' => 150])['database'] === 300, 'camada de trabalho não DESCE o que o versionado subiu');
$ok($vig(['redis' => 5000, 'memory' => 'x'] + $P, null) === $P, 'valor > 2000 ms ou não inteiro é ignorado');
exec('mv ' . escapeshellarg($tmp) . ' ' . escapeshellarg('/backup/esquerda/' . date('Ymd-His') . '-teste-health-timeouts-' . getmypid()));   // nada de rm
if ($f) { echo "[ERRO] teste-health-timeouts:\n - " . implode("\n - ", $f) . "\n"; exit(1); }
echo "[OK]   teste-health-timeouts: $n verificações (definitivos versionados; 3 camadas só sobem; >2000 e não inteiro ignorados)\n";
