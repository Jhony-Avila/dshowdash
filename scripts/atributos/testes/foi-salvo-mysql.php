<?php
// Produtos & Atributos — "FOI SALVO OU NÃO" (18/11, ESQUERDA): teste de BANCO REAL do contrato docs/atributos/CONTRATO-FOI-SALVO.md.
// Para cada item: PAYLOAD (o que a rota devolve) + PERSISTIDO (o banco) + AUDITORIA. Itens: recibo/desfechos/chave de operação/conferir
// (confirmação válida + DSHOW-068 servidor), gravado×releitura falhou (DSHOW-090 e genérico), DSHOW-066 (histórico filtrado antes do limite),
// DSHOW-085 (lote incerto: mesma chave devolve o recibo sem revalidar; conferir), DSHOW-086 (recibo por titular estável), DSHOW-079 P2
// (gravavel pela MESMA regra da gravação). Schema ATRWEB_VAL_T_7/_8/_9 VAZIO com as migrações 001–011 aplicadas (molde do
// hotfix-integridade-mysql.php). Catálogo falso em memória. Entradas: EQ_TEST_CNF e EQ_TEST_DB. Saída: 0 verde · 1 falha · 2 não executado · 3 recusado.
// Contraprova: o MESMO arquivo rodado num worktree de 6738adb3 (com a 011 copiada) falha nos itens (o código anterior não tem o contrato).
declare(strict_types=1);
require_once __DIR__ . '/../../../api/atributos/AtributosRepo.php';
require_once __DIR__ . '/../../../api/atributos/KitsService.php';
require_once __DIR__ . '/../../../api/atributos/ProdutosLeitura.php';
require_once __DIR__ . '/../../../api/atributos/LeituraVitrinePdo.php';
require_once __DIR__ . '/../../../api/atributos/CatalogoPdo.php';
require_once __DIR__ . '/_memoria.php';

[$cnf, $db] = [(string) (getenv('EQ_TEST_CNF') ?: ''), (string) (getenv('EQ_TEST_DB') ?: '')];
$dir = __DIR__ . '/../../../db/equipamentos/migrations';
if ($cnf === '' || $db === '' || !is_readable($cnf)) { echo "[NÃO EXECUTADO] foi-salvo-mysql: faltam EQ_TEST_CNF/EQ_TEST_DB\n"; exit(2); }
if (!in_array($db, ['ATRWEB_VAL_T_7', 'ATRWEB_VAL_T_8', 'ATRWEB_VAL_T_9'], true)) { echo "[RECUSADO] foi-salvo-mysql: só ATRWEB_VAL_T_7, _T_8 ou _T_9\n"; exit(3); }
$ini = parse_ini_file($cnf, true, INI_SCANNER_RAW) ?: []; $c = $ini['client'] ?? [];
$tira = fn($v) => trim((string) $v, " \t\"'");
$dsn = 'mysql:' . (isset($c['socket']) ? 'unix_socket=' . $tira($c['socket']) : 'host=' . $tira($c['host'] ?? '127.0.0.1') . ';port=' . (int) ($c['port'] ?? 3306)) . ";dbname=$db;charset=utf8mb4";
try { $pdo = new PDO($dsn, $tira($c['user'] ?? ''), $tira($c['password'] ?? ''), [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]); }
catch (PDOException $e) { echo '[ERRO] foi-salvo-mysql: conexão recusada (código ' . $e->getCode() . ")\n"; exit(1); }
if ((string) $pdo->query('SELECT DATABASE()')->fetchColumn() !== $db) { echo "[RECUSADO] foi-salvo-mysql: a conexão não está em $db\n"; exit(3); }
if ((int) $pdo->query('SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE()')->fetchColumn() !== 0) { echo "[RECUSADO] foi-salvo-mysql: $db não está vazio\n"; exit(3); }
$arqs = array_values(array_filter(glob("$dir/[0-9][0-9][0-9]_*.sql") ?: [], static fn($f) => !str_ends_with($f, '.revert.sql'))); sort($arqs, SORT_STRING);
foreach ($arqs as $arq) foreach (preg_split('/;\s*\n/', (string) preg_replace('/^--.*$/m', '', (string) file_get_contents($arq))) ?: [] as $st) {
    $st = trim($st); if ($st === '') continue;
    if (!preg_match('/^(CREATE TABLE IF NOT EXISTS|ALTER TABLE|INSERT (IGNORE )?INTO|UPDATE) `eq_[a-z_]+`/i', $st)) { echo '[RECUSADO] foi-salvo-mysql: comando fora da lista em ' . basename($arq) . "\n"; exit(3); }
    $pdo->exec(rtrim($st, ';'));
}

