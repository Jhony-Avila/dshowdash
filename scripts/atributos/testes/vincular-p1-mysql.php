<?php
// Produtos & Atributos — Vincular v2 (18/11, ESQUERDA): P1 do parecer externo + Codex, teste de BANCO REAL.
//  (a) prévia × gravação: atributo já presente na ficha por QUALQUER origem = sem mudança — a prévia diz "0 novos" e a gravação tem 0
//      efeitos (nenhum avulso criado, desfecho sem_mudanca); a prévia e a gravação usam a MESMA função (KitsService::inclusoesQueEntram).
//      Cenário do parecer: produtos 550 e 158 com o atributo 27 só pelo kit. O catálogo é SINTÉTICO (em memória), então os ids 550/158 são
//      os mesmos; o atributo nasce com id 27 (AUTO_INCREMENT da base de teste vazia ajustado para 27).
//  (b) atributo desativado: [id => null] não passa mais (isset → array_key_exists); desativado ENTRE a prévia e a confirmação (outra
//      conexão, depois do registro da chave, dentro da transação) → 422 "O atributo foi desativado. Atualize a seleção.", 0 vínculos, sem
//      recibo; reenvio de operação já concluída continua devolvendo o recibo original.
// Schema ATRWEB_VAL_T_7/_8/_9 VAZIO com as migrações 001–011 (molde do foi-salvo-mysql.php). Entradas: EQ_TEST_CNF e EQ_TEST_DB.
// Saída: 0 verde · 1 falha · 2 não executado · 3 recusado.
declare(strict_types=1);
require_once __DIR__ . '/../../../api/atributos/AtributosRepo.php';
require_once __DIR__ . '/../../../api/atributos/KitsService.php';
require_once __DIR__ . '/../../../api/atributos/ProdutosLeitura.php';
require_once __DIR__ . '/../../../api/atributos/LeituraVitrinePdo.php';
require_once __DIR__ . '/../../../api/atributos/CatalogoPdo.php';
require_once __DIR__ . '/../../../api/atributos/SugestoesService.php';
require_once __DIR__ . '/_memoria.php';

