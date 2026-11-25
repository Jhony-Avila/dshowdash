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
// texto BRUTO validado com \z (GeralV2::inteiroDaUrl): "1\n" e "1\r\n" são recusados (o `$` do PHP aceitava o "\n" final)
$pagN = GeralV2::inteiroDaUrl($pag, 5); $ppN = GeralV2::inteiroDaUrl($pp, 2);
$respN = $resp === null ? null : GeralV2::inteiroDaUrl($resp, 19);
if ($pagN === null) ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 400, ['campo' => 'pagina']);
if ($ppN === null || $ppN > GeralV2::POR_PAGINA) ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 400, ['campo' => 'por_pagina']);
if (!in_array($ordem, ['prazo', 'valor', 'responsavel'], true)) ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 400, ['campo' => 'ordem']);
if (!in_array($dir, ['asc', 'desc'], true)) ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 400, ['campo' => 'dir']);
if ($resp !== null && $respN === null) ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 400, ['campo' => 'responsavel']);
ApiResponse::success(geral_v2_contrato($usuario)->lista($id, $pagN, $ppN, $ordem, $dir, $respN));
