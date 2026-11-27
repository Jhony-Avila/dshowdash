<?php
// coletor-health.php — HL-001-R1 (AZUL, 27/11): tira as sondas do caminho síncrono do /api/health. Roda FORA da requisição (cron de 1 min,
// laço de 5 s dentro do minuto, com flock: nunca dois ao mesmo tempo) e grava, de forma ATÔMICA (temporário + rename, 0644, dono = root):
//   remote-v4.json  — bancos remotos (INTEGRACAO, DSHOW_PROD): TCP com prazo TOTAL de 300 ms por sonda; só estado e duração (sem host/erro);
//   samples-v4.json — amostras críticas para a rota interna contract=4 (banco do Dash, sessão, disco, memória, Redis), com a identidade da release.
// O /api/health só LÊ esses arquivos: coletor parado = fotografia vencida = informativo marcado (remota) / bloqueio na v4 (crítico vencido).
// Uso: php scripts/health/coletor-health.php [--uma-vez | --laco <segundos> | --medir <n>]   ·   diretório: HEALTH_FOTO_DIR (padrão storage/health)
// Instalação (PORTÃO, só o Jhony): diretório /var/www/dshowdash/storage/health (root:root 0755) + /etc/cron.d com `* * * * * root php … --laco 55`.
declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
$raiz = realpath(__DIR__ . '/../..');
require $raiz . '/api/core/HealthAgregado.php';
require $raiz . '/api/core/ReleaseIdentidade.php';
$dir = getenv('HEALTH_FOTO_DIR') ?: '/var/www/dshowdash/storage/health';
$modo = $argv[1] ?? '--uma-vez';
$duracao = $modo === '--laco' ? max(5, min(58, (int) ($argv[2] ?? 55))) : 0;
// Limite GLOBAL por ciclo (HL-001, complemento 27/11): menor que o intervalo de 5 s. Cada ciclo roda num PROCESSO FILHO; passou do limite,
// o pai mata o filho: as amostras críticas viram `timeout` (inválidas) e a fotografia remota NÃO é regravada — o frescor nunca é renovado
// sem uma leitura nova bem-sucedida. Ciclo não sobrepõe ciclo: um segundo coletor não roda (flock) e o tique perdido é PULADO e registrado.
const LIMITE_CICLO_S = 4.0;
const INTERVALO_S = 5.0;
$registrarPulo = static function (string $motivo) use ($dir): void {
    $arq = "$dir/.ciclos-pulados";
    $n = is_file($arq) ? (int) explode(' ', (string) @file_get_contents($arq))[0] : 0;
    @file_put_contents($arq, ($n + 1) . ' ' . time() . ' ' . $motivo . "\n");
    fwrite(STDERR, "[coletor-health] ciclo pulado: $motivo\n");
};
if ($modo !== '--ciclo') {
    $trava = @fopen("$dir/.coletor.lock", 'c');
    if ($trava === false || !flock($trava, LOCK_EX | LOCK_NB)) { $registrarPulo('coletor_anterior_em_execucao'); exit(0); }
}

$ms = static fn (float $t0): float => round((microtime(true) - $t0) * 1000, 1);
// Timeouts por check (ms). PROPOSTA do GPT Manager Visuais (27/11), CONFIRMADA pela medição de produção de 27/11 (ver timeouts.json); a regra é
// máx(proposta, 3 × p95 medido em homologação — normal, durante build e com o ERP indisponível), gravado em timeouts.json (modo --medir).
// Estourou o timeout = amostra INVÁLIDA (`timeout`): a rota v4 a trata como inválida e o frescor NÃO é renovado (bloqueia).
const PROPOSTA_TIMEOUT_MS = ['database' => 100, 'redis' => 50, 'session' => 50, 'disk' => 30, 'memory' => 20];
// 27/11 (medição de produção, AZUL): valores DEFINITIVOS versionados em scripts/health/timeouts.json (proposta confirmada: 3 × p95 < proposta).
// Ordem: proposta do código → arquivo versionado → timeouts.json do diretório de trabalho. Cada camada só SOBE o valor (≥ proposta, ≤ 2000 ms):
// um arquivo errado nunca deixa um check mais apertado que a proposta.
$timeouts = PROPOSTA_TIMEOUT_MS;
foreach ([__DIR__ . '/timeouts.json', "$dir/timeouts.json"] as $arqT) {
    $tj = @json_decode((string) @file_get_contents($arqT), true);
    if (is_array($tj)) { foreach (PROPOSTA_TIMEOUT_MS as $k => $v) { if (is_int($tj[$k] ?? null) && $tj[$k] >= $v && $tj[$k] <= 2000) { $timeouts[$k] = max($timeouts[$k], $tj[$k]); } } }
}

