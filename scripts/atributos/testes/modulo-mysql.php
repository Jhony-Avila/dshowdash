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
require_once __DIR__ . '/../../../api/atributos/Permissoes.php';
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
$vc105 = AtributosService::versaoConjunto($pdo->query("SELECT opcao_chave, versao, excluido_em FROM eq_valor WHERE product_id = 105 AND atributo_id = $moId")->fetchAll(PDO::FETCH_ASSOC));
$ok('limpar com versão do conjunto velha → 409', fn() => $erro(fn() => $adm->limparValor(['product_id' => 105, 'atributo_id' => $moId, 'versao_conjunto' => (string) ((int) $vc105 - 1)]))?->http === 409);
$ok('limpar multiopção remove as 2 opções', fn() => !empty($adm->limparValor(['product_id' => 105, 'atributo_id' => $moId, 'versao_conjunto' => $vc105])['limpo'])
    && (int) $um('SELECT COUNT(*) FROM eq_valor WHERE product_id = 105 AND atributo_id = ? AND excluido_em IS NULL', [$moId]) === 0);
$ok('limpar em produto inativo → 422', fn() => $erro(fn() => $adm->limparValor(['product_id' => 199, 'atributo_id' => $atr['Cor'], 'versao' => 1]))?->http === 422);
// desmarcar a 2ª opção com a versão do VALOR (a que a tela conhece)
$aj(['product_id' => 106, 'atributo_id' => $moId, 'modo' => 'incluir']);
$adm->gravarValor(['product_id' => 106, 'atributo_id' => $moId, 'valor' => (int) $opsMo[0]['id']]);
$adm->gravarValor(['product_id' => 106, 'atributo_id' => $moId, 'valor' => (int) $opsMo[1]['id']]);
$verVal = (int) $um('SELECT versao FROM eq_valor WHERE product_id = 106 AND atributo_id = ? AND excluido_em IS NULL ORDER BY opcao_chave LIMIT 1', [$moId]);
$ok('desmarcar a 2ª opção com a versão do valor funciona', fn() => $adm->removerOpcaoDoValor(['product_id' => 106, 'atributo_id' => $moId, 'opcao_id' => (int) $opsMo[1]['id'], 'versao' => $verVal, 'versao_conjunto' => AtributosService::versaoConjunto($pdo->query("SELECT versao FROM eq_valor WHERE product_id = 106 AND atributo_id = $moId")->fetchAll(PDO::FETCH_ASSOC))])['ok'] === true);
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

// ---- DSHOW-056: a versão da prévia identifica a INTENÇÃO completa (canônica); prévia de X não confirma Y ----------------------------------
$L56 = fn(string $sql) => $pdo->query($sql)->fetchAll(PDO::FETCH_ASSOC);
$foto56 = fn() => json_encode([$L56('SELECT grupo_id, product_id, excluido_em FROM eq_grupo_produto WHERE product_id IN (201, 202) ORDER BY grupo_id, product_id'),
    $L56('SELECT product_id, atributo_id, modo, unidade_id, motivo, excluido_em FROM eq_produto_atributo WHERE product_id IN (201, 202) ORDER BY product_id, atributo_id'),
    (int) $um('SELECT COUNT(*) FROM eq_auditoria'), (int) $um('SELECT COUNT(*) FROM eq_pedido_massa')]);
$X = ['produtos' => [201], 'kits_aplicar' => [$k2]];
$vX = $kits->previaMassa($X)['versao_previa']; $f0 = $foto56();
$trocas = [
    'kit aplicar → kit remover' => ['produtos' => [201], 'kits_remover' => [$k2]],
    'troca de kit' => ['produtos' => [201], 'kits_aplicar' => [$k3]],
    'troca de produtos' => ['produtos' => [201, 202], 'kits_aplicar' => [$k2]],
    'acrescenta atributo' => ['produtos' => [201], 'kits_aplicar' => [$k2], 'atributos_incluir' => [$atr['Vias']]],
];
foreach ($trocas as $nome => $Y) {
    $e = $erro(fn() => $kits->aplicarMassa($Y + ['chave' => 'p056-' . substr(md5($nome), 0, 10), 'versao_previa' => $vX]));
    $ok("056: prévia de X, confirmação direta com Y ($nome) → 409, zero alterações e zero auditoria", $e?->http === 409 && $foto56() === $f0, $e ? $e->getMessage() : 'aceito (defeito)');
}
$Xi = ['produtos' => [202], 'atributos_incluir' => [$atr['Vias']]];
$vXi = $kits->previaMassa($Xi)['versao_previa'];
$e = $erro(fn() => $kits->aplicarMassa(['produtos' => [202], 'atributos_excluir' => [['atributo_id' => $atr['Vias'], 'motivo' => 'virou exclusão no teste 056']], 'chave' => 'p056-incl-excl', 'versao_previa' => $vXi]));
$ok('056: INCLUSÃO de atributo transformada em EXCLUSÃO depois da prévia → 409, nada muda', $e?->http === 409 && $foto56() === $f0);
$Xm = ['produtos' => [202], 'atributos_excluir' => [['atributo_id' => $atr['Cor'], 'motivo' => 'motivo A do teste 056']]];
$vXm = $kits->previaMassa($Xm)['versao_previa'];
$e = $erro(fn() => $kits->aplicarMassa(['produtos' => [202], 'atributos_excluir' => [['atributo_id' => $atr['Cor'], 'motivo' => 'motivo B do teste 056']], 'chave' => 'p056-motivo-01', 'versao_previa' => $vXm]));
$ok('056: troca de MOTIVO depois da prévia → 409, nada muda', $e?->http === 409 && $foto56() === $f0);
$Xu = ['produtos' => [202], 'atributos_incluir' => [['atributo_id' => $atr['Comprimento'], 'unidade_id' => $uCm]]];
$vXu = $kits->previaMassa($Xu)['versao_previa'];
$e = $erro(fn() => $kits->aplicarMassa(['produtos' => [202], 'atributos_incluir' => [['atributo_id' => $atr['Comprimento'], 'unidade_id' => $uMm]], 'chave' => 'p056-unid-01', 'versao_previa' => $vXu]));
$ok('056: troca de UNIDADE do atributo incluído depois da prévia → 409, nada muda', $e?->http === 409 && $foto56() === $f0);
// mesma intenção em outra ordem = aceita (e a chave repetida devolve o recibo, sem duplicar)
$Xo = ['produtos' => [202, 201], 'atributos_incluir' => [$atr['Conector'], $atr['Vias']]];
$vXo = $kits->previaMassa($Xo)['versao_previa'];
$r1 = $kits->aplicarMassa(['produtos' => [201, 202], 'atributos_incluir' => [$atr['Vias'], $atr['Conector']], 'chave' => 'p056-ordem-01', 'versao_previa' => $vXo]);
$ok('056: mesma intenção com os IDs em OUTRA ordem → aceita', empty($r1['repetido']) && ($r1['gravado']['inclusoes'] ?? 0) >= 1, json_encode($r1['gravado'] ?? null));
$fDepois = $foto56();
$r2 = $kits->aplicarMassa(['produtos' => [201, 202], 'atributos_incluir' => [$atr['Vias'], $atr['Conector']], 'chave' => 'p056-ordem-01', 'versao_previa' => $vXo]);
$ok('056: resposta perdida depois do commit → reenvio com a MESMA chave devolve o recibo, sem duplicar (prévia agora velha, não importa)', !empty($r2['repetido']) && $r2['gravado'] == $r1['gravado'] && $foto56() === $fDepois, json_encode([$r2['repetido'] ?? null, $r1['gravado'], $r2['gravado'] ?? null, $foto56() === $fDepois]));
$r3 = $kits->aplicarMassa(['produtos' => [202, 201], 'atributos_incluir' => [$atr['Conector'], $atr['Vias']], 'chave' => 'p056-ordem-01', 'versao_previa' => $vXo]);
$ok('056: mesma chave, mesma intenção em outra ordem → recibo, sem duplicar', !empty($r3['repetido']) && $foto56() === $fDepois);
$e = $erro(fn() => $kits->aplicarMassa(['produtos' => [201], 'atributos_incluir' => [$atr['Malha']], 'chave' => 'p056-ordem-01', 'versao_previa' => $vXo]));
$ok('056: mesma chave com OUTRA intenção → 409, nada muda', $e?->http === 409 && $foto56() === $fDepois);
// recibo gravado ANTES desta versão (assinatura antiga, dependente da ordem) continua válido
$leg = hash('sha256', json_encode([[201], [$k3], [], [], []]));
$repo->transacao(function () use ($repo, $leg) { $repo->registrarPedidoMassa('p056-legado-01', $leg, 'admin@exemplo.invalid', 1); $repo->concluirPedidoMassa('p056-legado-01', ['gravado' => ['kits_aplicados' => 1, 'kits_removidos' => 0, 'inclusoes' => 0, 'exclusoes' => 0]]); });
$fLeg = $foto56();
$r4 = $kits->aplicarMassa(['produtos' => [201], 'kits_aplicar' => [$k3], 'chave' => 'p056-legado-01', 'versao_previa' => str_repeat('a', 64)]);
$ok('056: recibo idempotente gravado com a assinatura ANTIGA continua válido (reenvio → recibo, nada aplicado)', !empty($r4['repetido']) && ($r4['gravado']['kits_aplicados'] ?? -1) === 1 && $foto56() === $fLeg);

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
$adm->definirUnidadesPermitidas(['atributo_id' => $alt, 'unidades' => [$uPe], 'unidades_antes' => []]);
$e033 = $erro(fn() => $adm->gravarValor(['product_id' => 201, 'atributo_id' => $alt, 'valor' => '1', 'unidade_id' => $uPe, 'versao' => $verAlt(201)]));
$ok('033 unidade sem fator → 422 UNIT_WITHOUT_FACTOR com mensagem clara', $e033?->http === 422 && str_contains($e033->getMessage(), 'fator de conversão'), $e033 ? $e033->getMessage() : 'sem erro');

