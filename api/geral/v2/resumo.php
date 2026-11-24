<?php
// GET /api/geral/v2/resumo.php?periodo=ontem|7d|mes — pedidos do Bling, negócios ganhos e funil aberto (contrato da CIMA, 23/11).
declare(strict_types=1);
require_once __DIR__ . '/../_init.php';
$usuario = geral_v2_portao();
$periodo = geral_v2_q('periodo') ?? '7d';
if (!isset(GeralV2::PERIODOS[$periodo])) ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 400, ['campo' => 'periodo']);
ApiResponse::success(geral_v2_contrato($usuario)->resumo($periodo));
