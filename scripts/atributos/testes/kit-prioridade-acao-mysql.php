<?php
// Produtos & Atributos — P1 kit-prioridade · AÇÃO de reordenar (POST kit_prioridade, 18/11, ESQUERDA) em BANCO REAL, pela camada única
// do "foi salvo" (OperacoesGravacao: recibo, chave de operação, conferir_gravacao). Prova: porta (nível/admin) antes do reenvio; 422 antes
// de mutar (malformada, vazia, repetido, inexistente, incompleta, sem ordem_antes); 409 com meta.atual SÓ em conflito real (ordem_antes
// velha, kit ativado no meio, trava segurada por outra conexão); sem_mudanca; aplicada com recibo byte a byte = reenvio = conferir; fila
// 1..N com inativos no lugar e NULL normalizado; versao/atualizado_em dos kits intactos; auditoria antes/depois; FICHA EFETIVA muda
// exatamente conforme a nova precedência (Aplicabilidade::ficha) e NENHUM valor/vínculo muda; 2 conexões: a trava da fila serializa
// reordenar × reordenar e reordenar × criar kit; sem a 012 → 503 sem mutar.
// Schema ATRWEB_VAL_T_7/_8/_9 VAZIO, migrações 001–012 pelo carregador dos testes. Entradas: EQ_TEST_CNF e EQ_TEST_DB.
// Saída: 0 verde · 1 falha · 2 não executado · 3 recusado. Contraprova: o MESMO arquivo no merge sem a ação falha (sem reordenarPrioridade).
declare(strict_types=1);
require_once __DIR__ . '/../../../api/atributos/AtributosRepo.php';
require_once __DIR__ . '/../../../api/atributos/KitsService.php';
require_once __DIR__ . '/../../../api/atributos/ProdutosLeitura.php';
require_once __DIR__ . '/../../../api/atributos/LeituraVitrinePdo.php';
require_once __DIR__ . '/_memoria.php';

[$cnf, $db] = [(string) (getenv('EQ_TEST_CNF') ?: ''), (string) (getenv('EQ_TEST_DB') ?: '')];
$raiz = realpath(__DIR__ . '/../../..');
$dir = "$raiz/db/equipamentos/migrations";
if ($cnf === '' || $db === '' || !is_readable($cnf)) { echo "[NÃO EXECUTADO] kit-prioridade-acao-mysql: faltam EQ_TEST_CNF/EQ_TEST_DB\n"; exit(2); }
if (!in_array($db, ['ATRWEB_VAL_T_7', 'ATRWEB_VAL_T_8', 'ATRWEB_VAL_T_9'], true)) { echo "[RECUSADO] kit-prioridade-acao-mysql: só ATRWEB_VAL_T_7, _T_8 ou _T_9\n"; exit(3); }
if (!is_file("$dir/012_kit_prioridade.sql") || !is_file("$dir/011_operacao.sql")) { echo "[NÃO EXECUTADO] kit-prioridade-acao-mysql: este código não tem a 011 e a 012\n"; exit(2); }
$ini = parse_ini_file($cnf, true, INI_SCANNER_RAW) ?: []; $c = $ini['client'] ?? [];
$tira = fn($v) => trim((string) $v, " \t\"'");
$dsn = 'mysql:' . (isset($c['socket']) ? 'unix_socket=' . $tira($c['socket']) : 'host=' . $tira($c['host'] ?? '127.0.0.1') . ';port=' . (int) ($c['port'] ?? 3306)) . ";dbname=$db;charset=utf8mb4";
$conectar = fn(array $extra = []) => new PDO($dsn, $tira($c['user'] ?? ''), $tira($c['password'] ?? ''), [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION] + $extra);
try { $pdo = $conectar([PDO::ATTR_STATEMENT_CLASS => [StmtGanchoPrio::class, []]]); }
catch (PDOException $e) { echo '[ERRO] kit-prioridade-acao-mysql: conexão recusada (código ' . $e->getCode() . ")\n"; exit(1); }
if ((string) $pdo->query('SELECT DATABASE()')->fetchColumn() !== $db) { echo "[RECUSADO] kit-prioridade-acao-mysql: a conexão não está em $db\n"; exit(3); }
if ((int) $pdo->query('SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE()')->fetchColumn() !== 0) { echo "[RECUSADO] kit-prioridade-acao-mysql: $db não está vazio\n"; exit(3); }
$arqs = array_values(array_filter(glob("$dir/[0-9][0-9][0-9]_*.sql") ?: [], static fn($f) => !str_ends_with($f, '.revert.sql'))); sort($arqs, SORT_STRING);
foreach ($arqs as $arq) foreach (preg_split('/;\s*\n/', (string) preg_replace('/^--.*$/m', '', (string) file_get_contents($arq))) ?: [] as $st) {
    $st = trim($st); if ($st === '') continue;
    if (!preg_match('/^(CREATE TABLE IF NOT EXISTS|ALTER TABLE|INSERT (IGNORE )?INTO|UPDATE) `eq_[a-z_]+`/i', $st)) { echo '[RECUSADO] kit-prioridade-acao-mysql: comando fora da lista em ' . basename($arq) . "\n"; exit(3); }
    $pdo->exec(rtrim($st, ';'));
}
$pdo->exec('CREATE TABLE `product_catalog` (`id` INT UNSIGNED NOT NULL PRIMARY KEY, `name` VARCHAR(120) NOT NULL, `category` VARCHAR(40) NOT NULL, `subcategory` VARCHAR(60) NULL,
    `active` TINYINT(1) NOT NULL DEFAULT 1, `deleted` TINYINT(1) NOT NULL DEFAULT 0) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci');