// ---- DSHOW-048: valor numérico gravado sem unidade guarda a unidade EFETIVA (produto/kit/padrão), nunca nulo
$uDe = fn(int $pid) => $um('SELECT unidade_id FROM eq_valor WHERE product_id = ? AND atributo_id = ? AND excluido_em IS NULL', [$pid, $alt]);
$ok('048: herdada do produto (m) fica gravada no valor', (int) $uDe(202) === $uM);
$ok('048: herdada do kit (m) fica gravada no valor', (int) $uDe(105) === $uM);
$ok('048: padrão do atributo (cm) fica gravada no valor', (int) $uDe(104) === $uCm);
$ok('048: unidade explícita continua a explícita (m)', (int) $uDe(201) === $uM);
// DSHOW-049 (4): atributo que LEGITIMAMENTE não tem unidade (sem padrão, sem kit, sem ajuste) continua sem unidade na gravação
$semU = (int) $adm->salvarAtributo(['rotulo' => 'Quantidade de portas (sem unidade)', 'tipo' => 'inteiro'])['atributo']['id'];
$aj(['product_id' => 201, 'atributo_id' => $semU, 'modo' => 'incluir']);
$adm->gravarValor(['product_id' => 201, 'atributo_id' => $semU, 'valor' => 4]);
$ok('049: atributo sem unidade nenhuma → valor gravado SEM unidade (regra não muda)', $um('SELECT unidade_id FROM eq_valor WHERE product_id = 201 AND atributo_id = ? AND excluido_em IS NULL', [$semU]) === null
    && (int) $um('SELECT COUNT(*) FROM eq_valor WHERE product_id = 201 AND atributo_id = ? AND excluido_em IS NULL', [$semU]) === 1);

// ---- DSHOW-034: multiopção — limpar / mudar estado exigem a versão do CONJUNTO, conferida sob trava -------------------------------
$aj(['product_id' => 104, 'atributo_id' => $moId, 'modo' => 'incluir']);
$vc = fn(int $pid) => AtributosService::versaoConjunto($linhas('SELECT opcao_chave, versao, excluido_em FROM eq_valor WHERE product_id = ? AND atributo_id = ?', [$pid, $moId]));   // DSHOW-049: trilha inteira
$conj = fn(int $pid) => json_encode([$linhas('SELECT opcao_chave, estado, versao FROM eq_valor WHERE product_id = ? AND atributo_id = ? AND excluido_em IS NULL ORDER BY opcao_chave', [$pid, $moId]), (int) $um('SELECT COUNT(*) FROM eq_auditoria')]);
$adm->gravarValor(['product_id' => 104, 'atributo_id' => $moId, 'valor' => (int) $opsMo[0]['id']]);
$vA = $vc(104);                                                  // aba A lê o conjunto
$adm->gravarValor(['product_id' => 104, 'atributo_id' => $moId, 'valor' => (int) $opsMo[1]['id']]);   // aba B acrescenta outra opção (por opção)
$ok('034: aba B acrescentou a 2ª opção (por opção, sem versão do conjunto)', (int) $um('SELECT COUNT(*) FROM eq_valor WHERE product_id = 104 AND atributo_id = ? AND excluido_em IS NULL', [$moId]) === 2);
$antes = $conj(104);
$v1a = (int) $um('SELECT versao FROM eq_valor WHERE product_id = 104 AND atributo_id = ? AND excluido_em IS NULL ORDER BY opcao_chave LIMIT 1', [$moId]);   // versão da 1ª linha: NÃO mudou com a opção de B (o defeito)
$e1 = $erro(fn() => $adm->limparValor(['product_id' => 104, 'atributo_id' => $moId, 'versao' => $v1a, 'versao_conjunto' => $vA]));
$ok('034: aba A limpa com a versão anterior → 409; a opção de B continua; auditoria sem registro', $e1?->http === 409 && $conj(104) === $antes, ($e1 ? $e1->getMessage() : 'sem erro'));
$e2 = $erro(fn() => $adm->gravarValor(['product_id' => 104, 'atributo_id' => $moId, 'estado' => 'nao_se_aplica', 'versao_conjunto' => $vA]));
$ok('034: aba A muda o estado com a versão anterior → 409; nada muda', $e2?->http === 409 && $conj(104) === $antes, ($e2 ? $e2->getMessage() : 'sem erro'));
$ok('034: limpar a multiopção sem versão do conjunto → 422', fn() => $erro(fn() => $adm->limparValor(['product_id' => 104, 'atributo_id' => $moId, 'versao' => 1]))?->http === 422 && $conj(104) === $antes);
$adm->gravarValor(['product_id' => 104, 'atributo_id' => $moId, 'estado' => 'nao_se_aplica', 'versao_conjunto' => $vc(104)]);
$ok('034: com a versão atual, mudar o estado funciona (as 2 opções saem, fica "não se aplica")', $linhas('SELECT opcao_chave, estado FROM eq_valor WHERE product_id = 104 AND atributo_id = ? AND excluido_em IS NULL', [$moId]) === [['opcao_chave' => 0, 'estado' => 'nao_se_aplica']]);
$ok('034: trocar o estado por uma opção com versão velha → 409', fn() => $erro(fn() => $adm->gravarValor(['product_id' => 104, 'atributo_id' => $moId, 'valor' => (int) $opsMo[0]['id'], 'versao_conjunto' => $vA]))?->http === 409);
$adm->gravarValor(['product_id' => 104, 'atributo_id' => $moId, 'valor' => (int) $opsMo[0]['id'], 'versao_conjunto' => $vc(104)]);
$r034 = $adm->limparValor(['product_id' => 104, 'atributo_id' => $moId, 'versao_conjunto' => $vc(104)]);
$ok('034: com a versão atual, limpar funciona', !empty($r034['limpo']) && (int) $um('SELECT COUNT(*) FROM eq_valor WHERE product_id = 104 AND atributo_id = ? AND excluido_em IS NULL', [$moId]) === 0);

