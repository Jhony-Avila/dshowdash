<?php
// DSHOW-096 (CIMA, 19/11): ACEITAR SUGESTÕES EM LOTE COM CHAVE — prova de banco real do que a tela do Preencher (e a Conferência da DIREITA)
// passa a fazer: lote de 10 → queda depois do 6º item (exceção no 7º) → "resposta perdida" (o cliente não recebe) → conferir = interrompida
// com 6 aceitas / 4 pendentes → retomar com a MESMA chave e o MESMO corpo → 10 aceitas → ZERO duplicação (uma auditoria e um valor por item;
// reenvio extra = recibo idêntico, nada novo). Mesma chave com outro corpo = 422. Schema ATRWEB_VAL_T_1.._T_6 VAZIO (bases da CIMA), migrações
// 001–011; catálogo falso em memória. Entradas: EQ_TEST_CNF e EQ_TEST_DB. Saída: 0 verde · 1 falha · 2 não executado · 3 recusado.
declare(strict_types=1);
require_once __DIR__ . '/../../../api/atributos/AtributosRepo.php';
require_once __DIR__ . '/../../../api/atributos/KitsService.php';
require_once __DIR__ . '/../../../api/atributos/SugestoesService.php';
require_once __DIR__ . '/_memoria.php';
[$cnf, $db] = [(string) (getenv('EQ_TEST_CNF') ?: ''), (string) (getenv('EQ_TEST_DB') ?: '')];
$dir = __DIR__ . '/../../../db/equipamentos/migrations';
if ($cnf === '' || $db === '' || !is_readable($cnf)) { echo "[NÃO EXECUTADO] lote-chave-mysql: faltam EQ_TEST_CNF/EQ_TEST_DB\n"; exit(2); }
if (!preg_match('/^ATRWEB_VAL_T_[1-6]$/', $db)) { echo "[RECUSADO] lote-chave-mysql: só ATRWEB_VAL_T_1.._T_6\n"; exit(3); }
$c = (parse_ini_file($cnf, true, INI_SCANNER_RAW) ?: [])['client'] ?? [];
$tira = fn($v) => trim((string) $v, " \t\"'");
$dsn = 'mysql:' . (isset($c['socket']) ? 'unix_socket=' . $tira($c['socket']) : 'host=' . $tira($c['host'] ?? '127.0.0.1') . ';port=' . (int) ($c['port'] ?? 3306)) . ";dbname=$db;charset=utf8mb4";
final class StmtQueda extends PDOStatement
{
    public static ?Closure $apos = null;
    protected function __construct() {}
    public function execute(?array $params = null): bool { $r = parent::execute($params); if (self::$apos !== null) (self::$apos)($this->queryString, $params ?? []); return $r; }
}
$pdo = new PDO($dsn, $tira($c['user'] ?? ''), $tira($c['password'] ?? ''), [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_STATEMENT_CLASS => [StmtQueda::class, []]]);
if ((string) $pdo->query('SELECT DATABASE()')->fetchColumn() !== $db) { echo "[RECUSADO] conexão fora de $db\n"; exit(3); }
if ((int) $pdo->query('SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE()')->fetchColumn() !== 0) { echo "[RECUSADO] lote-chave-mysql: $db não está vazio\n"; exit(3); }
$arqs = array_values(array_filter(glob("$dir/[0-9][0-9][0-9]_*.sql") ?: [], static fn($f) => !str_ends_with($f, '.revert.sql'))); sort($arqs, SORT_STRING);
foreach ($arqs as $arq) foreach (preg_split('/;\s*\n/', (string) preg_replace('/^--.*$/m', '', (string) file_get_contents($arq))) ?: [] as $st) {
    $st = trim($st); if ($st === '') continue;
    if (!preg_match('/^(CREATE TABLE IF NOT EXISTS|ALTER TABLE|INSERT (IGNORE )?INTO|UPDATE) `eq_[a-z_]+`/i', $st)) { echo '[RECUSADO] comando fora da lista em ' . basename($arq) . "\n"; exit(3); }
    $pdo->exec(rtrim($st, ';'));
}
$falhas = 0; $n = 0;
$ok = function (string $nome, bool $cond, string $det = '') use (&$falhas, &$n): void { $n++; if (!$cond) { $falhas++; echo "[ERRO] $nome" . ($det !== '' ? "\n       $det" : '') . "\n"; } else echo "ok    $nome\n"; };
$um = function (string $sql, array $p = []) use ($pdo) { $s = $pdo->prepare($sql); $s->execute($p); return $s->fetchColumn(); };
$cat = new CatalogoMemoria(); $P = range(201, 210);
foreach ($P as $id) $cat->p[$id] = ['id' => $id, 'nome' => "Produto $id (sintético)", 'categoria' => 'LED_PANEL', 'subcategoria' => 'CABLE', 'ativo' => true, 'excluido' => false, 'sincronizado_em' => null];
$repo = new AtributosRepoPdo($pdo, ''); $A = ['id' => 990080, 'email' => 'admin.validacao@exemplo.invalid'];
$adm = new AtributosService($repo, 80, $A['email'], $cat); $kits = new KitsService($repo, 80, $A['email'], $cat, null, $A['id']);
$vias = (int) $adm->salvarAtributo(['rotulo' => 'Vias', 'tipo' => 'inteiro', 'unidade_id' => null, 'casas' => null])['atributo']['id'];
$kid = (int) $kits->salvarKit(['nome' => 'Cabos (lote com chave)'])['kit']['id'];
$kits->definirItens(['id' => $kid, 'versao' => (int) $repo->grupo($kid)['versao'], 'itens' => [['atributo_id' => $vias, 'posicao' => 1, 'obrigatorio' => 0, 'visivel' => 1, 'destaque' => 0, 'importancia' => null, 'unidade_id' => null]]]);
$kits->definirEscopos(['id' => $kid, 'versao' => (int) $repo->grupo($kid)['versao'], 'escopos' => [['categoria' => 'LED_PANEL', 'subcategoria' => 'CABLE']]]);
$ids = [];
foreach ($P as $k => $pid) { $pdo->prepare("INSERT INTO eq_sugestao (chave, product_id, atributo_id, atributo_alternativo_id, fonte, tipo, valor_proposto, unidade_id, evidencia) VALUES (?, ?, ?, NULL, 'legado_2025', 'valor', ?, NULL, 'teste 096')")->execute(["l96|$pid", $pid, $vias, (string) ($k + 2)]); $ids[] = (int) $pdo->lastInsertId(); }
$sug = new SugestoesService($repo, $adm, $kits, 80, $A['email']);
$ops = new OperacoesGravacao($repo, $A['id'], $A['email'], 80, true);
$chave = 'op-l96-' . bin2hex(random_bytes(6)); $corpo = ['ids' => $ids, 'confirmar' => true];
$exec = fn(array $corpo) => $ops->executar('sugestoes_lote', $corpo, $chave, fn(array $c, $l = null) => $sug->aceitarLote($c, $l));
$aud = fn(int $id) => (int) $um("SELECT COUNT(*) FROM eq_auditoria WHERE entidade = 'sugestao' AND entidade_id LIKE ? AND acao = 'aceitar_sugestao'", ["%:$id"]);
$audTot = fn() => (int) $um('SELECT COUNT(*) FROM eq_auditoria');
$vals = fn() => (int) $um('SELECT COUNT(*) FROM eq_valor WHERE atributo_id = ? AND excluido_em IS NULL', [$vias]);
$valsVersao = fn() => (int) $um('SELECT COUNT(*) FROM eq_valor WHERE atributo_id = ? AND excluido_em IS NULL AND versao = 1', [$vias]);

