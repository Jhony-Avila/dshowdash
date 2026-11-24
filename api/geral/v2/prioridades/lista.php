<?php
// GET /api/geral/v2/prioridades/lista.php?id=…&pagina=1&por_pagina=50&ordem=prazo|valor|responsavel&dir=asc|desc&responsavel=<id>
// total = quantidade da prioridade (MESMA consulta do cartão).
declare(strict_types=1);
require_once __DIR__ . '/../../_init.php';
$usuario = geral_v2_portao();
$id = geral_v2_q('id') ?? '';
$pag = geral_v2_q('pagina') ?? '1';
$pp = geral_v2_q('por_pagina') ?? '50';
$ordem = geral_v2_q('ordem') ?? 'prazo';
$dir = geral_v2_q('dir') ?? 'asc';
$resp = geral_v2_q('responsavel');
if (!in_array($id, GeralV2::PRIORIDADES, true)) ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 400, ['campo' => 'id']);
if (preg_match('/^[1-9][0-9]{0,4}$/', $pag) !== 1) ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 400, ['campo' => 'pagina']);
if (preg_match('/^[1-9][0-9]?$/', $pp) !== 1 || (int) $pp > GeralV2::POR_PAGINA) ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 400, ['campo' => 'por_pagina']);
if (!in_array($ordem, ['prazo', 'valor', 'responsavel'], true)) ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 400, ['campo' => 'ordem']);
if (!in_array($dir, ['asc', 'desc'], true)) ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 400, ['campo' => 'dir']);
if ($resp !== null && preg_match('/^[1-9][0-9]{0,18}$/', $resp) !== 1) ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 400, ['campo' => 'responsavel']);
ApiResponse::success(geral_v2_contrato($usuario)->lista($id, (int) $pag, (int) $pp, $ordem, $dir, $resp !== null ? (int) $resp : null));
