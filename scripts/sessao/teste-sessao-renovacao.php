<?php
// DSHOW-110 (decisão do Jhony, 23/11) — bateria dirigida de SESSÃO no servidor: os 12 cenários + regressões. Um cenário por processo
// (a sessão PHP é estado global). "Nova requisição" = caches do SessionGate e do SessaoRegistro zerados, como no começo de um pedido.
//  1 renovacao-automatica   2 renovacao-explicita   3 revogacao-apos-renovacao   4 revogacao-sem-renovacao   5 logout-confirmado
//  6 logout-falha-csrf (servidor; a falha de REDE é do cliente: teste-logout-cliente.mjs)   7 duas-abas   8 logout-concorrente-refresh
//  9 duas-renovacoes   10 falha-persistencia   11 recuperacao-encerrada   12 proxy-fotos-revogada
//  13 check-banco-fora (P2-1: check.php com o banco fora = 503, nunca "não autenticado")
//  14 logout-banco-fora (Codex DSHOW-113 P1-C: logout com o banco fora NÃO conclui; de volta, revoga de verdade, inclusive na 2ª aba)
//  regressões: login, revogar-tudo, sessao-antiga-sem-registro
// Banco: SÓ a conexão de validação (ATRWEB_VAL_*), com TABELAS TEMPORÁRIAS app_users/app_user_sessions (somem ao fim do processo).
// Sessões PHP: rode por rodar-teste-sessao.sh (pasta de sessões isolada por unshare -m). Uso: php teste-sessao-renovacao.php <raiz> <caso>
declare(strict_types=1);
ob_start();
[$_, $RAIZ, $CASO] = $argv + [null, null, null];
$CRED = getenv('ATRWEB_CRED') ?: '';
if (!$RAIZ || !$CASO || !is_file("$RAIZ/api/core/SessionGate.php") || !is_file($CRED)) { fwrite(STDERR, "uso: ATRWEB_CRED=<ini> php teste-sessao-renovacao.php <raiz> <caso>\n"); exit(2); }
$_SERVER['HTTP_USER_AGENT'] = 'teste-sessao/1.0'; $_SERVER['REMOTE_ADDR'] = '127.0.0.1'; $_SERVER['HTTP_HOST'] = 'validacao.local';
ini_set('session.use_cookies', '0'); ini_set('session.use_only_cookies', '0'); ini_set('session.cache_limiter', '');

// a MESMA getConnection() da validação (ATRWEB_VAL_*, credencial por ATRWEB_CRED)
require_once getenv('ATRWEB_DB_CONNECTION') ?: '/srv/dshow-modularizacao/atributos-web/validacao/config/db_connection.php';
$pdo = getConnection('DSHOWDASH');
$base = (string) $pdo->query('SELECT DATABASE()')->fetchColumn();
if (!str_starts_with($base, 'ATRWEB_VAL_')) { fwrite(STDERR, "recusado: base $base fora de ATRWEB_VAL_\n"); exit(2); }
$pdo->exec("CREATE TEMPORARY TABLE app_users (id INT UNSIGNED PRIMARY KEY, username VARCHAR(100), email VARCHAR(190), status VARCHAR(20), created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3), deleted_at DATETIME(3) NULL)");
$pdo->exec("CREATE TEMPORARY TABLE app_user_sessions (id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, user_id INT UNSIGNED NOT NULL, session_token VARCHAR(255) NOT NULL,
  csrf_token VARCHAR(255) NULL, device_type VARCHAR(50) NULL, browser VARCHAR(100) NULL, os VARCHAR(100) NULL, origin_ip VARCHAR(45) NULL, is_active TINYINT(1) DEFAULT 1,
  expires_at DATETIME(3) NOT NULL, last_activity_at DATETIME(3) NULL, logout_at DATETIME(3) NULL, logout_reason VARCHAR(50) NULL,
  created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3), updated_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3), deleted_at DATETIME(3) NULL,
  ip_user VARCHAR(45) NULL, UNIQUE KEY uk_session_token (session_token))");
