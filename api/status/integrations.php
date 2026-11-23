<?php
// Status Integrations API - v3.2.0-ENTERPRISE
// v3.2.0: Adicionado try-catch error handling
// v3.1.0: Migrado para ApiResponse::buildSuccess()
// v3.0.0: Migrado para RedisHelper centralizado
// P2.1 FIX: Removido mock data
// P3.5 FIX: Adicionado CORS centralizado
require_once __DIR__ . '/_init.php';
require_once __DIR__ . '/../_helpers/ApiResponse.php';

// v4.0.0 (23/11/2026, DSHOW-106): estado REAL agregado de Pipedrive, Google Calendar e Bling (era "nenhuma integração ativa" FIXO).
require_once __DIR__ . '/_estado-real.php';
StatusEstadoReal::responderResumo();
