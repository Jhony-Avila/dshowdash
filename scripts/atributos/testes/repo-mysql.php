<?php
// Equipamentos › Atributos — P1-10 (V5 Lote 3): teste do REPOSITÓRIO PDO + serviço contra MySQL REAL, num banco *_VALIDACAO VAZIO, com
// TODAS as migrations de DSHOW_EQUIPAMENTOS aplicadas em ordem (001, 002, …; tabelas reais com FKs) e o catálogo FALSO injetado.
// Cobre: golden-ficha (D4 + P1-07) no SQL real, multiopção com estado único, 1062 → conflito, P1-09 com DUAS conexões (trava real),
// ATR-07, P2-01 (decimal/data exatos no banco), P2-02 (SET NULL) e auditoria.
//
// Entradas (nenhuma senha em argumento ou variável): EQ_TEST_CNF = arquivo de opções do cliente MySQL ([client] user/password/host/port/
// socket), EQ_TEST_DB = banco de VALIDAÇÃO vazio (nome terminado em _VALIDACAO), EQ_SQL_DIR = pasta com NNN_*.sql (app-dshow
// docs/projetos/equipamentos-atributos/fase-b/sql). Nada é apagado: as tabelas ficam no banco de validação (rodar de novo = banco novo).
// Saída: exit 0 = executado e verde · 1 = executado com falha · 2 = NÃO EXECUTADO (sem entradas) · 3 = RECUSADO (banco não é de validação,
// não está vazio, ou migration com comando fora da lista). "NÃO EXECUTADO" NUNCA é reportado como OK (antes: "pulado" + exit 0).
declare(strict_types=1);
require_once __DIR__ . '/../../../api/atributos/AtributosRepo.php';
require_once __DIR__ . '/_memoria.php';
require_once __DIR__ . '/_golden.php';

$env = fn(string $k) => (string) (getenv($k) ?: '');
[$cnf, $db, $dir] = [$env('EQ_TEST_CNF'), $env('EQ_TEST_DB'), $env('EQ_SQL_DIR') ?: (__DIR__ . '/../../../db/equipamentos/migrations')];   // ATRIBUTOS-WEB: padrão = migrações do Dash
if ($cnf === '' || $db === '' || $dir === '' || !is_readable($cnf) || !is_dir($dir)) {
    echo "[NÃO EXECUTADO] repo-mysql: faltam EQ_TEST_CNF/EQ_TEST_DB/EQ_SQL_DIR (banco de validação) — a persistência NÃO foi provada\n";
    exit(2);
}
if (!preg_match('/^[A-Za-z0-9_]{1,64}_VALIDACAO$/', $db) && !preg_match('/^ATRWEB_VAL_T_[A-Za-z0-9_]{1,40}$/', $db)) { echo "[RECUSADO] repo-mysql: EQ_TEST_DB precisa ser *_VALIDACAO ou ATRWEB_VAL_T_*\n"; exit(3); }

// ---- migrations: lista fechada de comandos, conferida ANTES de executar qualquer um -----------------------------------------------------
$arqs = array_values(array_filter(glob(rtrim($dir, '/') . '/[0-9][0-9][0-9]_*.sql') ?: [], static fn($f) => !str_ends_with($f, '.revert.sql')));   // ATRIBUTOS-WEB: reversões fora
sort($arqs, SORT_STRING);
if (!$arqs) { echo "[RECUSADO] repo-mysql: nenhuma migration em EQ_SQL_DIR\n"; exit(3); }
$comandos = [];
foreach ($arqs as $arq) {
    $sql = (string) preg_replace('/^--.*$/m', '', (string) file_get_contents($arq));
    foreach (preg_split('/;\s*\n/', $sql) ?: [] as $st) {
        $st = trim($st);
        if ($st === '') continue;
        $permitido = preg_match('/^(CREATE TABLE IF NOT EXISTS|ALTER TABLE|INSERT (IGNORE )?INTO|UPDATE) `eq_[a-z_]+`/i', $st) === 1   // UPDATE: preenchimento da 012
            && preg_match('/`\s*\.\s*`|\bUSE\b|\bDROP\b|\bDELETE\b|\bTRUNCATE\b|\bGRANT\b|\bDATABASE\b/i', (string) preg_replace(["/ON (DELETE|UPDATE) RESTRICT/i", "/'(?:[^'\\\\]|\\\\.|'')*'/", '/"(?:[^"\\\\]|\\\\.)*"/'], '', $st)) === 0;   // ATRIBUTOS-WEB: FK "ON DELETE RESTRICT" e textos de COMMENT não contam (o original recusava a própria 001)
        if (!$permitido) { echo '[RECUSADO] repo-mysql: comando fora da lista em ' . basename($arq) . ': ' . substr((string) preg_replace('/\s+/', ' ', $st), 0, 80) . "\n"; exit(3); }
        $comandos[] = rtrim($st, ';');
    }
}

