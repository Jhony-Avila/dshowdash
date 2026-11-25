<?php
// GET /api/geral/v2/agenda.php — próximos compromissos de HOJE do usuário logado (frescor pelo gcal_sync_state de cada agenda).
declare(strict_types=1);
require_once __DIR__ . '/../_init.php';
$usuario = geral_v2_portao();
ApiResponse::success(geral_v2_contrato($usuario)->agenda());
