<?php
declare(strict_types=1);

/**
 * /api/integracoes/index.php — roteador das integrações com OAuth do Dash · VINHO (ACIMA_ESQUERDA), 26/11/2026; rota por ?r= (ROXO/CIMA, 26/11).
 *   GET /api/integracoes/index.php?r=oauth/rdstation/conectar  → 302 para o diálogo do RD (state anti-CSRF na sessão)
 *   GET /api/integracoes/index.php?r=oauth/rdstation/retorno   → callback cadastrado no app "Dash DSHOW" (RdAuth::RETORNO_URL)
 * Só GET. Sessão + nível ≥ 80 (o mesmo da tela Integrações). Volta sempre para o Dash com ?rdstation=<resultado> (nunca token, nunca
 * mensagem crua do RD). 26/11: o nginx da produção manda /api/integracoes/index.php/… (PATH_INFO) para o SPA (200 text/html, nunca chega
 * ao PHP); por ?r= chega (curl sem sessão: 404 JSON antes desta troca). Por isso a rota vem de ?r= — sem mexer no nginx.
 */
@ini_set('display_errors', '0');
require_once __DIR__ . '/../core/SessionGate.php';
require_once __DIR__ . '/../_helpers/ApiResponse.php';
require_once __DIR__ . '/../_helpers/AuthHelpers.php';
require_once __DIR__ . '/../rdstation/RdStation.php';

$volta = static function (string $res): void {
    header('Cache-Control: private, no-store');
    header('Location: /#/panel-dashboard?rdstation=' . rawurlencode(preg_replace('/[^a-z_]/', '', $res)), true, 302);
    exit;
};
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') ApiResponse::error(ApiResponse::ERR_METHOD_NOT_ALLOWED, 405);
$rota = trim(is_string($_GET['r'] ?? null) ? $_GET['r'] : '', '/');
if (!in_array($rota, ['oauth/rdstation/conectar', 'oauth/rdstation/retorno'], true)) ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404);

SessionGate::start();
$s = SessionGate::validate();
if (!is_array($s) || empty($s['user_id'])) $volta('sessao');
if (AuthHelpers::getCurrentUserLevel() < 80) $volta('sem_permissao');
$usuario = AuthHelpers::getCurrentUserId();
$seg = RdSegredos::padrao();
$auth = new RdAuth(new RdCurl(), $seg);
$agora = new DateTimeImmutable('now');

try {
    if ($rota === 'oauth/rdstation/conectar') {
        $url = RdOAuth::iniciar($auth, $usuario, $_SESSION, $agora);
        header('Cache-Control: private, no-store');
        header('Location: ' . $url, true, 302);
        exit;
    }
    $volta(RdOAuth::retorno($_GET, $usuario, $_SESSION, $auth, new RdTokens($seg, new RdCrypto($seg->chave())), $agora));
} catch (RdErro $e) {
    error_log('[rdstation] ' . $rota . ': ' . $e->codigo);
    $volta($e->codigo === 'nao_configurado' ? 'nao_configurado' : 'falhou');
}
