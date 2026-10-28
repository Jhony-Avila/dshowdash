<?php
// Bootstrap - Carrega todos os helpers da API
// @version 2.1.0-ENTERPRISE
// @updated 2026-01-21
// P0.1 FIX: Usa CorsPolicy como fonte única
// P1.0 ADD: Inclui UARPSObserver para shadow mode

require_once __DIR__ . '/ApiResponse.php';
require_once __DIR__ . '/AuthHelpers.php';
require_once __DIR__ . '/../core/CorsPolicy.php';

// P1: UARPS Shadow Mode Observer
// Registra automaticamente para observar verificações de auth
require_once __DIR__ . '/UARPSObserver.php';
UARPSObserver::register();
