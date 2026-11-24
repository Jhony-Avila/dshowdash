<?php
// GET /api/geral/lista.php?prioridade=<id>&pagina=1[&responsavel_id=N][&ordem=antiga|valor] — total = o do cartão (mesma consulta).
declare(strict_types=1);
require_once __DIR__ . '/_init.php';
$usuario = geral_v2_portao();
$q = static fn(string $k): ?string => is_string($_GET[$k] ?? null) ? $_GET[$k] : null;
$prio = $q('prioridade') ?? '';
$pag = $q('pagina') ?? '1';
$resp = $q('responsavel_id');
$ordem = $q('ordem') ?? 'antiga';
if (!in_array($prio, GeralV2::PRIORIDADES, true)) ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 400, ['campo' => 'prioridade']);
if (preg_match('/^[1-9][0-9]{0,4}$/', $pag) !== 1) ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 400, ['campo' => 'pagina']);
if ($resp !== null && preg_match('/^[1-9][0-9]{0,18}$/', $resp) !== 1) ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 400, ['campo' => 'responsavel_id']);
if (!in_array($ordem, ['antiga', 'valor'], true)) ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 400, ['campo' => 'ordem']);
ApiResponse::success(geral_v2_servico($usuario)->lista($prio, (int) $pag, $resp !== null ? (int) $resp : null, $ordem));
