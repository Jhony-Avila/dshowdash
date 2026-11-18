<?php
// Produtos & Atributos (missão 18/11) — teste de BANCO REAL do módulo: KitsService, SugestoesService e AtributosService (unidade por valor)
// sobre AtributosRepoPdo, num schema ATRWEB_VAL_T_* VAZIO com as migrações 001–010 aplicadas. Catálogo falso em memória.
// Cobre: kit (criar, itens, ≤4 destaques, escopos por diferença sem DELETE — ATR-M1, versão 409), kit direto, exceção com motivo (D-§9),
// avulso, prévia × aplicação em massa (idempotente pela chave, limite), sugestões (aceitar, repetir, D10 nunca sobrescreve, lote só com
// confirmação), conversão de unidade exata (DecimalExato) e a ficha da §9 lida do banco.
// Entradas: EQ_TEST_CNF (arquivo de opções [client]) e EQ_TEST_DB (ATRWEB_VAL_T_*, vazio). Saída: 0 verde · 1 falha · 2 não executado · 3 recusado.
declare(strict_types=1);
require_once __DIR__ . '/../../../api/atributos/AtributosRepo.php';
require_once __DIR__ . '/../../../api/atributos/KitsService.php';
require_once __DIR__ . '/../../../api/atributos/SugestoesService.php';
require_once __DIR__ . '/_memoria.php';

[$cnf, $db] = [(string) (getenv('EQ_TEST_CNF') ?: ''), (string) (getenv('EQ_TEST_DB') ?: '')];
$dir = __DIR__ . '/../../../db/equipamentos/migrations';
if ($cnf === '' || $db === '' || !is_readable($cnf)) { echo "[NÃO EXECUTADO] modulo-mysql: faltam EQ_TEST_CNF/EQ_TEST_DB\n"; exit(2); }
if (!preg_match('/^ATRWEB_VAL_T_[A-Za-z0-9_]{1,40}$/', $db)) { echo "[RECUSADO] modulo-mysql: EQ_TEST_DB precisa ser ATRWEB_VAL_T_*\n"; exit(3); }

$ini = parse_ini_file($cnf, true, INI_SCANNER_RAW) ?: []; $c = $ini['client'] ?? [];
$tira = fn($v) => trim((string) $v, " \t\"'");
$dsn = 'mysql:' . (isset($c['socket']) ? 'unix_socket=' . $tira($c['socket']) : 'host=' . $tira($c['host'] ?? '127.0.0.1') . ';port=' . (int) ($c['port'] ?? 3306)) . ";dbname=$db;charset=utf8mb4";
try { $pdo = new PDO($dsn, $tira($c['user'] ?? ''), $tira($c['password'] ?? ''), [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]); }
catch (PDOException $e) { echo '[ERRO] modulo-mysql: conexão recusada (código ' . $e->getCode() . ")\n"; exit(1); }
if ((int) $pdo->query('SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE()')->fetchColumn() !== 0) { echo "[RECUSADO] modulo-mysql: $db não está vazio\n"; exit(3); }