// 1) primeira tentativa: queda (exceção) ao ler o 7º item → o cliente NÃO recebe resposta útil ("resposta perdida")
$setimo = $ids[6];
StmtQueda::$apos = function (string $sql, array $p) use ($setimo): void { if (preg_match('/FROM\s+`eq_sugestao`\s+WHERE id = \?$/', $sql) && (int) ($p[0] ?? 0) === $setimo) { StmtQueda::$apos = null; throw new RuntimeException('queda simulada depois do 6º item'); } };
$e1 = null; try { $exec($corpo); } catch (Throwable $t) { $e1 = $t; } StmtQueda::$apos = null;
$ok('queda depois do 6º: 503 OPERATION_INTERRUPTED (o cliente trata como resultado ainda não confirmado)', $e1 instanceof AtributosErro && $e1->codigo === 'OPERATION_INTERRUPTED', $e1 ? get_class($e1) . ' ' . $e1->getMessage() : 'sem erro');
$ok('banco depois da queda: 6 valores gravados, 6 sugestões aceitas, 4 pendentes', $vals() === 6 && (int) $um("SELECT COUNT(*) FROM eq_sugestao WHERE id IN (" . implode(',', $ids) . ") AND estado = 'aceita'") === 6);
// 2) conferir (o que o botão "Conferir gravação" faz): só leitura
$aud0 = $audTot(); $cf = $ops->conferir($chave);
$porItem = array_count_values(array_column($cf['itens'] ?? [], 'desfecho'));
$ok('conferir = interrompida, por item: 6 aceita + 4 pendente; nada gravado pela consulta', ($cf['resultado'] ?? null) === 'interrompida' && ($porItem['aceita'] ?? 0) === 6 && ($porItem['pendente'] ?? 0) === 4 && $audTot() === $aud0, json_encode($cf['itens_resumo'] ?? $porItem));
// 3) mesma chave com OUTRO corpo (ids mudados na tela) → recusado (o corpo congelado é obrigatório)
$e3 = null; try { $exec(['ids' => array_slice($ids, 0, 9), 'confirmar' => true]); } catch (Throwable $t) { $e3 = $t; }
$ok('mesma chave com OUTRO corpo → 422 IDEMPOTENCY_KEY_REUSED; nada gravado', $e3 instanceof AtributosErro && $e3->codigo === 'IDEMPOTENCY_KEY_REUSED' && $vals() === 6, $e3 ? $e3->getMessage() : 'executou');
// 4) retomar com a MESMA chave e o MESMO corpo → conclui só os 4 pendentes
$r4 = $exec($corpo);
$ok('retomada: aceitas 10, aceitas_ids = os 10 na ordem, desfecho aplicada, recibo com pedidas 10', ($r4['aceitas'] ?? null) === 10 && ($r4['aceitas_ids'] ?? null) === $ids && ($r4['desfecho'] ?? null) === 'aplicada' && ($r4['recibo']['pedidas'] ?? null) === 10, json_encode(['aceitas' => $r4['aceitas'] ?? null, 'desfecho' => $r4['desfecho'] ?? null]));
$ok('ZERO duplicação: exatamente 1 auditoria "aceitar_sugestao" por item', array_map($aud, $ids) === array_fill(0, 10, 1), json_encode(array_map($aud, $ids)));
$ok('ZERO duplicação: 10 valores, todos na versão 1 (nenhum regravado)', $vals() === 10 && $valsVersao() === 10, "vals={$vals()} v1={$valsVersao()}");
$ok('eq_operacao_item: 10 itens, todos aceita', (int) $um("SELECT COUNT(*) FROM eq_operacao_item WHERE chave = ? AND desfecho = 'aceita'", [$chave]) === 10 && (int) $um('SELECT COUNT(*) FROM eq_operacao_item WHERE chave = ?', [$chave]) === 10);
// 5) reenvio extra (ex.: a resposta da retomada também se perdeu) → recibo idêntico, nada novo
$aud1 = $audTot(); $r5 = $exec($corpo);
$ok('reenvio extra da mesma chave: repetido, recibo IDÊNTICO ao da retomada, nenhuma auditoria nova', ($r5['repetido'] ?? false) === true && json_encode($r5['recibo']) === json_encode($r4['recibo']) && $audTot() === $aud1 && $vals() === 10);
$cf2 = $ops->conferir($chave);
$ok('conferir final = aplicada, recibo idêntico, 10 aceita', ($cf2['resultado'] ?? null) === 'aplicada' && json_encode($cf2['recibo']) === json_encode($r4['recibo']) && (array_count_values(array_column($cf2['itens'] ?? [], 'desfecho'))['aceita'] ?? 0) === 10);
echo ($falhas ? '[ERRO]' : '[OK]  ') . " lote-chave-mysql (DSHOW-096: lote de 10, queda depois do 6º, conferir, retomar com a mesma chave, zero duplicação): $n casos, $falhas falha(s)\n";
exit($falhas ? 1 : 0);
