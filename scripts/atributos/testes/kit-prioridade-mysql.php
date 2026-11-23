<?php
// Produtos & Atributos — P1 "precedência de kit independente do nome" (18/11): migração 012_kit_prioridade + regra nova em BANCO REAL.
// Prova: (1) sem a coluna (012 não aplicada) a regra antiga vale, sem erro; (2) a 012 pelo EXECUTOR oficial é idempotente (2×), preenche
// prioridade = posição antiga (nome, id) do MySQL (colação ai_ci, com acento/caixa), não mexe em versao/atualizado_em; (3) a ficha efetiva
// (kit dono, posição, importância, unidade do kit → unidade efetiva D3) é IDÊNTICA antes/depois, também pela ferramenta de prova;
// (4) renomear um kit não muda mais a ficha; (5) kit novo entra no FIM; kit inserido sem prioridade (código anterior) vai para o fim;
// (6) revert (só validação) volta à regra antiga sem erro; (7) coluna presente e toda NULL (interrupção entre o ALTER e o UPDATE) = regra
// antiga; o executor recusa aplicar e recusa --registrar-se-completo (há comando de dados); recuperação = DROP da coluna + executor.
// Num schema ATRWEB_VAL_T_7/_8/_9 VAZIO. Entradas: EQ_TEST_CNF (arquivo de opções [client], 600) e EQ_TEST_DB. Catálogo: tabela
// product_catalog criada no próprio schema (como o retrato C1 da validação), usada pela ferramenta de prova.
// Saída: 0 verde · 1 falha · 2 não executado · 3 recusado.
declare(strict_types=1);
require_once __DIR__ . '/../../../api/atributos/AtributosRepo.php';
require_once __DIR__ . '/../../../api/atributos/KitsService.php';
require_once __DIR__ . '/_memoria.php';

[$cnf, $db] = [(string) (getenv('EQ_TEST_CNF') ?: ''), (string) (getenv('EQ_TEST_DB') ?: '')];
$raiz = realpath(__DIR__ . '/../../..');
$dir = "$raiz/db/equipamentos/migrations";
if ($cnf === '' || $db === '' || !is_readable($cnf)) { echo "[NÃO EXECUTADO] kit-prioridade-mysql: faltam EQ_TEST_CNF/EQ_TEST_DB\n"; exit(2); }
if (!in_array($db, ['ATRWEB_VAL_T_7', 'ATRWEB_VAL_T_8', 'ATRWEB_VAL_T_9'], true)) { echo "[RECUSADO] kit-prioridade-mysql: só ATRWEB_VAL_T_7, _T_8 ou _T_9\n"; exit(3); }
if (!is_file("$dir/012_kit_prioridade.sql")) { echo "[NÃO EXECUTADO] kit-prioridade-mysql: este código não tem a 012_kit_prioridade.sql\n"; exit(2); }

$ini = parse_ini_file($cnf, true, INI_SCANNER_RAW) ?: []; $c = $ini['client'] ?? [];
$tira = fn($v) => trim((string) $v, " \t\"'");
$dsn = 'mysql:' . (isset($c['socket']) ? 'unix_socket=' . $tira($c['socket']) : 'host=' . $tira($c['host'] ?? '127.0.0.1') . ';port=' . (int) ($c['port'] ?? 3306)) . ";dbname=$db;charset=utf8mb4";
try { $pdo = new PDO($dsn, $tira($c['user'] ?? ''), $tira($c['password'] ?? ''), [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]); }
catch (PDOException $e) { echo '[ERRO] kit-prioridade-mysql: conexão recusada (código ' . $e->getCode() . ")\n"; exit(1); }
if ((string) $pdo->query('SELECT DATABASE()')->fetchColumn() !== $db) { echo "[RECUSADO] kit-prioridade-mysql: a conexão não está em $db\n"; exit(3); }
if ((int) $pdo->query('SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE()')->fetchColumn() !== 0) { echo "[RECUSADO] kit-prioridade-mysql: $db não está vazio\n"; exit(3); }

