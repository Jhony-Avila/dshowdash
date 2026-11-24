<?php
declare(strict_types=1);

// scripts/asaas/teste-asaas-conector.php — teste do conector Asaas SÓ LEITURA com Asaas FALSO (nenhuma rede, nenhuma chave real).
// Banco: só o de VALIDAÇÃO (ATRWEB_VAL_T_13), credencial lida em memória do .ini (nunca impressa), tabelas com prefixo PRÓPRIO desta
// execução (asaas_t<aleatório>_) removidas no fim — só elas, conferidas pelo prefixo. Chaves: arquivos inventados num mktemp próprio.
// Uso: php scripts/asaas/teste-asaas-conector.php [--sem-banco]

require_once __DIR__ . '/../../api/asaas/AsaasPortao.php';

$ok = 0; $falhas = [];
function check(string $nome, bool $cond): void { global $ok, $falhas; if ($cond) $ok++; else { $falhas[] = $nome; echo "FALHOU: $nome\n"; } }
function erroDe(callable $f): ?string { try { $f(); return null; } catch (AsaasErro $e) { return $e->codigo; } }

// ---------- Asaas falso ----------
final class AsaasFalso implements AsaasTransporte
{
    /** @var list<array{url:string,path:string,q:array}> */
    public array $chamadas = [];
    /** @var array<string, Closure(string,array,string):array> por caminho */
    public array $rotas = [];
    public array $fila = [];   // respostas forçadas em ordem (status/cabecalhos/corpo), antes das rotas
    public function get(string $url, string $chave): array
    {
        $u = parse_url($url); parse_str($u['query'] ?? '', $q);
        $path = substr($u['path'], 3);   // tira /v3
        $this->chamadas[] = ['url' => $url, 'path' => $path, 'q' => $q, 'host' => $u['host']];
        if ($this->fila !== []) return array_shift($this->fila);
        $f = $this->rotas[$path] ?? null;
        return $f ? $f($path, $q, $chave) : ['status' => 404, 'cabecalhos' => [], 'corpo' => '{}'];
    }
}
function json200(array $d): array { return ['status' => 200, 'cabecalhos' => [], 'corpo' => json_encode($d)]; }
function pagina(array $todos, array $q): array
{
    $o = (int) ($q['offset'] ?? 0); $l = (int) ($q['limit'] ?? 10);
    return json200(['object' => 'list', 'hasMore' => $o + $l < count($todos), 'totalCount' => count($todos), 'limit' => $l, 'offset' => $o, 'data' => array_slice($todos, $o, $l)]);
}

$CH_A = '$aact_prod_000ChaveInventadaContaA::$aach_testeA';
$CH_B = '$aact_prod_000ChaveInventadaContaB::$aach_testeB';
$CH_S = '$aact_hmlg_000ChaveInventadaSandbox::$aach_testeS';
$BASE = AsaasRotas::BASES['producao'];
$semSono = static function (int $s) use (&$sonos): void { $sonos[] = $s; };
$sonos = [];

// ================= A. lista fixa de rotas e parâmetros =================
check('5 rotas permitidas (as 4 de dados + identidade da conta)', array_keys(AsaasRotas::ROTAS) === ['cobrancas', 'estatisticas_cobrancas', 'extrato', 'saldo', 'conta']);
// B3 (Codex DSHOW-111): centavos INTEIROS, conversão decimal exata
foreach ([[1000.5, 100050], [199.99, 19999], [0.1, 10], [12345678.9, 1234567890], [2500.0, 250000], [7, 700], ['0.105', 11], ['-3.10', -310], ['19.999', 2000], [1.0E-7, null], ['1e3', null], [true, null], [NAN, null]] as [$e, $c]) {
    check('centavos exatos: ' . var_export($e, true) . ' → ' . var_export($c, true), AsaasValor::centavosDe($e) === $c, var_export(AsaasValor::centavosDe($e), true));
}
check('soma de 0.1 três vezes em centavos = 0.30 exato', AsaasValor::deCentavos(AsaasValor::centavosDe(0.1) * 3) === '0.30');
check('dinheiro() devolve o decimal montado dos centavos', AsaasValor::dinheiro(1000.5) === '1000.50' && AsaasValor::dinheiro(0.07) === '0.07');
check('url cobranças', AsaasRotas::url($BASE, 'cobrancas', ['limit' => 100, 'offset' => 0]) === "$BASE/payments?limit=100&offset=0");
check('url estatísticas', AsaasRotas::url($BASE, 'estatisticas_cobrancas', ['status' => 'PENDING']) === "$BASE/finance/payment/statistics?status=PENDING");
check('url extrato', str_starts_with(AsaasRotas::url($BASE, 'extrato', ['startDate' => '2026-10-01', 'finishDate' => '2026-11-01']), "$BASE/financialTransactions?"));
check('url saldo', AsaasRotas::url($BASE, 'saldo', []) === "$BASE/finance/balance");
foreach (['clientes', 'payments', '/payments', 'transfers', 'cobrancas/../transfers', 'saldo ', 'SALDO', 'pix', 'webhooks', 'myAccount'] as $r) {
    check("rota recusada: $r", erroDe(fn() => AsaasRotas::url($BASE, $r, [])) === 'rota_recusada');
}
check('base fora da lista recusada', erroDe(fn() => AsaasRotas::url('https://api.asaas.com.evil.example/v3', 'saldo', [])) === 'rota_recusada');
foreach ([['customer' => 'cus_1'], ['limit' => 101], ['limit' => 0], ['offset' => -1], ['dueDate[ge]' => '2026-1-1'], ['status' => 'PENDING&x=1'],
          ['status' => 'DELETED'], ['limit' => ['100']], ['access_token' => 'x']] as $q) {
    check('parâmetro recusado: ' . json_encode($q), erroDe(fn() => AsaasRotas::url($BASE, 'cobrancas', $q)) === 'parametro_recusado');
}
check('saldo não aceita parâmetro nenhum', erroDe(fn() => AsaasRotas::url($BASE, 'saldo', ['limit' => 1])) === 'parametro_recusado');

