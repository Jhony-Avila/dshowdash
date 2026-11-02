<?php
// UarpsValidator
// @version 1.0.0-ENTERPRISE
// @description Validador de inputs para API UARPS
// Isolamento de validações seguindo princípios de modularização

declare(strict_types=1);

namespace Permissions\Validators;

class UarpsValidator
{
    public const VALID_STATES = ['allow', 'deny', 'inherit'];

    // ════════════════════════════════════════════════════════════════════════
    // VALIDAÇÃO DE STATE
    // ════════════════════════════════════════════════════════════════════════

    public static function isValidState(string $state): bool
    {
        return in_array($state, self::VALID_STATES, true);
    }

    // ════════════════════════════════════════════════════════════════════════
    // VALIDAÇÃO DE TRIGGER
    // ════════════════════════════════════════════════════════════════════════

    public static function validateSetTrigger(array $input): array
    {
        $errors = [];

        $userId = $input['user_id'] ?? null;
        $triggerId = $input['trigger_id'] ?? null;
        $state = $input['state'] ?? 'inherit';

        if (!$userId || !is_numeric($userId) || (int)$userId <= 0) {
            $errors[] = 'user_id é obrigatório e deve ser um número positivo';
        }

        if (empty($triggerId)) {
            $errors[] = 'trigger_id é obrigatório';
        }

        if (!self::isValidState($state)) {
            $errors[] = 'state deve ser allow, deny ou inherit';
        }

        return $errors;
    }

    // ════════════════════════════════════════════════════════════════════════
    // VALIDAÇÃO DE REGION
    // ════════════════════════════════════════════════════════════════════════

    public static function validateSetRegion(array $input): array
    {
        $errors = [];

        $userId = $input['user_id'] ?? null;
        $regionId = $input['region_id'] ?? null;
        $state = $input['state'] ?? 'inherit';

        if (!$userId || !is_numeric($userId) || (int)$userId <= 0) {
            $errors[] = 'user_id é obrigatório e deve ser um número positivo';
        }

        if (empty($regionId)) {
            $errors[] = 'region_id é obrigatório';
        }

        if (!self::isValidState($state)) {
            $errors[] = 'state deve ser allow, deny ou inherit';
        }

        return $errors;
    }

    // ════════════════════════════════════════════════════════════════════════
    // VALIDAÇÃO DE BULK
    // ════════════════════════════════════════════════════════════════════════

    public static function validateBulkSet(array $input): array
    {
        $errors = [];

        $userId = $input['user_id'] ?? null;
        $permissions = $input['permissions'] ?? [];

        if (!$userId || !is_numeric($userId) || (int)$userId <= 0) {
            $errors[] = 'user_id é obrigatório e deve ser um número positivo';
        }

        if (empty($permissions) || !is_array($permissions)) {
            $errors[] = 'permissions é obrigatório e deve ser um objeto';
        }

        return $errors;
    }

    // ════════════════════════════════════════════════════════════════════════
    // VALIDAÇÃO DE USER ID
    // ════════════════════════════════════════════════════════════════════════

    public static function validateUserId($userId): ?string
    {
        if (!$userId || !is_numeric($userId) || (int)$userId <= 0) {
            return 'user_id é obrigatório e deve ser um número positivo';
        }
        return null;
    }

    // ════════════════════════════════════════════════════════════════════════
    // SANITIZAÇÃO
    // ════════════════════════════════════════════════════════════════════════

    public static function sanitizeInput(array $input): array
    {
        return [
            'user_id' => isset($input['user_id']) ? (int)$input['user_id'] : 0,
            'trigger_id' => trim($input['trigger_id'] ?? ''),
            'region_id' => trim($input['region_id'] ?? ''),
            'state' => $input['state'] ?? 'inherit',
            'expires_at' => $input['expires_at'] ?? null,
            'reason' => isset($input['reason']) ? trim($input['reason']) : null
        ];
    }
}
