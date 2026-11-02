<?php
// PermissionsValidator
// @version 1.1.0-ENTERPRISE
// @description Validador de inputs para API de permissões
// v1.1.0: Removido namespace para consistência

declare(strict_types=1);

class PermissionsValidator
{
    public static function validateCreateRole(array $input): array
    {
        $errors = [];

        $roleKey = trim($input['role_key'] ?? '');
        $roleName = trim($input['role_name'] ?? '');
        $level = $input['level'] ?? null;

        if (empty($roleKey)) {
            $errors[] = 'role_key é obrigatório';
        } elseif (!preg_match('/^[a-z][a-z0-9_-]{2,49}$/', $roleKey)) {
            $errors[] = 'role_key deve conter apenas letras minúsculas, números, _ e - (3-50 caracteres)';
        }

        if (empty($roleName)) {
            $errors[] = 'role_name é obrigatório';
        } elseif (strlen($roleName) > 100) {
            $errors[] = 'role_name deve ter no máximo 100 caracteres';
        }

        if ($level !== null && (!is_numeric($level) || (int)$level < 0 || (int)$level > 100)) {
            $errors[] = 'level deve ser um número entre 0 e 100';
        }

        return $errors;
    }

    public static function validateUpdateRole(array $input): array
    {
        $errors = [];

        $roleName = $input['role_name'] ?? null;
        $level = $input['level'] ?? null;

        if ($roleName !== null && strlen(trim($roleName)) > 100) {
            $errors[] = 'role_name deve ter no máximo 100 caracteres';
        }

        if ($level !== null && (!is_numeric($level) || (int)$level < 0 || (int)$level > 100)) {
            $errors[] = 'level deve ser um número entre 0 e 100';
        }

        return $errors;
    }

    public static function validateId($id, string $fieldName = 'id'): ?string
    {
        if (!is_numeric($id) || (int)$id <= 0) {
            return "{$fieldName} deve ser um número inteiro positivo";
        }
        return null;
    }

    public static function validateAssignRole(array $input): array
    {
        $errors = [];

        $roleId = $input['role_id'] ?? null;

        if ($roleId === null) {
            $errors[] = 'role_id é obrigatório';
        } elseif ($error = self::validateId($roleId, 'role_id')) {
            $errors[] = $error;
        }

        return $errors;
    }

    public static function validateAddPermission(array $input): array
    {
        $errors = [];

        $permissionId = $input['permission_id'] ?? null;

        if ($permissionId === null) {
            $errors[] = 'permission_id é obrigatório';
        } elseif ($error = self::validateId($permissionId, 'permission_id')) {
            $errors[] = $error;
        }

        return $errors;
    }

    public static function sanitizeRoleInput(array $input): array
    {
        return [
            'role_key' => trim($input['role_key'] ?? ''),
            'role_name' => trim($input['role_name'] ?? ''),
            'description' => trim($input['description'] ?? ''),
            'level' => (int)($input['level'] ?? 0)
        ];
    }
}