$U = 990199;
$pdo->prepare("INSERT INTO app_users (id, username, email, status) VALUES (?, 'sessao.sintetico', 'sessao.sintetico@validacao.invalid', 'active')")->execute([$U]);

require_once "$RAIZ/api/core/SessionGate.php";
require_once "$RAIZ/api/_helpers/AuthHelpers.php";
require_once "$RAIZ/api/auth/services/AuthService.php";
require_once "$RAIZ/api/auth/validators/ValidatorBase.php";
require_once "$RAIZ/api/core/repositories/UserSessionsRepository.php";
require_once "$RAIZ/api/midia/FotosCanal.php";
require_once "$RAIZ/api/midia/FotosSessao.php";
if (class_exists('SessaoRegistro')) SessaoRegistro::definirConexao(fn () => $pdo);

$ok = 0; $falhas = 0;
$afirma = function (string $n, bool $c, string $x = '') use (&$ok, &$falhas) { if ($c) { $ok++; echo "ok    $n\n"; } else { $falhas++; echo "FALHA $n" . ($x ? " · $x" : '') . "\n"; } };
$novaRequisicao = function () {
    (function () { self::$_sessionCache = null; self::$_readOnlyCache = []; })->bindTo(null, SessionGate::class)();
    if (class_exists('SessaoRegistro')) SessaoRegistro::limparCache();
};
// outra requisição chegando com o cookie de id $id (sessão do PHP relida do arquivo)
$chegaCom = function (string $id) use ($novaRequisicao) {
    if (session_status() === PHP_SESSION_ACTIVE) session_write_close();
    (function () { self::$_initialized = false; })->bindTo(null, SessionGate::class)();
    $_SESSION = []; session_id($id); $novaRequisicao(); SessionGate::start();
};
$valida = function () use ($novaRequisicao) { $novaRequisicao(); return SessionGate::validate(); };
$proxy = function () use ($pdo, $novaRequisicao): string { $novaRequisicao(); try { FotosSessao::exigir(SessionGate::validate(), session_id(), new FotosSessaoPdo($pdo)); return 'aceita'; } catch (FotosErro $e) { return $e->codigo . '|' . $e->http; } };
$linha = function (string $tok) use ($pdo) { $s = $pdo->prepare('SELECT id, user_id, session_token, csrf_token, is_active, logout_reason FROM app_user_sessions WHERE session_token = ?'); $s->execute([$tok]); return $s->fetch() ?: null; };
$ativas = fn () => (int) $pdo->query("SELECT COUNT(*) FROM app_user_sessions WHERE user_id = $U AND is_active = 1")->fetchColumn();
$ociosa = function () { $_SESSION['last_activity'] = time() - 3700; };
$entrar = function () use ($pdo, $U) {   // login como o AuthService faz: SessionGate::create + registro com o session_id() atual
    SessionGate::create(['id' => $U, 'level' => 1, 'roles' => [], 'email' => 'sessao.sintetico@validacao.invalid', 'name' => 'Sessão Sintético']);
    (new AuthRepository($pdo))->createSession(session_id(), $U, (string) $_SESSION['csrf'], ['device_type' => 'desktop', 'browser' => 'teste', 'os' => 'linux'], '127.0.0.1', time() + 604800);
    return session_id();
};
$revogar = function (string $tok) use ($pdo, $linha) { $l = $linha($tok); return $l && (new UserSessionsRepository($pdo))->terminateSession((int) $l['id'], 'admin_terminated'); };

