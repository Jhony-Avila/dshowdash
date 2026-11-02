<?php
// /api/_session_init.php
// Inicialização centralizada de sessão - WRAPPER para SessionGate
// @version 2.2.0-ENTERPRISE
// @updated 2026-01-21
// FIX: Corrigido método init() para start()
// FIX: Adicionado timezone centralizado

// ══════════════════════════════════════════════════════════════
// TIMEZONE CENTRALIZADO - Deve ser definido ANTES de qualquer operação
// ══════════════════════════════════════════════════════════════
date_default_timezone_set('America/Sao_Paulo');

if (defined('SESSION_INITIALIZED')) {
    return;
}
define('SESSION_INITIALIZED', true);

require_once __DIR__ . '/core/SessionGate.php';

SessionGate::start();
