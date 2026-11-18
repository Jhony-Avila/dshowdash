<?php
// Produtos & Atributos — HOTFIX-3 (18/11): Codex DSHOW-089 (409 FALSO no DSHOW-071). Teste de BANCO REAL do que o servidor PERSISTE e AUDITA
// quando o fator da unidade tem mais casas do que eq_unidade.fator_base (DECIMAL(30,12)) guarda: o serviço canonicaliza em decimal EXATO,
// aceita zeros finais excedentes, recusa (422 fator_base) o que o banco teria de arredondar — antes da trava, da gravação e da auditoria —
// e a repetição do mesmo envelope é "sem mudança" (nunca 409). Inclui a concorrência genuína (409) com DUAS conexões (molde do modulo-mysql).
// Num schema ATRWEB_VAL_T_7/_8/_9 VAZIO com as migrações 001–010 aplicadas (molde e recusas do modulo-mysql.php). Catálogo falso em memória.
// Entradas: EQ_TEST_CNF (arquivo de opções [client]) e EQ_TEST_DB ∈ {ATRWEB_VAL_T_7, ATRWEB_VAL_T_8, ATRWEB_VAL_T_9}, vazio.
// Saída: 0 verde · 1 falha · 2 não executado · 3 recusado.
declare(strict_types=1);
require_once __DIR__ . '/../../../api/atributos/AtributosRepo.php';
require_once __DIR__ . '/../../../api/atributos/KitsService.php';
require_once __DIR__ . '/../../../api/atributos/Permissoes.php';
require_once __DIR__ . '/_memoria.php';

[$cnf, $db] = [(string) (getenv('EQ_TEST_CNF') ?: ''), (string) (getenv('EQ_TEST_DB') ?: '')];
$dir = __DIR__ . '/../../../db/equipamentos/migrations';
if ($cnf === '' || $db === '' || !is_readable($cnf)) { echo "[NÃO EXECUTADO] hotfix3-mysql: faltam EQ_TEST_CNF/EQ_TEST_DB\n"; exit(2); }
if (!preg_match('/^ATRWEB_VAL_T_[A-Za-z0-9_]{1,40}$/', $db)) { echo "[RECUSADO] hotfix3-mysql: EQ_TEST_DB precisa ser ATRWEB_VAL_T_*\n"; exit(3); }
if (!in_array($db, ['ATRWEB_VAL_T_7', 'ATRWEB_VAL_T_8', 'ATRWEB_VAL_T_9'], true)) { echo "[RECUSADO] hotfix3-mysql: só ATRWEB_VAL_T_7, _T_8 ou _T_9\n"; exit(3); }

$ini = parse_ini_file($cnf, true, INI_SCANNER_RAW) ?: []; $c = $ini['client'] ?? [];
$tira = fn($v) => trim((string) $v, " \t\"'");
$dsn = 'mysql:' . (isset($c['socket']) ? 'unix_socket=' . $tira($c['socket']) : 'host=' . $tira($c['host'] ?? '127.0.0.1') . ';port=' . (int) ($c['port'] ?? 3306)) . ";dbname=$db;charset=utf8mb4";
$conectar = function () use ($dsn, $c, $tira): PDO { return new PDO($dsn, $tira($c['user'] ?? ''), $tira($c['password'] ?? ''), [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]); };
try { $pdo = $conectar(); }
catch (PDOException $e) { echo '[ERRO] hotfix3-mysql: conexão recusada (código ' . $e->getCode() . ")\n"; exit(1); }
if ((string) $pdo->query('SELECT DATABASE()')->fetchColumn() !== $db) { echo "[RECUSADO] hotfix3-mysql: a conexão não está em $db\n"; exit(3); }
if ((int) $pdo->query('SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE()')->fetchColumn() !== 0) { echo "[RECUSADO] hotfix3-mysql: $db não está vazio\n"; exit(3); }

$arqs = array_values(array_filter(glob("$dir/[0-9][0-9][0-9]_*.sql") ?: [], static fn($f) => !str_ends_with($f, '.revert.sql'))); sort($arqs, SORT_STRING);
foreach ($arqs as $arq) foreach (preg_split('/;\s*\n/', (string) preg_replace('/^--.*$/m', '', (string) file_get_contents($arq))) ?: [] as $st) {
    $st = trim($st); if ($st === '') continue;
    if (!preg_match('/^(CREATE TABLE IF NOT EXISTS|ALTER TABLE|INSERT (IGNORE )?INTO|UPDATE) `eq_[a-z_]+`/i', $st)) { echo '[RECUSADO] hotfix3-mysql: comando fora da lista em ' . basename($arq) . "\n"; exit(3); }
    $pdo->exec(rtrim($st, ';'));
}