switch ($CASO) {
case 'renovacao-automatica': {
    $t0 = $entrar(); $ociosa(); $s = $valida(); $t1 = session_id();
    $afirma('validate() de sessão ociosa > 1 h renova o id e continua autenticada', $t1 !== $t0 && ($s['user_id'] ?? 0) == $U);
    $afirma('o MESMO registro acompanhou o id novo (token novo ativo; antigo não existe; 1 ativa)', ($linha($t1)['is_active'] ?? 0) == 1 && $linha($t0) === null && $ativas() === 1);
    $afirma('próxima requisição com o id novo: validate OK e proxy das fotos ACEITA', ($valida()['user_id'] ?? 0) == $U && $proxy() === 'aceita', $proxy());
    break; }
case 'renovacao-explicita': {
    $t0 = $entrar(); $r = (new AuthService($pdo))->refreshSession($U, $t0, '127.0.0.1'); $t1 = session_id();
    $afirma('refreshSession responde sucesso e troca o id', ($r['success'] ?? false) === true && $t1 !== $t0, 'success=' . var_export($r['success'] ?? null, true));
    $afirma('o registro passa ao token NOVO com o csrf devolvido; antigo não existe', ($l = $linha($t1)) !== null && $l['is_active'] == 1 && $l['csrf_token'] === ($r['data']['csrf_token'] ?? '#') && $linha($t0) === null);
    $afirma('renovação explícita: validate OK e proxy aceita', ($valida()['user_id'] ?? 0) == $U && $proxy() === 'aceita', $proxy());
    break; }
case 'revogacao-apos-renovacao': {
    $t0 = $entrar(); $ociosa(); $valida(); $t1 = session_id();
    $afirma('revogar pela tela de Sessões alcança a sessão RENOVADA', $t1 !== $t0 && $revogar($t1));
    $chegaCom($t1);
    $afirma('gate comum (SessionGate::validate) NEGA a sessão revogada', $valida() === null);
    $chegaCom($t1);
    $afirma('AuthHelpers (getCurrentUser / isAuthenticated) negam', getCurrentUser() === null && isAuthenticated() === false);
    $afirma('readOnly (status, verify) nega', SessionGate::readOnly($t1) === []);
    $afirma('a sessão do PHP foi encerrada (novo login exigido)', empty($_SESSION['user_id']));
    break; }
case 'revogacao-sem-renovacao': {
    $t0 = $entrar();
    $afirma('revogar sessão recém-criada', $revogar($t0));
    $chegaCom($t0);
    $afirma('gate comum nega a sessão revogada (sem renovação)', $valida() === null);
    $chegaCom($t0);
    $afirma('AuthHelpers negam', getCurrentUser() === null && isAuthenticated() === false);
    $afirma('nenhuma sessão ativa do usuário; registro continua revogado', $ativas() === 0 && ($linha($t0)['is_active'] ?? 1) == 0);
    break; }
case 'logout-confirmado': {
    $t0 = $entrar(); $r = (new AuthService($pdo))->logout($U, $t0, '127.0.0.1');
    $afirma('logout responde sucesso', ($r['success'] ?? false) === true, 'success=' . var_export($r['success'] ?? null, true));
    $afirma('o registro fica INATIVO com motivo logout (histórico preservado)', ($l = $linha($t0)) !== null && $l['is_active'] == 0 && $l['logout_reason'] === 'logout', 'is_active=' . ($linha($t0)['is_active'] ?? 'sem linha'));
    $afirma('a sessão do PHP foi destruída', session_status() !== PHP_SESSION_ACTIVE || empty($_SESSION['user_id']));
    $chegaCom($t0);
    $afirma('requisição seguinte com o mesmo cookie: negada', $valida() === null && $proxy() !== 'aceita');
    break; }
case 'logout-falha-csrf': {
    $t0 = $entrar(); $csrf = (string) $_SESSION['csrf'];
    $afirma('logout com CSRF errado é RECUSADO pelo servidor (403)', (ValidatorBase::validateCsrf('csrf-errado-sintetico', $csrf)['code'] ?? 0) === 403);
    $afirma('logout sem CSRF é RECUSADO (403)', (ValidatorBase::validateCsrf(null, $csrf)['code'] ?? 0) === 403);
    $afirma('depois da recusa a sessão continua válida no servidor (o cliente não pode dizer que saiu)', ($valida()['user_id'] ?? 0) == $U && ($linha($t0)['is_active'] ?? 0) == 1);
    break; }
case 'duas-abas': {
    $t0 = $entrar(); session_write_close();
    $chegaCom($t0); $afirma('aba B, antes: autenticada com o mesmo cookie', ($valida()['user_id'] ?? 0) == $U);
    $chegaCom($t0); $r = (new AuthService($pdo))->logout($U, $t0, '127.0.0.1');
    $afirma('aba A sai (logout confirmado)', ($r['success'] ?? false) === true);
    $chegaCom($t0);
    $afirma('aba B reconhece na PRÓXIMA chamada: validate nega e proxy recusa', $valida() === null && $proxy() !== 'aceita');
    break; }
case 'logout-concorrente-refresh': {
    $t0 = $entrar(); $dados = $_SESSION;
    $r = (new AuthService($pdo))->logout($U, $t0, '127.0.0.1');
    $afirma('logout confirmado', ($r['success'] ?? false) === true);
    // refresh ATRASADO: a requisição leu a sessão antes do logout e só agora tenta renovar
    $chegaCom($t0); $_SESSION = $dados;
    $rr = (new AuthService($pdo))->refreshSession($U, $t0, '127.0.0.1');
    $afirma('refresh atrasado é RECUSADO (401)', ($rr['success'] ?? true) === false && ($rr['code'] ?? 0) === 401, 'success=' . var_export($rr['success'] ?? null, true) . ' code=' . ($rr['code'] ?? '?'));
    $afirma('nada foi reativado: 0 sessões ativas, registro continua inativo', $ativas() === 0 && ($linha($t0)['is_active'] ?? 1) == 0);
    $afirma('a sessão do PHP do refresh atrasado também foi encerrada', empty($_SESSION['user_id']));
    break; }
case 'duas-renovacoes': {
    $t0 = $entrar();
    // a OUTRA requisição renovou primeiro (o registro já está no id dela)
    $afirma('1ª renovação troca o registro (exatamente 1 linha)', SessaoRegistro::trocar($t0, 'id-da-outra-requisicao-sintetico', $U));
    $afirma('2ª troca com o MESMO id anterior falha (0 linhas)', !SessaoRegistro::trocar($t0, 'id-perdedor-sintetico', $U));
    $ociosa(); $s = $valida();   // esta requisição (ainda com t0) tenta renovar
    $afirma('a renovação perdedora NÃO fica válida sem registro (sessão encerrada)', $s === null && empty($_SESSION['user_id']));
    $afirma('exatamente 1 registro ativo (o da renovação vencedora), nada duplicado', $ativas() === 1 && ($linha('id-da-outra-requisicao-sintetico')['is_active'] ?? 0) == 1);
    break; }
case 'falha-persistencia': {
    $t0 = $entrar();
    $chamadas = 0;   // 1ª chamada (consulta) funciona; a gravação da troca falha
    SessaoRegistro::definirConexao(function () use ($pdo, &$chamadas) { if (++$chamadas > 1) throw new RuntimeException('banco fora (sintético)'); return $pdo; });
    $ociosa(); $s = $valida();
    $afirma('renovação sem gravação do registro: a sessão renovada NÃO fica válida', $s === null && empty($_SESSION['user_id']));
    SessaoRegistro::definirConexao(function () { throw new RuntimeException('banco fora (sintético)'); });
    $entrar();   // (o registro aqui é criado pelo PDO direto; o que falha é a CONSULTA do gate)
    $afirma('falha de CONSULTA não autoriza (gate nega)', $valida() === null);
    SessaoRegistro::definirConexao(fn () => $pdo);
    $afirma('…e não destrói: com o banco de volta a sessão vale', ($valida()['user_id'] ?? 0) == $U);
    // login sem conseguir gravar o registro: conexão numa base de validação SEM app_user_sessions (ATRWEB_VAL_EQ) → a gravação falha
    $c = parse_ini_file($CRED, true, INI_SCANNER_RAW)['client'] ?? [];
    $pdo2 = new PDO('mysql:unix_socket=' . ($c['socket'] ?? '') . ';dbname=ATRWEB_VAL_EQ;charset=utf8mb4', $c['user'] ?? '', $c['password'] ?? '', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    unset($c);
    $svc = new AuthService($pdo2);
    $m = new ReflectionMethod($svc, 'createUserSession'); $m->setAccessible(true);
    $res = $m->invoke($svc, ['id' => $U, 'username' => 'sessao.sintetico', 'email' => 'x@validacao.invalid', 'nome' => 'S', 'nome_completo' => 'S', 'nome_resumido' => 'S', 'avatar_url' => null, 'departamento' => null, 'funcao' => null, 'locale' => 'pt-BR', 'created_at' => '2026-01-01'],
        ['roles' => [], 'maxLevel' => 1, 'permissions' => [], 'accessMode' => 'standard'], '127.0.0.1', ['device_type' => 'desktop', 'browser' => 'teste', 'os' => 'linux']);
    $afirma('login que NÃO grava o registro não concede sessão (createUserSession → null; sessão do PHP encerrada)', $res === null && empty($_SESSION['user_id']), 'retorno=' . gettype($res));
    break; }
case 'recuperacao-encerrada': {
    $t0 = $entrar(); session_write_close();
    $chegaCom($t0); SessionRecovery::createBackup($t0); session_write_close();
    (new FileSessionStorage('/var/lib/php/sessions'))->destroy($t0); $novaRequisicao();
    $afirma('controle: sem o arquivo da sessão, a recuperação do backup devolve a sessão ATIVA', (SessionGate::readOnly($t0)['user_id'] ?? 0) == $U);
    $revogar($t0); $novaRequisicao();
    $afirma('a recuperação de sessão REVOGADA consulta o registro e devolve vazio', SessionGate::readOnly($t0) === []);
    (function () { self::$_initialized = false; })->bindTo(null, SessionGate::class)(); $_SESSION = []; session_id('');
    $t1 = $entrar(); session_write_close(); SessionRecovery::createBackup($t1);
    $chegaCom($t1); (new AuthService($pdo))->logout($U, $t1, '127.0.0.1'); $novaRequisicao();
    $afirma('recuperação de sessão ENCERRADA por logout devolve vazio', SessionGate::readOnly($t1) === []);
    break; }
case 'proxy-fotos-revogada': {
    $t0 = $entrar();
    $afirma('antes: o proxy das fotos aceita', $proxy() === 'aceita', $proxy());
    $revogar($t0); $chegaCom($t0);
    $p = $proxy();
    $afirma('depois da revogação o proxy das fotos RECUSA com 401', $p !== 'aceita' && str_ends_with($p, '|401'), $p);
    break; }
case 'login': {
    $t0 = $entrar();
    $afirma('login grava o registro com o session_id() atual', ($linha($t0)['user_id'] ?? null) == $U);
    $afirma('login: gate comum, AuthHelpers e proxy aceitam', ($valida()['user_id'] ?? 0) == $U && (getCurrentUser()['id'] ?? 0) == $U && $proxy() === 'aceita', $proxy());
    break; }
case 'revogar-tudo': {
    $t0 = $entrar();
    $n = (new UserSessionsRepository($pdo))->terminateAllUserSessions($U, 'admin_terminated_all');
    $chegaCom($t0);
    $afirma('revogar todas encerra 1 registro e o gate nega na requisição seguinte', $n === 1 && $valida() === null);
    break; }
case 'sessao-antiga-sem-registro': {
    SessionGate::create(['id' => $U, 'level' => 1, 'roles' => [], 'email' => 'x@validacao.invalid', 'name' => 'S']);   // sessão do PHP SEM registro
    $t0 = session_id();
    $afirma('sessão antiga sem registro: o gate nega e encerra (exige novo login)', $valida() === null && empty($_SESSION['user_id']));
    $afirma('nenhum registro foi criado por isso', $linha($t0) === null && $ativas() === 0);
    break; }
case 'logout-banco-fora': {   // Codex DSHOW-113 (P1-C): contraprova obrigatória, lado do servidor
    $t0 = $entrar(); $fora = function () { SessaoRegistro::definirConexao(function () { throw new RuntimeException('banco fora (sintético)'); }); };
    $fora();
    $r = (new AuthService($pdo))->logout($U, $t0, '127.0.0.1');
    $afirma('banco fora: o logout NÃO conclui (LOGOUT_NOT_PERSISTED, 503)', $r['success'] === false && $r['error'] === 'LOGOUT_NOT_PERSISTED' && $r['code'] === 503, json_encode($r));
    $afirma('…nada foi destruído pela metade: sessão do PHP intacta e registro ainda ativo', ($_SESSION['user_id'] ?? 0) == $U && ($linha($t0)['is_active'] ?? 0) == 1);
    SessaoRegistro::definirConexao(fn () => $pdo);
    $afirma('banco de volta: a sessão continua válida (o "Sair" anterior não foi dado como feito)', ($valida()['user_id'] ?? 0) == $U);
    $r = (new AuthService($pdo))->logout($U, $t0, '127.0.0.1');
    $afirma('logout de novo com o banco de volta → sucesso e registro INATIVO (logout)', $r['success'] === true && ($linha($t0)['is_active'] ?? 1) == 0 && ($linha($t0)['logout_reason'] ?? '') === 'logout', json_encode($r));
    $chegaCom($t0);   // segunda aba: o MESMO cookie, outra requisição
    $afirma('segunda aba com o cookie antigo: o gate nega, a leitura só-leitura dá vazio e o proxy das fotos recusa', $valida() === null && SessionGate::readOnly($t0) === [] && $proxy() !== 'aceita', $proxy());
    // destroy() com o banco fora (sessão expirada, por exemplo): o registro não encerra → NÃO pode ficar backup que a reviva depois
    (function () { self::$_initialized = false; })->bindTo(null, SessionGate::class)(); $_SESSION = []; session_id('');
    $t1 = $entrar(); session_write_close(); $chegaCom($t1);   // requisição seguinte: o arquivo da sessão já está gravado no disco (como em produção)
    $fora(); SessionGate::destroy(); SessaoRegistro::definirConexao(fn () => $pdo); $novaRequisicao();
    $afirma('destroy() com o banco fora: o registro continua ativo (não deu para gravar)…', ($linha($t1)['is_active'] ?? 0) == 1);
    $afirma('…mas não fica backup: com o banco de volta a sessão NÃO revive pela recuperação', SessionRecovery::attemptRecovery($t1) === null && SessionGate::readOnly($t1) === []);
    // encerrar() só confirma com prova de que não sobrou registro ativo
    $t2 = $linha($t1)['session_token'];
    $afirma('encerrar() com o banco ok: confirma e não sobra ativo', SessaoRegistro::encerrar($t2, $U, 'teste') === true && ($linha($t2)['is_active'] ?? 1) == 0);
    $pdo->prepare('INSERT INTO app_user_sessions (user_id, session_token, is_active, expires_at) VALUES (?, ?, 1, NOW() + INTERVAL 1 DAY)')->execute([$U + 1, 'sintetico-outro-titular-' . bin2hex(random_bytes(4))]);
    $t3 = (string) $pdo->query("SELECT session_token FROM app_user_sessions WHERE user_id = " . ($U + 1))->fetchColumn();
    $afirma('encerrar() pelo titular ERRADO não afeta a linha e devolve false (sobrou ativo)', SessaoRegistro::encerrar($t3, $U, 'teste') === false && ($linha($t3)['is_active'] ?? 0) == 1);
    break; }
case 'check-banco-fora': {   // P2-1 (revisão da ACIMA_DIREITA, 24/11): check.php com a consulta do registro falhando → 503, nunca "não autenticado"
    $t0 = $entrar();
    SessaoRegistro::definirConexao(function () { throw new RuntimeException('banco fora (sintético)'); });
    $afirma('banco fora: validate nega e a última situação é FALHA', $valida() === null && SessionGate::ultimaSituacaoRegistro() === SessaoRegistro::FALHA);
    SessaoRegistro::definirConexao(fn () => $pdo);
    $afirma('banco de volta: validate OK e a última situação é OK', ($valida()['user_id'] ?? 0) == $U && SessionGate::ultimaSituacaoRegistro() === SessaoRegistro::OK);
    session_write_close();
    // o check.php DE VERDADE num processo filho (mesma pasta de sessões isolada); o prefixo injeta a conexão do registro antes do check.php rodar
    $chama = function (string $modo) use ($RAIZ, $t0): array {
        $pre = tempnam(sys_get_temp_dir(), 'check-pre-'); $tabela = "CREATE TEMPORARY TABLE app_user_sessions (id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, user_id INT UNSIGNED NOT NULL, session_token VARCHAR(255) NOT NULL, is_active TINYINT(1) DEFAULT 1, expires_at DATETIME(3) NOT NULL)";
        file_put_contents($pre, '<?php $_SERVER["REQUEST_METHOD"]="GET"; $_SERVER["HTTP_USER_AGENT"]="teste-sessao/1.0"; $_SERVER["REMOTE_ADDR"]="127.0.0.1"; $_SERVER["HTTP_HOST"]="validacao.local";'
            . ' ini_set("session.use_cookies","0"); ini_set("session.use_only_cookies","0"); ini_set("session.cache_limiter","");'
            . ' $_COOKIE["DSHOWSESS"]=' . var_export($t0, true) . '; session_id(' . var_export($t0, true) . ');'
            . ' require_once ' . var_export("$RAIZ/config/db_connection.php", true) . '; require_once ' . var_export("$RAIZ/api/core/SessionGate.php", true) . ';'
            . ($modo === 'falha'
                ? ' SessaoRegistro::definirConexao(function () { throw new RuntimeException("banco fora (sintético)"); });'
                : ' $p = getConnection("DSHOWDASH"); if (!str_starts_with((string) $p->query("SELECT DATABASE()")->fetchColumn(), "ATRWEB_VAL_")) exit(9); $p->exec(' . var_export($tabela, true) . '); SessaoRegistro::definirConexao(fn () => $p);')
            . ' register_shutdown_function(function () { echo "\nHTTP=" . (http_response_code() ?: 200) . "\n"; });');
        $pr = proc_open([PHP_BINARY, '-d', 'auto_prepend_file=' . $pre, '-d', 'display_errors=stderr', "$RAIZ/api/auth/check.php"], [1 => ['pipe', 'w'], 2 => ['pipe', 'w']], $io);
        $out = stream_get_contents($io[1]); $err = stream_get_contents($io[2]); proc_close($pr); unlink($pre);
        preg_match('/HTTP=(\d+)/', $out, $m); $j = json_decode(trim(preg_replace('/HTTP=\d+/', '', $out)), true);
        return [(int) ($m[1] ?? 0), is_array($j) ? $j : [], $err];
    };
    [$st, $j, $err] = $chama('falha');
    $afirma('check.php com o banco fora → 503 SESSION_CHECK_UNAVAILABLE (não "authenticated:false")', $st === 503 && ($j['error'] ?? '') === 'SESSION_CHECK_UNAVAILABLE' && !isset($j['data']['authenticated']), "HTTP $st · " . json_encode($j) . ' · ' . substr($err, 0, 300));
    $chegaCom($t0);
    $afirma('…e a sessão continua no servidor (com o banco de volta, ela vale)', ($valida()['user_id'] ?? 0) == $U);
    session_write_close();
    [$st, $j, $err] = $chama('vazio');   // contraprova: SEM registro (AUSENTE) continua sendo "não autenticado" com 200
    $afirma('contraprova: sem registro (ausente) → 200 authenticated:false, como antes', $st === 200 && ($j['data']['authenticated'] ?? null) === false, "HTTP $st · " . json_encode($j) . ' · ' . substr($err, 0, 300));
    break; }
default: fwrite(STDERR, "caso desconhecido: $CASO\n"); exit(2);
}
$saida = ob_get_clean(); echo $saida;
echo "[$CASO] $ok ok, $falhas falhas\n";
exit($falhas ? 1 : 0);
