<?php
// /api/anuncios/ask-stream.php
// Variante em TEMPO REAL do ask.php: repassa o SSE do Decision Engine ao
// navegador chunk a chunk e persiste o turno ao final.
// @module  anuncios.ask_stream
// @version 1.0.0
// @created 2026-07-28
//
// Eventos repassados do engine:  meta → delta* → done | error
// Evento adicional deste proxy:  saved {conversa_id, message_id}
//   (emitido após persistir — o front usa para habilitar o feedback 👍/👎).
//
// Buffering: desligamos o do PHP e pedimos ao nginx para não bufferizar
// (X-Accel-Buffering: no). Se algo no caminho ainda bufferizar, o front
// detecta e cai automaticamente no ask.php tradicional.

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
$history = [];
if ($conversaId > 0) {
    anuncios_conversa_do_usuario($pdo, $conversaId, $userId);
    $history = anuncios_montar_historico($pdo, $conversaId);
}

// ── Prepara o modo streaming (a partir daqui a resposta é SSE, não JSON) ───
set_time_limit(180);
ignore_user_abort(false);
while (ob_get_level() > 0) { ob_end_clean(); }
header('Content-Type: text/event-stream; charset=utf-8');
header('Cache-Control: no-cache');
header('X-Accel-Buffering: no'); // nginx: não bufferizar esta resposta

$cfg = anuncios_config();
$baseUrl   = rtrim((string) ($cfg['base_url'] ?? 'http://127.0.0.1:8100'), '/');
$authToken = (string) ($cfg['auth_token'] ?? '');
$timeoutS  = (int) ($cfg['timeout_seconds'] ?? 90);

$headers = ['Content-Type: application/json', 'Accept: text/event-stream'];
if ($authToken !== '') { $headers[] = 'X-API-Key: ' . $authToken; }

$acumulado = ''; // espelho do fluxo, para extrair meta/done e persistir

$ch = curl_init($baseUrl . '/ask/stream');
curl_setopt_array($ch, [
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => json_encode(
        anuncios_payload_engine($question, $body, $history),
        JSON_UNESCAPED_UNICODE
    ),
    CURLOPT_HTTPHEADER     => $headers,
    CURLOPT_RETURNTRANSFER => false,
    CURLOPT_CONNECTTIMEOUT => 5,
    CURLOPT_TIMEOUT        => max(30, $timeoutS),
    // Repassa cada chunk imediatamente ao navegador e guarda cópia local.
    CURLOPT_WRITEFUNCTION  => static function ($ch, string $chunk) use (&$acumulado): int {
        $acumulado .= $chunk;
        echo $chunk;
        flush();
        return strlen($chunk);
    },
]);
$ok      = curl_exec($ch);
$status  = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
$curlErr = curl_error($ch);
curl_close($ch);

/** Emite um evento SSE deste proxy. */
function anuncios_sse(string $evento, array $payload): void
{
    echo 'event: ' . $evento . "\n";
    echo 'data: ' . json_encode($payload, JSON_UNESCAPED_UNICODE) . "\n\n";
    flush();
}

if ($ok === false || $status >= 400) {
    error_log('[anuncios] stream falhou (HTTP ' . $status . '): ' . $curlErr);
    anuncios_sse('error', ['message' => 'O Decision Engine nao respondeu ao streaming.']);
    exit;
}

// ── Extrai meta/done do fluxo espelhado e persiste o turno ─────────────────
$mode = ''; $units = []; $answer = null; $temDone = false; $temErro = false;
foreach (explode("\n\n", $acumulado) as $bloco) {
    $evento = null; $dados = null;
    foreach (explode("\n", $bloco) as $linha) {
        if (strpos($linha, 'event: ') === 0) { $evento = substr($linha, 7); }
        if (strpos($linha, 'data: ') === 0)  { $dados = json_decode(substr($linha, 6), true); }
    }
    if ($evento === 'meta' && is_array($dados)) {
        $mode  = (string) ($dados['mode'] ?? '');
        $units = is_array($dados['units'] ?? null) ? $dados['units'] : [];
    } elseif ($evento === 'done' && is_array($dados)) {
        $temDone = true;
        $answer  = $dados['answer'] ?? null;
    } elseif ($evento === 'error') {
        $temErro = true;
    }
}

if ($temErro || !$temDone) {
    // Falha no meio do fluxo: nada é persistido (mesma regra do ask.php) e o
    // front já recebeu o evento de erro repassado do engine.
    exit;
}

try {
    [$conversaId, $messageId] = anuncios_persistir_turno(
        $pdo, $userId, $conversaId, $question, $mode, (string) ($answer ?? ''), $units
    );
    anuncios_sse('saved', ['conversa_id' => $conversaId, 'message_id' => $messageId]);
} catch (\Throwable $e) {
    error_log('[anuncios] persistencia pos-stream falhou: ' . $e->getMessage());
    anuncios_sse('error', ['message' => 'Resposta gerada, mas nao foi possivel salvar no historico.']);
}
