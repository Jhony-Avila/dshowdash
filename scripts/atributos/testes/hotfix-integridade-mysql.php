<?php
// Produtos & Atributos — hotfix de integridade (18/11): teste de BANCO REAL do que o servidor PERSISTE e AUDITA em cada item do hotfix:
// DSHOW-071 (unidade com fotografia e trava), DSHOW-064 (itens do kit com versão velha), DSHOW-070 (renomear opção com rótulo velho),
// DSHOW-065 (escopo + "aplica a todos" numa transação) e ações opostas no Vincular (422 sem gravar nada).
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
if ($cnf === '' || $db === '' || !is_readable($cnf)) { echo "[NÃO EXECUTADO] hotfix-integridade-mysql: faltam EQ_TEST_CNF/EQ_TEST_DB\n"; exit(2); }
if (!preg_match('/^ATRWEB_VAL_T_[A-Za-z0-9_]{1,40}$/', $db)) { echo "[RECUSADO] hotfix-integridade-mysql: EQ_TEST_DB precisa ser ATRWEB_VAL_T_*\n"; exit(3); }
if (!in_array($db, ['ATRWEB_VAL_T_7', 'ATRWEB_VAL_T_8', 'ATRWEB_VAL_T_9'], true)) { echo "[RECUSADO] hotfix-integridade-mysql: só ATRWEB_VAL_T_7, _T_8 ou _T_9\n"; exit(3); }

$ini = parse_ini_file($cnf, true, INI_SCANNER_RAW) ?: []; $c = $ini['client'] ?? [];
$tira = fn($v) => trim((string) $v, " \t\"'");
$dsn = 'mysql:' . (isset($c['socket']) ? 'unix_socket=' . $tira($c['socket']) : 'host=' . $tira($c['host'] ?? '127.0.0.1') . ';port=' . (int) ($c['port'] ?? 3306)) . ";dbname=$db;charset=utf8mb4";
$conectar = function () use ($dsn, $c, $tira): PDO { return new PDO($dsn, $tira($c['user'] ?? ''), $tira($c['password'] ?? ''), [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]); };
try { $pdo = $conectar(); }
catch (PDOException $e) { echo '[ERRO] hotfix-integridade-mysql: conexão recusada (código ' . $e->getCode() . ")\n"; exit(1); }
if ((string) $pdo->query('SELECT DATABASE()')->fetchColumn() !== $db) { echo "[RECUSADO] hotfix-integridade-mysql: a conexão não está em $db\n"; exit(3); }
if ((int) $pdo->query('SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE()')->fetchColumn() !== 0) { echo "[RECUSADO] hotfix-integridade-mysql: $db não está vazio\n"; exit(3); }

