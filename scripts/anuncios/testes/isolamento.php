<?php
// Anúncios — teste de ISOLAMENTO do stats.php (31/10/2026, aprovado pelo Jhony): cada usuário vê só o TEXTO das próprias perguntas;
// gestão (nível ≥ 80) vê os agregados de todos, nunca o texto de terceiros. Roda o stats.php real em subprocessos com sessão sintética
// e compara com contagens lidas direto do banco (só SELECT). Uso: php isolamento.php (exit 1 em falha).
declare(strict_types=1);
$h = __DIR__ . '/_executar-rota.php';
$falhas = 0; $n = 0;
$ok = static function (string $nome, bool $c, string $det = '') use (&$falhas, &$n): void {
    $n++; if (!$c) { $falhas++; echo "[ERRO] $nome" . ($det !== '' ? " — $det" : '') . "\n"; }
};
$rodar = static function (string $uid, string $nivel, string $query = '') use ($h): array {
    $p = proc_open([PHP_BINARY, '-d', 'error_log=/dev/null', '-d', 'display_errors=0', $h, $uid, $nivel, $query], [1 => ['pipe', 'w'], 2 => ['pipe', 'w']], $pipes);
    $out = stream_get_contents($pipes[1]); $err = stream_get_contents($pipes[2]); proc_close($p);
    preg_match('/HTTP=(\d+)/', $err, $m);
    $j = json_decode((string)$out, true);
    return [(int)($m[1] ?? 0), is_array($j) ? ($j['data'] ?? null) : null, (string)$out];
};
$ids = static fn(?array $d): array => array_values(array_unique(array_map(
    static fn($l) => (int)$l['conversa_id'],
    array_merge($d['recentes'] ?? [], $d['negativas'] ?? [], $d['sem_cobertura'] ?? [])
)));

// 0) sem sessão (não toca banco) + estrutura: toda lista com texto passa pelo recorte do próprio usuário
[$c] = $rodar('sem-sessao', '0'); $ok('sem sessão → 401', $c === 401, "HTTP $c");
$fonte = (string)file_get_contents(__DIR__ . '/../../../api/anuncios/stats.php');
preg_match_all('/anuncios_stats_linhas\(\$pdo,[^;]*;/', $fonte, $chamadas);
$ok('listas com texto: 3 chamadas, todas com $posseMeus', count($chamadas[0]) === 3 && count(array_filter($chamadas[0], static fn($x) => str_contains($x, '$posseMeus, $pMeus'))) === 3);
if (!is_file(__DIR__ . '/../../../.env')) { // clone de trabalho: sem credencial do banco (nunca copiada) — casos com dados rodam no lugar
    echo "[--]   sem .env (clone): casos com dados reais rodam no lugar, depois do deploy\n";
    echo ($falhas ? '[ERRO]' : '[OK]  ') . " isolamento (anuncios/stats, sem banco): $n casos, $falhas falha(s)\n";
    exit($falhas ? 1 : 0);
}
require_once __DIR__ . '/../../../config/db_connection.php';
$pdo = getConnection('DSHOWDASH');
$conversasTotal = (int)$pdo->query('SELECT COUNT(*) FROM anuncios_conversas')->fetchColumn();
$perguntasTotal = (int)$pdo->query('SELECT COUNT(*) FROM anuncios_mensagens WHERE role = "user"')->fetchColumn();
$donos = $pdo->query('SELECT c.user_id, COUNT(*) n FROM anuncios_conversas c JOIN anuncios_mensagens m ON m.conversa_id = c.id
                      GROUP BY c.user_id ORDER BY n DESC LIMIT 2')->fetchAll(PDO::FETCH_ASSOC);
$sintetico = '999003'; // não existe em app_users nem tem conversas


// 2) abaixo do nível da gestão: só o próprio (sintético = vazio), nunca texto de terceiros
foreach (['0', '50', '79'] as $lv) {
    [$c, $d] = $rodar($sintetico, $lv);
    $ok("nível $lv → 200 escopo meus", $c === 200 && ($d['escopo']['agregados'] ?? '') === 'meus' && ($d['escopo']['listas'] ?? '') === 'meus', "HTTP $c");
    $ok("nível $lv → totais zerados (usuário sem conversas)", ($d['totais']['conversas'] ?? -1) === 0 && ($d['totais']['perguntas'] ?? -1) === 0);
    $ok("nível $lv → nenhuma linha com texto", $ids($d) === [], 'conversas: ' . implode(',', $ids($d)));
    $ok("nível $lv → atividade/domínios só do próprio", ($d['atividade'] ?? null) === [] && ($d['dominios'] ?? null) === []);
}

// 3) gestão (80/100): agregados de todos, listas ainda só do próprio
foreach (['80', '100'] as $lv) {
    [$c, $d] = $rodar($sintetico, $lv);
    $ok("nível $lv → escopo todos nos agregados", $c === 200 && ($d['escopo']['agregados'] ?? '') === 'todos' && ($d['escopo']['listas'] ?? '') === 'meus', "HTTP $c");
    $ok("nível $lv → totais = banco ({$conversasTotal} conversas, {$perguntasTotal} perguntas)",
        ($d['totais']['conversas'] ?? -1) === $conversasTotal && ($d['totais']['perguntas'] ?? -1) === $perguntasTotal);
    $ok("nível $lv → nenhum texto de terceiros", $ids($d) === [], 'conversas: ' . implode(',', $ids($d)));
}
[$c, $d] = $rodar($sintetico, '100', 'escopo=meus');
$ok('gestão com ?escopo=meus → recorte pessoal', $c === 200 && ($d['escopo']['agregados'] ?? '') === 'meus' && ($d['totais']['conversas'] ?? -1) === 0);

// 4) dono real (se houver dados): vê o próprio texto, nada de outro dono
if ($donos) {
    $a = (string)$donos[0]['user_id'];
    $st = $pdo->prepare('SELECT id FROM anuncios_conversas WHERE user_id = ?'); $st->execute([(int)$a]);
    $deA = array_map('intval', $st->fetchAll(PDO::FETCH_COLUMN));
    [$c, $d] = $rodar($a, '0');
    $vistos = $ids($d);
    $ok('dono real nível 0 → vê as próprias linhas', $c === 200 && $vistos !== [], "HTTP $c, " . count($vistos) . ' conversa(s)');
    $ok('dono real nível 0 → todas as linhas são dele', array_diff($vistos, $deA) === [], 'alheias: ' . implode(',', array_diff($vistos, $deA)));
    $ok('dono real nível 0 → totais.conversas = as dele', ($d['totais']['conversas'] ?? -1) === count($deA));
    if (count($donos) > 1) {
        [$c, $d] = $rodar((string)$donos[1]['user_id'], '0');
        $ok('outro dono nível 0 → nenhuma conversa do primeiro', array_intersect($ids($d), $deA) === []);
    } else { echo "[--]   só 1 dono com conversas: cruzamento entre dois donos não se aplica\n"; }
} else { echo "[--]   nenhuma conversa no banco: casos com dono real não se aplicam\n"; }

echo ($falhas ? '[ERRO]' : '[OK]  ') . " isolamento (anuncios/stats): $n casos, $falhas falha(s)\n";
exit($falhas ? 1 : 0);
