<?php
// Redirect de compatibilidade - Endpoint legado
// @version 1.0.0-COMPAT
// Redireciona para o endpoint correto em /api/dashboard/
// Evita "Primary script unknown" e 404 para chamadas legadas

header('HTTP/1.1 301 Moved Permanently');
header('Location: /api/dashboard/dashboard_metrics_final.php');
header('Cache-Control: public, max-age=86400');
exit;