// ---- Decisão do Jhony (18/11): outros nível 80 só PREENCHEM; administrar = 75 ou permissão explícita (UARPS 'allow') --------------
$P = 'AtributosPermissoes';
$ok('perm: 75 nível 80 administra', $P::administra(75, 80, null, [75]));
$ok('perm: 75 nível 50 não administra', !$P::administra(75, 50, null, [75]));
$ok('perm: outro nível 80 sem UARPS não administra', !$P::administra(12, 80, null, [75]));
$ok('perm: UARPS state allow → administra', $P::administra(12, 80, fn($u, $t) => ['allowed' => true, 'state' => 'allow'], [75]));
$ok('perm: UARPS inherit (allowed=true!) → NÃO administra (precisa de permissão explícita)', !$P::administra(12, 80, fn($u, $t) => ['allowed' => true, 'state' => 'inherit'], [75]));
$ok('perm: UARPS deny → não', !$P::administra(12, 80, fn($u, $t) => ['allowed' => false, 'state' => 'deny'], [75]));
$ok('perm: UARPS com erro/fallback → não (fail-closed)', !$P::administra(12, 80, fn($u, $t) => ['allowed' => true, 'state' => 'error', 'source' => 'fallback'], [75])
    && !$P::administra(12, 80, function ($u, $t) { throw new RuntimeException('x'); }, [75]));
$admX = new AtributosService($repo, 80, 'jhony.admin@exemplo.invalid', $cat, true);
$kitsX = new KitsService($repo, 80, 'jhony.admin@exemplo.invalid', $cat, true);
$admO = new AtributosService($repo, 80, 'outro80@exemplo.invalid', $cat, false);
$kitsO = new KitsService($repo, 80, 'outro80@exemplo.invalid', $cat, false);
// DSHOW-049 (3): sugestão com VÍNCULO administrativo embutido, por quem NÃO administra → recusada inteira (nem vínculo, nem valor, sugestão segue pendente)
$sugO = new SugestoesService($repo, $admO, $kitsO, 80, 'outro80@exemplo.invalid');
$aV = (int) $adm->salvarAtributo(['rotulo' => 'Largura 049 (fora de kit)', 'tipo' => 'numero', 'unidade_id' => $uCm, 'casas' => 2])['atributo']['id'];
$sVinc = $insSug('t|202|larg049', 202, $aV, null, '55', $uCm);
$fotoV = fn() => json_encode([$linhas('SELECT modo, excluido_em FROM eq_produto_atributo WHERE product_id = 202 AND atributo_id = ?', [$aV]),
    $linhas('SELECT id, excluido_em FROM eq_valor WHERE product_id = 202 AND atributo_id = ?', [$aV]), $um('SELECT estado FROM eq_sugestao WHERE id = ?', [$sVinc])]);
$antesV = $fotoV();
$eV = $erro(fn() => $sugO->decidir(['id' => $sVinc, 'versao' => 1, 'decisao' => 'aceitar', 'vincular' => 1]));
$ok('049: outro80 aceitar sugestão COM vincular → 403; vínculo, valor e sugestão intactos', $eV?->http === 403 && $fotoV() === $antesV, $eV ? $eV->getMessage() : 'aceito (defeito)');
// a rota HTTP monta o serviço SEM kits para quem não administra (index.php) — mesmo resultado
$eV2 = $erro(fn() => (new SugestoesService($repo, $admO, null, 80, 'outro80@exemplo.invalid'))->decidir(['id' => $sVinc, 'versao' => 1, 'decisao' => 'aceitar', 'vincular' => 1]));
$ok('049: idem com o serviço SEM kits (como a rota HTTP monta) → 403 NOT_CATALOG_ADMIN, nada muda', $eV2?->http === 403 && $eV2->codigo === 'NOT_CATALOG_ADMIN' && $fotoV() === $antesV, $eV2 ? $eV2->getMessage() : 'aceito (defeito)');
$ok('049: SEM vincular e fora da ficha → 422 (regra antiga: valor só em atributo da ficha), nada muda', $erro(fn() => $sugO->decidir(['id' => $sVinc, 'versao' => 1, 'decisao' => 'aceitar']))?->http === 422 && $fotoV() === $antesV);
// atributo JÁ na ficha por kit: o "vincular" da Conferência não exige administração (nada administrativo acontece) → preencher segue
$pKit = null; $aKit = null;
foreach ([101, 102, 103, 104, 105, 106, 201, 202] as $pp) foreach ([$atr['Comprimento'], $atr['Profundidade'], $atr['Cor'], $atr['Vias']] as $aa)
    if ($pKit === null && $adm->naFicha($pp, $aa) && !$um('SELECT COUNT(*) FROM eq_valor WHERE product_id = ? AND atributo_id = ? AND excluido_em IS NULL', [$pp, $aa])
        && !$um('SELECT COUNT(*) FROM eq_produto_atributo WHERE product_id = ? AND atributo_id = ? AND excluido_em IS NULL', [$pp, $aa])) { $pKit = $pp; $aKit = $aa; }
$sKit = $insSug("t|$pKit|kit049", (int) $pKit, (int) $aKit, null, 'x', null);
$rKit = $erro(fn() => (new SugestoesService($repo, $admO, null, 80, 'outro80@exemplo.invalid'))->decidir(['id' => $sKit, 'versao' => 1, 'decisao' => 'aceitar', 'vincular' => 1, 'valor' => $aKit === $atr['Cor'] ? 'azul' : 12]));
$ok('049: outro80 com vincular num atributo JÁ na ficha (kit) → aceito como preenchimento, sem criar vínculo', $pKit !== null && $rKit === null
    && (int) $um('SELECT COUNT(*) FROM eq_valor WHERE product_id = ? AND atributo_id = ? AND excluido_em IS NULL', [$pKit, $aKit]) >= 1
    && !$um('SELECT COUNT(*) FROM eq_produto_atributo WHERE product_id = ? AND atributo_id = ? AND excluido_em IS NULL', [$pKit, $aKit]), $rKit ? $rKit->getMessage() : "produto $pKit atributo $aKit");
