<?php
// /api/anuncios/feedback.php
// Avaliação 👍/👎 de respostas do consultor (Fase 22 — aprendizado contínuo).
// @module  anuncios.feedback
// @version 1.0.0
// @created 2026-07-27
//
//   POST { message_id, feedback: 1 | -1 | 0, comment? }   (0 = remover)
//
// Só o dono da conversa avalia; só mensagens role='assistant' são avaliáveis.

declare(strict_types=1);

require_once __DIR__ . '/_lib.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    ApiResponse::error(ApiResponse::ERR_METHOD_NOT_ALLOWED, 405, ['message' => 'Use POST.']);
}

$userId = anuncios_user_id();
$pdo    = anuncios_pdo();
$body   = anuncios_body();

$messageId = isset($body['message_id']) && is_numeric($body['message_id'])
    ? (int) $body['message_id'] : 0;
$feedback = isset($body['feedback']) && is_numeric($body['feedback'])
    ? (int) $body['feedback'] : null;

if ($messageId <= 0 || !in_array($feedback, [1, -1, 0], true)) {
    ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 422, [
        'message' => 'Informe message_id e feedback (1, -1 ou 0).',
    ]);
}

$comment = isset($body['comment']) && is_string($body['comment'])
    ? trim($body['comment']) : '';
if (function_exists('mb_substr')) { $comment = mb_substr($comment, 0, 500); }
else { $comment = substr($comment, 0, 500); }

// Posse via join: a mensagem precisa ser 'assistant' de uma conversa do usuário.
$st = $pdo->prepare(
    'SELECT m.id FROM anuncios_mensagens m
     JOIN anuncios_conversas c ON c.id = m.conversa_id
     WHERE m.id = ? AND c.user_id = ? AND m.role = "assistant"'
);
$st->execute([$messageId, $userId]);
if (!$st->fetchColumn()) {
    ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404, ['message' => 'Mensagem nao encontrada.']);
}

$st = $pdo->prepare(
    'UPDATE anuncios_mensagens SET feedback = ?, feedback_comment = ? WHERE id = ?'
);
$st->execute([
    $feedback === 0 ? null : $feedback,
    $comment !== '' ? $comment : null,
    $messageId,
]);

ApiResponse::success([
    'message_id' => $messageId,
    'feedback'   => $feedback === 0 ? null : $feedback,
]);
