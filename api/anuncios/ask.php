<?php
// /api/anuncios/ask.php
// Proxy autenticado do Google Ads Decision Engine (painel Anúncios).
// @module  anuncios.ask
// @version 1.0.0
// @created 2026-07-27
//
// Papel: o navegador NUNCA fala direto com o Decision Engine (porta interna) e
// NUNCA vê o token X-API-Key. Este endpoint:
//   1. valida a sessão do dshowdash (SessionGate + AuthHelpers, igual ao Koala);
//   2. valida a pergunta (3–2000 chars) e os filtros opcionais;
//   3. repassa para {base_url}/ask com o token lido de config/decision_engine.php;
//   4. devolve o envelope padrão {ok,data,error,meta}.
//
// Config (FORA do git — criar no servidor):
//   /var/www/dshowdash/config/decision_engine.php
//   ver config.example.php nesta pasta.

declare(strict_types=1);

@ini_set('display_errors', '0'); // nunca vazar stack/paths
error_reporting(E_ALL);

require_once __DIR__ . '/../_helpers/ApiResponse.php';
require_once __DIR__ . '/../_helpers/AuthHelpers.php';
require_once __DIR__ . '/../core/CorsPolicy.php';
require_once __DIR__ . '/../core/SessionGate.php';

set_exception_handler(static function (\Throwable $e): void {
    error_log('[anuncios] uncaught ' . get_class($e) . ': ' . $e->getMessage()
        . ' @ ' . $e->getFile() . ':' . $e->getLine());
    if (class_exists('ApiResponse')) {
        ApiResponse::error(ApiResponse::ERR_INTERNAL_ERROR, 500, ['message' => 'Erro interno ao processar a solicitacao.']);
    } else {
        http_response_code(500);
        echo json_encode(['ok' => false, 'data' => null, 'error' => 'INTERNAL_ERROR']);
    }
});

CorsPolicy::apply();
SessionGate::start();
AuthHelpers::requireAuth();
AuthHelpers::requireCsrfForWrite();

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    ApiResponse::error(ApiResponse::ERR_METHOD_NOT_ALLOWED, 405, ['message' => 'Use POST.']);
}

// ── Config do Decision Engine (fora do git) ─────────────────────────────────
$configPath = __DIR__ . '/../../config/decision_engine.php';
if (!is_file($configPath)) {
    error_log('[anuncios] config ausente: ' . $configPath);
    ApiResponse::error(ApiResponse::ERR_INTERNAL_ERROR, 500, [
        'message' => 'Decision Engine nao configurado no servidor (config/decision_engine.php).',
    ]);
}
$cfg = require $configPath;
$baseUrl   = rtrim((string) ($cfg['base_url'] ?? 'http://127.0.0.1:8100'), '/');
$authToken = (string) ($cfg['auth_token'] ?? '');
$timeoutS  = (int) ($cfg['timeout_seconds'] ?? 90);

// ── Corpo: question obrigatoria; domain/segment/k opcionais ────────────────
$raw  = file_get_contents('php://input');
$body = ($raw === '' || $raw === false) ? [] : json_decode($raw, true);
if (!is_array($body)) {
    ApiResponse::error(ApiResponse::ERR_INVALID_JSON, 400);
}

$question = trim((string) ($body['question'] ?? ''));
$len = function_exists('mb_strlen') ? mb_strlen($question) : strlen($question);
if ($len < 3 || $len > 2000) {
    ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 422, [
        'message' => 'A pergunta deve ter entre 3 e 2000 caracteres.',
    ]);
}

$payload = ['question' => $question];
foreach (['domain', 'segment'] as $campo) {
    if (isset($body[$campo]) && is_string($body[$campo]) && $body[$campo] !== '') {
        $payload[$campo] = $body[$campo];
    }
}
if (isset($body['k']) && is_numeric($body['k'])) {
    $k = (int) $body['k'];
    if ($k >= 1 && $k <= 20) {
        $payload['k'] = $k;
    }
}

// ── Repasse ao Decision Engine ──────────────────────────────────────────────
$ch = curl_init($baseUrl . '/ask');
$headers = ['Content-Type: application/json', 'Accept: application/json'];
if ($authToken !== '') {
    $headers[] = 'X-API-Key: ' . $authToken;
}
curl_setopt_array($ch, [
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => json_encode($payload, JSON_UNESCAPED_UNICODE),
    CURLOPT_HTTPHEADER     => $headers,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_CONNECTTIMEOUT => 5,
    CURLOPT_TIMEOUT        => max(10, $timeoutS), // modo consultor (IA) pode demorar
]);
$resposta = curl_exec($ch);
$status   = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
$curlErr  = curl_error($ch);
curl_close($ch);

if ($resposta === false || $status === 0) {
    error_log('[anuncios] engine inacessivel: ' . $curlErr);
    ApiResponse::error(ApiResponse::ERR_INTERNAL_ERROR, 502, [
        'message' => 'O Decision Engine nao respondeu. Verifique se o servico esta no ar.',
    ]);
}

$decoded = json_decode((string) $resposta, true);
if (!is_array($decoded)) {
    error_log('[anuncios] resposta nao-JSON do engine (HTTP ' . $status . ')');
    ApiResponse::error(ApiResponse::ERR_INTERNAL_ERROR, 502, [
        'message' => 'Resposta invalida do Decision Engine.',
    ]);
}

if ($status >= 400) {
    // FastAPI devolve {"detail": ...} em erros — repassa a mensagem sem vazar internals.
    $detalhe = is_string($decoded['detail'] ?? null) ? $decoded['detail'] : 'Falha no Decision Engine.';
    error_log('[anuncios] engine HTTP ' . $status . ': ' . $detalhe);
    ApiResponse::error(
        $status === 422 ? ApiResponse::ERR_VALIDATION_ERROR : ApiResponse::ERR_INTERNAL_ERROR,
        $status >= 500 ? 502 : $status,
        ['message' => $detalhe]
    );
}

ApiResponse::success($decoded);