$falhas = 0; $n = 0;
$ok = function (string $nome, bool|Closure $cond, string $det = '') use (&$falhas, &$n): void {
    $n++; $msg = '';
    if ($cond instanceof Closure) { try { $cond = (bool) $cond(); } catch (Throwable $t) { $cond = false; $msg = ' (exceção: ' . get_class($t) . ' ' . $t->getMessage() . ')'; } }
    if (!$cond) { $falhas++; echo "[ERRO] $nome$msg" . ($det !== '' ? "\n       $det" : '') . "\n"; }
};
$erro = function (callable $f): ?Throwable { try { $f(); } catch (Throwable $e) { return $e; } return null; };
$um = function (string $sql, array $p = []) use ($pdo) { $s = $pdo->prepare($sql); $s->execute($p); return $s->fetchColumn(); };
$todas = function (string $sql, array $p = []) use ($pdo) { $s = $pdo->prepare($sql); $s->execute($p); return $s->fetchAll(PDO::FETCH_ASSOC); };
$jt = fn($x) => json_encode($x, JSON_UNESCAPED_UNICODE);
$temAcao = method_exists(KitsService::class, 'reordenarPrioridade');
$ok('a ação existe no código (KitsService::reordenarPrioridade)', $temAcao);
$ok('index.php roteia POST kit_prioridade pela camada (rota registrada)', str_contains((string) file_get_contents("$raiz/api/atributos/index.php"), "'POST kit_prioridade' => \$kits()->reordenarPrioridade(\$corpo)"));
$ok('012 aplicada pelo carregador (coluna prioridade)', (bool) $todas("SHOW COLUMNS FROM eq_grupo LIKE 'prioridade'"));

// ---- modelo: A1 numérico em VÁRIOS kits com posição/unidade/importância diferentes (quem vence decide) --------------------------------
$pdo->exec("INSERT INTO eq_unidade (simbolo, nome, grandeza) VALUES ('mm', 'milímetro', 'comprimento'), ('cm', 'centímetro', 'comprimento')");
[$mm, $cm] = array_map('intval', array_column($todas('SELECT id FROM eq_unidade ORDER BY id'), 'id'));
$pdo->prepare("INSERT INTO eq_atributo (codigo, rotulo, tipo, unidade_id) VALUES ('largura', 'Largura', 'numero', ?), ('cor', 'Cor', 'texto', NULL), ('peso', 'Peso', 'numero', NULL)")->execute([$mm]);
[$A1, $A2, $A3] = array_map('intval', array_column($todas('SELECT id FROM eq_atributo ORDER BY id'), 'id'));
$pdo->exec("INSERT INTO product_catalog (id, name, category, subcategory, active, deleted) VALUES (101, 'Painel indoor', 'LED_PANEL', 'INDOOR', 1, 0), (102, 'Painel', 'LED_PANEL', NULL, 1, 0), (103, 'Outro', 'OUTRO', NULL, 1, 0)");
$cat = new CatalogoMemoria();
$repo = new AtributosRepoPdo($pdo, '');
$A = ['id' => 1001, 'email' => 'admin@exemplo.invalid'];
$kits = new KitsService($repo, 80, $A['email'], $cat, true, $A['id']);
$criarKit = function (string $nome, array $escopos, array $itens, bool $todos = false) use ($kits, $repo): int {
    $k = $kits->salvarKit(['nome' => $nome] + ($todos ? ['aplica_a_todos' => 1] : []))['kit'];
    if ($escopos) $k = $kits->definirEscopos(['id' => $k['id'], 'versao' => $k['versao'], 'escopos' => $escopos])['kit'];
    $k = $kits->definirItens(['id' => $k['id'], 'versao' => $k['versao'], 'itens' => $itens])['kit'];
    return (int) $k['id'];
};
$led = [['categoria' => 'LED_PANEL', 'subcategoria' => '']];
$kAlfa  = $criarKit('Alfa', $led, [['atributo_id' => $A1, 'posicao' => 5, 'unidade_id' => $mm, 'importancia' => 'importante'], ['atributo_id' => $A2, 'posicao' => 1]]);
$kDelta = $criarKit('Delta', $led, [['atributo_id' => $A1, 'posicao' => 1, 'unidade_id' => $cm, 'importancia' => 'obrigatorio']]);
$kBeta  = $criarKit('Beta', [], [['atributo_id' => $A1, 'posicao' => 2, 'unidade_id' => $cm, 'importancia' => 'basico'], ['atributo_id' => $A3, 'posicao' => 3]], true);
$kGama  = $criarKit('Gama', [['categoria' => 'LED_PANEL', 'subcategoria' => 'INDOOR']], [['atributo_id' => $A1, 'posicao' => 9, 'unidade_id' => $cm, 'importancia' => 'opcional']]);
$kits->definirAtivo(['id' => $kDelta, 'versao' => (int) $repo->grupo($kDelta)['versao'], 'ativo' => 0]);   // inativo NO MEIO da fila (prioridade 2)
$pdo->prepare("INSERT INTO eq_valor (product_id, atributo_id, opcao_id, opcao_chave, valor_num, estado, origem, atualizado_por) VALUES (101, ?, NULL, 0, 10, 'informado', 'manual', 't')")->execute([$A1]);
$pdo->prepare("INSERT INTO eq_valor (product_id, atributo_id, opcao_id, opcao_chave, valor_texto, estado, origem, atualizado_por) VALUES (102, ?, NULL, 0, 'preto', 'informado', 'manual', 't')")->execute([$A2]);
$pdo->prepare("INSERT INTO eq_produto_atributo (product_id, atributo_id, modo, unidade_id, atualizado_por) VALUES (102, ?, 'incluir', NULL, 't')")->execute([$A3]);

