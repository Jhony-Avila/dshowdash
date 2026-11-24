<?php
declare(strict_types=1);
// scripts/bling-ausencia-teste.php — "ausência ≠ zero" nos pedidos e compras do Bling (ACIMA_DIREITA, 24/11/2026; decisão do Jhony: opção B).
//
//     BLING_TESTE_CNF=<arquivo de opções do MySQL de VALIDAÇÃO> BLING_TESTE_DB=ATRWEB_VAL_T_<n> php scripts/bling-ausencia-teste.php
//
// Prova: subtotal, custo, itens, unidades e TODA margem/lucro derivada do custo do pedido chegam como null (nunca 0) quando desconhecidos;
// a coluna itens_lidos_em (migração 20261124, só ADD) só é carimbada por coleção COMPLETA (detalhe); sem a coluna, tudo é desconhecido; o
// provedor de demonstração (mock) não muda. Os endpoints que encerram com exit rodam num SUBPROCESSO com o _init.php real e o BlingReal na T_13.
// SEGURANÇA (molde do bling-itens-ausentes-teste.php): só num banco ^ATRWEB_VAL_T_[0-9]+$; recusa se já houver tabela bling_*; cria só as
// tabelas do DDL oficial e as remove no fim, mesmo em falha. Segredos SINTÉTICOS; Bling = transporte FALSO (nenhuma rede). Temporário próprio
// em /srv/dshow-work (mktemp conferido), removido no fim.

$raiz = dirname(__DIR__);
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
define('BLING_ENTRADA', true);
foreach (['lib/BlingSituacoes', 'lib/BlingProviderBase', 'lib/BlingCrypto', 'lib/BlingTransporte', 'lib/BlingOAuth', 'lib/BlingVersionAdapter',
          'lib/BlingNormalizer', 'repositories/BlingRepository', 'lib/BlingClient', 'lib/BlingReal', 'services/BlingAuthService',
          'services/BlingSyncService'] as $f) {
    require_once $raiz . '/api/bling/' . $f . '.php';
}
$cnf = (string) getenv('BLING_TESTE_CNF'); $db = (string) getenv('BLING_TESTE_DB');
if ($cnf === '' || !is_file($cnf) || !preg_match('/^ATRWEB_VAL_T_[0-9]+$/', $db)) { fwrite(STDERR, "[ERRO] defina BLING_TESTE_CNF e BLING_TESTE_DB=ATRWEB_VAL_T_<n> — ABORTADO\n"); exit(2); }
function conectar(string $cnf, string $db): PDO
{
    $cli = []; $sec = '';
    foreach (preg_split('/\r?\n/', (string) file_get_contents($cnf)) as $l) {
        $l = trim($l);
        if ($l === '' || $l[0] === '#' || $l[0] === ';') { continue; }
        if (preg_match('/^\[(.+)\]$/', $l, $m)) { $sec = trim($m[1]); continue; }
        if ($sec !== 'client' || !str_contains($l, '=')) { continue; }
        [$k, $v] = explode('=', $l, 2); $cli[trim($k)] = trim(trim($v), "\"'");
    }
    $dsn = isset($cli['socket']) ? 'mysql:unix_socket=' . $cli['socket'] : 'mysql:host=' . ($cli['host'] ?? '127.0.0.1') . ';port=' . (int) ($cli['port'] ?? 3306);
    $pdo = new PDO($dsn . ';dbname=' . $db . ';charset=utf8mb4', $cli['user'] ?? '', $cli['password'] ?? '', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]);
    if ((string) $pdo->query('SELECT DATABASE()')->fetchColumn() !== $db) { fwrite(STDERR, "[ERRO] banco conectado difere — ABORTADO\n"); exit(2); }
    return $pdo;
}
$pdo = conectar($cnf, $db);
if ((int) $pdo->query("SELECT COUNT(*) FROM information_schema.TABLES WHERE table_schema = DATABASE() AND table_name LIKE 'bling\\_%'")->fetchColumn() > 0) {
    fwrite(STDERR, "[ERRO] $db já tem tabela(s) bling_* — não mexo no que não criei. ABORTADO\n"); exit(2);
}
$ENV_SINT = ['BLING_CRYPTO_KEY' => str_repeat('5e', 32), 'BLING_CLIENT_ID' => 'teste-sintetico-client', 'BLING_CLIENT_SECRET' => 'teste-sintetico-secret',
             'BLING_REDIRECT_URI' => 'https://exemplo.invalid/api/bling/oauth/callback'];
foreach ($ENV_SINT as $k => $v) { putenv("$k=$v"); $_ENV[$k] = $v; }
BlingClient::$dormirParaTeste = static function (int $ms): void {};

$ddl = (string) file_get_contents($raiz . '/docs/BLING/02-banco-BLING.sql');
preg_match_all('/CREATE TABLE IF NOT EXISTS (bling_[a-z_]+) \(/', $ddl, $mm);
$TABELAS = array_values(array_unique($mm[1]));
$criadas = []; $falhas = 0; $total = 0;
function ok(string $nome, bool $cond, string $det = ''): void { global $falhas, $total; $total++; if (!$cond) { $falhas++; } echo ($cond ? 'ok    ' : 'FALHA ') . $nome . ($det !== '' ? "  ($det)" : '') . "\n"; }
function v(PDO $p, string $sql, array $a = []): mixed { $s = $p->prepare($sql); $s->execute($a); return $s->fetchColumn(); }

