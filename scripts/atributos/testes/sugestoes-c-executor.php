<?php
// PARTE C (ESQUERDA, 23/11) — item 1 do plano: a 013 pelo EXECUTOR de verdade (tools/db/equipamentos-migrar.php), num schema
// ATRWEB_VAL_T_7/_8/_9 VAZIO: ordem 011 → 012 → 013, LACUNA recusada (013 aplicada com a 012 pendente), --ate, idempotência, preflight
// (ENUM ampliado, CHECK, parcial), revert recusado com ignorada/sucessora e tempo da 013 com 5 000 linhas.
// Entradas: ATR_TESTE_CRED (arquivo [client], 600) e ATR_TESTE_SCHEMA. Saída: 0 verde · 1 falha · 2 não executado · 3 recusado.
declare(strict_types=1);
require_once __DIR__ . '/../../../tools/db/equipamentos-migrar.php';
$cred = (string) (getenv('ATR_TESTE_CRED') ?: ''); $db = (string) (getenv('ATR_TESTE_SCHEMA') ?: '');
if ($cred === '' || $db === '') { echo "[NÃO EXECUTADO] sugestoes-c-executor: faltam ATR_TESTE_CRED/ATR_TESTE_SCHEMA\n"; exit(2); }
if (!in_array($db, ['ATRWEB_VAL_T_7', 'ATRWEB_VAL_T_8', 'ATRWEB_VAL_T_9'], true)) { echo "[RECUSADO] sugestoes-c-executor: só ATRWEB_VAL_T_7, _T_8 ou _T_9\n"; exit(3); }
$raiz = realpath(__DIR__ . '/../../..'); $dir = "$raiz/db/equipamentos/migrations";
$pdo = migrador_conectar($cred); $pdo->exec("USE `$db`");
if ((int) $pdo->query('SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE()')->fetchColumn() !== 0) { echo "[RECUSADO] sugestoes-c-executor: $db não está vazio\n"; exit(3); }
$falhas = 0; $n = 0;
$ok = function (string $nome, bool|Closure $cond, string $det = '') use (&$falhas, &$n): void {
    $n++; $msg = '';
    if ($cond instanceof Closure) { try { $cond = (bool) $cond(); } catch (Throwable $t) { $cond = false; $msg = ' (exceção: ' . get_class($t) . ' ' . $t->getMessage() . ')'; } }
    if (!$cond) { $falhas++; echo "[ERRO] $nome$msg" . ($det !== '' ? "\n       $det" : '') . "\n"; }
};
$migrar = function (string ...$extra) use ($cred, $db, $raiz): array {
    exec(implode(' ', array_map('escapeshellarg', array_merge([PHP_BINARY, "$raiz/tools/db/equipamentos-migrar.php", '--schema', $db, '--credenciais', $cred], $extra))) . ' 2>&1', $out, $rc);
    $txt = implode("\n", $out);
    return [$rc, $txt, preg_match('/^MIGRAR_OK (.+)$/m', $txt, $m) ? json_decode($m[1], true) : null];
};
$um = fn(string $sql, array $p = []) => (function () use ($pdo, $sql, $p) { $s = $pdo->prepare($sql); $s->execute($p); return $s->fetchColumn(); })();
$ledger = fn() => array_column($pdo->query("SELECT version FROM eq_schema_migrations WHERE version NOT LIKE '%revertida%' ORDER BY version")->fetchAll(PDO::FETCH_ASSOC), 'version');
$colunas = fn() => (int) $um("SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'eq_sugestao' AND COLUMN_NAME IN ('decidido_por_id', 'substitui_id', 'conteudo_hash', 'pendente_identidade')");

// ---- leitura (sem banco) ---------------------------------------------------------------------------------------------------------------
$obj = Migrador::objetosDaMigracao((string) file_get_contents("$dir/013_sugestao_estados.sql"));
$ok('preflight lê a 013: 1 ENUM ampliado + 4 colunas + 4 índices + ledger', count($obj[1]['objetos']) === 9 && $obj[1]['objetos'][0]['tipo'] === 'enum' && $obj[1]['objetos'][0]['valores'] === ['pendente', 'aceita', 'recusada', 'ignorada', 'substituida'] && $obj[2]['tipo'] === 'ledger');
$rv = Migrador::objetosDaMigracao((string) file_get_contents("$dir/013_sugestao_estados.revert.sql"));
$ok('preflight lê o revert da 013 (CHECK + DROP CHECK + ENUM + remoções)', !array_filter($rv, static fn($c) => $c['erro'] !== null) && $rv[1]['objetos'][0]['tipo'] === 'check' && $rv[2]['objetos'][0]['depois'] === false);
$ok('enumContem: superconjunto → true; faltando → false; não-ENUM → false', Migrador::enumContem("enum('a','b','c')", ['a', 'c']) && !Migrador::enumContem("enum('a','b')", ['a', 'z']) && !Migrador::enumContem('varchar(10)', ['a']));