// ---- conexão: credencial lida do arquivo de opções, nunca impressa ---------------------------------------------------------------------
$ini = parse_ini_file($cnf, true, INI_SCANNER_RAW) ?: [];
$c = $ini['client'] ?? [];
$tira = fn($v) => trim((string) $v, " \t\"'");
$dsn = 'mysql:' . (isset($c['socket']) ? 'unix_socket=' . $tira($c['socket']) : 'host=' . $tira($c['host'] ?? '127.0.0.1') . ';port=' . (int) ($c['port'] ?? 3306)) . ";dbname=$db;charset=utf8mb4";
$conectar = fn() => new PDO($dsn, $tira($c['user'] ?? ''), $tira($c['password'] ?? ''), [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
try { $pdo = $conectar(); $pdoB = $conectar(); }
catch (PDOException $e) { echo '[ERRO] repo-mysql: conexão recusada (código ' . $e->getCode() . ") — sem detalhe da credencial\n"; exit(1); }
$n0 = (int) $pdo->query('SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE()')->fetchColumn();
if ($n0 !== 0) { echo "[RECUSADO] repo-mysql: o banco $db não está vazio ($n0 tabelas) — use um banco de validação novo\n"; exit(3); }

$falhas = 0; $n = 0;
$ok = function (string $nome, bool|Closure $c, string $det = '') use (&$falhas, &$n): void {
    $n++; $msg = '';
    if ($c instanceof Closure) { try { $c = (bool) $c(); } catch (Throwable $t) { $c = false; $msg = ' (exceção: ' . get_class($t) . ' ' . $t->getMessage() . ')'; } }
    if (!$c) { $falhas++; echo "[ERRO] $nome$msg" . ($det !== '' ? "\n       $det" : '') . "\n"; }
};
$erro = function (callable $f): ?AtributosErro { try { $f(); } catch (AtributosErro $e) { return $e; } return null; };
foreach ($comandos as $st) $pdo->exec($st);
$migs = $pdo->query('SELECT version FROM eq_schema_migrations ORDER BY version')->fetchAll(PDO::FETCH_COLUMN);
$ok('todas as migrations aplicadas em ordem (eq_schema_migrations)', $migs === array_map(fn($a) => basename($a, '.sql'), $arqs));
$ok('FKs reais presentes (RESTRICT)', (int) $pdo->query('SELECT COUNT(*) FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE()')->fetchColumn() >= 8);
$ok('002 aplicada: autoridade e precifica_ref existem', (int) $pdo->query("SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'eq_atributo' AND COLUMN_NAME IN ('autoridade','precifica_ref')")->fetchColumn() === 2);

// ---- 1) massa dourada no SQL REAL (D4 + P1-07): o mesmo esperado do Node ---------------------------------------------------------------
[$fx, $shaOk] = golden_carregar();
$ok('massa dourada idêntica à do app (sha256)', $shaOk);
$cat = new CatalogoMemoria();
foreach ($fx['produtos'] as $p) $cat->p[$p['id']] = ['id' => $p['id'], 'nome' => "Produto {$p['id']} (sintético)", 'categoria' => $p['categoria'], 'subcategoria' => $p['subcategoria'], 'ativo' => true, 'excluido' => false, 'sincronizado_em' => null];
$ins = function (string $t, array $r) use ($pdo): void {
    $pdo->prepare("INSERT INTO `$t` (" . implode(', ', array_map(fn($k) => "`$k`", array_keys($r))) . ') VALUES (' . implode(', ', array_fill(0, count($r), '?')) . ')')->execute(array_values($r));
};
$uni = [];
foreach (array_unique(array_filter(array_column($fx['atributos'], 'unidade'))) as $s) { $ins('eq_unidade', ['simbolo' => $s, 'nome' => "unidade $s (sintética)"]); $uni[$s] = (int) $pdo->lastInsertId(); }
foreach ($fx['atributos'] as $a) $ins('eq_atributo', ['id' => $a['id'], 'codigo' => $a['codigo'], 'rotulo' => $a['rotulo'], 'tipo' => $a['tipo'], 'unidade_id' => $a['unidade'] ? $uni[$a['unidade']] : null, 'casas' => $a['casas'],
    'ativo' => $a['ativo'], 'autoridade' => $a['autoridade'], 'precifica_ref' => $a['autoridade'] === 'precifica' ? 'led_module.pitch' : null]);
foreach ($fx['grupos'] as $g) { $ins('eq_grupo', ['id' => $g['id'], 'nome' => $g['nome'], 'ativo' => $g['ativo']]); foreach ($g['escopos'] as $e) $ins('eq_grupo_escopo', ['grupo_id' => $g['id'], 'categoria' => $e['categoria'], 'subcategoria' => $e['subcategoria']]); }
foreach ($fx['itens'] as $i) $ins('eq_grupo_atributo', $i);
foreach ($fx['opcoes'] as $o) $ins('eq_opcao', $o);
foreach ($fx['valores'] as $v) $ins('eq_valor', ['product_id' => $v['product_id'], 'atributo_id' => $v['atributo_id'], 'opcao_id' => $v['opcao_id'], 'opcao_chave' => $v['opcao_chave'], 'valor_texto' => $v['valor_texto'],
    'valor_num' => $v['valor_num'], 'valor_bool' => $v['valor_bool'], 'valor_data' => $v['valor_data'], 'estado' => $v['estado'], 'origem' => 'manual', 'excluido_em' => $v['excluido'] ? '2026-11-03 00:00:00.000' : null]);
$repo = new AtributosRepoPdo($pdo, '');
$gold = new AtributosService($repo, 80, 'golden@exemplo.invalid', $cat);
foreach ($fx['esperado_ficha'] as $pid => $esp) {
    $got = golden_normalizar($gold->ficha((int) $pid, true));
    $ok("ATR-10 MySQL real, produto $pid: ficha = esperado (o mesmo do Node)", $got === $esp, 'diferença: ' . golden_diferencas($got, $esp));
}

// ---- 2) repositório e regras no banco real ------------------------------------------------------------------------------------------
$cat->p[7] = ['id' => 7, 'nome' => 'Módulo A (fictício)', 'categoria' => 'LED_PANEL', 'subcategoria' => 'LED_MODULE', 'ativo' => true, 'excluido' => false, 'sincronizado_em' => null];
$cat->p[8] = ['id' => 8, 'nome' => 'Módulo B (fictício)', 'categoria' => 'LED_PANEL', 'subcategoria' => 'LED_MODULE', 'ativo' => true, 'excluido' => false, 'sincronizado_em' => null];
$adm = new AtributosService($repo, 80, 'gestao@exemplo.invalid', $cat);
$ven = new AtributosService($repo, AtributosService::NIVEL_VALORES, 'vendedor@exemplo.invalid', $cat);
$repoB = new AtributosRepoPdo($pdoB, '');
$venB = new AtributosService($repoB, AtributosService::NIVEL_VALORES, 'outro-vendedor@exemplo.invalid', $cat);
$cmId = (int) array_column($adm->criarUnidade(['simbolo' => 'cm', 'nome' => 'centímetro', 'grandeza' => 'comprimento'])['unidades'], 'id', 'simbolo')['cm'];
$a = $adm->salvarAtributo(['rotulo' => 'Pitch', 'codigo' => 'pitch_mm', 'tipo' => 'numero', 'casas' => 2, 'unidade_id' => $cmId, 'minimo' => '0.5', 'maximo' => '20', 'descricao' => 'distância entre pixels'])['atributo'];
$ok('cria atributo (INSERT + lastInsertId) com limites DECIMAL', (int) $a['id'] > 0 && (int) $a['versao'] === 1 && $a['minimo'] === '0.500000');
$ok('edita com versão (UPDATE … WHERE versao)', fn() => (int) $adm->salvarAtributo(['id' => $a['id'], 'rotulo' => 'Pitch (cm)', 'versao' => 1])['atributo']['versao'] === 2);
$ok('versão antiga → conflito', fn() => $erro(fn() => $adm->salvarAtributo(['id' => $a['id'], 'rotulo' => 'X', 'versao' => 1]))?->codigo === 'CONFLICT');
$sel = $adm->salvarAtributo(['rotulo' => 'Selos', 'codigo' => 'selos_l3', 'tipo' => 'multiopcao'])['atributo'];
$adm->adicionarOpcao((int) $sel['id'], 'Indoor'); $ops = $adm->adicionarOpcao((int) $sel['id'], 'Outdoor')['opcoes'];
[$oA, $oB] = [(int) $ops[0]['id'], (int) $ops[1]['id']];
$grande = $adm->salvarAtributo(['rotulo' => 'Grande', 'codigo' => 'grande_l3', 'tipo' => 'numero'])['atributo'];
$data = $adm->salvarAtributo(['rotulo' => 'Data', 'codigo' => 'data_l3', 'tipo' => 'data'])['atributo'];
$modelo = $adm->salvarAtributo(['rotulo' => 'Modelo', 'codigo' => 'modelo_l3', 'tipo' => 'numero'])['atributo'];
$pot = $adm->salvarAtributo(['rotulo' => 'Potência', 'codigo' => 'potencia_l3', 'tipo' => 'numero'])['atributo'];
$adm->salvarGrupo(['nome' => 'Lote 3 (MySQL)', 'escopos' => [['categoria' => 'LED_PANEL', 'subcategoria' => '']], 'atributos' => array_map(fn($x) => ['atributo_id' => $x['id']], [$a, $sel, $grande, $data, $modelo, $pot])]);
$linha = function (int $pid, int $aid, int $k) use ($pdo): ?array {
    $st = $pdo->prepare('SELECT versao, excluido_em, estado, valor_num, valor_data FROM eq_valor WHERE product_id = ? AND atributo_id = ? AND opcao_chave = ?');
    $st->execute([$pid, $aid, $k]);
    return $st->fetch(PDO::FETCH_ASSOC) ?: null;
};
[$sid, $gid, $did, $mid, $pid8] = [(int) $sel['id'], (int) $grande['id'], (int) $data['id'], (int) $modelo['id'], (int) $pot['id']];

// P1-07 (multiopção, estado único) — ATR-04
// DSHOW-034: trocar o estado do CONJUNTO (multiopção) exige a versão do conjunto, lida antes (como a tela faz)
$conj = fn(int $pid, int $aid) => AtributosService::versaoConjunto($pdo->query("SELECT opcao_chave, versao, excluido_em FROM eq_valor WHERE product_id = $pid AND atributo_id = $aid")->fetchAll(PDO::FETCH_ASSOC));   // DSHOW-049: trilha
$ok('ATR-04 MySQL: marcar opção depois de "desconhecido" exclui logicamente a chave 0', function () use ($ven, $sid, $oA, $linha, $conj) {
    $ven->gravarValor(['product_id' => 7, 'atributo_id' => $sid, 'estado' => 'desconhecido', 'versao_conjunto' => $conj(7, $sid)]);
    $ven->gravarValor(['product_id' => 7, 'atributo_id' => $sid, 'valor' => $oA, 'versao_conjunto' => $conj(7, $sid)]);
    return $linha(7, $sid, 0)['excluido_em'] !== null && $linha(7, $sid, $oA)['excluido_em'] === null;
});
$ok('ATR-04 MySQL: remarcar a mesma opção é "sem mudança" (versão igual)', function () use ($ven, $sid, $oA, $linha) {
    $v0 = $linha(7, $sid, $oA)['versao']; $ven->gravarValor(['product_id' => 7, 'atributo_id' => $sid, 'valor' => $oA]); return $linha(7, $sid, $oA)['versao'] === $v0;
});
$ok('P1-07 MySQL: estado ≠ informado exclui logicamente as opções vivas', function () use ($ven, $sid, $oA, $oB, $linha, $conj) {
    $ven->gravarValor(['product_id' => 7, 'atributo_id' => $sid, 'valor' => $oB]);
    $ven->gravarValor(['product_id' => 7, 'atributo_id' => $sid, 'estado' => 'nao_se_aplica', 'versao_conjunto' => $conj(7, $sid)]);
    return $linha(7, $sid, $oA)['excluido_em'] !== null && $linha(7, $sid, $oB)['excluido_em'] !== null && $linha(7, $sid, 0)['estado'] === 'nao_se_aplica';
});
$ok('nada apagado: as 3 linhas continuam na tabela', fn() => (int) $pdo->query("SELECT COUNT(*) FROM eq_valor WHERE product_id = 7 AND atributo_id = $sid")->fetchColumn() === 3);

// 1062 → conflito (outra pessoa gravou primeiro)
$ok('1062 no INSERT → o repositório devolve false (conflito, não 500)', function () use ($ven, $repo, $gid) {
    $ven->gravarValor(['product_id' => 8, 'atributo_id' => $gid, 'valor' => '1']);
    return $repo->gravarValor(['product_id' => 8, 'atributo_id' => $gid, 'opcao_id' => null, 'opcao_chave' => 0, 'valor_texto' => null, 'valor_num' => '2', 'valor_bool' => null, 'valor_data' => null, 'estado' => 'informado', 'origem' => 'manual', 'atualizado_por' => 't'], null) === false;
});

// P1-09 com DUAS conexões (trava real; espera curta)
$pdo->exec('SET SESSION innodb_lock_wait_timeout = 1');
$pdoB->beginTransaction();
$pdoB->prepare("INSERT INTO eq_valor (product_id, atributo_id, opcao_chave, valor_num, estado, origem) VALUES (8, ?, 0, 5, 'informado', 'manual')")->execute([$pid8]);   // 1º valor, ainda sem COMMIT
$ok('ATR-06a MySQL: 1º valor em andamento noutra conexão → mudança de tipo NÃO passa (espera a trava → 409)', fn() => $erro(fn() => $adm->salvarAtributo(['id' => $pid8, 'tipo' => 'texto', 'versao' => 1]))?->http === 409
    && $pdo->query("SELECT tipo FROM eq_atributo WHERE id = $pid8")->fetchColumn() === 'numero');
$pdoB->commit();
$ok('ATR-06a MySQL: com o valor gravado, a mudança de tipo é bloqueada (TYPE_CHANGE_BLOCKED)', fn() => $erro(fn() => $adm->salvarAtributo(['id' => $pid8, 'tipo' => 'texto', 'versao' => 1]))?->codigo === 'TYPE_CHANGE_BLOCKED');
$pdoB->beginTransaction();
$pdoB->query("SELECT id FROM eq_atributo WHERE id = $mid FOR UPDATE")->fetchAll();   // outra conexão no meio de uma alteração da definição
$ok('ATR-06b MySQL: definição em alteração noutra conexão → gravar valor espera e devolve 409, sem gravar', fn() => $erro(fn() => $ven->gravarValor(['product_id' => 7, 'atributo_id' => $mid, 'valor' => '12']))?->http === 409
    && $linha(7, $mid, 0) === null);
$pdoB->rollBack();
$ok('ATR-06b MySQL: sem a outra alteração, o valor grava', fn() => $ven->gravarValor(['product_id' => 7, 'atributo_id' => $mid, 'valor' => '12'])['valor']['valor_num'] === '12.000000');
$pdo->exec('SET SESSION innodb_lock_wait_timeout = 50');

// ATR-07: dois operadores, duas conexões
$ok('ATR-07 MySQL: o 2º operador (outra conexão) com a versão que leu → 409', function () use ($ven, $venB, $mid, $linha, $erro) {
    $v0 = (int) $linha(7, $mid, 0)['versao'];
    $ven->gravarValor(['product_id' => 7, 'atributo_id' => $mid, 'valor' => '13', 'versao' => $v0]);
    return $erro(fn() => $venB->gravarValor(['product_id' => 7, 'atributo_id' => $mid, 'valor' => '14', 'versao' => $v0]))?->codigo === 'CONFLICT';
});

// P2-01 / P2-02 no banco real
$ok('P2-01 MySQL: decimal de 20 dígitos gravado e lido EXATO', function () use ($ven, $gid, $linha) {
    $ven->gravarValor(['product_id' => 7, 'atributo_id' => $gid, 'valor' => '12345678901234.123456']); return $linha(7, $gid, 0)['valor_num'] === '12345678901234.123456';
});
$ok('P2-01 MySQL: data real grava; 2026-02-31 → 422', function () use ($ven, $did, $linha, $erro) {
    $ven->gravarValor(['product_id' => 7, 'atributo_id' => $did, 'valor' => '2024-02-29']);
    return $linha(7, $did, 0)['valor_data'] === '2024-02-29' && $erro(fn() => $ven->gravarValor(['product_id' => 8, 'atributo_id' => $did, 'valor' => '2026-02-31']))?->http === 422;
});
$ok('ATR-08 / P2-02 MySQL: null explícito vira NULL no banco; o resto fica', function () use ($adm, $a, $pdo) {
    $va = (int) $pdo->query("SELECT versao FROM eq_atributo WHERE id = {$a['id']}")->fetchColumn();
    $adm->salvarAtributo(['id' => $a['id'], 'versao' => $va, 'casas' => null, 'minimo' => null, 'descricao' => null]);
    return (int) $pdo->query("SELECT (casas IS NULL AND minimo IS NULL AND descricao IS NULL AND maximo IS NOT NULL) FROM eq_atributo WHERE id = {$a['id']}")->fetchColumn() === 1;
});
$ok('auditoria gravada (toda escrita)', fn() => (int) $pdo->query('SELECT COUNT(*) FROM eq_auditoria')->fetchColumn() >= 15);

echo ($falhas ? '[ERRO]' : '[OK]  ') . " repo-mysql (equipamentos/atributos, MySQL real em $db, migrations " . implode(',', array_map(fn($x) => substr(basename($x), 0, 3), $arqs)) . "): $n casos, $falhas falha(s)\n";
exit($falhas ? 1 : 0);
