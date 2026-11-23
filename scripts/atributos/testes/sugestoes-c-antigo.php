<?php
// PARTE C (ESQUERDA, 23/11) — item 11 do plano: CÓDIGO ANTIGO × DADOS NOVOS. Esta parte (código NOVO) monta a base com 001–013 e linhas
// 'ignorada', 'substituida', sucessora 'r:' e original pendente; o FILHO (_sugestoes-c-antigo-filho.php) roda o código de produção ANTERIOR
// (árvore extraída por git archive em SUGC_ANTIGO) — leitura da Conferência, decidir, aceitarLote e a CARGA C6 antiga 2× — e devolve JSON.
// Depois esta parte confere o estado final com o código novo. Rollback de código sem reverter a 013 = seguro (PROPOSTA v2 §9).
// Entradas: EQ_TEST_CNF, EQ_TEST_DB (ATRWEB_VAL_T_7/_8/_9 VAZIO) e SUGC_ANTIGO (pasta com api/atributos, tools e _memoria.php do código anterior).
declare(strict_types=1);
require_once __DIR__ . '/../../../tools/equipamentos/cargas.php';
[$cnf, $db, $antigo] = [(string) (getenv('EQ_TEST_CNF') ?: ''), (string) (getenv('EQ_TEST_DB') ?: ''), (string) (getenv('SUGC_ANTIGO') ?: '')];
$dir = __DIR__ . '/../../../db/equipamentos/migrations';
if ($cnf === '' || $db === '' || $antigo === '' || !is_readable($cnf)) { echo "[NÃO EXECUTADO] sugestoes-c-antigo: faltam EQ_TEST_CNF/EQ_TEST_DB/SUGC_ANTIGO\n"; exit(2); }
if (!in_array($db, ['ATRWEB_VAL_T_7', 'ATRWEB_VAL_T_8', 'ATRWEB_VAL_T_9'], true)) { echo "[RECUSADO] sugestoes-c-antigo: só ATRWEB_VAL_T_7, _T_8 ou _T_9\n"; exit(3); }
if (!is_file("$antigo/api/atributos/SugestoesService.php") || str_contains((string) file_get_contents("$antigo/api/atributos/SugestoesService.php"), 'SugestoesDecisoes')) { echo "[RECUSADO] SUGC_ANTIGO não é o código anterior à Parte C\n"; exit(3); }
$c = (parse_ini_file($cnf, true, INI_SCANNER_RAW) ?: [])['client'] ?? [];
$tira = fn($v) => trim((string) $v, " \t\"'");
$dsn = 'mysql:' . (isset($c['socket']) ? 'unix_socket=' . $tira($c['socket']) : 'host=' . $tira($c['host'] ?? '127.0.0.1') . ';port=' . (int) ($c['port'] ?? 3306)) . ";dbname=$db;charset=utf8mb4";
$pdo = new PDO($dsn, $tira($c['user'] ?? ''), $tira($c['password'] ?? ''), [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
if ((int) $pdo->query('SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE()')->fetchColumn() !== 0) { echo "[RECUSADO] sugestoes-c-antigo: $db não está vazio\n"; exit(3); }
$arqs = array_values(array_filter(glob("$dir/[0-9][0-9][0-9]_*.sql") ?: [], static fn($f) => !str_ends_with($f, '.revert.sql'))); sort($arqs, SORT_STRING);
foreach ($arqs as $arq) foreach (preg_split('/;\s*\n/', (string) preg_replace('/^--.*$/m', '', (string) file_get_contents($arq))) ?: [] as $st) {
    $st = trim($st); if ($st === '') continue;
    if (!preg_match('/^(CREATE TABLE IF NOT EXISTS|ALTER TABLE|INSERT (IGNORE )?INTO|UPDATE) `eq_[a-z_]+`/i', $st)) { echo "[RECUSADO] comando fora da lista\n"; exit(3); }
    $pdo->exec(rtrim($st, ';'));
}
$falhas = 0; $n = 0;
$ok = function (string $nome, bool $cond, string $det = '') use (&$falhas, &$n): void { $n++; if (!$cond) { $falhas++; echo "[ERRO] $nome" . ($det !== '' ? "\n       $det" : '') . "\n"; } };
$um = function (string $sql, array $p = []) use ($pdo) { $s = $pdo->prepare($sql); $s->execute($p); return $s->fetchColumn(); };
$row = function (int $id) use ($pdo) { $s = $pdo->prepare('SELECT * FROM eq_sugestao WHERE id = ?'); $s->execute([$id]); return $s->fetch(PDO::FETCH_ASSOC); };

// ---- massa (SQL): catálogo com nomes que a C6 lê, Pitch e Tipo do LED, e as quatro situações ---------------------------------------
$pdo->exec('CREATE TABLE `product_catalog` (`id` INT UNSIGNED NOT NULL PRIMARY KEY, `name` VARCHAR(120) NOT NULL, `category` VARCHAR(40) NOT NULL, `subcategory` VARCHAR(60) NULL,
    `active` TINYINT(1) NOT NULL DEFAULT 1, `deleted` TINYINT(1) NOT NULL DEFAULT 0) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci');
foreach ([201, 202, 203, 204, 205] as $pid) $pdo->exec("INSERT INTO product_catalog VALUES ($pid, 'Módulo P.2.5 Indoor 320mm x 160mm 3840Hz', 'LED_PANEL', 'LED_MODULE', 1, 0)");
$pdo->exec("INSERT INTO eq_unidade (simbolo, nome, grandeza) VALUES ('mm', 'milímetro', 'comprimento'), ('Hz', 'hertz', 'frequencia')");
$mm = (int) $um("SELECT id FROM eq_unidade WHERE simbolo = 'mm'");
$pdo->prepare("INSERT INTO eq_atributo (codigo, rotulo, tipo, unidade_id) VALUES ('pitch_138', 'Pitch', 'numero', ?), ('tipo_do_led_87', 'Tipo do LED', 'opcao', NULL)")->execute([$mm]);
$P = (int) $um("SELECT id FROM eq_atributo WHERE codigo = 'pitch_138'"); $TL = (int) $um("SELECT id FROM eq_atributo WHERE codigo = 'tipo_do_led_87'");
$pdo->prepare("INSERT INTO eq_opcao (atributo_id, rotulo, posicao, ativo) VALUES (?, 'Indoor', 1, 1)")->execute([$TL]);
$ins = function (int $pid, string $valor, string $estado, ?int $subst = null) use ($pdo, $P, $mm): int {
    $pdo->prepare("INSERT INTO eq_sugestao (chave, product_id, atributo_id, fonte, tipo, valor_proposto, unidade_id, evidencia, estado, substitui_id) VALUES (?, ?, ?, 'nome_produto', 'valor', ?, ?, 'teste', ?, ?)")
        ->execute(["nome_produto|$pid|$P" . ($subst !== null ? "|r:$subst" : ''), $pid, $P, $valor, $mm, $estado, $subst]);
    return (int) $pdo->lastInsertId();
};
$orig201 = $ins(201, '2.5', 'recusada'); $suc201 = $ins(201, '3', 'pendente', $orig201);        // recusada + sucessora pendente
$orig202 = $ins(202, '9', 'pendente');                                                         // original pendente (a C6 antiga revisa)
$ign203 = $ins(203, '2.5', 'ignorada');                                                        // ignorada
$sub204 = $ins(204, '1', 'substituida'); $suc204 = $ins(204, '2', 'pendente', $sub204);        // substituída + sucessora
// DSHOW-105 D: cadeia longa — a chave ORIGINAL (nome_produto|205|P) está ocupada por uma recusada; a pendente é a 3ª (r:<2ª>)
$a205 = $ins(205, '2.5', 'recusada'); $b205 = $ins(205, '4', 'recusada', $a205); $c205 = $ins(205, '5', 'pendente', $b205);
$antes = ['suc201' => $row($suc201), 'suc204' => $row($suc204), 'n' => (int) $um('SELECT COUNT(*) FROM eq_sugestao')];

// ---- o FILHO roda o código ANTERIOR sobre esta base ------------------------------------------------------------------------------------
$cmd = implode(' ', array_map('escapeshellarg', [PHP_BINARY, __DIR__ . '/_sugestoes-c-antigo-filho.php'])) . ' 2>&1';
$env = ['EQ_TEST_CNF' => $cnf, 'EQ_TEST_DB' => $db, 'SUGC_ANTIGO' => $antigo, 'SUGC_IDS' => json_encode(compact('orig201', 'suc201', 'orig202', 'ign203', 'sub204', 'suc204', 'c205', 'P', 'TL'))];
$proc = proc_open($cmd, [1 => ['pipe', 'w']], $pipes, null, $env + getenv());
$saida = stream_get_contents($pipes[1]); fclose($pipes[1]); $rc = proc_close($proc);
$j = preg_match('/^FILHO_JSON (.+)$/m', $saida, $m) ? json_decode($m[1], true) : null;
$ok('filho (código antigo) rodou até o fim', $rc === 0 && is_array($j), $saida);
$j ??= [];
$ok('antigo GET conferencia: só pendentes (202 e as duas sucessoras); ignorada e substituída fora', ($j['fila_nome'] ?? null) === [$suc201, $orig202, $suc204, $c205], json_encode($j['fila_nome'] ?? null));
$ok('antigo POST sugestao recusar na ignorada → sem_mudanca; linha intacta', ($j['decidir_ignorada'] ?? null) === 'sem_mudanca' && $row($ign203)['estado'] === 'ignorada');
$ok('antigo sugestoes_lote [ignorada, substituida] → as duas ja_decidida, 0 aceitas', ($j['lote_aceitas'] ?? null) === 0 && ($j['lote_motivos'] ?? null) === ['ja_decidida', 'ja_decidida']);
$ok('antigo aceitar a sucessora 201 (pendente r:) → aceita com valor', ($j['aceitar_sucessora'] ?? null) === 'aceitar' && $row($suc201)['estado'] === 'aceita' && $row($suc201)['decidido_por_id'] === null);
$ok('carga C6 ANTIGA 1ª: não toca nas linhas da 201/204 e revisa a original pendente 202', ($j['c6_1']['revistas'] ?? 0) === 1 && $row($orig202)['valor_proposto'] === '2.5'
    && $row($suc204)['valor_proposto'] === $antes['suc204']['valor_proposto'] && (int) $row($suc204)['versao'] === (int) $antes['suc204']['versao'], json_encode($j['c6_1'] ?? null));
$ok('carga C6 antiga não insere Pitch para identidades com linha antiga (ja_existiam) e só cria Tipo do LED novos', (int) $um('SELECT COUNT(*) FROM eq_sugestao WHERE atributo_id = ?', [$P]) === $antes['n']);
$ok('carga C6 antiga 2ª: nada novo (idempotente)', ($j['c6_2']['sugestoes'] ?? -1) === 0 && ($j['c6_2']['revistas'] ?? 0) === 0 && ($j['n_depois_c6_2'] ?? -1) === ($j['n_depois_c6_1'] ?? -2), json_encode($j['c6_2'] ?? null));
$ok('cadeia longa (205): a carga antiga não duplica, não altera a 3ª pendente e não para', $row($c205)['valor_proposto'] === '5' && (int) $row($c205)['versao'] === 1
    && (int) $um('SELECT COUNT(*) FROM eq_sugestao WHERE product_id = 205 AND atributo_id = ?', [$P]) === 3);
$ok('invariante: toda identidade com linhas tem a linha da chave ORIGINAL (a carga antiga nunca tenta inserir em cima de uma sucessora)',
    (int) $um("SELECT COUNT(*) FROM (SELECT fonte, tipo, product_id, atributo_id FROM eq_sugestao GROUP BY fonte, tipo, product_id, atributo_id
        HAVING SUM(chave = CONCAT(fonte, '|', product_id, '|', atributo_id, IF(tipo = 'conferencia', '|conferencia', ''))) <> 1) x") === 0);
$ok('o hash GERADO acompanhou a revisão feita pelo código antigo (202)', $row($orig202)['conteudo_hash'] === Cargas::hashConteudo(null, '2.5', null, $mm));
$ok('nenhuma 2ª pendente por identidade depois do código antigo', (int) $um("SELECT COUNT(*) FROM (SELECT pendente_identidade FROM eq_sugestao WHERE pendente_identidade IS NOT NULL GROUP BY pendente_identidade HAVING COUNT(*) > 1) d") === 0);
// a carga NOVA depois do código antigo continua coerente: na 202 (revisada para 2.5) nada; na 203 (ignorada 2.5) nada; na 204 a sucessora '2' ≠ '2.5' → revista
$cargas = new Cargas($pdo, $db, false, static fn() => null);
$pr = fn(int $pid) => $cargas->proporSugestao(['fonte' => 'nome_produto', 'tipo' => 'valor', 'product_id' => $pid, 'atributo_id' => $P, 'alt' => null, 'valor' => '2.5', 'opcao' => null, 'unidade' => $mm,
    'confianca' => 'media', 'evidencia' => 'novo', 'lote' => null, 'usuario' => 'carga:teste', 'motivo' => 'teste']);
$ok('carga NOVA depois do antigo: 202 ja_existia, 203 ja_existia (ignorada igual), 204 revista na sucessora', $pr(202) === 'ja_existia' && $pr(203) === 'ja_existia' && $pr(204) === 'revista' && $row($suc204)['valor_proposto'] === '2.5');

echo ($falhas === 0 ? '[OK]  ' : '[ERRO]') . " sugestoes-c-antigo (código 44099cd3 × dados da 013, inclusive a carga C6 antiga): $n casos, $falhas falha(s) ($db)\n";
exit($falhas === 0 ? 0 : 1);