// ================= B. só GET: superfície e código =================
$metCli = array_map(fn($m) => $m->getName(), (new ReflectionClass(AsaasCliente::class))->getMethods(ReflectionMethod::IS_PUBLIC));
sort($metCli);
check('cliente só expõe get (sem método HTTP como parâmetro)', $metCli === ['__construct', '__debugInfo', 'espera', 'get']);
$metTr = array_map(fn($m) => $m->getName(), (new ReflectionClass(AsaasTransporte::class))->getMethods());
check('transporte só tem get', $metTr === ['get']);
$fonte = '';
foreach (glob(__DIR__ . '/../../api/asaas/*.php') as $f) $fonte .= file_get_contents($f);
$fonte .= file_get_contents(__DIR__ . '/asaas-sincronizar.php');
check('nenhum CUSTOMREQUEST/POST/PUT/PATCH/DELETE HTTP no conector', preg_match('/CURLOPT_(CUSTOMREQUEST|POST|PUT|UPLOAD|POSTFIELDS)|[\'"](POST|PUT|PATCH|DELETE)[\'"]\s*[,)]/', $fonte) !== 1);
check('nenhum DELETE/TRUNCATE/DROP SQL no conector', preg_match('/\b(DELETE\s+FROM|TRUNCATE|DROP\s+TABLE)\b/i', $fonte) !== 1);
check('transporte real recusa URL fora da base antes da rede', erroDe(fn() => (new AsaasTransporteCurl())->get('https://exemplo.invalid/v3/payments', $CH_A)) === 'rota_recusada');
check('transporte real recusa base parecida', erroDe(fn() => (new AsaasTransporteCurl())->get('https://api.asaas.com.evil.invalid/v3/payments', $CH_A)) === 'rota_recusada');

// ================= C. 429, 5xx, 401, 403, JSON inválido; chave nunca exposta =================
$fx = new AsaasFalso(); $cli = new AsaasCliente($fx, $CH_A, $BASE, $semSono);
$fx->fila = [['status' => 429, 'cabecalhos' => ['ratelimit-reset' => '7'], 'corpo' => ''], json200(['balance' => 10])];
$sonos = []; $d = $cli->get('saldo');
check('429 respeita RateLimit-Reset (7 s) e repete', $sonos === [7] && $d['balance'] === 10 && count($fx->chamadas) === 2);
$fx->fila = array_fill(0, 4, ['status' => 429, 'cabecalhos' => ['retry-after' => '999'], 'corpo' => '']); $sonos = [];
check('429 x4 → limite (3 esperas, teto 60 s)', erroDe(fn() => $cli->get('saldo')) === 'limite' && $sonos === [60, 60, 60]);
check('espera sem cabeçalho: recuo 5·n', AsaasCliente::espera([], 2) === 10 && AsaasCliente::espera(['retry-after' => 'abc'], 1) === 5);
$fx->fila = [['status' => 500, 'cabecalhos' => [], 'corpo' => ''], ['status' => 0, 'cabecalhos' => [], 'corpo' => ''], json200(['balance' => 1])];
check('5xx/rede: 2 novas tentativas', ($cli->get('saldo'))['balance'] === 1);
$fx->fila = array_fill(0, 3, ['status' => 502, 'cabecalhos' => [], 'corpo' => '']);
check('5xx x3 → indisponivel', erroDe(fn() => $cli->get('saldo')) === 'indisponivel');
$n0 = count($fx->chamadas); $fx->fila = [['status' => 401, 'cabecalhos' => [], 'corpo' => '']];
check('401 → chave_recusada sem repetir', erroDe(fn() => $cli->get('saldo')) === 'chave_recusada' && count($fx->chamadas) === $n0 + 1);
$fx->fila = [['status' => 403, 'cabecalhos' => [], 'corpo' => '']];
check('403 → acesso_negado', erroDe(fn() => $cli->get('saldo')) === 'acesso_negado');
$fx->fila = [['status' => 200, 'cabecalhos' => [], 'corpo' => '<html>']];
check('200 sem JSON → resposta_invalida', erroDe(fn() => $cli->get('saldo')) === 'resposta_invalida');
$fx->fila = [['status' => 400, 'cabecalhos' => [], 'corpo' => '{}']];
check('400 → resposta_invalida sem insistir', erroDe(fn() => $cli->get('saldo')) === 'resposta_invalida');
$dump = print_r($cli, true) . var_export($cli->__debugInfo(), true);
try { $cli2 = new AsaasCliente($fx, $CH_A, $BASE, $semSono); $fx->fila = [['status' => 401, 'cabecalhos' => [], 'corpo' => '']]; $cli2->get('saldo'); }
catch (AsaasErro $e) { $dump .= $e->getMessage() . $e->getTraceAsString(); }
check('chave não aparece em print_r/debug/mensagem/rastro', !str_contains($dump, 'ChaveInventadaContaA'));

