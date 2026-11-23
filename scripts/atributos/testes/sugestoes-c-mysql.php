<?php
// PARTE C (ESQUERDA, 23/11) — Sugestões: sugestoes_decidir, conferencia_fila e a regra da carga, com MySQL de verdade (migrações 001–013).
// Plano: PROPOSTA-CONTRATO-SUGESTOES v2 §10 (itens 2–10; 1 = sugestoes-c-executor.php; 11 = sugestoes-c-antigo.php).
// Schema ATRWEB_VAL_T_7/_8/_9 VAZIO. Entradas: EQ_TEST_CNF e EQ_TEST_DB. Catálogo sintético na própria base. Nada fora da base.
// Saída: 0 verde · 1 falha · 2 não executado · 3 recusado.
declare(strict_types=1);
require_once __DIR__ . '/../../../api/atributos/AtributosRepo.php';
require_once __DIR__ . '/../../../api/atributos/KitsService.php';
require_once __DIR__ . '/../../../api/atributos/SugestoesService.php';
require_once __DIR__ . '/../../../api/atributos/ProdutosLeitura.php';
require_once __DIR__ . '/../../../api/atributos/LeituraVitrinePdo.php';
require_once __DIR__ . '/../../../tools/equipamentos/cargas.php';
require_once __DIR__ . '/_memoria.php';
[$cnf, $db] = [(string) (getenv('EQ_TEST_CNF') ?: ''), (string) (getenv('EQ_TEST_DB') ?: '')];
$dir = __DIR__ . '/../../../db/equipamentos/migrations';
if ($cnf === '' || $db === '' || !is_readable($cnf)) { echo "[NÃO EXECUTADO] sugestoes-c-mysql: faltam EQ_TEST_CNF/EQ_TEST_DB\n"; exit(2); }
if (!in_array($db, ['ATRWEB_VAL_T_7', 'ATRWEB_VAL_T_8', 'ATRWEB_VAL_T_9'], true)) { echo "[RECUSADO] sugestoes-c-mysql: só ATRWEB_VAL_T_7, _T_8 ou _T_9\n"; exit(3); }
$c = (parse_ini_file($cnf, true, INI_SCANNER_RAW) ?: [])['client'] ?? [];
$tira = fn($v) => trim((string) $v, " \t\"'");
$dsn = 'mysql:' . (isset($c['socket']) ? 'unix_socket=' . $tira($c['socket']) : 'host=' . $tira($c['host'] ?? '127.0.0.1') . ';port=' . (int) ($c['port'] ?? 3306)) . ";dbname=$db;charset=utf8mb4";
/** Gancho DEPOIS de cada execute: injeta queda/erro técnico num ponto exato (lote interrompido, deadlock). */
final class StmtGanchoC extends PDOStatement
{
    public static ?Closure $apos = null;
    protected function __construct() {}
    public function execute(?array $params = null): bool { $r = parent::execute($params); if (self::$apos !== null) (self::$apos)($this->queryString, $params ?? []); return $r; }
}
$pdo = new PDO($dsn, $tira($c['user'] ?? ''), $tira($c['password'] ?? ''), [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_STATEMENT_CLASS => [StmtGanchoC::class, []]]);
if ((string) $pdo->query('SELECT DATABASE()')->fetchColumn() !== $db) { echo "[RECUSADO] conexão fora de $db\n"; exit(3); }
if ((int) $pdo->query('SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE()')->fetchColumn() !== 0) { echo "[RECUSADO] sugestoes-c-mysql: $db não está vazio\n"; exit(3); }
$arqs = array_values(array_filter(glob("$dir/[0-9][0-9][0-9]_*.sql") ?: [], static fn($f) => !str_ends_with($f, '.revert.sql'))); sort($arqs, SORT_STRING);
foreach ($arqs as $arq) foreach (preg_split('/;\s*\n/', (string) preg_replace('/^--.*$/m', '', (string) file_get_contents($arq))) ?: [] as $st) {
    $st = trim($st); if ($st === '') continue;
    if (!preg_match('/^(CREATE TABLE IF NOT EXISTS|ALTER TABLE|INSERT (IGNORE )?INTO|UPDATE) `eq_[a-z_]+`/i', $st)) { echo '[RECUSADO] sugestoes-c-mysql: comando fora da lista em ' . basename($arq) . "\n"; exit(3); }
    $pdo->exec(rtrim($st, ';'));
}

$falhas = 0; $n = 0;
$ok = function (string $nome, bool|Closure $cond, string $det = '') use (&$falhas, &$n): void {
    $n++; $msg = '';
    if ($cond instanceof Closure) { try { $cond = (bool) $cond(); } catch (Throwable $t) { $cond = false; $msg = ' (exceção: ' . get_class($t) . ' ' . $t->getMessage() . ')'; } }
    if (!$cond) { $falhas++; echo "[ERRO] $nome$msg" . ($det !== '' ? "\n       $det" : '') . "\n"; }
};
$erro = function (callable $f): ?Throwable { try { $f(); } catch (Throwable $e) { return $e; } return null; };
$um = function (string $sql, array $p = []) use ($pdo) { $s = $pdo->prepare($sql); $s->execute($p); return $s->fetchColumn(); };
$todas = function (string $sql, array $p = []) use ($pdo) { $s = $pdo->prepare($sql); $s->execute($p); return $s->fetchAll(PDO::FETCH_ASSOC); };
$sugRow = fn(int $id) => $todas('SELECT * FROM eq_sugestao WHERE id = ?', [$id])[0] ?? null;
$sinalValores = fn() => (string) $um("SELECT CONCAT(COUNT(*), ':', COALESCE(SUM(CRC32(CONCAT_WS('|', id, versao, IFNULL(valor_num, ''), IFNULL(valor_texto, ''), IFNULL(excluido_em, '')))), 0)) FROM eq_valor");
$ok('013 aplicada (colunas novas e índices únicos)', (int) $um("SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'eq_sugestao' AND COLUMN_NAME IN ('decidido_por_id', 'substitui_id', 'conteudo_hash', 'pendente_identidade')") === 4
    && (int) $um("SELECT COUNT(DISTINCT INDEX_NAME) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'eq_sugestao' AND INDEX_NAME IN ('uq_eq_sugestao_pendente', 'uq_eq_sugestao_sucessora')") === 2);

// ---- massa: catálogo (800 produtos), unidades, atributos, kit "Todos" com Pitch/Taxa/Tipo e Obrig. (obrigatório) ------------------------
$pdo->exec('CREATE TABLE `product_catalog` (`id` INT UNSIGNED NOT NULL PRIMARY KEY, `name` VARCHAR(120) NOT NULL, `category` VARCHAR(40) NOT NULL, `subcategory` VARCHAR(60) NULL,
    `active` TINYINT(1) NOT NULL DEFAULT 1, `deleted` TINYINT(1) NOT NULL DEFAULT 0) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci');