$arqs = array_values(array_filter(glob("$dir/[0-9][0-9][0-9]_*.sql") ?: [], static fn($f) => !str_ends_with($f, '.revert.sql'))); sort($arqs, SORT_STRING);
foreach ($arqs as $arq) foreach (preg_split('/;\s*\n/', (string) preg_replace('/^--.*$/m', '', (string) file_get_contents($arq))) ?: [] as $st) {
    $st = trim($st); if ($st === '') continue;
    if (!preg_match('/^(CREATE TABLE IF NOT EXISTS|ALTER TABLE|INSERT (IGNORE )?INTO|UPDATE) `eq_[a-z_]+`/i', $st)) { echo '[RECUSADO] modulo-mysql: comando fora da lista em ' . basename($arq) . "\n"; exit(3); }
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

$ok('migrações 001–010 aplicadas', (int) $um('SELECT COUNT(*) FROM eq_schema_migrations') === count($arqs));

// ---- catálogo falso: 6 cabos, 2 fontes, 1 inativo -------------------------------------------------------------------------------------
$cat = new CatalogoMemoria();
foreach ([[101, 'CABLE'], [102, 'CABLE'], [103, 'CABLE'], [104, 'CABLE'], [105, 'CABLE'], [106, 'CABLE'], [201, 'POWER_SUPPLY'], [202, 'POWER_SUPPLY']] as [$id, $sub])
    $cat->p[$id] = ['id' => $id, 'nome' => "Produto $id (sintético)", 'categoria' => 'LED_PANEL', 'subcategoria' => $sub, 'ativo' => true, 'excluido' => false, 'sincronizado_em' => null];
$cat->p[199] = ['id' => 199, 'nome' => 'Inativo (sintético)', 'categoria' => 'LED_PANEL', 'subcategoria' => 'CABLE', 'ativo' => false, 'excluido' => false, 'sincronizado_em' => null];

$repo = new AtributosRepoPdo($pdo, '');
$adm = new AtributosService($repo, 80, 'admin@exemplo.invalid', $cat);
$kits = new KitsService($repo, 80, 'admin@exemplo.invalid', $cat);
$kit50 = new KitsService($repo, 50, 'equipe@exemplo.invalid', $cat);
$sug = new SugestoesService($repo, $adm, $kits, 80, 'admin@exemplo.invalid');
// risco 5: vínculo exige a versão dos vínculos do produto; massa exige a versão da prévia. Os casos antigos usam a versão vigente.
$verVinc = fn(int $pid): string => $repo->versoesVinculos([$pid])[$pid];
$aj = fn(array $b) => $kits->definirAjuste($b + ['versao_vinculos' => $verVinc((int) $b['product_id'])]);
$kp = fn(array $b) => $kits->definirKitDoProduto($b + ['versao_vinculos' => $verVinc((int) $b['product_id'])]);
$ms = fn(array $b) => $kits->aplicarMassa($b + ['versao_previa' => $kits->previaMassa($b)['versao_previa']]);

$u = fn(array $r) => (int) array_column($r['unidades'], 'id', 'simbolo')[array_key_last(array_column($r['unidades'], 'id', 'simbolo'))];
$adm->criarUnidade(['simbolo' => 'm', 'nome' => 'metro', 'grandeza' => 'comprimento', 'fator_base' => '1']);
$adm->criarUnidade(['simbolo' => 'cm', 'nome' => 'centímetro', 'grandeza' => 'comprimento', 'fator_base' => '0.01']);
$us = $adm->criarUnidade(['simbolo' => 'mm', 'nome' => 'milímetro', 'grandeza' => 'comprimento', 'fator_base' => '0.001']);
$uid = array_column($us['unidades'], 'id', 'simbolo'); [$uM, $uCm, $uMm] = [(int) $uid['m'], (int) $uid['cm'], (int) $uid['mm']];
$atr = [];
foreach ([['Comprimento', 'numero', $uCm], ['Profundidade', 'numero', $uMm], ['Cor', 'texto', null], ['Vias', 'inteiro', null], ['Conector', 'texto', null], ['Malha', 'texto', null], ['Potência', 'numero', null]] as [$r, $t, $un]) {
    $a = $adm->salvarAtributo(['rotulo' => $r, 'tipo' => $t, 'unidade_id' => $un, 'casas' => $t === 'numero' ? 2 : null])['atributo'];
    $atr[$r] = (int) $a['id'];
}
$ok('códigos gerados pelo sistema (slug + _n)', fn() => str_starts_with((string) $um('SELECT codigo FROM eq_atributo WHERE id = ?', [$atr['Comprimento']]), 'comprimento'));

// ---- kits ----------------------------------------------------------------------------------------------------------------------------
$k = $kits->salvarKit(['nome' => 'Cabos (teste)', 'descricao' => 'kit de cabos'])['kit']; $kid = (int) $k['id'];
$ok('criar kit', $kid > 0);
$ok('nome repetido → 422', fn() => $erro(fn() => $kits->salvarKit(['nome' => 'cabos (TESTE)']))?->http === 422);
$ok('nível 50 não cria kit → 403', fn() => $erro(fn() => $kit50->salvarKit(['nome' => 'X']))?->http === 403);
$itens = fn(array $ids, int $dest = 0) => array_map(fn($i, $aid) => ['atributo_id' => $aid, 'posicao' => $i + 1, 'obrigatorio' => $i === 0 ? 1 : 0, 'visivel' => 1, 'destaque' => $i < $dest ? 1 : 0, 'importancia' => null, 'unidade_id' => null], array_keys($ids), $ids);
$v = (int) $repo->grupo($kid)['versao'];
$k = $kits->definirItens(['id' => $kid, 'versao' => $v, 'itens' => $itens([$atr['Comprimento'], $atr['Cor'], $atr['Vias'], $atr['Malha'], $atr['Profundidade']], 4)])['kit'];
$ok('itens do kit gravados (5, 4 destaques)', count($k['atributos']) === 5);
$ok('5 destaques → 422 (A4)', fn() => $erro(fn() => $kits->definirItens(['id' => $kid, 'versao' => (int) $repo->grupo($kid)['versao'], 'itens' => $itens([$atr['Comprimento'], $atr['Cor'], $atr['Vias'], $atr['Malha'], $atr['Profundidade']], 5)]))?->http === 422);
$ok('versão velha → 409', fn() => $erro(fn() => $kits->definirItens(['id' => $kid, 'versao' => $v, 'itens' => $itens([$atr['Cor']])]))?->http === 409);
$pdo->prepare('UPDATE eq_grupo_atributo SET legado_id = 4242 WHERE grupo_id = ? AND atributo_id = ?')->execute([$kid, $atr['Comprimento']]);   // marca de origem (legado)
$kits->definirItens(['id' => $kid, 'versao' => (int) $repo->grupo($kid)['versao'], 'itens' => $itens([$atr['Comprimento'], $atr['Cor'], $atr['Vias'], $atr['Profundidade']])]);
$ok('ATR-M1: item mantido conserva legado_id (não houve DELETE + INSERT)', (int) $um('SELECT legado_id FROM eq_grupo_atributo WHERE grupo_id = ? AND atributo_id = ? AND excluido_em IS NULL', [$kid, $atr['Comprimento']]) === 4242);
$ok('ATR-M1: item removido = exclusão lógica (linha continua)', (int) $um("SELECT COUNT(*) FROM eq_grupo_atributo WHERE grupo_id = ? AND atributo_id = ? AND excluido_em IS NOT NULL", [$kid, $atr['Malha']]) === 1);
$kits->definirEscopos(['id' => $kid, 'versao' => (int) $repo->grupo($kid)['versao'], 'escopos' => [['categoria' => 'LED_PANEL', 'subcategoria' => 'CABLE']]]);

$kits->definirEscopos(['id' => $kid, 'versao' => (int) $repo->grupo($kid)['versao'], 'escopos' => [['categoria' => 'LED_PANEL', 'subcategoria' => 'CABLE'], ['categoria' => 'LED_PANEL', 'subcategoria' => 'POWER_SUPPLY']]]);
$ok('ATR-M1: escopo mantido não duplica a linha', (int) $um("SELECT COUNT(*) FROM eq_grupo_escopo WHERE grupo_id = ? AND subcategoria = 'CABLE'", [$kid]) === 1);
$kits->definirEscopos(['id' => $kid, 'versao' => (int) $repo->grupo($kid)['versao'], 'escopos' => [['categoria' => 'LED_PANEL', 'subcategoria' => 'CABLE']]]);
$ok('escopo removido = exclusão lógica', (int) $um("SELECT COUNT(*) FROM eq_grupo_escopo WHERE grupo_id = ? AND subcategoria = 'POWER_SUPPLY' AND excluido_em IS NOT NULL", [$kid]) === 1);
$ok('escopo inválido → 422', fn() => $erro(fn() => $kits->definirEscopos(['id' => $kid, 'versao' => (int) $repo->grupo($kid)['versao'], 'escopos' => [['categoria' => 'x; DROP', 'subcategoria' => '']]]))?->http === 422);

// ---- ficha §9 a partir do banco --------------------------------------------------------------------------------------------------------
$ficha = fn(int $pid) => Aplicabilidade::ficha($repo->retratoModelo(null), $cat->p[$pid]);
$ok('§9: cabo recebe os 4 atributos do kit pela subcategoria', count($ficha(101)) === 4);
$ok('§9: fonte não recebe o kit de cabos', count($ficha(201)) === 0);
$kp(['product_id' => 201, 'grupo_id' => $kid, 'ativo' => 1]);
$ok('kit direto: fonte 201 passa a ter os 4', count($ficha(201)) === 4);
$kp(['product_id' => 201, 'grupo_id' => $kid, 'ativo' => 0]);
$ok('remover kit direto: volta a 0', count($ficha(201)) === 0);
$ok('produto fora do catálogo → 404/422', fn() => in_array($erro(fn() => $kp(['product_id' => 999999, 'grupo_id' => $kid]))?->http, [404, 422], true));
$ok('excluir sem motivo → 422', fn() => $erro(fn() => $aj(['product_id' => 102, 'atributo_id' => $atr['Vias'], 'modo' => 'excluir']))?->http === 422);
$aj(['product_id' => 102, 'atributo_id' => $atr['Vias'], 'modo' => 'excluir', 'motivo' => 'cabo sem vias contáveis']);
$ok('exceção: 102 perde "Vias" só nele', !isset($ficha(102)[$atr['Vias']]) && isset($ficha(103)[$atr['Vias']]));
$aj(['product_id' => 102, 'atributo_id' => $atr['Vias'], 'modo' => null]);
$ok('desfazer exceção devolve "Vias"', isset($ficha(102)[$atr['Vias']]));
$aj(['product_id' => 103, 'atributo_id' => $atr['Potência'], 'modo' => 'incluir']);
$ok('avulso: 103 ganha "Potência"', isset($ficha(103)[$atr['Potência']]) && !isset($ficha(104)[$atr['Potência']]));

// ---- massa: prévia = aplicação; idempotente pela chave --------------------------------------------------------------------------------
$k2 = (int) $kits->salvarKit(['nome' => 'Conectores (teste)'])['kit']['id'];
$kits->definirItens(['id' => $k2, 'versao' => (int) $repo->grupo($k2)['versao'], 'itens' => $itens([$atr['Conector'], $atr['Cor'], $atr['Vias']])]);
$pedido = ['produtos' => [101, 102, 103, 104, 105], 'kits_aplicar' => [$k2]];
$pv = $kits->previaMassa($pedido)['resumo'];
$ok('prévia: 5 produtos, +1 atributo cada (Cor e Vias já vinham do kit)', $pv['produtos'] === 5 && $pv['atributos_acrescentados'] === 5 && $pv['atributos_removidos'] === 0, json_encode($pv));
$ok('prévia não grava nada', (int) $um('SELECT COUNT(*) FROM eq_grupo_produto WHERE grupo_id = ?', [$k2]) === 0);
$ok('massa sem chave → 422', fn() => $erro(fn() => $ms($pedido))?->http === 422);
$r1 = $ms($pedido + ['chave' => 'teste-massa-0001']);
$ok('aplicar: 5 kits aplicados', ($r1['gravado']['kits_aplicados'] ?? -1) === 5, json_encode($r1));
$r2 = $ms($pedido + ['chave' => 'teste-massa-0001']);
$ok('mesma chave: repetido, nada gravado de novo', !empty($r2['repetido']) && (int) $um('SELECT COUNT(*) FROM eq_grupo_produto WHERE grupo_id = ?', [$k2]) === 5);
$ok('ficha após massa = prévia (5 atributos no 101)', count($ficha(101)) === 5);
$ok('massa > 1000 produtos → 422', fn() => $erro(fn() => $kits->previaMassa(['produtos' => range(1, 1001), 'kits_aplicar' => [$k2]]))?->http === 422);

// ---- valores, unidade por valor (D3) e conversão exata -------------------------------------------------------------------------------
$g = $adm->gravarValor(['product_id' => 101, 'atributo_id' => $atr['Comprimento'], 'valor' => '1500', 'unidade_id' => $uMm]);
$ok('valor com unidade do valor (mm) num atributo em cm', (int) $um('SELECT unidade_id FROM eq_valor WHERE product_id = 101 AND atributo_id = ?', [$atr['Comprimento']]) === $uMm);
$ver = (int) $um('SELECT versao FROM eq_valor WHERE product_id = 101 AND atributo_id = ?', [$atr['Comprimento']]);
$adm->converterUnidade(['product_id' => 101, 'atributo_id' => $atr['Comprimento'], 'unidade_id' => $uCm, 'converter' => true, 'versao' => $ver]);
$ok('converter 1500 mm → 150 cm (exato)', (float) $um('SELECT valor_num FROM eq_valor WHERE product_id = 101 AND atributo_id = ?', [$atr['Comprimento']]) === 150.0
    && (int) $um('SELECT unidade_id FROM eq_valor WHERE product_id = 101 AND atributo_id = ?', [$atr['Comprimento']]) === $uCm);
$ok('unidade de outra grandeza → 422 (A8)', fn() => $erro(fn() => $adm->gravarValor(['product_id' => 102, 'atributo_id' => $atr['Comprimento'], 'valor' => '1', 'unidade_id' => 999999]))?->http === 422);

// ---- sugestões: aceitar, repetir, D10, lote --------------------------------------------------------------------------------------------
$insSug = function (string $chave, int $pid, int $aid, ?int $alt, string $val, ?int $un) use ($pdo): int {
    $pdo->prepare("INSERT INTO eq_sugestao (chave, product_id, atributo_id, atributo_alternativo_id, fonte, tipo, valor_proposto, unidade_id, evidencia) VALUES (?, ?, ?, ?, 'legado_2025', ?, ?, ?, 'teste')")
        ->execute([$chave, $pid, $aid, $alt, $alt ? 'conferencia' : 'valor', $val, $un]);
    return (int) $pdo->lastInsertId();
};
$s1 = $insSug('t|104|prof', 104, $atr['Profundidade'], $atr['Comprimento'], '800', $uMm);
$sug->decidir(['id' => $s1, 'versao' => 1, 'decisao' => 'aceitar', 'atributo_id' => $atr['Comprimento']]);
$ok('D5: aceitar no destino alternativo grava em Comprimento', (float) $um('SELECT valor_num FROM eq_valor WHERE product_id = 104 AND atributo_id = ? AND excluido_em IS NULL', [$atr['Comprimento']]) === 800.0);
$ok('sugestão aceita fica "aceita" com quem decidiu', $um('SELECT CONCAT(estado, "|", decidido_por) FROM eq_sugestao WHERE id = ?', [$s1]) === 'aceita|admin@exemplo.invalid');
$ok('decidir de novo: sem mudança', fn() => !empty($sug->decidir(['id' => $s1, 'versao' => 1, 'decisao' => 'aceitar'])['sem_mudanca']));
$ok('auditoria da aceitação na mesma transação', (int) $um("SELECT COUNT(*) FROM eq_auditoria WHERE acao = 'aceitar_sugestao'") === 1);
$s2 = $insSug('t|101|comp', 101, $atr['Comprimento'], null, '999', $uCm);
$e = $erro(fn() => $sug->decidir(['id' => $s2, 'versao' => 1, 'decisao' => 'aceitar']));
$ok('D10: sugestão sobre campo com valor → 409 VALUE_EXISTS', $e?->http === 409 && $e?->codigo === 'VALUE_EXISTS');
$ok('D10: o valor manual continua 150', (float) $um('SELECT valor_num FROM eq_valor WHERE product_id = 101 AND atributo_id = ?', [$atr['Comprimento']]) === 150.0);
$ok('D10: a sugestão continua pendente', $um('SELECT estado FROM eq_sugestao WHERE id = ?', [$s2]) === 'pendente');
$ok('versão da sugestão divergente → 409', fn() => $erro(fn() => $sug->decidir(['id' => $s2, 'versao' => 7, 'decisao' => 'recusar']))?->http === 409);
$sug->decidir(['id' => $s2, 'versao' => 1, 'decisao' => 'recusar', 'motivo' => 'valor manual é o certo']);
$ok('recusar grava estado e motivo', $um('SELECT CONCAT(estado, "|", motivo) FROM eq_sugestao WHERE id = ?', [$s2]) === 'recusada|valor manual é o certo');
$s3 = $insSug('t|105|cor', 105, $atr['Cor'], null, 'preto', null); $s4 = $insSug('t|106|cor', 106, $atr['Cor'], null, 'azul', null);
$ok('lote sem confirmar → 422', fn() => $erro(fn() => $sug->aceitarLote(['ids' => [$s3, $s4]]))?->http === 422);
$ok('lote > 200 → 422', fn() => $erro(fn() => $sug->aceitarLote(['ids' => range(1, 201), 'confirmar' => true]))?->http === 422);
$lt = $sug->aceitarLote(['ids' => [$s3, $s4, $s2], 'confirmar' => true]);
$ok('lote: aceita as 2 pendentes e ignora a já decidida', $lt['aceitas'] === 2 && $lt['falhas'] === [], json_encode($lt));
$ok('nível 50 não decide → 403', fn() => $erro(fn() => (new SugestoesService($repo, $adm, null, 50, 'x@exemplo.invalid'))->decidir(['id' => $s3, 'versao' => 1, 'decisao' => 'aceitar']))?->http === 403);

// ---- correções da revisão independente (18/11 ~06:10) ----------------------------------------------------------------------------------
// D10 em multiopção: sugestão de outra opção não acrescenta ao valor existente
$mo = $adm->salvarAtributo(['rotulo' => 'Conectores (multi)', 'tipo' => 'multiopcao'])['atributo']; $moId = (int) $mo['id'];
$adm->adicionarOpcao($moId, 'HDMI'); $adm->adicionarOpcao($moId, 'DP'); $opsMo = $adm->adicionarOpcao($moId, 'SDI')['opcoes'];
$aj(['product_id' => 105, 'atributo_id' => $moId, 'modo' => 'incluir']);
$adm->gravarValor(['product_id' => 105, 'atributo_id' => $moId, 'valor' => (int) $opsMo[0]['id']]);
$pdo->prepare("INSERT INTO eq_sugestao (chave, product_id, atributo_id, fonte, tipo, valor_proposto, opcao_id) VALUES ('t|105|mo', 105, ?, 'nome_produto', 'valor', 'SDI', ?)")->execute([$moId, (int) $opsMo[2]['id']]);
$sMo = (int) $pdo->lastInsertId();
$ok('D10 multiopção: sugestão de outra opção → 409 VALUE_EXISTS', fn() => $erro(fn() => $sug->decidir(['id' => $sMo, 'versao' => 1, 'decisao' => 'aceitar']))?->codigo === 'VALUE_EXISTS');
$ok('D10 multiopção: continua só HDMI', (int) $um('SELECT COUNT(*) FROM eq_valor WHERE product_id = 105 AND atributo_id = ? AND excluido_em IS NULL', [$moId]) === 1);
// limpar multiopção limpa todas as opções (antes: "sem mudança")
$adm->gravarValor(['product_id' => 105, 'atributo_id' => $moId, 'valor' => (int) $opsMo[1]['id']]);
$v0 = (int) $um('SELECT versao FROM eq_valor WHERE product_id = 105 AND atributo_id = ? AND excluido_em IS NULL ORDER BY opcao_chave LIMIT 1', [$moId]);
$ok('limpar com versão velha → 409', fn() => $erro(fn() => $adm->limparValor(['product_id' => 105, 'atributo_id' => $moId, 'versao' => $v0 + 9]))?->http === 409);
$ok('limpar multiopção remove as 2 opções', fn() => !empty($adm->limparValor(['product_id' => 105, 'atributo_id' => $moId, 'versao' => $v0])['limpo'])
    && (int) $um('SELECT COUNT(*) FROM eq_valor WHERE product_id = 105 AND atributo_id = ? AND excluido_em IS NULL', [$moId]) === 0);
$ok('limpar em produto inativo → 422', fn() => $erro(fn() => $adm->limparValor(['product_id' => 199, 'atributo_id' => $atr['Cor'], 'versao' => 1]))?->http === 422);
// desmarcar a 2ª opção com a versão do VALOR (a que a tela conhece)
$aj(['product_id' => 106, 'atributo_id' => $moId, 'modo' => 'incluir']);
$adm->gravarValor(['product_id' => 106, 'atributo_id' => $moId, 'valor' => (int) $opsMo[0]['id']]);
$adm->gravarValor(['product_id' => 106, 'atributo_id' => $moId, 'valor' => (int) $opsMo[1]['id']]);
$verVal = (int) $um('SELECT versao FROM eq_valor WHERE product_id = 106 AND atributo_id = ? AND excluido_em IS NULL ORDER BY opcao_chave LIMIT 1', [$moId]);
$ok('desmarcar a 2ª opção com a versão do valor funciona', fn() => $adm->removerOpcaoDoValor(['product_id' => 106, 'atributo_id' => $moId, 'opcao_id' => (int) $opsMo[1]['id'], 'versao' => $verVal])['ok'] === true);
// incluir em massa não apaga a unidade do produto (ajuste); chave amarrada ao conteúdo
$aj(['product_id' => 104, 'atributo_id' => $atr['Comprimento'], 'modo' => 'ajustar', 'unidade_id' => $uMm]);
$ms(['produtos' => [104], 'atributos_incluir' => [['atributo_id' => $atr['Comprimento']]], 'chave' => 'teste-massa-0002']);
$ok('massa incluir mantém a unidade do produto (mm)', (int) $um('SELECT unidade_id FROM eq_produto_atributo WHERE product_id = 104 AND atributo_id = ? AND excluido_em IS NULL', [$atr['Comprimento']]) === $uMm);
$ok('mesma chave com outro pedido → 409', fn() => $erro(fn() => $ms(['produtos' => [105], 'kits_aplicar' => [$k2], 'chave' => 'teste-massa-0002']))?->http === 409);
$ok('massa: unidade em atributo sem unidade de comprimento → 422', fn() => $erro(fn() => $kits->previaMassa(['produtos' => [101], 'atributos_incluir' => [['atributo_id' => $atr['Cor'], 'unidade_id' => $uMm]]]))?->http === 422);
$ok('massa: motivo > 255 → 422', fn() => $erro(fn() => $kits->previaMassa(['produtos' => [101], 'atributos_excluir' => [['atributo_id' => $atr['Cor'], 'motivo' => str_repeat('x', 300)]]]))?->http === 422);
$ok('ajuste: posição fora do limite → 422', fn() => $erro(fn() => $aj(['product_id' => 101, 'atributo_id' => $atr['Cor'], 'modo' => 'ajustar', 'posicao' => 70000]))?->http === 422);
$adm->criarUnidade(['simbolo' => 'kg', 'nome' => 'quilograma', 'grandeza' => 'massa', 'fator_base' => '1']);
$um2 = array_column($adm->criarUnidade(['simbolo' => 'g', 'nome' => 'grama', 'grandeza' => 'massa', 'fator_base' => '0.001'])['unidades'], 'id', 'simbolo');
[$uKg, $uG] = [(int) $um2['kg'], (int) $um2['g']];
$ok('ajuste: kg num atributo de comprimento → 422 (A8)', fn() => $erro(fn() => $aj(['product_id' => 101, 'atributo_id' => $atr['Comprimento'], 'modo' => 'ajustar', 'unidade_id' => $uKg]))?->http === 422);
$ok('atributo de texto com unidade → 422', fn() => $erro(fn() => $adm->salvarAtributo(['rotulo' => 'Texto com unidade', 'tipo' => 'texto', 'unidade_id' => $uCm]))?->http === 422);
// limites na unidade padrão: máximo 500 kg; 2000 g (= 2 kg) passa; 600 kg não
$peso = (int) $adm->salvarAtributo(['rotulo' => 'Peso (teste)', 'tipo' => 'numero', 'unidade_id' => $uKg, 'maximo' => '500'])['atributo']['id'];
$aj(['product_id' => 102, 'atributo_id' => $peso, 'modo' => 'incluir']); $aj(['product_id' => 103, 'atributo_id' => $peso, 'modo' => 'incluir']);
$ok('limite: 2000 g (= 2 kg) com máximo 500 kg passa', fn() => (bool) $adm->gravarValor(['product_id' => 102, 'atributo_id' => $peso, 'valor' => '2000', 'unidade_id' => $uG]));
$ok('limite: 600 kg passa do máximo → 422', fn() => $erro(fn() => $adm->gravarValor(['product_id' => 103, 'atributo_id' => $peso, 'valor' => '600', 'unidade_id' => $uKg]))?->http === 422);
// duplicar atômico: origem com 5 destaques (dado do legado) não deixa "cópia" vazia
$k3 = (int) $kits->salvarKit(['nome' => 'Legado 5 destaques'])['kit']['id'];
$kits->definirItens(['id' => $k3, 'versao' => (int) $repo->grupo($k3)['versao'], 'itens' => $itens([$atr['Cor'], $atr['Vias'], $atr['Conector'], $atr['Malha'], $atr['Potência']], 4)]);
$pdo->prepare('UPDATE eq_grupo_atributo SET destaque = 1 WHERE grupo_id = ?')->execute([$k3]);
$ok('duplicar com erro nos itens → 422', fn() => $erro(fn() => $kits->duplicarKit(['id' => $k3, 'nome' => 'Cópia que falha']))?->http === 422);
$ok('duplicar atômico: não sobrou kit "Cópia que falha"', (int) $um("SELECT COUNT(*) FROM eq_grupo WHERE nome = 'Cópia que falha'") === 0);

// ---- risco residual 5: versão OBRIGATÓRIA nos ajustes e vínculos (conferida sob trava) ------------------------------------------------
$ok('ajuste sem versao_vinculos → 422', fn() => $erro(fn() => $kits->definirAjuste(['product_id' => 104, 'atributo_id' => $atr['Malha'], 'modo' => 'incluir']))?->http === 422);
$ok('kit direto sem versao_vinculos → 422', fn() => $erro(fn() => $kits->definirKitDoProduto(['product_id' => 202, 'grupo_id' => $k2, 'ativo' => 1]))?->http === 422);
$v0 = $verVinc(104);
$rA = $kits->definirAjuste(['product_id' => 104, 'atributo_id' => $atr['Malha'], 'modo' => 'incluir', 'versao_vinculos' => $v0]);
$ok('ajuste com a versão certa grava e devolve a versão nova', $rA['mudou'] === true && $rA['versao_vinculos'] === $verVinc(104) && $rA['versao_vinculos'] !== $v0);
$ok('ajuste com versão velha (outra pessoa mudou) → 409, nada gravado', fn() => $erro(fn() => $kits->definirAjuste(['product_id' => 104, 'atributo_id' => $atr['Malha'], 'modo' => 'ajustar', 'posicao' => 3, 'versao_vinculos' => $v0]))?->http === 409
    && $um('SELECT posicao FROM eq_produto_atributo WHERE product_id = 104 AND atributo_id = ?', [$atr['Malha']]) === null);
$ok('duas pessoas criando o mesmo vínculo: a segunda (versão de antes) → 409', function () use ($kits, $verVinc, $erro, $atr) {
    $v = $verVinc(202);
    $kits->definirAjuste(['product_id' => 202, 'atributo_id' => $atr['Cor'], 'modo' => 'incluir', 'versao_vinculos' => $v]);
    return $erro(fn() => $kits->definirAjuste(['product_id' => 202, 'atributo_id' => $atr['Cor'], 'modo' => 'excluir', 'motivo' => 'outra pessoa', 'versao_vinculos' => $v]))?->http === 409;
});
$v1 = $verVinc(202);
$kits->definirKitDoProduto(['product_id' => 202, 'grupo_id' => $k2, 'ativo' => 1, 'versao_vinculos' => $v1]);
$ok('kit direto com versão velha → 409 (o kit continua aplicado)', fn() => $erro(fn() => $kits->definirKitDoProduto(['product_id' => 202, 'grupo_id' => $k2, 'ativo' => 0, 'versao_vinculos' => $v1]))?->http === 409
    && (int) $um('SELECT COUNT(*) FROM eq_grupo_produto WHERE product_id = 202 AND grupo_id = ? AND excluido_em IS NULL', [$k2]) === 1);
$ok('versão por produto: mudar o 202 não muda a versão do 201', (function () use ($verVinc, $kp, $k2) { $a = $verVinc(201); $kp(['product_id' => 202, 'grupo_id' => $k2, 'ativo' => 0]); return $verVinc(201) === $a; })());
$ok('kit_produtos sem versão do kit → 422', fn() => $erro(fn() => $kits->definirProdutosDoKit(['id' => $k2, 'adicionar' => [106]]))?->http === 422);
$vk = (int) $repo->grupo($k2)['versao'];
$rk = $kits->definirProdutosDoKit(['id' => $k2, 'versao' => $vk, 'adicionar' => [201]]);
$ok('kit_produtos com a versão certa grava e sobe a versão do kit', $rk['adicionados'] === 1 && $rk['versao'] === $vk + 1);
$ok('kit_produtos com versão velha → 409', fn() => $erro(fn() => $kits->definirProdutosDoKit(['id' => $k2, 'versao' => $vk, 'remover' => [201]]))?->http === 409
    && (int) $um('SELECT COUNT(*) FROM eq_grupo_produto WHERE product_id = 201 AND grupo_id = ? AND excluido_em IS NULL', [$k2]) === 1);
$sv = $insSug('t|202|comp', 202, $atr['Comprimento'], null, '100', $uCm);
$sug->decidir(['id' => $sv, 'versao' => 1, 'decisao' => 'aceitar', 'vincular' => 1]);
$ok('aceitar sugestão + vincular continua vinculando (versão lida na mesma transação)', $um("SELECT modo FROM eq_produto_atributo WHERE product_id = 202 AND atributo_id = ? AND excluido_em IS NULL", [$atr['Comprimento']]) === 'incluir');

// ---- risco residual 1 + 5 na massa: tabela de pedidos com chave ÚNICA e versão da prévia ----------------------------------------------
$pM = ['produtos' => [105], 'atributos_incluir' => [$atr['Malha']]];
$ok('massa sem versao_previa → 422', fn() => $erro(fn() => $kits->aplicarMassa($pM + ['chave' => 'sem-versao-01']))?->http === 422);
$vp = $kits->previaMassa($pM)['versao_previa'];
$aj(['product_id' => 105, 'atributo_id' => $atr['Potência'], 'modo' => 'incluir']);   // outra pessoa mexe no 105 depois da prévia
$ok('massa com prévia velha → 409', fn() => $erro(fn() => $kits->aplicarMassa($pM + ['chave' => 'previa-velha-01', 'versao_previa' => $vp]))?->http === 409);
$ok('409 desfaz o pedido: a chave não fica registrada', (int) $um("SELECT COUNT(*) FROM eq_pedido_massa WHERE chave = 'previa-velha-01'") === 0
    && $um('SELECT COUNT(*) FROM eq_produto_atributo WHERE product_id = 105 AND atributo_id = ?', [$atr['Malha']]) === 0);
$rM = $kits->aplicarMassa($pM + ['chave' => 'previa-velha-01', 'versao_previa' => $kits->previaMassa($pM)['versao_previa']]);
$ok('com a prévia nova, a mesma chave aplica', ($rM['gravado']['inclusoes'] ?? -1) === 1 && empty($rM['repetido']));
$ok('pedido registrado com assinatura e resultado', $um("SELECT CONCAT(LENGTH(assinatura), '|', produtos, '|', JSON_EXTRACT(resultado, '$.gravado.inclusoes'), '|', concluido_em IS NOT NULL) FROM eq_pedido_massa WHERE chave = 'previa-velha-01'") === '64|1|1|1');
$vpk = $kits->previaMassa(['produtos' => [106], 'kits_aplicar' => [$k2]])['versao_previa'];
$kits->definirItens(['id' => $k2, 'versao' => (int) $repo->grupo($k2)['versao'], 'itens' => $itens([$atr['Conector'], $atr['Cor']])]);
$ok('kit mudou depois da prévia → 409', fn() => $erro(fn() => $kits->aplicarMassa(['produtos' => [106], 'kits_aplicar' => [$k2], 'chave' => 'kit-mudou-01', 'versao_previa' => $vpk]))?->http === 409);
$ok('índice único na chave (010)', (int) $um("SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'eq_pedido_massa' AND INDEX_NAME = 'uq_eq_pedido_massa_chave' AND NON_UNIQUE = 0") === 1);

// corrida real com DUAS conexões: outra sessão segura a mesma chave numa transação aberta; esta espera no índice único
$pC = ['produtos' => [106], 'kits_aplicar' => [$k2]];
$assin = hash('sha256', json_encode([[106], [$k2], [], [], []]));
$outra = function (string $chave, string $fim) use ($cnf, $db, $assin) {
    $sql = "START TRANSACTION; INSERT INTO eq_pedido_massa (chave, assinatura, usuario, produtos, resultado, concluido_em) VALUES ('$chave', '$assin', 'outra-sessao', 1, '{\"gravado\": {\"kits_aplicados\": 1}, \"marca\": \"outra\"}', NOW(3)); DO SLEEP(2); $fim;";
    $p = proc_open(['mysql', "--defaults-extra-file=$cnf", $db, '-e', $sql], [1 => ['pipe', 'w'], 2 => ['pipe', 'w']], $pipes);
    usleep(800000);   // a outra sessão já inseriu (sem COMMIT) quando esta começa
    return [$p, $pipes];
};
[$p1, $pp1] = $outra('corrida-0001', 'COMMIT');
$t0 = microtime(true); $rC = $ms($pC + ['chave' => 'corrida-0001']); $dt = microtime(true) - $t0;
stream_get_contents($pp1[1]); stream_get_contents($pp1[2]); $st1 = proc_close($p1);
$ok('corrida (a outra confirma): esta esperou no índice e devolveu o resultado da outra, sem aplicar', $st1 === 0 && $dt > 0.8 && !empty($rC['repetido']) && ($rC['marca'] ?? '') === 'outra'
    && (int) $um('SELECT COUNT(*) FROM eq_grupo_produto WHERE product_id = 106 AND grupo_id = ? AND excluido_em IS NULL', [$k2]) === 0, json_encode($rC) . " dt=$dt st=$st1");
[$p2, $pp2] = $outra('corrida-0002', 'ROLLBACK');
$t0 = microtime(true); $rD = $ms($pC + ['chave' => 'corrida-0002']); $dt = microtime(true) - $t0;
stream_get_contents($pp2[1]); stream_get_contents($pp2[2]); $st2 = proc_close($p2);
$ok('corrida (a outra desiste): esta espera e aplica uma vez só', $st2 === 0 && $dt > 0.8 && empty($rD['repetido']) && ($rD['gravado']['kits_aplicados'] ?? -1) === 1
    && $um("SELECT usuario FROM eq_pedido_massa WHERE chave = 'corrida-0002'") === 'admin@exemplo.invalid', json_encode($rD) . " dt=$dt st=$st2");
$ok('auditoria "massa" uma por chave aplicada', (int) $um("SELECT COUNT(*) FROM eq_auditoria WHERE entidade = 'massa' AND entidade_id IN ('corrida-0001', 'corrida-0002')") === 1);

// ---- DSHOW-033: limites com unidade HERDADA (produto, kit, padrão) e explícita; sem mutação na recusa ------------------------------
$alt = (int) $adm->salvarAtributo(['rotulo' => 'Altura com limite (teste 033)', 'tipo' => 'numero', 'unidade_id' => $uCm, 'maximo' => '100'])['atributo']['id'];
$linhas = function (string $sql, array $p) use ($pdo) { $st = $pdo->prepare($sql); $st->execute($p); return $st->fetchAll(PDO::FETCH_ASSOC); };
$foto = fn(int $pid) => json_encode([$linhas('SELECT valor_num, unidade_id, versao FROM eq_valor WHERE product_id = ? AND atributo_id = ? AND excluido_em IS NULL', [$pid, $alt]),
    (int) $um('SELECT COUNT(*) FROM eq_auditoria')]);
$semMutacao = function (string $nome, int $pid, array $b) use ($adm, $erro, $foto, $ok, $alt) {
    $antes = $foto($pid);
    $e = $erro(fn() => $adm->gravarValor(['product_id' => $pid, 'atributo_id' => $alt] + $b));
    $ok("$nome → 422 e nada muda (valor, versão, auditoria)", $e?->http === 422 && $foto($pid) === $antes, ($e ? $e->getMessage() : 'sem erro') . " | $antes → " . $foto($pid));
};
$verAlt = fn(int $pid) => ($r = $um('SELECT versao FROM eq_valor WHERE product_id = ? AND atributo_id = ? AND excluido_em IS NULL LIMIT 1', [$pid, $alt])) === false ? null : (int) $r;
$grava = fn(int $pid, string $v, ?int $u = null) => $adm->gravarValor(['product_id' => $pid, 'atributo_id' => $alt, 'valor' => $v] + ($u ? ['unidade_id' => $u] : []) + (($x = $verAlt($pid)) !== null ? ['versao' => $x] : []));
// explícita: 201 (avulso, sem unidade de produto) com unidade m no pedido
$aj(['product_id' => 201, 'atributo_id' => $alt, 'modo' => 'incluir']);
$ok('033 explícita: 1 m (= 100 cm) aceito', fn() => (bool) $grava(201, '1', $uM));
$semMutacao('033 explícita: 2 m (= 200 cm)', 201, ['valor' => '2', 'unidade_id' => $uM, 'versao' => $verAlt(201)]);
// produto: 202 com ajuste de unidade m; o pedido não manda unidade (herda m)
$aj(['product_id' => 202, 'atributo_id' => $alt, 'modo' => 'incluir', 'unidade_id' => $uM]);
$ok('033 produto: 1 (herda m) aceito', fn() => (bool) $grava(202, '1'));
$semMutacao('033 produto: 2 (herda m = 200 cm)', 202, ['valor' => '2', 'versao' => $verAlt(202)]);
// kit: kit com o item em m, aplicado direto ao 105; o pedido não manda unidade (herda m do kit)
$kU = (int) $kits->salvarKit(['nome' => 'Kit unidade m (teste 033)'])['kit']['id'];
$kits->definirItens(['id' => $kU, 'versao' => (int) $repo->grupo($kU)['versao'], 'itens' => [['atributo_id' => $alt, 'posicao' => 1, 'obrigatorio' => 0, 'visivel' => 1, 'destaque' => 0, 'importancia' => null, 'unidade_id' => $uM]]]);
$kp(['product_id' => 105, 'grupo_id' => $kU, 'ativo' => 1]);
$ok('033 kit: 1 (herda m do kit) aceito', fn() => (bool) $grava(105, '1'));
$semMutacao('033 kit: 2 (herda m do kit = 200 cm)', 105, ['valor' => '2', 'versao' => $verAlt(105)]);
// padrão: 104 avulso sem unidade nenhuma → cm (padrão do atributo): 100 aceito, 101 recusado
$aj(['product_id' => 104, 'atributo_id' => $alt, 'modo' => 'incluir']);
$ok('033 padrão: 100 (cm) aceito', fn() => (bool) $grava(104, '100'));
$semMutacao('033 padrão: 101 cm', 104, ['valor' => '101', 'versao' => $verAlt(104)]);
// conversão exata: 0.5 m = 50 cm aceito; 1.000001 m recusado
$ok('033 exato: 0,5 m aceito', fn() => (bool) $grava(201, '0.5', $uM));
$semMutacao('033 exato: 1,000001 m', 201, ['valor' => '1.000001', 'unidade_id' => $uM, 'versao' => $verAlt(201)]);
// unidade extra SEM fator → 422 claro (antes: os limites eram ignorados)
$uPe = (int) $adm->criarUnidade(['simbolo' => 'pe033', 'nome' => 'pé sem fator (teste)', 'grandeza' => 'comprimento'])['id'];
$adm->definirUnidadesPermitidas(['atributo_id' => $alt, 'unidades' => [$uPe]]);
$e033 = $erro(fn() => $adm->gravarValor(['product_id' => 201, 'atributo_id' => $alt, 'valor' => '1', 'unidade_id' => $uPe, 'versao' => $verAlt(201)]));
$ok('033 unidade sem fator → 422 UNIT_WITHOUT_FACTOR com mensagem clara', $e033?->http === 422 && str_contains($e033->getMessage(), 'fator de conversão'), $e033 ? $e033->getMessage() : 'sem erro');

echo ($falhas === 0 ? '[OK]  ' : '[FALHA]') . " modulo-mysql (kits, vínculos, massa, sugestões, unidade): $n casos, $falhas falha(s)\n";
exit($falhas === 0 ? 0 : 1);
