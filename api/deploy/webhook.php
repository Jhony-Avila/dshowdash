<?php
// api/deploy/webhook.php — AUTO-DEPLOY via webhook do GitHub (decisão #47).
// Segurança: HMAC sha256 do corpo com secret FORA do git (config/, 600),
// comparação em tempo constante; só push no refs/heads/main; o endpoint
// NUNCA executa shell — apenas ENFILEIRA; quem deploya é o runner (cron).
declare(strict_types=1);
$raiz = dirname(__DIR__, 2);
$segredoArq = $raiz . '/config/webhook-secret.txt';
if (!is_file($segredoArq)) { http_response_code(503); exit('sem-secret'); }
$segredo = trim((string) file_get_contents($segredoArq));
$corpo = (string) file_get_contents('php://input');
$assinatura = $_SERVER['HTTP_X_HUB_SIGNATURE_256'] ?? '';
$esperada = 'sha256=' . hash_hmac('sha256', $corpo, $segredo);
if ($assinatura === '' || !hash_equals($esperada, $assinatura)) { http_response_code(403); exit('assinatura'); }
$evento = $_SERVER['HTTP_X_GITHUB_EVENT'] ?? '';
if ($evento === 'ping') { http_response_code(200); exit('pong'); }
if ($evento !== 'push') { http_response_code(204); exit; }
$dados = json_decode($corpo, true);
if (!is_array($dados) || ($dados['ref'] ?? '') !== 'refs/heads/main') { http_response_code(204); exit; }
$sha = preg_replace('/[^0-9a-f]/', '', substr((string) ($dados['after'] ?? ''), 0, 40));
if ($sha === '') { http_response_code(422); exit('sem-sha'); }
if (is_file($raiz . '/config/auto-deploy.off')) { http_response_code(202); exit('desligado'); }
$fila = $raiz . '/storage/deploy-fila';
if (!is_dir($fila)) { @mkdir($fila, 0775, true); }
@file_put_contents($fila . '/pedido-' . $sha, date('c') . "\n");
http_response_code(202);
echo 'na-fila';