$sonda = static function (string $alias) use ($ms): array {
    $host = getenv("DB_{$alias}_HOST") ?: 'displaysolutions.com.br';
    $porta = (int) (getenv("DB_{$alias}_PORT") ?: 3306);
    $t0 = microtime(true);
    $s = @stream_socket_client("tcp://$host:$porta", $en, $es, 0.3, STREAM_CLIENT_CONNECT);
    $conectou = $s !== false;
    if ($conectou) { fclose($s); }
    $d = $ms($t0);
    return ['estado' => $conectou && $d <= 300 ? 'ok' : 'falhou', 'duracao_ms' => $d];   // prazo TOTAL de 300 ms por sonda
};
$amostras = static function () use ($raiz, $ms, $timeouts, $dir): array {
    $agora = time(); $a = [];
    $fecha = static function (string $k, string $estado, float $t0, array $extra = []) use (&$a, $agora, $ms, $timeouts): void {
        $d = $ms($t0);
        $a[$k] = ['state' => $d > $timeouts[$k] ? 'timeout' : $estado, 'at' => $agora, 'durationMs' => $d] + $extra;   // timeout = inválida
    };
    // banco do Dash: a conexão do próprio Dash (config fora do git), consulta mínima
    $t0 = microtime(true);
    try {
        require_once (getenv('HEALTH_DASH_CONFIG') ?: '/var/www/dshowdash/config/db_connection.php');
        $r = DatabaseManager::testConnection('DSHOWDASH');
        $fecha('database', !empty($r['success']) ? 'ok' : 'failed', $t0);
    } catch (Throwable) { $fecha('database', 'failed', $t0); }
    // sessão: o diretório de sessões do PHP precisa existir e aceitar escrita
    $t0 = microtime(true); $sp = session_save_path() ?: sys_get_temp_dir();
    $fecha('session', is_dir($sp) && is_writable($sp) ? 'ok' : 'failed', $t0);
    // disco: as MESMAS regras do health (valor não arredondado)
    $t0 = microtime(true); $d = HealthAgregado::nivelUso('disco', disk_total_space('/'), disk_free_space('/'));
    $fecha('disk', ['OK' => 'ok', 'WARNING' => 'warning', 'CRITICAL' => 'failed'][$d['rotulo']] ?? 'failed', $t0, $d['uso'] === null ? [] : ['usedPercent' => round($d['uso'], 3)]);
    // memória (configuração aceita em 27/11): MemAvailable — 85% aviso, 95% crítico; ausente = falha; OOM na janela (oom_kill subiu desde a
    // coleta anterior) = falha (SEGURAR); swap só informativo
    $t0 = microtime(true);
    $mi = @file_get_contents('/proc/meminfo');
    [$mt, $md] = HealthAgregado::memoria($mi); $m = HealthAgregado::nivelUso('memoria', $mt, $md);
    $estado = ['OK' => 'ok', 'WARNING' => 'warning', 'CRITICAL' => 'failed'][$m['rotulo']] ?? 'failed';
    $oom = preg_match('/^oom_kill\s+(\d+)/m', (string) @file_get_contents('/proc/vmstat'), $ov) ? (int) $ov[1] : null;
    $anterior = is_file("$dir/.oom-anterior") ? (int) @file_get_contents("$dir/.oom-anterior") : null;
    if ($oom !== null) { @file_put_contents("$dir/.oom-anterior", (string) $oom); }
    $oomJanela = $oom !== null && $anterior !== null && $oom > $anterior;
    if ($oomJanela) { $estado = 'failed'; }
    $swap = is_string($mi) && preg_match('/^SwapTotal:\s+(\d+)/m', $mi, $sT) && preg_match('/^SwapFree:\s+(\d+)/m', $mi, $sF) && (int) $sT[1] > 0 ? round(100 * (1 - (int) $sF[1] / (int) $sT[1]), 1) : null;
    $fecha('memory', $estado, $t0, ($m['uso'] === null ? [] : ['usedPercent' => round($m['uso'], 3)]) + ['oomNaJanela' => $oomJanela, 'swapPercent' => $swap]);
    // Redis: um PING com o helper do Dash
    $t0 = microtime(true);
    try {
        require_once $raiz . '/api/core/helpers/RedisHelper.php';
        $rd = RedisHelper::getInstance(); $p = $rd ? $rd->ping() : false;
        $fecha('redis', ($p === true || $p === '+PONG' || $p === 'PONG') ? 'ok' : 'failed', $t0);
    } catch (Throwable) { $fecha('redis', 'failed', $t0); }
    return $a;
};

