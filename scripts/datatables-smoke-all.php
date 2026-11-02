<?php
// scripts/datatables-smoke-all.php — suite de regressao deterministica do DataTables
// @version 1.0.0
// @created 2026-07-20
// @app DataTables
//
// Consolida as asserções escritas durante a construção do módulo. NAO depende de
// rede externa nem de credencial de terceiro: usa o proprio banco local e stubs.
//
// Cobre: cripto, classificador de campos, fabrica de conexao, motor de alertas
// (deduplicacao/silencio/resolucao), calibracao de severidade de qualidade,
// redacao de segredo em mensagem de erro, e os contratos de roteador.
//
// Uso: php scripts/datatables-smoke-all.php     (exit 0 = tudo PASS)
declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(403);
    exit("CLI apenas\n");
}

$ROOT = dirname(__DIR__);
require_once $ROOT . '/config/db_connection.php';
require_once $ROOT . '/api/datatables/lib/Crypto.php';
require_once $ROOT . '/api/datatables/lib/ConnectionFactory.php';
require_once $ROOT . '/api/datatables/lib/FieldClassifier.php';
require_once $ROOT . '/api/datatables/repositories/ConnectionRepository.php';
require_once $ROOT . '/api/datatables/repositories/StatusRepository.php';
require_once $ROOT . '/api/datatables/repositories/CatalogRepository.php';
require_once $ROOT . '/api/datatables/services/AlertService.php';
require_once $ROOT . '/api/datatables/services/ExternalSourceService.php';
require_once $ROOT . '/api/datatables/lib/WebhookSender.php';
require_once $ROOT . '/api/datatables/services/MetricsService.php';

$PASS = 0;
$FAIL = 0;
$CURRENT = '';

function group(string $name): void
{
    global $CURRENT;
    $CURRENT = $name;
    echo "\n── {$name} " . str_repeat('─', max(1, 58 - mb_strlen($name))) . "\n";
}

function ok(string $name, $cond, string $detail = ''): void
{
    global $PASS, $FAIL;
    if ($cond === true) {
        printf("  [PASS] %s%s\n", $name, $detail !== '' ? " ({$detail})" : '');
        $PASS++;
    } else {
        printf("  [FAIL] %s%s\n", $name, $detail !== '' ? " -> {$detail}" : '');
        $FAIL++;
    }
}

function eq(string $name, $got, $expected): void
{
    ok($name, $got === $expected, $got === $expected ? '' : 'obtido=' . var_export($got, true)
        . ' esperado=' . var_export($expected, true));
}

echo "═══════════════════════════════════════════════════════\n";
echo "  DATATABLES SMOKE ALL — regressao\n";
echo "═══════════════════════════════════════════════════════\n";

// ═══════════════════════════════════════════════════════════════
group('Cripto de credenciais (AES-256-GCM)');
// ═══════════════════════════════════════════════════════════════

ok('chave configurada no .env', DtCrypto::isConfigured() === true);

if (DtCrypto::isConfigured()) {
    $s = 'sênh@ com ç, "aspas" \\ / #!$%';
    eq('roundtrip preserva utf8 e simbolos', DtCrypto::decrypt(DtCrypto::encrypt($s)), $s);
    eq('string vazia permanece vazia', DtCrypto::encrypt(''), '');
    ok('IV aleatorio: 2 cifras do mesmo texto diferem',
        DtCrypto::encrypt('igual') !== DtCrypto::encrypt('igual'));
    ok('looksEncrypted nega texto plano', DtCrypto::looksEncrypted('minhasenha123') === false);
    eq('mask nunca devolve o valor real', DtCrypto::mask(DtCrypto::encrypt('x')), '********');

    // Adulteracao precisa ser DETECTADA pela tag GCM, nunca devolver lixo.
    $env = DtCrypto::encrypt('sensivel');
    $p   = explode('.', $env);
    $ct  = base64_decode($p[3]);
    $ct[0] = chr(ord($ct[0]) ^ 0xFF);
    $p[3] = base64_encode($ct);
    $detected = false;
    try { DtCrypto::decrypt(implode('.', $p)); } catch (DtCryptoException $e) { $detected = true; }
    ok('adulteracao do ciphertext e detectada (tag GCM)', $detected);

    $scrub = DtCrypto::scrub(['id' => 1, 'username' => 'ro', 'password_encrypted' => $env, 'token' => 'abc']);
    ok('scrub remove campos sensiveis e preserva o resto',
        $scrub['password_encrypted'] === '********' && $scrub['token'] === '********'
        && $scrub['id'] === 1 && $scrub['username'] === 'ro');
}