$produtos = [];
foreach ($todas('SELECT id, category, subcategory, active FROM product_catalog WHERE deleted = 0 ORDER BY id') as $p)
    $produtos[(int) $p['id']] = ['id' => (int) $p['id'], 'categoria' => $p['category'], 'subcategoria' => $p['subcategory'], 'ativo' => (int) $p['active'] === 1];
/** ficha efetiva comparável de todos os produtos a partir de um retrato (dono do item, posição, flags, importância, unidades, origens) */
$fichaDe = function (RetratoModelo $m) use ($produtos): array {
    $out = [];
    foreach ($produtos as $pid => $p) {
        $excl = []; $f = Aplicabilidade::ficha($m, $p, $excl);
        $out[$pid]['kits'] = array_keys(Aplicabilidade::kits($m, $p));
        foreach ($f as $aid => $it) $out[$pid]['atributos'][$aid] = [$it['grupo_id'], $it['posicao'], $it['obrigatorio'], $it['visivel'], $it['destaque'], $it['importancia'],
            $it['unidade_kit_id'], $it['unidade_produto_id'], Aplicabilidade::unidadeEfetiva($it, null), array_map(static fn($o) => [$o['tipo'], $o['grupo_id'] ?? null], $it['origens'])];
    }
    return $out;
};
$fichas = fn() => $fichaDe((new AtributosRepoPdo($pdo, ''))->retratoModelo(null));
/** a ficha que a NOVA prioridade deve dar, calculada sem a ação: o retrato atual com as prioridades substituídas em memória */
$fichaEsperada = function (array $prio) use ($pdo, $fichaDe): array {
    $m = (new AtributosRepoPdo($pdo, ''))->retratoModelo(null);
    $g = $m->grupos; foreach ($prio as $id => $p) $g[(int) $id]['prioridade'] = $p;
    return $fichaDe(new RetratoModelo($g, $m->escopos, $m->itens, $m->diretos, $m->ajustes, $m->atributos));
};
$prio = fn() => array_map(static fn($r) => $r['prioridade'] === null ? null : (int) $r['prioridade'], array_column($todas('SELECT id, prioridade FROM eq_grupo ORDER BY id'), null, 'id'));
$gruposFoto = fn() => $todas('SELECT id, nome, versao, atualizado_em, ativo, aplica_a_todos FROM eq_grupo ORDER BY id');
$dadosFoto = fn() => [$todas('SELECT * FROM eq_valor ORDER BY id'), $todas('SELECT * FROM eq_produto_atributo ORDER BY id'), $todas("SELECT * FROM eq_grupo_atributo ORDER BY grupo_id, atributo_id"),
    $todas("SELECT * FROM eq_grupo_escopo ORDER BY grupo_id, categoria, subcategoria"), $todas('SELECT * FROM eq_grupo_produto ORDER BY id'), $todas('SELECT * FROM eq_sugestao ORDER BY id'), $todas('SELECT * FROM eq_atributo ORDER BY id')];
$audN = fn() => (int) $um("SELECT COUNT(*) FROM eq_auditoria WHERE acao = 'reordenar_kits'");
$op = fn(string $k) => $todas('SELECT titular_id, rota, estado, recibo_texto, erro, tentativas FROM eq_operacao WHERE chave = ?', [$k])[0] ?? null;
$opsA = new OperacoesGravacao($repo, $A['id'], $A['email'], 80, true);
$reord = fn(array $corpo, ?string $chave = null, ?OperacoesGravacao $o = null, ?KitsService $k = null) => ($o ?? $opsA)->executar('kit_prioridade', $corpo, $chave, fn(array $c) => ($k ?? $kits)->reordenarPrioridade($c));

