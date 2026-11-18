<?php
// Produtos & Atributos — HOTFIX-2 de integridade (18/11, Codex DSHOW-077): teste de BANCO REAL do PAYLOAD enviado, do que o servidor
// PERSISTE e do que AUDITA em: DSHOW-034 (resíduo ESCALAR — pedido antigo que saiu do campo VAZIO, depois de vazio → preenchido → vazio)
// e DSHOW-079 (número gravado na unidade do PEDIDO; unidade que deixou de valer → 422 `unidade_id`, sem gravar nem auditar).
// Num schema ATRWEB_VAL_T_7/_8/_9 VAZIO com as migrações 001–010 aplicadas (molde e recusas do hotfix-integridade-mysql.php). Catálogo falso.
// Entradas: EQ_TEST_CNF (arquivo de opções [client]) e EQ_TEST_DB ∈ {ATRWEB_VAL_T_7, ATRWEB_VAL_T_8, ATRWEB_VAL_T_9}, vazio.
// Saída: 0 verde · 1 falha · 2 não executado · 3 recusado.
declare(strict_types=1);
require_once __DIR__ . '/../../../api/atributos/AtributosRepo.php';
require_once __DIR__ . '/../../../api/atributos/KitsService.php';
require_once __DIR__ . '/../../../api/atributos/Permissoes.php';
require_once __DIR__ . '/_memoria.php';

[$cnf, $db] = [(string) (getenv('EQ_TEST_CNF') ?: ''), (string) (getenv('EQ_TEST_DB') ?: '')];
$dir = __DIR__ . '/../../../db/equipamentos/migrations';
if ($cnf === '' || $db === '' || !is_readable($cnf)) { echo "[NÃO EXECUTADO] hotfix2-mysql: faltam EQ_TEST_CNF/EQ_TEST_DB\n"; exit(2); }
if (!preg_match('/^ATRWEB_VAL_T_[A-Za-z0-9_]{1,40}$/', $db)) { echo "[RECUSADO] hotfix2-mysql: EQ_TEST_DB precisa ser ATRWEB_VAL_T_*\n"; exit(3); }
if (!in_array($db, ['ATRWEB_VAL_T_7', 'ATRWEB_VAL_T_8', 'ATRWEB_VAL_T_9'], true)) { echo "[RECUSADO] hotfix2-mysql: só ATRWEB_VAL_T_7, _T_8 ou _T_9\n"; exit(3); }

$ini = parse_ini_file($cnf, true, INI_SCANNER_RAW) ?: []; $c = $ini['client'] ?? [];
$tira = fn($v) => trim((string) $v, " \t\"'");
$dsn = 'mysql:' . (isset($c['socket']) ? 'unix_socket=' . $tira($c['socket']) : 'host=' . $tira($c['host'] ?? '127.0.0.1') . ';port=' . (int) ($c['port'] ?? 3306)) . ";dbname=$db;charset=utf8mb4";
try { $pdo = new PDO($dsn, $tira($c['user'] ?? ''), $tira($c['password'] ?? ''), [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]); }
catch (PDOException $e) { echo '[ERRO] hotfix2-mysql: conexão recusada (código ' . $e->getCode() . ")\n"; exit(1); }
if ((string) $pdo->query('SELECT DATABASE()')->fetchColumn() !== $db) { echo "[RECUSADO] hotfix2-mysql: a conexão não está em $db\n"; exit(3); }
if ((int) $pdo->query('SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE()')->fetchColumn() !== 0) { echo "[RECUSADO] hotfix2-mysql: $db não está vazio\n"; exit(3); }