$falhas = 0; $n = 0;
$ok = function (string $nome, bool|Closure $cond, string $det = '') use (&$falhas, &$n): void {
    $n++; $msg = '';
    if ($cond instanceof Closure) { try { $cond = (bool) $cond(); } catch (Throwable $t) { $cond = false; $msg = ' (exceção: ' . get_class($t) . ' ' . $t->getMessage() . ')'; } }
    if (!$cond) { $falhas++; echo "[ERRO] $nome$msg" . ($det !== '' ? "\n       $det" : '') . "\n"; }
};
$erro = function (callable $f): ?AtributosErro { try { $f(); } catch (AtributosErro $e) { return $e; } return null; };
$um = fn(string $sql, array $p = []) => (function () use ($pdo, $sql, $p) { $s = $pdo->prepare($sql); $s->execute($p); return $s->fetchColumn(); })();
$linha = fn(string $sql, array $p = []) => (function () use ($pdo, $sql, $p) { $s = $pdo->prepare($sql); $s->execute($p); return $s->fetch(PDO::FETCH_ASSOC); })();
$audit = fn(string $ent, string $eid, ?string $acao = null) => (int) $um('SELECT COUNT(*) FROM eq_auditoria WHERE entidade = ? AND entidade_id = ?' . ($acao ? ' AND acao = ?' : ''), $acao ? [$ent, $eid, $acao] : [$ent, $eid]);
$auditTotal = fn() => (int) $um('SELECT COUNT(*) FROM eq_auditoria');

$ok('migrações 001–010 aplicadas', (int) $um('SELECT COUNT(*) FROM eq_schema_migrations') === count($arqs));

// ---- catálogo falso (não usado pelas unidades, exigido pelo serviço) ----------------------------------------------------------------------
$cat = new CatalogoMemoria();
$repo = new AtributosRepoPdo($pdo, '');
$adm = new AtributosService($repo, 80, 'admin@exemplo.invalid', $cat);

$uRow = fn(int $id) => $linha('SELECT nome, grandeza, fator_base FROM eq_unidade WHERE id = ?', [$id]);
$ultDepois = fn(int $id) => json_decode((string) $um("SELECT depois FROM eq_auditoria WHERE entidade = 'unidade' AND entidade_id = ? ORDER BY id DESC LIMIT 1", [(string) $id]), true);
$audU = fn(int $id) => $audit('unidade', (string) $id);
$tenta = function (callable $f) { try { return $f(); } catch (AtributosErro $e) { return ['erro' => $e->http . ' ' . $e->getMessage()]; } };   // contraprova: o código antigo pode recusar sem derrubar a suíte
$pad = fn(string $e) => explode('.', $e . '.')[0] . '.' . str_pad(explode('.', $e . '.')[1], 12, '0');   // forma em que o banco devolve DECIMAL(30,12)
$msg13 = 'O fator aceita no máximo 12 casas decimais; 0,1234567890124 não pode ser gravado sem arredondar.';