// ================================= 0 · estado inicial ======================================================================================
$ok('pré: prioridades 1..4 na ordem de criação (kit novo = MAX + 1); Delta inativo em 2', $prio() === [$kAlfa => 1, $kDelta => 2, $kBeta => 3, $kGama => 4], $jt($prio()));
$f0 = $fichas();
$ok('pré: 101 tem A1 de Alfa (mm, importante, posição 5); 102 também; 103 de Beta (cm)', $f0[101]['atributos'][$A1][0] === $kAlfa && $f0[102]['atributos'][$A1][0] === $kAlfa && $f0[101]['atributos'][$A1][8] === $mm && $f0[103]['atributos'][$A1][0] === $kBeta, $jt($f0));
$leitura = new ProdutosLeitura(new LeituraVitrinePdo($pdo, $db, $db), $repo, 80, null, true, true);
$ok('GET kits: ordem_prioridade (aditivo) = ativos na precedência [Alfa, Beta, Gama] e prioridade por kit', fn() => ($k = $leitura->kits())['ordem_prioridade'] === [$kAlfa, $kBeta, $kGama]
    && array_column($k['kits'], 'prioridade', 'id')[$kDelta] === 2);
$ordem0 = [$kAlfa, $kBeta, $kGama];

// ================================= 1 · porta (nível/admin) — também antes do reenvio ======================================================
$e = $erro(fn() => $reord(['ordem' => [$kGama, $kBeta, $kAlfa], 'ordem_antes' => $ordem0], 'k-prio-porta1', new OperacoesGravacao($repo, 2, 'baixo@exemplo.invalid', 50, true)));
$ok('porta: nível 50 → 403 INSUFFICIENT_LEVEL, nada gravado, sem operação', $e instanceof AtributosErro && $e->http === 403 && $e->codigo === 'INSUFFICIENT_LEVEL' && $prio()[$kAlfa] === 1 && $op('k-prio-porta1') === null);
$e = $erro(fn() => $reord(['ordem' => [$kGama, $kBeta, $kAlfa], 'ordem_antes' => $ordem0], 'k-prio-porta2', new OperacoesGravacao($repo, 3, 'nadm@exemplo.invalid', 90, false)));
$ok('porta: nível 90 sem administrar o catálogo → 403 NOT_CATALOG_ADMIN (rota está em ROTAS_ADMIN)', $e instanceof AtributosErro && $e->codigo === 'NOT_CATALOG_ADMIN' && $op('k-prio-porta2') === null);
$e = $erro(fn() => (new KitsService($repo, 80, 'nadm@exemplo.invalid', $cat, false, 3))->reordenarPrioridade(['ordem' => [$kGama, $kBeta, $kAlfa], 'ordem_antes' => $ordem0]));
$ok('serviço sozinho também barra quem não administra (403)', $e instanceof AtributosErro && $e->codigo === 'NOT_CATALOG_ADMIN');

// ================================= 2 · 422 antes de mutar ==================================================================================
$p0 = $prio(); $g0 = $gruposFoto(); $d0 = $dadosFoto(); $a0 = $audN();
$casos422 = [
    'ordem não é lista'              => [['ordem' => ['x' => $kAlfa], 'ordem_antes' => $ordem0], 'ordem'],
    'ordem vazia'                    => [['ordem' => [], 'ordem_antes' => $ordem0], 'ordem'],
    'id inválido (0, texto)'         => [['ordem' => [$kAlfa, 0, 'abc'], 'ordem_antes' => $ordem0], 'ordem'],
    'kit repetido'                   => [['ordem' => [$kGama, $kGama, $kAlfa], 'ordem_antes' => $ordem0], 'ordem'],
    'lista incompleta (falta Beta)'  => [['ordem' => [$kGama, $kAlfa], 'ordem_antes' => $ordem0], 'ordem'],
    'kit inexistente'                => [['ordem' => [$kGama, $kBeta, 999999], 'ordem_antes' => [$kGama, $kBeta, 999999]], 'ordem'],
    'sem ordem_antes'                => [['ordem' => [$kGama, $kBeta, $kAlfa]], 'ordem_antes'],
];
$i = 0;
foreach ($casos422 as $nome => [$corpo, $campo]) {
    $ch = 'k-prio-422-' . (++$i);
    $e = $erro(fn() => $reord($corpo, $ch));
    $ok("422 $nome: VALIDATION_ERROR no campo $campo, desfecho recusada com motivos, sem meta.atual", $e instanceof AtributosErro && $e->http === 422 && $e->campos === [$campo]
        && ($e->meta['desfecho'] ?? null) === 'recusada' && isset($e->meta['motivos'][$campo]) && !array_key_exists('atual', $e->meta), $e ? $e->getMessage() . ' ' . $jt($e->meta) : 'sem erro');
    $ok("422 $nome: operação registrada 'recusada'", ($op($ch)['estado'] ?? null) === 'recusada');
}
$ok('422 (todos): prioridades, kits (versao/atualizado_em), valores/vínculos e auditoria intactos', $prio() === $p0 && $gruposFoto() === $g0 && $dadosFoto() === $d0 && $audN() === $a0);

// ================================= 3 · 409 só em conflito real =============================================================================
$e = $erro(fn() => $reord(['ordem' => [$kGama, $kAlfa, $kBeta], 'ordem_antes' => [$kBeta, $kAlfa, $kGama]], 'k-prio-409-001'));
$ok('409 ordem_antes velha: CONFLICT, desfecho conflito, meta.atual = {ordem atual, kits}', $e instanceof AtributosErro && $e->http === 409 && ($e->meta['desfecho'] ?? null) === 'conflito'
    && ($e->meta['atual']['ordem'] ?? null) === $ordem0 && count($e->meta['atual']['kits'] ?? []) === 4 && ($e->meta['atual']['kits'][1]['id'] ?? null) === $kDelta, $e ? $jt($e->meta) : 'sem erro');