$falhas = 0; $n = 0;
$ok = function (string $nome, bool|Closure $cond, string $det = '') use (&$falhas, &$n): void {
    $n++; $msg = '';
    if ($cond instanceof Closure) { try { $cond = (bool) $cond(); } catch (Throwable $t) { $cond = false; $msg = ' (exceção: ' . get_class($t) . ' ' . $t->getMessage() . ')'; } }
    if (!$cond) { $falhas++; echo "[ERRO] $nome$msg" . ($det !== '' ? "\n       $det" : '') . "\n"; }
};
$erro = function (callable $f): ?Throwable { try { $f(); } catch (Throwable $e) { return $e; } return null; };
$um = fn(string $sql, array $p = []) => (function () use ($pdo, $sql, $p) { $s = $pdo->prepare($sql); $s->execute($p); return $s->fetchColumn(); })();
$linha = fn(string $sql, array $p = []) => (function () use ($pdo, $sql, $p) { $s = $pdo->prepare($sql); $s->execute($p); return $s->fetch(PDO::FETCH_ASSOC); })();
$audit = fn(string $ent, string $like) => (int) $um('SELECT COUNT(*) FROM eq_auditoria WHERE entidade = ? AND entidade_id LIKE ?', [$ent, $like]);
$temContrato = class_exists('OperacoesGravacao');
$ok('011 aplicada (eq_operacao e eq_pedido_massa.titular_id)', (int) $um("SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'eq_pedido_massa' AND COLUMN_NAME = 'titular_id'") === 1);
$ok('contrato presente no código (OperacoesGravacao)', $temContrato);

// ---- catálogo falso (101–103 cabos) + catálogo que "cai" sob condição (DSHOW-090) -------------------------------------------------------
$cat = new CatalogoMemoria();
foreach ([[101, 'CABLE'], [102, 'CABLE'], [103, 'CABLE'], [104, 'CABLE']] as [$id, $sub])
    $cat->p[$id] = ['id' => $id, 'nome' => "Produto $id (sintético)", 'categoria' => 'LED_PANEL', 'subcategoria' => $sub, 'ativo' => true, 'excluido' => false, 'sincronizado_em' => null];
final class CatalogoQueCai implements CatalogoProdutos
{
    public ?Closure $cair = null;
    public function __construct(private readonly CatalogoMemoria $m) {}
    private function talvez(): void { if ($this->cair && ($this->cair)()) throw new CatalogoIndisponivel('caiu (teste)'); }
    public function produto(int $id): ?array { $this->talvez(); return $this->m->produto($id); }
    public function buscar(?string $q, int $l): array { $this->talvez(); return $this->m->buscar($q, $l); }
    public function categorias(): array { return $this->m->categorias(); }
    public function contar(string $c, string $s): int { return $this->m->contar($c, $s); }
    public function specs(int $pid, string $kind): ?array { return $this->m->specs($pid, $kind); }
}
$catCai = new CatalogoQueCai($cat);

$repo = new AtributosRepoPdo($pdo, '');
$A = ['id' => 1001, 'email' => 'admin@exemplo.invalid']; $B = ['id' => 1002, 'email' => 'outra@exemplo.invalid']; $C = ['id' => 1003, 'email' => 'admin@exemplo.invalid'];   // C: mesmo e-mail de A, outra identidade
$adm = new AtributosService($repo, 80, $A['email'], $cat);
$admCai = new AtributosService($repo, 80, $A['email'], $catCai);
$kitsDe = fn(array $u) => new KitsService($repo, 80, $u['email'], $cat, null, $u['id']);
$kits = $kitsDe($A);
$opsDe = fn(array $u) => $temContrato ? new OperacoesGravacao($repo, $u['id'], $u['email']) : null;
$opsA = $opsDe($A); $opsB = $opsDe($B);

// ---- modelo: unidades, atributos, kit nos cabos ---------------------------------------------------------------------------------------
$us = $adm->criarUnidade(['simbolo' => 'm', 'nome' => 'metro', 'grandeza' => 'comprimento', 'fator_base' => '1']);
foreach ([['cm', 'centímetro', 'comprimento', '0.01'], ['mm', 'milímetro', 'comprimento', '0.001'], ['pol', 'polegada', 'comprimento', '0.0254'], ['kg', 'quilo', 'massa', '1']] as [$s, $nm, $g, $f])
    $us = $adm->criarUnidade(['simbolo' => $s, 'nome' => $nm, 'grandeza' => $g, 'fator_base' => $f]);
$U = array_map('intval', array_column($us['unidades'], 'id', 'simbolo'));
$atr = [];
foreach ([['Largura', 'numero', $U['cm']], ['Cor', 'texto', null], ['Vias', 'inteiro', null]] as [$r, $t, $un]) $atr[$r] = (int) $adm->salvarAtributo(['rotulo' => $r, 'tipo' => $t, 'unidade_id' => $un, 'casas' => $t === 'numero' ? 2 : null])['atributo']['id'];
$kid = (int) $kits->salvarKit(['nome' => 'Cabos (foi salvo)'])['kit']['id'];
$kits->definirItens(['id' => $kid, 'versao' => (int) $repo->grupo($kid)['versao'], 'itens' => array_map(fn($i, $aid) => ['atributo_id' => $aid, 'posicao' => $i + 1, 'obrigatorio' => 0, 'visivel' => 1, 'destaque' => 0, 'importancia' => null, 'unidade_id' => null], [0, 1, 2], [$atr['Largura'], $atr['Cor'], $atr['Vias']])]);
$kits->definirEscopos(['id' => $kid, 'versao' => (int) $repo->grupo($kid)['versao'], 'escopos' => [['categoria' => 'LED_PANEL', 'subcategoria' => 'CABLE']]]);
$valorRow = fn(int $pid, int $aid) => $linha('SELECT estado, valor_texto, valor_num, unidade_id, versao, excluido_em FROM eq_valor WHERE product_id = ? AND atributo_id = ? AND opcao_chave = 0', [$pid, $aid]);
$op = fn(string $k) => $linha('SELECT titular_id, rota, estado, recibo, erro, tentativas FROM eq_operacao WHERE chave = ?', [$k]);
$ex = fn(?OperacoesGravacao $o, string $rota, array $corpo, ?string $chave, callable $f) => $o ? $o->executar($rota, $corpo, $chave, $f) : throw new RuntimeException('sem OperacoesGravacao (código anterior)');