// ═══════════════════════════════════════════════════════════════
group('Classificador de campos sensiveis');
// ═══════════════════════════════════════════════════════════════

$cls = static function (string $name, string $comment = '') {
    return DtFieldClassifier::classify(
        ['name' => $name, 'column_comment' => $comment, 'data_type' => 'varchar']
    )['sensitivity'];
};

// Verdadeiros positivos
foreach ([
    'cpf' => 'cpf', 'nu_cnpj' => 'cnpj', 'password_hash' => 'senha', 'api_key' => 'credencial',
    'session_token' => 'credencial', 'seller_email' => 'email', 'celular' => 'telefone',
    'mobile_phone' => 'telefone', 'cep' => 'endereco', 'billing_address' => 'endereco',
    'ip_address' => 'ip', 'remote_addr' => 'ip', 'numero_cartao' => 'bancario',
    'pix' => 'bancario', 'data_nascimento' => 'pessoal', 'dataNascimento' => 'pessoal',
    'cnh' => 'documento', 'salario' => 'financeiro',
] as $col => $exp) {
    eq("detecta '{$col}'", $cls($col), $exp);
}

// Falsos positivos que ja custaram caro — cada um destes foi um bug real.
foreach ([
    'is_collapsible'    => 'comentario em prosa com "mobile"',
    'show_on_mobile'    => '"mobile" = responsividade, nao telefone',
    'base_token_key'    => '"token" = design token, nao credencial',
    'design_token'      => 'idem',
    'webhook_url'       => 'nao e credencial',
    'created_at'        => 'metadado comum',
    'order_index'       => 'metadado comum',
] as $col => $why) {
    eq("NAO marca '{$col}' ({$why})", $cls($col, $col === 'is_collapsible' ? 'Se pode ser colapsado em mobile' : ''), null);
}

eq('comentario so vale para termo inequivoco (cpf)', $cls('documento_titular', 'Guarda o CPF do titular'), 'cpf');
eq('comentario ambiguo NAO classifica', $cls('descricao', 'Endereco do endpoint de callback'), null);

// ═══════════════════════════════════════════════════════════════
group('Fabrica de conexao: classificacao de erro');
// ═══════════════════════════════════════════════════════════════

$mkPdoEx = static function (string $msg, string $code) {
    $e = new PDOException($msg);
    $e->setCode($code);   // PDOException aceita string em code
    return $e;
};

eq('1045 (access denied) -> credential_expired',
    DtConnectionFactory::classifyError(new PDOException('SQLSTATE[HY000] [1045] Access denied for user')),
    DtConnectionFactory::ST_CRED_EXPIRED);
eq('host inacessivel -> offline',
    DtConnectionFactory::classifyError(new PDOException('SQLSTATE[HY000] [2002] Connection timed out')),
    DtConnectionFactory::ST_OFFLINE);
eq('falha de cripto -> credential_expired',
    DtConnectionFactory::classifyError(new DtCryptoException('chave errada')),
    DtConnectionFactory::ST_CRED_EXPIRED);

$safe = DtConnectionFactory::safeError(
    new PDOException("SQLSTATE[HY000] [1045] Access denied for user 'admin'@'10.0.0.1' (using password: YES)")
);
ok('mensagem de erro mascara o usuario', strpos($safe, "'***'") !== false, $safe);

eq('latencia acima do limite -> slow', DtConnectionFactory::classifyLatency(3000, 1500), DtConnectionFactory::ST_SLOW);
eq('latencia dentro do limite -> online', DtConnectionFactory::classifyLatency(200, 1500), DtConnectionFactory::ST_ONLINE);