$ok('409: operação conflito, nada gravado nem auditado', ($op('k-prio-409-001')['estado'] ?? null) === 'conflito' && $prio() === $p0 && $gruposFoto() === $g0 && $audN() === $a0);
$e = $erro(fn() => $reord(['ordem' => [$kGama, $kDelta, $kBeta, $kAlfa], 'ordem_antes' => [$kAlfa, $kDelta, $kBeta, $kGama]], 'k-prio-409-002'));
$ok('409 kit INATIVO na ordem (a tela o viu ativo): conflito com meta.atual sem ele', $e instanceof AtributosErro && $e->http === 409 && ($e->meta['atual']['ordem'] ?? null) === $ordem0 && $prio() === $p0);

// ================================= 4 · sem_mudanca =========================================================================================
$r = null; $e = $erro(function () use (&$r, $reord, $ordem0) { $r = $reord(['ordem' => $ordem0, 'ordem_antes' => $ordem0], 'k-prio-semm-01'); });
$ok('sem_mudanca: ordem = atual → desfecho sem_mudanca, recibo campos_gravados [], versao_nova = versão da fila', $e === null && ($r['desfecho'] ?? null) === 'sem_mudanca' && ($r['recibo']['campos_gravados'] ?? null) === []
    && ($r['recibo']['versao_nova'] ?? null) === ($r['versao_prioridade'] ?? 'x') && ($r['recibo']['ordem'] ?? null) === $ordem0, $jt($r) . ' ' . ($e?->getMessage() ?? ''));
$ok('sem_mudanca: nada gravado nem auditado; operação sem_mudanca', $prio() === $p0 && $gruposFoto() === $g0 && $audN() === $a0 && ($op('k-prio-semm-01')['estado'] ?? null) === 'sem_mudanca');

// ================================= 5 · aplicada: fila, recibo, reenvio, conferir, ficha, valores ===========================================
$nova = [$kGama, $kBeta, $kAlfa];
$esperadaPrio = [$kGama => 1, $kDelta => 2, $kBeta => 3, $kAlfa => 4]; ksort($esperadaPrio);   // ativos nas vagas 1, 3, 4; Delta (inativo) fica em 2
$fEsp = $fichaEsperada($esperadaPrio);
$r5 = null; $e = $erro(function () use (&$r5, $reord, $nova, $ordem0) { $r5 = $reord(['ordem' => $nova, 'ordem_antes' => $ordem0, 'motivo' => 'teste de precedência'], 'k-prio-apl-001'); });
$ok('aplicada: desfecho aplicada, payload {ordem, kits na precedência, versao_prioridade}', $e === null && ($r5['desfecho'] ?? null) === 'aplicada' && ($r5['ordem'] ?? null) === $nova
    && array_column($r5['kits'] ?? [], 'id') === [$kGama, $kDelta, $kBeta, $kAlfa] && is_string($r5['versao_prioridade'] ?? null), $jt($r5) . ' ' . ($e?->getMessage() ?? ''));
$ok('aplicada: recibo {operacao kit_prioridade, chave, versao_nova = versao_prioridade, campos_gravados [prioridade], ordem}', ($r5['recibo']['operacao'] ?? null) === 'kit_prioridade' && ($r5['recibo']['chave'] ?? null) === 'k-prio-apl-001'
    && ($r5['recibo']['versao_nova'] ?? null) === $r5['versao_prioridade'] && ($r5['recibo']['campos_gravados'] ?? null) === ['prioridade'] && ($r5['recibo']['ordem'] ?? null) === $nova);
$ok('persistido: fila 1..N — ativos nas vagas dos ativos, INATIVO no mesmo lugar', $prio() === $esperadaPrio, $jt($prio()));
$ok('persistido: versao e atualizado_em (e nome/ativo) dos kits intactos', $gruposFoto() === $g0);
$ok('NENHUM valor/vínculo/item/escopo/sugestão/atributo alterado', $dadosFoto() === $d0);
$ok('auditoria: +1 reordenar_kits (kit_prioridade/fila) com antes/depois e motivo', fn() => $audN() === $a0 + 1 && ($au = $todas("SELECT * FROM eq_auditoria WHERE acao = 'reordenar_kits' ORDER BY id DESC LIMIT 1")[0])
    && $au['entidade'] === 'kit_prioridade' && $au['entidade_id'] === 'fila' && $au['motivo'] === 'teste de precedência'
    && json_decode($au['antes'], true)['ordem'] === $ordem0 && json_decode($au['depois'], true)['ordem'] === $nova
    && json_decode($au['antes'], true)['prioridade'][(string) $kAlfa] === 1 && json_decode($au['depois'], true)['prioridade'][(string) $kAlfa] === 4);
