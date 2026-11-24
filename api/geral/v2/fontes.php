<?php
// GET /api/geral/v2/fontes.php — estado de cada fonte (conectada · desatualizada · problema · aguardando) com o último sucesso.
declare(strict_types=1);
require_once __DIR__ . '/../_init.php';
$usuario = geral_v2_portao();
ApiResponse::success(geral_v2_contrato($usuario)->fontes());