// =========================================================================================================================================
// CRIAR UNIDADE — mesma regra do fator
// =========================================================================================================================================
$tot0 = $auditTotal();
$eC = $erro(fn() => $adm->criarUnidade(['simbolo' => 'u13', 'nome' => 'treze casas', 'grandeza' => 'teste', 'fator_base' => '0.1234567890124']));
$ok('089 criar: 0.1234567890124 → 422 campo fator_base com a mensagem clara', $eC?->http === 422 && $eC->campos === ['fator_base'] && $eC->getMessage() === $msg13, $eC ? $eC->getMessage() . ' ' . json_encode($eC->campos) : 'sem erro');
$ok('089 criar: 422 sem linha em eq_unidade e sem auditoria', (int) $um("SELECT COUNT(*) FROM eq_unidade WHERE simbolo = 'u13'") === 0 && $auditTotal() === $tot0);
$rC = $tenta(fn() => $adm->criarUnidade(['simbolo' => 'u12', 'nome' => 'doze casas', 'grandeza' => 'teste', 'fator_base' => '0.1234567890120']));
$c12 = (int) $rC['id'];
$ok('089 criar: 0.1234567890120 (zero final excedente) → grava EXATO 0.123456789012', (string) $uRow($c12)['fator_base'] === '0.123456789012', json_encode($uRow($c12)));
$ok('089 criar: auditoria "criar" com o fator canônico 0.123456789012', $audit('unidade', (string) $c12, 'criar') === 1 && ($ultDepois($c12)['fator_base'] ?? null) === '0.123456789012', json_encode($ultDepois($c12)));
$rC2 = $tenta(fn() => $adm->criarUnidade(['simbolo' => 'u12', 'nome' => 'doze casas', 'grandeza' => 'teste', 'fator_base' => '0.1234567890120']));
$ok('089 criar: repetir o envelope → ja_existia, sem auditoria nova', !empty($rC2['ja_existia']) && $audU($c12) === 1);
$tot1 = $auditTotal();
$lim = [
    ['zero', '0', 'fator_base'], ['zero com casas', '0.000000000000', 'fator_base'], ['negativo', '-0.5', 'fator_base'],
    ['acima de 18 dígitos inteiros', '1000000000000000000', 'fator_base'], ['18 inteiros + 13 casas', '999999999999999999.9999999999999', 'fator_base'],
    ['13 casas na menor ordem', '0.0000000000001', 'fator_base'], ['texto', 'abc', 'fator_base'],
];
foreach ($lim as $i => [$nome, $v, $campo]) {
    $e = $erro(fn() => $adm->criarUnidade(['simbolo' => "x$i", 'nome' => "lim $i", 'grandeza' => 'teste', 'fator_base' => $v]));
    $ok("089 criar: $nome ($v) → 422 $campo, nada gravado", $e?->http === 422 && $e->campos === [$campo] && (int) $um('SELECT COUNT(*) FROM eq_unidade WHERE simbolo = ?', ["x$i"]) === 0, $e ? $e->getMessage() : 'sem erro');
}
$eG = $erro(fn() => $adm->criarUnidade(['simbolo' => 'xg', 'nome' => 'grande', 'grandeza' => 'teste', 'fator_base' => '1000000000000000000']));
$ok('089 criar: acima de 18 dígitos inteiros → mensagem clara', $eG !== null && $eG->getMessage() === 'O fator aceita no máximo 18 dígitos antes da vírgula; 1000000000000000000 não cabe.', $eG?->getMessage() ?? '');
$ok('089 criar: as recusas de limite não auditaram nada', $auditTotal() === $tot1);
$ok12 = [
    ['12 casas na menor ordem', '0.000000000001', '0.000000000001'],
    ['número grande no limite de DECIMAL(30,12)', '999999999999999999.999999999999', '999999999999999999.999999999999'],
    ['inteiro com zeros finais na fração', '1609.3440000000000', '1609.344'],
    ['número JSON (float) 0.25', 0.25, '0.25'],
];
foreach ($ok12 as $i => [$nome, $v, $esperado]) {
    $id = (int) ($tenta(fn() => $adm->criarUnidade(['simbolo' => "k$i", 'nome' => "ok $i", 'grandeza' => 'teste', 'fator_base' => $v]))['id'] ?? 0);
    $grav = (string) $uRow($id)['fator_base'];
    $ok("089 criar: $nome → grava exato e audita o canônico", $grav === $pad($esperado) && ($ultDepois($id)['fator_base'] ?? null) === $esperado, "$grav " . json_encode($ultDepois($id)));
}
$idN = (int) ($tenta(fn() => $adm->criarUnidade(['simbolo' => 'kn', 'nome' => 'sem fator', 'grandeza' => 'teste', 'fator_base' => null]))['id'] ?? 0);
$ok('089 criar: fator null → NULL no banco, auditoria com null', $uRow($idN)['fator_base'] === null && array_key_exists('fator_base', $ultDepois($idN)) && $ultDepois($idN)['fator_base'] === null);
$idO = (int) ($tenta(fn() => $adm->criarUnidade(['simbolo' => 'ko', 'nome' => 'fator omitido', 'grandeza' => 'teste']))['id'] ?? 0);
$ok('089 criar: fator omitido → NULL no banco', $uRow($idO)['fator_base'] === null);

