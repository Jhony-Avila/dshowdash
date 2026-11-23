<?php
// Correção de sessão (23/11, achado da ACIMA_DIREITA): a renovação do id da sessão PHP precisa levar junto a linha de app_user_sessions.
// Casos (um por processo — a sessão PHP é estado global):
//   ociosa     — sessão ociosa > 1 h → SessionGate::validate() renova → a linha acompanha → o proxy das fotos (FotosSessao) aceita
//   revogada   — sessão já renovada é revogada pela tela de Sessões (terminateSession) → o proxy recusa; nova renovação NÃO reativa
//   login      — regressão: SessionGate::create + gravação do login → linha com o session_id() atual → proxy aceita
//   renovacao  — regressão: AuthService::refreshSession → id novo, linha com o token novo e o csrf devolvido → proxy aceita
//   logout     — regressão: AuthService::logout → linha apagada → proxy recusa
//   revogar-tudo — regressão: terminateAllUserSessions → proxy recusa
// Banco: SÓ a conexão de validação (ATRWEB_VAL_*), com TABELAS TEMPORÁRIAS app_users/app_user_sessions (somem ao fim do processo;
// nada é gravado nas bases). Sessões PHP: rode por rodar-teste-sessao.sh (pasta de sessões isolada por unshare -m).
// Uso: php teste-sessao-renovacao.php <raiz-do-código> <caso>
declare(strict_types=1);
ob_start();
[$_, $RAIZ, $CASO] = $argv + [null, null, null];
$CRED = getenv('ATRWEB_CRED') ?: '';
if (!$RAIZ || !$CASO || !is_file("$RAIZ/api/core/SessionGate.php") || !is_file($CRED)) { fwrite(STDERR, "uso: ATRWEB_CRED=<ini> php teste-sessao-renovacao.php <raiz> <caso>\n"); exit(2); }
$_SERVER['HTTP_USER_AGENT'] = 'teste-sessao/1.0'; $_SERVER['REMOTE_ADDR'] = '127.0.0.1'; $_SERVER['HTTP_HOST'] = 'validacao.local';
ini_set('session.use_cookies', '0'); ini_set('session.use_only_cookies', '0'); ini_set('session.cache_limiter', '');

// a MESMA getConnection() da validação (ATRWEB_VAL_*, credencial por ATRWEB_CRED); o código antigo também a usa pelo caminho padrão
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
require_once "$RAIZ/api/auth/services/AuthService.php";
require_once "$RAIZ/api/core/repositories/UserSessionsRepository.php";
require_once "$RAIZ/api/midia/FotosCanal.php";
require_once "$RAIZ/api/midia/FotosSessao.php";
$injetavel = method_exists('SessionGate', 'definirConexaoSessoes');
if ($injetavel) SessionGate::definirConexaoSessoes(fn () => $pdo);

$ok = 0; $falhas = 0;
$afirma = function (string $n, bool $c, string $x = '') use (&$ok, &$falhas) { if ($c) { $ok++; echo "ok    $n\n"; } else { $falhas++; echo "FALHA $n" . ($x ? " · $x" : '') . "\n"; } };
$proxy = function () use ($pdo): string { try { FotosSessao::exigir(SessionGate::validate(), session_id(), new FotosSessaoPdo($pdo)); return 'aceita'; } catch (FotosErro $e) { return $e->codigo . '|' . $e->http; } };
$linha = fn (string $tok) => ($s = $pdo->prepare('SELECT id, user_id, session_token, csrf_token, is_active FROM app_user_sessions WHERE session_token = ?')) && $s->execute([$tok]) ? ($s->fetch() ?: null) : null;
$ativas = fn () => (int) $pdo->query("SELECT COUNT(*) FROM app_user_sessions WHERE user_id = $U AND is_active = 1")->fetchColumn();
$curto = fn (string $t) => substr($t, 0, 6) . '…';
// login como o AuthService faz: SessionGate::create + linha com o session_id() atual
$entrar = function () use ($pdo, $U) {
    SessionGate::create(['id' => $U, 'level' => 1, 'roles' => [], 'email' => 'sessao.sintetico@validacao.invalid', 'name' => 'Sessão Sintético']);
    $r = new AuthRepository($pdo);
    $r->createSession(session_id(), $U, (string) $_SESSION['csrf'], ['device_type' => 'desktop', 'browser' => 'teste', 'os' => 'linux'], '127.0.0.1', time() + 604800);
    return session_id();
};