$aud = fn() => (int) $um('SELECT COUNT(*) FROM eq_auditoria');
$kO = (int) $kitsX->salvarKit(['nome' => 'Kit do administrador (perm)'])['kit']['id'];
$ok('perm: quem administra cria kit e a auditoria registra o ator certo', $um("SELECT usuario FROM eq_auditoria WHERE entidade = 'kit' AND entidade_id = ? AND acao = 'criar'", [(string) $kO]) === 'jhony.admin@exemplo.invalid');
$gK = $repo->grupo($kO); $a0 = $aud();
$nega = function (string $nome, callable $f, callable $intacto) use ($ok, $erro, $aud, &$a0) {
    $a0 = $aud(); $e = $erro($f);
    $ok("perm: outro nível 80 · $nome → 403, nada muda", $e?->http === 403 && $e->codigo === 'NOT_CATALOG_ADMIN' && $aud() === $a0 && $intacto(), $e ? "{$e->codigo} {$e->getMessage()}" : 'sem erro');
};
$nega('salvar kit', fn() => $kitsO->salvarKit(['id' => $kO, 'versao' => (int) $gK['versao'], 'nome' => 'invadido']), fn() => $repo->grupo($kO)['nome'] === 'Kit do administrador (perm)' && (int) $repo->grupo($kO)['versao'] === (int) $gK['versao']);
$nega('itens do kit', fn() => $kitsO->definirItens(['id' => $kO, 'versao' => (int) $gK['versao'], 'itens' => $itens([$atr['Cor']])]), fn() => (int) $repo->grupo($kO)['versao'] === (int) $gK['versao']);
$nega('criar atributo (dicionário)', fn() => $admO->salvarAtributo(['rotulo' => 'Invasor', 'tipo' => 'texto']), fn() => (int) $um("SELECT COUNT(*) FROM eq_atributo WHERE rotulo = 'Invasor'") === 0);
$nega('criar unidade', fn() => $admO->criarUnidade(['simbolo' => 'inv', 'nome' => 'invasora', 'grandeza' => 'comprimento', 'fator_base' => '1']), fn() => (int) $um("SELECT COUNT(*) FROM eq_unidade WHERE simbolo = 'inv'") === 0);
$vvO = $verVinc(101);
$nega('vínculo por produto', fn() => $kitsO->definirAjuste(['product_id' => 101, 'atributo_id' => $atr['Cor'], 'modo' => 'excluir', 'motivo' => 'x', 'versao_vinculos' => $vvO]), fn() => $verVinc(101) === $vvO);
$pM2 = ['produtos' => [101], 'kits_aplicar' => [$kO], 'chave' => 'perm-outro-0001'];
$nega('aplicar em massa', fn() => $kitsO->aplicarMassa($pM2 + ['versao_previa' => str_repeat('0', 64)]), fn() => (int) $um("SELECT COUNT(*) FROM eq_pedido_massa WHERE chave = 'perm-outro-0001'") === 0);
$ok('perm: outro nível 80 PREENCHE valor e a auditoria registra ele', fn() => (bool) $admO->gravarValor(['product_id' => 102, 'atributo_id' => $peso, 'valor' => '3', 'versao' => (int) $um('SELECT versao FROM eq_valor WHERE product_id = 102 AND atributo_id = ? AND excluido_em IS NULL', [$peso])])
    && $um("SELECT usuario FROM eq_auditoria WHERE entidade = 'valor' AND entidade_id = ? ORDER BY id DESC LIMIT 1", ["102:$peso:0"]) === 'outro80@exemplo.invalid');
$ok('perm: pode_administrar = false para o outro nível 80; true para quem administra', $admO->podeAdministrar() === false && $admX->podeAdministrar() === true);

// ---- DSHOW-035 #4: "informado" vazio é recusado (422), sem mutação -------------------------------------------------------------
$txt = (int) $adm->salvarAtributo(['rotulo' => 'Observação (teste #4)', 'tipo' => 'texto'])['atributo']['id'];
$aj(['product_id' => 103, 'atributo_id' => $txt, 'modo' => 'incluir']);
$a4 = (int) $um('SELECT COUNT(*) FROM eq_auditoria');
foreach (['' => 'texto vazio', '   ' => 'só espaços'] as $v => $nome)
    $ok("#4: $nome → 422 e nada gravado", fn() => in_array($erro(fn() => $adm->gravarValor(['product_id' => 103, 'atributo_id' => $txt, 'valor' => $v]))?->http, [422], true)
        && (int) $um('SELECT COUNT(*) FROM eq_valor WHERE product_id = 103 AND atributo_id = ?', [$txt]) === 0 && (int) $um('SELECT COUNT(*) FROM eq_auditoria') === $a4);
$ok('#4: número vazio → 422', fn() => $erro(fn() => $adm->gravarValor(['product_id' => 104, 'atributo_id' => $alt, 'valor' => '']))?->http === 422);
$ok('#4: "não se aplica" sem valor continua permitido', fn() => (bool) $adm->gravarValor(['product_id' => 103, 'atributo_id' => $txt, 'estado' => 'nao_se_aplica']));

// ---- DSHOW-045: unidades extras e ordem das opções exigem a lista ANTERIOR (versão do conjunto), conferida sob trava -------------
$ex = fn() => array_map('intval', $repo->unidadesExtras($alt));
$ult = fn(string $acao) => $linhas("SELECT antes, depois, usuario FROM eq_auditoria WHERE entidade = 'atributo' AND entidade_id = ? AND acao = ? ORDER BY id DESC LIMIT 1", [(string) ($acao === 'reordenar_opcoes' ? $moId : $alt), $acao])[0] ?? null;
$vistoA = $ex(); $vistoB = $ex(); sort($vistoA); sort($vistoB);                 // as duas abas leram a mesma lista
$adm->definirUnidadesPermitidas(['atributo_id' => $alt, 'unidades' => array_merge($vistoA, [$uMm]), 'unidades_antes' => $vistoA]);   // aba A inclui U2 (mm)
$a045 = (int) $um('SELECT COUNT(*) FROM eq_auditoria');
$e045 = $erro(fn() => $adm->definirUnidadesPermitidas(['atributo_id' => $alt, 'unidades' => $vistoB, 'unidades_antes' => $vistoB]));   // aba B envia a lista antiga
$ok('045 unidades: aba B com a lista antiga → 409; U2 preservada; auditoria sem linha nova', $e045?->http === 409 && in_array($uMm, $ex(), true) && (int) $um('SELECT COUNT(*) FROM eq_auditoria') === $a045, $e045 ? $e045->getMessage() : 'sem erro');
$h = $ult('unidades_permitidas');
$ok('045 unidades: histórico antes/depois corretos', $h && json_decode($h['antes'], true)['unidades'] === $vistoA && in_array($uMm, json_decode($h['depois'], true)['unidades'], true), json_encode($h));
$ok('045 unidades: sem a lista anterior → 422', fn() => $erro(fn() => $adm->definirUnidadesPermitidas(['atributo_id' => $alt, 'unidades' => [$uPe]]))?->http === 422 && in_array($uMm, $ex(), true));
$ord = fn() => array_map(static fn($o) => (int) $o['id'], $repo->opcoes($moId));
$O = $ord(); $X = array_reverse($O); $Y = array_merge(array_slice($O, 1), [$O[0]]);
$adm->reordenarOpcoes($moId, $X, $O);                                             // aba A reordena (viu O)
$a045 = (int) $um('SELECT COUNT(*) FROM eq_auditoria');
$e045b = $erro(fn() => $adm->reordenarOpcoes($moId, $Y, $O));                     // aba B reordena com a ordem velha
$ok('045 opções: 2ª reordenação concorrente → 409; a ordem da aba A fica; auditoria sem linha nova', $e045b?->http === 409 && $ord() === $X && (int) $um('SELECT COUNT(*) FROM eq_auditoria') === $a045, $e045b ? $e045b->getMessage() : 'sem erro');
$h = $ult('reordenar_opcoes');
$ok('045 opções: histórico antes/depois corretos', $h && json_decode($h['antes'], true)['ordem'] === $O && json_decode($h['depois'], true)['ordem'] === $X, json_encode($h));
$ok('045 opções: com a ordem atual a aba B consegue', fn() => (bool) $adm->reordenarOpcoes($moId, $Y, $X) && $ord() === $Y);
$ok('045 opções: sem a ordem anterior → 422', fn() => $erro(fn() => $adm->reordenarOpcoes($moId, $O))?->http === 422 && $ord() === $Y);