$cat = new CatalogoMemoria(); $cat->p = [];
$vals = []; for ($i = 1; $i <= 800; $i++) { $pid = 9000 + $i; $nome = "Módulo sintético $pid"; $vals[] = "($pid, '$nome', 'LED_PANEL', 'LED_MODULE', 1, 0)";
    $cat->p[$pid] = ['id' => $pid, 'nome' => $nome, 'categoria' => 'LED_PANEL', 'subcategoria' => 'LED_MODULE', 'ativo' => true, 'excluido' => false, 'sincronizado_em' => null]; }
$pdo->exec('INSERT INTO product_catalog (id, name, category, subcategory, active, deleted) VALUES ' . implode(',', $vals));
$pdo->exec("INSERT INTO eq_unidade (simbolo, nome, grandeza) VALUES ('mm', 'milímetro', 'comprimento'), ('Hz', 'hertz', 'frequencia')");
$U = []; foreach ($todas('SELECT id, simbolo FROM eq_unidade') as $u) $U[$u['simbolo']] = (int) $u['id'];
$pdo->prepare("INSERT INTO eq_atributo (codigo, rotulo, tipo, unidade_id, ativo) VALUES ('pitch_138', 'Pitch', 'numero', ?, 1), ('taxa_de_atualizacao_refresh_rate_93', 'Taxa', 'numero', ?, 1),
    ('tipo_do_led_87', 'Tipo do LED', 'opcao', NULL, 1), ('obrig', 'Obrigatório', 'texto', NULL, 1), ('extra', 'Extra', 'texto', NULL, 1), ('inativo', 'Inativo', 'texto', NULL, 0)")->execute([$U['mm'], $U['Hz']]);
$A = []; foreach ($todas('SELECT id, codigo FROM eq_atributo') as $a) $A[$a['codigo']] = (int) $a['id'];
$pdo->prepare("INSERT INTO eq_opcao (atributo_id, rotulo, posicao, ativo) VALUES (?, 'Indoor', 1, 1), (?, 'Outdoor', 2, 1)")->execute([$A['tipo_do_led_87'], $A['tipo_do_led_87']]);
$repo = new AtributosRepoPdo($pdo, '');
$ADM = ['id' => 1001, 'email' => 'admin@exemplo.invalid']; $OUT = ['id' => 1002, 'email' => 'outra@exemplo.invalid'];
$adm = new AtributosService($repo, 80, $ADM['email'], $cat);
$kits = new KitsService($repo, 80, $ADM['email'], $cat, true, $ADM['id']);
$k = $kits->salvarKit(['nome' => 'Todos', 'aplica_a_todos' => 1])['kit'];
$kits->definirItens(['id' => $k['id'], 'versao' => $k['versao'], 'itens' => [['atributo_id' => $A['pitch_138'], 'posicao' => 1], ['atributo_id' => $A['taxa_de_atualizacao_refresh_rate_93'], 'posicao' => 2],
    ['atributo_id' => $A['tipo_do_led_87'], 'posicao' => 3], ['atributo_id' => $A['obrig'], 'posicao' => 4, 'obrigatorio' => 1]]]);
$sugDe = fn(array $u, int $nivel = 80, bool $admin = true) => new SugestoesService($repo, new AtributosService($repo, $nivel, $u['email'], $cat), $admin ? new KitsService($repo, $nivel, $u['email'], $cat, true, $u['id']) : null, $nivel, $u['email'], $u['id']);
$sug = $sugDe($ADM);
$ops = new OperacoesGravacao($repo, $ADM['id'], $ADM['email'], 80, true);
$decidir = fn(array $corpo, string $chave, ?SugestoesService $s = null, ?OperacoesGravacao $o = null) => ($o ?? $ops)->executar('sugestoes_decidir', $corpo, $chave, fn(array $c, $l = null) => ($s ?? $sug)->decidirLote($c, $l));
$seq = 0;
$nova = function (int $pid, int $aid, ?string $valor, string $estado = 'pendente', string $fonte = 'nome_produto', ?int $substitui = null, ?string $chave = null) use ($pdo, &$seq): int {
    $seq++; $chave ??= "$fonte|$pid|$aid" . ($substitui !== null ? "|r:$substitui" : '');
    $pdo->prepare('INSERT INTO eq_sugestao (chave, product_id, atributo_id, fonte, tipo, valor_proposto, unidade_id, evidencia, estado, substitui_id) VALUES (?, ?, ?, ?, \'valor\', ?, NULL, \'teste parte C\', ?, ?)')
        ->execute([$chave, $pid, $aid, $fonte, $valor, $estado, $substitui]);
    return (int) $pdo->lastInsertId();
};
$it = fn(int ...$ids) => array_map(fn($id) => ['id' => $id, 'versao' => (int) $sugRow($id)['versao']], $ids);
$P = $A['pitch_138']; $T = $A['taxa_de_atualizacao_refresh_rate_93'];

// ===================================== (2) TRANSIÇÕES — cada aresta com versão certa e velha =========================================
$s1 = $nova(9001, $P, '2.5'); $s2 = $nova(9002, $P, '2.5'); $s3 = $nova(9003, $P, '2.5'); $s4 = $nova(9004, $P, '2.5');
$v0 = $sinalValores();
$r = $decidir(['acao' => 'ignorar', 'itens' => $it($s1), 'confirmar' => true, 'motivo' => 'depois'], 'k-c-ign-0001');
$ok('ignorar: aplicada; estado ignorada; versão +1; decidido_por_id = titular', ($r['itens'][0]['desfecho'] ?? null) === 'aplicada' && $sugRow($s1)['estado'] === 'ignorada' && (int) $sugRow($s1)['versao'] === 2 && (int) $sugRow($s1)['decidido_por_id'] === 1001, json_encode($r['itens'] ?? null));
$r = $decidir(['acao' => 'devolver', 'itens' => $it($s1), 'confirmar' => true], 'k-c-dev-0001');
$ok('devolver: ignorada → pendente; decisor limpo; versão 3', ($r['itens'][0]['desfecho'] ?? null) === 'aplicada' && $sugRow($s1)['estado'] === 'pendente' && $sugRow($s1)['decidido_por'] === null && $sugRow($s1)['decidido_por_id'] === null && (int) $sugRow($s1)['versao'] === 3);
$r = $decidir(['acao' => 'recusar', 'itens' => $it($s2), 'confirmar' => true], 'k-c-rec-0001');
$ok('recusar: pendente → recusada', ($r['itens'][0]['desfecho'] ?? null) === 'aplicada' && $sugRow($s2)['estado'] === 'recusada');
$ok('Recusar/Ignorar/Devolver NÃO tocam em eq_valor (contagem + soma de controle iguais)', $sinalValores() === $v0, $v0 . ' → ' . $sinalValores());
$r = $decidir(['acao' => 'devolver', 'itens' => $it($s2), 'confirmar' => true], 'k-c-dev-0002');
$ok('devolver recusada → não aplicada CONFLICT (recusada é final; Q-SUG.1)', ($r['itens'][0]['desfecho'] ?? null) === 'nao_aplicada' && ($r['itens'][0]['motivo'] ?? null) === 'CONFLICT' && $sugRow($s2)['estado'] === 'recusada');
$velha = [['id' => $s3, 'versao' => 99]];
$r = $decidir(['acao' => 'ignorar', 'itens' => $velha, 'confirmar' => true], 'k-c-velha-01');
$ok('versão velha → não aplicada CONFLICT com estado/versão atuais; linha intocada', ($r['itens'][0]['motivo'] ?? null) === 'CONFLICT' && ($r['itens'][0]['versao_atual'] ?? null) === 1 && $sugRow($s3)['estado'] === 'pendente');
$r = $decidir(['acao' => 'aceitar', 'itens' => $it($s3), 'confirmar' => true], 'k-c-ace-0001');
$ok('aceitar: aplicada, valor gravado, estado aceita, decidido_por_id carimbado', ($r['itens'][0]['desfecho'] ?? null) === 'aplicada' && $sugRow($s3)['estado'] === 'aceita' && (int) $sugRow($s3)['decidido_por_id'] === 1001
    && (string) $um('SELECT valor_num FROM eq_valor WHERE product_id = 9003 AND atributo_id = ? AND excluido_em IS NULL', [$P]) !== '', json_encode($r['itens'] ?? null));
$r = $decidir(['acao' => 'ignorar', 'itens' => $it($s3), 'confirmar' => true], 'k-c-ace-0002');
$ok('aceita não tem saída (ignorar aceita → CONFLICT)', ($r['itens'][0]['motivo'] ?? null) === 'CONFLICT' && $sugRow($s3)['estado'] === 'aceita');
$r = $decidir(['acao' => 'ignorar', 'itens' => [['id' => 987654, 'versao' => 1]], 'confirmar' => true], 'k-c-nf-00001');
$ok('inexistente → não aplicada NOT_FOUND', ($r['itens'][0]['motivo'] ?? null) === 'NOT_FOUND');
// auditoria de cada transição
$ok('auditoria: ignorar, devolver, recusar e aceitar registradas para as linhas', (int) $um("SELECT COUNT(*) FROM eq_auditoria WHERE entidade = 'sugestao' AND acao IN ('ignorar_sugestao', 'devolver_sugestao', 'recusar_sugestao', 'aceitar_sugestao')") >= 4);
// avulsa (POST sugestao) com as ações novas
$ok('POST sugestao ignorar (avulsa): aplicada', fn() => ($x = $sug->decidir(['id' => $s4, 'versao' => 1, 'decisao' => 'ignorar']))['sugestao']['estado_atual'] === 'ignorada');
$e = $erro(fn() => $sug->decidir(['id' => $s4, 'versao' => 1, 'decisao' => 'devolver']));
$ok('POST sugestao devolver com versão velha → 409 CONFLICT', $e instanceof AtributosErro && $e->http === 409);
$ok('POST sugestao devolver com a versão certa → pendente', fn() => $sug->decidir(['id' => $s4, 'versao' => 2, 'decisao' => 'devolver'])['sugestao']['estado_atual'] === 'pendente');

// ===================================== (3) D10 / C.3 — nunca sobrescreve =============================================================
$s5 = $nova(9005, $P, '2.5');
$pdo->prepare("INSERT INTO eq_valor (product_id, atributo_id, opcao_id, opcao_chave, valor_num, unidade_id, estado, origem, atualizado_por) VALUES (9005, ?, NULL, 0, 4, ?, 'informado', 'manual', 't')")->execute([$P, $U['mm']]);
$antes5 = $todas('SELECT * FROM eq_valor WHERE product_id = 9005 AND atributo_id = ?', [$P]);
$r = $decidir(['acao' => 'aceitar', 'itens' => $it($s5), 'confirmar' => true], 'k-c-d10-0001');
$ok('aceitar com destino preenchido → não aplicada VALUE_EXISTS; sugestão continua pendente', ($r['itens'][0]['motivo'] ?? null) === 'VALUE_EXISTS' && $sugRow($s5)['estado'] === 'pendente', json_encode($r['itens'] ?? null));
$ok('valor existente BYTE A BYTE igual', $todas('SELECT * FROM eq_valor WHERE product_id = 9005 AND atributo_id = ?', [$P]) === $antes5);

// ===================================== (4) CORRIDA — uma pendente por identidade, carga × devolver ====================================
$s6 = $nova(9006, $P, '2.5'); $r = $decidir(['acao' => 'ignorar', 'itens' => $it($s6), 'confirmar' => true], 'k-c-cor-0001');
$s6b = $nova(9006, $P, '3', 'pendente', 'nome_produto', null, 'nome_produto|9006|' . $P . '|teste-outra');   // outra pendente da MESMA identidade (via SQL)
$r = $decidir(['acao' => 'devolver', 'itens' => $it($s6), 'confirmar' => true], 'k-c-cor-0002');
$ok('devolver com outra pendente da identidade → CONFLICT pendente_existente (índice único); continua ignorada', ($r['itens'][0]['motivo'] ?? null) === 'CONFLICT' && ($r['itens'][0]['detalhe'] ?? null) === 'pendente_existente' && $sugRow($s6)['estado'] === 'ignorada', json_encode($r['itens'] ?? null));
$e = $erro(fn() => $nova(9006, $P, '4', 'pendente', 'nome_produto', null, 'nome_produto|9006|' . $P . '|terceira'));
$ok('o BANCO recusa a 2ª pendente da identidade (1062)', $e instanceof PDOException && (int) ($e->errorInfo[1] ?? 0) === 1062);
$s7 = $nova(9007, $P, '2.5'); $vista = $it($s7);
$sugDe($OUT)->decidir(['id' => $s7, 'versao' => 1, 'decisao' => 'recusar']);   // outra pessoa decidiu entre a leitura e o envio
$r = $decidir(['acao' => 'aceitar', 'itens' => $vista, 'confirmar' => true], 'k-c-cor-0003');
$ok('corrida: decidida por outra pessoa entre a leitura e o lote → CONFLICT, nada gravado', ($r['itens'][0]['motivo'] ?? null) === 'CONFLICT' && !$um('SELECT 1 FROM eq_valor WHERE product_id = 9007 AND atributo_id = ? AND excluido_em IS NULL', [$P]));

// ===================================== (5) LOTE — misto, interrompido, Rodando × Parado, Concluir, fencing ===============================
$m1 = $nova(9011, $P, '2.5'); $m2 = $nova(9012, $P, '2.5'); $m3 = $nova(9013, $P, '2.5');
$pdo->prepare("INSERT INTO eq_valor (product_id, atributo_id, opcao_id, opcao_chave, valor_num, estado, origem, atualizado_por) VALUES (9012, ?, NULL, 0, 7, 'informado', 'manual', 't')")->execute([$P]);
$motivos = fn(array $itens) => array_map(fn($x) => $x['motivo'] ?? null, $itens);
$corpoM = ['acao' => 'aceitar', 'itens' => array_merge($it($m1, $m2), [['id' => $m3, 'versao' => 5], ['id' => 777777, 'versao' => 1]]), 'confirmar' => true];
$r = $decidir($corpoM, 'k-c-misto-01');
$ok('lote misto: aplicada + VALUE_EXISTS + CONFLICT + NOT_FOUND, resumo 1/3/0', array_column($r['itens'], 'desfecho') === ['aplicada', 'nao_aplicada', 'nao_aplicada', 'nao_aplicada']
    && $motivos($r['itens']) === [null, 'VALUE_EXISTS', 'CONFLICT', 'NOT_FOUND'] && $r['resumo'] === ['aplicadas' => 1, 'nao_aplicadas' => 3, 'pendentes' => 0], json_encode($r['itens']));
$ok('recibo do lote: operacao sugestoes_decidir, acao e resumo no recibo', ($r['recibo']['operacao'] ?? null) === 'sugestoes_decidir' && ($r['recibo']['acao'] ?? null) === 'aceitar' && ($r['recibo']['resumo']['aplicadas'] ?? null) === 1);
$aud0 = (int) $um("SELECT COUNT(*) FROM eq_auditoria WHERE entidade = 'sugestao'");
$r2 = $decidir($corpoM, 'k-c-misto-01');   // o MESMO corpo (intenção congelada)
$ok('reenvio da MESMA chave: recibo original (repetido), nenhuma auditoria nova', ($r2['repetido'] ?? false) === true && (int) $um("SELECT COUNT(*) FROM eq_auditoria WHERE entidade = 'sugestao'") === $aud0);
$e = $erro(fn() => $decidir(['acao' => 'ignorar', 'itens' => $it($m3), 'confirmar' => true], 'k-c-misto-01'));
$ok('mesma chave com corpo diferente → 422 IDEMPOTENCY_KEY_REUSED', $e instanceof AtributosErro && $e->codigo === 'IDEMPOTENCY_KEY_REUSED');
// interrompido depois do 2º item (queda simulada ao registrar o desfecho do 3º)
$L = []; for ($i = 0; $i < 5; $i++) $L[] = $nova(9021 + $i, $P, '2.5');
$corpoL = ['acao' => 'ignorar', 'itens' => $it(...$L), 'confirmar' => true];
$cont = 0;
StmtGanchoC::$apos = function (string $sql, array $p) use (&$cont) { if (str_contains($sql, 'eq_operacao_item') && str_contains($sql, 'SET desfecho') && ++$cont === 3) throw new RuntimeException('queda simulada no 3º item'); };
$e = $erro(fn() => $decidir($corpoL, 'k-c-queda-001'));
StmtGanchoC::$apos = null;
$ok('queda no 3º item → 503 OPERATION_INTERRUPTED; itens 1–2 ignorados, 3–5 pendentes', $e instanceof AtributosErro && $e->codigo === 'OPERATION_INTERRUPTED'
    && array_map(fn($id) => $sugRow($id)['estado'], $L) === ['ignorada', 'ignorada', 'pendente', 'pendente', 'pendente'], $e ? $e->getMessage() : 'sem erro');
$cf = $ops->conferir('k-c-queda-001');
$ok('conferir: interrompida com itens 2 ignorados (aplicada) e 3 pendentes', $cf['resultado'] === 'interrompida' && ($cf['itens_resumo']['aplicada'] ?? 0) === 2 && ($cf['itens_resumo']['pendente'] ?? 0) === 3, json_encode($cf['itens_resumo'] ?? null));
// "A conferir" aparece na fila para o TITULAR (sobrevive a recarregar) e não para outra pessoa
$leitDe = fn(int $nivel = 80) => new ProdutosLeitura(new LeituraVitrinePdo($pdo, $db, $db), $repo, $nivel, null, true, true);
$fila = $leitDe()->conferenciaFila(['fila' => 'nome'], $ADM['id']);
$ac = array_column(array_filter($fila['itens'], fn($x) => in_array($x['id'], $L, true)), 'a_conferir', 'id');
$ok('fila: a_conferir com a chave nos 3 pendentes do titular', count(array_filter($ac)) === 3 && ($ac[$L[2]]['chave'] ?? null) === 'k-c-queda-001', json_encode($ac));
$ok('fila: outra pessoa não vê a_conferir', !array_filter(array_column($leitDe()->conferenciaFila(['fila' => 'nome'], $OUT['id'])['itens'], 'a_conferir')));
// Rodando (< 300 s): reenvio → 409 e nada feito
$pdo->prepare("UPDATE eq_operacao SET estado = 'em_andamento', atualizado_em = CURRENT_TIMESTAMP(3) WHERE chave = ?")->execute(['k-c-queda-001']);
$cf = $ops->conferir('k-c-queda-001');
$ok('Rodando: conferir em_andamento SEM sinal (sinal de vida recente)', $cf['resultado'] === 'em_andamento' && !isset($cf['sinal']));
$e = $erro(fn() => $decidir($corpoL, 'k-c-queda-001'));
$ok('"Concluir" com a tentativa ainda viva → 409 OPERATION_IN_PROGRESS; nada feito', $e instanceof AtributosErro && $e->codigo === 'OPERATION_IN_PROGRESS' && $sugRow($L[2])['estado'] === 'pendente');
// Parado (≥ 300 s): conferir sinaliza; "Concluir" (mesma chave e corpo) faz só os pendentes, sem auditar de novo os já feitos
$tentAntiga = (string) $um('SELECT tentativa FROM eq_operacao WHERE chave = ?', ['k-c-queda-001']);
$pdo->prepare('UPDATE eq_operacao SET atualizado_em = CURRENT_TIMESTAMP(3) - INTERVAL 400 SECOND WHERE chave = ?')->execute(['k-c-queda-001']);
$cf = $ops->conferir('k-c-queda-001');
$ok('Parado: conferir em_andamento + sinal pode_estar_demorando + reenvio_seguro', ($cf['sinal'] ?? null) === 'pode_estar_demorando' && ($cf['reenvio_seguro'] ?? null) === true);
$audL = (int) $um("SELECT COUNT(*) FROM eq_auditoria WHERE acao = 'ignorar_sugestao'");
$rC = $decidir($corpoL, 'k-c-queda-001');
$ok('"Concluir este lote": 5 ignorados; só 3 auditorias novas (os 2 feitos não repetem)', array_map(fn($id) => $sugRow($id)['estado'], $L) === array_fill(0, 5, 'ignorada')
    && (int) $um("SELECT COUNT(*) FROM eq_auditoria WHERE acao = 'ignorar_sugestao'") === $audL + 3 && $rC['resumo']['aplicadas'] === 5, json_encode($rC['resumo'] ?? null));
$ok('a tentativa ANTIGA, se acordar, perde a posse e não grava (fencing)', fn() => ($x = $erro(fn() => (new LoteDaOperacao($repo, $repo, 'k-c-queda-001', $tentAntiga))->item($L[0], fn() => ['aplicada', []])))
    instanceof AtributosErro && OperacoesGravacao::ehTomada($x));
// item alterado enquanto o lote estava parado → CONFLICT
$Q = [$nova(9031, $P, '2.5'), $nova(9032, $P, '2.5')]; $corpoQ = ['acao' => 'recusar', 'itens' => $it(...$Q), 'confirmar' => true]; $cont = 0;
StmtGanchoC::$apos = function (string $sql) use (&$cont) { if (str_contains($sql, 'eq_operacao_item') && str_contains($sql, 'SET desfecho') && ++$cont === 2) throw new RuntimeException('queda'); };
$erro(fn() => $decidir($corpoQ, 'k-c-queda-002')); StmtGanchoC::$apos = null;
$sugDe($OUT)->decidir(['id' => $Q[1], 'versao' => 1, 'decisao' => 'ignorar']);
$pdo->prepare('UPDATE eq_operacao SET atualizado_em = CURRENT_TIMESTAMP(3) - INTERVAL 400 SECOND WHERE chave = ?')->execute(['k-c-queda-002']);
$rQ = $decidir($corpoQ, 'k-c-queda-002');
$ok('item mudado enquanto parado → CONFLICT (nunca aplica em cima de outra decisão)', ($rQ['itens'][1]['motivo'] ?? null) === 'CONFLICT' && $sugRow($Q[1])['estado'] === 'ignorada', json_encode($rQ['itens'] ?? null));

// ===================================== (6) ERRO TÉCNICO — deadlock injetado =========================================================
$D = [$nova(9041, $P, '2.5'), $nova(9042, $P, '2.5'), $nova(9043, $P, '2.5')];
$deadlock = function () { $e = new PDOException('Deadlock found when trying to get lock (simulado)'); $e->errorInfo = ['40001', 1213, 'Deadlock (simulado)']; return $e; };
$vezes = 0;   // 1ª vez no item 2: repete e passa
StmtGanchoC::$apos = function (string $sql, array $p) use (&$vezes, $D, $deadlock) { if (str_contains($sql, 'UPDATE') && str_contains($sql, 'eq_sugestao') && str_contains($sql, 'versao = versao + 1') && in_array($D[1], $p, true) && $vezes++ < 1) throw $deadlock(); };
$rD = $decidir(['acao' => 'ignorar', 'itens' => $it(...$D), 'confirmar' => true], 'k-c-dead-001'); StmtGanchoC::$apos = null;
$ok('deadlock uma vez → repete o item e aplica (3 aplicadas)', $rD['resumo']['aplicadas'] === 3 && $vezes === 2, json_encode($rD['itens']));
$D2 = [$nova(9044, $P, '2.5'), $nova(9045, $P, '2.5'), $nova(9046, $P, '2.5')];
StmtGanchoC::$apos = function (string $sql, array $p) use ($D2, $deadlock) { if (str_contains($sql, 'UPDATE') && str_contains($sql, 'eq_sugestao') && str_contains($sql, 'versao = versao + 1') && in_array($D2[1], $p, true)) throw $deadlock(); };
$rD = $decidir(['acao' => 'recusar', 'itens' => $it(...$D2), 'confirmar' => true], 'k-c-dead-002'); StmtGanchoC::$apos = null;
$ok('deadlock persistente → item 2 não aplicada erro_tecnico (nunca "Recusada"); itens 1 e 3 seguem', $motivos($rD['itens']) === [null, 'erro_tecnico', null]
    && $sugRow($D2[1])['estado'] === 'pendente' && $sugRow($D2[0])['estado'] === 'recusada' && $sugRow($D2[2])['estado'] === 'recusada', json_encode($rD['itens']));

// ===================================== (7) CARGA — regra única, ciclo da revisão, substituída, idempotência ==============================
$cargas = new Cargas($pdo, $db, false, static fn() => null);
$propor = fn(int $pid, ?string $v, bool $seco = false) => ($seco ? new Cargas($pdo, $db, true, static fn() => null) : $cargas)->proporSugestao(['fonte' => 'nome_produto', 'tipo' => 'valor', 'product_id' => $pid,
    'atributo_id' => $T, 'alt' => null, 'valor' => $v, 'opcao' => null, 'unidade' => $U['Hz'], 'confianca' => 'media', 'evidencia' => "teste $v", 'lote' => null, 'usuario' => 'carga:teste', 'motivo' => 'teste']);
$linhasId = fn(int $pid) => $todas('SELECT id, chave, estado, valor_proposto, substitui_id, conteudo_hash FROM eq_sugestao WHERE product_id = ? AND atributo_id = ? ORDER BY id', [$pid, $T]);
$ok('modo SECO não grava nada', $propor(9101, '3840', true) === 'criada' && $linhasId(9101) === []);
$ok('cria a original; 2ª execução igual → ja_existia', $propor(9101, '3840') === 'criada' && $propor(9101, '3840') === 'ja_existia' && count($linhasId(9101)) === 1);
$ok('hash PHP == coluna GERADA conteudo_hash', $linhasId(9101)[0]['conteudo_hash'] === Cargas::hashConteudo(null, '3840', null, $U['Hz']));
$ok('pendente + conteúdo novo → revista no lugar (mesma linha, hash novo)', $propor(9101, '1920') === 'revista' && count($linhasId(9101)) === 1 && $linhasId(9101)[0]['valor_proposto'] === '1920'
    && $linhasId(9101)[0]['conteudo_hash'] === Cargas::hashConteudo(null, '1920', null, $U['Hz']));
// o CICLO da revisão: recusada A → sucessora B → revisada para C → recusada → carga acha B → nova linha r:<2ª>, sem colisão; A ou C → nada
$ok('ciclo 1: A criada e recusada', $propor(9102, 'A') === 'criada' && ($idA = (int) $linhasId(9102)[0]['id']) > 0 && $sug->decidir(['id' => $idA, 'versao' => 1, 'decisao' => 'recusar'])['decisao'] === 'recusar');
$ok('ciclo 2: carga acha B → sucessora r:A', $propor(9102, 'B') === 'sucessora' && ($l2 = $linhasId(9102)[1])['chave'] === "nome_produto|9102|$T|r:" . $linhasId(9102)[0]['id'] && (int) $l2['substitui_id'] === (int) $linhasId(9102)[0]['id']);
$ok('ciclo 3: carga acha C → revisa a sucessora no lugar (chave r:A continua)', $propor(9102, 'C') === 'revista' && count($linhasId(9102)) === 2 && $linhasId(9102)[1]['valor_proposto'] === 'C');
$id2 = (int) $linhasId(9102)[1]['id'];
$ok('ciclo 4: a sucessora é recusada com C', $sug->decidir(['id' => $id2, 'versao' => (int) $sugRow($id2)['versao'], 'decisao' => 'recusar'])['decisao'] === 'recusar');
$ok('ciclo 5: carga acha B de novo → linha nova r:<id da 2ª>, SEM colisão', $propor(9102, 'B') === 'sucessora' && count($linhasId(9102)) === 3 && $linhasId(9102)[2]['chave'] === "nome_produto|9102|$T|r:$id2" && $linhasId(9102)[2]['estado'] === 'pendente');
$ok('ciclo 6: A ou C (recusadas) → nada', $propor(9102, 'A') === 'recusada_igual' && $propor(9102, 'C') === 'recusada_igual' && count($linhasId(9102)) === 3 && $linhasId(9102)[2]['valor_proposto'] === 'B');
// ignorada + conteúdo novo → substituída + sucessora na MESMA transação
$propor(9103, 'X'); $idX = (int) $linhasId(9103)[0]['id']; $sug->decidir(['id' => $idX, 'versao' => 1, 'decisao' => 'ignorar']);
$ok('ignorada + mesmo conteúdo → nada', $propor(9103, 'X') === 'ja_existia' && $sugRow($idX)['estado'] === 'ignorada');
$ok('ignorada + conteúdo novo → substituida + sucessora pendente; auditoria substituir_sugestao', $propor(9103, 'Y') === 'sucessora' && $sugRow($idX)['estado'] === 'substituida'
    && $linhasId(9103)[1]['estado'] === 'pendente' && (int) $um("SELECT COUNT(*) FROM eq_auditoria WHERE acao = 'substituir_sugestao' AND entidade_id = ?", [(string) $idX]) === 1);
$e = $erro(fn() => $sug->decidir(['id' => $idX, 'versao' => (int) $sugRow($idX)['versao'], 'decisao' => 'devolver']));
$ok('substituída não volta à fila (só ignorada devolve)', $e instanceof AtributosErro && $e->http === 409 && $sugRow($idX)['estado'] === 'substituida');
$ok('pendente revisada para conteúdo IGUAL a uma recusada → não revisa', $propor(9102, 'C') === 'recusada_igual' && $linhasId(9102)[2]['valor_proposto'] === 'B');
// aceita: nada
$propor(9104, '960'); $idAc = (int) $linhasId(9104)[0]['id']; $sug->decidir(['id' => $idAc, 'versao' => 1, 'decisao' => 'aceitar']);
$ok('aceita + conteúdo novo → nada (D10)', $propor(9104, '7680') === 'ja_existia' && count($linhasId(9104)) === 1);
$nLinhas = (int) $um('SELECT COUNT(*) FROM eq_sugestao'); foreach ([9101 => '1920', 9102 => 'B', 9103 => 'Y', 9104 => '7680'] as $pid => $v) $propor($pid, $v);
$ok('reexecução da carga inteira sem efeito (idempotente)', (int) $um('SELECT COUNT(*) FROM eq_sugestao') === $nLinhas);

// ===================================== (8) TOTAL E PAGINAÇÃO =========================================================================
$leit = $leitDe();
$base = (int) $um("SELECT COUNT(*) FROM eq_sugestao WHERE fonte = 'nome_produto' AND estado = 'pendente'");
for ($pid = 9201; $pid <= 9330; $pid++) $nova($pid, $P, '2.5');   // +130 pendentes
$tot = (int) $um("SELECT COUNT(*) FROM eq_sugestao WHERE fonte = 'nome_produto' AND estado = 'pendente'");
$pg = $leit->conferenciaFila(['fila' => 'nome'], $ADM['id']);
$ok('total = COUNT real; 50 por página; cursor presente', $pg['total'] === $tot && count($pg['itens']) === 50 && $pg['por_pagina'] === 50 && is_string($pg['proximo_cursor']), "total {$pg['total']} × $tot");
$vistos = []; $cur = null; $pag = 0; $decididoNoMeio = null; $aindaNaoVisto = null;
do {
    $pg = $leit->conferenciaFila(['fila' => 'nome'] + ($cur ? ['cursor' => $cur] : []), $ADM['id']); $pag++;
    foreach ($pg['itens'] as $x) $vistos[] = $x['id'];
    if ($pag === 1) {   // no meio do percurso: decide um já visto e um ainda não visto
        $decididoNoMeio = $vistos[3];
        $ids = array_map('intval', array_column($todas("SELECT id FROM eq_sugestao WHERE fonte = 'nome_produto' AND estado = 'pendente' ORDER BY product_id, atributo_id, id"), 'id'));
        $aindaNaoVisto = $ids[count($ids) - 5];
        foreach ([$decididoNoMeio, $aindaNaoVisto] as $d) $sug->decidir(['id' => $d, 'versao' => (int) $sugRow($d)['versao'], 'decisao' => 'ignorar']);
    }
    $cur = $pg['proximo_cursor'];
} while ($cur !== null && $pag < 20);
$restantes = array_map('intval', array_column($todas("SELECT id FROM eq_sugestao WHERE fonte = 'nome_produto' AND estado = 'pendente'"), 'id'));
$ok('percurso pelo cursor: nenhuma repetição', count($vistos) === count(array_unique($vistos)));
$ok('percurso pelo cursor: toda pendente que restou foi vista (nenhum buraco); a decidida depois sumiu', !array_diff($restantes, $vistos) && !in_array($aindaNaoVisto, $vistos, true), 'faltaram ' . json_encode(array_values(array_diff($restantes, $vistos))));
$ok('filtro atributo_id + q (ID exato) → total coerente', ($f = $leit->conferenciaFila(['fila' => 'nome', 'atributo_id' => (string) $P, 'q' => '9250'], $ADM['id']))['total'] === 1 && $f['itens'][0]['product_id'] === 9250);
$ok('busca sem resultado → total 0 legítimo', $leit->conferenciaFila(['fila' => 'nome', 'q' => 'não existe nada assim'], $ADM['id'])['total'] === 0);
$ok('situação Ignoradas lista as ignoradas (Devolver)', ($f = $leit->conferenciaFila(['fila' => 'nome', 'estado' => 'ignorada'], $ADM['id']))['total'] === (int) $um("SELECT COUNT(*) FROM eq_sugestao WHERE fonte = 'nome_produto' AND estado = 'ignorada'") && $f['itens'][0]['estado'] === 'ignorada');
$ok('situação Recusadas: leitura com quem/quando', ($f = $leit->conferenciaFila(['fila' => 'nome', 'estado' => 'recusada'], $ADM['id']))['total'] > 0 && $f['itens'][0]['decidido_em'] !== null);
$e = $erro(fn() => $leit->conferenciaFila(['fila' => 'nome', 'cursor' => 'lixo!!'], $ADM['id']));
$ok('cursor inválido → 422', $e instanceof AtributosErro && $e->http === 422);
$e = $erro(fn() => $leit->conferenciaFila(['fila' => 'xyz'], $ADM['id']));
$ok('fila inválida → 422', $e instanceof AtributosErro && $e->http === 422);
$e = $erro(fn() => (new ProdutosLeitura(new LeituraVitrinePdo($pdo, 'ATRWEB_VAL_T_NAO_EXISTE', $db), $repo, 80, null, true, true))->conferenciaFila(['fila' => 'nome'], $ADM['id']));
$ok('falha de consulta → ERRO (nunca lista vazia com total 0)', $e instanceof Throwable);
// > 3000 pendentes no legado: total real (D-1)
$vv = []; for ($i = 1; $i <= 775; $i++) foreach ([$P, $T, $A['tipo_do_led_87'], $A['extra']] as $a) $vv[] = "('legado_2025|" . (9000 + $i) . "|$a', " . (9000 + $i) . ", $a, 'legado_2025', 'valor', '1', 'pendente')";
foreach (array_chunk($vv, 500) as $ch) $pdo->exec('INSERT INTO eq_sugestao (chave, product_id, atributo_id, fonte, tipo, valor_proposto, estado) VALUES ' . implode(',', $ch));
$conf = $leit->conferencia();
$ok('> 3000 pendentes: GET conferencia totais.legado = 3100 (a lista antiga continua cortada em 3000)', $conf['totais']['legado'] === 3100 && count($conf['filas']['legado']) === 3000, json_encode($conf['totais']));
$ok('> 3000: conferencia_fila legado total 3100', $leit->conferenciaFila(['fila' => 'legado'], $ADM['id'])['total'] === 3100);
// filas DERIVADAS: cursor por chave (fora da ficha com valor gravado), remoção no meio
for ($pid = 9401; $pid <= 9470; $pid++) $pdo->prepare("INSERT INTO eq_valor (product_id, atributo_id, opcao_id, opcao_chave, valor_texto, estado, origem, atualizado_por) VALUES (?, ?, NULL, 0, ?, 'informado', 'manual', 't')")->execute([$pid, $A['extra'], "extra $pid"]);
$totFora = $leit->conferenciaFila(['fila' => 'fora_da_ficha'], $ADM['id'])['total'];
$ok('fora da ficha: total = 70 + o que já havia; 1ª página traz valor gravado', $totFora >= 70 && ($p1 = $leit->conferenciaFila(['fila' => 'fora_da_ficha'], $ADM['id']))['itens'][0]['valor']['estado'] === 'informado');
$vistos = []; $cur = null; $pag = 0; $sumiu = null;
do {
    $pg = $leit->conferenciaFila(['fila' => 'fora_da_ficha'] + ($cur ? ['cursor' => $cur] : []), $ADM['id']); $pag++;
    foreach ($pg['itens'] as $x) $vistos[] = $x['product_id'] . ':' . $x['atributo_id'];
    if ($pag === 1) { $sumiu = 9465; $pdo->prepare('UPDATE eq_valor SET excluido_em = CURRENT_TIMESTAMP(3) WHERE product_id = ? AND atributo_id = ?')->execute([$sumiu, $A['extra']]);   // resolvida no meio
                      $pdo->prepare('UPDATE eq_valor SET excluido_em = CURRENT_TIMESTAMP(3) WHERE product_id = ? AND atributo_id = ?')->execute([9401, $A['extra']]); }
    $cur = $pg['proximo_cursor'];
} while ($cur !== null && $pag < 20);
$restam = array_map(fn($r) => $r['product_id'] . ':' . $r['atributo_id'], $todas('SELECT product_id, atributo_id FROM eq_valor WHERE atributo_id = ? AND excluido_em IS NULL', [$A['extra']]));
$ok('fila derivada: sem repetição e sem buraco quando uma pendência some no meio', count($vistos) === count(array_unique($vistos)) && !array_diff($restam, $vistos) && !in_array("$sumiu:{$A['extra']}", $vistos, true));
$ok('obrigatórios vazios: lista inteira paginada, total coerente', ($o = $leit->conferenciaFila(['fila' => 'obrigatorios_vazios'], $ADM['id']))['total'] >= 700 && count($o['itens']) === 50 && $o['proximo_cursor'] !== null);
$ok('sem kit: cursor de 1 parte (produto)', ($sk = $leit->conferenciaFila(['fila' => 'sem_kit'], $ADM['id']))['total'] === 800 && count(json_decode((string) base64_decode(strtr($sk['proximo_cursor'], '-_', '+/')), true)) === 1);

// ===================================== (9) DESTINO ATUAL / ACEITE BLOQUEADO ===========================================================
$sCom = $nova(9501, $P, '2.5');
$pdo->prepare("INSERT INTO eq_valor (product_id, atributo_id, opcao_id, opcao_chave, valor_num, unidade_id, estado, origem, atualizado_por) VALUES (9501, ?, NULL, 0, 4, ?, 'informado', 'manual', 't')")->execute([$P, $U['mm']]);
$sIn = $nova(9502, $A['inativo'], 'x'); $sVaz = $nova(9503, $P, '2.5');
$pdo->prepare("INSERT INTO eq_valor (product_id, atributo_id, opcao_id, opcao_chave, estado, origem, atualizado_por) VALUES (9504, ?, NULL, 0, 'nao_se_aplica', 'manual', 't')")->execute([$P]); $sNsa = $nova(9504, $P, '2.5');
$porId = fn(int $nivel = 80) => array_column($leitDe($nivel)->conferenciaFila(['fila' => 'nome', 'q' => '950'], $ADM['id'])['itens'], null, 'id');
$x = $porId();
$ok('destino com valor → destino_atual informado (4 mm) e aceite_bloqueado COM_VALOR', ($x[$sCom]['destino_atual']['estado'] ?? null) === 'informado' && ($x[$sCom]['destino_atual']['unidade'] ?? null) === 'mm' && $x[$sCom]['aceite_bloqueado'] === 'COM_VALOR', json_encode($x[$sCom] ?? null));
$ok('não se aplica → bloqueado COM_VALOR com estado nao_se_aplica', ($x[$sNsa]['destino_atual']['estado'] ?? null) === 'nao_se_aplica' && $x[$sNsa]['aceite_bloqueado'] === 'COM_VALOR');
$ok('destino vazio → estado vazio, aceite livre', ($x[$sVaz]['destino_atual'] ?? null) === ['estado' => 'vazio'] && $x[$sVaz]['aceite_bloqueado'] === null);
$ok('atributo inativo → ATRIBUTO_INATIVO', ($x[$sIn]['aceite_bloqueado'] ?? null) === 'ATRIBUTO_INATIVO');
$ok('nível 50 → SEM_PERMISSAO', ($porId(50)[$sVaz]['aceite_bloqueado'] ?? null) === 'SEM_PERMISSAO');

// ===================================== (10) PERMISSÕES, REABRIR (Q-SUG.6) E CHAVE ===================================================
$sR = $nova(9601, $P, '2.5'); $sug->decidir(['id' => $sR, 'versao' => 1, 'decisao' => 'recusar']);
$e = $erro(fn() => $decidir(['acao' => 'ignorar', 'itens' => $it($sVaz), 'confirmar' => true], 'k-c-n50-0001', $sugDe($ADM, 50)));
$ok('nível 50 → 403 INSUFFICIENT_LEVEL', $e instanceof AtributosErro && $e->http === 403);
$e = $erro(fn() => (new OperacoesGravacao($repo, $ADM['id'], $ADM['email'], 50, true))->executar('sugestoes_decidir', ['acao' => 'ignorar', 'itens' => $it($sVaz), 'confirmar' => true], 'k-c-n50-0002', fn() => throw new LogicException('não executa')));
$ok('porta da camada (nível 50) barra ANTES do serviço', $e instanceof AtributosErro && $e->http === 403);
$e = $erro(fn() => $decidir(['acao' => 'reabrir', 'itens' => $it($sR), 'confirmar' => true, 'motivo' => 'engano'], 'k-c-reab-001', $sugDe($OUT, 80, false)));
$ok('Reabrir por quem NÃO administra → 403 NOT_CATALOG_ADMIN', $e instanceof AtributosErro && $e->codigo === 'NOT_CATALOG_ADMIN');
$e = $erro(fn() => $decidir(['acao' => 'reabrir', 'itens' => $it($sR), 'confirmar' => true], 'k-c-reab-002'));
$ok('Reabrir sem motivo → 422', $e instanceof AtributosErro && $e->http === 422 && in_array('motivo', $e->campos, true));
$r = $decidir(['acao' => 'reabrir', 'itens' => $it($sR), 'confirmar' => true, 'motivo' => 'recusei por engano'], 'k-c-reab-003');
$ok('Reabrir (admin + motivo): recusada → pendente; auditoria reabrir_sugestao com o motivo', ($r['itens'][0]['desfecho'] ?? null) === 'aplicada' && $sugRow($sR)['estado'] === 'pendente'
    && (int) $um("SELECT COUNT(*) FROM eq_auditoria WHERE acao = 'reabrir_sugestao' AND motivo = 'recusei por engano'") === 1);
$ok('Reabrir recusada que tem sucessora → CONFLICT tem_sucessora', ($r = $decidir(['acao' => 'reabrir', 'itens' => $it($idA), 'confirmar' => true, 'motivo' => 'tentar'], 'k-c-reab-004'))['itens'][0]['detalhe'] === 'tem_sucessora' && $sugRow($idA)['estado'] === 'recusada');
$e = $erro(fn() => $sug->decidirLote(['acao' => 'ignorar', 'itens' => $it($sVaz), 'confirmar' => true], null));
$ok('sugestoes_decidir sem chave (sem lote) → 422 CHAVE_OBRIGATORIA', $e instanceof AtributosErro && $e->codigo === 'CHAVE_OBRIGATORIA');
$exige = fn(string $r, ?string $k, ?string $o) => $erro(fn() => OperacoesGravacao::exigirChave($r, $k, $o));
$ok('exigirChave: sugestoes_decidir sem chave → 422', ($x = $exige('sugestoes_decidir', null, null)) instanceof AtributosErro && $x->codigo === 'CHAVE_OBRIGATORIA');
$ok('exigirChave: produto_kit/produto_atributo/sugestao com X-Origem conferencia sem chave → 422', $exige('produto_kit', null, 'conferencia') instanceof AtributosErro && $exige('produto_atributo', null, 'conferencia') instanceof AtributosErro && $exige('sugestao', null, 'conferencia') instanceof AtributosErro);
$ok('exigirChave: Ficha (sem X-Origem) segue como hoje; com chave passa', $exige('produto_kit', null, null) === null && $exige('produto_atributo', 'k-qualquer-1', 'conferencia') === null && $exige('valor', null, 'conferencia') === null);
$e = $erro(fn() => $decidir(['acao' => 'ignorar', 'itens' => [['id' => $sVaz, 'versao' => 1], ['id' => $sVaz, 'versao' => 1]], 'confirmar' => true], 'k-c-val-0001'));
$ok('validação: item repetido → 422', $e instanceof AtributosErro && $e->http === 422);
$e = $erro(fn() => $decidir(['acao' => 'ignorar', 'itens' => $it($sVaz)], 'k-c-val-0002'));
$ok('validação: sem confirmar → 422', $e instanceof AtributosErro && $e->http === 422);
$e = $erro(fn() => $decidir(['acao' => 'apagar', 'itens' => $it($sVaz), 'confirmar' => true], 'k-c-val-0003'));
$ok('validação: ação desconhecida → 422', $e instanceof AtributosErro && $e->http === 422);
$e = $erro(fn() => $decidir(['acao' => 'ignorar', 'itens' => array_map(fn($i) => ['id' => $i, 'versao' => 1], range(1, 201)), 'confirmar' => true], 'k-c-val-0004'));
$ok('validação: mais de 200 itens → 422', $e instanceof AtributosErro && $e->http === 422);

echo ($falhas === 0 ? '[OK]  ' : '[ERRO]') . " sugestoes-c-mysql (Parte C: transições, D10, corrida, lote/Concluir/fencing, erro técnico, carga/ciclo, total/cursor, destino, permissões): $n casos, $falhas falha(s) ($db)\n";
exit($falhas === 0 ? 0 : 1);