// --ciclo (filho): UMA coleta, resultado em JSON na saída; o pai aplica o limite global
if ($modo === '--ciclo') {
    echo json_encode(['remoto' => ['INTEGRACAO' => $sonda('INTEGRACAO'), 'DSHOW_PROD' => $sonda('DSHOW_PROD')], 'amostras' => $amostras()]);
    exit(0);
}
$cicloLimitado = static function () use ($raiz): ?array {
    $p = proc_open([PHP_BINARY, __FILE__, '--ciclo'], [1 => ['pipe', 'w'], 2 => ['pipe', 'w']], $pp);
    if (!is_resource($p)) { return null; }
    stream_set_blocking($pp[1], false);
    $saida = ''; $fim = microtime(true) + LIMITE_CICLO_S;
    while (true) {
        $r = [$pp[1]]; $w = $e = null; $resta = $fim - microtime(true);
        if ($resta <= 0) { break; }
        if (@stream_select($r, $w, $e, 0, (int) min(200000, $resta * 1e6)) > 0) { $pedaco = fread($pp[1], 65536); if ($pedaco !== false) { $saida .= $pedaco; } }
        if (feof($pp[1])) { break; }
    }
    $terminou = feof($pp[1]);
    if (!$terminou) { proc_terminate($p, 9); }   // estourou o limite global: o filho morre
    fclose($pp[1]); fclose($pp[2]); proc_close($p);
    $j = $terminou ? json_decode($saida, true) : null;
    return is_array($j) ? $j : null;
};

// --medir N: só MEDE (nada é gravado): N coletas a cada 1 s → p95 por check e o timeout sugerido = máx(proposta, 3 × p95)
if ($modo === '--medir') {
    $n = max(5, min(600, (int) ($argv[2] ?? 60))); $dur = [];
    for ($i = 0; $i < $n; $i++) { foreach ($amostras() as $k => $x) { $dur[$k][] = (float) $x['durationMs']; } if ($i < $n - 1) { usleep(1000000); } }
    $sug = [];
    printf("%-10s %6s %8s %8s %10s %10s\n", 'check', 'n', 'p95_ms', 'max_ms', 'proposta', 'sugerido');
    foreach (PROPOSTA_TIMEOUT_MS as $k => $prop) {
        $v = $dur[$k] ?? []; sort($v); $p95 = $v ? $v[(int) ceil(0.95 * count($v)) - 1] : null;
        $sug[$k] = $p95 === null ? $prop : (int) max($prop, (int) ceil(3 * $p95));
        printf("%-10s %6d %8s %8s %10d %10d\n", $k, count($v), $p95 === null ? '-' : number_format($p95, 1, '.', ''), $v ? number_format(end($v), 1, '.', '') : '-', $prop, $sug[$k]);
    }
    echo 'timeouts.json sugerido: ', json_encode($sug), "\n";
    echo 'timeouts vigentes: ', json_encode($timeouts), "\n";   // proposta → scripts/health/timeouts.json → timeouts.json do diretório (só sobem)
    flock($trava, LOCK_UN); fclose($trava); exit(0);
}

$fim = microtime(true) + $duracao;
$tique = microtime(true);
do {
    $inicio = microtime(true);
    $release = ReleaseIdentidade::sha($raiz);
    $c = $cicloLimitado();
    try {
        if ($c === null) {
            // ciclo estourou o limite (ou o filho falhou): amostras críticas INVÁLIDAS; a fotografia remota fica como estava (envelhece)
            $registrarPulo('ciclo_excedeu_' . LIMITE_CICLO_S . 's');
            $inval = [];
            foreach (array_keys(PROPOSTA_TIMEOUT_MS) as $k) { $inval[$k] = ['state' => 'timeout', 'at' => (int) $inicio, 'durationMs' => LIMITE_CICLO_S * 1000]; }
            HealthAgregado::gravarAtomico("$dir/samples-v4.json", ['version' => 4, 'build' => $release, 'samples' => $inval]);
        } else {
            HealthAgregado::gravarAtomico("$dir/remote-v4.json", ['versao' => 1, 'gerado_em' => (int) $inicio, 'release' => $release, 'bancos' => $c['remoto']]);
            HealthAgregado::gravarAtomico("$dir/samples-v4.json", ['version' => 4, 'build' => $release, 'samples' => $c['amostras']]);
        }
    } catch (Throwable $e) {
        fwrite(STDERR, '[coletor-health] fotografia não gravada: ' . get_class($e) . "\n");   // a anterior fica e envelhece (vira "vencida")
    }
    if ($duracao === 0) { break; }
    $tique += INTERVALO_S;
    while (microtime(true) > $tique) { $registrarPulo('tique_perdido'); $tique += INTERVALO_S; }   // nunca dois ciclos ao mesmo tempo
    if ($tique + INTERVALO_S > $fim) { break; }
    usleep((int) max(0, ($tique - microtime(true)) * 1e6));
} while (true);
flock($trava, LOCK_UN); fclose($trava);