// ---- DSHOW-049/050: versão do conjunto = CONTADOR MONOTÔNICO por (produto, atributo) (soma das versões da trilha, tombstones inclusive) ----
// $tri = estado COMPLETO das linhas do (103, multi) — todas as colunas, tombstones e versões — e os eventos de auditoria DESTA intenção
// (entidade valor, "103:<atributo>:*"), não a contagem global.
$aj(['product_id' => 103, 'atributo_id' => $moId, 'modo' => 'incluir']);
$tri = fn() => json_encode([
    $linhas('SELECT id, opcao_id, opcao_chave, valor_texto, valor_num, valor_bool, valor_data, unidade_id, estado, origem, versao, excluido_em, atualizado_por FROM eq_valor WHERE product_id = 103 AND atributo_id = ? ORDER BY opcao_chave', [$moId]),
    $linhas("SELECT id, usuario, acao, entidade_id, antes, depois FROM eq_auditoria WHERE entidade = 'valor' AND entidade_id LIKE ? ORDER BY id", ["103:$moId:%"])]);
$cont = []; $marca = function () use (&$cont, $vc) { $cont[] = (int) $vc(103); };   // registra o contador depois de CADA mutação
$nunca = (int) $um('SELECT COUNT(*) FROM eq_valor WHERE product_id = 103 AND atributo_id = ?', [$moId]);
$v0 = $vc(103);                                                                             // aba A lê o campo: vazio DE SEMPRE
$ok('050: campo que nunca teve linha → contador "0"', $nunca === 0 && $v0 === '0');
// (1) primeiro preenchimento legítimo
$ok('050 (1): 1º preenchimento sem versão (nunca teve linha) → aceito', fn() => (bool) $adm->gravarValor(['product_id' => 103, 'atributo_id' => $moId, 'valor' => (int) $opsMo[0]['id']]));
$marca();
$vA = $vc(103);                                                                             // aba A lê o conjunto preenchido
$adm->limparValor(['product_id' => 103, 'atributo_id' => $moId, 'versao_conjunto' => $vc(103)]); $marca();   // aba B limpa
$antes = $tri();
// (2) revisão antiga após a limpeza
$e1 = $erro(fn() => $adm->gravarValor(['product_id' => 103, 'atributo_id' => $moId, 'estado' => 'nao_se_aplica', 'versao_conjunto' => $vA]));
$ok('050 (2): revisão ANTIGA depois da limpeza → 409; linhas, tombstones, versões e eventos desta intenção intactos', $e1?->http === 409 && $tri() === $antes, $e1 ? $e1->getMessage() : 'aceito (defeito)');
$e2 = $erro(fn() => $adm->gravarValor(['product_id' => 103, 'atributo_id' => $moId, 'valor' => (int) $opsMo[1]['id'], 'versao_conjunto' => $vA]));
$ok('050 (2): acrescentar opção com revisão antiga no vazio → 409, nada muda', $e2?->http === 409 && $tri() === $antes);
// (6) ciclo vazio → preenchido → vazio: a assinatura do vazio inicial NÃO volta
$ok('050 (6): depois do ciclo, o contador do vazio ≠ o do vazio inicial', $vc(103) !== $v0);
$e3 = $erro(fn() => $adm->gravarValor(['product_id' => 103, 'atributo_id' => $moId, 'estado' => 'nao_se_aplica', 'versao_conjunto' => $v0]));
$ok('050 (6): ciclo vazio → preenchido → vazio: revisão do vazio INICIAL → 409, nada muda', $e3?->http === 409 && $tri() === $antes);
// (4) omitida, malformada ou inválida
$e4 = $erro(fn() => $adm->gravarValor(['product_id' => 103, 'atributo_id' => $moId, 'estado' => 'nao_se_aplica']));
$ok('050 (4): revisão OMITIDA no vazio com trilha → 422, nada muda', $e4?->http === 422 && $tri() === $antes);
$malf = true; foreach (['xyz', '', '-1', '01', '1.0', ' 2', '64bb12efd9b4995f', str_repeat('9', 17)] as $m) {
    $e = $erro(fn() => $adm->gravarValor(['product_id' => 103, 'atributo_id' => $moId, 'estado' => 'nao_se_aplica', 'versao_conjunto' => $m])); $malf = $malf && $e?->http === 422; }
$e = $erro(fn() => $adm->gravarValor(['product_id' => 103, 'atributo_id' => $moId, 'estado' => 'nao_se_aplica', 'versao_conjunto' => 7])); $malf = $malf && $e?->http === 422;   // número, não texto
$ok('050 (4): revisão MALFORMADA (texto, vazia, negativa, zero à esquerda, decimal, espaço, formato antigo hex, longa demais, número) → 422, nada muda', $malf && $tri() === $antes);
$e5 = $erro(fn() => $adm->gravarValor(['product_id' => 103, 'atributo_id' => $moId, 'estado' => 'nao_se_aplica', 'versao_conjunto' => (string) ((int) $vc(103) + 1000)]));
$ok('050 (4): revisão bem formada mas INVÁLIDA (número do futuro) → 409, nada muda', $e5?->http === 409 && $tri() === $antes);
// (3) revisão atual do vazio
$ok('050 (3): revisão ATUAL do vazio → aceita ("não se aplica")', fn() => (bool) $adm->gravarValor(['product_id' => 103, 'atributo_id' => $moId, 'estado' => 'nao_se_aplica', 'versao_conjunto' => $vc(103)])
    && $um('SELECT estado FROM eq_valor WHERE product_id = 103 AND atributo_id = ? AND excluido_em IS NULL', [$moId]) === 'nao_se_aplica');
$marca();
$adm->limparValor(['product_id' => 103, 'atributo_id' => $moId, 'versao_conjunto' => $vc(103)]); $marca();
// (5) reativação: a mesma linha (tombstone) revive; o contador sobe; a revisão de antes da reativação passa a valer 409
$vAntesReativ = $vc(103); $idLinha = (int) $um('SELECT id FROM eq_valor WHERE product_id = 103 AND atributo_id = ? AND opcao_chave = ?', [$moId, (int) $opsMo[0]['id']]);
$ok('050 (5): REATIVAÇÃO com a revisão atual → aceita; a MESMA linha revive (sem linha nova)', fn() => (bool) $adm->gravarValor(['product_id' => 103, 'atributo_id' => $moId, 'valor' => (int) $opsMo[0]['id'], 'versao_conjunto' => $vAntesReativ])
    && (int) $um('SELECT id FROM eq_valor WHERE product_id = 103 AND atributo_id = ? AND opcao_chave = ? AND excluido_em IS NULL', [$moId, (int) $opsMo[0]['id']]) === $idLinha);