$falhas = 0; $n = 0;
$ok = function (string $nome, bool|Closure $cond, string $det = '') use (&$falhas, &$n): void {
    $n++; $msg = '';
    if ($cond instanceof Closure) { try { $cond = (bool) $cond(); } catch (Throwable $t) { $cond = false; $msg = ' (exceção: ' . get_class($t) . ' ' . $t->getMessage() . ')'; } }
    if (!$cond) { $falhas++; echo "[ERRO] $nome$msg" . ($det !== '' ? "\n       $det" : '') . "\n"; }
};
$um = function (string $sql, array $p = []) use ($pdo) { $s = $pdo->prepare($sql); $s->execute($p); return $s->fetchColumn(); };
$todas = function (string $sql, array $p = []) use ($pdo) { $s = $pdo->prepare($sql); $s->execute($p); return $s->fetchAll(PDO::FETCH_ASSOC); };
$sh = function (array $args) use ($cnf, $raiz): array {
    $cmd = implode(' ', array_map('escapeshellarg', $args)) . ' 2>&1';
    exec($cmd, $out, $rc);
    return [$rc, implode("\n", $out)];
};
$migrar = fn(string ...$extra) => $sh(array_merge([PHP_BINARY, "$raiz/tools/db/equipamentos-migrar.php", '--schema', $db, '--credenciais', $cnf], $extra));
$prova = fn() => $sh([PHP_BINARY, "$raiz/scripts/atributos/kit-prioridade-prova.php", '--schema', $db, '--credenciais', $cnf, '--json']);
$resMigrar = function (string $saida): ?array { return preg_match('/^MIGRAR_OK (.+)$/m', $saida, $m) ? json_decode($m[1], true) : null; };

// ---- 001–011 pelo carregador dos testes (sem a 012), como os demais *-mysql.php ------------------------------------------------------
$arqs = array_values(array_filter(glob("$dir/[0-9][0-9][0-9]_*.sql") ?: [], static fn($f) => !str_ends_with($f, '.revert.sql') && !str_contains(basename($f), '012_kit_prioridade'))); sort($arqs, SORT_STRING);
foreach ($arqs as $arq) foreach (preg_split('/;\s*\n/', (string) preg_replace('/^--.*$/m', '', (string) file_get_contents($arq))) ?: [] as $st) {
    $st = trim($st); if ($st === '') continue;
    if (!preg_match('/^(CREATE TABLE IF NOT EXISTS|ALTER TABLE|INSERT (IGNORE )?INTO|UPDATE) `eq_[a-z_]+`/i', $st)) { echo '[RECUSADO] kit-prioridade-mysql: comando fora da lista em ' . basename($arq) . "\n"; exit(3); }
    $pdo->exec(rtrim($st, ';'));
}
$pdo->exec('CREATE TABLE `product_catalog` (`id` INT UNSIGNED NOT NULL PRIMARY KEY, `name` VARCHAR(120) NOT NULL, `category` VARCHAR(40) NOT NULL, `subcategory` VARCHAR(60) NULL,
    `active` TINYINT(1) NOT NULL DEFAULT 1, `deleted` TINYINT(1) NOT NULL DEFAULT 0) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci');