// ================= D. chaves por arquivo =================
$TMP = sys_get_temp_dir() . '/asaas-conector.' . bin2hex(random_bytes(4));
if (!preg_match('#/asaas-conector\.[0-9a-f]{8}$#', $TMP) || !mkdir($TMP, 0700)) { echo "temporário falhou\n"; exit(2); }
file_put_contents("$TMP/conta-a.key", $CH_A . "\n"); file_put_contents("$TMP/conta-b.key", $CH_B . "\n");
file_put_contents("$TMP/sandbox.key", $CH_S . "\n"); file_put_contents("$TMP/quebrada.key", "nao-e-chave\n");
file_put_contents("$TMP/Maiuscula.key", $CH_A); symlink("$TMP/conta-a.key", "$TMP/link.key");
$DOC = ['conta-a' => '11111111000111', 'conta-b' => '22222222000122', 'conta-c' => '33333333000133', 'conta-m' => '44444444000144', 'sandbox' => '55555555000155'];
$prende = static function (string $r) use ($TMP, $DOC): void { file_put_contents("$TMP/$r.id", hash('sha256', $DOC[$r]) . "\n"); };
foreach (['conta-a', 'conta-b', 'sandbox'] as $r) $prende($r);
file_put_contents("$TMP/sem-id.key", '$aact_prod_000ChaveInventadaSemIdentidade::$aach_x' . "\n");
$info = static fn(string $r) => fn() => json200(['companyName' => "Empresa $r", 'cpfCnpj' => $DOC[$r]]);
$ks = new AsaasChaves($TMP);
check('rótulos: só nomes válidos e sem link', $ks->rotulos() === ['conta-a', 'conta-b', 'quebrada', 'sandbox', 'sem-id']);
check('B2: chave sem identidade presa → sem_identidade', erroDe(fn() => $ks->ler('sem-id')) === 'sem_identidade');
check('B2: identidade lida é o sha256 do documento', $ks->ler('conta-a')['identidade'] === hash('sha256', '11111111000111') && AsaasChaves::identidade(['cpfCnpj' => '11.111.111/0001-11']) === hash('sha256', '11111111000111'));
check('chave lida e ambiente produção', $ks->ler('conta-a')['ambiente'] === 'producao' && $ks->ler('conta-a')['base'] === $BASE);
check('chave hmlg → sandbox', $ks->ler('sandbox')['base'] === AsaasRotas::BASES['sandbox']);
check('conteúdo inválido → chave_invalida', erroDe(fn() => $ks->ler('quebrada')) === 'chave_invalida');
check('rótulo com barra → chave_ausente', erroDe(fn() => $ks->ler('../conta-a')) === 'chave_ausente');
check('link → chave_ausente', erroDe(fn() => $ks->ler('link')) === 'chave_ausente');
foreach (['quebrada.key', 'sandbox.key', 'Maiuscula.key', 'link.key', 'sem-id.key', 'sandbox.id'] as $f) @unlink("$TMP/$f");

// ================= E. portão HTTP: ordem =================
function deps(ArrayObject $log, array $flagG, ?array $sess, array $situ, array $flagP, ?Closure $res = null): AsaasPortaoDeps
{
    return new AsaasPortaoDeps(
        flag: function (string $k, ?int $u) use ($log, $flagG, $flagP): array { $log[] = "flag:" . ($u ?? 'g'); return $u === null ? $flagG : $flagP; },
        sessao: function () use ($log, $sess): ?array { $log[] = 'sessao'; return $sess; },
        token: fn(): string => 'tok',
        repo: new class($situ, $log) implements AsaasSessaoRepositorio {
            public function __construct(private array $s, private ArrayObject $l) {}
            public function situacao(string $t, int $u): array { $this->l[] = 'repo'; if (isset($this->s['lanca'])) throw new RuntimeException('x'); return $this->s; }
        },
        resumo: $res ?? function () use ($log): array { $log[] = 'resumo'; return ['contas' => []]; },
    );
}
$on = ['enabled' => true, 'source' => 'user_override']; $g = ['enabled' => false, 'source' => 'rollout_excluded']; $sOk = ['sessao_ativa' => true, 'usuario_ativo' => true];
foreach (['POST', 'PUT', 'DELETE', 'PATCH', 'HEAD'] as $m) { $l = new ArrayObject(); $r = AsaasPortao::atender($m, ['r' => 'resumo'], deps($l, $g, ['user_id' => 75], $sOk, $on));
    check("portão: $m → 404 sem tocar em nada", $r[0] === 404 && $l->getArrayCopy() === []); }