// =========================================================================================================================================
// EDITAR UNIDADE COM FOTOGRAFIA E TRAVA (DSHOW-071) — o cenário do 409 falso
// =========================================================================================================================================
$uId = (int) ($tenta(fn() => $adm->criarUnidade(['simbolo' => 'u89', 'nome' => 'unidade 089', 'grandeza' => 'teste', 'fator_base' => '0.5']))['id'] ?? 0);
$s0 = $uRow($uId);   // fotografia como a tela recebe ("0.500000000000")
$a0 = $audU($uId);
$env13 = ['id' => $uId, 'nome' => 'unidade 089', 'grandeza' => 'teste', 'fator_base' => '0.1234567890124', 'antes' => $s0];
$e1 = $erro(fn() => $adm->salvarUnidade($env13));
$ok('089 editar: 0.1234567890124 → 422 fator_base com a mensagem clara', $e1?->http === 422 && $e1->campos === ['fator_base'] && $e1->getMessage() === $msg13, $e1 ? $e1->getMessage() . ' ' . json_encode($e1->campos) : 'sem erro');
$ok('089 editar: 422 sem mudança no banco (fator 0.5) e sem auditoria', (string) $uRow($uId)['fator_base'] === '0.500000000000' && $audU($uId) === $a0, json_encode($uRow($uId)));
$e1b = $erro(fn() => $adm->salvarUnidade($env13));
$ok('089 editar: repetir o envelope de 13 casas → 422 de novo (nunca 409), sem gravar nem auditar', $e1b?->http === 422 && $e1b->campos === ['fator_base'] && (string) $uRow($uId)['fator_base'] === '0.500000000000' && $audU($uId) === $a0,
    $e1b ? $e1b->http . ' ' . $e1b->getMessage() . ' ' . json_encode($e1b->campos) : 'sem erro');
$env12 = ['id' => $uId, 'nome' => 'unidade 089', 'grandeza' => 'teste', 'fator_base' => '0.1234567890120', 'antes' => $s0];
$r2 = $tenta(fn() => $adm->salvarUnidade($env12));
$ok('089 editar: 0.1234567890120 → grava EXATO 0.123456789012', empty($r2['sem_mudanca']) && (string) $uRow($uId)['fator_base'] === '0.123456789012', json_encode($uRow($uId)));
$ok('089 editar: UMA auditoria "editar" com depois.fator_base = 0.123456789012 e antes = linha travada (0.500000000000)', $audU($uId) === $a0 + 1
    && ($ultDepois($uId)['fator_base'] ?? null) === '0.123456789012'
    && (json_decode((string) $um("SELECT antes FROM eq_auditoria WHERE entidade = 'unidade' AND entidade_id = ? ORDER BY id DESC LIMIT 1", [(string) $uId]), true)['fator_base'] ?? null) === '0.500000000000', json_encode($ultDepois($uId)));
