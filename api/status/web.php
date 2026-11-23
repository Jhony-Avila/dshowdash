<?php
// Status Web API - v3.2.0-ENTERPRISE
// v4.0.0 (23/11/2026): estado REAL — antes `$isConfigured = false;` FIXO ("não configurado" até para o que funciona).
// Lógica, segurança (sem sessão = só a situação) e cache em _estado-real.php.
require_once __DIR__ . '/_init.php';
require_once __DIR__ . '/../_helpers/ApiResponse.php';
require_once __DIR__ . '/_estado-real.php';

StatusEstadoReal::responder('web');