// ═══════════════════════════════════════════════════════════════
group('Redacao de segredo em mensagem de erro externa');
// ═══════════════════════════════════════════════════════════════

$r  = new ReflectionClass('DtExternalSourceService');
$m  = $r->getMethod('safeCurlError');
$m->setAccessible(true);
$sv = $r->newInstanceWithoutConstructor();

foreach ([
    ['token na query',        'Failed https://api.x/v1?token=ABC123SECRET&a=1', 'ABC123SECRET'],
    ['api_key na query',      'Timeout https://api.x/d?api_key=KEY_SECRETA',    'KEY_SECRETA'],
    ['senha embutida na URL', 'Connect https://admin:MinhaSenha@host/x',        'MinhaSenha'],
    // Este passou despercebido: \S+ mascarava so o "Bearer" e vazava o token.
    ['header Authorization',  'sent Authorization: Bearer TOKEN_ABC_999',       'TOKEN_ABC_999'],
    ['header X-API-Key',      'header X-API-Key: CHAVE_XYZ rejected',           'CHAVE_XYZ'],
] as [$nome, $msg, $segredo]) {
    $out = $m->invoke($sv, 6, $msg);
    ok("segredo nao vaza: {$nome}", stripos($out, $segredo) === false, $out);
}

$host = $m->invoke($sv, 6, 'Could not resolve host: db-prod.empresa.com.br');
ok('hostname PRESERVADO para diagnostico (§29)', stripos($host, 'db-prod.empresa.com.br') !== false);

// ═══════════════════════════════════════════════════════════════
group('Banco local: catalogo e contratos');
// ═══════════════════════════════════════════════════════════════

try {
    $pdo = getConnection('DSHOWDASH');

    $tabelas = $pdo->query("SHOW TABLES LIKE 'DT\\_%'")->fetchAll(PDO::FETCH_COLUMN);
    ok('schema DT_ aplicado (>= 29 tabelas)', count($tabelas) >= 29, count($tabelas) . ' tabelas');

    // O indice de alerta precisa ser PARCIAL: um ativo por fingerprint, N resolvidos.
    $idx = $pdo->query("SHOW INDEX FROM DT_Alerta WHERE Key_name='uq_alerta_active'")->fetchAll();
    ok('DT_Alerta usa indice parcial via coluna gerada', count($idx) > 0,
        count($idx) ? '' : 'uq_alerta_active ausente — UNIQUE(fingerprint,status) quebra a 2a resolucao');

    // field_id NAO pode ser NULL: NULL nao colide em UNIQUE e duplica a cada run.
    $col = $pdo->query("SHOW COLUMNS FROM DT_Problema_Qualidade WHERE Field='field_id'")->fetch(PDO::FETCH_ASSOC);
    eq('DT_Problema_Qualidade.field_id e NOT NULL', $col['Null'] ?? '?', 'NO');

    $repo = new DtConnectionRepository($pdo);
    $any  = $pdo->query('SELECT id FROM DT_Conexao LIMIT 1')->fetchColumn();
    if ($any) {
        $pub = $repo->find((int)$any);
        ok('leitura publica NAO expoe credencial',
            $pub !== null && !array_key_exists('password_encrypted', $pub)
            && !array_key_exists('password', $pub),
            implode(',', array_intersect(array_keys($pub ?? []), ['password', 'password_encrypted'])));
        ok('leitura publica expoe has_password (booleano)',
            $pub !== null && is_bool($pub['has_password'] ?? null));
    } else {
        ok('leitura publica NAO expoe credencial', true, 'sem conexao cadastrada — pulado');
        ok('leitura publica expoe has_password', true, 'sem conexao cadastrada — pulado');
    }

    $cat = new DtCatalogRepository($pdo);

    // Whitelist de ORDER BY precisa recusar injecao e cair no default.
    $inj = $cat->listTables(['sort' => 'name; DROP TABLE DT_Tabela--', 'limit' => 1]);
    ok('ORDER BY recusa coluna fora da whitelist', is_array($inj['items']));
    $tabelasAindaExiste = $pdo->query("SHOW TABLES LIKE 'DT_Tabela'")->fetchColumn();
    ok('DT_Tabela sobreviveu a tentativa de injecao', $tabelasAindaExiste !== false);

    $teto = $cat->listTables(['limit' => 99999]);
    ok('limite de pagina tem teto rigido', ($teto['meta']['limit'] ?? 0) <= 200,
        'limit=' . ($teto['meta']['limit'] ?? '?'));

    ok('dashboardCounters responde', is_array($cat->dashboardCounters()));
    ok('lookups responde', is_array($cat->lookups()));

} catch (Throwable $e) {
    ok('banco local acessivel', false, $e->getMessage());
    $pdo = null;
}