$l = new ArrayObject(); $r = AsaasPortao::atender('GET', ['r' => 'resumo'], deps($l, ['source' => 'not_found'], ['user_id' => 75], $sOk, $on));
check('portão: flag ausente → 404 antes da sessão', $r[0] === 404 && $l->getArrayCopy() === ['flag:g']);
$l = new ArrayObject(); $r = AsaasPortao::atender('GET', ['r' => 'resumo'], deps($l, ['source' => 'disabled'], ['user_id' => 75], $sOk, $on));
check('portão: flag desligada (kill switch) → 404', $r[0] === 404);
$l = new ArrayObject(); $r = AsaasPortao::atender('GET', ['r' => 'resumo'], deps($l, ['source' => 'error'], ['user_id' => 75], $sOk, $on));
check('portão: flag ilegível → 404', $r[0] === 404);
$l = new ArrayObject(); $r = AsaasPortao::atender('GET', ['r' => 'resumo'], deps($l, $g, null, $sOk, $on));
check('portão: sem sessão → 401', $r[0] === 401 && !in_array('resumo', $l->getArrayCopy(), true));
$l = new ArrayObject(); $r = AsaasPortao::atender('GET', ['r' => 'resumo'], deps($l, $g, ['user_id' => 75], ['sessao_ativa' => false, 'usuario_ativo' => true], $on));
check('portão: sessão revogada → 401', $r[0] === 401 && $r[1]['error']['code'] === 'SESSION_REVOKED');
$l = new ArrayObject(); $r = AsaasPortao::atender('GET', ['r' => 'resumo'], deps($l, $g, ['user_id' => 75], ['sessao_ativa' => true, 'usuario_ativo' => false], $on));
check('portão: usuário desativado → 401', $r[0] === 401);
$l = new ArrayObject(); $r = AsaasPortao::atender('GET', ['r' => 'resumo'], deps($l, $g, ['user_id' => 75], ['lanca' => 1], $on));
check('portão: conferência de sessão fora → 503', $r[0] === 503);
$l = new ArrayObject(); $r = AsaasPortao::atender('GET', ['r' => 'cobrancas'], deps($l, $g, ['user_id' => 75], $sOk, $on));
check('portão: rota desconhecida → 404', $r[0] === 404 && !in_array('resumo', $l->getArrayCopy(), true));
$l = new ArrayObject(); $r = AsaasPortao::atender('GET', ['r' => 'resumo'], deps($l, $g, ['user_id' => 12], $sOk, ['enabled' => false, 'source' => 'rollout_excluded']));
check('portão: outra pessoa (sem override) → 404, resumo não lido', $r[0] === 404 && !in_array('resumo', $l->getArrayCopy(), true));
$l = new ArrayObject(); $r = AsaasPortao::atender('GET', ['r' => 'resumo'], deps($l, $g, ['user_id' => 75], $sOk, ['enabled' => true, 'source' => 'error']));
check('portão: flag da pessoa ilegível → 404', $r[0] === 404);
$l = new ArrayObject(); $r = AsaasPortao::atender('GET', ['r' => 'resumo'], deps($l, $g, ['user_id' => '75'], $sOk, $on));
check('portão: 75 com override → 200 na ordem certa', $r[0] === 200 && $l->getArrayCopy() === ['flag:g', 'sessao', 'repo', 'flag:75', 'resumo']);
$l = new ArrayObject(); $r = AsaasPortao::atender('GET', ['r' => 'resumo'], deps($l, $g, ['user_id' => 75], $sOk, $on, function (): array { throw new PDOException('fora'); }));
check('portão: banco local fora → 503 dados_indisponiveis (nunca zero)', $r[0] === 503 && $r[1]['data'] === null && $r[1]['error']['code'] === 'dados_indisponiveis');