$marca();
$depoisReativ = $tri();
$e6 = $erro(fn() => $adm->limparValor(['product_id' => 103, 'atributo_id' => $moId, 'versao_conjunto' => $vAntesReativ]));
$ok('050 (5): depois da reativação, a revisão de ANTES dela → 409 (limpar), nada muda', $e6?->http === 409 && $tri() === $depoisReativ);
// monotonicidade: o contador subiu a CADA mutação (preencher, limpar, não se aplica, limpar, reativar) e nunca repetiu
$mono = true; for ($k = 1; $k < count($cont); $k++) $mono = $mono && $cont[$k] > $cont[$k - 1];
$ok('050: contador ESTRITAMENTE crescente em todas as mutações (' . implode(' < ', $cont) . ')', $mono && $cont[0] > (int) $v0 && count(array_unique($cont)) === count($cont));
// (+) duas edições INDEPENDENTES: a mesma leitura serve para mudanças que não se tocam
$mo2 = (int) $adm->salvarAtributo(['rotulo' => 'Saídas (multi 050)', 'tipo' => 'multiopcao'])['atributo']['id'];
$adm->adicionarOpcao($mo2, 'XLR'); $ops2 = $adm->adicionarOpcao($mo2, 'P10')['opcoes'];
$aj(['product_id' => 103, 'atributo_id' => $mo2, 'modo' => 'incluir']);
$vcDe = fn(int $aid) => AtributosService::versaoConjunto($linhas('SELECT versao FROM eq_valor WHERE product_id = 103 AND atributo_id = ?', [$aid]));
$lidoX = $vc(103); $lidoY = $vcDe($mo2);                                                    // abas A e B leem a mesma ficha
$okA = $erro(fn() => $adm->gravarValor(['product_id' => 103, 'atributo_id' => $moId, 'estado' => 'nao_se_aplica', 'versao_conjunto' => $lidoX]));   // aba A: campo X
$okB = $erro(fn() => $adm->gravarValor(['product_id' => 103, 'atributo_id' => $mo2, 'estado' => 'desconhecido', 'versao_conjunto' => $lidoY]));    // aba B: campo Y
$ok('050 (+): duas edições independentes (campos diferentes do MESMO produto, mesma leitura) → as duas aceitas', $okA === null && $okB === null
    && $um('SELECT estado FROM eq_valor WHERE product_id = 103 AND atributo_id = ? AND excluido_em IS NULL', [$moId]) === 'nao_se_aplica'
    && $um('SELECT estado FROM eq_valor WHERE product_id = 103 AND atributo_id = ? AND excluido_em IS NULL', [$mo2]) === 'desconhecido', ($okA?->getMessage() ?? '') . ' ' . ($okB?->getMessage() ?? ''));
$adm->gravarValor(['product_id' => 103, 'atributo_id' => $mo2, 'valor' => (int) $ops2[0]['id'], 'versao_conjunto' => $vcDe($mo2)]);   // troca o estado por XLR
$lido2 = $vcDe($mo2);
$a1 = $erro(fn() => $adm->gravarValor(['product_id' => 103, 'atributo_id' => $mo2, 'valor' => (int) $ops2[1]['id'], 'versao_conjunto' => $lido2]));   // aba A acrescenta P10
$ok('050 (+): acrescentar opção a conjunto não vazio continua por opção → aceita, XLR e P10 marcados', $a1 === null
    && (int) $um('SELECT COUNT(*) FROM eq_valor WHERE product_id = 103 AND atributo_id = ? AND excluido_em IS NULL', [$mo2]) === 2);

// ---- DSHOW-053: limparValor da multiopção confere a revisão do conjunto ANTES do "sem mudança" (conjunto vazio) ----------------------
$mo3 = (int) $adm->salvarAtributo(['rotulo' => 'Entradas (multi 053)', 'tipo' => 'multiopcao'])['atributo']['id'];
$adm->adicionarOpcao($mo3, 'DVI'); $ops3 = $adm->adicionarOpcao($mo3, 'VGA')['opcoes'];
$aj(['product_id' => 101, 'atributo_id' => $mo3, 'modo' => 'incluir']);
$vc3 = fn() => AtributosService::versaoConjunto($linhas('SELECT versao FROM eq_valor WHERE product_id = 101 AND atributo_id = ?', [$mo3]));
$est3 = fn() => json_encode([$linhas('SELECT id, opcao_chave, estado, versao, excluido_em, atualizado_por FROM eq_valor WHERE product_id = 101 AND atributo_id = ? ORDER BY opcao_chave', [$mo3]),
    $linhas("SELECT id, acao, entidade_id, antes, depois FROM eq_auditoria WHERE entidade = 'valor' AND entidade_id LIKE ? ORDER BY id", ["101:$mo3:%"])]);
$lim = fn(array $x) => $erro(fn() => $adm->limparValor(['product_id' => 101, 'atributo_id' => $mo3] + $x));
$r0 = $vc3(); $e0 = $est3();
$res = $adm->limparValor(['product_id' => 101, 'atributo_id' => $mo3, 'versao_conjunto' => $r0]);
$ok('053: limpar o VAZIO (nunca teve linha) com a revisão atual "0" → sem_mudanca, sem auditoria', !empty($res['sem_mudanca']) && $est3() === $e0 && $r0 === '0');
$ok('053: limpar o vazio SEM revisão → 422 (contrato), nada muda', $lim([])?->http === 422 && $est3() === $e0);
$ok('053: limpar o vazio com revisão MALFORMADA → 422, nada muda', $lim(['versao_conjunto' => 'abc'])?->http === 422 && $lim(['versao_conjunto' => '01'])?->http === 422 && $est3() === $e0);
$ok('053: limpar o vazio com revisão bem formada mas errada → 409, nada muda', $lim(['versao_conjunto' => '5'])?->http === 409 && $est3() === $e0);
// 1º preenchimento preservado; ciclo vazio → preenchido → vazio
$ok('053: 1º preenchimento preservado (sem revisão, campo nunca teve linha)', fn() => (bool) $adm->gravarValor(['product_id' => 101, 'atributo_id' => $mo3, 'valor' => (int) $ops3[0]['id']]));
$rCheio = $vc3();
$adm->limparValor(['product_id' => 101, 'atributo_id' => $mo3, 'versao_conjunto' => $rCheio]);
$eVazio = $est3(); $rVazio = $vc3();
$ok('053: ciclo vazio → preenchido → vazio + limpar com a revisão INICIAL ("0") → 409, nada muda', $lim(['versao_conjunto' => $r0])?->http === 409 && $est3() === $eVazio);
$ok('053: limpar o vazio (depois do ciclo) com a revisão de quando estava CHEIO → 409, nada muda', $lim(['versao_conjunto' => $rCheio])?->http === 409 && $est3() === $eVazio);
$res2 = $adm->limparValor(['product_id' => 101, 'atributo_id' => $mo3, 'versao_conjunto' => $rVazio]);
$ok('053: limpar o vazio (depois do ciclo) com a revisão ATUAL → sem_mudanca, sem auditoria, tombstone intacto', !empty($res2['sem_mudanca']) && $est3() === $eVazio);
// reativação preservada
$ok('053: reativação com a revisão atual → a MESMA linha revive', fn() => (bool) $adm->gravarValor(['product_id' => 101, 'atributo_id' => $mo3, 'valor' => (int) $ops3[0]['id'], 'versao_conjunto' => $vc3()])
    && (int) $um('SELECT COUNT(*) FROM eq_valor WHERE product_id = 101 AND atributo_id = ?', [$mo3]) === 1);
