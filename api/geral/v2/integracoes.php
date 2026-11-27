<?php
declare(strict_types=1);

/**
 * GET /api/geral/v2/integracoes.php — tela "Integrações" (status SEM SEGREDO). Sessão + nível ≥ 80 (administração). Só leitura.
 * Nunca devolve chave, token, .env nem a mensagem crua de uma API externa: só estado, última sincronização boa, erro em 1 linha (texto nosso)
 * e o próximo passo.
 */
require_once __DIR__ . '/../_init.php';
require_once __DIR__ . '/../GeralV2Integracoes.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') ApiResponse::error(ApiResponse::ERR_METHOD_NOT_ALLOWED, 405);
SessionGate::start();
AuthHelpers::requireAuth(80);
$usuario = AuthHelpers::getCurrentUserId();
$gcal = geral_v2_pdo('GCAL_DSHOW');
$g = new GeralV2(geral_v2_pdo('PIPE_DSHOW'), $gcal, geral_v2_pdo('BLING'), $usuario);
$v = is_string($_GET['v'] ?? null) ? $_GET['v'] : null;
if ($v !== null && $v !== '1' && $v !== '2') ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 400);
$integ = new GeralV2Integracoes($g, geral_v2_pdo('DSHOWDASH'), new DateTimeImmutable('now'));
// 26/11 INT-001: ?v=2 = Central de Integrações (aditivo); sem v (ou v=1) = o formato de hoje, intocado
ApiResponse::success($v === '2' ? $integ->listaV2() : $integ->lista());