function pedido(int $i, bool $comItens, array $extra = []): array {
    $p = ['id' => 900000 + $i, 'numero' => (string) (21000 + $i), 'data' => gmdate('Y-m-d', strtotime('-2 days')), 'situacao' => ['id' => 9, 'valor' => 9],
          'loja' => ['id' => 205001], 'contato' => ['id' => 1], 'total' => 1280.06, 'totalProdutos' => 1234.56, 'desconto' => ['valor' => 10],
          'transporte' => ['frete' => 55.5]];
    $p = $extra + $p;
    if ($comItens) {
        $p['itens'] = [['id' => 7000 + $i * 10 + 1, 'codigo' => 'SKU-A', 'descricao' => 'Painel', 'quantidade' => 2, 'valor' => 500.00, 'produto' => ['id' => 31]],
                       ['id' => 7000 + $i * 10 + 2, 'codigo' => 'SKU-B', 'descricao' => 'Cabo', 'quantidade' => 1, 'valor' => 234.56, 'produto' => ['id' => 32]]];
    }
    return $p;
}
function compra(int $i, bool $comItens): array {
    $c = ['id' => 800000 + $i, 'numero' => (string) (5000 + $i), 'data' => gmdate('Y-m-d', strtotime('-2 days')), 'situacao' => ['valor' => 0], 'fornecedor' => ['id' => 2], 'total' => 300];
    if ($comItens) { $c['itens'] = [['codigo' => 'SKU-C', 'descricao' => 'Fonte', 'quantidade' => 3, 'valor' => 100, 'produto' => ['id' => 33]]]; }
    return $c;
}
$VENDAS = []; $COMPRAS = [];
$pagina = static function (array $todos, string $url): BlingResposta {
    parse_str((string) parse_url($url, PHP_URL_QUERY), $q);
    $p = (int) ($q['pagina'] ?? 1); $l = (int) ($q['limite'] ?? 100);
    return new BlingResposta(200, ['data' => array_slice($todos, ($p - 1) * $l, $l)]);
};
/** pedido como a API o entrega (BlingReal novo a cada chamada: nada de cache entre mudanças no banco) */
$real = static fn() => new BlingReal(new BlingRepository($pdo));
$pedidoApi = static function (string $blingId) use ($real): ?array {
    foreach ($real()->colecao('pedidos') as $p) { if ((string) $p['bling_id'] === $blingId) { return $p; } }
    return null;
};
$F = ['de' => gmdate('Y-m-d', strtotime('-29 days')), 'ate' => gmdate('Y-m-d'), 'granularidade' => 'dia', 'periodo' => '30d'];
$kpi = static fn(array $kpis, string $id): ?array => array_values(array_filter($kpis, static fn($k) => $k['id'] === $id))[0] ?? null;

$TMP = trim((string) shell_exec('mktemp -d /srv/dshow-work/bling-ausencia-teste.XXXXXX'));
if (!preg_match('#^/srv/dshow-work/bling-ausencia-teste\.[A-Za-z0-9]{6}$#', $TMP) || !is_dir($TMP)) { fwrite(STDERR, "[ERRO] mktemp falhou — ABORTADO\n"); exit(2); }
// subprocesso: _init.php REAL + BlingReal na T_13 injetado no BlingProvider; chama UM endpoint e imprime a resposta (o endpoint encerra com exit)
file_put_contents("$TMP/endpoint.php", <<<'PHP'
<?php
declare(strict_types=1);
[$_, $raiz, $classe, $metodo, $getJson] = $argv; $arg = $argv[5] ?? null;
define('BLING_ENTRADA', true);
$_SERVER['REQUEST_METHOD'] = 'GET';
// sem o _init.php inteiro: ele carrega CORS e autenticação (UARPSGate exige config/ local do Dash, que este servidor não tem e não precisa
// para estes endpoints). Carrega as classes do módulo e as funções bling_* REAIS extraídas do próprio _init.php (o código testado é o de produção).
require_once $raiz . '/api/_helpers/ApiResponse.php';
foreach (['lib/BlingSituacoes', 'lib/BlingProviderBase', 'lib/BlingMock', 'lib/BlingCrypto', 'lib/BlingTransporte', 'lib/BlingOAuth',
          'lib/BlingVersionAdapter', 'lib/BlingNormalizer', 'repositories/BlingRepository', 'lib/BlingClient', 'lib/BlingReal',
          'services/BlingAuthService', 'services/BlingSyncService', 'lib/BlingProvider', 'controllers/OverviewController',
          'controllers/ResourceController', 'controllers/AnalyticsController', 'controllers/HistoryController'] as $f) {
    require_once $raiz . '/api/bling/' . $f . '.php';
}
preg_match_all('/^function bling_\w+\(.*?^\}/ms', (string) file_get_contents($raiz . '/api/bling/_init.php'), $fn);
if (count($fn[0]) < 5) { fwrite(STDERR, "funções bling_* não encontradas no _init.php\n"); exit(9); }
foreach ($fn[0] as $codigo) { eval($codigo); }
$cli = []; $sec = '';
foreach (preg_split('/\r?\n/', (string) file_get_contents((string) getenv('BLING_TESTE_CNF'))) as $l) {
    $l = trim($l); if ($l === '' || $l[0] === '#' || $l[0] === ';') { continue; }
    if (preg_match('/^\[(.+)\]$/', $l, $m)) { $sec = trim($m[1]); continue; }
    if ($sec !== 'client' || !str_contains($l, '=')) { continue; }
    [$k, $v] = explode('=', $l, 2); $cli[trim($k)] = trim(trim($v), "\"'");
}
$dsn = isset($cli['socket']) ? 'mysql:unix_socket=' . $cli['socket'] : 'mysql:host=' . ($cli['host'] ?? '127.0.0.1') . ';port=' . (int) ($cli['port'] ?? 3306);
$pdo = new PDO($dsn . ';dbname=' . getenv('BLING_TESTE_DB') . ';charset=utf8mb4', $cli['user'] ?? '', $cli['password'] ?? '', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]);
unset($cli);
$r = new ReflectionProperty(BlingProvider::class, 'instancia');
$r->setValue(null, getenv('PROVEDOR') === 'mock' ? new BlingMockProvider() : new BlingReal(new BlingRepository($pdo)));
$_GET = json_decode($getJson, true);
$arg === null ? [$classe, $metodo]() : [$classe, $metodo]($arg);
PHP);
$endpoint = static function (string $classe, string $metodo, array $get = [], string $provedor = 'real', ?string $arg = null) use ($raiz, $TMP, $cnf, $db): array {
    $cmd = 'PROVEDOR=' . escapeshellarg($provedor) . ' BLING_TESTE_CNF=' . escapeshellarg($cnf) . ' BLING_TESTE_DB=' . escapeshellarg($db) . ' '
         . escapeshellarg(PHP_BINARY) . ' ' . escapeshellarg("$TMP/endpoint.php") . ' ' . escapeshellarg($raiz) . ' ' . escapeshellarg($classe) . ' '
         . escapeshellarg($metodo) . ' ' . escapeshellarg(json_encode($get + ['periodo' => '30d'])) . ($arg === null ? '' : ' ' . escapeshellarg($arg)) . ' 2>/dev/null';
    $out = []; exec($cmd, $out, $rc);
    $txt = implode("\n", $out); $j = json_decode((string) substr($txt, (int) strpos($txt, '{"ok"')), true);
    return [$rc, is_array($j) ? ($j['data'] ?? null) : null, $txt];
};

