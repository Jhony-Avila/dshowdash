<?php
// GET /api/geral/v2/fontes.php?periodo=ontem|7d|mes — por fonte: conexão, consultas (resultado real, mesmo período do resumo), estado = o pior, parte afetada.
declare(strict_types=1);
require_once __DIR__ . '/../_init.php';
$usuario = geral_v2_portao();
$periodo = geral_v2_q('periodo') ?? '7d';
if (!isset(GeralV2::PERIODOS[$periodo])) ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 400, ['campo' => 'periodo']);
ApiResponse::success(geral_v2_contrato($usuario)->fontes($periodo));