$ok('GET auditoria aceita a entidade kit_prioridade', fn() => count((new AtributosService($repo, 80, $A['email'], $cat, true))->auditoria('kit_prioridade', 'fila')['auditoria']) === 1);
$f5 = $fichas();
$ok('FICHA efetiva = exatamente a da nova precedência (Aplicabilidade::ficha sobre o retrato com as prioridades novas)', $f5 === $fEsp, $jt([$f5, $fEsp]));
$ok('… 101: A1 passa a vir de Gama (posição 9, cm, opcional) — antes Alfa (5, mm, importante)', $f5[101]['atributos'][$A1][0] === $kGama && $f5[101]['atributos'][$A1][1] === 9 && $f5[101]['atributos'][$A1][5] === 'opcional' && $f5[101]['atributos'][$A1][8] === $cm);
$ok('… 102 (sem INDOOR): A1 passa a Beta (cm, básico); A2 continua de Alfa (só Alfa o tem)', $f5[102]['atributos'][$A1][0] === $kBeta && $f5[102]['atributos'][$A1][5] === 'basico' && $f5[102]['atributos'][$A2][0] === $kAlfa);
$ok('… 103 (só Beta): ficha idêntica', $f5[103] === $f0[103]);
$ok('… ordem dos kits do 101 = nova precedência [Gama, Beta, Alfa]', $f5[101]['kits'] === [$kGama, $kBeta, $kAlfa]);
$ok('… a ficha MUDOU onde kits disputam atributo (contraste com antes)', $f5[101] !== $f0[101] && $f5[102] !== $f0[102]);
$ok('recibo guardado = resposta, BYTE A BYTE (eq_operacao.recibo_texto)', fn() => ($o = $op('k-prio-apl-001')) && $o['estado'] === 'aplicada' && (int) $o['titular_id'] === $A['id'] && $o['recibo_texto'] === OperacoesGravacao::textoRecibo($r5['recibo']));
$r5b = null; $e = $erro(function () use (&$r5b, $opsA, $nova, $ordem0) { $r5b = $opsA->executar('kit_prioridade', ['ordem' => $nova, 'ordem_antes' => $ordem0, 'motivo' => 'teste de precedência'], 'k-prio-apl-001', fn(array $c) => throw new LogicException('não pode executar de novo')); });
$ok('reenvio da MESMA chave: recibo ORIGINAL (mesmo texto), repetido, sem executar nem auditar', $e === null && ($r5b['repetido'] ?? false) === true && OperacoesGravacao::textoRecibo($r5b['recibo']) === OperacoesGravacao::textoRecibo($r5['recibo']) && $audN() === $a0 + 1, $jt($r5b) . ' ' . ($e?->getMessage() ?? ''));
$ok('conferir_gravacao: aplicada com o MESMO recibo (só leitura)', fn() => ($cf = $opsA->conferir('k-prio-apl-001'))['resultado'] === 'aplicada' && OperacoesGravacao::textoRecibo($cf['recibo']) === OperacoesGravacao::textoRecibo($r5['recibo']) && $audN() === $a0 + 1);
$e = $erro(fn() => $reord(['ordem' => [$kAlfa, $kBeta, $kGama], 'ordem_antes' => $nova], 'k-prio-apl-001'));
$ok('mesma chave com OUTRO pedido → 422 IDEMPOTENCY_KEY_REUSED, nada gravado', $e instanceof AtributosErro && $e->codigo === 'IDEMPOTENCY_KEY_REUSED' && $prio() === $esperadaPrio);
$e = $erro(fn() => $reord(['ordem' => $nova, 'ordem_antes' => $ordem0, 'motivo' => 'teste de precedência'], 'k-prio-apl-001', new OperacoesGravacao($repo, $A['id'], $A['email'], 90, false)));
$ok('porta ANTES do reenvio: quem perdeu o administrar e conhece a chave → 403, sem recibo', $e instanceof AtributosErro && $e->codigo === 'NOT_CATALOG_ADMIN');
$r = null; $e = $erro(function () use (&$r, $reord, $nova, $ordem0) { $r = $reord(['ordem' => $nova, 'ordem_antes' => $ordem0]); });
$ok('sem chave, ordem_antes velha (pedido repetido sem chave) → 409 (a lista completa não "empurra" de novo)', $e instanceof AtributosErro && $e->http === 409 && $prio() === $esperadaPrio);
$r = null; $e = $erro(function () use (&$r, $reord, $nova) { $r = $reord(['ordem' => $nova, 'ordem_antes' => $nova]); });
$ok('sem chave (chamador antigo): sem_mudanca com recibo (chave null)', $e === null && ($r['desfecho'] ?? null) === 'sem_mudanca' && array_key_exists('chave', $r['recibo'] ?? []) && $r['recibo']['chave'] === null, $jt($r) . ' ' . ($e?->getMessage() ?? ''));
$ok('GET kits: ordem_prioridade reflete a nova fila', fn() => (new ProdutosLeitura(new LeituraVitrinePdo($pdo, $db, $db), new AtributosRepoPdo($pdo, ''), 80, null, true, true))->kits()['ordem_prioridade'] === $nova);

