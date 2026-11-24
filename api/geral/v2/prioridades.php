<?php
// GET /api/geral/v2/prioridades.php — situação de AGORA (não muda com o período): as 3 prioridades, negócios distintos.
declare(strict_types=1);
require_once __DIR__ . '/../_init.php';
$usuario = geral_v2_portao();
ApiResponse::success(geral_v2_contrato($usuario)->prioridades());
