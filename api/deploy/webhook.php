<?php
// api/deploy/webhook.php — AUTO-DEPLOY via webhook do GitHub (decisão #47; P1-04a, Fase 1 · Etapa 3).
// Toda a regra está em webhook-lib.php (testada por scripts/deploy/testes/webhook-teste.php).
// O endpoint NUNCA executa shell — apenas ENFILEIRA; quem publica é o runner (cron, root).
declare(strict_types=1);
require __DIR__ . '/webhook-lib.php';
[$status, $corpo] = dshow_webhook_processar($_SERVER, (string) file_get_contents('php://input'), dirname(__DIR__, 2));
http_response_code($status);
echo $corpo;
