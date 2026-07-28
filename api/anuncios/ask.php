<?php
// /api/anuncios/ask.php
// Pergunta ao Decision Engine com memória de conversa + persistência.
// @module  anuncios.ask
// @version 2.1.0  (2.0.0 = conversas persistentes; 2.1.0 = lógica comum na _lib)
// @created 2026-07-27
//
// Fluxo:
//   1. valida sessão/CSRF (via _lib.php) e a pergunta;
//   2. se veio conversa_id, verifica posse e monta o histórico (server-side);
//   3. repassa ao engine (que segue stateless);
//   4. persiste o turno SÓ em caso de sucesso;
//   5. devolve {conversa_id, message_id, mode, answer, units, query}.
//
// Variante em tempo real: ask-stream.php (SSE). Este endpoint permanece como
// caminho estável/fallback.

declare(strict_types=1);

require_once __DIR__ . '/_lib.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    ApiResponse::error(ApiResponse::ERR_METHOD_NOT_ALLOWED, 405, ['message' => 'Use POST.']);
}

$userId   = anuncios_user_id();
$pdo      = anuncios_pdo();
$body     = anuncios_body();
$question = anuncios_validar_pergunta($body);

$conversaId = isset($body['conversa_id']) && is_numeric($body['conversa_id'])
    ? (int) $body['conversa_id'] : 0;

// Perfil: em conversa NOVA vem do corpo; em conversa existente a fonte da
// verdade é o banco (o cliente não troca o perfil no meio da conversa).
$perfil = (isset($body['profile']) && in_array($body['profile'], ['consultor', 'qualificacao'], true))
    ? $body['profile'] : 'consultor';

$history = [];
if ($conversaId > 0) {
    $conversa = anuncios_conversa_do_usuario($pdo, $conversaId, $userId);
    $perfil   = (string) ($conversa['profile'] ?? 'consultor');
    $history  = anuncios_montar_historico($pdo, $conversaId);
}
$body['profile'] = $perfil;

$resposta = anuncios_engine_ask(anuncios_payload_engine($question, $body, $history));

[$conversaId, $messageId] = anuncios_persistir_turno(
    $pdo,
    $userId,
    $conversaId,
    $question,
    (string) ($resposta['mode'] ?? ''),
    (string) ($resposta['answer'] ?? ''),
    is_array($resposta['units'] ?? null) ? $resposta['units'] : [],
    $perfil
);

ApiResponse::success([
    'conversa_id' => $conversaId,
    'message_id'  => $messageId,
    'profile'     => $perfil,
    'mode'        => $resposta['mode'] ?? null,
    'answer'      => $resposta['answer'] ?? null,
    'units'       => $resposta['units'] ?? [],
    'query'       => $resposta['query'] ?? $question,
]);
