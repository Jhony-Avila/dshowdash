<?php
// SUMMARY SARGABLE (#46) — prova de que a reescrita NÃO mudou nenhum número.
//
// `metricasJanela()` e `seriesJanela()` deixaram de usar `DATE(coluna) BETWEEN ?` no WHERE
// (função sobre a coluna anula o índice) e passaram a filtrar `coluna >= ? AND coluna < ?`.
// Como são os números da Visão Geral, o risco não é performance: é a conta mudar em silêncio.
//
// Esta prova mantém a FORMA ANTIGA embutida e exige resultado idêntico, campo a campo, em
// janelas de perfis diferentes. Só leitura.
//
// ⚠️ O limite superior é EXCLUSIVO (`< dia+1`). Com DATETIME, `<= '2026-07-29'` equivale a
// `<= '2026-07-29 00:00:00'` e descarta o dia inteiro — provado abaixo num dia real.
declare(strict_types=1);

$env = [];
foreach (file('/var/www/dshowdash/.env') as $l) {
    if (preg_match('/^([A-Z0-9_]+)=(.*)$/', trim($l), $m)) { $env[$m[1]] = $m[2]; }
}
$pdo = new PDO(
    sprintf('mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4',
        $env['DB_PIPE_DSHOW_HOST'], $env['DB_PIPE_DSHOW_PORT'], $env['DB_PIPE_DSHOW_NAME']),
    $env['DB_PIPE_DSHOW_USER'], $env['DB_PIPE_DSHOW_PASS'],
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_EMULATE_PREPARES => false,
     PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]
);
require_once '/var/www/dshowdash/api/pipedrive/repositories/AnalyticsRepository.php';

$repo = new PipeAnalyticsRepository($pdo);
$rc   = new ReflectionClass($repo);
$priv = function (string $m, array $args) use ($rc, $repo) {
    $x = $rc->getMethod($m); $x->setAccessible(true); return $x->invokeArgs($repo, $args);
};

$falhas = 0; $checagens = 0;
function ok(string $t, bool $c, string $d = ''): void {
    global $falhas, $checagens; $checagens++;
    printf("  %s %s%s\n", $c ? '[ok]' : '[X] ', $t, $d !== '' ? "  $d" : '');
    if (!$c) { $falhas++; }
}