// =========================================================================================================================================
// 1 · CONFIRMAÇÃO VÁLIDA + CHAVE DE OPERAÇÃO na gravação de célula (DSHOW-068 servidor): aplicada · reenvio = recibo original · conferir
// =========================================================================================================================================
$corpo = ['product_id' => 101, 'atributo_id' => $atr['Largura'], 'valor' => '12.5', 'unidade_id' => $U['mm']];
$audV0 = $audit('valor', "101:{$atr['Largura']}:%");
$r1 = null; $e1 = $erro(function () use (&$r1, $ex, $opsA, $adm, $corpo) { $r1 = $ex($opsA, 'valor', $corpo, 'k-valor-0001', fn(array $c) => $adm->gravarValor($c)); });
$v1 = $valorRow(101, $atr['Largura']);
$ok('1 payload: desfecho aplicada + recibo com versão nova, eco do valor e unidade', $e1 === null && ($r1['desfecho'] ?? null) === 'aplicada' && ($r1['recibo']['operacao'] ?? null) === 'valor'
    && ($r1['recibo']['chave'] ?? null) === 'k-valor-0001' && (int) ($r1['recibo']['versao_nova'] ?? -1) === (int) $v1['versao'] && ($r1['recibo']['unidade_id'] ?? null) === $U['mm']
    && (float) ($r1['recibo']['valor']['valor_num'] ?? 0) === 12.5 && in_array('valor_num', $r1['recibo']['campos_gravados'] ?? [], true), json_encode($r1) . ' ' . ($e1?->getMessage() ?? ''));
$ok('1 persistido: eq_valor = recibo (12.5 mm, versão)', $v1 && (float) $v1['valor_num'] === 12.5 && (int) $v1['unidade_id'] === $U['mm']);
$ok('1 auditoria: +1 "preencher"', $audit('valor', "101:{$atr['Largura']}:%") === $audV0 + 1);
$ok('1 recibo guardado: eq_operacao aplicada, titular estável, recibo igual', fn() => ($o = $op('k-valor-0001')) && $o['estado'] === 'aplicada' && (int) $o['titular_id'] === $A['id'] && json_decode($o['recibo'], true)['versao_nova'] === $r1['recibo']['versao_nova']);
$r1b = null; $e1b = $erro(function () use (&$r1b, $ex, $opsA, $adm, $corpo) { $r1b = $ex($opsA, 'valor', $corpo, 'k-valor-0001', fn(array $c) => throw new LogicException('não pode executar de novo')); });
$ok('1 reenvio da MESMA chave: recibo ORIGINAL, repetido, sem executar', $e1b === null && ($r1b['repetido'] ?? false) === true && ($r1b['recibo'] ?? null) == ($r1['recibo'] ?? 'x'), json_encode($r1b) . ' ' . ($e1b?->getMessage() ?? ''));
$ok('1 reenvio: nada novo no banco nem na auditoria', (int) $valorRow(101, $atr['Largura'])['versao'] === (int) $v1['versao'] && $audit('valor', "101:{$atr['Largura']}:%") === $audV0 + 1);
$e1c = $erro(fn() => $ex($opsA, 'valor', ['valor' => '99'] + $corpo, 'k-valor-0001', fn(array $c) => $adm->gravarValor($c)));
$ok('1 mesma chave com OUTRO pedido → 422 IDEMPOTENCY_KEY_REUSED, nada gravado', $e1c instanceof AtributosErro && $e1c->codigo === 'IDEMPOTENCY_KEY_REUSED' && (float) $valorRow(101, $atr['Largura'])['valor_num'] === 12.5);
$e1d = $erro(fn() => $ex($opsB, 'valor', $corpo, 'k-valor-0001', fn(array $c) => throw new LogicException('B não executa')));
$ok('1 mesma chave por OUTRO titular → 422 (não recebe o recibo de A)', $e1d instanceof AtributosErro && $e1d->codigo === 'IDEMPOTENCY_KEY_REUSED');
$ok('1 conferir (A): aplicada com o recibo, sem gravar', fn() => ($cf = $opsA->conferir('k-valor-0001')) && $cf['resultado'] === 'aplicada' && $cf['recibo'] == $r1['recibo'] && $audit('valor', "101:{$atr['Largura']}:%") === $audV0 + 1);
$ok('1 conferir (B, outra pessoa) e chave inexistente → nao_encontrada', fn() => $opsB->conferir('k-valor-0001')['resultado'] === 'nao_encontrada' && $opsA->conferir('k-nunca-usada')['resultado'] === 'nao_encontrada');
$ok('1 sem chave (chamador antigo): grava e devolve recibo, sem linha em eq_operacao', fn() => ($r = $opsA->executar('valor', ['valor' => '13', 'versao' => (int) $valorRow(101, $atr['Largura'])['versao']] + $corpo, null, fn(array $c) => $adm->gravarValor($c)))['desfecho'] === 'aplicada'
    && $r['recibo']['chave'] === null && (float) $valorRow(101, $atr['Largura'])['valor_num'] === 13.0 && (int) $um('SELECT COUNT(*) FROM eq_operacao') === 1);
