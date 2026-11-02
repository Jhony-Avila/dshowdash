<?php
// AdminUsersValidator
// @version 1.0.0-ENTERPRISE
// @created 2026-01-21
// Validador específico para API de administração de usuários

declare(strict_types=1);

class AdminUsersValidator
{
    public const VALID_STATUSES = ['active', 'inactive', 'pending', 'suspended'];
    public const ALLOWED_USER_FIELDS = ['username', 'email', 'status', 'avatar_url', 'locale'];
    public const ALLOWED_PROFILE_FIELDS = ['nome', 'nome_resumido', 'nome_completo', 'funcao', 'departamento', 'id_cargo', 'id_matricula'];

    // ════════════════════════════════════════════════════════════════════════
    // VALIDAÇÃO DE UPDATE
    // ════════════════════════════════════════════════════════════════════════

    public static function validateUpdate(array $input): array
    {
        $errors = [];

        if (isset($input['email']) && !filter_var($input['email'], FILTER_VALIDATE_EMAIL)) {
            $errors[] = 'Email inválido';
        }

        if (isset($input['status']) && !in_array($input['status'], self::VALID_STATUSES, true)) {
            $errors[] = 'Status inválido';
        }

        if (isset($input['username']) && strlen(trim($input['username'])) < 3) {
            $errors[] = 'Username deve ter no mínimo 3 caracteres';
        }

        return $errors;
    }

    // ════════════════════════════════════════════════════════════════════════
    // SANITIZAÇÃO
    // ════════════════════════════════════════════════════════════════════════

    public static function sanitizeIntField($value): ?int
    {
        if ($value === '' || $value === null) return null;
        if (is_numeric($value)) return (int)$value;
        return null;
    }

    public static function extractUserFields(array $input): array
    {
        $data = [];
        foreach (self::ALLOWED_USER_FIELDS as $field) {
            if (isset($input[$field])) {
                $data[$field] = $input[$field];
            }
        }
        return $data;
    }

    public static function extractProfileFields(array $input): array
    {
        $data = [];
        $intFields = ['id_cargo', 'id_matricula'];

        foreach (self::ALLOWED_PROFILE_FIELDS as $field) {
            if (array_key_exists($field, $input)) {
                $value = $input[$field];
                if (in_array($field, $intFields, true)) {
                    $value = self::sanitizeIntField($value);
                }
                $data[$field] = $value;
            }
        }
        return $data;
    }

    // ════════════════════════════════════════════════════════════════════════
    // VALIDAÇÃO DE ROLE
    // ════════════════════════════════════════════════════════════════════════

    public static function validateAssignRole(array $input): array
    {
        $errors = [];

        $userId = $input['user_id'] ?? null;
        $roleId = $input['role_id'] ?? null;
        $roleKey = $input['role_key'] ?? null;

        if (!$userId || !is_numeric($userId)) {
            $errors[] = 'user_id é obrigatório';
        }

        if (!$roleId && !$roleKey) {
            $errors[] = 'role_id ou role_key é obrigatório';
        }

        return $errors;
    }
}
