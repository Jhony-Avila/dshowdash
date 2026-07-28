<?php
// /api/anuncios/biblioteca.php
// Navegação da base de conhecimento (tela "Metodologia Dshow" do painel).
// @module  anuncios.biblioteca
// @version 1.0.0
// @created 2026-07-28
//
//   GET ?domain=&segment=&q=&offset=&limit= → { total, offset, limit, units }
// Proxy fino do GET /units do Decision Engine.

declare(strict_types=1);

require_once __DIR__ . '/_lib.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    ApiResponse::error(ApiResponse::ERR_METHOD_NOT_ALLOWED, 405, ['message' => 'Use GET.']);
}

anuncios_user_id(); // exige sessão válida

$cfg = anuncios_config();
$baseUrl   = rtrim((string) ($cfg['base_url'] ?? 'http://127.0.0.1:8100'), '/');
$authToken = (string) ($cfg['auth_token'] ?? '');

// Whitelist de parâmetros repassados ao engine.
$params = [];
foreach (['domain', 'segment', 'q'] as $campo) {
    if (isset($_GET[$campo]) && is_string($_GET[$campo]) && $_GET[$campo] !== '') {
        $params[$campo] = $_GET[$campo];
    }
}
foreach (['offset', 'limit'] as $campo) {
    if (isset($_GET[$campo]) && is_numeric($_GET[$campo])) {
        $params[$campo] = (int) $_GET[$campo];
    }
}

$headers = ['Accept: application/json'];
if ($authToken !== '') { $headers[] = 'X-API-Key: ' . $authToken; }

$ch = curl_init($baseUrl . '/units' . ($params ? ('?' . http_build_query($params)) : ''));
curl_setopt_array($ch, [
    CURLOPT_HTTPHEADER     => $headers,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_CONNECTTIMEOUT => 5,
    CURLOPT_TIMEOUT        => 15,
]);
$resposta = curl_exec($ch);
$status   = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
curl_close($ch);

$decoded = is_string($resposta) ? json_decode($resposta, true) : null;
if ($resposta === false || $status >= 400 || !is_array($decoded)) {
    ApiResponse::error(ApiResponse::ERR_INTERNAL_ERROR, 502, [
        'message' => 'Nao foi possivel consultar a base de conhecimento.',
    ]);
}

ApiResponse::success($decoded);
