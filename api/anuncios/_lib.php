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

// ── Fluxo de pergunta (compartilhado por ask.php e ask-stream.php) ──────────

/** Quantos turnos anteriores vão ao engine (o engine tem caps próprios). */
const ANUNCIOS_HISTORICO_MAX = 8;

/** Valida e retorna a pergunta do corpo (3–2000 chars). 422 se inválida. */
function anuncios_validar_pergunta(array $body): string
{
    $question = trim((string) ($body['question'] ?? ''));
    $len = function_exists('mb_strlen') ? mb_strlen($question) : strlen($question);
    if ($len < 3 || $len > 2000) {
        ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 422, [
            'message' => 'A pergunta deve ter entre 3 e 2000 caracteres.',
        ]);
    }
    return $question;
}

/**
 * Monta o histórico (server-side — o cliente nunca fornece) de uma conversa
 * já verificada como do usuário. Ordem cronológica, só conteúdo não-vazio.
 */
function anuncios_montar_historico(PDO $pdo, int $conversaId): array
{
    $st = $pdo->prepare(
        'SELECT role, content FROM anuncios_mensagens
         WHERE conversa_id = ? AND content <> ""
         ORDER BY id DESC LIMIT ' . ANUNCIOS_HISTORICO_MAX
    );
    $st->execute([$conversaId]);
    $history = [];
    foreach (array_reverse($st->fetchAll(PDO::FETCH_ASSOC)) as $m) {
        $history[] = ['role' => $m['role'], 'content' => $m['content']];
    }
    return $history;
}

/** Monta o payload do engine a partir do corpo validado + histórico. */
function anuncios_payload_engine(string $question, array $body, array $history): array
{
    $payload = ['question' => $question];
    foreach (['domain', 'segment'] as $campo) {
        if (isset($body[$campo]) && is_string($body[$campo]) && $body[$campo] !== '') {
            $payload[$campo] = $body[$campo];
        }
    }
    if (isset($body['k']) && is_numeric($body['k'])) {
        $k = (int) $body['k'];
        if ($k >= 1 && $k <= 20) { $payload['k'] = $k; }
    }
    if ($history) { $payload['history'] = $history; }
    return $payload;
}

/**
 * Persiste um turno (pergunta + resposta) numa transação.
 * Cria a conversa se $conversaId = 0. Retorna [conversaId, messageId].
 */
function anuncios_persistir_turno(
    PDO $pdo,
    int $userId,
    int $conversaId,
    string $question,
    string $mode,
    string $answer,
    array $units
): array {
    $pdo->beginTransaction();
    try {
        if ($conversaId === 0) {
            $titulo = function_exists('mb_substr') ? mb_substr($question, 0, 200) : substr($question, 0, 200);
            $st = $pdo->prepare(
                'INSERT INTO anuncios_conversas (user_id, titulo, created_at, updated_at)
                 VALUES (?, ?, NOW(), NOW())'
            );
            $st->execute([$userId, $titulo]);
            $conversaId = (int) $pdo->lastInsertId();
        } else {
            $pdo->prepare('UPDATE anuncios_conversas SET updated_at = NOW() WHERE id = ?')
                ->execute([$conversaId]);
        }

        $st = $pdo->prepare(
            'INSERT INTO anuncios_mensagens (conversa_id, role, content, created_at)
             VALUES (?, "user", ?, NOW())'
        );
        $st->execute([$conversaId, $question]);

        $st = $pdo->prepare(
            'INSERT INTO anuncios_mensagens (conversa_id, role, content, mode, units_json, created_at)
             VALUES (?, "assistant", ?, ?, ?, NOW())'
        );
        $st->execute([
            $conversaId,
            $answer,
            $mode,
            json_encode($units, JSON_UNESCAPED_UNICODE),
        ]);
        $messageId = (int) $pdo->lastInsertId();

        $pdo->commit();
        return [$conversaId, $messageId];
    } catch (\Throwable $e) {
        $pdo->rollBack();
        throw $e;
    }
}