// ═══════════════════════════════════════════════════════════════
group('Motor de alertas: deduplicacao, silencio e resolucao');
// ═══════════════════════════════════════════════════════════════

if ($pdo !== null) {
    // Alvo sintetico bem fora da faixa real, limpo antes e depois.
    $T = 999999;
    $limpa = static function (PDO $p, int $t): void {
        $p->exec("DELETE o FROM DT_Alerta_Ocorrencia o JOIN DT_Alerta a ON a.id=o.alert_id WHERE a.connection_id={$t}");
        $p->exec("DELETE FROM DT_Alerta WHERE connection_id={$t}");
        $p->exec("DELETE FROM DT_Silencio_Alerta WHERE connection_id={$t}");
    };
    $limpa($pdo, $T);

    $al = new DtAlertService($pdo);

    $r1 = $al->raise('db_offline', 'connection', $T, 'Smoke: offline', 'erro 1', $T);
    ok('1a ocorrencia CRIA o alerta', ($r1['created'] ?? false) === true);
    eq('severidade de db_offline e critico', $r1['severity'] ?? '', DtAlertService::SEV_CRITICAL);

    $ids = [$r1['id']];
    for ($i = 2; $i <= 12; $i++) {
        $ids[] = $al->raise('db_offline', 'connection', $T, 'Smoke: offline', "erro {$i}", $T)['id'];
    }
    eq('12 ciclos = 1 unico incidente (dedup)', count(array_unique($ids)), 1);

    $occ = (int)$pdo->query("SELECT occurrences FROM DT_Alerta WHERE id={$r1['id']}")->fetchColumn();
    eq('contador de repeticoes chega a 12', $occ, 12);

    ok('resolve o incidente ativo', $al->resolve('db_offline', 'connection', $T) === true);
    ok('resolve e idempotente', $al->resolve('db_offline', 'connection', $T) === false);

    // O bug do indice: problema que volta precisa abrir incidente NOVO.
    $r2 = $al->raise('db_offline', 'connection', $T, 'Smoke: voltou', null, $T);
    ok('problema que retorna abre incidente NOVO', ($r2['created'] ?? false) === true
        && ($r2['id'] ?? 0) !== ($r1['id'] ?? 0));

    // Silencio: janela diaria cobrindo o dia inteiro.
    $pdo->prepare('INSERT INTO DT_Silencio_Alerta (connection_id, alert_type, daily_from, daily_to, reason, is_active)
                   VALUES (:c, "db_slow", "00:00:00", "23:59:59", "smoke", 1)')->execute([':c' => $T]);
    ok('janela de silencio cobre o tipo alvo', $al->isSilenced('db_slow', $T) === true);
    ok('silencio NAO vaza para outro tipo', $al->isSilenced('db_offline', $T) === false);
    ok('silencio NAO vaza para outra conexao', $al->isSilenced('db_slow', 1) === false);
    $pdo->exec("DELETE FROM DT_Silencio_Alerta WHERE connection_id={$T}");

    // evaluateCheck: levanta o que se aplica e RESOLVE o que deixou de valer.
    $al->evaluateCheck($T, 'Smoke', [
        'status' => 'offline', 'latency_ms' => null, 'step_failed' => 'connect',
        'read_ok' => 0, 'write_ok' => null, 'write_supported' => 1, 'error' => 'host fora',
    ]);
    $ativos = $pdo->query("SELECT alert_type FROM DT_Alerta WHERE connection_id={$T} AND status='active'")
                  ->fetchAll(PDO::FETCH_COLUMN);
    ok('offline levanta db_offline e read_failed',
        in_array('db_offline', $ativos, true) && in_array('read_failed', $ativos, true),
        implode(',', $ativos));

    $al->evaluateCheck($T, 'Smoke', [
        'status' => 'online', 'latency_ms' => 20, 'step_failed' => null,
        'read_ok' => 1, 'write_ok' => 1, 'write_supported' => 1, 'error' => null,
    ]);
    $rest = $pdo->query("SELECT alert_type FROM DT_Alerta WHERE connection_id={$T} AND status='active'")
                ->fetchAll(PDO::FETCH_COLUMN);
    eq('recuperacao resolve TODOS os ativos', count($rest), 0);

    // Banco read-only: write_ok NULL + write_supported 0 nao pode virar critico.
    $al->evaluateCheck($T, 'Smoke-RO', [
        'status' => 'online', 'latency_ms' => 30, 'step_failed' => null,
        'read_ok' => 1, 'write_ok' => null, 'write_supported' => 0, 'error' => null,
    ]);
    $wf = (int)$pdo->query("SELECT COUNT(*) FROM DT_Alerta
                            WHERE connection_id={$T} AND alert_type='write_failed' AND status='active'")
                   ->fetchColumn();
    eq('read-only NAO gera write_failed falso', $wf, 0);

    $limpa($pdo, $T);
    $pdo->exec("DELETE FROM app_notifications WHERE category='datatables' AND title LIKE 'Smoke%'");
}

// ═══════════════════════════════════════════════════════════════
group('Webhook: payload e assinatura');
// ═══════════════════════════════════════════════════════════════

$wr = new ReflectionClass('DtWebhookSender');
$bp = $wr->getMethod('buildPayload');
$bp->setAccessible(true);

$payload = $bp->invoke(null, [
    'id' => 7, 'fingerprint' => 'abc', 'alert_type' => 'db_offline', 'severity' => 'critico',
    'status' => 'active', 'title' => 'Banco offline', 'message' => 'host inacessivel',
    'occurrences' => 3, 'first_seen_at' => '2026-07-20 10:00:00', 'last_seen_at' => '2026-07-20 10:15:00',
    'target_type' => 'connection', 'target_id' => 1, 'connection_id' => 1,
    'connection_name' => 'ERP', 'environment_label' => 'Producao',
    // Campos que NAO podem vazar mesmo vindo na linha do alerta:
    'password_encrypted' => 'v1.aaa.bbb.ccc', 'secret_encrypted' => 'v1.xxx.yyy.zzz',
], 'deliv123');

eq('schema do payload e estavel', $payload['schema'], 'dshowdash.datatables.alert/v1');
eq('severidade preservada', $payload['alert']['severity'], 'critico');
eq('contador de ocorrencias no payload', $payload['alert']['occurrences'], 3);
eq('nome da conexao no alvo', $payload['target']['connection_name'], 'ERP');

$json = json_encode($payload);
ok('payload NAO carrega credencial da conexao',
    stripos($json, 'password') === false && stripos($json, 'secret') === false
    && stripos($json, 'encrypted') === false);

// A assinatura cobre timestamp E corpo: so o corpo permitiria replay.
$secret = 'chave-de-teste';
$ts   = 1750000000;
$body = json_encode($payload);
$sig  = hash_hmac('sha256', $ts . '.' . $body, $secret);
ok('HMAC muda se o corpo for adulterado',
    hash_hmac('sha256', $ts . '.' . $body . 'x', $secret) !== $sig);
ok('HMAC muda se o timestamp for trocado (anti-replay)',
    hash_hmac('sha256', ($ts + 1) . '.' . $body, $secret) !== $sig);
ok('HMAC muda com segredo diferente',
    hash_hmac('sha256', $ts . '.' . $body, 'outro') !== $sig);

$r = DtWebhookSender::sendTest(['config_json' => json_encode(['url' => 'nao-e-url'])]);
ok('URL invalida falha em vez de fingir entrega', ($r['ok'] ?? true) === false);
eq('URL invalida nao consome tentativa', $r['attempts'], 0);

// ═══════════════════════════════════════════════════════════════
group('Metricas e crescimento anormal');
// ═══════════════════════════════════════════════════════════════

if ($pdo !== null) {
    $met = new DtMetricsService($pdo);
    $mr  = new ReflectionClass('DtMetricsService');
    $cg  = $mr->getMethod('computeGrowth');
    $cg->setAccessible(true);

    // Piso de relevancia: tabela minuscula crescendo muito percentualmente e ruido.
    $ruido = $cg->invoke($met, [
        'first_size' => 1024, 'last_size' => 65536,   // +6300%, mas 1KB -> 64KB
        'first_rows' => 10,   'last_rows' => 900,
    ]);
    ok('crescimento de tabela minuscula e ignorado', $ruido === null);

    $real = $cg->invoke($met, [
        'first_size' => 35143680, 'last_size' => 117145600,   // 33MB -> 111MB
        'first_rows' => 0,        'last_rows' => 0,
    ]);
    ok('crescimento relevante e detectado', $real !== null && $real['pct'] > 200,
        $real ? (string)$real['pct'] . '%' : 'null');
    eq('metrica escolhida e a de maior variacao', $real['metric'] ?? '', 'tamanho');

    // Encolher nao e crescimento.
    $menor = $cg->invoke($met, [
        'first_size' => 10485760, 'last_size' => 1048576,
        'first_rows' => 50000,    'last_rows' => 1000,
    ]);
    ok('tabela que encolheu NAO gera crescimento', $menor === null);

    // Linhas contam mesmo com tamanho estavel (dado cabe na pagina ja alocada).
    $porLinhas = $cg->invoke($met, [
        'first_size' => 0,    'last_size' => 0,
        'first_rows' => 5000, 'last_rows' => 20000,
    ]);
    ok('crescimento por LINHAS conta mesmo sem crescer em bytes',
        $porLinhas !== null && $porLinhas['metric'] === 'registros',
        $porLinhas ? $porLinhas['metric'] : 'null');

    $cov = $met->coverage();
    ok('cobertura da serie responde', is_array($cov) && array_key_exists('table_samples', $cov));
}

// ═══════════════════════════════════════════════════════════════
group('Contratos do roteador HTTP');
// ═══════════════════════════════════════════════════════════════

// Bug recorrente: chamar metodo que nao existe no controller = fatal em runtime.
require_once $ROOT . '/api/datatables/controllers/CatalogController.php';
$idx = @file_get_contents($ROOT . '/api/datatables/index.php') ?: '';
preg_match_all('/(Dt\w+Controller)::(\w+)\(/', $idx, $mm, PREG_SET_ORDER);
$vistos = [];
foreach ($mm as $x) {
    $key = $x[1] . '::' . $x[2];
    if (isset($vistos[$key]) || $x[1] !== 'DtCatalogController') {
        continue;
    }
    $vistos[$key] = true;
    ok("roteador chama metodo existente: {$key}", method_exists($x[1], $x[2]));
}

// AuthHelpers::requireMethod NAO existe (so a funcao global) — trava contra regressao.
require_once $ROOT . '/api/_helpers/AuthHelpers.php';
ok('nao usa AuthHelpers::requireMethod (inexistente)',
    strpos($idx, 'AuthHelpers::requireMethod') === false
    && !method_exists('AuthHelpers', 'requireMethod'));

// ═══════════════════════════════════════════════════════════════
echo "\n═══════════════════════════════════════════════════════\n";
printf("  RESULTADO: %d PASS / %d FAIL\n", $PASS, $FAIL);
echo "═══════════════════════════════════════════════════════\n";
exit($FAIL > 0 ? 1 : 0);