$ok('1 chave malformada → 422 chave_operacao', fn() => ($e = $erro(function () { $c = ['chave_operacao' => 'curta']; OperacoesGravacao::chaveDoPedido($c, null); })) instanceof AtributosErro && $e->campos === ['chave_operacao']);

// ---- sem_mudanca · recusada (por campo) · conflito (com valor/versão/unidade atuais) --------------------------------------------------
$audV1 = $audit('valor', "101:{$atr['Largura']}:%"); $vv = (int) $valorRow(101, $atr['Largura'])['versao'];
$ok('2 sem_mudanca: mesmo valor → desfecho sem_mudanca, versão e auditoria iguais', fn() => ($r = $opsA->executar('valor', ['valor' => '13', 'versao' => $vv] + $corpo, 'k-valor-0002', fn(array $c) => $adm->gravarValor($c)))['desfecho'] === 'sem_mudanca'
    && $r['recibo']['desfecho'] === 'sem_mudanca' && (int) $valorRow(101, $atr['Largura'])['versao'] === $vv && $audit('valor', "101:{$atr['Largura']}:%") === $audV1 && $op('k-valor-0002')['estado'] === 'sem_mudanca');
$e3 = $erro(fn() => $ex($opsA, 'valor', ['product_id' => 101, 'atributo_id' => $atr['Largura'], 'valor' => '12 cm'], 'k-valor-0003', fn(array $c) => $adm->gravarValor($c)));
$ok('3 recusada: 422 com desfecho e motivo POR CAMPO; eq_operacao recusada; nada gravado', $e3 instanceof AtributosErro && $e3->http === 422 && ($e3->meta['desfecho'] ?? null) === 'recusada'
    && isset($e3->meta['motivos']['valor']) && $op('k-valor-0003')['estado'] === 'recusada' && (int) $valorRow(101, $atr['Largura'])['versao'] === $vv && $audit('valor', "101:{$atr['Largura']}:%") === $audV1, $e3 ? json_encode([$e3->getMessage(), $e3->meta]) : '');
$e4 = $erro(fn() => $ex($opsA, 'valor', ['product_id' => 101, 'atributo_id' => $atr['Largura'], 'valor' => '20', 'versao' => $vv - 1], 'k-valor-0004', fn(array $c) => $adm->gravarValor($c)));
$ok('4 conflito: 409 com desfecho conflito + valor, versão e unidade ATUAIS', $e4 instanceof AtributosErro && $e4->http === 409 && ($e4->meta['desfecho'] ?? null) === 'conflito'
    && (int) ($e4->meta['atual']['versao'] ?? -1) === $vv && (float) ($e4->meta['atual']['valores'][0]['valor_num'] ?? 0) === 13.0 && ($e4->meta['atual']['valores'][0]['unidade_id'] ?? null) === $U['mm'], $e4 ? json_encode($e4->meta) : '');
$ok('4 conflito: eq_operacao conflito; nada gravado', fn() => $op('k-valor-0004')['estado'] === 'conflito' && (int) $valorRow(101, $atr['Largura'])['versao'] === $vv);
$ok('4 reenvio da MESMA chave depois do conflito executa de novo (tentativas 2) e continua conflito', fn() => ($erro(fn() => $opsA->executar('valor', ['product_id' => 101, 'atributo_id' => $atr['Largura'], 'valor' => '20', 'versao' => $vv - 1], 'k-valor-0004', fn(array $c) => $adm->gravarValor($c)))?->http === 409) && (int) $op('k-valor-0004')['tentativas'] === 2);

// ---- em andamento × interrompida × atomicidade do recibo ------------------------------------------------------------------------------
$assin = $temContrato ? OperacoesGravacao::assinatura('valor', ['product_id' => 102, 'atributo_id' => $atr['Cor'], 'valor' => 'azul']) : '';
if ($temContrato) $repo->reservarOperacao('k-andamento-01', $A['id'], $A['email'], 'valor', $assin);   // outra requisição com a mesma chave "no meio"
$e5 = $erro(fn() => $ex($opsA, 'valor', ['product_id' => 102, 'atributo_id' => $atr['Cor'], 'valor' => 'azul'], 'k-andamento-01', fn(array $c) => $adm->gravarValor($c)));
$ok('5 em andamento: 409 OPERATION_IN_PROGRESS (desfecho em_andamento); conferir = em_andamento; nada gravado', $e5 instanceof AtributosErro && $e5->codigo === 'OPERATION_IN_PROGRESS'
    && ($e5->meta['desfecho'] ?? null) === 'em_andamento' && $opsA->conferir('k-andamento-01')['resultado'] === 'em_andamento' && $valorRow(102, $atr['Cor']) === false);