$r3 = null; $e2 = $erro(function () use (&$r3, $adm, $env12) { $r3 = $adm->salvarUnidade($env12); });
$ok('089 editar: repetir o MESMO envelope (fotografia S0 velha) → sem_mudanca, sem 409, sem auditoria duplicada', $e2 === null && !empty($r3['sem_mudanca']) && $audU($uId) === $a0 + 1 && (string) $uRow($uId)['fator_base'] === '0.123456789012', $e2 ? $e2->http . ' ' . $e2->getMessage() : json_encode($r3));
$r4 = $tenta(fn() => $adm->salvarUnidade(['id' => $uId, 'nome' => 'unidade 089', 'grandeza' => 'teste', 'fator_base' => '0.123456789012000', 'antes' => $uRow($uId)]));
$ok('089 editar: edição legítima sem mudança (fotografia certa, mesmo fator com outra grafia) → sem_mudanca, sem auditoria', !empty($r4['sem_mudanca']) && $audU($uId) === $a0 + 1);
$r5 = $tenta(fn() => $adm->salvarUnidade(['id' => $uId, 'nome' => 'unidade 089', 'grandeza' => 'teste', 'fator_base' => '0.999999999999', 'antes' => $uRow($uId)]));
$ok('089 editar: edição legítima com mudança (12 casas) → grava exato + 1 auditoria', empty($r5['sem_mudanca']) && (string) $uRow($uId)['fator_base'] === '0.999999999999' && $audU($uId) === $a0 + 2 && ($ultDepois($uId)['fator_base'] ?? null) === '0.999999999999');
// fotografia com fator velho e pedido diferente do atual → conflito real (409) continua
$e6 = $erro(fn() => $adm->salvarUnidade(['id' => $uId, 'nome' => 'unidade 089', 'grandeza' => 'teste', 'fator_base' => '0.25', 'antes' => $s0]));
$ok('089 editar: fotografia velha + pedido diferente do atual → 409 real (fator), nada gravado', $e6?->http === 409 && $e6->campos === ['fator_base'] && (string) $uRow($uId)['fator_base'] === '0.999999999999' && $audU($uId) === $a0 + 2, $e6 ? $e6->http . ' ' . json_encode($e6->campos) : 'sem erro');
// zero / negativo / acima do limite → 422 antes de tudo
foreach ([['zero', '0'], ['negativo', '-1'], ['acima de 18 dígitos', '1000000000000000000'], ['13 casas', '1.0000000000001']] as [$nome, $v]) {
    $e = $erro(fn() => $adm->salvarUnidade(['id' => $uId, 'nome' => 'unidade 089', 'grandeza' => 'teste', 'fator_base' => $v, 'antes' => $uRow($uId)]));
    $ok("089 editar: $nome ($v) → 422 fator_base, banco e auditoria iguais", $e?->http === 422 && $e->campos === ['fator_base'] && (string) $uRow($uId)['fator_base'] === '0.999999999999' && $audU($uId) === $a0 + 2, $e ? $e->getMessage() : 'sem erro');
}
// limite alto: número grande dentro de DECIMAL(30,12) e repetição dele
$big = '999999999999999999.999999999999';
$tenta(fn() => $adm->salvarUnidade(['id' => $uId, 'nome' => 'unidade 089', 'grandeza' => 'teste', 'fator_base' => $big . '000', 'antes' => $uRow($uId)]));
$ok('089 editar: número grande no limite → grava exato, 1 auditoria', (string) $uRow($uId)['fator_base'] === $big && $audU($uId) === $a0 + 3 && ($ultDepois($uId)['fator_base'] ?? null) === $big, json_encode($uRow($uId)));
$ok('089 editar: repetir com a fotografia já gravada (18 inteiros) → sem_mudanca (sem 422 de fotografia)', fn() => !empty($adm->salvarUnidade(['id' => $uId, 'nome' => 'unidade 089', 'grandeza' => 'teste', 'fator_base' => $big, 'antes' => $uRow($uId)])['sem_mudanca']) && $audU($uId) === $a0 + 3);
// null explícito limpa; omitido não mexe
$tenta(fn() => $adm->salvarUnidade(['id' => $uId, 'nome' => 'unidade 089', 'grandeza' => 'teste', 'fator_base' => null, 'antes' => $uRow($uId)]));
$ok('089 editar: fator null → limpa (NULL), 1 auditoria com depois.fator_base null', $uRow($uId)['fator_base'] === null && $audU($uId) === $a0 + 4 && array_key_exists('fator_base', $ultDepois($uId)) && $ultDepois($uId)['fator_base'] === null);
$ok('089 editar: repetir o null → sem_mudanca', fn() => !empty($adm->salvarUnidade(['id' => $uId, 'nome' => 'unidade 089', 'grandeza' => 'teste', 'fator_base' => null, 'antes' => $uRow($uId)])['sem_mudanca']) && $audU($uId) === $a0 + 4);
$tenta(fn() => $adm->salvarUnidade(['id' => $uId, 'nome' => 'unidade 089', 'grandeza' => 'teste', 'fator_base' => '2', 'antes' => $uRow($uId)]));
$tenta(fn() => $adm->salvarUnidade(['id' => $uId, 'nome' => 'unidade 089 (nome)', 'grandeza' => 'teste', 'antes' => $uRow($uId)]));
$ok('089 editar: fator omitido → mantém o fator (2), grava só o nome', (string) $uRow($uId)['fator_base'] === '2.000000000000' && $uRow($uId)['nome'] === 'unidade 089 (nome)' && !array_key_exists('fator_base', $ultDepois($uId)));

// =========================================================================================================================================
// CAMINHO ANTIGO (sem "antes": cargas.php, bundle antigo) — mesma regra
// =========================================================================================================================================
$a1 = $audU($uId);
$e7 = $erro(fn() => $adm->salvarUnidade(['id' => $uId, 'nome' => 'unidade 089 (nome)', 'grandeza' => 'teste', 'fator_base' => '0.1234567890124']));
$ok('089 antigo: 0.1234567890124 sem "antes" → 422 fator_base, nada gravado nem auditado', $e7?->http === 422 && $e7->campos === ['fator_base'] && (string) $uRow($uId)['fator_base'] === '2.000000000000' && $audU($uId) === $a1);
$tenta(fn() => $adm->salvarUnidade(['id' => $uId, 'nome' => 'unidade 089 (nome)', 'grandeza' => 'teste', 'fator_base' => '0.1234567890120']));
$ok('089 antigo: 0.1234567890120 → grava exato 0.123456789012 + 1 auditoria', (string) $uRow($uId)['fator_base'] === '0.123456789012' && $audU($uId) === $a1 + 1 && ($ultDepois($uId)['fator_base'] ?? null) === '0.123456789012');
$ok('089 antigo: repetir → sem_mudanca, sem auditoria nova', fn() => !empty($adm->salvarUnidade(['id' => $uId, 'nome' => 'unidade 089 (nome)', 'grandeza' => 'teste', 'fator_base' => '0.1234567890120'])['sem_mudanca']) && $audU($uId) === $a1 + 1);

