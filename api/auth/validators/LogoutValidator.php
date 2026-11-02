<?php
// LogoutValidator
// @version 3.0.0-ENTERPRISE
// @created 2026-01-25
// @updated 2026-01-25
// v3.0.0: Fase 2 - Herda de ValidatorBase, usa SessionReadService
// v2.0.0: P0 FIX - Leitura de sessão sem emitir Set-Cookie

declare(strict_types=1);

require_once __DIR__ . '/ValidatorBase.php';

class LogoutValidator extends ValidatorBase
{
    public static function validateRequest(): ?array
    {
        return self::validateMethod('POST');
    }
}