// ================================= 6 · kit com prioridade NULL (código anterior) é normalizado ==============================================
$pdo->exec("INSERT INTO eq_grupo (nome, aplica_a_todos) VALUES ('Epsilon pelo código anterior', 1)");
$kEps = (int) $pdo->lastInsertId();
$pdo->prepare("INSERT INTO eq_grupo_atributo (grupo_id, atributo_id, posicao, unidade_id, importancia) VALUES (?, ?, 0, ?, 'obrigatorio')")->execute([$kEps, $A1, $mm]);
$ordem6 = [$kGama, $kBeta, $kAlfa, $kEps];
$ok('pré 6: Epsilon (NULL) é o último ativo da fila', (new ProdutosLeitura(new LeituraVitrinePdo($pdo, $db, $db), new AtributosRepoPdo($pdo, ''), 80, null, true, true))->kits()['ordem_prioridade'] === $ordem6);
$g6 = $gruposFoto(); $d6 = $dadosFoto();
$esp6 = [$kGama => 3, $kDelta => 2, $kBeta => 4, $kAlfa => 5, $kEps => 1];
$fEsp6 = $fichaEsperada($esp6);
$r6 = null; $e = $erro(function () use (&$r6, $reord, $kEps, $kGama, $kBeta, $kAlfa, $ordem6) { $r6 = $reord(['ordem' => [$kEps, $kGama, $kBeta, $kAlfa], 'ordem_antes' => $ordem6], 'k-prio-null-01'); });
$ok('NULL: aplicada; fila inteira 1..N sem NULL, Delta continua em 2', $e === null && ($r6['desfecho'] ?? null) === 'aplicada' && $prio() === [$kAlfa => 5, $kDelta => 2, $kBeta => 4, $kGama => 3, $kEps => 1], $jt($prio()) . ' ' . ($e?->getMessage() ?? ''));
$ok('NULL: ficha = a da nova precedência; 103 agora tem A1 de Epsilon (mm, obrigatório)', ($f6 = $fichas()) === $fEsp6 && $f6[103]['atributos'][$A1][0] === $kEps && $f6[103]['atributos'][$A1][8] === $mm, $jt($fichas()));
$ok('NULL: valores e vínculos intactos; versao/atualizado_em dos kits intactos', $dadosFoto() === $d6 && $gruposFoto() === $g6);

// ================================= 7 · 2 conexões: trava da fila serializa (sem sleep; ordem forçada por gancho) ============================
$pdo2 = $conectar(); $pdo2->exec('SET SESSION innodb_lock_wait_timeout = 1');
$repo2 = new AtributosRepoPdo($pdo2, '');
$kits2 = new KitsService($repo2, 80, 'outra@exemplo.invalid', $cat, true, 1002);
$ops2 = new OperacoesGravacao($repo2, 1002, 'outra@exemplo.invalid', 80, true);
$ordem7 = [$kEps, $kGama, $kBeta, $kAlfa];
// (a) A trava a fila e, no meio da transação (gancho logo depois do FOR UPDATE), B tenta reordenar e tenta CRIAR kit: ambos esperam a trava → 409
$r7a = null; $e7b = null; $e7c = null; $disparou = false;
StmtGanchoPrio::$apos = function (string $sql) use (&$disparou, &$e7b, &$e7c, $erro, $ops2, $kits2, $ordem7, $kEps, $kGama, $kBeta, $kAlfa): void {
    if ($disparou || !str_contains($sql, 'FOR UPDATE') || !str_contains($sql, 'eq_grupo')) return;
    $disparou = true; StmtGanchoPrio::$apos = null;
    $e7b = $erro(fn() => $ops2->executar('kit_prioridade', ['ordem' => [$kAlfa, $kBeta, $kGama, $kEps], 'ordem_antes' => $ordem7], 'k-prio-conc-b1', fn(array $c) => $kits2->reordenarPrioridade($c)));
    $e7c = $erro(fn() => $ops2->executar('kit', ['nome' => 'Kit criado durante a reordenação'], 'k-prio-conc-c1', fn(array $c) => $kits2->salvarKit($c)));
};
$e7a = $erro(function () use (&$r7a, $reord, $ordem7, $kEps, $kGama, $kBeta, $kAlfa) { $r7a = $reord(['ordem' => [$kGama, $kEps, $kBeta, $kAlfa], 'ordem_antes' => $ordem7], 'k-prio-conc-a1'); });
StmtGanchoPrio::$apos = null;
$ok('conc (a): o gancho disparou com a fila travada por A', $disparou);
$ok('conc (a): B (reordenar) esperou a trava e recebeu 409 (espera esgotada = conflito visível), operação conflito', $e7b instanceof AtributosErro && $e7b->http === 409 && ($op('k-prio-conc-b1')['estado'] ?? null) === 'conflito', $e7b ? get_class($e7b) . ' ' . $e7b->getMessage() : 'sem erro');
$ok('conc (a): criar kit durante a reordenação também esperou (MAX(prioridade) não escapa da trava) → 409, kit não criado', $e7c instanceof AtributosErro && $e7c->http === 409 && (int) $um("SELECT COUNT(*) FROM eq_grupo WHERE nome = 'Kit criado durante a reordenação'") === 0, $e7c ? get_class($e7c) . ' ' . $e7c->getMessage() : 'sem erro');
$ok('conc (a): A concluiu (aplicada) com a ordem dele', $e7a === null && ($r7a['desfecho'] ?? null) === 'aplicada' && ($r7a['ordem'] ?? null) === [$kGama, $kEps, $kBeta, $kAlfa], $e7a?->getMessage() ?? '');
// (b) B reenvia com a ordem que viu (agora velha) → 409 com meta.atual = a ordem de A; nada gravado por B
$e = $erro(fn() => $ops2->executar('kit_prioridade', ['ordem' => [$kAlfa, $kBeta, $kGama, $kEps], 'ordem_antes' => $ordem7], 'k-prio-conc-b2', fn(array $c) => $kits2->reordenarPrioridade($c)));
$ok('conc (b): B com ordem_antes velha → 409 com meta.atual.ordem = a de A; fila = a de A', $e instanceof AtributosErro && $e->http === 409 && ($e->meta['atual']['ordem'] ?? null) === [$kGama, $kEps, $kBeta, $kAlfa]
    && $prio() === [$kAlfa => 5, $kDelta => 2, $kBeta => 4, $kGama => 1, $kEps => 3] && $fichas()[103]['atributos'][$A1][0] === $kEps, $jt($prio()));