// ================= F. sincronização + resumo no BANCO DE VALIDAÇÃO =================
$semBanco = in_array('--sem-banco', $argv, true);
$pdo = null; $P = '';
if (!$semBanco) {
    $ini = parse_ini_file('/srv/dshow-modularizacao/atributos-web/validacao/credenciais/atrweb_val.ini', true, INI_SCANNER_RAW)['client'] ?? null;
    if (!is_array($ini)) { echo "credencial do banco de validação ilegível\n"; exit(2); }
    $dsn = isset($ini['socket']) ? "mysql:unix_socket={$ini['socket']};dbname=ATRWEB_VAL_T_13;charset=utf8mb4"
                                 : 'mysql:host=' . ($ini['host'] ?? '127.0.0.1') . ';port=' . ($ini['port'] ?? 3306) . ';dbname=ATRWEB_VAL_T_13;charset=utf8mb4';
    $pdo = new PDO($dsn, $ini['user'], $ini['password'], [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    unset($ini);
    check('banco é o de validação', $pdo->query('SELECT DATABASE()')->fetchColumn() === 'ATRWEB_VAL_T_13');
    $P = 'asaas_t' . bin2hex(random_bytes(4)) . '_';
    foreach (AsaasEsquema::ddl($P) as $sql) $pdo->exec($sql);
}
$limparBanco = function () use (&$pdo, $P): void {
    if ($pdo === null || preg_match('/^asaas_t[0-9a-f]{8}_$/', $P) !== 1) return;
    foreach (['asaas_contas', 'asaas_cobrancas', 'asaas_extrato', 'asaas_estatisticas', 'asaas_execucoes'] as $t) $pdo->exec("DROP TABLE IF EXISTS `{$P}{$t}`");
};
register_shutdown_function(function () use ($limparBanco, $TMP): void {
    $limparBanco();
    if (preg_match('#/asaas-conector\.[0-9a-f]{8}$#', $TMP) && is_dir($TMP)) { foreach (array_merge(glob("$TMP/*.key"), glob("$TMP/*.id")) as $f) unlink($f); rmdir($TMP); }
});

if ($pdo !== null) {
    $agora = new DateTimeImmutable('2026-11-23 10:00:00', new DateTimeZone('America/Sao_Paulo'));
    $cob = fn(string $id, string $st, string $v, string $criada, ?string $pago = null, ?string $liq = null) =>
        ['object' => 'payment', 'id' => $id, 'dateCreated' => $criada, 'customer' => 'cus_000001', 'value' => (float) $v, 'netValue' => $liq !== null ? (float) $liq : null,
         'billingType' => 'PIX', 'status' => $st, 'dueDate' => $criada, 'paymentDate' => $pago, 'deleted' => false, 'description' => 'NÃO GRAVAR'];
    // conta A: 250 cobranças em nov (3 páginas) + outras; mesmo payment_id que a conta C
    $novA = [];
    for ($i = 1; $i <= 250; $i++) $novA[] = $cob(sprintf('pay_a%04d', $i), 'PENDING', '10.00', '2026-11-05');
    $novA[] = $cob('pay_comum', 'RECEIVED', '1000.50', '2026-11-02', '2026-11-10', '990.25');
    $novA[] = $cob('pay_venc1', 'OVERDUE', '300.00', '2026-11-01');
    $outA = [$cob('pay_out1', 'CONFIRMED', '200.00', '2026-10-15', '2026-11-03', '195.00'), $cob('pay_out2', 'RECEIVED', '50.00', '2026-10-20', '2026-10-25')];
    $estado = ['A' => ['nov' => $novA, 'out' => $outA, 'stats' => ['PENDING' => ['quantity' => 250, 'value' => 2500.0, 'netValue' => 2450.0], 'OVERDUE' => ['quantity' => 1, 'value' => 300.0]]]];
    $apiA = new AsaasFalso();
    $apiA->rotas = [
        '/myAccount/commercialInfo' => $info('conta-a'),
        '/finance/balance' => fn() => json200(['balance' => 12345.67]),
        '/payments' => function ($p, $q) use (&$estado) {
            if (isset($q['paymentDate']['ge'])) return pagina([], $q);   // as pagas recentes já vêm na janela
            $mes = substr($q['dateCreated']['ge'] ?? '', 0, 7);
            $l = $mes === '2026-11' ? $estado['A']['nov'] : ($mes === '2026-10' ? $estado['A']['out'] : []);
            return pagina($l, $q);
        },
        '/finance/payment/statistics' => fn($p, $q) => json200($estado['A']['stats'][$q['status']]),
        '/financialTransactions' => fn($p, $q) => pagina([['object' => 'financialTransaction', 'id' => 'ftr_1', 'value' => 990.25, 'balance' => 12345.67,
                                                            'type' => 'PAYMENT_RECEIVED', 'date' => '2026-11-10', 'paymentId' => 'pay_comum', 'description' => 'NÃO GRAVAR']], $q),
    ];
    $apiB = new AsaasFalso();                      // conta B: limite sempre
    $apiB->rotas = ['/myAccount/commercialInfo' => $info('conta-b'), '/finance/balance' => fn() => ['status' => 429, 'cabecalhos' => ['ratelimit-reset' => '3'], 'corpo' => '']];
    $apiC = new AsaasFalso();                      // conta C: tudo zero DE VERDADE, mesmo payment_id da A
    $apiC->rotas = ['/myAccount/commercialInfo' => $info('conta-c'), '/finance/balance' => fn() => json200(['balance' => 0]),
        '/payments' => fn($p, $q) => pagina(($q['dateCreated']['ge'] ?? '') === '2026-09-01' ? [$cob('pay_comum', 'REFUNDED', '5.00', '2026-09-03')] : [], $q),
        '/finance/payment/statistics' => fn() => json200(['quantity' => 0, 'value' => 0]),
        '/financialTransactions' => fn($p, $q) => pagina([], $q)];
    file_put_contents("$TMP/conta-c.key", '$aact_prod_000ChaveInventadaContaC::$aach_testeC' . "\n"); $prende('conta-c');
    $apis = ['conta-a' => $apiA, 'conta-b' => $apiB, 'conta-c' => $apiC];
    $pausas = [];
    $repo = new AsaasRepositorio($pdo, $P);
    $sync = new AsaasSincronizador($repo, $ks,
        function (string $r) use ($apis, $ks, $semSono): AsaasCliente { $k = $ks->ler($r); return new AsaasCliente($apis[$r], $k['chave'], $k['base'], $semSono); },
        function (int $ms) use (&$pausas): void { $pausas[] = $ms; });
    $sonos = [];
    $res = $sync->sincronizarTodas($agora);
    check('sync: A ok, B erro limite, C ok', $res['conta-a']['resultado'] === 'ok' && $res['conta-b']['erro'] === 'limite' && $res['conta-c']['resultado'] === 'ok');
    check('sync: B respeitou o 429 (3 esperas de 3 s)', $sonos === [3, 3, 3]);
    $pg = array_values(array_filter($apiA->chamadas, fn($c) => $c['path'] === '/payments' && ($c['q']['dateCreated']['ge'] ?? '') === '2026-11-01'));
    check('páginas de 100 com offset 0/100/200', array_map(fn($c) => [$c['q']['limit'], $c['q']['offset']], $pg) === [['100', '0'], ['100', '100'], ['100', '200']]);
    check('pausa entre páginas (uma requisição por vez)', in_array(250, $pausas, true));
    check('só rotas da lista foram chamadas', array_diff(array_unique(array_merge(...array_values(array_map(fn($a) => array_column($a->chamadas, 'path'), $apis)))),
        ['/myAccount/commercialInfo', '/finance/balance', '/payments', '/finance/payment/statistics', '/financialTransactions']) === []);
    check('janela de 13 meses por mês de criação', count(array_filter($apiA->chamadas, fn($c) => $c['path'] === '/payments' && isset($c['q']['dateCreated']))) === 12 + 3);
    $n = fn(string $sql, array $a = []) => (function () use ($pdo, $sql, $a) { $s = $pdo->prepare($sql); $s->execute($a); return $s->fetchColumn(); })();
    check('uma linha por (conta, payment_id): pay_comum em A e C', (int) $n("SELECT COUNT(*) FROM `{$P}asaas_cobrancas` WHERE payment_id='pay_comum'") === 2);
    check('A: 254 cobranças gravadas', (int) $n("SELECT COUNT(*) FROM `{$P}asaas_cobrancas` WHERE conta='conta-a'") === 254);
    check('descrição NÃO é gravada (não há coluna)', !str_contains(implode(' ', $pdo->query("SHOW COLUMNS FROM `{$P}asaas_cobrancas`")->fetchAll(PDO::FETCH_COLUMN)), 'descricao'));
    check('B: estado erro, sem saldo inventado', $n("SELECT CONCAT(estado,'|',erro_codigo,'|',IFNULL(saldo,'NULL')) FROM `{$P}asaas_contas` WHERE conta='conta-b'") === 'erro|limite|NULL');

    $resumo = new AsaasResumo($pdo, $P);
    $rs = $resumo->montar(['conta-a', 'conta-b', 'conta-c'], $agora->modify('+5 minutes'));
    $porConta = array_column($rs['contas'], null, 'conta');
    $vA = $porConta['conta-a']['valores'];
    check('resumo A: saldo 12345.67', $vA['saldo'] === '12345.67');
    check('resumo A: a receber 2500.00', $vA['a_receber'] === '2500.00');
    check('resumo A: vencido 300.00 (1)', $vA['vencido'] === '300.00' && $vA['vencido_qtd'] === 1);
    check('resumo A: recebido no mês 1200.50 (out paga em nov conta; out paga em out não)', $vA['recebido_mes'] === '1200.50' && $vA['recebido_mes_liquido'] === '1185.25');
    check('resumo A: sem aviso (estatísticas batem)', $porConta['conta-a']['aviso'] === null);
    check('resumo B: indisponível, valores null, motivo erro:limite', $porConta['conta-b']['disponivel'] === false && $porConta['conta-b']['valores'] === null && $porConta['conta-b']['motivo'] === 'erro:limite');
    check('resumo C: zero DE VERDADE aparece como 0.00', $porConta['conta-c']['disponivel'] === true && $porConta['conta-c']['valores']['saldo'] === '0.00' && $porConta['conta-c']['valores']['a_receber'] === '0.00');
    check('total null quando alguma conta falhou', $rs['total'] === null && $rs['total_parcial'] === true);
    $rs2 = $resumo->montar(['conta-a', 'conta-c'], $agora->modify('+5 minutes'));
    check('total soma em centavos quando todas disponíveis', $rs2['total'] === ['saldo' => '12345.67', 'a_receber' => '2500.00', 'vencido' => '300.00', 'recebido_mes' => '1200.50']);
    check('conta sem nenhuma sincronização: nunca_sincronizada', $resumo->montar(['conta-z'], $agora)['contas'][0]['motivo'] === 'nunca_sincronizada');

    // 2ª rodada: pay_a0250 sumiu da janela de nov → ausente (lógico), não apagada; estatística diverge → aviso
    array_splice($estado['A']['nov'], 249, 1);
    $estado['A']['stats']['PENDING'] = ['quantity' => 250, 'value' => 2500.0];
    $res2 = $sync->sincronizar('conta-a', $agora->modify('+1 hour'));
    check('2ª rodada ok, gravou na geração 1', $res2['resultado'] === 'ok' && $res2['geracao'] === 1);
    check('sumida não está no retrato novo e continua no banco (geração anterior)', (int) $n("SELECT COUNT(*) FROM `{$P}asaas_cobrancas` WHERE conta='conta-a' AND geracao=1 AND payment_id='pay_a0250'") === 0
        && (int) $n("SELECT COUNT(*) FROM `{$P}asaas_cobrancas` WHERE conta='conta-a' AND geracao=0 AND payment_id='pay_a0250'") === 1);
    $r2 = array_column($resumo->montar(['conta-a'], $agora->modify('+65 minutes'))['contas'], null, 'conta')['conta-a'];
    check('ausente sai do a receber (2490.00)', $r2['valores']['a_receber'] === '2490.00');
    check('divergência com a estatística do Asaas vira aviso, não troca o número', str_contains((string) $r2['aviso'], 'divergencia_pending'));

    // B1 (Codex DSHOW-111) TESTE DECISIVO: 3ª rodada INTERROMPIDA depois da 1ª página (saldo novo já lido, 100 cobranças novas já gravadas)
    $retrato2 = array_column($resumo->montar(['conta-a'], $agora->modify('+95 minutes'))['contas'], null, 'conta')['conta-a'];
    $pag1 = []; for ($i = 1; $i <= 100; $i++) $pag1[] = $cob(sprintf('pay_n%04d', $i), 'RECEIVED', '777.77', '2025-12-02', '2026-11-20');
    $apiA->fila = [json200(['companyName' => 'Empresa conta-a', 'cpfCnpj' => $DOC['conta-a']]), json200(['balance' => 99999.99]),
                   json200(['object' => 'list', 'hasMore' => true, 'totalCount' => 300, 'limit' => 100, 'offset' => 0, 'data' => $pag1]),
                   ['status' => 503, 'cabecalhos' => [], 'corpo' => ''], ['status' => 503, 'cabecalhos' => [], 'corpo' => ''], ['status' => 503, 'cabecalhos' => [], 'corpo' => '']];
    $res3 = $sync->sincronizar('conta-a', $agora->modify('+90 minutes'));
    check('3ª rodada: interrompida na 2ª página (indisponivel)', $res3['erro'] === 'indisponivel');
    check('a 1ª página da rodada interrompida foi gravada só na geração INATIVA', (int) $n("SELECT COUNT(*) FROM `{$P}asaas_cobrancas` WHERE conta='conta-a' AND geracao=0 AND payment_id LIKE 'pay_n%'") === 100
        && (int) $n("SELECT COUNT(*) FROM `{$P}asaas_cobrancas` WHERE conta='conta-a' AND geracao=1 AND payment_id LIKE 'pay_n%'") === 0);
    $r3 = array_column($resumo->montar(['conta-a'], $agora->modify('+95 minutes'))['contas'], null, 'conta')['conta-a'];
    check('DECISIVO B1: o painel mostra o MESMO retrato completo de antes (valores e horário)', $r3['valores'] === $retrato2['valores'] && $r3['atualizado_em'] === $retrato2['atualizado_em'],
        json_encode([$r3['valores'], $retrato2['valores']]));
    check('DECISIVO B1: saldo continua o do retrato completo (não o 99999.99 da rodada interrompida)', $r3['valores']['saldo'] === '12345.67');
    check('DECISIVO B1: sucesso NÃO marcado (geração ativa e horário de antes)', (int) $n("SELECT geracao_ativa FROM `{$P}asaas_contas` WHERE conta='conta-a'") === 1
        && $n("SELECT ultima_sync_ok FROM `{$P}asaas_contas` WHERE conta='conta-a'") === $agora->modify('+1 hour')->format('Y-m-d H:i:s'));
    check('após falha, dentro de 3 h: valores reais + aviso de falha', $r3['disponivel'] === true && str_contains((string) $r3['aviso'], 'ultima_tentativa_falhou:indisponivel'));
    $r4 = array_column($resumo->montar(['conta-a'], $agora->modify('+5 hours'))['contas'], null, 'conta')['conta-a'];
    check('sem sincronização boa há > 3 h: null + desatualizada (nunca zero)', $r4['disponivel'] === false && $r4['valores'] === null && $r4['motivo'] === 'desatualizada');
    check('execuções registradas (ok/erro)', $n("SELECT GROUP_CONCAT(resultado ORDER BY id) FROM `{$P}asaas_execucoes` WHERE conta='conta-a'") === 'ok,ok,erro');
    // ciclo completo seguinte: vira a geração 0; as linhas da rodada interrompida que não vieram de novo ficam presente=0 (nada apagado)
    $res4 = $sync->sincronizar('conta-a', $agora->modify('+6 hours'));
    check('4ª rodada completa troca o retrato (geração 0)', $res4['resultado'] === 'ok' && $res4['geracao'] === 0 && (int) $n("SELECT geracao_ativa FROM `{$P}asaas_contas` WHERE conta='conta-a'") === 0);
    check('linhas da rodada interrompida não entram no retrato novo (presente=0) e não foram apagadas',
        (int) $n("SELECT COUNT(*) FROM `{$P}asaas_cobrancas` WHERE conta='conta-a' AND geracao=0 AND payment_id LIKE 'pay_n%' AND presente=0") === 100);
    $r5 = array_column($resumo->montar(['conta-a'], $agora->modify('+6 hours'))['contas'], null, 'conta')['conta-a'];
    check('retrato novo correto (a receber 2490.00, recebido 1200.50)', $r5['valores']['a_receber'] === '2490.00' && $r5['valores']['recebido_mes'] === '1200.50', json_encode($r5['valores']));
    // B2 (Codex DSHOW-111) no conector: rótulo preso a OUTRA empresa → não sincroniza, nada gravado, painel sem números
    $antesC = (int) $n("SELECT COUNT(*) FROM `{$P}asaas_cobrancas` WHERE conta='conta-c'");
    file_put_contents("$TMP/conta-c.id", hash('sha256', $DOC['conta-a']) . "\n");   // chave de C num rótulo preso à empresa A
    $resC = $sync->sincronizar('conta-c', $agora->modify('+6 hours'));
    check('TROCA CRUZADA no conector: conta_divergente', $resC['erro'] === 'conta_divergente', json_encode($resC));
    check('troca cruzada: nenhuma cobrança nova gravada', (int) $n("SELECT COUNT(*) FROM `{$P}asaas_cobrancas` WHERE conta='conta-c'") === $antesC);
    check('troca cruzada: só a identidade foi consultada (nem o saldo)', end($apiC->chamadas)['path'] === '/myAccount/commercialInfo');
    $rc = array_column($resumo->montar(['conta-c'], $agora->modify('+6 hours'))['contas'], null, 'conta')['conta-c'];
    check('troca cruzada: painel sem números, motivo conta_divergente', $rc['disponivel'] === false && $rc['valores'] === null && $rc['motivo'] === 'conta_divergente');

    // resposta malformada no meio da paginação: erro, nada vira zero
    $apiM = new AsaasFalso(); $apiM->rotas = ['/myAccount/commercialInfo' => $info('conta-m'), '/finance/balance' => fn() => json200(['balance' => 'abc'])];
    $apis['conta-m'] = $apiM; file_put_contents("$TMP/conta-m.key", '$aact_prod_000ChaveInventadaContaM::$aach_testeM' . "\n"); $prende('conta-m');
    $syncM = new AsaasSincronizador($repo, $ks, function (string $r) use ($apis, $ks, $semSono): AsaasCliente { $k = $ks->ler($r); return new AsaasCliente($apis[$r], $k['chave'], $k['base'], $semSono); }, fn(int $ms) => null);
    check('saldo não numérico → erro resposta_invalida', $syncM->sincronizar('conta-m', $agora)['erro'] === 'resposta_invalida');
    $apiM->rotas = ['/myAccount/commercialInfo' => $info('conta-m'), '/finance/balance' => fn() => json200(['balance' => 1]), '/payments' => fn($p, $q) => json200(['hasMore' => true, 'data' => []])];
    check('hasMore sem itens → erro (sem laço infinito)', $syncM->sincronizar('conta-m', $agora)['erro'] === 'resposta_invalida');
    $apiM->rotas = ['/myAccount/commercialInfo' => $info('conta-m'), '/finance/balance' => fn() => json200(['balance' => 1]), '/payments' => fn($p, $q) => json200(['hasMore' => true, 'data' => [$cob('pay_x' . $q['offset'], 'PENDING', '1', '2026-11-01')]])];
    check('volume inesperado (200 páginas) → erro', $syncM->sincronizar('conta-m', $agora)['erro'] === 'volume_inesperado');
}

// ================= H. CONFERÊNCIA (portão de ativação): os 11 rótulos, total e detalhe por empresa =================
require_once __DIR__ . '/../../api/asaas/AsaasConferencia.php';
$ONZE = ['zenthra', 'astrelux', 'lunvox', 'loja-painel-led', 'led-lovers', 'j-carvalho', 'jwa', 'a-marques', 'gav', 'neoled', 'rovic'];
check('os 11 rótulos passam na regra do script e do conector', count(array_filter($ONZE, fn($r) => preg_match(AsaasChaves::RE_ROTULO, $r) === 1)) === 11);
$disp = fn(string $r, string $saldo) => ['conta' => $r, 'nome' => 'Empresa ' . strtoupper($r), 'disponivel' => true, 'atualizado_em' => '2026-11-23T13:05:00+00:00', 'aviso' => null, 'motivo' => null,
    'valores' => ['saldo' => $saldo, 'a_receber' => '100.00', 'vencido' => '10.50', 'vencido_qtd' => 2, 'recebido_mes' => '1000.00', 'recebido_mes_liquido' => '980.01']];
$todas = ['contas' => array_map(fn($r) => $disp($r, '1234.56'), $ONZE), 'total' => ['saldo' => '13580.16', 'a_receber' => '1100.00', 'vencido' => '115.50', 'recebido_mes' => '11000.00'], 'total_parcial' => false];
$tx = AsaasConferencia::texto($todas);
check('conferência: uma seção por empresa (11) + TOTAL com os 4 números', substr_count($tx, ' · Empresa ') === 11 && str_contains($tx, 'TOTAL (11 empresa(s)): saldo R$ 13.580,16 · a receber R$ 1.100,00 · vencido R$ 115,50 · recebido no mês R$ 11.000,00'), $tx);
check('conferência: valores em reais, hora de Brasília', str_contains($tx, "zenthra · Empresa ZENTHRA · sincronizada 23/11 10:05\n  saldo ............ R$ 1.234,56") && str_contains($tx, 'R$ 10,50 em 2 cobrança(s)') && str_contains($tx, '(líquido R$ 980,01)'));
$parcial = $todas; $parcial['total'] = null; $parcial['total_parcial'] = true;
$parcial['contas'][1] = ['conta' => 'astrelux', 'nome' => null, 'disponivel' => false, 'valores' => null, 'atualizado_em' => null, 'aviso' => null, 'motivo' => 'nunca_sincronizada'];
$parcial['contas'][2] = ['conta' => 'lunvox', 'nome' => 'Lunvox', 'disponivel' => false, 'valores' => null, 'atualizado_em' => null, 'aviso' => null, 'motivo' => 'conta_divergente'];
$tp = AsaasConferencia::texto($parcial);
check('conferência: empresa sem números → "sem números" + motivo, nunca 0', str_contains($tp, "astrelux · (nome ainda não lido)\n  sem números: ainda não sincronizada") && str_contains($tp, 'lunvox · Lunvox') && str_contains($tp, 'identidade não confere'));
check('conferência: total indisponível com empresa faltando (nunca soma parcial)', str_contains($tp, 'TOTAL (11 empresa(s)): indisponível — 2 empresa(s) sem números') && !str_contains($tp, 'R$ 13.580,16'));
check('conferência: --conta mostra só a empresa, sem TOTAL', ($t1 = AsaasConferencia::texto($todas, 'gav')) === AsaasConferencia::texto(['contas' => [$disp('gav', '1234.56')]], 'gav') && !str_contains($t1, 'TOTAL') && substr_count($t1, ' · Empresa ') === 1);
check('conferência: negativos e centavos', AsaasConferencia::brl('-0.5') === '-R$ 0,50' && AsaasConferencia::brl('1000000') === 'R$ 1.000.000,00' && AsaasConferencia::brl(null) === '—');
if ($pdo !== null) {
    $tx2 = AsaasConferencia::texto($resumo->montar(['conta-a', 'conta-b', 'conta-c'], $agora->modify('+5 minutes')));
    check('conferência sobre o resumo REAL do banco de validação: monta sem erro e sem chave', str_contains($tx2, 'TOTAL (3 empresa(s))') && !str_contains($tx2, '$aact_'));
}
$srcC = (string) file_get_contents(__DIR__ . '/../../api/asaas/AsaasConferencia.php') . (string) file_get_contents(__DIR__ . '/asaas-conferir.php');
check('conferência: só leitura (sem INSERT/UPDATE/DELETE, sem cliente HTTP)', preg_match('/\b(INSERT|UPDATE|DELETE|curl_|AsaasCliente|sincronizar)\b/', $srcC) === 0);

echo 'teste-asaas-conector: ', $ok, ' ok, ', count($falhas), " falha(s)", $semBanco ? ' (sem banco)' : '', "\n";
exit($falhas === [] ? 0 : 1);