// =========================================================================================================================================
// CONCORRÊNCIA GENUÍNA — DUAS CONEXÕES (pcntl_fork + GET_LOCK, molde do DSHOW-034 do modulo-mysql.php): mesma fotografia, fatores diferentes
// =========================================================================================================================================
$cId = (int) ($tenta(fn() => $adm->criarUnidade(['simbolo' => 'c89', 'nome' => 'concorrente 089', 'grandeza' => 'teste', 'fator_base' => '1']))['id'] ?? 0);
$sC = $uRow($cId); $aC = $audU($cId);
$fat = [1 => '0.1234567890120', 2 => '0.25'];
$pdo->exec('CREATE TABLE thf3_resultado (k INT PRIMARY KEY, res VARCHAR(200)) ENGINE=InnoDB');
$pdo->query("SELECT GET_LOCK('hf3-barreira', 10)")->fetchColumn();
$filhos = [];
foreach ([1, 2] as $k) {
    $pid = pcntl_fork();
    if ($pid === 0) {   // FILHO: conexão PRÓPRIA; sai por SIGKILL, sem destrutores
        $res = 'erro';
        try {
            $pk = $conectar();
            $pk->query("SELECT GET_LOCK('hf3-barreira', 20)")->fetchColumn(); $pk->query("SELECT RELEASE_LOCK('hf3-barreira')")->fetchColumn();
            $svk = new AtributosService(new AtributosRepoPdo($pk, ''), 80, "escritor$k@exemplo.invalid", $cat);
            $t = microtime(true);
            try { $svk->salvarUnidade(['id' => $cId, 'nome' => 'concorrente 089', 'grandeza' => 'teste', 'fator_base' => $fat[$k], 'antes' => $sC]); $res = 'ok'; }
            catch (AtributosErro $e) { $res = $e->http . ':' . implode(',', $e->campos); }
            $res .= sprintf(' %.3f', $t);
        } catch (Throwable $e) { $res = 'erro ' . get_class($e); }
        try { $pk->prepare('INSERT INTO thf3_resultado (k, res) VALUES (?, ?)')->execute([$k, $res]); } catch (Throwable $e) { }
        posix_kill(posix_getpid(), SIGKILL);
    }
    $filhos[$k] = $pid;
}
usleep(400000); $pdo->query("SELECT RELEASE_LOCK('hf3-barreira')")->fetchColumn();
foreach ($filhos as $pid) pcntl_waitpid($pid, $st);
$r = []; foreach ([1, 2] as $k) $r[$k] = explode(' ', (string) $um('SELECT res FROM thf3_resultado WHERE k = ?', [$k]));
$sts = [$r[1][0], $r[2][0]]; sort($sts);
$venc = $r[1][0] === 'ok' ? 1 : 2;
$ok('089 concorrente: os dois começaram juntos (< 50 ms) e só UM grava; o outro recebe 409 fator_base', $sts === ['409:fator_base', 'ok'] && abs((float) ($r[1][1] ?? 0) - (float) ($r[2][1] ?? 9)) < 0.05, json_encode($r));
$ok('089 concorrente: banco = fator do vencedor (canônico) e UMA auditoria "editar" (do vencedor)', (string) $uRow($cId)['fator_base'] === $pad($venc === 1 ? '0.123456789012' : '0.25')
    && $audU($cId) === $aC + 1 && (string) $um("SELECT usuario FROM eq_auditoria WHERE entidade = 'unidade' AND entidade_id = ? ORDER BY id DESC LIMIT 1", [(string) $cId]) === "escritor$venc@exemplo.invalid", json_encode([$uRow($cId), $venc]));
$ok('089 concorrente: a conexão do pai continua viva', (int) $um('SELECT 1') === 1);

// @@FIM@@
echo ($falhas === 0 ? '[OK]  ' : '[FALHA]') . " hotfix3-mysql (089 fator exato em DECIMAL(30,12)): $n casos, $falhas falha(s)\n";
exit($falhas === 0 ? 0 : 1);