switch ($CASO) {
case 'ociosa': {
    $t0 = $entrar();
    $afirma('antes: o proxy aceita a sessão recém-criada', $proxy() === 'aceita', $proxy());
    $_SESSION['last_activity'] = time() - 3700;                 // ociosa > SESSION_REFRESH_THRESHOLD (3600 s)
    (function () { self::$_sessionCache = null; })->bindTo(null, SessionGate::class)();
    SessionGate::validate();                                     // dispara refresh()
    $t1 = session_id();
    $afirma('validate() de sessão ociosa > 1 h renovou o id', $t1 !== $t0, $curto($t0) . ' → ' . $curto($t1));
    $afirma('a linha ACOMPANHOU o id novo (session_token = session_id())', ($linha($t1)['is_active'] ?? null) == 1, 'linha do token novo: ' . json_encode($linha($t1)));
    $afirma('não sobrou linha com o token antigo', $linha($t0) === null);
    $afirma('continua 1 linha ativa do usuário (nada duplicado)', $ativas() === 1, (string) $ativas());
    $afirma('DEPOIS da renovação o proxy das fotos ACEITA (era 401 SESSION_REVOKED)', $proxy() === 'aceita', $proxy());
    break; }
case 'revogada': {
    $t0 = $entrar();
    $_SESSION['last_activity'] = time() - 3700;
    (function () { self::$_sessionCache = null; })->bindTo(null, SessionGate::class)();
    SessionGate::validate(); $t1 = session_id();
    $id = (int) ($linha($t1)['id'] ?? $linha($t0)['id'] ?? 0);
    $afirma('sessão renovada tem linha ativa com o id novo', ($linha($t1)['is_active'] ?? null) == 1);
    $afirma('revogar pela tela de Sessões (terminateSession) alcança a sessão renovada', $id > 0 && (new UserSessionsRepository($pdo))->terminateSession($id, 'admin_terminated'));
    $afirma('o proxy RECUSA a sessão revogada (401 SESSION_REVOKED)', $proxy() === 'SESSION_REVOKED|401', $proxy());
    $_SESSION['last_activity'] = time() - 3700;
    (function () { self::$_sessionCache = null; })->bindTo(null, SessionGate::class)();
    SessionGate::validate(); $t2 = session_id();
    $afirma('nova renovação NÃO reativa nem migra a sessão revogada', $ativas() === 0 && $linha($t2) === null, 'ativas=' . $ativas());
    $afirma('o proxy continua recusando depois da nova renovação', str_ends_with($proxy(), '|401'), $proxy());
    break; }
case 'login': {
    $t0 = $entrar();
    $afirma('login grava a linha com o session_id() atual', ($linha($t0)['user_id'] ?? null) == $U);
    $afirma('login: o proxy aceita', $proxy() === 'aceita', $proxy());
    break; }
case 'renovacao': {
    $t0 = $entrar();
    $svc = new AuthService($pdo);
    $r = $svc->refreshSession($U, $t0, '127.0.0.1');
    $t1 = session_id();
    $afirma('refreshSession responde sucesso', ($r['success'] ?? false) === true, json_encode($r));
    $afirma('refreshSession troca o id da sessão', $t1 !== $t0);
    $afirma('a linha passa ao token NOVO, com o csrf devolvido', ($l = $linha($t1)) !== null && $l['is_active'] == 1 && $l['csrf_token'] === ($r['data']['csrf_token'] ?? '#'), json_encode($linha($t1)));
    $afirma('não sobrou linha com o token antigo', $linha($t0) === null);
    $afirma('renovação: o proxy aceita', $proxy() === 'aceita', $proxy());
    break; }
case 'logout': {
    $t0 = $entrar();
    $svc = new AuthService($pdo);
    $r = $svc->logout($U, $t0, '127.0.0.1');
    $afirma('logout responde sucesso', ($r['success'] ?? false) === true, json_encode($r));
    $afirma('logout: a linha da sessão sai (deleteSession)', $linha($t0) === null && $ativas() === 0);
    $afirma('logout: o proxy recusa', $proxy() !== 'aceita', $proxy());
    break; }
case 'revogar-tudo': {
    $t0 = $entrar();
    $n = (new UserSessionsRepository($pdo))->terminateAllUserSessions($U, 'admin_terminated_all');
    $afirma('revogar todas as sessões do usuário encerra 1 linha', $n === 1, (string) $n);
    $afirma('revogação: o proxy recusa com SESSION_REVOKED', $proxy() === 'SESSION_REVOKED|401', $proxy());
    break; }
default: fwrite(STDERR, "caso desconhecido: $CASO\n"); exit(2);
}
$saida = ob_get_clean(); echo $saida;
echo "[$CASO] $ok ok, $falhas falhas\n";
exit($falhas ? 1 : 0);