// ---- ordem e LACUNA -------------------------------------------------------------------------------------------------------------------
[$rc, $o, $r] = $migrar('--ate', '011_operacao');
$ok('--ate 011: aplica 001–011 e para', $rc === 0 && end($r['aplicadas']) === '011_operacao' && count($r['aplicadas']) === 11, $o);
[$rc, $o] = $migrar('--ate', '099_nao_existe');
$ok('--ate inexistente → recusa, nada muda', $rc !== 0 && str_contains($o, 'não existe') && $ledger()[10] === '011_operacao' && count($ledger()) === 11, $o);
// diretório SEM a 012 (o risco real: a 013 entrar antes da 012 chegar)
$tmp = sys_get_temp_dir() . '/sug-c-exec-' . bin2hex(random_bytes(6));
if (!str_starts_with($tmp, sys_get_temp_dir() . '/sug-c-exec-') || !mkdir($tmp, 0700) || !is_dir($tmp)) { echo "[RECUSADO] não consegui criar a pasta temporária\n"; exit(3); }
foreach (glob("$dir/0*.sql") ?: [] as $f) if (!str_starts_with(basename($f), '012_')) copy($f, "$tmp/" . basename($f));
[$rc, $o, $r] = $migrar('--dir', $tmp);
$ok('árvore sem a 012: a 013 entra (o executor não tinha como saber)', $rc === 0 && ($r['aplicadas'] ?? null) === ['013_sugestao_estados'], $o);
$antes = $ledger();
[$rc, $o] = $migrar();
$ok('árvore com a 012: LACUNA recusada (012 pendente abaixo da 013), nada muda', $rc !== 0 && str_contains($o, 'LACUNA') && str_contains($o, '012_kit_prioridade') && $ledger() === $antes, $o);
[$rc, $o] = $migrar('--dir', $tmp, '--reverter', '013_sugestao_estados');
$ok('recuperação: reverter a 013 (validação)', $rc === 0 && !in_array('013_sugestao_estados', $ledger(), true) && $colunas() === 0, $o);
[$rc, $o, $r] = $migrar('--ate', '012_kit_prioridade');
$ok('--ate 012: aplica só a 012', $rc === 0 && ($r['aplicadas'] ?? null) === ['012_kit_prioridade'], $o);
[$rc, $o, $r] = $migrar();
$ok('em ordem: aplica a 013', $rc === 0 && ($r['aplicadas'] ?? null) === ['013_sugestao_estados'] && $colunas() === 4, $o);
[$rc, $o, $r] = $migrar();
$ok('reaplicar: 0 DDL (todas conferidas)', $rc === 0 && ($r['aplicadas'] ?? null) === [] && count($r['conferidas'] ?? []) === 13, $o);
[$rc, $o] = $migrar('--verificar');
$ok('--verificar: PREFLIGHT_OK e 013 ok 9/9', $rc === 0 && str_contains($o, 'PREFLIGHT_OK') && preg_match('/013_sugestao_estados\s+ledger=sim estado=ok\s+objetos=9\/9/', $o), $o);

// ---- revert RECUSADO com ignorada / sucessora (CHECK, independe do sql_mode) -------------------------------------------------------
$pdo->exec("INSERT INTO eq_atributo (codigo, rotulo, tipo) VALUES ('t', 'T', 'texto')"); $aid = (int) $pdo->lastInsertId();
$ins = fn(string $chave, int $pid, string $estado, ?int $subst = null) => $pdo->prepare("INSERT INTO eq_sugestao (chave, product_id, atributo_id, fonte, tipo, valor_proposto, estado, substitui_id) VALUES (?, ?, ?, 'nome_produto', 'valor', '1', ?, ?)")->execute([$chave, $pid, $aid, $estado, $subst]);
$ins('x|1', 1, 'ignorada'); $idIgn = (int) $pdo->lastInsertId();
[$rc, $o] = $migrar('--reverter', '013_sugestao_estados');
$ok('revert com linha ignorada → RECUSADO (CHECK 3819); 013 continua no ledger e as colunas existem', $rc !== 0 && str_contains($o, '3819') && in_array('013_sugestao_estados', $ledger(), true) && $colunas() === 4
    && (string) $um('SELECT estado FROM eq_sugestao WHERE id = ?', [$idIgn]) === 'ignorada', $o);
