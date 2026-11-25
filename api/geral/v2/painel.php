<?php
// GET /api/geral/v2/painel.php?periodo=ontem|7d|mes — a tela inteira numa LEITURA só (decisão do Jhony, 24/11): resumo, prioridades, agenda e
// a linha de fontes derivada desses mesmos blocos (nunca divergem entre si). As rotas separadas continuam (compatibilidade e lista paginada).
declare(strict_types=1);
require_once __DIR__ . '/../_init.php';
$usuario = geral_v2_portao();
$periodo = geral_v2_q('periodo') ?? '7d';
if (!isset(GeralV2::PERIODOS[$periodo])) ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 400, ['campo' => 'periodo']);
ApiResponse::success(geral_v2_contrato($usuario)->painel($periodo));