if ($temContrato) $pdo->exec("UPDATE eq_operacao SET atualizado_em = CURRENT_TIMESTAMP(3) - INTERVAL 10 MINUTE WHERE chave = 'k-andamento-01'");
$ok('5 parada há mais de 5 min = interrompida; reenvio executa e aplica', fn() => $opsA->conferir('k-andamento-01')['resultado'] === 'interrompida'
    && $opsA->executar('valor', ['product_id' => 102, 'atributo_id' => $atr['Cor'], 'valor' => 'azul'], 'k-andamento-01', fn(array $c) => $adm->gravarValor($c))['desfecho'] === 'aplicada'
    && $valorRow(102, $atr['Cor'])['valor_texto'] === 'azul' && $op('k-andamento-01')['estado'] === 'aplicada');
$audC0 = $audit('valor', "103:{$atr['Cor']}:%");
$e6 = $erro(fn() => $ex($opsA, 'valor', ['product_id' => 103, 'atributo_id' => $atr['Cor'], 'valor' => 'verde'], 'k-atomico-001', fn(array $c) => $repo->transacao(function () use ($adm, $c) { $adm->gravarValor($c); throw new RuntimeException('falha DENTRO da transação'); })));
$ok('6 atomicidade: falha dentro da transação → nada gravado, sem auditoria, recibo NÃO aplicada (falhou)', $e6 instanceof RuntimeException && $valorRow(103, $atr['Cor']) === false
    && $audit('valor', "103:{$atr['Cor']}:%") === $audC0 && $op('k-atomico-001')['estado'] === 'falhou' && $opsA->conferir('k-atomico-001')['resultado'] === 'nao_aplicada');
$r7 = null; $e7 = $erro(function () use (&$r7, $ex, $opsA, $adm, $atr) { $r7 = $ex($opsA, 'valor', ['product_id' => 103, 'atributo_id' => $atr['Vias'], 'valor' => '4'], 'k-depois-001', function (array $c) use ($adm) { $adm->gravarValor($c); throw new RuntimeException('releitura caiu DEPOIS do COMMIT'); }); });
$ok('7 gravado e erro DEPOIS do COMMIT: 200 gravado:true, releitura:falhou, recibo; nunca "não gravado"', $e7 === null && ($r7['gravado'] ?? null) === true && ($r7['releitura'] ?? null) === 'falhou'
    && ($r7['desfecho'] ?? null) === 'aplicada' && isset($r7['recibo']), json_encode($r7) . ' ' . ($e7?->getMessage() ?? ''));
$ok('7 persistido + auditoria + recibo aplicada; conferir = aplicada', fn() => (int) $um('SELECT valor_num FROM eq_valor WHERE product_id = 103 AND atributo_id = ?', [$atr['Vias']]) === 4
    && $audit('valor', "103:{$atr['Vias']}:%") === 1 && $op('k-depois-001')['estado'] === 'aplicada' && $opsA->conferir('k-depois-001')['resultado'] === 'aplicada');

// ---- recibo nas outras escritas (valor_limpar, vínculos, kit, dicionário, unidade, massa) --------------------------------------------
$vL = (int) $valorRow(102, $atr['Cor'])['versao'];
$ok('8 valor_limpar: recibo (excluido_em) + persistido + auditoria limpar', fn() => ($r = $opsA->executar('valor_limpar', ['product_id' => 102, 'atributo_id' => $atr['Cor'], 'versao' => $vL], 'k-limpar-0001', fn(array $c) => $adm->limparValor($c)))['recibo']['campos_gravados'] === ['excluido_em']
    && $valorRow(102, $atr['Cor'])['excluido_em'] !== null && $audit('valor', "102:{$atr['Cor']}:%") === 2);
$vv104 = $kits->versaoVinculosAtual(104);
$ok('8 produto_atributo: recibo com versao_nova = versao_vinculos e campos (modo) + linha viva + auditoria', fn() => ($r = $opsA->executar('produto_atributo', ['product_id' => 104, 'atributo_id' => $atr['Cor'], 'modo' => 'excluir', 'motivo' => 'teste', 'versao_vinculos' => $vv104], 'k-vinculo-001', fn(array $c) => $kits->definirAjuste($c)))['desfecho'] === 'aplicada'
    && $r['recibo']['versao_nova'] === $kits->versaoVinculosAtual(104) && in_array('modo', $r['recibo']['campos_gravados'], true)
    && (int) $um("SELECT COUNT(*) FROM eq_produto_atributo WHERE product_id = 104 AND atributo_id = ? AND modo = 'excluir' AND excluido_em IS NULL", [$atr['Cor']]) === 1 && $audit('produto_atributo', "104:{$atr['Cor']}") === 1);