// a MESMA reversão numa sessão SEM modo estrito (onde o MODIFY sozinho trocaria 'ignorada' por ''): a trava é o CHECK, recusa igual
$pdo->exec("SET SESSION sql_mode = ''");
$eNs = null; try { (new Migrador($pdo, $db, $dir, static fn() => null))->reverter('013_sugestao_estados'); } catch (Throwable $t) { $eNs = $t; }
$pdo->exec("SET SESSION sql_mode = DEFAULT");
$ok('sem modo estrito: o revert também é RECUSADO e a linha continua ignorada', $eNs instanceof PDOException && (int) ($eNs->errorInfo[1] ?? 0) === 3819
    && (string) $um('SELECT estado FROM eq_sugestao WHERE id = ?', [$idIgn]) === 'ignorada' && $colunas() === 4, $eNs ? $eNs->getMessage() : 'não recusou');
$pdo->prepare("UPDATE eq_sugestao SET estado = 'recusada' WHERE id = ?")->execute([$idIgn]);
$ins('x|1|r:' . $idIgn, 1, 'pendente', $idIgn);
[$rc, $o] = $migrar('--reverter', '013_sugestao_estados');
$ok('revert com sucessora (substitui_id) → RECUSADO; nada muda', $rc !== 0 && $colunas() === 4 && in_array('013_sugestao_estados', $ledger(), true), $o);
$ok('a trava do revert não sobra (CHECK criado e removido só no revert bem-sucedido)', (int) $um("SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA = DATABASE() AND CONSTRAINT_TYPE = 'CHECK' AND CONSTRAINT_NAME = 'chk_eq_sugestao_revert_013'") === 0);
$pdo->exec("UPDATE eq_sugestao SET substitui_id = NULL");   // base de TESTE: limpar a sucessora para provar o caminho feliz
[$rc, $o] = $migrar('--reverter', '013_sugestao_estados');
$ok('sem ignorada/sucessora: revert ok', $rc === 0 && $colunas() === 0, $o);

// ---- preflight PARCIAL (uma coluna já existe, o resto não) ----------------------------------------------------------------------------
$pdo->exec('ALTER TABLE eq_sugestao ADD COLUMN `decidido_por_id` BIGINT NULL');
[$rc, $o] = $migrar('--dry-run');
$ok('013 parcial → RECUSA antes de qualquer DDL, listando o que existe e o que falta', $rc !== 0 && str_contains($o, '013_sugestao_estados PARCIAL') && str_contains($o, 'decidido_por_id'), $o);
$pdo->exec('ALTER TABLE eq_sugestao DROP COLUMN `decidido_por_id`');

// ---- tempo da 013 com 5 000 linhas (a tabela é reconstruída: colunas geradas STORED) ---------------------------------------------------
$v = []; for ($i = 1; $i <= 5000; $i++) $v[] = "('t|$i', " . (100000 + $i) . ", $aid, 'nome_produto', 'valor', '$i', 'pendente')";
foreach (array_chunk($v, 1000) as $ch) $pdo->exec('INSERT INTO eq_sugestao (chave, product_id, atributo_id, fonte, tipo, valor_proposto, estado) VALUES ' . implode(',', $ch));
$t0 = microtime(true); [$rc, $o, $r] = $migrar(); $seg = microtime(true) - $t0;
$ok('013 com 5 001 linhas: aplica; hash e identidade preenchidos em todas', $rc === 0 && ($r['aplicadas'] ?? null) === ['013_sugestao_estados']
    && (int) $um('SELECT COUNT(*) FROM eq_sugestao WHERE conteudo_hash IS NULL') === 0 && (int) $um("SELECT COUNT(*) FROM eq_sugestao WHERE estado = 'pendente' AND pendente_identidade IS NULL") === 0, $o);
echo sprintf("[INFO] 013 com 5 001 linhas: %.2f s (processo do executor inteiro)\n", $seg);

echo ($falhas === 0 ? '[OK]  ' : '[ERRO]') . " sugestoes-c-executor (013: ordem, lacuna, --ate, preflight ENUM/CHECK/parcial, revert recusado, tempo): $n casos, $falhas falha(s) ($db)\n";
exit($falhas === 0 ? 0 : 1);
