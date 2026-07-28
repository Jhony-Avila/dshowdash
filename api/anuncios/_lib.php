<?php
// /api/anuncios/_lib.php
// Bootstrap compartilhado do módulo Anúncios (Decision Engine).
// @module  anuncios.lib
// @version 1.1.0
// @created 2026-07-27
//
// Responsabilidade única: autenticação/CSRF, conexão, corpo JSON, config e
// chamada ao engine. Cada endpoint (ask.php, conversas.php, feedback.php)
// só orquestra. Espelha o padrão do api/koala/_init.php.

declare(strict_types=1);

@ini_set('display_errors', '0'); // nunca vazar stack/paths
error_reporting(E_ALL);

require_once __DIR__ . '/../_helpers/ApiResponse.php';
require_once __DIR__ . '/../_helpers/AuthHelpers.php';
require_once __DIR__ . '/../core/CorsPolicy.php';
require_once __DIR__ . '/../core/SessionGate.php';
require_once __DIR__ . '/../../config/db_connection.php';

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

/** ID do usuário logado (app_users). 401 se indisponível. */
function anuncios_user_id(): int
{
    $user = getCurrentUser();
    $id = (int) ($user['id'] ?? 0);
    if ($id <= 0) {
        ApiResponse::error(ApiResponse::ERR_NOT_AUTHENTICATED, 401);
    }
    return $id;
}

/** Conexão PDO com o banco do dshowdash. */
function anuncios_pdo(): PDO
{
    return getConnection('DSHOWDASH');
}

/** Corpo JSON de uma requisição de escrita. [] se vazio; 400 se inválido. */
function anuncios_body(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === '' || $raw === false) { return []; }
    $data = json_decode($raw, true);
    if (!is_array($data)) { ApiResponse::error(ApiResponse::ERR_INVALID_JSON, 400); }
    return $data;
}

/** Config do Decision Engine (config/decision_engine.php, fora do git). */
function anuncios_config(): array
{
    $path = __DIR__ . '/../../config/decision_engine.php';
    if (!is_file($path)) {
        error_log('[anuncios] config ausente: ' . $path);
        ApiResponse::error(ApiResponse::ERR_INTERNAL_ERROR, 500, [
            'message' => 'Decision Engine nao configurado no servidor (config/decision_engine.php).',
        ]);
    }
    return require $path;
}

/**
 * POST {base_url}/ask no Decision Engine. Retorna o JSON decodificado
 * (mode/answer/units/query) ou encerra com envelope de erro (502/4xx).
 */
function anuncios_engine_ask(array $payload): array
{
    $cfg = anuncios_config();
    $baseUrl   = rtrim((string) ($cfg['base_url'] ?? 'http://127.0.0.1:8100'), '/');
    $authToken = (string) ($cfg['auth_token'] ?? '');
    $timeoutS  = (int) ($cfg['timeout_seconds'] ?? 90);

    $headers = ['Content-Type: application/json', 'Accept: application/json'];
    if ($authToken !== '') {
        $headers[] = 'X-API-Key: ' . $authToken;
    }

    $ch = curl_init($baseUrl . '/ask');
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => json_encode($payload, JSON_UNESCAPED_UNICODE),
        CURLOPT_HTTPHEADER     => $headers,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_TIMEOUT        => max(10, $timeoutS),
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
        $detalhe = is_string($decoded['detail'] ?? null) ? $decoded['detail'] : 'Falha no Decision Engine.';
        error_log('[anuncios] engine HTTP ' . $status . ': ' . $detalhe);
        ApiResponse::error(
            $status === 422 ? ApiResponse::ERR_VALIDATION_ERROR : ApiResponse::ERR_INTERNAL_ERROR,
            $status >= 500 ? 502 : $status,
            ['message' => $detalhe]
        );
    }

    return $decoded;
}

/**
 * Carrega uma conversa do usuário (verificando posse). 404 se não existir
 * ou pertencer a outro usuário (não vaza existência).
 */
function anuncios_conversa_do_usuario(PDO $pdo, int $conversaId, int $userId): array
{
    $st = $pdo->prepare('SELECT id, user_id, titulo FROM anuncios_conversas WHERE id = ? AND user_id = ?');
    $st->execute([$conversaId, $userId]);
    $conversa = $st->fetch(PDO::FETCH_ASSOC);
    if (!$conversa) {
        ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404, ['message' => 'Conversa nao encontrada.']);
    }
    return $conversa;
}