// MODO EXEMPLOS (opcional, para a CIMA): BLING_AUSENCIA_EXEMPLOS=<pasta existente> grava as respostas CRUAS dos endpoints (envelope {ok,data,meta})
// nos dois estados. Só escreve dentro dessa pasta (conferida); dados 100 % sintéticos.
$EXDIR = (string) getenv('BLING_AUSENCIA_EXEMPLOS');
if ($EXDIR !== '' && (!is_dir($EXDIR) || realpath($EXDIR) !== rtrim($EXDIR, '/') || !preg_match('#^/srv/dshow-modularizacao/app/[^.]+/exemplos-api$#', $EXDIR))) {
    fwrite(STDERR, "[ERRO] BLING_AUSENCIA_EXEMPLOS precisa ser uma pasta …/exemplos-api existente em /srv/dshow-modularizacao/app — ABORTADO\n"); exit(2);
}
$exemplos = static function (string $estado) use ($EXDIR, $raiz, $TMP, $cnf, $db): void {
    if ($EXDIR === '') { return; }
    $chamadas = [
        'overview'           => ['OverviewController', 'overview', [], null],
        'evolucao'           => ['OverviewController', 'evolucao', [], null],
        'pedidos-venda'      => ['ResourceController', 'listar', [], 'sales-orders'],
        'vendas-dia-canal'   => ['ResourceController', 'listar', [], 'sales'],
        'canais'             => ['ResourceController', 'listar', [], 'channels'],
        'vendedores'         => ['ResourceController', 'listar', [], 'sellers'],
        'pedidos-compra'     => ['ResourceController', 'listar', [], 'purchase-orders'],
        'recebimentos'       => ['ResourceController', 'listar', [], 'receipts'],
        'abc-canais-margem'  => ['AnalyticsController', 'abc', ['dimensao' => 'canais', 'metrica' => 'margem'], null],
        'abc-produtos-fat'   => ['AnalyticsController', 'abc', ['dimensao' => 'produtos', 'metrica' => 'faturamento'], null],
        'rentabilidade-canal'=> ['AnalyticsController', 'rentabilidade', ['dimensao' => 'canal'], null],
        'fluxo-financeiro'   => ['AnalyticsController', 'fluxoFinanceiro', [], null],
        'margem-volume-canal'=> ['HistoryController', 'margemVolume', ['dimensao' => 'canal'], null],
    ];
    foreach ($chamadas as $nome => [$c, $m, $g, $a]) {
        $cmd = 'PROVEDOR=real BLING_TESTE_CNF=' . escapeshellarg($cnf) . ' BLING_TESTE_DB=' . escapeshellarg($db) . ' ' . escapeshellarg(PHP_BINARY) . ' '
             . escapeshellarg("$TMP/endpoint.php") . ' ' . escapeshellarg($raiz) . ' ' . escapeshellarg($c) . ' ' . escapeshellarg($m) . ' '
             . escapeshellarg(json_encode($g + ['periodo' => '30d'])) . ($a === null ? '' : ' ' . escapeshellarg($a)) . ' 2>/dev/null';
        $out = []; exec($cmd, $out);
        $j = json_decode(implode("\n", $out), true);
        if (is_array($j)) { unset($j['meta']['correlation_id'], $j['meta']['gerado_em']); }   // estáveis entre execuções
        file_put_contents("$EXDIR/$estado--$nome.json", json_encode($j, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . "\n");
    }
};

try {
    $pdo->exec('SET FOREIGN_KEY_CHECKS = 0');
    foreach ($TABELAS as $t) {
        $ini = strpos($ddl, "CREATE TABLE IF NOT EXISTS $t ("); $eng = $ini === false ? false : strpos($ddl, "\n) ENGINE", $ini); $fim = $eng === false ? false : strpos($ddl, ';', $eng);
        if ($fim === false) { throw new RuntimeException("DDL de $t não encontrada"); }
        $pdo->exec('CREATE TABLE ' . substr($ddl, $ini + strlen('CREATE TABLE IF NOT EXISTS '), $fim - $ini - strlen('CREATE TABLE IF NOT EXISTS ')));
        $criadas[] = $t;
    }
    $pdo->exec('SET FOREIGN_KEY_CHECKS = 1');
    // começa como a PRODUÇÃO de hoje: SEM a coluna da migração 20261124
    $pdo->exec('ALTER TABLE bling_sales_orders DROP COLUMN itens_lidos_em');
    $pdo->exec('ALTER TABLE bling_purchase_orders DROP COLUMN itens_lidos_em');

    $api = new BlingTransporteFalso();
    $api->responder('oauth/token', new BlingResposta(200, ['access_token' => 'acesso-sintetico', 'refresh_token' => 'refresh-sintetico', 'expires_in' => 3600, 'token_type' => 'Bearer']));
    $api->responder('pedidos/vendas', static function ($m, $url) use (&$VENDAS, $pagina) { return $pagina($VENDAS, $url); });
    $api->responder('pedidos/compras', static function ($m, $url) use (&$COMPRAS, $pagina) { return $pagina($COMPRAS, $url); });
    $api->responder('canais-venda', new BlingResposta(200, ['data' => [['id' => 205001, 'descricao' => 'Loja A (teste)'], ['id' => 205002, 'descricao' => 'Loja B (teste)']]]));
    $repo = new BlingRepository($pdo); $auth = new BlingAuthService($repo, $api);
    $url = $auth->iniciarConexao(75, '#/panel-bling'); parse_str((string) parse_url($url, PHP_URL_QUERY), $q);
    $conta = (int) $auth->concluirConexao('codigo-sintetico', (string) $q['state'], ['nome' => 'Conta de teste', 'cnpj' => '00000000000191'])['account_id'];
    $sync = new BlingSyncService($repo, $auth);

    echo "== 1. PRODUÇÃO DE HOJE (sem a coluna): listagem sem itens → tudo desconhecido, nunca 0\n";
    $VENDAS = [pedido(1, false), pedido(2, false, ['loja' => ['id' => 205002]])]; $COMPRAS = [compra(1, false)];
    $sync->sincronizar($conta, 'canais', 'carga_inicial', 'a0');
    $sync->sincronizar($conta, 'pedidos', 'carga_inicial', 'a1'); $sync->sincronizar($conta, 'compras', 'carga_inicial', 'a2');
    ok('no banco o zero antigo continua (nada foi reescrito)', (int) v($pdo, "SELECT qtd_itens FROM bling_sales_orders WHERE bling_id = '900001'") === 0
        && (float) v($pdo, "SELECT subtotal FROM bling_sales_orders WHERE bling_id = '900001'") === 0.0);
    $p1 = $pedidoApi('900001');
    ok('DECISIVO API: subtotal, itens e custo = null (não 0); itens_conhecidos = false', $p1['subtotal'] === null && $p1['qtd_itens'] === null
        && $p1['custo'] === null && $p1['itens_conhecidos'] === false, json_encode(array_intersect_key($p1, array_flip(['subtotal', 'qtd_itens', 'custo', 'itens_conhecidos']))));
    ok('o total continua número; desconto e frete = null (só vêm no detalhe — opção A do Jhony)', $p1['total'] === 1280.06 && $p1['desconto'] === null && $p1['frete'] === null,
        json_encode(array_intersect_key($p1, array_flip(['total', 'desconto', 'frete']))));
    $c1 = array_values($real()->colecao('compras'))[0];
    ok('compra: qtd_itens e qtd_total = null', $c1['qtd_itens'] === null && $c1['qtd_total'] === null && $c1['itens_conhecidos'] === false, json_encode($c1));
    $k = $real()->kpis($F);
    ok('KPI margem estimada = null com disponibilidade "indisponivel" (antes: margem com custo 0 ≈ 95 %)', $kpi($k, 'margem_estimada')['valor'] === null
        && $kpi($k, 'margem_estimada')['disponibilidade']['estado'] === 'indisponivel', json_encode($kpi($k, 'margem_estimada')));
    ok('KPI produtos vendidos = null (não 0)', $kpi($k, 'produtos_vendidos')['valor'] === null && isset($kpi($k, 'produtos_vendidos')['disponibilidade']));
    ok('KPI faturamento BRUTO continua número', is_float($kpi($k, 'faturamento_bruto')['valor']) && $kpi($k, 'faturamento_bruto')['valor'] > 0);
    ok('KPI faturamento LÍQUIDO = null com disponibilidade (frete só no detalhe)', $kpi($k, 'faturamento_liquido')['valor'] === null
        && $kpi($k, 'faturamento_liquido')['variacao'] === null && ($kpi($k, 'faturamento_liquido')['disponibilidade']['estado'] ?? '') === 'indisponivel', json_encode($kpi($k, 'faturamento_liquido')));
    $ev = $real()->evolucao($F); $serie = static fn(string $id) => array_values(array_filter($ev['series'], static fn($s) => $s['id'] === $id))[0]['pontos'];
    $diaVenda = gmdate('Y-m-d', strtotime('-2 days'));
    $pm = array_values(array_filter($serie('margem'), static fn($x) => $x['data'] === $diaVenda))[0];
    ok('série de margem: o dia com venda = null (lacuna), não 0 nem ~95 %', $pm['valor'] === null, json_encode($pm));
    $pf = array_values(array_filter($serie('faturamento'), static fn($x) => $x['data'] === $diaVenda))[0];
    ok('série de faturamento do mesmo dia continua número', $pf['valor'] === 2560.12, json_encode($pf));
    $cv = $real()->curvaAbc('canais', 'margem', $F);
    ok('curva por canal, métrica margem → indisponível custo_desconhecido (sem itens nem zeros)', $cv['indisponivel'] === 'custo_desconhecido' && $cv['itens'] === [] && $cv['total'] === null);
    $cf = $real()->curvaAbc('canais', 'faturamento', $F);
    ok('curva por canal, faturamento → disponível', !isset($cf['indisponivel']) && $cf['total'] === 2560.12, json_encode($cf['total']));
    $cp = $real()->curvaAbc('produtos', 'faturamento', $F);
    ok('curva por PRODUTO sem itens lidos → indisponível itens_desconhecidos (não "nada vendido")', $cp['indisponivel'] === 'itens_desconhecidos' && $cp['total'] === null);
    ok('rentabilidade (qualquer dimensão) sem detalhe lido: indisponível itens_desconhecidos, sem linhas (a receita líquida depende do desconto)',
        $real()->rentabilidadeIndisponivel('canal', $F) === 'itens_desconhecidos' && $real()->rentabilidade('canal', $F) === []
        && $real()->rentabilidadeIndisponivel('produto', $F) === 'itens_desconhecidos' && $real()->rentabilidade('produto', $F) === []);

    echo "== 2. endpoints (subprocesso com o _init.php real): nenhum zero inventado, nenhum erro de tipo\n";
    [$rc2, $d, $txt] = $endpoint('AnalyticsController', 'rentabilidade', ['dimensao' => 'canal']);
    $wf = array_column($d['waterfall'] ?? [], 'valor', 'id');
    ok('/profitability sem detalhe: TODO o waterfall null (nada de soma de nada = 0); indisponivel itens_desconhecidos', $rc2 === 0 && $wf !== []
        && array_filter($wf, static fn($v) => $v !== null) === [] && $d['indisponivel'] === 'itens_desconhecidos' && $d['itens'] === [], json_encode($wf));
    [$rc2, $d, $txt] = $endpoint('AnalyticsController', 'fluxoFinanceiro');
    $nos = array_column($d['nos'] ?? [], 'id');
    ok('fluxo financeiro sem detalhe: sem nós (nunca "nada entrou"), indisponivel itens_desconhecidos, prejuízo null', $rc2 === 0 && $nos === []
        && ($d['links'] ?? null) === [] && $d['prejuizo_total'] === null && $d['indisponivel'] === 'itens_desconhecidos', mb_substr($txt, 0, 200));
    [$rc2, $d, $txt] = $endpoint('AnalyticsController', 'abc', ['dimensao' => 'canais', 'metrica' => 'margem']);
    ok('/abc (canais, margem): indisponivel custo_desconhecido', $rc2 === 0 && $d['indisponivel'] === 'custo_desconhecido' && $d['itens'] === [], mb_substr($txt, 0, 200));
    [$rc2, $d, $txt] = $endpoint('HistoryController', 'margemVolume', ['dimensao' => 'canal']);
    ok('margem × volume sem detalhe: sem mediana nem quadrante (antes: tudo "alta margem")', $rc2 === 0 && $d['indisponivel'] === 'itens_desconhecidos'
        && $d['quadrantes'] === [] && $d['cortes']['margem_pct'] === null && $d['itens'] === [],
        json_encode(['rc' => $rc2, 'ind' => $d['indisponivel'] ?? '?', 'cortes' => $d['cortes'] ?? '?', 'q' => $d['quadrantes'] ?? '?', 'q0' => $d['itens'][0]['quadrante'] ?? 'ausente']));
    [$rc2, $d, $txt] = $endpoint('HistoryController', 'margemVolume', ['dimensao' => 'produto']);
    ok('margem × volume por produto sem itens lidos: indisponivel itens_desconhecidos', $rc2 === 0 && $d['indisponivel'] === 'itens_desconhecidos', mb_substr($txt, 0, 200));
    // métodos privados do ResourceController (tabelas): chamados direto com o provedor real
    $res = static function (string $m) use ($real, $F): array { $r = new ReflectionMethod(ResourceController::class, $m); $r->setAccessible(true); return $r->invoke(null, $real(), $F + ['situacao' => '', 'canal' => '', 'vendedor' => '', 'busca' => '', 'fornecedor' => '']); };
    require_once $raiz . '/api/_helpers/ApiResponse.php';
    if (!class_exists('ResourceController')) { require_once $raiz . '/api/bling/controllers/ResourceController.php'; }
    $lp = array_values(array_filter($res('pedidosVenda')['linhas'], static fn($l) => (string) $l['bling_id'] === '900001'))[0];
    ok('tabela de pedidos: Itens e Subtotal = null + itens_conhecidos false', $lp['itens'] === null && $lp['subtotal'] === null && $lp['itens_conhecidos'] === false, json_encode($lp));
    [$rcT, $dT, $txtT] = $endpoint('ResourceController', 'listar', [], 'real', 'sales-orders');
    ok('/sales-orders totais: Subtotal e Itens = null (uma linha desconhecida = total desconhecido); Total número', $rcT === 0 && array_key_exists('subtotal', $dT['totais'] ?? [])
        && $dT['totais']['subtotal'] === null && $dT['totais']['itens'] === null && is_numeric($dT['totais']['total']), json_encode($dT['totais'] ?? $txtT));
    $lv = $res('vendas')['linhas'][0];
    ok('vendas por dia × canal: custo, unidades e margem = null; receita número', $lv['custo'] === null && $lv['unidades'] === null && $lv['margem_pct'] === null && $lv['receita'] > 0, json_encode($lv));
    $lc = array_values(array_filter($res('canais')['linhas'], static fn($l) => $l['pedidos'] > 0))[0] ?? null;
    ok('canais: margem = null', $lc !== null && $lc['margem_pct'] === null && $lc['faturamento'] > 0, json_encode($lc));
    $lo = array_values(array_filter($res('pedidosCompra')['linhas'], static fn($l) => (string) ($l['bling_id'] ?? '') === '800001' || ($l['numero'] ?? '') === '5001'))[0] ?? null;
    ok('pedidos de compra: itens, qtd_total e pendente = null', $lo !== null && $lo['itens'] === null && $lo['qtd_total'] === null && $lo['pendente'] === null, json_encode($lo));
    $pdo->exec("UPDATE bling_purchase_orders SET data_recebimento = UTC_DATE(), situacao = 'recebido'");
    $lr = $res('recebimentos')['linhas'][0] ?? null;
    ok('recebimento: conferência "desconhecida" (antes: 0 ≥ 0 = "Completa")', $lr !== null && $lr['conferencia'] === 'desconhecida' && $lr['situacao_info']['chave'] === 'desconhecida', json_encode($lr));

    $exemplos('1-producao-hoje-itens-desconhecidos');
    echo "== 3. com a migração 20261124 (coluna NOVA, só ADD): a listagem continua desconhecida; o DETALHE carimba\n";
    $sqlMig = (string) file_get_contents($raiz . '/scripts/deploy/bling-migracao-20261124-itens-lidos.sql');
    $sqlMig = str_replace('BLING.', '', preg_replace('/^--.*$/m', '', $sqlMig));
    foreach (array_filter(array_map('trim', explode(';', $sqlMig))) as $st) { $pdo->exec($st); }
    ok('migração só aditiva: a coluna existe nas 2 tabelas e nenhum dado mudou', (int) v($pdo, "SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND COLUMN_NAME = 'itens_lidos_em' AND TABLE_NAME IN ('bling_sales_orders','bling_purchase_orders')") === 2
        && (int) v($pdo, 'SELECT COUNT(*) FROM bling_sales_orders WHERE itens_lidos_em IS NOT NULL') === 0);
    $repo2 = new BlingRepository($pdo); $auth2 = new BlingAuthService($repo2, $api); $sync2 = new BlingSyncService($repo2, $auth2);   // processo novo (cache de colunas)
    $VENDAS = [pedido(1, false, ['observacoes' => 'mudou'])];
    $sync2->sincronizar($conta, 'pedidos', 'incremental', 'b1');
    ok('listagem depois da migração: NÃO carimba (sem coleção completa) → continua desconhecido', v($pdo, "SELECT itens_lidos_em FROM bling_sales_orders WHERE bling_id = '900001'") === null
        && $pedidoApi('900001')['subtotal'] === null);
    $VENDAS = [pedido(3, true)];                                              // listagem COM lista de itens (estado "preservar")
    $sync2->sincronizar($conta, 'pedidos', 'incremental', 'b1b');
    ok('listagem COM lista de itens também NÃO carimba (pode ser parcial; só o detalhe prova coleção completa)', v($pdo, "SELECT itens_lidos_em FROM bling_sales_orders WHERE bling_id = '900003'") === null
        && $pedidoApi('900003')['subtotal'] === null && $pedidoApi('900003')['itens_conhecidos'] === false);
    $sync2->gravarPedidoDetalhe($conta, pedido(3, true));                     // o detalhe dele chega depois (os agregados abaixo pedem todos lidos)
    $sync2->gravarPedidoDetalhe($conta, pedido(1, true));
    $p1 = $pedidoApi('900001');
    ok('DETALHE completo carimba: itens, subtotal e qtd viram conhecidos', v($pdo, "SELECT itens_lidos_em FROM bling_sales_orders WHERE bling_id = '900001'") !== null
        && $p1['itens_conhecidos'] === true && $p1['qtd_itens'] === 2 && $p1['subtotal'] === 1234.56, json_encode(array_intersect_key($p1, array_flip(['subtotal', 'qtd_itens', 'itens_conhecidos']))));
    ok('custo CONTINUA null mesmo com itens lidos (o pedido do Bling não traz custo) e o custo do item também', $p1['custo'] === null && $p1['itens'][0]['custo_unitario'] === null);
    $sync2->gravarPedidoDetalhe($conta, pedido(2, false, ['itens' => [], 'totalProdutos' => 0, 'total' => 0, 'loja' => ['id' => 205002]]));
    $p2 = $pedidoApi('900002');
    ok('detalhe "vazia confirmada" carimba: 0 itens CONHECIDOS (zero de verdade)', $p2['itens_conhecidos'] === true && $p2['qtd_itens'] === 0 && $p2['subtotal'] === 0.0, json_encode($p2));
    $VENDAS = [pedido(1, false, ['observacoes' => 'mudou de novo'])];
    $sync2->sincronizar($conta, 'pedidos', 'incremental', 'b2');
    $p1b = $pedidoApi('900001');
    ok('listagem depois do detalhe: o carimbo e os itens ficam (a listagem não "desconhece" o que o detalhe provou)', $p1b['itens_conhecidos'] === true && $p1b['qtd_itens'] === 2);
    $k = $real()->kpis($F);
    ok('KPI produtos vendidos: todos os pedidos com itens lidos → número (3 + 0 + 3 = 6)', $kpi($k, 'produtos_vendidos')['valor'] === 6.0, json_encode($kpi($k, 'produtos_vendidos')['valor']));
    ok('KPI margem: continua null (custo nunca conhecido nos pedidos do Bling)', $kpi($k, 'margem_estimada')['valor'] === null);
    // estado 2: detalhe lido em todos (itens, desconto e frete conhecidos), custo continua desconhecido
    $k2 = $real()->kpis($F);
    ok('estado 2: KPI faturamento líquido vira número (frete conhecido)', is_float($kpi($k2, 'faturamento_liquido')['valor']), json_encode($kpi($k2, 'faturamento_liquido')['valor']));
    $rc = $real()->rentabilidade('canal', $F);
    ok('estado 2: rentabilidade por canal — receita, desconto e frete números; custo, lucro, margem e prejuízo = null', $rc !== [] && is_float($rc[0]['receita'])
        && is_float($rc[0]['desconto']) && $rc[0]['custo'] === null && $rc[0]['lucro'] === null && $rc[0]['margem_pct'] === null && $rc[0]['prejuizo'] === null, json_encode($rc[0]));
    [$rcE, $dE, $txtE] = $endpoint('AnalyticsController', 'rentabilidade', ['dimensao' => 'canal']);
    $wf2 = array_column($dE['waterfall'] ?? [], 'valor', 'id');
    ok('estado 2: waterfall — receita/descontos/frete números; custo e lucro null; indisponivel custo_desconhecido', $rcE === 0 && is_numeric($wf2['receita'])
        && is_numeric($wf2['desconto']) && is_numeric($wf2['frete']) && $wf2['custo'] === null && $wf2['lucro'] === null && $dE['indisponivel'] === 'custo_desconhecido', json_encode($wf2));
    [$rcE, $dE, $txtE] = $endpoint('AnalyticsController', 'fluxoFinanceiro');
    $nos2 = array_column($dE['nos'] ?? [], 'id');
    ok('estado 2: fluxo — custo e margem NÃO separados; nó "não informados"; prejuízo null', $rcE === 0 && !in_array('Custo do produto', $nos2, true)
        && !in_array('Margem', $nos2, true) && in_array('Custo e margem (não informados)', $nos2, true) && $dE['prejuizo_total'] === null && $dE['indisponivel'] === 'custo_desconhecido', json_encode($nos2));
    [$rcE, $dE, $txtE] = $endpoint('HistoryController', 'margemVolume', ['dimensao' => 'canal']);
    ok('estado 2: margem × volume — custo_desconhecido, sem quadrantes', $rcE === 0 && $dE['indisponivel'] === 'custo_desconhecido' && $dE['quadrantes'] === []);
    $cp = $real()->curvaAbc('produtos', 'faturamento', $F);
    ok('curva por produto com todos os itens lidos → disponível', !isset($cp['indisponivel']) && $cp['total'] > 0 && $cp['itens'] !== [], json_encode($cp));
    ok('curva por produto, margem → custo_desconhecido', $real()->curvaAbc('produtos', 'margem', $F)['indisponivel'] === 'custo_desconhecido');

    $exemplos('2-com-migracao-e-detalhe-itens-conhecidos-custo-desconhecido');
    echo "== 3b. hash: detalhe idêntico gravado ANTES da coluna ganha o carimbo depois (sem regravação em massa da listagem)\n";
    $pdo->exec('ALTER TABLE bling_sales_orders DROP COLUMN itens_lidos_em');
    $repo3 = new BlingRepository($pdo); $sync3 = new BlingSyncService($repo3, new BlingAuthService($repo3, $api));
    $sync3->gravarPedidoDetalhe($conta, pedido(5, true));                     // sem a coluna: grava itens, sem carimbo
    $pdo->exec("ALTER TABLE bling_sales_orders ADD COLUMN itens_lidos_em DATETIME NULL AFTER qtd_itens");
    $repo4 = new BlingRepository($pdo); $sync4 = new BlingSyncService($repo4, new BlingAuthService($repo4, $api));
    $h0 = v($pdo, "SELECT payload_hash FROM bling_sales_orders WHERE bling_id = '900005'");
    $sync4->gravarPedidoDetalhe($conta, pedido(5, true));                     // o MESMO detalhe
    ok('o mesmo detalhe depois da migração: hash muda 1x e o carimbo entra', v($pdo, "SELECT itens_lidos_em FROM bling_sales_orders WHERE bling_id = '900005'") !== null
        && v($pdo, "SELECT payload_hash FROM bling_sales_orders WHERE bling_id = '900005'") !== $h0);
    $h1 = v($pdo, "SELECT payload_hash FROM bling_sales_orders WHERE bling_id = '900001'");
    $VENDAS = [pedido(1, false, ['observacoes' => 'mudou de novo'])];         // MESMA listagem de antes
    $sync4->sincronizar($conta, 'pedidos', 'incremental', 'b3');
    ok('a listagem não muda o hash por causa da coluna (nada de regravação em massa)', v($pdo, "SELECT payload_hash FROM bling_sales_orders WHERE bling_id = '900001'") === $h1);

    echo "== 4. compras: só a coleção completa carimba\n";
    $COMPRAS = [compra(1, true)];
    $sync4->sincronizar($conta, 'compras', 'incremental', 'c1');
    $c1 = array_values($real()->colecao('compras'))[0];
    ok('compra pela LISTAGEM com itens: continua desconhecida (sem contrato de coleção completa)', $c1['qtd_itens'] === null && $c1['itens_conhecidos'] === false);

    echo "== 4b. achados 2 e 3 da ACIMA_ESQUERDA: ausência nunca sobrescreve o conhecido; data ausente nunca vira \"hoje\"\n";
    $col = static fn(string $t, string $b, string $c) => v($pdo, "SELECT `$c` FROM `$t` WHERE bling_id = ?", [$b]);
    $sync4->gravarPedidoDetalhe($conta, pedido(7, true, ['vendedor' => ['nome' => 'Vendedora X'], 'data' => '2026-10-01']));
    $antes7 = ['desconto' => $col('bling_sales_orders', '900007', 'desconto'), 'frete' => $col('bling_sales_orders', '900007', 'frete'),
               'vendedor' => $col('bling_sales_orders', '900007', 'vendedor'), 'data' => $col('bling_sales_orders', '900007', 'data_pedido')];
    ok('pré: detalhe gravou desconto 10, frete 55,5, vendedor e data', (float) $antes7['desconto'] === 10.0 && (float) $antes7['frete'] === 55.5
        && $antes7['vendedor'] === 'Vendedora X' && $antes7['data'] === '2026-10-01', json_encode($antes7));
    $lst = pedido(7, false, ['data' => 'ilegível', 'total' => 1300.0]); unset($lst['desconto'], $lst['transporte']);   // como a LISTAGEM: sem desconto/transporte/vendedor
    $VENDAS = [$lst];
    $r7 = $sync4->sincronizar($conta, 'pedidos', 'incremental', 'd1');
    ok('DECISIVO: listagem sem desconto/transporte/vendedor e com data ilegível → desconto, frete, vendedor e data INTACTOS', (float) $col('bling_sales_orders', '900007', 'desconto') === 10.0
        && (float) $col('bling_sales_orders', '900007', 'frete') === 55.5 && $col('bling_sales_orders', '900007', 'vendedor') === 'Vendedora X'
        && $col('bling_sales_orders', '900007', 'data_pedido') === '2026-10-01' && (int) ($r7['erros'] ?? 0) === 0, json_encode($r7));
    ok('… e o que veio (total novo) foi gravado', (float) $col('bling_sales_orders', '900007', 'total') === 1300.0,
        (string) v($pdo, "SELECT mensagem FROM bling_sync_errors WHERE bling_id = '900007' ORDER BY id DESC LIMIT 1"));
    $e8 = (int) v($pdo, "SELECT COUNT(*) FROM bling_sync_errors WHERE bling_id = '900008'");
    $novo = pedido(8, false); unset($novo['data']);
    $VENDAS = [$novo];
    $r8 = $sync4->sincronizar($conta, 'pedidos', 'incremental', 'd2');
    ok('pedido NOVO sem data: não é gravado com "hoje" — erro registrado (recuperável)', $col('bling_sales_orders', '900008', 'id') === false
        && (int) v($pdo, "SELECT COUNT(*) FROM bling_sync_errors WHERE bling_id = '900008'") === $e8 + 1 && $r8['erros'] === 1, json_encode($r8));
    $COMPRAS = [compra(9, false)];
    $sync4->sincronizar($conta, 'compras', 'incremental', 'd3');
    $pdo->exec("UPDATE bling_purchase_orders SET qtd_recebida = 5 WHERE bling_id = '800009'");   // simula um valor conhecido vindo de outro lugar
    $cmp = compra(9, false); unset($cmp['total']); $cmp['data'] = '';
    $COMPRAS = [$cmp + ['observacoes' => 'x']];
    $sync4->sincronizar($conta, 'compras', 'incremental', 'd4');
    ok('compra: listagem sem total e com data vazia → valor e data intactos; qtd_recebida não é zerada', (float) $col('bling_purchase_orders', '800009', 'valor') === 300.0
        && $col('bling_purchase_orders', '800009', 'data_emissao') === gmdate('Y-m-d', strtotime('-2 days')) && (float) $col('bling_purchase_orders', '800009', 'qtd_recebida') === 5.0);
    $c9 = array_values(array_filter($real()->colecao('compras'), static fn($c) => (string) $c['bling_id'] === '800009'))[0];
    ok('compra na API: qtd_recebida = null (nada no Bling informa o recebido)', $c9['qtd_recebida'] === null, json_encode($c9));
    $cn = compra(10, false); unset($cn['data']);
    $COMPRAS = [$cn];
    $r10 = $sync4->sincronizar($conta, 'compras', 'incremental', 'd5');
    ok('compra NOVA sem data: não gravada, erro registrado', $col('bling_purchase_orders', '800010', 'id') === false && $r10['erros'] === 1, json_encode($r10));

    echo "== 4c. selo de disponibilidade (aprovado 24/11): ESCOPO AUSENTE não é cobertura completa; último sucesso nunca é uma tentativa\n";
    $REC = new BlingResposta(403, ['error' => ['type' => 'insufficient_scope', 'message' => 'insufficient_scope', 'description' => 'sintético']]);
    $api->responder('contas/receber', static function () use (&$REC) { return $REC; });
    $sync4->sincronizar($conta, 'receber', 'carga_inicial', 'e1');
    $dr = $real()->disponibilidade('receber');
    ok('escopo ausente (403 insufficient_scope, nada lido): estado indisponivel, cobertura NENHUMA, sem "último sucesso" (antes: completa + hora da tentativa)',
        $dr['estado'] === 'indisponivel' && $dr['cobertura'] === 'nenhuma' && $dr['ultimo_sucesso'] === null && str_contains($dr['motivo'], 'escopo'), json_encode($dr));
    $kr = $kpi($real()->kpis($F), 'contas_receber');
    ok('KPI contas a receber com escopo ausente: valor null (não 0)', $kr['valor'] === null && ($kr['disponibilidade']['estado'] ?? '') === 'indisponivel', json_encode($kr));
    $titulos = [];
    for ($i = 1; $i <= 12; $i++) { $titulos[] = ['id' => 600000 + $i, 'valor' => 100, 'vencimento' => '2026-12-01', 'situacao' => 1, 'contato' => ['id' => 1]]; }
    $REC = new BlingResposta(200, ['data' => $titulos]);
    $repo4->liberarEscopoAusente($conta);                                   // = a reautorização da conta (concluirConexao)
    $sync4->sincronizar($conta, 'receber', 'incremental', 'e2');
    $dr = $real()->disponibilidade('receber');
    ok('depois de reautorizar e ler tudo: ok, cobertura completa, último sucesso = o job concluído', $dr['estado'] === 'ok' && $dr['cobertura'] === 'completa' && $dr['ultimo_sucesso'] !== null, json_encode($dr));
    $titulos[] = ['valor' => 100, 'vencimento' => '2026-12-01'];             // 1 título sem id em 13 (< 10 %) → 'atencao' por erro de registro
    $REC = new BlingResposta(200, ['data' => $titulos]);
    $rr = $sync4->sincronizar($conta, 'receber', 'incremental', 'e3');
    $dr = $real()->disponibilidade('receber');
    ok('erro em poucos registros (situação atencao): cobertura PARCIAL e estado parcial (não "completa"); último sucesso = o job', $rr['situacao'] === 'atencao'
        && $dr['cobertura'] === 'parcial' && $dr['estado'] === 'parcial' && $dr['ultimo_sucesso'] !== null, json_encode([$rr['situacao'] ?? null, $dr]));

    echo "== 5. o provedor de DEMONSTRAÇÃO (mock) não muda: números como antes\n";
    [$rc5, $d, $txt] = $endpoint('OverviewController', 'overview', [], 'mock');
    $kk = $d['kpis'] ?? [];
    $mg = is_array($kk) ? (array_values(array_filter($kk, static fn($x) => is_array($x) && ($x['id'] ?? '') === 'margem_estimada'))[0] ?? null) : null;
    ok('mock: margem estimada é número (custo conhecido no mock)', $mg !== null && is_numeric($mg['valor']), mb_substr($txt, 0, 160));

    echo "== 6. varredura: nenhum array_sum de custo/lucro de pedido sobrou nos controladores e no provedor\n";
    $fontes = '';
    foreach (['lib/BlingProviderBase.php', 'controllers/ResourceController.php', 'controllers/AnalyticsController.php', 'controllers/HistoryController.php'] as $arq) {
        $fontes .= (string) file_get_contents($raiz . '/api/bling/' . $arq);
    }
    // as únicas somas de 'custo' que podem sobrar são do FRETE (transportadoras: custo de envio, conhecido) — nunca custo/lucro de pedido
    preg_match_all("/array_sum\\(array_column\\(\\$(\\w+), '(custo|lucro)'\\)\\)/", $fontes, $sobras);
    $achadas = $sobras[0]; sort($achadas);
    $frete = ["array_sum(array_column(\$meus, 'custo'))", "array_sum(array_column(\$meus, 'custo'))", "array_sum(array_column(\$transportadoras, 'custo'))"];
    ok("nenhum array_sum(array_column(…, 'custo'|'lucro')) de PEDIDO — só as 3 somas de FRETE conhecidas (transportadoras)", $achadas === $frete, json_encode($achadas));
} catch (Throwable $e) {
    $falhas++; echo 'FALHA exceção: ', get_class($e), ': ', $e->getMessage(), ' @', basename($e->getFile()), ':', $e->getLine(), "\n";
} finally {
    $pdo->exec('SET FOREIGN_KEY_CHECKS = 0');
    foreach (array_reverse(array_unique($criadas)) as $t) { if (preg_match('/^bling_[a-z_]+$/', $t)) { $pdo->exec("DROP TABLE IF EXISTS `$t`"); } }
    $pdo->exec('SET FOREIGN_KEY_CHECKS = 1');
    $sobra = (int) $pdo->query("SELECT COUNT(*) FROM information_schema.TABLES WHERE table_schema = DATABASE() AND table_name LIKE 'bling\\_%'")->fetchColumn();
    echo "== limpeza: $sobra tabela(s) bling_* restante(s)\n";
    if (preg_match('#^/srv/dshow-work/bling-ausencia-teste\.[A-Za-z0-9]{6}$#', $TMP)) { shell_exec('rm -rf -- ' . escapeshellarg($TMP)); }
}
echo "== $total verificações, $falhas falha(s)\n";
exit($falhas === 0 ? 0 : 1);
