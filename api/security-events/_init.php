<?php
/**
 * Security Events Init - Inicialização do módulo
 * @version 1.0.0-ENTERPRISE
 * @created 2026-01-21
 */

declare(strict_types=1);

require_once __DIR__ . '/../core/CorsPolicy.php';
require_once __DIR__ . '/../core/helpers/RedisHelper.php';
require_once __DIR__ . '/../core/helpers/InputValidator.php';
require_once __DIR__ . '/../_helpers/ApiResponse.php';

// FIX: Removido use statements - classes são globais

CorsPolicy::apply();