// dois escritores com a MESMA leitura: o 1º limpa, o 2º recebe 409 (não um "sem mudança" silencioso)
$lida = $vc3();
$w1 = $lim(['versao_conjunto' => $lida]); $eDepois1 = $est3();
$w2 = $lim(['versao_conjunto' => $lida]);
$ok('053: dois escritores, mesma leitura: o 1º limpa; o 2º → 409 e nada muda', $w1 === null && $w2?->http === 409 && $est3() === $eDepois1);
// rollback quando a auditoria falha (só neste banco de teste a tabela de auditoria fica indisponível durante a limpeza)
$adm->gravarValor(['product_id' => 101, 'atributo_id' => $mo3, 'valor' => (int) $ops3[0]['id'], 'versao_conjunto' => $vc3()]);
$adm->gravarValor(['product_id' => 101, 'atributo_id' => $mo3, 'valor' => (int) $ops3[1]['id']]);
$antesRb = $est3(); $rAntesRb = $vc3();
$pdo->exec('RENAME TABLE eq_auditoria TO eq_auditoria_t053');   // só neste banco de teste: a auditoria fica indisponível durante a limpeza
$falhou = false; try { $adm->limparValor(['product_id' => 101, 'atributo_id' => $mo3, 'versao_conjunto' => $rAntesRb]); } catch (Throwable $e) { $falhou = true; }
$pdo->exec('RENAME TABLE eq_auditoria_t053 TO eq_auditoria');
$ok('053: auditoria falha no meio da limpeza (2 opções) → erro e ROLLBACK total (as 2 linhas vivas, mesmas versões, revisão igual)', $falhou && $est3() === $antesRb && $vc3() === $rAntesRb);
$ok('053: depois do rollback, a mesma revisão limpa normalmente', $lim(['versao_conjunto' => $rAntesRb]) === null && (int) $um('SELECT COUNT(*) FROM eq_valor WHERE product_id = 101 AND atributo_id = ? AND excluido_em IS NULL', [$mo3]) === 0);
// nenhum caminho apaga tombstone fisicamente nem faz a revisão regredir
$src = ''; foreach (array_merge(glob(__DIR__ . '/../../../api/atributos/*.php'), glob(__DIR__ . '/../../../tools/equipamentos/*.php')) as $arq) $src .= file_get_contents($arq);
$ok('053: nenhum DELETE físico em eq_valor no código (api/atributos, tools/equipamentos)', !preg_match('/DELETE\s+FROM[^;]{0,80}eq_valor/i', $src) && !preg_match('/TRUNCATE[^;]{0,40}eq_valor/i', $src));
preg_match_all('/UPDATE[^;]{0,80}eq_valor[^;]*?\bSET\b(.*?)\bWHERE\b/is', $src, $mm);
$setsRuins = array_filter($mm[1], static fn($set) => (bool) preg_match('/\bversao\s*=(?!\s*versao\s*\+\s*1\b)/i', $set));
$ok('053: nenhum UPDATE de eq_valor faz a versão regredir (no SET: só "versao = versao + 1" ou não toca na versão; ' . count($mm[1]) . ' UPDATEs lidos)', count($mm[1]) >= 5 && !$setsRuins, implode(' | ', array_map(static fn($x) => substr(trim($x), 0, 80), $setsRuins)));
$ok('053: total de linhas de eq_valor deste teste: nenhuma sumiu (tombstones preservados)', (int) $um('SELECT COUNT(*) FROM eq_valor WHERE product_id = 101 AND atributo_id = ?', [$mo3]) === 2);

// ---- DSHOW-034 (concorrência, Cima 18/11): A) valor limpo recriado por aba antiga; B) opção remarcada desmarcada por aba antiga ----------
$tx = (int) $adm->salvarAtributo(['rotulo' => 'Observação 034A', 'tipo' => 'texto'])['atributo']['id'];
$aj(['product_id' => 104, 'atributo_id' => $tx, 'modo' => 'incluir']);
$adm->gravarValor(['product_id' => 104, 'atributo_id' => $tx, 'valor' => 'Original']);
$vB = (int) $um('SELECT versao FROM eq_valor WHERE product_id = 104 AND atributo_id = ? AND opcao_chave = 0', [$tx]);   // a sessão B lê "Original"
$adm->limparValor(['product_id' => 104, 'atributo_id' => $tx, 'versao' => $vB]);                                          // a sessão A limpa
$eA = $erro(fn() => $adm->gravarValor(['product_id' => 104, 'atributo_id' => $tx, 'valor' => 'Revisado', 'versao' => $vB]));   // B salva com a versão antiga
$vivoA = $um('SELECT valor_texto FROM eq_valor WHERE product_id = 104 AND atributo_id = ? AND opcao_chave = 0 AND excluido_em IS NULL', [$tx]);
$ok('034-A: aba antiga (versão de "Original") salva "Revisado" depois da limpeza → 409 e o campo fica VAZIO', $eA?->http === 409 && ($vivoA === null || $vivoA === false), $eA ? $eA->getMessage() : 'aceito; valor=' . var_export($vivoA, true));
$ok('034-A: B relê (vazio, sem versão de valor) e preenche normalmente', fn() => (bool) $adm->gravarValor(['product_id' => 104, 'atributo_id' => $tx, 'valor' => 'Revisado'])
    && $um('SELECT valor_texto FROM eq_valor WHERE product_id = 104 AND atributo_id = ? AND excluido_em IS NULL', [$tx]) === 'Revisado');
$mB = (int) $adm->salvarAtributo(['rotulo' => 'Saídas 034B', 'tipo' => 'multiopcao'])['atributo']['id'];
$adm->adicionarOpcao($mB, 'A'); $adm->adicionarOpcao($mB, 'B'); $adm->adicionarOpcao($mB, 'C'); $opsB = $adm->adicionarOpcao($mB, 'D')['opcoes'];
[$oA, $oB, $oC, $oD] = array_map(static fn($o) => (int) $o['id'], $opsB);
$aj(['product_id' => 104, 'atributo_id' => $mB, 'modo' => 'incluir']);
$vcB = fn() => AtributosService::versaoConjunto($linhas('SELECT versao FROM eq_valor WHERE product_id = 104 AND atributo_id = ?', [$mB]));
$adm->gravarValor(['product_id' => 104, 'atributo_id' => $mB, 'valor' => $oA, 'versao_conjunto' => $vcB()]); $adm->gravarValor(['product_id' => 104, 'atributo_id' => $mB, 'valor' => $oB]);
// a sessão antiga lê: A e B marcadas (a tela manda a versão do VALOR = 1ª opção viva e a versão do conjunto)
$velhaVersao = (int) $um('SELECT versao FROM eq_valor WHERE product_id = 104 AND atributo_id = ? AND excluido_em IS NULL ORDER BY opcao_chave LIMIT 1', [$mB]); $velhoConj = $vcB();
// a sessão A desmarca B e remarca B
$adm->removerOpcaoDoValor(['product_id' => 104, 'atributo_id' => $mB, 'opcao_id' => $oB, 'versao' => (int) $um('SELECT versao FROM eq_valor WHERE product_id = 104 AND atributo_id = ? AND opcao_chave = ?', [$mB, $oB]), 'versao_conjunto' => $vcB()]);
$adm->gravarValor(['product_id' => 104, 'atributo_id' => $mB, 'valor' => $oB, 'versao_conjunto' => $vcB()]);
$eB = $erro(fn() => $adm->removerOpcaoDoValor(['product_id' => 104, 'atributo_id' => $mB, 'opcao_id' => $oB, 'versao' => $velhaVersao, 'versao_conjunto' => $velhoConj]));
$bMarcada = (int) $um('SELECT COUNT(*) FROM eq_valor WHERE product_id = 104 AND atributo_id = ? AND opcao_chave = ? AND excluido_em IS NULL', [$mB, $oB]) === 1;
$ok('034-B: aba antiga desmarca B depois de A desmarcar e remarcar B → 409 e B continua marcada', $eB?->http === 409 && $bMarcada, $eB ? $eB->getMessage() : 'aceito; B marcada=' . var_export($bMarcada, true));
// controle: duas sessões acrescentando opções diferentes (mesma leitura) continuam funcionando
$c1 = $erro(fn() => $adm->gravarValor(['product_id' => 104, 'atributo_id' => $mB, 'valor' => $oC, 'versao_conjunto' => $vcB()]));
$c2 = $erro(fn() => $adm->gravarValor(['product_id' => 104, 'atributo_id' => $mB, 'valor' => $oD, 'versao_conjunto' => $velhoConj]));
$ok('034 controle: duas sessões acrescentando opções diferentes → as duas gravam (A, B, C, D marcadas)', $c1 === null && $c2 === null
    && (int) $um('SELECT COUNT(*) FROM eq_valor WHERE product_id = 104 AND atributo_id = ? AND excluido_em IS NULL', [$mB]) === 4, ($c1?->getMessage() ?? '') . ' ' . ($c2?->getMessage() ?? ''));
