<?php
// /api/anuncios/segmentos.php
// Lista os segmentos da base de conhecimento (para o modo Qualificação).
// @module  anuncios.segmentos
// @version 1.0.0
// @created 2026-07-28
//
//   GET → { segmentos: ["eventos", "igrejas", ...] }
// Proxy fino do GET /segments do Decision Engine (fonte: índices da base).

declare(strict_types=1);

require_once __DIR__ . '/_lib.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    ApiResponse::error(ApiResponse::ERR_METHOD_NOT_ALLOWED, 405, ['message' => 'Use GET.']);
}

anuncios_user_id(); // exige sessão válida

$cfg = anuncios_config();
$baseUrl   = rtrim((string) ($cfg['base_url'] ?? 'http://127.0.0.1:8100'), '/');
$authToken = (string) ($cfg['auth_token'] ?? '');

$headers = ['Accept: application/json'];
if ($authToken !== '') { $headers[] = 'X-API-Key: ' . $authToken; }

$ch = curl_init($baseUrl . '/segments');
curl_setopt_array($ch, [
    CURLOPT_HTTPHEADER     => $headers,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_CONNECTTIMEOUT => 5,
    CURLOPT_TIMEOUT        => 10,
]);
$resposta = curl_exec($ch);
$status   = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
curl_close($ch);

$decoded = is_string($resposta) ? json_decode($resposta, true) : null;
if ($resposta === false || $status >= 400 || !is_array($decoded)) {
    ApiResponse::error(ApiResponse::ERR_INTERNAL_ERROR, 502, [
        'message' => 'Nao foi possivel obter os segmentos do Decision Engine.',
    ]);
}

ApiResponse::success(['segmentos' => $decoded['segments'] ?? []]);
