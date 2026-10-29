<?php
// Weather Index - Default to São Paulo
// @version 1.0.0-ENTERPRISE
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

// Redirecionar para São Paulo como padrão
include __DIR__ . '/get_sao_paulo.php';