$ok('034-B: com a versão ATUAL do conjunto, desmarcar B funciona', fn() => (bool) $adm->removerOpcaoDoValor(['product_id' => 104, 'atributo_id' => $mB, 'opcao_id' => $oB, 'versao' => (int) $um('SELECT versao FROM eq_valor WHERE product_id = 104 AND atributo_id = ? AND opcao_chave = ?', [$mB, $oB]), 'versao_conjunto' => $vcB()])
    && (int) $um('SELECT COUNT(*) FROM eq_valor WHERE product_id = 104 AND atributo_id = ? AND opcao_chave = ? AND excluido_em IS NULL', [$mB, $oB]) === 0);

// ---- DSHOW-034 · DUAS CONEXÕES REALMENTE CONCORRENTES (pcntl_fork): dois escritores com a MESMA versão lida, liberados juntos ----------
$txc = (int) $adm->salvarAtributo(['rotulo' => 'Observação 034C', 'tipo' => 'texto'])['atributo']['id'];
$aj(['product_id' => 104, 'atributo_id' => $txc, 'modo' => 'incluir']);
$adm->gravarValor(['product_id' => 104, 'atributo_id' => $txc, 'valor' => 'Original']);
$vC = (int) $um('SELECT versao FROM eq_valor WHERE product_id = 104 AND atributo_id = ? AND opcao_chave = 0', [$txc]);
$audC0 = (int) $um("SELECT COUNT(*) FROM eq_auditoria WHERE entidade = 'valor' AND entidade_id = ?", ["104:$txc:0"]);
$pdo->exec('CREATE TABLE t034c_resultado (k INT PRIMARY KEY, res VARCHAR(80)) ENGINE=InnoDB');   // os filhos respondem por aqui (sem arquivos)
$pdo->query("SELECT GET_LOCK('m034c-barreira', 10)")->fetchColumn();   // o pai segura a barreira: os dois filhos esperam nela
$filhos = [];
foreach ([1, 2] as $k) {
    $pid = pcntl_fork();
    if ($pid === 0) {   // FILHO: conexão PRÓPRIA (a do pai não é tocada; sai por SIGKILL, sem destrutores)
        $res = 'erro';
        try {
            $pk = new PDO($dsn, $tira($c['user'] ?? ''), $tira($c['password'] ?? ''), [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
            $pk->query("SELECT GET_LOCK('m034c-barreira', 20)")->fetchColumn(); $pk->query("SELECT RELEASE_LOCK('m034c-barreira')")->fetchColumn();
            $svk = new AtributosService(new AtributosRepoPdo($pk, ''), 80, "escritor$k@exemplo.invalid", $cat);
            $t = microtime(true);
            try { $svk->gravarValor(['product_id' => 104, 'atributo_id' => $txc, 'valor' => "Escritor $k", 'versao' => $vC]); $res = 'ok'; }
            catch (AtributosErro $e) { $res = $e->http === 409 ? '409' : 'http' . $e->http; }
            $res .= sprintf(' %.3f', $t);
        } catch (Throwable $e) { $res = 'erro ' . get_class($e); }
        try { $pk->prepare('INSERT INTO t034c_resultado (k, res) VALUES (?, ?)')->execute([$k, $res]); } catch (Throwable $e) { }
        posix_kill(posix_getpid(), SIGKILL);
    }
    $filhos[$k] = $pid;
}
usleep(400000); $pdo->query("SELECT RELEASE_LOCK('m034c-barreira')")->fetchColumn();   // solta os dois ao mesmo tempo
foreach ($filhos as $pid) pcntl_waitpid($pid, $st);
$r = []; foreach ([1, 2] as $k) $r[$k] = explode(' ', (string) $um('SELECT res FROM t034c_resultado WHERE k = ?', [$k]));
$sts = [$r[1][0], $r[2][0]]; sort($sts);
$venc = $r[1][0] === 'ok' ? 1 : 2;
$t1 = (float) ($r[1][1] ?? 0); $t2 = (float) ($r[2][1] ?? 0);
$ok('034 concorrente: os dois escritores começaram juntos (diferença < 50 ms) e só UM grava; o outro recebe 409', $sts === ['409', 'ok'] && abs($t1 - $t2) < 0.05, json_encode($r));
$ok('034 concorrente: valor = o do vencedor; versão subiu UMA vez; auditoria com UMA linha nova (a do vencedor)', $um('SELECT valor_texto FROM eq_valor WHERE product_id = 104 AND atributo_id = ? AND opcao_chave = 0 AND excluido_em IS NULL', [$txc]) === "Escritor $venc"
    && (int) $um('SELECT versao FROM eq_valor WHERE product_id = 104 AND atributo_id = ? AND opcao_chave = 0', [$txc]) === $vC + 1
    && (int) $um("SELECT COUNT(*) FROM eq_auditoria WHERE entidade = 'valor' AND entidade_id = ?", ["104:$txc:0"]) === $audC0 + 1
    && $um("SELECT usuario FROM eq_auditoria WHERE entidade = 'valor' AND entidade_id = ? ORDER BY id DESC LIMIT 1", ["104:$txc:0"]) === "escritor$venc@exemplo.invalid");
$ok('034 concorrente: a conexão do pai continua viva depois dos filhos', (int) $um('SELECT 1') === 1);

// DSHOW-049 × sugestão: aceitar sugestão num campo multiopção que JÁ TEVE valor e foi limpo continua funcionando (D10 confere o vazio sob trava)
$adm->limparValor(['product_id' => 103, 'atributo_id' => $moId, 'versao_conjunto' => $vc(103)]);
$sMo = $insSug('t|103|mo049', 103, $moId, null, (string) $opsMo[1]['id'], null);
$ok('049: sugestão aceita no vazio COM trilha (sem versão do cliente) → grava', fn() => (bool) $sug->decidir(['id' => $sMo, 'decisao' => 'aceitar', 'versao' => 1, 'valor' => (int) $opsMo[1]['id']])
    && (int) $um('SELECT COUNT(*) FROM eq_valor WHERE product_id = 103 AND atributo_id = ? AND excluido_em IS NULL', [$moId]) === 1);

echo ($falhas === 0 ? '[OK]  ' : '[FALHA]') . " modulo-mysql (kits, vínculos, massa, sugestões, unidade): $n casos, $falhas falha(s)\n";
exit($falhas === 0 ? 0 : 1);