// (c) outra conexão ATIVA um kit entre a leitura da tela e o envio → 409 com o kit na meta.atual
$kits2->definirAtivo(['id' => $kDelta, 'versao' => (int) $repo2->grupo($kDelta)['versao'], 'ativo' => 1]);
$e = $erro(fn() => $reord(['ordem' => [$kEps, $kGama, $kBeta, $kAlfa], 'ordem_antes' => [$kGama, $kEps, $kBeta, $kAlfa]], 'k-prio-conc-a2'));
$ok('conc (c): kit ativado por outra conexão → 409, meta.atual traz Delta na posição dele', $e instanceof AtributosErro && $e->http === 409 && ($e->meta['atual']['ordem'] ?? null) === [$kGama, $kDelta, $kEps, $kBeta, $kAlfa], $e ? $jt($e->meta) : 'sem erro');
// (d) trava segurada por outra transação (ex.: edição de kit em andamento) → 409 sem mutar
$pdo2->beginTransaction(); $pdo2->query("SELECT id FROM eq_grupo WHERE id = $kAlfa FOR UPDATE")->fetchAll();
$pdo->exec('SET SESSION innodb_lock_wait_timeout = 1');
$pAntes = $prio();
$e = $erro(fn() => $reord(['ordem' => [$kAlfa, $kGama, $kDelta, $kEps, $kBeta], 'ordem_antes' => [$kGama, $kDelta, $kEps, $kBeta, $kAlfa]], 'k-prio-conc-a3'));
$pdo2->rollBack();
$ok('conc (d): linha de eq_grupo travada por outra transação → 409 (espera esgotada), nada gravado', $e instanceof AtributosErro && $e->http === 409 && $prio() === $pAntes, $e ? $e->getMessage() : 'sem erro');
$r = null; $e = $erro(function () use (&$r, $reord, $kAlfa, $kGama, $kDelta, $kEps, $kBeta) { $r = $reord(['ordem' => [$kAlfa, $kGama, $kDelta, $kEps, $kBeta], 'ordem_antes' => [$kGama, $kDelta, $kEps, $kBeta, $kAlfa]], 'k-prio-conc-a3'); });
$ok('conc (d): trava solta, a MESMA chave reenviada assume e aplica (conflito → nova tentativa)', $e === null && ($r['desfecho'] ?? null) === 'aplicada' && (int) ($op('k-prio-conc-a3')['tentativas'] ?? 0) === 2, $e?->getMessage() ?? '');
$ok('conc: fila final 1..N sem buraco nem repetição', ($v = array_values(array_filter($prio(), static fn($p) => $p !== null))) && (function () use ($v) { sort($v); return $v === range(1, count($v)); })());

// ================================= 8 · sem a 012 → 503 sem mutar ===========================================================================
$pdo->exec('ALTER TABLE `eq_grupo` DROP COLUMN `prioridade`');
$d8 = $dadosFoto(); $a8 = $audN();
$repo8 = new AtributosRepoPdo($pdo, '');
$e = $erro(fn() => (new OperacoesGravacao($repo8, $A['id'], $A['email'], 80, true))->executar('kit_prioridade', ['ordem' => [$kAlfa], 'ordem_antes' => [$kAlfa]], 'k-prio-sem-012', fn(array $c) => (new KitsService($repo8, 80, $A['email'], $cat, true, $A['id']))->reordenarPrioridade($c)));
$ok('sem a 012: 503 KIT_PRIORITY_UNAVAILABLE, nada gravado, operação recusada', $e instanceof AtributosErro && $e->http === 503 && $e->codigo === 'KIT_PRIORITY_UNAVAILABLE' && $dadosFoto() === $d8 && $audN() === $a8 && ($op('k-prio-sem-012')['estado'] ?? null) === 'recusada', $e ? $e->getMessage() : 'sem erro');

echo $falhas === 0 ? "[OK] kit-prioridade-acao-mysql: $n casos, 0 falhas ($db)\n" : "[FALHOU] kit-prioridade-acao-mysql: $falhas de $n casos\n";
exit($falhas === 0 ? 0 : 1);

class StmtGanchoPrio extends PDOStatement
{
    public static ?Closure $apos = null;
    protected function __construct() {}
    public function execute(?array $params = null): bool
    {
        $r = parent::execute($params);
        if (self::$apos !== null) (self::$apos)($this->queryString, $params ?? []);
        return $r;
    }
}
