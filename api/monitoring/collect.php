<?php
// SEC-002 (27/11): este arquivo não passa pelo _init.php — o portão de acesso entra aqui, antes de tudo.
require_once __DIR__ . '/_acesso.php';
MonitoramentoAcesso::exigir();
require __DIR__ . "/../collect_server_status.php";