[$cnf, $db] = [(string) (getenv('EQ_TEST_CNF') ?: ''), (string) (getenv('EQ_TEST_DB') ?: '')];
$dir = __DIR__ . '/../../../db/equipamentos/migrations';
if ($cnf === '' || $db === '' || !is_readable($cnf)) { echo "[NÃO EXECUTADO] vincular-p1-mysql: faltam EQ_TEST_CNF/EQ_TEST_DB\n"; exit(2); }
if (!in_array($db, ['ATRWEB_VAL_T_7', 'ATRWEB_VAL_T_8', 'ATRWEB_VAL_T_9'], true)) { echo "[RECUSADO] vincular-p1-mysql: só ATRWEB_VAL_T_7, _T_8 ou _T_9\n"; exit(3); }
$ini = parse_ini_file($cnf, true, INI_SCANNER_RAW) ?: []; $c = $ini['client'] ?? [];
$tira = fn($v) => trim((string) $v, " \t\"'");
$dsn = 'mysql:' . (isset($c['socket']) ? 'unix_socket=' . $tira($c['socket']) : 'host=' . $tira($c['host'] ?? '127.0.0.1') . ';port=' . (int) ($c['port'] ?? 3306)) . ";dbname=$db;charset=utf8mb4";
try { $pdo = new PDO($dsn, $tira($c['user'] ?? ''), $tira($c['password'] ?? ''), [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]); }
catch (PDOException $e) { echo '[ERRO] vincular-p1-mysql: conexão recusada (código ' . $e->getCode() . ")\n"; exit(1); }
if ((string) $pdo->query('SELECT DATABASE()')->fetchColumn() !== $db) { echo "[RECUSADO] vincular-p1-mysql: a conexão não está em $db\n"; exit(3); }
if ((int) $pdo->query('SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE()')->fetchColumn() !== 0) { echo "[RECUSADO] vincular-p1-mysql: $db não está vazio\n"; exit(3); }
$arqs = array_values(array_filter(glob("$dir/[0-9][0-9][0-9]_*.sql") ?: [], static fn($f) => !str_ends_with($f, '.revert.sql'))); sort($arqs, SORT_STRING);
foreach ($arqs as $arq) foreach (preg_split('/;\s*\n/', (string) preg_replace('/^--.*$/m', '', (string) file_get_contents($arq))) ?: [] as $st) {
    $st = trim($st); if ($st === '') continue;
    if (!preg_match('/^(CREATE TABLE IF NOT EXISTS|ALTER TABLE|INSERT (IGNORE )?INTO|UPDATE) `eq_[a-z_]+`/i', $st)) { echo '[RECUSADO] vincular-p1-mysql: comando fora da lista em ' . basename($arq) . "\n"; exit(3); }
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

// ---- catálogo sintético: 550 e 158 (subcategoria com kit por escopo) + 900 (outra subcategoria) ------------------------------------------
$cat = new CatalogoMemoria();
foreach ([[158, 'CABLE'], [550, 'CABLE'], [900, 'OUTRO']] as [$id, $sub])
    $cat->p[$id] = ['id' => $id, 'nome' => "Produto $id (sintético)", 'categoria' => 'LED_PANEL', 'subcategoria' => $sub, 'ativo' => true, 'excluido' => false, 'sincronizado_em' => null];
$repo = new AtributosRepoPdo($pdo, '');
$A = ['id' => 1001, 'email' => 'admin@exemplo.invalid'];
$adm = new AtributosService($repo, 80, $A['email'], $cat);
$kits = new KitsService($repo, 80, $A['email'], $cat, null, $A['id']);
$opsA = new OperacoesGravacao($repo, $A['id'], $A['email']);
$massa = fn(array $b, string $chave) => $opsA->executar('massa_aplicar', $b + ['chave' => $chave, 'versao_previa' => $kits->previaMassa($b)['versao_previa']], null, fn(array $c) => $kits->aplicarMassa($c));
$avulsos = fn(int $aid) => (int) $um('SELECT COUNT(*) FROM eq_produto_atributo WHERE atributo_id = ?', [$aid]);
$audInc = fn(int $aid) => (int) $um("SELECT COUNT(*) FROM eq_auditoria WHERE entidade = 'produto_atributo' AND acao = 'incluir' AND entidade_id LIKE ?", ["%:$aid"]);

$pdo->exec('ALTER TABLE `eq_atributo` AUTO_INCREMENT = 27');
$a27 = (int) $adm->salvarAtributo(['rotulo' => 'Comprimento do cabo', 'tipo' => 'texto'])['atributo']['id'];
$ok('atributo de teste nasce com id 27', $a27 === 27, "id=$a27");
$aY = (int) $adm->salvarAtributo(['rotulo' => 'Blindagem', 'tipo' => 'texto'])['atributo']['id'];
$aZ = (int) $adm->salvarAtributo(['rotulo' => 'Conector', 'tipo' => 'texto'])['atributo']['id'];
$aW = (int) $adm->salvarAtributo(['rotulo' => 'Bitola', 'tipo' => 'texto'])['atributo']['id'];
$kid = (int) $kits->salvarKit(['nome' => 'Cabos (vincular v2)'])['kit']['id'];
$kits->definirItens(['id' => $kid, 'versao' => (int) $repo->grupo($kid)['versao'], 'itens' => [['atributo_id' => $a27, 'posicao' => 1, 'obrigatorio' => 0, 'visivel' => 1, 'destaque' => 0, 'importancia' => null, 'unidade_id' => null]]]);
$kits->definirEscopos(['id' => $kid, 'versao' => (int) $repo->grupo($kid)['versao'], 'escopos' => [['categoria' => 'LED_PANEL', 'subcategoria' => 'CABLE']]]);
$origens = function (int $pid, int $aid) use ($repo, $cat): ?array { $f = Aplicabilidade::ficha($repo->retratoModelo($pid), $cat->produto($pid)); return $f[$aid] ?? null; };
$ok('pré: 27 está na ficha de 550 e 158 SÓ pelo kit (sem avulso)', $origens(550, $a27) !== null && $origens(158, $a27) !== null && $avulsos($a27) === 0);

// ---- (a) 27 só pelo kit: prévia 0 novos e gravação 0 efeitos ----------------------------------------------------------------------------
$ped = ['produtos' => [550, 158], 'atributos_incluir' => [['atributo_id' => $a27]]];
$pv = $kits->previaMassa($ped);
$porP = array_column($pv['produtos'], null, 'product_id');
$ok('(a) prévia: 0 vínculos novos, 2 já aplicáveis, 0 atributos acrescentados', ($pv['resumo']['vinculos_novos'] ?? -1) === 0 && $pv['resumo']['ja_tinham'] === 2 && $pv['resumo']['atributos_acrescentados'] === 0 && $pv['resumo']['produtos_afetados'] === 0, json_encode($pv['resumo']));
$ok('(a) prévia por produto: entram [] e ja_aplicaveis [27] em 550 e 158', ($porP[550]['entram'] ?? null) === [] && ($porP[550]['ja_aplicaveis'] ?? null) === [$a27] && ($porP[158]['entram'] ?? null) === [] && ($porP[158]['ja_aplicaveis'] ?? null) === [$a27], json_encode($pv['produtos']));
$rA = null; $eA = $erro(function () use (&$rA, $massa, $ped) { $rA = $massa($ped, 'vinc-v2-a-0001'); });
$ok('(a) gravação: 0 inclusões, desfecho sem_mudanca, recibo sem campos gravados', $eA === null && ($rA['gravado']['inclusoes'] ?? -1) === 0 && array_sum($rA['gravado']) === 0 && ($rA['desfecho'] ?? null) === 'sem_mudanca'
    && ($rA['recibo']['desfecho'] ?? null) === 'sem_mudanca' && ($rA['recibo']['campos_gravados'] ?? null) === [], json_encode($rA) . ' ' . ($eA?->getMessage() ?? ''));
$ok('(a) guardado em eq_pedido_massa: resultado sem_mudanca com carimbo', fn() => ($g = json_decode((string) $um("SELECT resultado FROM eq_pedido_massa WHERE chave = 'vinc-v2-a-0001'"), true))['sem_mudanca'] === true && is_string($g['confirmado_em'] ?? null));
$ok('(a) persistido: NENHUMA linha em eq_produto_atributo para o 27 e nenhuma auditoria "incluir"', $avulsos($a27) === 0 && $audInc($a27) === 0);
$ok('(a) ficha continua: 27 em 550 e 158 pelo kit', $origens(550, $a27) !== null && $origens(158, $a27) !== null);
$cfA = $opsA->conferir('vinc-v2-a-0001');
$ok('(a) conferir a chave: sem_mudanca, recibo sem campos gravados', $cfA['resultado'] === 'sem_mudanca' && ($cfA['recibo']['desfecho'] ?? null) === 'sem_mudanca' && ($cfA['recibo']['campos_gravados'] ?? null) === [] && ($cfA['recibo']['gravado']['inclusoes'] ?? -1) === 0, json_encode($cfA));
$rA2 = $opsA->executar('massa_aplicar', $ped + ['chave' => 'vinc-v2-a-0001', 'versao_previa' => str_repeat('0', 64)], null, fn(array $c) => $kits->aplicarMassa($c));
$ok('(a) reenvio: repetido, desfecho sem_mudanca', ($rA2['repetido'] ?? false) === true && ($rA2['desfecho'] ?? null) === 'sem_mudanca', json_encode($rA2));
$tx = fn($r) => OperacoesGravacao::textoRecibo($r);
$ok('(a) 093 A: recibo da resposta = conferir = reenvio, byte a byte', isset($rA['recibo']) && $tx($rA['recibo']) === $tx($cfA['recibo']) && $tx($rA['recibo']) === $tx($rA2['recibo']), $tx($rA['recibo'] ?? []) . "\n       " . $tx($cfA['recibo'] ?? []) . "\n       " . $tx($rA2['recibo'] ?? []));

// ---- (a) misto: 27 (já aplicável) + Y (entra) em 550, 158, 900 — os números da prévia são os da gravação --------------------------------
$pedM = ['produtos' => [550, 158, 900], 'atributos_incluir' => [['atributo_id' => $a27], ['atributo_id' => $aY]]];
$pvM = $kits->previaMassa($pedM);
$ok('(a) misto prévia: 4 novos (Y nos 3 + 27 no 900), 2 já aplicáveis', $pvM['resumo']['vinculos_novos'] === 4 && $pvM['resumo']['ja_tinham'] === 2, json_encode($pvM['resumo']));
$rM = $massa($pedM, 'vinc-v2-m-0001');
$ok('(a) misto gravação = prévia: 4 inclusões, desfecho aplicada', ($rM['gravado']['inclusoes'] ?? -1) === $pvM['resumo']['vinculos_novos'] && $rM['desfecho'] === 'aplicada', json_encode($rM['gravado']));
$cfM = $opsA->conferir('vinc-v2-m-0001');
$ok('(a) misto: recibo aplicada com [vinculos]; conferir aplicada; resposta = conferir byte a byte', ($rM['recibo']['campos_gravados'] ?? null) === ['vinculos'] && $cfM['resultado'] === 'aplicada'
    && OperacoesGravacao::textoRecibo($rM['recibo']) === OperacoesGravacao::textoRecibo($cfM['recibo']), json_encode([$rM['recibo'] ?? null, $cfM['recibo'] ?? null]));
$ok('(a) misto persistido: avulso de 27 SÓ no 900; Y avulso nos 3', $avulsos($a27) === 1 && (int) $um('SELECT product_id FROM eq_produto_atributo WHERE atributo_id = ?', [$a27]) === 900 && $avulsos($aY) === 3);

// ---- (b) [id => null] de atributo desativado não passa mais -------------------------------------------------------------------------------
$repoV = (int) $repo->atributo($aW)['versao'];
$adm->definirAtivo($aW, false, $repoV, 'teste vincular v2');
$eB = $erro(fn() => $kits->previaMassa(['produtos' => [550], 'atributos_incluir' => [['atributo_id' => $aW]]]));
$ok('(b) prévia com atributo desativado ([id => null]) → 422 "O atributo foi desativado. Atualize a seleção."', $eB instanceof AtributosErro && $eB->http === 422 && $eB->getMessage() === 'O atributo foi desativado. Atualize a seleção.', $eB ? $eB->getMessage() : 'passou');

// ---- (b) desativado ENTRE a prévia e a confirmação (dentro da transação, depois do registro da chave) --------------------------------------
class StmtGanchoV2 extends PDOStatement
{
    public static ?Closure $aposRegistrar = null;
    protected function __construct() {}
    public function execute(?array $params = null): bool
    {
        $r = parent::execute($params);
        if (self::$aposRegistrar !== null && preg_match('/^INSERT INTO\s+`?eq_pedido_massa/', $this->queryString)) { $f = self::$aposRegistrar; self::$aposRegistrar = null; $f(); }
        return $r;
    }
}
$pdoG = new PDO($dsn, $tira($c['user'] ?? ''), $tira($c['password'] ?? ''), [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_STATEMENT_CLASS => [StmtGanchoV2::class, []]]);
$repoG = new AtributosRepoPdo($pdoG, '');
$kitsG = new KitsService($repoG, 80, $A['email'], $cat, null, $A['id']);
$opsG = new OperacoesGravacao($repoG, $A['id'], $A['email']);
$pedZ = ['produtos' => [550, 900], 'atributos_incluir' => [['atributo_id' => $aZ]]];
$vpZ = $kitsG->previaMassa($pedZ)['versao_previa'];
$disparou = false;
StmtGanchoV2::$aposRegistrar = function () use (&$disparou, $adm, $repo, $aZ): void { $disparou = true; $adm->definirAtivo($aZ, false, (int) $repo->atributo($aZ)['versao'], 'corrida vincular v2'); };   // outra conexão, COMMIT
$rZ = null; $eZ = $erro(function () use (&$rZ, $opsG, $kitsG, $pedZ, $vpZ) { $rZ = $opsG->executar('massa_aplicar', $pedZ + ['chave' => 'vinc-v2-z-0001', 'versao_previa' => $vpZ], null, fn(array $c) => $kitsG->aplicarMassa($c)); });
StmtGanchoV2::$aposRegistrar = null;
$ok('(b) corrida: a desativação aconteceu depois do registro da chave', $disparou && (int) $repo->atributo($aZ)['ativo'] === 0);
$ok('(b) corrida → 422 "O atributo foi desativado. Atualize a seleção." (desfecho recusada, sem recibo)', $rZ === null && $eZ instanceof AtributosErro && $eZ->http === 422 && $eZ->getMessage() === 'O atributo foi desativado. Atualize a seleção.' && ($eZ->meta['desfecho'] ?? null) === 'recusada', $eZ ? get_class($eZ) . ' ' . $eZ->getMessage() : json_encode($rZ));
$ok('(b) corrida persistido: 0 vínculos de Z, chave NÃO registrada (ROLLBACK), 0 auditoria', $avulsos($aZ) === 0 && (int) $um("SELECT COUNT(*) FROM eq_pedido_massa WHERE chave = 'vinc-v2-z-0001'") === 0 && $audInc($aZ) === 0);
$ok('(b) conferir a chave da corrida: nao_encontrada (nada gravado)', fn() => $opsA->conferir('vinc-v2-z-0001')['resultado'] === 'nao_encontrada');

// ---- (b) reenvio de operação já concluída devolve o recibo ORIGINAL, mesmo com o atributo desativado depois -----------------------------
$adm->definirAtivo($aY, false, (int) $repo->atributo($aY)['versao'], 'teste vincular v2');
$audM = (int) $um("SELECT COUNT(*) FROM eq_auditoria WHERE entidade = 'massa'");
$rR = null; $eR = $erro(function () use (&$rR, $opsA, $kits, $pedM) { $rR = $opsA->executar('massa_aplicar', $pedM + ['chave' => 'vinc-v2-m-0001', 'versao_previa' => str_repeat('0', 64)], null, fn(array $c) => $kits->aplicarMassa($c)); });
$ok('(b) reenvio (Y desativado depois): repetido + recibo com o resultado original (4 inclusões), sem efeito novo', $eR === null && ($rR['repetido'] ?? false) === true && ($rR['gravado']['inclusoes'] ?? -1) === 4 && isset($rR['recibo'])
    && $avulsos($aY) === 3 && (int) $um("SELECT COUNT(*) FROM eq_auditoria WHERE entidade = 'massa'") === $audM, json_encode($rR) . ' ' . ($eR?->getMessage() ?? ''));
$ok('(b) reenvio de lote aplicado: desfecho ORIGINAL aplicada e recibo = o da 1ª resposta, byte a byte', ($rR['desfecho'] ?? null) === 'aplicada' && OperacoesGravacao::textoRecibo($rR['recibo']) === OperacoesGravacao::textoRecibo($rM['recibo']), json_encode([$rR['recibo'] ?? null, $rM['recibo'] ?? null]));

// ---- (b) rota de UM produto (produto_atributo incluir): ativo conferido também dentro da transação ---------------------------------------
$vv = $kits->versaoVinculosAtual(158);
$eS = $erro(fn() => $kits->definirAjuste(['product_id' => 158, 'atributo_id' => $aZ, 'modo' => 'incluir', 'versao_vinculos' => $vv]));
$ok('(b) produto_atributo incluir com atributo desativado → 422, nada gravado', $eS instanceof AtributosErro && $eS->http === 422 && $avulsos($aZ) === 0, $eS ? $eS->getMessage() : 'gravou');

// ---- (c) DSHOW-096 (Codex P1): PLANO determinístico — kit de ORIGEM INDIRETA (por escopo) muda entre a prévia e a confirmação ---------------
// Produto 900 (LED_PANEL/OUTRO). Kit K3 vale para ele SÓ por escopo (origem indireta: não está no pedido nem ligado direto ao produto).
$novoAtr = fn(string $r) => (int) $adm->salvarAtributo(['rotulo' => $r, 'tipo' => 'texto'])['atributo']['id'];
[$aX, $aX2, $aX3, $aX4, $aX5, $aU] = [$novoAtr('096 X'), $novoAtr('096 X2'), $novoAtr('096 X3'), $novoAtr('096 X4'), $novoAtr('096 X5'), $novoAtr('096 sem relação')];
$itens = fn(KitsService $ks, AtributosRepoPdo $rp, int $k, array $aids) => $ks->definirItens(['id' => $k, 'versao' => (int) $rp->grupo($k)['versao'],
    'itens' => array_map(fn($a, $i) => ['atributo_id' => $a, 'posicao' => $i + 1, 'obrigatorio' => 0, 'visivel' => 1, 'destaque' => 0, 'importancia' => null, 'unidade_id' => null], $aids, array_keys($aids))]);
$k3 = (int) $kits->salvarKit(['nome' => 'Painéis OUTRO (096)'])['kit']['id'];
$itens($kits, $repo, $k3, [$aX]);
$kits->definirEscopos(['id' => $k3, 'versao' => (int) $repo->grupo($k3)['versao'], 'escopos' => [['categoria' => 'LED_PANEL', 'subcategoria' => 'OUTRO']]]);
$o = $origens(900, $aX);
$ok('(c) pré: X na ficha de 900 SÓ pelo K3, por escopo (origem indireta), sem avulso', $o !== null && count($o['origens']) === 1 && ($o['origens'][0]['grupo_id'] ?? 0) === $k3 && ($o['origens'][0]['motivos'][0]['tipo'] ?? '') === 'escopo' && $avulsos($aX) === 0, json_encode($o['origens'] ?? null));
$chaveNaMassa = fn(string $ch) => (int) $um('SELECT COUNT(*) FROM eq_pedido_massa WHERE chave = ?', [$ch]);
$aplicar = function (array $ped, string $vp, string $ch, ?OperacoesGravacao $ops = null, ?KitsService $ks = null) use ($opsA, $kits, $erro): array {
    $r = null; $e = $erro(function () use (&$r, $ped, $vp, $ch, $ops, $ks, $opsA, $kits) { $ks ??= $kits; $r = ($ops ?? $opsA)->executar('massa_aplicar', $ped + ['chave' => $ch, 'versao_previa' => $vp], null, fn(array $c) => $ks->aplicarMassa($c)); });
    return [$r, $e];
};
$e409 = fn(?Throwable $e) => $e instanceof AtributosErro && $e->http === 409 && ($e->meta['desfecho'] ?? null) === 'conflito';

// c1: prévia diz sem_mudanca (X pelo K3); X sai do K3; confirmação → 409, nada gravado
$pedX = ['produtos' => [900], 'atributos_incluir' => [['atributo_id' => $aX]]];
$pv = $kits->previaMassa($pedX); $l = $pv['produtos'][0];
$ok('(c1) prévia: X já aplicável (entram []), efeito sem_mudanca, K3 entre os kits de origem', $l['entram'] === [] && $l['ja_aplicaveis'] === [$aX] && in_array(['atributo_id' => $aX, 'efeito' => 'sem_mudanca'], $l['efeitos'] ?? [], true) && in_array($k3, $l['kits_origem'] ?? [], true), json_encode($l));
$itens($kits, $repo, $k3, []);   // X sai do K3 entre a prévia e a confirmação
[$r, $e] = $aplicar($pedX, $pv['versao_previa'], 'v096-c1-0001');
$ok('(c1) confirmação depois de X sair do K3 → 409 conflito (sem resposta de sucesso)', $r === null && $e409($e), $e ? get_class($e) . ' ' . $e->getMessage() . ' ' . json_encode($e->meta ?? null) : json_encode($r));
$ok('(c1) nada gravado: 0 avulso de X, 0 auditoria de inclusão, chave fora de eq_pedido_massa', $avulsos($aX) === 0 && $audInc($aX) === 0 && $chaveNaMassa('v096-c1-0001') === 0);
$cf = $opsA->conferir('v096-c1-0001');
$ok('(c1) conferir: sem recibo de sucesso', !in_array($cf['resultado'], ['aplicada', 'sem_mudanca'], true) && ($cf['recibo'] ?? null) === null, json_encode($cf));
$pv = $kits->previaMassa($pedX);
[$r, $e] = $aplicar($pedX, $pv['versao_previa'], 'v096-c1-0002');
$ok('(c1) controle: prévia NOVA mostra X entrando e a gravação faz exatamente isso (1 avulso, aplicada)', $pv['produtos'][0]['entram'] === [$aX] && $e === null && ($r['gravado']['inclusoes'] ?? -1) === 1 && ($r['desfecho'] ?? '') === 'aplicada' && $avulsos($aX) === 1 && $audInc($aX) === 1, json_encode([$pv['produtos'][0], $r]) . ' ' . ($e?->getMessage() ?? ''));

// c2 (o inverso): prévia diz incluir (X2 ausente); X2 entra no K3; confirmação → 409, nenhum avulso
$pedX2 = ['produtos' => [900], 'atributos_incluir' => [['atributo_id' => $aX2]]];
$pv = $kits->previaMassa($pedX2);
$ok('(c2) prévia: X2 entra (efeito incluir)', $pv['produtos'][0]['entram'] === [$aX2] && in_array(['atributo_id' => $aX2, 'efeito' => 'incluir'], $pv['produtos'][0]['efeitos'] ?? [], true), json_encode($pv['produtos'][0]));
$itens($kits, $repo, $k3, [$aX2]);   // X2 passa a vir do K3
[$r, $e] = $aplicar($pedX2, $pv['versao_previa'], 'v096-c2-0001');
$ok('(c2) confirmação depois de X2 entrar no K3 → 409; 0 avulso, 0 auditoria, chave fora', $r === null && $e409($e) && $avulsos($aX2) === 0 && $audInc($aX2) === 0 && $chaveNaMassa('v096-c2-0001') === 0, $e ? $e->getMessage() : json_encode($r));
$pv = $kits->previaMassa($pedX2);
[$r, $e] = $aplicar($pedX2, $pv['versao_previa'], 'v096-c2-0002');
$ok('(c2) controle: prévia nova = sem_mudanca e a gravação também (0 efeitos, 0 avulso)', $pv['produtos'][0]['entram'] === [] && $e === null && ($r['desfecho'] ?? '') === 'sem_mudanca' && $avulsos($aX2) === 0, json_encode($r) . ' ' . ($e?->getMessage() ?? ''));

// c3 controle: kit que NÃO é origem do 900 (Cabos, escopo CABLE) muda entre a prévia e a confirmação → aplica normalmente (sem 409 falso)
$pedU = ['produtos' => [900], 'atributos_incluir' => [['atributo_id' => $aU]]];
$pv = $kits->previaMassa($pedU);
$ok('(c3) Cabos não é kit de origem do 900', !in_array($kid, $pv['produtos'][0]['kits_origem'] ?? [$kid], true), json_encode($pv['produtos'][0]['kits_origem']));
$itens($kits, $repo, $kid, [$a27, $aU]);
[$r, $e] = $aplicar($pedU, $pv['versao_previa'], 'v096-c3-0001');
$ok('(c3) mudança num kit sem relação com o produto não invalida a prévia: aplicada, 1 avulso', $e === null && ($r['desfecho'] ?? '') === 'aplicada' && $avulsos($aU) === 1, $e ? $e->getMessage() : json_encode($r));

// c4: corrida DENTRO da transação — o K3 muda (outra conexão, COMMIT) depois do registro da chave e antes das travas → 409, nada gravado
$pedX3 = ['produtos' => [900], 'atributos_incluir' => [['atributo_id' => $aX3]]];
$pv = $kitsG->previaMassa($pedX3);
$disparou = false;
StmtGanchoV2::$aposRegistrar = function () use (&$disparou, $itens, $kits, $repo, $k3, $aX2, $aX3): void { $disparou = true; $itens($kits, $repo, $k3, [$aX2, $aX3]); };
[$r, $e] = $aplicar($pedX3, $pv['versao_previa'], 'v096-c4-0001', $opsG, $kitsG);
StmtGanchoV2::$aposRegistrar = null;
$ok('(c4) corrida: K3 mudou depois do registro da chave → 409; 0 avulso de X3, chave fora (ROLLBACK)', $disparou && $r === null && $e409($e) && $avulsos($aX3) === 0 && $audInc($aX3) === 0 && $chaveNaMassa('v096-c4-0001') === 0, $e ? $e->getMessage() : json_encode($r));

// c5: SOB TRAVA — depois do FOR SHARE dos kits, outra conexão NÃO consegue mudar o K3 (espera e desiste em 1 s); a massa termina conforme a prévia
class StmtGanchoV3 extends PDOStatement
{
    public static ?Closure $aposTravarKits = null;
    protected function __construct() {}
    public function execute(?array $params = null): bool
    {
        $r = parent::execute($params);
        if (self::$aposTravarKits !== null && preg_match('/FROM\s+`?eq_grupo`?\s+ORDER BY id FOR SHARE/', $this->queryString)) { $f = self::$aposTravarKits; self::$aposTravarKits = null; $f(); }
        return $r;
    }
}
$pdoT = new PDO($dsn, $tira($c['user'] ?? ''), $tira($c['password'] ?? ''), [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_STATEMENT_CLASS => [StmtGanchoV3::class, []]]);
$repoT = new AtributosRepoPdo($pdoT, ''); $kitsT = new KitsService($repoT, 80, $A['email'], $cat, null, $A['id']); $opsT = new OperacoesGravacao($repoT, $A['id'], $A['email']);
$pdo2 = new PDO($dsn, $tira($c['user'] ?? ''), $tira($c['password'] ?? ''), [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]); $pdo2->exec('SET SESSION innodb_lock_wait_timeout = 1');
$repo2 = new AtributosRepoPdo($pdo2, ''); $kits2 = new KitsService($repo2, 80, $A['email'], $cat, null, $A['id']);
$pedX4 = ['produtos' => [900], 'atributos_incluir' => [['atributo_id' => $aX4]]];
$pv = $kitsT->previaMassa($pedX4); $vK3 = (int) $repo->grupo($k3)['versao'];
$bloqueou = null;
StmtGanchoV3::$aposTravarKits = function () use (&$bloqueou, $itens, $kits2, $repo2, $k3, $aX4, $erro): void { $bloqueou = $erro(fn() => $itens($kits2, $repo2, $k3, [$aX4])); };
[$r, $e] = $aplicar($pedX4, $pv['versao_previa'], 'v096-c5-0001', $opsT, $kitsT);
StmtGanchoV3::$aposTravarKits = null;
$ok('(c5) com os kits travados, a edição do K3 por outra conexão espera e desiste (lock wait timeout)', $bloqueou instanceof Throwable && (str_contains($bloqueou->getMessage(), '1205') || $bloqueou->getMessage() === 'Outra gravação simultânea neste atributo. Recarregue e tente de novo.'), $bloqueou ? $bloqueou->getMessage() : 'a edição passou durante a massa');
$ok('(c5) a massa termina conforme a prévia (1 avulso de X4) e o K3 continua na mesma versão', $e === null && ($r['desfecho'] ?? '') === 'aplicada' && $avulsos($aX4) === 1 && (int) $repo->grupo($k3)['versao'] === $vK3, $e ? $e->getMessage() : json_encode($r));

// c6: clique duplo — a mesma chave duas vezes = um efeito e o mesmo recibo; chave nova com a prévia velha = 409, sem duplicar
$pedX5 = ['produtos' => [900], 'atributos_incluir' => [['atributo_id' => $aX5]]];
$pv = $kits->previaMassa($pedX5);
[$r1, $e1] = $aplicar($pedX5, $pv['versao_previa'], 'v096-c6-0001');
[$r2, $e2] = $aplicar($pedX5, $pv['versao_previa'], 'v096-c6-0001');
$ok('(c6) clique duplo (mesma chave): 1ª aplicada, 2ª repetido com o MESMO recibo byte a byte; 1 avulso, 1 auditoria', $e1 === null && $e2 === null && ($r1['desfecho'] ?? '') === 'aplicada' && ($r2['repetido'] ?? false) === true
    && OperacoesGravacao::textoRecibo($r1['recibo']) === OperacoesGravacao::textoRecibo($r2['recibo']) && $avulsos($aX5) === 1 && $audInc($aX5) === 1, json_encode([$r1['recibo'] ?? null, $r2['recibo'] ?? null]) . ' ' . ($e1?->getMessage() ?? '') . ($e2?->getMessage() ?? ''));
[$r3, $e3] = $aplicar($pedX5, $pv['versao_previa'], 'v096-c6-0002');
$ok('(c6) chave NOVA com a prévia já usada → 409; continua 1 avulso e 1 auditoria', $r3 === null && $e409($e3) && $avulsos($aX5) === 1 && $audInc($aX5) === 1 && $chaveNaMassa('v096-c6-0002') === 0, $e3 ? $e3->getMessage() : json_encode($r3));

// c7 (DSHOW-099 aceite 5): a ROTA INDIVIDUAL (produto_atributo incluir) continua criando o avulso mesmo com o atributo já vindo de um kit —
// a regra "já aplicável = sem mudança" é só da MASSA. X2 vem do K3 (escopo) para o 900.
$o7 = $origens(900, $aX2);
$ok('(c7) pré: X2 na ficha do 900 pelo K3, sem avulso', $o7 !== null && $avulsos($aX2) === 0, json_encode($o7['origens'] ?? null));
$r7 = $kits->definirAjuste(['product_id' => 900, 'atributo_id' => $aX2, 'modo' => 'incluir', 'versao_vinculos' => $kits->versaoVinculosAtual(900)]);
$ok('(c7) rota individual: avulso criado (mudou), 1 auditoria de inclusão, origem kit + avulso', ($r7['mudou'] ?? false) === true && $avulsos($aX2) === 1 && $audInc($aX2) === 1
    && count(array_filter($origens(900, $aX2)['origens'] ?? [], fn($x) => ($x['tipo'] ?? '') === 'avulso')) === 1, json_encode($r7));

// c8 (DSHOW-056 no sentido INVERSO): prévia com EXCLUSÃO, confirmação direta com INCLUSÃO do mesmo atributo → 409, nada muda
$aI8 = $novoAtr('096 X8'); $pedEx = ['produtos' => [900], 'atributos_excluir' => [['atributo_id' => $aI8, 'motivo' => 'teste 056 inverso']]];
$vEx = $kits->previaMassa($pedEx)['versao_previa'];
[$r8, $e8] = $aplicar(['produtos' => [900], 'atributos_incluir' => [['atributo_id' => $aI8]]], $vEx, 'v096-c8-0001');
$ok('(c8) DSHOW-056 inverso: prévia de EXCLUSÃO, confirmação com INCLUSÃO → 409; 0 avulso, chave fora', $r8 === null && $e409($e8) && $avulsos($aI8) === 0 && $chaveNaMassa('v096-c8-0001') === 0, $e8 ? $e8->getMessage() : json_encode($r8));
// e o sentido direto, no mesmo arquivo: prévia de INCLUSÃO, confirmação com EXCLUSÃO → 409
$vIn = $kits->previaMassa(['produtos' => [900], 'atributos_incluir' => [['atributo_id' => $aI8]]])['versao_previa'];
[$r9, $e9] = $aplicar($pedEx, $vIn, 'v096-c8-0002');
$ok('(c8) DSHOW-056 direto: prévia de INCLUSÃO, confirmação com EXCLUSÃO → 409; nada gravado', $r9 === null && $e409($e9) && (int) $um('SELECT COUNT(*) FROM eq_produto_atributo WHERE atributo_id = ?', [$aI8]) === 0 && $chaveNaMassa('v096-c8-0002') === 0, $e9 ? $e9->getMessage() : json_encode($r9));

echo ($falhas ? '[ERRO]' : '[OK]  ') . " vincular-p1-mysql (prévia × gravação 550/158/27, atributo desativado, reenvio, DSHOW-096 plano/origem indireta/trava/clique duplo): $n casos, $falhas falha(s)\n";
exit($falhas ? 1 : 0);
