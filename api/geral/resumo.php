<?php
// GET /api/geral/resumo.php?periodo=ontem|7d|mes — Geral V2 (contrato no PARA-STATUS, 23/11). Só leitura da base local.
declare(strict_types=1);
require_once __DIR__ . '/_init.php';
$usuario = geral_v2_portao();
$periodo = is_string($_GET['periodo'] ?? null) ? $_GET['periodo'] : '7d';
if (!isset(GeralV2::PERIODOS[$periodo])) ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 400, ['campo' => 'periodo']);
ApiResponse::success(geral_v2_servico($usuario)->resumo($periodo));