$arqs = array_values(array_filter(glob("$dir/[0-9][0-9][0-9]_*.sql") ?: [], static fn($f) => !str_ends_with($f, '.revert.sql'))); sort($arqs, SORT_STRING);
foreach ($arqs as $arq) foreach (preg_split('/;\s*\n/', (string) preg_replace('/^--.*$/m', '', (string) file_get_contents($arq))) ?: [] as $st) {
    $st = trim($st); if ($st === '') continue;
    if (!preg_match('/^(CREATE TABLE IF NOT EXISTS|ALTER TABLE|INSERT (IGNORE )?INTO|UPDATE) `eq_[a-z_]+`/i', $st)) { echo '[RECUSADO] hotfix-integridade-mysql: comando fora da lista em ' . basename($arq) . "\n"; exit(3); }
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

// ---- catálogo falso ----------------------------------------------------------------------------------------------------------------------
$cat = new CatalogoMemoria();
foreach ([[101, 'CABLE'], [102, 'CABLE'], [103, 'CABLE'], [201, 'POWER_SUPPLY']] as [$id, $sub])
    $cat->p[$id] = ['id' => $id, 'nome' => "Produto $id (sintético)", 'categoria' => 'LED_PANEL', 'subcategoria' => $sub, 'ativo' => true, 'excluido' => false, 'sincronizado_em' => null];

$repo = new AtributosRepoPdo($pdo, '');
$adm = new AtributosService($repo, 80, 'admin@exemplo.invalid', $cat);
$admB = new AtributosService($repo, 80, 'outra@exemplo.invalid', $cat);
$kits = new KitsService($repo, 80, 'admin@exemplo.invalid', $cat);

// =========================================================================================================================================
// DSHOW-071 · Unidades: fotografia (`antes`) comparada com a linha TRAVADA; 409 sem gravar nem auditar; repetição = sem_mudanca
// =========================================================================================================================================
$r = $adm->criarUnidade(['simbolo' => 'cm', 'nome' => 'centímetro', 'grandeza' => 'comprimento', 'fator_base' => '0.01']);
$uId = (int) $r['id'];
$uRow = fn() => $linha('SELECT nome, grandeza, fator_base FROM eq_unidade WHERE id = ?', [$uId]);
$s0 = $uRow();                                                              // fotografia S0 (como a tela recebe: fator "0.010000000000")
$aud0 = $audit('unidade', (string) $uId, 'editar');
// A muda só a grandeza e confirma
$rA = $adm->salvarUnidade(['id' => $uId, 'nome' => 'centímetro', 'grandeza' => 'comprimento_linear', 'antes' => $s0]);
$ok('071: A (grandeza nova, fotografia S0 = atual) grava', empty($rA['sem_mudanca']) && $uRow()['grandeza'] === 'comprimento_linear');
$ok('071: A gera UMA auditoria "editar" com antes = linha travada', $audit('unidade', (string) $uId, 'editar') === $aud0 + 1
    && json_decode((string) $um("SELECT antes FROM eq_auditoria WHERE entidade = 'unidade' AND entidade_id = ? AND acao = 'editar' ORDER BY id DESC LIMIT 1", [(string) $uId]), true)['grandeza'] === 'comprimento');
// B, com a MESMA fotografia S0, manda só um nome novo (o formulário dela ainda tem a grandeza antiga) → 409
$eB = $erro(fn() => $admB->salvarUnidade(['id' => $uId, 'nome' => 'centímetro (B)', 'grandeza' => 'comprimento', 'antes' => $s0]));
$ok('071: B com fotografia S0 depois de A → 409 CONFLICT com o campo que mudou', $eB?->http === 409 && $eB->codigo === 'CONFLICT' && $eB->campos === ['grandeza'] && str_starts_with($eB->getMessage(), 'A unidade foi alterada desde que você abriu: grandeza'), $eB ? $eB->getMessage() . ' ' . json_encode($eB->campos) : 'sem erro');
$ok('071: banco = grandeza de A, nome sem mudança', $uRow()['grandeza'] === 'comprimento_linear' && $uRow()['nome'] === 'centímetro');
$ok('071: auditoria continua com UMA linha "editar" (a de A); nenhuma de B', $audit('unidade', (string) $uId, 'editar') === $aud0 + 1
    && (int) $um("SELECT COUNT(*) FROM eq_auditoria WHERE entidade = 'unidade' AND usuario = 'outra@exemplo.invalid'") === 0);
// repetição de A (reenvio) com S0 → sem_mudanca, auditoria igual
$rA2 = $adm->salvarUnidade(['id' => $uId, 'nome' => 'centímetro', 'grandeza' => 'comprimento_linear', 'antes' => $s0]);
$ok('071: repetição de A com S0 → sem_mudanca, auditoria igual', !empty($rA2['sem_mudanca']) && $audit('unidade', (string) $uId, 'editar') === $aud0 + 1);
// fotografia certa (S1) sem mudança → sem_mudanca (sem 409)
$s1 = $uRow();
$rS = $erro(fn() => $ok('071: fotografia certa sem mudança → sem_mudanca', !empty($adm->salvarUnidade(['id' => $uId, 'nome' => 'centímetro', 'grandeza' => 'comprimento_linear', 'antes' => $s1])['sem_mudanca'])));
$ok('071: fotografia certa sem mudança não dá 409 nem audita', $rS === null && $audit('unidade', (string) $uId, 'editar') === $aud0 + 1);
// fator "0,01" na fotografia × 0.010000000000 gravado → aceito (mesmo valor decimal)
$rF = $erro(fn() => $adm->salvarUnidade(['id' => $uId, 'nome' => 'centímetros', 'grandeza' => 'comprimento_linear', 'antes' => ['nome' => 'centímetro', 'grandeza' => 'comprimento_linear', 'fator_base' => '0,01']]));
$ok('071: fotografia com fator "0,01" × 0.010000000000 gravado → aceito e gravado', $rF === null && $uRow()['nome'] === 'centímetros' && $audit('unidade', (string) $uId, 'editar') === $aud0 + 2, $rF?->getMessage() ?? '');
// edição normal (fator) → grava + 1 auditoria
$s2 = $uRow();
$adm->salvarUnidade(['id' => $uId, 'nome' => 'centímetros', 'grandeza' => 'comprimento_linear', 'fator_base' => '0.0100001', 'antes' => $s2]);
$ok('071: edição normal (fator novo) grava + 1 auditoria', (string) $uRow()['fator_base'] === '0.010000100000' && $audit('unidade', (string) $uId, 'editar') === $aud0 + 3, json_encode($uRow()));
// fator igual por valor ("0.0100001" × 0.010000100000) com fotografia certa → sem_mudanca
$ok('071: fator igual por valor → sem_mudanca', !empty($adm->salvarUnidade(['id' => $uId, 'nome' => 'centímetros', 'grandeza' => 'comprimento_linear', 'fator_base' => '0.0100001', 'antes' => $uRow()])['sem_mudanca']) && $audit('unidade', (string) $uId, 'editar') === $aud0 + 3);
// fotografia velha só no fator (alguém mudou o fator) e pedido diferente → 409 com campo fator_base
$e3 = $erro(fn() => $adm->salvarUnidade(['id' => $uId, 'nome' => 'cm (C)', 'grandeza' => 'comprimento_linear', 'antes' => array_merge($s1, ['nome' => 'centímetros'])]));
$ok('071: fotografia com fator velho → 409 com campo fator_base, nada gravado', $e3?->http === 409 && $e3->campos === ['fator_base'] && $uRow()['nome'] === 'centímetros' && $audit('unidade', (string) $uId, 'editar') === $aud0 + 3, $e3 ? json_encode($e3->campos) : 'sem erro');
// fotografia malformada → 422
$ok('071: fotografia malformada → 422 (campo antes)', fn() => $erro(fn() => $adm->salvarUnidade(['id' => $uId, 'nome' => 'x', 'grandeza' => null, 'antes' => ['grandeza' => 'x']]))?->campos === ['antes']);
// grandeza null na fotografia ≡ '' gravado
$adm->salvarUnidade(['id' => $uId, 'nome' => 'centímetros', 'grandeza' => null, 'antes' => $uRow()]);
$ok('071: grandeza null ≡ \'\' (fotografia null contra banco null/\'\') → sem 409', fn() => !empty($adm->salvarUnidade(['id' => $uId, 'nome' => 'centímetros', 'grandeza' => '', 'antes' => ['nome' => 'centímetros', 'grandeza' => '', 'fator_base' => $uRow()['fator_base']]])['sem_mudanca']));
// sem `antes` no corpo → comportamento antigo (cargas.php e bundle antigo): grava o que veio, mesmo sem fotografia
$audAntes = $audit('unidade', (string) $uId, 'editar');
$adm->salvarUnidade(['id' => $uId, 'nome' => 'centímetro', 'grandeza' => 'comprimento']);
$ok('071: sem "antes" → caminho antigo (grava e audita uma vez)', $uRow()['nome'] === 'centímetro' && $uRow()['grandeza'] === 'comprimento' && $audit('unidade', (string) $uId, 'editar') === $audAntes + 1);
$ok('071: sem "antes" e nada mudou → sem_mudanca (antigo)', !empty($adm->salvarUnidade(['id' => $uId, 'nome' => 'centímetro', 'grandeza' => 'comprimento'])['sem_mudanca']) && $audit('unidade', (string) $uId, 'editar') === $audAntes + 1);
// repositório sem a interface de trava (RepoMemoria dos testes de unidade) → caminho antigo, sem erro
$mem = new RepoMemoria(); $memSvc = new AtributosService($mem, 80, 'admin@exemplo.invalid', $cat);
$mid = (int) $memSvc->criarUnidade(['simbolo' => 'kg', 'nome' => 'quilo', 'grandeza' => 'massa'])['id'];
$ok('071: RepoMemoria (sem UnidadesComTrava) com "antes" segue o caminho antigo', fn() => empty($memSvc->salvarUnidade(['id' => $mid, 'nome' => 'quilograma', 'grandeza' => 'massa', 'antes' => ['nome' => 'velho', 'grandeza' => 'x', 'fator_base' => null]])['sem_mudanca']) && $mem->unidade($mid)['nome'] === 'quilograma');

// =========================================================================================================================================
// DSHOW-064 · Itens do kit (regressão do servidor): kit_itens com a versão R1 depois de B gravar R2 → 409, Y vivo, sem auditoria de A
// =========================================================================================================================================
$kitsB = new KitsService($repo, 80, 'outra@exemplo.invalid', $cat);
$atr = [];
foreach (['Comprimento', 'Cor', 'Vias', 'Malha'] as $rot) $atr[$rot] = (int) $adm->salvarAtributo(['rotulo' => $rot, 'tipo' => 'texto'])['atributo']['id'];
$it = fn(array $ids) => array_map(fn($i, $aid) => ['atributo_id' => $aid, 'posicao' => $i + 1, 'obrigatorio' => 0, 'visivel' => 1, 'destaque' => 0, 'importancia' => null, 'unidade_id' => null], array_keys($ids), $ids);
$k64 = (int) $kits->salvarKit(['nome' => 'Kit 064'])['kit']['id'];
$kits->definirItens(['id' => $k64, 'versao' => (int) $repo->grupo($k64)['versao'], 'itens' => $it([$atr['Comprimento']])]);
$r1 = (int) $repo->grupo($k64)['versao'];
$kitsB->definirItens(['id' => $k64, 'versao' => $r1, 'itens' => $it([$atr['Comprimento'], $atr['Cor']])]);   // B acrescenta Y (Cor) → R2
$r2 = (int) $repo->grupo($k64)['versao'];
$audItens = $audit('kit', (string) $k64, 'itens');
$e64 = $erro(fn() => $kits->definirItens(['id' => $k64, 'versao' => $r1, 'itens' => $it([$atr['Comprimento'], $atr['Vias']])]));
$ok('064: A com a versão R1 depois de B gravar R2 → 409', $e64?->http === 409);
$ok('064: Y (de B) continua vivo e o item de A não entrou', (int) $um('SELECT COUNT(*) FROM eq_grupo_atributo WHERE grupo_id = ? AND atributo_id = ? AND excluido_em IS NULL', [$k64, $atr['Cor']]) === 1
    && (int) $um('SELECT COUNT(*) FROM eq_grupo_atributo WHERE grupo_id = ? AND atributo_id = ?', [$k64, $atr['Vias']]) === 0);
$ok('064: nenhuma auditoria "itens" de A; versão do kit igual a R2', $audit('kit', (string) $k64, 'itens') === $audItens && (int) $repo->grupo($k64)['versao'] === $r2 && $r2 === $r1 + 1);

// =========================================================================================================================================
// DSHOW-070 · Renomear opção com o rótulo velho: rotulo_atual X quando o gravado é Y → 409, Y no banco, sem auditoria "renomear" nova
// =========================================================================================================================================
$aOp = (int) $adm->salvarAtributo(['rotulo' => 'Acabamento', 'tipo' => 'opcao'])['atributo']['id'];
$ops = $adm->adicionarOpcao($aOp, 'Preto')['opcoes'];
$opId = (int) array_column($ops, 'id', 'rotulo')['Preto'];
$admB->renomearOpcao($opId, 'Grafite', 'Preto');                                       // B renomeia X → Y
$audRen = $audit('opcao', (string) $opId, 'renomear');
$e70 = $erro(fn() => $adm->renomearOpcao($opId, 'Preto fosco', 'Preto'));               // A, com o rascunho aberto antes, manda rotulo_atual X
$ok('070: rotulo_atual X com o gravado Y → 409', $e70?->http === 409 && $e70->codigo === 'CONFLICT');
$ok('070: banco continua com Y', (string) $um('SELECT rotulo FROM eq_opcao WHERE id = ?', [$opId]) === 'Grafite');
$ok('070: nenhuma auditoria "renomear" nova', $audit('opcao', (string) $opId, 'renomear') === $audRen && $audRen === 1);

// =========================================================================================================================================
// DSHOW-065 · Escopo + "aplica a todos" numa ÚNICA transação: falha na 2ª parte (trava REAL de outra conexão → 1205) não deixa nada
// =========================================================================================================================================
$k65 = (int) $kits->salvarKit(['nome' => 'Kit 065'])['kit']['id'];
$kits->definirEscopos(['id' => $k65, 'versao' => (int) $repo->grupo($k65)['versao'], 'escopos' => [['categoria' => 'LED_PANEL', 'subcategoria' => 'CABLE']]]);
$g65 = fn() => $linha('SELECT aplica_a_todos, versao FROM eq_grupo WHERE id = ?', [$k65]);
$esc65 = fn() => (string) $um("SELECT GROUP_CONCAT(CONCAT(categoria, '|', subcategoria) ORDER BY categoria, subcategoria) FROM eq_grupo_escopo WHERE grupo_id = ? AND excluido_em IS NULL", [$k65]);
$ini65 = [$g65(), $esc65(), $auditTotal()];
$v65 = (int) $ini65[0]['versao'];
$pedido65 = ['id' => $k65, 'versao' => $v65, 'escopos' => [['categoria' => 'LED_PANEL', 'subcategoria' => 'CABLE'], ['categoria' => 'LED_PANEL', 'subcategoria' => 'POWER_SUPPLY']], 'aplica_a_todos' => 1];
$pdo2 = $conectar();
$pdo2->beginTransaction();
$st2 = $pdo2->prepare('SELECT grupo_id, categoria, subcategoria FROM eq_grupo_escopo WHERE grupo_id = ? FOR UPDATE'); $st2->execute([$k65]); $st2->fetchAll();   // conexão 2 segura o escopo
$pdo->exec('SET SESSION innodb_lock_wait_timeout = 1');
$t0 = microtime(true);
$e65 = $erro(fn() => $kits->definirEscopos($pedido65));
$pdo->exec('SET SESSION innodb_lock_wait_timeout = 50');
$pdo2->rollBack(); $pdo2 = null;
$ok('065: flag + lista com o escopo travado por outra conexão → 1205 → 409', $e65?->http === 409 && microtime(true) - $t0 >= 0.9, $e65 ? $e65->getMessage() : 'sem erro');
$ok('065: nada gravado — "aplica a todos", versão e escopo IGUAIS ao inicial', $g65() == $ini65[0] && $esc65() === $ini65[1], json_encode([$g65(), $esc65()]));
$ok('065: contagem de eq_auditoria IGUAL à inicial', $auditTotal() === $ini65[2]);
// controle: os dois juntos, sem trava → versão +1 (UMA vez), UMA auditoria com antes/depois {aplica_a_todos, escopos}
$kits->definirEscopos($pedido65);
$ok('065: controle — flag e escopo gravados juntos, versão +1', (int) $g65()['aplica_a_todos'] === 1 && (int) $g65()['versao'] === $v65 + 1 && $esc65() === 'LED_PANEL|CABLE,LED_PANEL|POWER_SUPPLY', json_encode([$g65(), $esc65()]));
$a65 = $linha("SELECT antes, depois FROM eq_auditoria WHERE entidade = 'kit' AND entidade_id = ? AND acao = 'escopos' ORDER BY id DESC LIMIT 1", [(string) $k65]);
$ok('065: controle — UMA auditoria "escopos" com {aplica_a_todos, escopos}', $auditTotal() === $ini65[2] + 1
    && json_decode((string) $a65['antes'], true)['aplica_a_todos'] === 0 && json_decode((string) $a65['depois'], true)['aplica_a_todos'] === 1 && count(json_decode((string) $a65['depois'], true)['escopos']) === 2);
$ok('065: versão velha → 409 antes de tocar o escopo', fn() => $erro(fn() => $kits->definirEscopos(['versao' => $v65] + $pedido65))?->http === 409 && $esc65() === 'LED_PANEL|CABLE,LED_PANEL|POWER_SUPPLY');
// forma antiga (sem a flag): continua aceita e não mexe no "aplica a todos"
$kits->definirEscopos(['id' => $k65, 'versao' => (int) $g65()['versao'], 'escopos' => [['categoria' => 'LED_PANEL', 'subcategoria' => 'CABLE']]]);
$ok('065: forma antiga sem a flag → grava o escopo, "aplica a todos" intacto, versão +1', (int) $g65()['aplica_a_todos'] === 1 && (int) $g65()['versao'] === $v65 + 2 && $esc65() === 'LED_PANEL|CABLE');
$dup = $kits->duplicarKit(['id' => $k65, 'nome' => 'Kit 065 (cópia)', 'com_escopos' => 1])['kit'];
$ok('065: duplicarKit com escopos continua funcionando', count($dup['escopos']) === 1);

// =========================================================================================================================================
// Vincular · ações opostas: kit em aplicar E remover (ou atributo em incluir E excluir) → 422 na prévia e no aplicar, nada gravado
// =========================================================================================================================================
$kT = (int) $kits->salvarKit(['nome' => 'Totens'])['kit']['id'];
$kits->definirItens(['id' => $kT, 'versao' => (int) $repo->grupo($kT)['versao'], 'itens' => $it([$atr['Cor'], $atr['Malha']])]);
$kits->definirKitDoProduto(['product_id' => 101, 'grupo_id' => $kT, 'ativo' => 1, 'versao_vinculos' => $repo->versoesVinculos([101])[101]]);
$fotoV = fn() => [(int) $um('SELECT COUNT(*) FROM eq_grupo_produto'), (string) $um("SELECT COALESCE(GROUP_CONCAT(CONCAT(grupo_id, ':', product_id, ':', excluido_em IS NULL, ':', versao) ORDER BY id), '') FROM eq_grupo_produto"),
    (int) $um('SELECT COUNT(*) FROM eq_produto_atributo'), (int) $um('SELECT COUNT(*) FROM eq_pedido_massa'), $auditTotal(), $repo->versoesVinculos([101, 102])];
$v0 = $fotoV();
$hexFalso = str_repeat('a', 64);
$amb = ['produtos' => [101, 102], 'kits_aplicar' => [$kT], 'kits_remover' => [$kT]];
$ePv = $erro(fn() => $kits->previaMassa($amb));
$ok('vincular: prévia com o kit nos dois lados → 422 com os campos e o nome do kit', $ePv?->http === 422 && $ePv->codigo === 'VALIDATION_ERROR' && $ePv->campos === ['kits_aplicar', 'kits_remover']
    && $ePv->getMessage() === 'O kit Totens está marcado para aplicar e remover. Escolha uma ação.', $ePv ? $ePv->getMessage() . ' ' . json_encode($ePv->campos) : 'sem erro');
$eAp = $erro(fn() => $kits->aplicarMassa($amb + ['chave' => 'opostos-kit-0001', 'versao_previa' => $hexFalso]));
$ok('vincular: aplicar com o kit nos dois lados → 422', $eAp?->http === 422 && $eAp->campos === ['kits_aplicar', 'kits_remover']);
$ok('vincular: nada mudou (vínculos, ajustes, pedidos em massa, auditoria, versões)', $fotoV() === $v0, json_encode([$fotoV(), $v0]));
$ambA = ['produtos' => [101], 'atributos_incluir' => [['atributo_id' => $atr['Vias']]], 'atributos_excluir' => [['atributo_id' => $atr['Vias'], 'motivo' => 'teste de oposto']]];
$ePa = $erro(fn() => $kits->previaMassa($ambA));
$ok('vincular: prévia com o atributo em incluir e excluir → 422 com o rótulo', $ePa?->http === 422 && $ePa->campos === ['atributos_incluir', 'atributos_excluir'] && $ePa->getMessage() === 'O atributo Vias está marcado para incluir e excluir. Escolha uma ação.', $ePa ? $ePa->getMessage() : 'sem erro');
$ok('vincular: aplicar com o atributo nos dois lados → 422', fn() => $erro(fn() => $kits->aplicarMassa($ambA + ['chave' => 'opostos-atr-0001', 'versao_previa' => $hexFalso]))?->http === 422);
$ok('vincular: nada mudou depois dos atributos opostos', $fotoV() === $v0);
// chave já gravada (recibo anterior ao hotfix com o pedido ambíguo) continua "repetido" — o recibo é consultado antes da recusa
$intAmb = ['produtos' => [101, 102], 'kits_aplicar' => [$kT], 'kits_remover' => [$kT], 'atributos_incluir' => [], 'atributos_excluir' => []];
$repo->registrarPedidoMassa('recibo-antigo-0001', hash('sha256', json_encode($intAmb)), 'admin@exemplo.invalid', 2);
$repo->concluirPedidoMassa('recibo-antigo-0001', ['gravado' => ['kits_aplicados' => 0, 'kits_removidos' => 0, 'inclusoes' => 0, 'exclusoes' => 0]]);
$rRep = $kits->aplicarMassa($amb + ['chave' => 'recibo-antigo-0001', 'versao_previa' => $hexFalso]);
$ok('vincular: chave já gravada continua "repetido" (sem 422, sem gravar)', !empty($rRep['repetido']) && $auditTotal() === $v0[4], json_encode($rRep));
// controle: aplicar o kit K E excluir um atributo DE K nos mesmos produtos continua permitido
$okCtl = ['produtos' => [102], 'kits_aplicar' => [$kT], 'atributos_excluir' => [['atributo_id' => $atr['Malha'], 'motivo' => 'sem malha neste produto']]];
$pvC = $kits->previaMassa($okCtl);
$rC = $kits->aplicarMassa($okCtl + ['chave' => 'controle-opostos-01', 'versao_previa' => $pvC['versao_previa']]);
$ok('vincular: controle — aplicar K + excluir atributo de K grava (1 kit, 1 exceção)', ($rC['gravado']['kits_aplicados'] ?? -1) === 1 && ($rC['gravado']['exclusoes'] ?? -1) === 1
    && (int) $um('SELECT COUNT(*) FROM eq_grupo_produto WHERE grupo_id = ? AND product_id = 102 AND excluido_em IS NULL', [$kT]) === 1, json_encode($rC));
// DSHOW-084 (i): segunda tentativa contraditória com OUTRA chave nova (K2) depois da K1 → 422, nada gravado
// (fotografia nova: depois do recibo antigo e do controle o banco mudou de propósito; $v0 vale só até ali)
$v1 = $fotoV();
$eAp2 = $erro(fn() => $kits->aplicarMassa($amb + ['chave' => 'opostos-kit-0002', 'versao_previa' => $hexFalso]));
$ok('084: K2 (chave nova) com o kit nos dois lados depois de K1 → 422', $eAp2?->http === 422 && $eAp2->campos === ['kits_aplicar', 'kits_remover'], $eAp2 ? $eAp2->getMessage() : 'sem erro');
$ok('084: K2 não gravou nada (vínculos, ajustes, pedidos em massa, auditoria, versões)', $fotoV() === $v1, json_encode([$fotoV(), $v1]));
$ok('084: nenhuma linha em eq_pedido_massa para opostos-kit-0001 nem opostos-kit-0002', (int) $um("SELECT COUNT(*) FROM eq_pedido_massa WHERE chave IN ('opostos-kit-0001', 'opostos-kit-0002')") === 0);
// DSHOW-084 (ii): replay do recibo LEGÍTIMO do controle → "repetido", mesma resposta, nenhuma gravação nova
$v2 = $fotoV();
$rC2 = $kits->aplicarMassa($okCtl + ['chave' => 'controle-opostos-01', 'versao_previa' => $pvC['versao_previa']]);
$ordena = function (array $a) use (&$ordena): array { ksort($a); foreach ($a as $k => $v) if (is_array($v)) $a[$k] = $ordena($v); return $a; };   // o recibo vem de coluna JSON (MySQL reordena as chaves)
$ok('084: replay do controle → repetido com a mesma resposta (gravado/resumo/assinatura)', !empty($rC2['repetido']) && $ordena(array_diff_key($rC2, ['repetido' => 1])) === $ordena($rC), json_encode([$rC2, $rC]));
$ok('084: replay do controle não grava (auditoria, vínculos, ajustes, pedidos em massa, versões iguais)', $fotoV() === $v2, json_encode([$fotoV(), $v2]));

// @@FIM@@
echo ($falhas === 0 ? '[OK]  ' : '[FALHA]') . " hotfix-integridade-mysql (071 unidades · 064 itens · 070 opção · 065 escopo · vincular opostos): $n casos, $falhas falha(s)\n";
exit($falhas === 0 ? 0 : 1);
