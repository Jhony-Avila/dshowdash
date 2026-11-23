<?php
// FILHO do sugestoes-c-antigo.php: roda o CÓDIGO ANTERIOR (SUGC_ANTIGO) sobre a base preparada pelo pai e imprime "FILHO_JSON {...}".
// Nunca é chamado sozinho; não prepara nada além de um kit para o aceitar (o código antigo exige o atributo na ficha).
declare(strict_types=1);
$antigo = (string) getenv('SUGC_ANTIGO'); $cnf = (string) getenv('EQ_TEST_CNF'); $db = (string) getenv('EQ_TEST_DB');
$ids = json_decode((string) getenv('SUGC_IDS'), true);
if ($antigo === '' || !in_array($db, ['ATRWEB_VAL_T_7', 'ATRWEB_VAL_T_8', 'ATRWEB_VAL_T_9'], true) || !is_array($ids)) { echo "filho: entradas inválidas\n"; exit(3); }
require_once "$antigo/api/atributos/AtributosRepo.php";
require_once "$antigo/api/atributos/KitsService.php";
require_once "$antigo/api/atributos/SugestoesService.php";
require_once "$antigo/api/atributos/ProdutosLeitura.php";
require_once "$antigo/api/atributos/LeituraVitrinePdo.php";
require_once "$antigo/tools/equipamentos/cargas.php";
require_once "$antigo/scripts/atributos/testes/_memoria.php";
if (interface_exists('SugestoesDecisoes')) { echo "filho: carregou o código NOVO por engano\n"; exit(3); }
$c = (parse_ini_file($cnf, true, INI_SCANNER_RAW) ?: [])['client'] ?? [];
$tira = fn($v) => trim((string) $v, " \t\"'");
$pdo = new PDO('mysql:' . (isset($c['socket']) ? 'unix_socket=' . $tira($c['socket']) : 'host=' . $tira($c['host'] ?? '127.0.0.1') . ';port=' . (int) ($c['port'] ?? 3306)) . ";dbname=$db;charset=utf8mb4",
    $tira($c['user'] ?? ''), $tira($c['password'] ?? ''), [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
$cat = new CatalogoMemoria(); $cat->p = [];
foreach ([201, 202, 203, 204] as $pid) $cat->p[$pid] = ['id' => $pid, 'nome' => 'Módulo P.2.5 Indoor 320mm x 160mm 3840Hz', 'categoria' => 'LED_PANEL', 'subcategoria' => 'LED_MODULE', 'ativo' => true, 'excluido' => false, 'sincronizado_em' => null];
$repo = new AtributosRepoPdo($pdo, '');
$email = 'antigo@exemplo.invalid';
$kits = new KitsService($repo, 80, $email, $cat, true, 2001);
$k = $kits->salvarKit(['nome' => 'Todos (antigo)', 'aplica_a_todos' => 1])['kit'];
$kits->definirItens(['id' => $k['id'], 'versao' => $k['versao'], 'itens' => [['atributo_id' => (int) $ids['P'], 'posicao' => 1], ['atributo_id' => (int) $ids['TL'], 'posicao' => 2]]]);
$adm = new AtributosService($repo, 80, $email, $cat);
$sug = new SugestoesService($repo, $adm, $kits, 80, $email);
$out = [];
$leit = new ProdutosLeitura(new LeituraVitrinePdo($pdo, $db, $db), $repo, 80, null, true, true);
$out['fila_nome'] = array_values(array_map(static fn($x) => (int) $x['id'], array_filter($leit->conferencia()['filas']['nome'], static fn($x) => (int) $x['atributo_id'] === (int) $ids['P'])));
$v = (int) $pdo->query('SELECT versao FROM eq_sugestao WHERE id = ' . (int) $ids['ign203'])->fetchColumn();
$out['decidir_ignorada'] = !empty($sug->decidir(['id' => (int) $ids['ign203'], 'versao' => $v, 'decisao' => 'recusar'])['sem_mudanca']) ? 'sem_mudanca' : 'mudou';
$l = $sug->aceitarLote(['ids' => [(int) $ids['ign203'], (int) $ids['sub204']], 'confirmar' => true]);
$out['lote_aceitas'] = $l['aceitas']; $out['lote_motivos'] = array_column($l['ignoradas'], 'motivo');
$v = (int) $pdo->query('SELECT versao FROM eq_sugestao WHERE id = ' . (int) $ids['suc201'])->fetchColumn();
$out['aceitar_sucessora'] = $sug->decidir(['id' => (int) $ids['suc201'], 'versao' => $v, 'decisao' => 'aceitar'])['decisao'] ?? null;
$cargas = new Cargas($pdo, $db, false, static fn() => null);
$out['c6_1'] = array_intersect_key($cargas->c6(), array_flip(['sugestoes', 'ja_existiam', 'revistas']));
$out['n_depois_c6_1'] = (int) $pdo->query('SELECT COUNT(*) FROM eq_sugestao')->fetchColumn();
$out['c6_2'] = array_intersect_key($cargas->c6(), array_flip(['sugestoes', 'ja_existiam', 'revistas']));
$out['n_depois_c6_2'] = (int) $pdo->query('SELECT COUNT(*) FROM eq_sugestao')->fetchColumn();
echo 'FILHO_JSON ' . json_encode($out) . "\n";