// ---- massa: 2 unidades da mesma grandeza; A1 numérico em VÁRIOS kits com unidade/posição/importância diferentes (quem vence decide) -------
$pdo->exec("INSERT INTO eq_unidade (simbolo, nome, grandeza) VALUES ('mm', 'milímetro', 'comprimento'), ('cm', 'centímetro', 'comprimento')");
[$mm, $cm] = array_map('intval', array_column($todas('SELECT id FROM eq_unidade ORDER BY id'), 'id'));
$pdo->prepare("INSERT INTO eq_atributo (codigo, rotulo, tipo, unidade_id) VALUES ('largura', 'Largura', 'numero', ?), ('cor', 'Cor', 'texto', NULL), ('peso', 'Peso', 'numero', NULL)")->execute([$mm]);
[$A1, $A2, $A3] = array_map('intval', array_column($todas('SELECT id FROM eq_atributo ORDER BY id'), 'id'));
$pdo->exec("INSERT INTO product_catalog (id, name, category, subcategory, active, deleted) VALUES (101, 'Painel 1', 'LED_PANEL', 'INDOOR', 1, 0), (102, 'Painel 2', 'LED_PANEL', NULL, 1, 0),
    (103, 'Outro', 'OUTRO', NULL, 1, 0), (104, 'Painel inativo', 'LED_PANEL', 'INDOOR', 0, 0)");
$cat = new CatalogoMemoria();
$kitsSvc = fn() => new KitsService(new AtributosRepoPdo($pdo, ''), 80, 'admin@exemplo.invalid', $cat);
$criarKit = function (string $nome, array $escopos, array $itens, bool $todos = false) use ($kitsSvc): int {
    $s = $kitsSvc();
    $k = $s->salvarKit(['nome' => $nome] + ($todos ? ['aplica_a_todos' => 1] : []))['kit'];
    if ($escopos) $k = $s->definirEscopos(['id' => $k['id'], 'versao' => $k['versao'], 'escopos' => $escopos])['kit'];
    $k = $s->definirItens(['id' => $k['id'], 'versao' => $k['versao'], 'itens' => $itens])['kit'];
    return (int) $k['id'];
};
$led = [['categoria' => 'LED_PANEL', 'subcategoria' => '']];
// nomes com caixa/acento: a ordem antiga é a da colação utf8mb4_0900_ai_ci (álamo < Alfa < beta < Ébano < Zeta), não a do strcmp
$kZeta  = $criarKit('Zeta', $led, [['atributo_id' => $A1, 'posicao' => 1, 'unidade_id' => $cm, 'importancia' => 'basico'], ['atributo_id' => $A2, 'posicao' => 2]]);
$kAlfa  = $criarKit('Alfa', $led, [['atributo_id' => $A1, 'posicao' => 5, 'unidade_id' => $mm, 'importancia' => 'importante'], ['atributo_id' => $A3, 'posicao' => 1, 'obrigatorio' => 1]]);
$kBeta  = $criarKit('beta', [], [['atributo_id' => $A2, 'posicao' => 1, 'importancia' => 'complementar']], true);
$kEbano = $criarKit('Ébano', [['categoria' => 'LED_PANEL', 'subcategoria' => 'INDOOR']], [['atributo_id' => $A3, 'posicao' => 7, 'importancia' => 'opcional']]);
$kAlamo = $criarKit('álamo', [['categoria' => 'LED_PANEL', 'subcategoria' => 'INDOOR']], [['atributo_id' => $A1, 'posicao' => 9, 'unidade_id' => $cm, 'importancia' => 'opcional']]);
$pdo->prepare("INSERT INTO eq_valor (product_id, atributo_id, opcao_id, opcao_chave, valor_num, estado, origem, atualizado_por) VALUES (101, ?, NULL, 0, 10, 'informado', 'manual', 't')")->execute([$A1]);

$produtos = [];
foreach ($todas('SELECT id, category, subcategory, active FROM product_catalog WHERE deleted = 0 ORDER BY id') as $p)
    $produtos[(int) $p['id']] = ['id' => (int) $p['id'], 'categoria' => $p['category'], 'subcategoria' => $p['subcategory'], 'ativo' => (int) $p['active'] === 1];
/** ficha efetiva comparável de todos os produtos, lida por um repositório NOVO (sem cache da coluna) */
$fichas = function () use ($pdo, $produtos): array {
    $m = (new AtributosRepoPdo($pdo, ''))->retratoModelo(null); $out = [];
    foreach ($produtos as $pid => $p) {
        $excl = []; $f = Aplicabilidade::ficha($m, $p, $excl);
        $out[$pid]['kits'] = array_keys(Aplicabilidade::kits($m, $p));
        foreach ($f as $aid => $it) $out[$pid]['atributos'][$aid] = [$it['grupo_id'], $it['posicao'], $it['obrigatorio'], $it['visivel'], $it['destaque'], $it['importancia'],
            $it['unidade_kit_id'], $it['unidade_produto_id'], Aplicabilidade::unidadeEfetiva($it, null), array_map(static fn($o) => [$o['tipo'], $o['grupo_id'] ?? null], $it['origens'])];
    }
    return $out;
};
$temColuna = fn() => (bool) $todas("SHOW COLUMNS FROM eq_grupo LIKE 'prioridade'");

// ================================= (1) LEGADO: sem a coluna, regra antiga (nome, id) — sem erro ===========================================
$ok('pré: coluna prioridade ausente', !$temColuna());
$ok('legado: temPrioridadeKit() = false sem erro', fn() => (new AtributosRepoPdo($pdo, ''))->temPrioridadeKit() === false);
$f0 = $fichas();
$ok('legado: ordem dos kits do 101 = colação (álamo, Alfa, beta, Ébano, Zeta)', $f0[101]['kits'] === [$kAlamo, $kAlfa, $kBeta, $kEbano, $kZeta], json_encode($f0[101]['kits']));
$ok('legado: A1 do 101 vem de álamo (unidade cm, posição 9, opcional)', ($f0[101]['atributos'][$A1] ?? [])[0] === $kAlamo && $f0[101]['atributos'][$A1][6] === $cm && $f0[101]['atributos'][$A1][1] === 9);
$ok('legado: A1 do 102 (sem INDOOR) vem de Alfa (mm, importante)', ($f0[102]['atributos'][$A1] ?? [])[0] === $kAlfa && $f0[102]['atributos'][$A1][5] === 'importante' && $f0[102]['atributos'][$A1][8] === $mm);
$ok('legado: 103 só recebe beta', $f0[103]['kits'] === [$kBeta]);
[$rc, $o] = $prova();
$j = json_decode($o, true);
$ok('prova antes da 012: exit 0, simulada, 4 produtos, 3 ativos, 0 diferenças', $rc === 0 && str_starts_with((string) ($j['fonte_prioridade'] ?? ''), 'simulada') && ($j['produtos'] ?? 0) === 4 && ($j['ativos'] ?? 0) === 3 && ($j['diferentes'] ?? -1) === 0, $o);

// ================================= (2) 012 pelo executor: 1ª aplica, 2ª não faz nada ======================================================
$antesG = $todas('SELECT id, versao, atualizado_em FROM eq_grupo ORDER BY id');
$posAntiga = array_map('intval', array_column($todas('SELECT id FROM eq_grupo ORDER BY nome, id'), 'id'));
usleep(20000);
[$rc, $o] = $migrar(); $r = $resMigrar($o);
$ok('executor 1ª: aplica só a 012', $rc === 0 && ($r['aplicadas'] ?? null) === ['012_kit_prioridade'], $o);
[$rc, $o] = $migrar(); $r = $resMigrar($o);
$ok('executor 2ª: aplicadas=0 e 012 conferida (idempotente)', $rc === 0 && ($r['aplicadas'] ?? null) === [] && in_array('012_kit_prioridade', $r['conferidas'] ?? [], true), $o);
[$rc, $o] = $migrar('--verificar');
$ok('executor --verificar: PREFLIGHT_OK com 012 ok', $rc === 0 && str_contains($o, 'PREFLIGHT_OK') && preg_match('/012_kit_prioridade\s+ledger=sim estado=ok/', $o) === 1, $o);
$ok('ledger: 012 com sha256 do arquivo', $um("SELECT checksum FROM eq_schema_migrations WHERE version = '012_kit_prioridade'") === hash_file('sha256', "$dir/012_kit_prioridade.sql"));
$ok('coluna criada NULL-ável (rollback de código insere sem ela)', $um("SELECT IS_NULLABLE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'eq_grupo' AND COLUMN_NAME = 'prioridade'") === 'YES');
$prio = array_map('intval', array_column($todas('SELECT id FROM eq_grupo ORDER BY prioridade, id'), 'id'));
$ok('preenchimento = ordem antiga (nome, id) do MySQL, 1..N sem buraco', $prio === $posAntiga && array_map('intval', array_column($todas('SELECT prioridade FROM eq_grupo ORDER BY prioridade'), 'prioridade')) === range(1, count($posAntiga)), json_encode([$prio, $posAntiga]));
$ok('preenchimento = ordem_nome + 1 do retrato (a mesma posição que o código usava)', (function () use ($pdo) { foreach ((new AtributosRepoPdo($pdo, ''))->retratoModelo()->grupos as $g) if ((int) $g['prioridade'] !== $g['ordem_nome'] + 1) return false; return true; })());
$ok('migração não mexe em versao nem atualizado_em', $todas('SELECT id, versao, atualizado_em FROM eq_grupo ORDER BY id') === $antesG);

// ================================= (3) ficha efetiva idêntica antes/depois =================================================================
$f1 = $fichas();
$ok('ficha efetiva de todos os produtos idêntica antes/depois da 012', $f1 === $f0, json_encode([$f0, $f1]));
[$rc, $o] = $prova(); $j = json_decode($o, true);
$ok('prova depois da 012: exit 0, fonte = coluna, 0 diferenças', $rc === 0 && str_starts_with((string) ($j['fonte_prioridade'] ?? ''), 'coluna') && ($j['diferentes'] ?? -1) === 0 && ($j['kits_sem_prioridade'] ?? -1) === 0, $o);

// ================================= (4) renomear não muda mais a ficha =====================================================================
$s = $kitsSvc(); $g = (new AtributosRepoPdo($pdo, ''))->grupo($kAlamo);
$s->salvarKit(['id' => $kAlamo, 'versao' => (int) $g['versao'], 'nome' => 'Zzz último na ordem alfabética']);
$g = (new AtributosRepoPdo($pdo, ''))->grupo($kZeta);
$kitsSvc()->salvarKit(['id' => $kZeta, 'versao' => (int) $g['versao'], 'nome' => 'Aaa primeiro na ordem alfabética']);
$f2 = $fichas();
$ok('renomear álamo→Zzz e Zeta→Aaa: ficha efetiva IDÊNTICA', $f2 === $f0, json_encode([$f0[101], $f2[101]]));
$ok('… A1 do 101 continua de álamo/Zzz com unidade cm', ($f2[101]['atributos'][$A1] ?? [])[0] === $kAlamo && $f2[101]['atributos'][$A1][8] === $cm);
[$rc, $o] = $prova(); $j = json_decode($o, true);
$ok('prova acusa (exit 1) que a regra ANTIGA teria mudado a ficha após o renome (a ferramenta detecta diferença)', $rc === 1 && ($j['diferentes'] ?? 0) >= 2, $o);

// ================================= (5) kit novo no fim; kit sem prioridade (código anterior) no fim =======================================
$maxAntes = (int) $um('SELECT MAX(prioridade) FROM eq_grupo');
$kNovo = $criarKit('AAAA novo com nome que viria primeiro', $led, [['atributo_id' => $A1, 'posicao' => 0, 'unidade_id' => $mm, 'importancia' => 'obrigatorio']]);
$ok('kit novo recebe prioridade = MAX + 1', (int) $um('SELECT prioridade FROM eq_grupo WHERE id = ?', [$kNovo]) === $maxAntes + 1);
$f3 = $fichas();
$ok('kit novo entra por ÚLTIMO na ordem dos kits do 101', end($f3[101]['kits']) === $kNovo);
$ok('kit novo não muda dono/posição/importância/unidades de A1 (101 e 102)', array_slice($f3[101]['atributos'][$A1], 0, 9) === array_slice($f0[101]['atributos'][$A1], 0, 9) && array_slice($f3[102]['atributos'][$A1], 0, 9) === array_slice($f0[102]['atributos'][$A1], 0, 9));
$ok('… e A1 ganha a origem do kit novo por último', end($f3[101]['atributos'][$A1][9]) === ['kit', $kNovo]);
$pdo->exec("INSERT INTO eq_grupo (nome, aplica_a_todos) VALUES ('000 inserido pelo código anterior', 1)");   // rollback de código: INSERT sem prioridade
$kVelho = (int) $pdo->lastInsertId();
$pdo->prepare('INSERT INTO eq_grupo_atributo (grupo_id, atributo_id, posicao, unidade_id) VALUES (?, ?, 0, ?)')->execute([$kVelho, $A1, $mm]);
$f4 = $fichas();
$ok('kit sem prioridade (NULL) fica depois de todos os que têm', end($f4[101]['kits']) === $kVelho && end($f4[103]['kits']) === $kVelho);
$ok('… sem mudar o dono de A1', $f4[101]['atributos'][$A1][0] === $kAlamo && $f4[103]['atributos'][$A1][0] === $kVelho);
$ok('kit criado depois (com a coluna) vai depois do que tem NULL? não — NULL sempre por último', (function () use ($criarKit, $fichas, $kVelho, $led, $A2) { $k = $criarKit('Mais um', $led, [['atributo_id' => $A2, 'posicao' => 3]]); $f = $fichas(); $ks = $f[101]['kits']; return end($ks) === $kVelho && $ks[count($ks) - 2] === $k; })());
$ok('repo grupos(): campo prioridade exposto (aditivo)', (function () use ($pdo) { $g = (new AtributosRepoPdo($pdo, ''))->grupos(); return array_key_exists('prioridade', $g[0]); })());

// ================================= (6) revert (só validação) → regra antiga sem erro; reaplicar preenche de novo ============================
[$rc, $o] = $migrar('--reverter', '012_kit_prioridade');
$ok('executor --reverter 012: ok', $rc === 0, $o);
$ok('revert: coluna removida e ledger marcado _revertida_', !$temColuna() && (int) $um("SELECT COUNT(*) FROM eq_schema_migrations WHERE version LIKE '012_revertida_%'") === 1 && (int) $um("SELECT COUNT(*) FROM eq_schema_migrations WHERE version = '012_kit_prioridade'") === 0);
$f5 = $fichas();
$ok('sem a coluna (revertida): volta a regra antiga sem erro — A1 do 101 agora do 1º por nome ("000 inserido…")', ($f5[101]['atributos'][$A1] ?? [])[0] === $kVelho);
$ok('… e o kit criado sem a coluna ganha posição por nome (legado)', fn() => $kitsSvc()->salvarKit(['nome' => 'kit sem coluna'])['kit']['id'] > 0 && !array_key_exists('prioridade', (new AtributosRepoPdo($pdo, ''))->grupos()[0]));

// (7) interrupção entre o ALTER e o UPDATE: coluna presente e toda NULL = regra antiga; executor recusa; recuperação documentada
$pdo->exec("ALTER TABLE `eq_grupo` ADD COLUMN `prioridade` INT UNSIGNED NULL AFTER `ordem`");
$f6 = $fichas();
$ok('coluna toda NULL (interrupção): ficha = regra antiga, idêntica à da coluna ausente', $f6 === $f5, json_encode([$f5[101], $f6[101]]));
[$rc, $o] = $migrar();
$ok('executor recusa a 012 "completa sem ledger" (nenhum DDL)', $rc !== 0 && str_contains($o, 'preflight recusou') && str_contains($o, '012_kit_prioridade'), $o);
$upd = (function () use ($dir) { foreach (Migrador_comandos((string) file_get_contents("$dir/012_kit_prioridade.sql")) as $c) if (str_starts_with($c, 'UPDATE `eq_grupo`')) return $c; return null; })();
$ok('recuperação: o UPDATE da 012 é repetível (roda 2×)', $upd !== null && $pdo->exec($upd) >= 0 && $pdo->exec($upd) === 0);
[$rc, $o] = $migrar('--registrar-se-completo', '012_kit_prioridade');
$ok('executor recusa --registrar-se-completo na 012 (tem comando de dados — nada de registrar às cegas)', $rc !== 0 && str_contains($o, 'comandos de dados'), $o);
// recuperação documentada no portão: desfazer a parte aplicada (1º comando do .revert.sql) e rodar o executor de novo
$pdo->exec('ALTER TABLE `eq_grupo` DROP COLUMN `prioridade`');
[$rc, $o] = $migrar(); $r = $resMigrar($o);
$ok('recuperação: DROP da coluna parcial + executor → aplica a 012 inteira', $rc === 0 && ($r['aplicadas'] ?? null) === ['012_kit_prioridade'], $o);
$prio = array_map('intval', array_column($todas('SELECT id FROM eq_grupo ORDER BY prioridade, id'), 'id'));
$ok('reaplicada: preenchimento = ordem (nome, id) atual', $prio === array_map('intval', array_column($todas('SELECT id FROM eq_grupo ORDER BY nome, id'), 'id')));
$ok('reaplicada: ficha idêntica à regra antiga daquele momento', $fichas() === $f6);
[$rc, $o] = $migrar(); $r = $resMigrar($o);
$ok('executor de novo: aplicadas=0', $rc === 0 && ($r['aplicadas'] ?? null) === [], $o);

// ---- unidade pura: compararKits é ordem total (com e sem prioridade, com ordem_nome e em memória) ------------------------------------------
$ks = [['id' => 1, 'nome' => 'b', 'prioridade' => 2], ['id' => 2, 'nome' => 'a', 'prioridade' => 1], ['id' => 3, 'nome' => 'c', 'prioridade' => 1], ['id' => 4, 'nome' => 'a', 'prioridade' => null], ['id' => 5, 'nome' => '0']];
usort($ks, [Aplicabilidade::class, 'compararKits']);
$ok('compararKits: prioridade, desempate id, depois sem prioridade por (nome, id)', array_column($ks, 'id') === [2, 3, 1, 5, 4], json_encode(array_column($ks, 'id')));
$ks = [['id' => 1, 'nome' => 'b', 'ordem_nome' => 0], ['id' => 2, 'nome' => 'a', 'ordem_nome' => 1]];
usort($ks, [Aplicabilidade::class, 'compararKits']);
$ok('compararKits: sem prioridade, ordem_nome manda (regra antiga DSHOW-035)', array_column($ks, 'id') === [1, 2]);

echo $falhas === 0 ? "[OK] kit-prioridade-mysql: $n casos, 0 falhas ($db)\n" : "[FALHOU] kit-prioridade-mysql: $falhas de $n casos\n";
exit($falhas === 0 ? 0 : 1);

/** Mesmo divisor de comandos do executor (sem carregar o CLI dele). */
function Migrador_comandos(string $sql): array
{
    $out = [];
    foreach (preg_split('/;\s*\n/', (string) preg_replace('/^--.*$/m', '', $sql)) ?: [] as $st) { $st = trim($st); if ($st !== '') $out[] = rtrim($st, ';'); }
    return $out;
}
