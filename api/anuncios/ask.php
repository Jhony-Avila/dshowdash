<?php
// /api/anuncios/ask.php
// Pergunta ao Decision Engine com memória de conversa + persistência.
// @module  anuncios.ask
// @version 2.0.0  (1.0.0 = proxy stateless; 2.0.0 = conversas persistentes)
// @created 2026-07-27
//
// Fluxo:
//   1. valida sessão/CSRF (via _lib.php) e a pergunta;
//   2. se veio conversa_id, verifica posse e monta o histórico (server-side —
//      o cliente NUNCA fornece o histórico, evitando adulteração);
//   3. repassa ao engine (que segue stateless);
//   4. persiste o turno (pergunta + resposta) SÓ em caso de sucesso;
//   5. devolve {conversa_id, message_id, mode, answer, units, query}.
//
// Config: /var/www/dshowdash/config/decision_engine.php (fora do git).

declare(strict_types=1);

require_once __DIR__ . '/_lib.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    ApiResponse::error(ApiResponse::ERR_METHOD_NOT_ALLOWED, 405, ['message' => 'Use POST.']);
}

// Quantos turnos anteriores vão ao engine (o engine tem caps próprios).
const ANUNCIOS_HISTORICO_MAX = 8;

$userId = anuncios_user_id();
$pdo    = anuncios_pdo();
$body   = anuncios_body();

// ── Validação da pergunta ───────────────────────────────────────────────────
$question = trim((string) ($body['question'] ?? ''));
$len = function_exists('mb_strlen') ? mb_strlen($question) : strlen($question);
if ($len < 3 || $len > 2000) {
    ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 422, [
        'message' => 'A pergunta deve ter entre 3 e 2000 caracteres.',
    ]);
}

// ── Conversa existente? Verifica posse e monta histórico (server-side) ─────
$conversaId = isset($body['conversa_id']) && is_numeric($body['conversa_id'])
    ? (int) $body['conversa_id'] : 0;
$history = [];
if ($conversaId > 0) {
    anuncios_conversa_do_usuario($pdo, $conversaId, $userId);
    $st = $pdo->prepare(
        'SELECT role, content FROM anuncios_mensagens
         WHERE conversa_id = ? AND content <> ""
         ORDER BY id DESC LIMIT ' . ANUNCIOS_HISTORICO_MAX
    );
    $st->execute([$conversaId]);
    // DESC no SQL (pega os mais recentes) → reverte para ordem cronológica.
    foreach (array_reverse($st->fetchAll(PDO::FETCH_ASSOC)) as $m) {
        $history[] = ['role' => $m['role'], 'content' => $m['content']];
    }
}

// ── Chamada ao engine ───────────────────────────────────────────────────────
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
if ($history) {
    $payload['history'] = $history;
}

$resposta = anuncios_engine_ask($payload);

// ── Persistência (só após sucesso — falha do engine não suja o histórico) ──
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
        (string) ($resposta['answer'] ?? ''),
        (string) ($resposta['mode'] ?? ''),
        json_encode($resposta['units'] ?? [], JSON_UNESCAPED_UNICODE),
    ]);
    $messageId = (int) $pdo->lastInsertId();

    $pdo->commit();
} catch (\Throwable $e) {
    $pdo->rollBack();
    throw $e; // handler global devolve 500 padronizado
}

ApiResponse::success([
    'conversa_id' => $conversaId,
    'message_id'  => $messageId,
    'mode'        => $resposta['mode'] ?? null,
    'answer'      => $resposta['answer'] ?? null,
    'units'       => $resposta['units'] ?? [],
    'query'       => $resposta['query'] ?? $question,
]);