$ok('8 kit (salvarKit): recibo com versão do kit + persistido', fn() => ($r = $opsA->executar('kit', ['nome' => 'Kit recibo'], 'k-kit-000001', fn(array $c) => $kits->salvarKit($c)))['desfecho'] === 'aplicada'
    && (int) $r['recibo']['versao_nova'] === (int) $um("SELECT versao FROM eq_grupo WHERE nome = 'Kit recibo'") && in_array('nome', $r['recibo']['campos_gravados'], true));
$ok('8 atributo (dicionário): recibo + persistido', fn() => ($r = $opsA->executar('atributo', ['rotulo' => 'Peso recibo', 'tipo' => 'texto'], 'k-atrib-00001', fn(array $c) => $adm->salvarAtributo($c)))['desfecho'] === 'aplicada'
    && (int) $r['recibo']['versao_nova'] === (int) $um("SELECT versao FROM eq_atributo WHERE rotulo = 'Peso recibo'"));
$ok('8 unidade_ativa repetida = sem_mudanca (BR-02) no recibo', fn() => $opsA->executar('unidade_ativa', ['id' => $U['m'], 'ativo' => true], 'k-unid-00001', fn(array $c) => $adm->definirUnidadeAtiva((int) $c['id'], (bool) $c['ativo']))['desfecho'] === 'sem_mudanca');

// =========================================================================================================================================
// DSHOW-090 · ficha_revisar: revisão GRAVADA e releitura que falha = "gravado, releitura falhou" (200), nunca erro de "não gravado"
// =========================================================================================================================================
$audR0 = $audit('ficha', '104');
$catCai->cair = fn() => (int) $um("SELECT COUNT(*) FROM eq_auditoria WHERE entidade = 'ficha' AND entidade_id = '104' AND acao = 'revisar'") > $audR0;   // cai DEPOIS do COMMIT da revisão
$r9 = null; $e9 = $erro(function () use (&$r9, $admCai) { $r9 = $admCai->revisarFicha(['product_id' => 104, 'motivo' => 'conferida']); });
$ok('090 payload: gravado:true, releitura:falhou, evento gravado (sem erro)', $e9 === null && ($r9['gravado'] ?? null) === true && ($r9['releitura'] ?? null) === 'falhou' && is_array($r9['revisao_gravada'] ?? null),
    $e9 ? get_class($e9) . ' ' . $e9->getMessage() : json_encode($r9));
$ok('090 persistido/auditoria: 1 evento "revisar" gravado', $audit('ficha', '104') === $audR0 + 1);
$catCai->cair = null;
$r9b = null; $e9b = $erro(function () use (&$r9b, $ex, $opsA, $admCai) { $r9b = $ex($opsA, 'ficha_revisar', ['product_id' => 104], 'k-revisar-001', fn(array $c) => $admCai->revisarFicha($c)); });
$ok('090 sem falha: ficha + gravado:true, releitura:ok + recibo com a revisão', $e9b === null && ($r9b['releitura'] ?? null) === 'ok' && ($r9b['recibo']['operacao'] ?? null) === 'ficha_revisar' && is_array($r9b['recibo']['revisao'] ?? null) && isset($r9b['grupos']), $e9b?->getMessage() ?? '');
$e9c = $erro(fn() => $admCai->revisarFicha(['product_id' => 999]));
$ok('090 "não gravado" continua erro (produto inexistente) e não grava evento', $e9c instanceof AtributosErro && $audit('ficha', '999') === 0);

// =========================================================================================================================================
// DSHOW-066 · histórico filtrado pelo atributo ANTES do limite de 300; falha distinguível (503) de "sem histórico"
// =========================================================================================================================================
for ($i = 0; $i < 305; $i++) $repo->auditar('ruido@exemplo.invalid', 'editar', 'valor', "101:{$atr['Cor']}:0", null, ['i' => $i], null);   // 305 eventos MAIS RECENTES de outro atributo
$leit = new ProdutosLeitura(new LeituraVitrinePdo($pdo, $db, $db), $repo, 80);
$h = null; $eh = $erro(function () use (&$h, $leit, $atr) { $h = $leit->historicoProduto(101, $atr['Largura']); });
$esperados = (int) $um("SELECT COUNT(*) FROM eq_auditoria WHERE entidade = 'valor' AND entidade_id LIKE ?", ["101:{$atr['Largura']}:%"]);
$ok('066 payload: só o atributo pedido, TODOS os eventos dele (antes do limite), com filtro e limite ecoados', $eh === null && $esperados >= 2 && count($h['historico'] ?? []) === $esperados
    && array_unique(array_column($h['historico'], 'atributo_id')) === [$atr['Largura']] && ($h['atributo_id'] ?? null) === $atr['Largura'] && ($h['truncado'] ?? null) === false,
    $eh ? $eh->getMessage() : 'n=' . count($h['historico'] ?? []) . ' esperado=' . $esperados);