$arqs = array_values(array_filter(glob("$dir/[0-9][0-9][0-9]_*.sql") ?: [], static fn($f) => !str_ends_with($f, '.revert.sql'))); sort($arqs, SORT_STRING);
foreach ($arqs as $arq) foreach (preg_split('/;\s*\n/', (string) preg_replace('/^--.*$/m', '', (string) file_get_contents($arq))) ?: [] as $st) {
    $st = trim($st); if ($st === '') continue;
    if (!preg_match('/^(CREATE TABLE IF NOT EXISTS|ALTER TABLE|INSERT (IGNORE )?INTO|UPDATE) `eq_[a-z_]+`/i', $st)) { echo '[RECUSADO] hotfix2-mysql: comando fora da lista em ' . basename($arq) . "\n"; exit(3); }
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
$todas = fn(string $sql, array $p = []) => (function () use ($pdo, $sql, $p) { $s = $pdo->prepare($sql); $s->execute($p); return $s->fetchAll(PDO::FETCH_ASSOC); })();

$ok('migrações 001–010 aplicadas', (int) $um('SELECT COUNT(*) FROM eq_schema_migrations') === count($arqs));

$cat = new CatalogoMemoria();
foreach ([[101, 'CABLE'], [102, 'CABLE'], [103, 'CABLE'], [104, 'CABLE'], [105, 'CABLE']] as [$id, $sub])
    $cat->p[$id] = ['id' => $id, 'nome' => "Produto $id (sintético)", 'categoria' => 'LED_PANEL', 'subcategoria' => $sub, 'ativo' => true, 'excluido' => false, 'sincronizado_em' => null];
$repo = new AtributosRepoPdo($pdo, '');
$adm = new AtributosService($repo, 80, 'admin@exemplo.invalid', $cat);
$kits = new KitsService($repo, 80, 'admin@exemplo.invalid', $cat);
$verVinc = fn(int $pid): string => $repo->versoesVinculos([$pid])[$pid];
$aj = fn(array $b) => $kits->definirAjuste($b + ['versao_vinculos' => $verVinc((int) $b['product_id'])]);

// fotografias do banco por (produto, atributo): trilha inteira (vivas + tombstones), revisão do conjunto como a ficha a calcula, auditoria
$trilha = fn(int $pid, int $aid) => $todas('SELECT opcao_chave, valor_texto, valor_num, unidade_id, estado, versao, excluido_em IS NOT NULL AS excluida FROM eq_valor WHERE product_id = ? AND atributo_id = ? ORDER BY opcao_chave', [$pid, $aid]);
$vc = fn(int $pid, int $aid): string => AtributosService::versaoConjunto($trilha($pid, $aid));   // mesma fórmula do DTO da ficha (ProdutosLeitura)
$aud = fn(int $pid, int $aid) => $todas("SELECT acao, usuario, antes, depois FROM eq_auditoria WHERE entidade = 'valor' AND entidade_id = ? ORDER BY id", ["$pid:$aid:0"]);
$vivo = fn(int $pid, int $aid) => $todas('SELECT valor_texto, valor_num, unidade_id, estado, versao FROM eq_valor WHERE product_id = ? AND atributo_id = ? AND opcao_chave = 0 AND excluido_em IS NULL', [$pid, $aid])[0] ?? null;

// =========================================================================================================================================
// DSHOW-034 · resíduo ESCALAR: POST antigo saído do campo VAZIO (sem `versao`, com `versao_conjunto`) depois de vazio → B preenche → B limpa
// =========================================================================================================================================
$tx = (int) $adm->salvarAtributo(['rotulo' => 'Observação HF2-034', 'tipo' => 'texto'])['atributo']['id'];
$aj(['product_id' => 101, 'atributo_id' => $tx, 'modo' => 'incluir']);
// T0/T1: a aba A vê o campo vazio (revisão "0") e o POST de A fica retido — este é o corpo que o EditorValor monta (sem `versao`: não há valor)
$rev0 = $vc(101, $tx);
$payloadA = ['product_id' => 101, 'atributo_id' => $tx, 'versao_conjunto' => $rev0, 'valor' => 'Valor de A', 'estado' => 'informado'];
$ok('034: PAYLOAD de A = campo vazio: revisão "0", sem versão de linha', $rev0 === '0' && !array_key_exists('versao', $payloadA), json_encode($payloadA));
// T2: B (controle positivo do 1º preenchimento, mesma revisão "0") preenche e confirma
$rB = $adm->gravarValor(['product_id' => 101, 'atributo_id' => $tx, 'versao_conjunto' => $rev0, 'valor' => 'Valor de B', 'estado' => 'informado']);
$ok('034 controle: 1º preenchimento com revisão "0" grava (PERSISTIDO "Valor de B", versão 1)', ($vivo(101, $tx)['valor_texto'] ?? null) === 'Valor de B' && (int) $vivo(101, $tx)['versao'] === 1 && ($rB['valor']['valor_texto'] ?? null) === 'Valor de B');
$ok('034 controle: 1º preenchimento gera UMA auditoria "preencher"', array_column($aud(101, $tx), 'acao') === ['preencher']);
// T3: B limpa explicitamente (com a versão da linha que leu)
$adm->limparValor(['product_id' => 101, 'atributo_id' => $tx, 'versao' => 1, 'versao_conjunto' => $vc(101, $tx)]);
$t3 = $trilha(101, $tx); $a3 = $aud(101, $tx); $rev3 = $vc(101, $tx);
$ok('034: depois da limpeza de B o campo está vazio (tombstone versão 2) e a revisão mudou ("0" → "2")', $vivo(101, $tx) === null && (int) $t3[0]['versao'] === 2 && (int) $t3[0]['excluida'] === 1 && $rev3 === '2', json_encode($t3));
// T4: o POST antigo de A chega
$eA = $erro(fn() => $adm->gravarValor($payloadA));
$ok('034: POST antigo de A (saiu do vazio "0") depois de vazio → B → vazio → 409 CONFLICT', $eA?->http === 409 && $eA->codigo === 'CONFLICT', $eA ? $eA->codigo . ' ' . $eA->getMessage() : 'aceito; vivo=' . json_encode($vivo(101, $tx)));
$ok('034: PERSISTIDO — nada reativado: trilha idêntica (tombstone versão 2), campo vazio', $trilha(101, $tx) === $t3 && $vivo(101, $tx) === null, json_encode($trilha(101, $tx)));
$ok('034: AUDITORIA — nenhuma linha nova (só "preencher" e "limpar")', $aud(101, $tx) === $a3 && array_column($a3, 'acao') === ['preencher', 'limpar'], json_encode(array_column($aud(101, $tx), 'acao')));
// variante com estado especial (A tinha escolhido "Não se aplica" no vazio)
$eA2 = $erro(fn() => $adm->gravarValor(['product_id' => 101, 'atributo_id' => $tx, 'versao_conjunto' => $rev0, 'estado' => 'nao_se_aplica']));
$ok('034: estado especial antigo saído do vazio → 409; trilha e auditoria intactas', $eA2?->http === 409 && $trilha(101, $tx) === $t3 && $aud(101, $tx) === $a3);
// revisão malformada no vazio → 422 com o campo, nada muda
$eM = $erro(fn() => $adm->gravarValor(['product_id' => 101, 'atributo_id' => $tx, 'versao_conjunto' => '02', 'valor' => 'X']));
$ok('034: revisão MALFORMADA no vazio → 422 versao_conjunto, nada muda', $eM?->http === 422 && $eM->campos === ['versao_conjunto'] && $trilha(101, $tx) === $t3 && $aud(101, $tx) === $a3);
// controle: quem RELÊ (revisão atual "2") preenche normalmente — reativa o tombstone e audita UMA vez
$adm->gravarValor(['product_id' => 101, 'atributo_id' => $tx, 'versao_conjunto' => $rev3, 'valor' => 'Valor de A', 'estado' => 'informado']);
$ok('034 controle: com a revisão ATUAL o mesmo pedido grava (PERSISTIDO "Valor de A", tombstone reativado versão 3)', ($vivo(101, $tx)['valor_texto'] ?? null) === 'Valor de A' && (int) $vivo(101, $tx)['versao'] === 3 && count($trilha(101, $tx)) === 1);
$ok('034 controle: AUDITORIA +1 "editar" (antes = tombstone)', array_column($aud(101, $tx), 'acao') === ['preencher', 'limpar', 'editar']);
// idempotente: o MESMO valor reenviado (ex.: retentativa após sucesso) com a revisão antiga do vazio NÃO dá 409 falso
$a5 = $aud(101, $tx); $t5 = $trilha(101, $tx);
$eI = $erro(fn() => $adm->gravarValor($payloadA));
$ok('034 controle: mesmo valor já gravado, revisão antiga → 200 sem mudança (sem 409 falso), sem versão nova nem auditoria', $eI === null && $trilha(101, $tx) === $t5 && $aud(101, $tx) === $a5, $eI ? $eI->getMessage() : '');
// chamador legado que OMITE a revisão continua compatível (como hoje): vazio com trilha, sem `versao` nem `versao_conjunto` → grava
$adm->limparValor(['product_id' => 101, 'atributo_id' => $tx, 'versao' => 3]);
$a6 = count($aud(101, $tx));
$ok('034 controle: chamador legado (sem versao_conjunto) no vazio continua gravando', fn() => (bool) $adm->gravarValor(['product_id' => 101, 'atributo_id' => $tx, 'valor' => 'Legado'])
    && ($vivo(101, $tx)['valor_texto'] ?? null) === 'Legado' && count($aud(101, $tx)) === $a6 + 1);
// número (escalar) — mesmo ciclo
$nu = (int) $adm->salvarAtributo(['rotulo' => 'Quantidade HF2-034', 'tipo' => 'inteiro'])['atributo']['id'];
$aj(['product_id' => 101, 'atributo_id' => $nu, 'modo' => 'incluir']);
$pA = ['product_id' => 101, 'atributo_id' => $nu, 'versao_conjunto' => $vc(101, $nu), 'valor' => '7'];
$adm->gravarValor(['product_id' => 101, 'atributo_id' => $nu, 'versao_conjunto' => $vc(101, $nu), 'valor' => '9']);
$adm->limparValor(['product_id' => 101, 'atributo_id' => $nu, 'versao' => 1]);
$tN = $trilha(101, $nu); $aN = $aud(101, $nu);
$eN = $erro(fn() => $adm->gravarValor($pA));
$ok('034 inteiro: POST antigo do vazio após 9 → limpo → 409, trilha e auditoria intactas', $eN?->http === 409 && $trilha(101, $nu) === $tN && $aud(101, $nu) === $aN && $vivo(101, $nu) === null);

// =========================================================================================================================================
// DSHOW-079 · número gravado na unidade do PEDIDO (a que o operador via), nunca na vigente resolvida de novo; unidade que deixou de valer → 422
// =========================================================================================================================================
$adm->criarUnidade(['simbolo' => 'm', 'nome' => 'metro', 'grandeza' => 'comprimento', 'fator_base' => '1']);
$adm->criarUnidade(['simbolo' => 'cm', 'nome' => 'centímetro', 'grandeza' => 'comprimento', 'fator_base' => '0.01']);
$adm->criarUnidade(['simbolo' => 'mi079', 'nome' => 'milha (teste)', 'grandeza' => 'comprimento', 'fator_base' => '1609.344']);
$adm->criarUnidade(['simbolo' => 'kg', 'nome' => 'quilograma', 'grandeza' => 'massa', 'fator_base' => '1']);
$us = $adm->criarUnidade(['simbolo' => 'lb079', 'nome' => 'libra (teste)', 'grandeza' => 'massa', 'fator_base' => '0.45359237']);
$uid = array_column($us['unidades'], 'id', 'simbolo'); [$uM, $uCm, $uMi, $uKg, $uLb] = [(int) $uid['m'], (int) $uid['cm'], (int) $uid['mi079'], (int) $uid['kg'], (int) $uid['lb079']];
$alt = (int) $adm->salvarAtributo(['rotulo' => 'Altura HF2-079', 'tipo' => 'numero', 'unidade_id' => $uCm, 'casas' => 2])['atributo']['id'];
$adm->definirUnidadesPermitidas(['atributo_id' => $alt, 'unidades' => [$uKg], 'unidades_antes' => []]);   // extra EXPLÍCITA de outra grandeza
$vincU = fn(int $pid) => $um('SELECT unidade_id FROM eq_produto_atributo WHERE product_id = ? AND atributo_id = ? AND excluido_em IS NULL', [$pid, $alt]);
$num = fn($x) => $x === null ? null : (float) $x;
$ultAud = fn(int $pid) => ($l = $aud($pid, $alt)) ? ['acao' => end($l)['acao'], 'depois' => json_decode((string) end($l)['depois'], true)] : null;
$semNada = fn(int $pid) => $trilha($pid, $alt) === [] && $aud($pid, $alt) === [];
$corpo = fn(int $pid, string $v, ?int $u, array $x = []) => ['product_id' => $pid, 'atributo_id' => $alt, 'versao_conjunto' => $vc($pid, $alt), 'valor' => $v, 'estado' => 'informado'] + ($u !== null ? ['unidade_id' => $u] : []) + $x;

// cenário do DSHOW-077 §G: campo vazio exibindo "m" (vínculo do produto) → POST retido com unidade m → o vínculo vira "cm" → o POST chega
$aj(['product_id' => 102, 'atributo_id' => $alt, 'modo' => 'incluir', 'unidade_id' => $uM]);
$p079 = $corpo(102, '1', $uM);
$aj(['product_id' => 102, 'atributo_id' => $alt, 'modo' => 'incluir', 'unidade_id' => $uCm]);
$ok('079: PAYLOAD leva a unidade exibida (m); o vínculo mudou para cm antes de o POST chegar', $p079['unidade_id'] === $uM && (int) $vincU(102) === $uCm, json_encode($p079));
$e = $erro(fn() => $adm->gravarValor($p079));
$v = $vivo(102, $alt);
$ok('079: PERSISTIDO 1 m (a unidade do pedido), não 1 cm nem número convertido', $e === null && $num($v['valor_num'] ?? null) === 1.0 && (int) ($v['unidade_id'] ?? 0) === $uM, $e ? $e->getMessage() : json_encode($v));
$ok('079: AUDITORIA "preencher" com depois = 1 m', ($x = $ultAud(102)) !== null && count($aud(102, $alt)) === 1 && $x['acao'] === 'preencher' && (int) $x['depois']['unidade_id'] === $uM && $num($x['depois']['valor_num']) === 1.0, json_encode($ultAud(102)));
// controle: sem unidade_id → comportamento atual (DSHOW-048: grava a unidade EFETIVA de agora)
$aj(['product_id' => 103, 'atributo_id' => $alt, 'modo' => 'incluir', 'unidade_id' => $uM]);
$aj(['product_id' => 103, 'atributo_id' => $alt, 'modo' => 'incluir', 'unidade_id' => $uCm]);
$adm->gravarValor($corpo(103, '5', null));
$ok('079 controle: pedido SEM unidade_id → grava a vigente (cm), como hoje', (int) ($vivo(103, $alt)['unidade_id'] ?? 0) === $uCm && $num($vivo(103, $alt)['valor_num']) === 5.0 && count($aud(103, $alt)) === 1);
// controle: escolha EXPLÍCITA de outra unidade da mesma grandeza na edição → grava nela, sem converter
$adm->gravarValor($corpo(103, '2', $uM, ['versao' => (int) $vivo(103, $alt)['versao']]));
$ok('079 controle: edição com unidade explícita m (vigente cm) → PERSISTIDO 2 m, AUDITORIA "editar"', (int) $vivo(103, $alt)['unidade_id'] === $uM && $num($vivo(103, $alt)['valor_num']) === 2.0 && $ultAud(103)['acao'] === 'editar' && (int) $ultAud(103)['depois']['unidade_id'] === $uM);

// unidade que deixou de valer: era a extra kg (outra grandeza), o vínculo voltou para cm → 422 unidade_id, nada gravado nem auditado
$aj(['product_id' => 104, 'atributo_id' => $alt, 'modo' => 'incluir', 'unidade_id' => $uKg]);
$pKg = $corpo(104, '3', $uKg);
$aj(['product_id' => 104, 'atributo_id' => $alt, 'modo' => 'incluir', 'unidade_id' => $uCm]);
$e = $erro(fn() => $adm->gravarValor($pKg));
$ok('079: unidade de OUTRA grandeza que a vigente (kg × cm), mesmo sendo extra → 422 unidade_id com mensagem clara', $e?->http === 422 && $e->campos === ['unidade_id'] && str_contains($e->getMessage(), '"kg"') && str_contains($e->getMessage(), '"cm"') && str_contains($e->getMessage(), 'não foi gravado'), $e ? $e->getMessage() : 'aceito; vivo=' . json_encode($vivo(104, $alt)));
$ok('079: PERSISTIDO/AUDITORIA — nada (nenhuma linha em eq_valor, nenhuma auditoria)', $semNada(104), json_encode([$trilha(104, $alt), $aud(104, $alt)]));
// unidade desativada depois de exibida (era a vigente do vínculo) → 422, nada gravado
$aj(['product_id' => 105, 'atributo_id' => $alt, 'modo' => 'incluir', 'unidade_id' => $uMi]);
$pMi = $corpo(105, '4', $uMi);
$adm->definirUnidadeAtiva($uMi, false);
$e = $erro(fn() => $adm->gravarValor($pMi));
$ok('079: unidade DESATIVADA depois de exibida → 422 unidade_id ("desativada"), nada gravado nem auditado', $e?->http === 422 && $e->campos === ['unidade_id'] && str_contains($e->getMessage(), 'desativada') && $semNada(105), $e ? $e->getMessage() : 'aceito; vivo=' . json_encode($vivo(105, $alt)));
// não permitida (lb não é extra; grandeza massa ≠ comprimento) e inexistente → 422, nada gravado
$e = $erro(fn() => $adm->gravarValor($corpo(104, '3', $uLb)));
$ok('079: unidade não permitida → 422 unidade_id, nada gravado', $e?->http === 422 && $e->campos === ['unidade_id'] && $semNada(104));
$e = $erro(fn() => $adm->gravarValor($corpo(104, '3', 999999)));
$ok('079: unidade inexistente → 422 unidade_id, nada gravado', $e?->http === 422 && $e->campos === ['unidade_id'] && str_contains($e->getMessage(), 'inexistente') && $semNada(104));
// controles: zero na unidade do pedido; conversão explícita pelo diálogo continua convertendo (1 m → 100 cm)
$adm->gravarValor($corpo(104, '0', $uCm));
$ok('079 controle: zero com unidade explícita → PERSISTIDO 0 cm, AUDITORIA "preencher"', ($v = $vivo(104, $alt)) !== null && $num($v['valor_num']) === 0.0 && (int) $v['unidade_id'] === $uCm && $ultAud(104)['acao'] === 'preencher' && $num($ultAud(104)['depois']['valor_num']) === 0.0);
$adm->converterUnidade(['product_id' => 102, 'atributo_id' => $alt, 'unidade_id' => $uCm, 'converter' => true, 'versao' => (int) $vivo(102, $alt)['versao']]);
$ok('079 controle: conversão explícita 1 m → 100 cm (PERSISTIDO e AUDITORIA "editar" com motivo)', $num($vivo(102, $alt)['valor_num']) === 100.0 && (int) $vivo(102, $alt)['unidade_id'] === $uCm
    && $ultAud(102)['acao'] === 'editar' && (string) $um("SELECT motivo FROM eq_auditoria WHERE entidade = 'valor' AND entidade_id = ? ORDER BY id DESC LIMIT 1", ["102:$alt:0"]) === 'unidade convertida');
$adm->converterUnidade(['product_id' => 102, 'atributo_id' => $alt, 'unidade_id' => $uM, 'converter' => false, 'versao' => (int) $vivo(102, $alt)['versao']]);
$ok('079 controle: "só trocar a unidade" mantém o número (100 m), sem converter', $num($vivo(102, $alt)['valor_num']) === 100.0 && (int) $vivo(102, $alt)['unidade_id'] === $uM);

// @@FIM@@
echo ($falhas === 0 ? '[OK]  ' : '[FALHA]') . " hotfix2-mysql (034 escalar do vazio · 079 unidade do pedido): $n casos, $falhas falha(s)\n";
exit($falhas === 0 ? 0 : 1);