// ── A FORMA ANTIGA, preservada aqui como referência ────────────────
function metricasAntigo(PDO $pdo, string $de, string $ate): array {
    $st = $pdo->prepare(
        "SELECT SUM(DATE(add_time) BETWEEN ? AND ?) criados,
                COALESCE(SUM(CASE WHEN DATE(add_time) BETWEEN ? AND ? THEN value END),0) valor_criado,
                SUM(status='won' AND DATE(won_time) BETWEEN ? AND ?) ganhos,
                COALESCE(SUM(CASE WHEN status='won' AND DATE(won_time) BETWEEN ? AND ? THEN value END),0) valor_ganho,
                SUM(status='lost' AND DATE(lost_time) BETWEEN ? AND ?) perdidos,
                COALESCE(SUM(CASE WHEN status='lost' AND DATE(lost_time) BETWEEN ? AND ? THEN value END),0) valor_perdido,
                ROUND(AVG(CASE WHEN status='won' AND DATE(won_time) BETWEEN ? AND ?
                                AND add_time IS NOT NULL AND won_time >= add_time
                               THEN DATEDIFF(won_time, add_time) END)) ciclo_medio
           FROM pipe_deals WHERE is_deleted = 0"
    );
    $st->execute(array_merge(...array_fill(0, 7, [$de, $ate])));
    return $st->fetch() ?: [];
}
function seriesAntigo(PDO $pdo, string $de, string $ate): array {
    $dias = [];
    for ($d = $de; $d <= $ate; $d = date('Y-m-d', strtotime($d . ' +1 day'))) { $dias[$d] = true; }
    $out = ['criados' => array_fill_keys(array_keys($dias), 0.0), 'ganhos' => array_fill_keys(array_keys($dias), 0.0),
            'valor_ganho' => array_fill_keys(array_keys($dias), 0.0), 'perdidos' => array_fill_keys(array_keys($dias), 0.0)];
    $blocos = [
        ['add_time',  'is_deleted=0',                  'COUNT(*)',               'criados'],
        ['won_time',  "is_deleted=0 AND status='won'",  'COUNT(*)',               'ganhos'],
        ['won_time',  "is_deleted=0 AND status='won'",  'COALESCE(SUM(value),0)', 'valor_ganho'],
        ['lost_time', "is_deleted=0 AND status='lost'", 'COUNT(*)',               'perdidos'],
    ];
    foreach ($blocos as [$col, $filtro, $agg, $chave]) {
        $st = $pdo->prepare("SELECT DATE({$col}) d, {$agg} v FROM pipe_deals
                              WHERE {$filtro} AND DATE({$col}) BETWEEN ? AND ? GROUP BY DATE({$col})");
        $st->execute([$de, $ate]);
        foreach ($st->fetchAll() as $r) { if (isset($out[$chave][$r['d']])) { $out[$chave][$r['d']] = (float)$r['v']; } }
    }
    foreach ($out as $k => $m) { $out[$k] = array_values($m); }
    $out['dias'] = array_keys($dias);
    return $out;
}

// Perfis distintos de janela: em curso, longa, curta, FECHADA (não chega a hoje),
// um único dia, mês fechado, e um mês antigo com volume alto.
$janelas = [
    ['2026-06-30', '2026-07-29', 'últimos 30 dias (em curso)'],
    ['2025-07-29', '2026-07-29', 'último ano'],
    ['2026-07-22', '2026-07-29', 'últimos 7 dias'],
    ['2026-04-30', '2026-05-30', 'janela fechada (não termina hoje)'],
    ['2026-07-28', '2026-07-28', 'um único dia'],
    ['2026-02-01', '2026-02-28', 'mês fechado'],
    ['2024-06-01', '2024-06-30', 'mês antigo, volume alto'],
];

echo "=== metricasJanela: novo x antigo ===\n";
$campos = ['criados', 'valor_criado', 'ganhos', 'valor_ganho', 'perdidos', 'valor_perdido', 'ciclo_medio'];
foreach ($janelas as [$de, $ate, $rotulo]) {
    $novo   = $priv('metricasJanela', [$de, $ate]);
    $antigo = metricasAntigo($pdo, $de, $ate);
    $difs = [];
    foreach ($campos as $c) {
        $a = $antigo[$c] ?? null; $n = $novo[$c] ?? null;
        $igual = ($a === null && $n === null)
            || (is_numeric($a) && is_numeric($n) ? abs((float)$a - (float)$n) < 0.01 : (string)$a === (string)$n);
        if (!$igual) { $difs[] = sprintf('%s: antigo=%s novo=%s', $c, var_export($a, true), var_export($n, true)); }
    }
    ok(sprintf('%-34s criados=%-5s ganhos=%-4s perdidos=%-4s', $rotulo,
        $novo['criados'] ?? '?', $novo['ganhos'] ?? '?', $novo['perdidos'] ?? '?'),
        $difs === [], implode(' | ', $difs));
}

echo "\n=== seriesJanela: novo x antigo (ponto a ponto) ===\n";
foreach ($janelas as [$de, $ate, $rotulo]) {
    $novo   = $priv('seriesJanela', [$de, $ate]);
    $antigo = seriesAntigo($pdo, $de, $ate);
    $difs = [];
    foreach (['dias', 'criados', 'ganhos', 'valor_ganho', 'perdidos'] as $serie) {
        if (count($novo[$serie]) !== count($antigo[$serie])) { $difs[] = "$serie: tamanho difere"; continue; }
        foreach ($novo[$serie] as $i => $v) {
            $a = $antigo[$serie][$i];
            $igual = is_numeric($v) && is_numeric($a) ? abs((float)$v - (float)$a) < 0.01 : $v === $a;
            if (!$igual) { $difs[] = sprintf('%s[%d] (%s): antigo=%s novo=%s', $serie, $i, $novo['dias'][$i] ?? '?', var_export($a, true), var_export($v, true)); break; }
        }
    }
    ok(sprintf('%-34s %d dias · soma criados=%s', $rotulo, count($novo['dias']), array_sum($novo['criados'])),
        $difs === [], implode(' | ', array_slice($difs, 0, 2)));
}

echo "\n=== a armadilha do limite inclusivo, num dia REAL ===\n";
$dia = (string)$pdo->query(
    "SELECT DATE(add_time) d FROM pipe_deals WHERE is_deleted=0 AND TIME(add_time) > '12:00:00'
      GROUP BY d ORDER BY COUNT(*) DESC LIMIT 1"
)->fetchColumn();
$real     = (int)$pdo->query("SELECT COUNT(*) FROM pipe_deals WHERE is_deleted=0 AND DATE(add_time)='$dia'")->fetchColumn();
$inclusivo = (int)$pdo->query("SELECT COUNT(*) FROM pipe_deals WHERE is_deleted=0 AND add_time >= '$dia 00:00:00' AND add_time <= '$dia'")->fetchColumn();
$exclusivo = (int)$pdo->query("SELECT COUNT(*) FROM pipe_deals WHERE is_deleted=0 AND add_time >= '$dia 00:00:00' AND add_time < '" . date('Y-m-d', strtotime($dia . ' +1 day')) . " 00:00:00'")->fetchColumn();
ok("dia $dia tem $real criados; `< dia+1` devolve $real", $exclusivo === $real);
ok("e `<= dia` devolveria $inclusivo — por isso o limite é exclusivo", $inclusivo !== $real, "perderia $real registros");

// O que o usuário vê: um dia com movimento não pode sair zerado na ponta da série.
$novo = $priv('seriesJanela', [$dia, $dia]);
ok('série de 1 dia traz o movimento daquele dia', (int)array_sum($novo['criados']) === $real,
    sprintf('série=%d · real=%d', array_sum($novo['criados']), $real));

echo "\n=== o summary continua respondendo inteiro ===\n";
$s = $repo->summary(30);
ok('tem periodo, kpis e estado', isset($s['periodo'], $s['kpis'], $s['estado']));
ok('kpis vêm com valor, anterior e série', count($s['kpis']) > 0
    && array_key_exists('valor', $s['kpis'][0]) && array_key_exists('anterior', $s['kpis'][0])
    && is_array($s['kpis'][0]['serie'] ?? null), count($s['kpis']) . ' KPIs');
ok('a série tem um ponto por dia da janela',
    count($s['kpis'][0]['serie']) === (int)$s['periodo']['dias_atual'],
    sprintf('%d pontos para %d dias', count($s['kpis'][0]['serie']), $s['periodo']['dias_atual']));

printf("\n%s — %d checagens, %d falha(s)\n", $falhas === 0 ? 'PASSOU' : 'REPROVOU', $checagens, $falhas);
exit($falhas === 0 ? 0 : 1);