$ok('066 sem filtro: os 300 mais recentes (truncado), como antes', fn() => count(($t = $leit->historicoProduto(101))['historico']) === 300 && $t['truncado'] === true);
$ok('066 vazio legítimo: atributo sem eventos → 200 com lista vazia', fn() => $leit->historicoProduto(102, $atr['Largura'])['historico'] === []);
$leitRuim = new ProdutosLeitura(new LeituraVitrinePdo($pdo, 'ATRWEB_VAL_T_NAO_EXISTE', $db), $repo, 80);
$eh2 = $erro(fn() => $leitRuim->historicoProduto(101, $atr['Largura']));
$ok('066 falha de leitura → 503 HISTORY_UNAVAILABLE "deste atributo" (distinguível de vazio)', $eh2 instanceof AtributosErro && $eh2->http === 503 && $eh2->codigo === 'HISTORY_UNAVAILABLE' && str_contains($eh2->getMessage(), 'deste atributo'), $eh2 ? get_class($eh2) . ' ' . $eh2->getMessage() : 'sem erro');

// =========================================================================================================================================
// DSHOW-085 / 086 · massa: lote incerto devolve o recibo pela mesma chave (sem revalidar, sem operação nova); recibo por titular estável
// =========================================================================================================================================
$k2 = (int) $kits->salvarKit(['nome' => 'Conectores (foi salvo)'])['kit']['id'];
$kits->definirItens(['id' => $k2, 'versao' => (int) $repo->grupo($k2)['versao'], 'itens' => [['atributo_id' => $atr['Cor'], 'posicao' => 1, 'obrigatorio' => 0, 'visivel' => 1, 'destaque' => 0, 'importancia' => null, 'unidade_id' => null]]]);
$ped = ['produtos' => [101, 102], 'kits_aplicar' => [$k2]];
$ms = fn(KitsService $k, array $b) => $k->aplicarMassa($b + ['versao_previa' => $k->previaMassa($b)['versao_previa']]);
$rm = $ms($kits, $ped + ['chave' => 'massa-fs-0001']);
$ok('085 aplicar: 2 kits aplicados; recibo da massa com titular_id de A', ($rm['gravado']['kits_aplicados'] ?? -1) === 2 && (int) $um("SELECT titular_id FROM eq_pedido_massa WHERE chave = 'massa-fs-0001'") === $A['id']);
$audM = (int) $um("SELECT COUNT(*) FROM eq_auditoria WHERE entidade = 'massa'");
$cat->p[102]['excluido'] = true;   // depois do lote, um produto sai do catálogo (antes: 422 PRODUCT_NOT_FOUND no reenvio)
$rr = null; $er = $erro(function () use (&$rr, $kits, $ped) { $rr = $kits->aplicarMassa($ped + ['chave' => 'massa-fs-0001', 'versao_previa' => str_repeat('0', 64)]); });
$ok('085 reenvio da mesma chave (lote incerto) com produto agora fora do catálogo: devolve o recibo (repetido), não 422', $er === null && ($rr['repetido'] ?? false) === true && ($rr['gravado']['kits_aplicados'] ?? -1) === 2, $er ? $er->getMessage() : json_encode($rr));
$ok('085 nenhuma operação nova: 1 pedido, mesma auditoria, mesmos vínculos', (int) $um("SELECT COUNT(*) FROM eq_pedido_massa") === 1 && (int) $um("SELECT COUNT(*) FROM eq_auditoria WHERE entidade = 'massa'") === $audM
    && (int) $um('SELECT COUNT(*) FROM eq_grupo_produto WHERE grupo_id = ? AND excluido_em IS NULL', [$k2]) === 2);
$cat->p[102]['excluido'] = false;
$ok('085 conferir (A) = aplicada com o resultado da massa; sem gravar', fn() => ($cf = $opsA->conferir('massa-fs-0001'))['resultado'] === 'aplicada' && $cf['operacao'] === 'massa_aplicar' && $cf['recibo']['gravado']['kits_aplicados'] === 2);
$e86 = $erro(fn() => $kitsDe($C)->aplicarMassa($ped + ['chave' => 'massa-fs-0001', 'versao_previa' => str_repeat('0', 64)]));
$ok('086 outra identidade com o MESMO e-mail (C) não recebe o recibo de A → 409, nada gravado', $e86 instanceof AtributosErro && $e86->http === 409 && (int) $um("SELECT COUNT(*) FROM eq_pedido_massa") === 1, $e86 ? $e86->getMessage() : 'C recebeu o recibo de A');
$e86b = $erro(fn() => $kitsDe($B)->aplicarMassa($ped + ['chave' => 'massa-fs-0001', 'versao_previa' => str_repeat('0', 64)]));
$ok('086 outro administrador (B) → 409', $e86b instanceof AtributosErro && $e86b->http === 409);
$ok('086 conferir por C e por B → nao_encontrada', fn() => $opsDe($C)->conferir('massa-fs-0001')['resultado'] === 'nao_encontrada' && $opsB->conferir('massa-fs-0001')['resultado'] === 'nao_encontrada');
$ok('086 gate de admin mantido: nível 50 não chega ao recibo (403)', fn() => $erro(fn() => (new KitsService($repo, 50, $A['email'], $cat, null, $A['id']))->aplicarMassa($ped + ['chave' => 'massa-fs-0001']))?->http === 403);
// recibo antigo (sem titular_id): confere pelo usuario
$pdo->exec("UPDATE eq_pedido_massa SET titular_id = NULL WHERE chave = 'massa-fs-0001'");
$ok('086 recibo antigo (titular_id NULL): A pelo usuario recebe; B não', fn() => ($kits->aplicarMassa($ped + ['chave' => 'massa-fs-0001', 'versao_previa' => str_repeat('0', 64)])['repetido'] ?? false) === true
    && $erro(fn() => $kitsDe($B)->aplicarMassa($ped + ['chave' => 'massa-fs-0001', 'versao_previa' => str_repeat('0', 64)]))?->http === 409);
$ok('massa pela camada única: recibo com gravado e chave do corpo', fn() => ($r = $opsA->executar('massa_aplicar', ['produtos' => [103], 'kits_aplicar' => [$k2], 'chave' => 'massa-fs-0002', 'versao_previa' => $kits->previaMassa(['produtos' => [103], 'kits_aplicar' => [$k2]])['versao_previa']], null, fn(array $c) => $kits->aplicarMassa($c)))['recibo']['chave'] === 'massa-fs-0002'
    && $r['recibo']['gravado']['kits_aplicados'] === 1 && $r['desfecho'] === 'aplicada');

// =========================================================================================================================================
// DSHOW-079 P2 · `gravavel` em cada unidade da leitura pela MESMA regra da gravação; unidade histórica na lista só para leitura
// =========================================================================================================================================
$adm->gravarValor(['product_id' => 104, 'atributo_id' => $atr['Largura'], 'valor' => '3', 'unidade_id' => $U['pol']]);   // valor salvo em pol…
$adm->definirUnidadeAtiva($U['pol'], false);                                                                             // …e pol desativada depois
$antes104 = $valorRow(104, $atr['Largura']);
$unidadesPara = Closure::bind(fn(array $item, array $unid, array $extras, ?int $uv) => $this->unidadesPara($item, $unid, $extras, $uv), $leit, ProdutosLeitura::class);
$base = Aplicabilidade::ficha($repo->retratoModelo(null), $cat->p[104])[$atr['Largura']];
$lista = $unidadesPara($base, (new LeituraVitrinePdo($pdo, $db, $db))->unidades(), [$atr['Largura'] => []], $U['pol']);
$porSimb = array_column($lista, null, 'simbolo');
$ok('079 cada unidade traz gravavel (bool) e motivo_nao_gravavel', $lista !== [] && !array_filter($lista, static fn($u) => !array_key_exists('gravavel', $u) || !array_key_exists('motivo_nao_gravavel', $u)), json_encode($lista));
$ok('079 histórica (pol desativada, a do valor salvo) continua na lista: gravavel false, motivo desativada', ($porSimb['pol']['historica'] ?? false) === true && ($porSimb['pol']['gravavel'] ?? true) === false && ($porSimb['pol']['motivo_nao_gravavel'] ?? null) === 'desativada', json_encode($porSimb['pol'] ?? null));
$ok('079 m/cm/mm graváveis; kg (outra grandeza) fora da lista', ($porSimb['m']['gravavel'] ?? false) && ($porSimb['cm']['gravavel'] ?? false) && ($porSimb['mm']['gravavel'] ?? false) && !isset($porSimb['kg']));
// mesma regra: gravavel na leitura ⇔ a gravação aceita (produto 103, mesmo kit/ficha)
$coerente = true; $det = [];
foreach (['m', 'cm', 'mm', 'pol', 'kg'] as $s) {
    $vAtual = $valorRow(103, $atr['Largura']);
    $e = $erro(fn() => $adm->gravarValor(['product_id' => 103, 'atributo_id' => $atr['Largura'], 'valor' => '1', 'unidade_id' => $U[$s]] + ($vAtual ? ['versao' => (int) $vAtual['versao']] : [])));
    $leu = $porSimb[$s]['gravavel'] ?? false; $gravou = $e === null;
    $det[] = "$s: leitura=" . ($leu ? 'gravável' : 'não') . ' gravação=' . ($gravou ? 'aceitou' : ($e instanceof AtributosErro ? $e->http : get_class($e)));
    if ($leu !== $gravou || (!$gravou && !($e instanceof AtributosErro && $e->http === 422))) $coerente = false;
}
$ok('079 MESMA regra: gravavel na leitura ⇔ a gravação aceita (senão 422)', $coerente, implode(' · ', $det));
$ok('079 só leitura: o valor salvo em pol não muda', $valorRow(104, $atr['Largura']) == $antes104);

echo ($falhas ? '[ERRO]' : '[OK]  ') . " foi-salvo-mysql (recibo/desfechos/chave/conferir, 090, 066, 085, 086, 079 P2): $n casos, $falhas falha(s)\n";
exit($falhas ? 1 : 0);
