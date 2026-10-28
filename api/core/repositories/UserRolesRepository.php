<?php
// UserRolesRepository - Camada de acesso a dados de roles de usuario
// @version 1.0.0-ENTERPRISE
// @created 2026-01-21
// Extraído de UsersRepository para modularização AAA

declare(strict_types=1);

require_once __DIR__ . '/RepositoryException.php';

class UserRolesRepository
{
    private PDO $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    // ════════════════════════════════════════════════════════════════════════
    // USER ROLES
    // ════════════════════════════════════════════════════════════════════════

    public function getUserRoles(int $userId): array
    {
        try {
            $stmt = $this->pdo->prepare("
                SELECT r.id, r.role_key, r.role_name, r.level
                FROM app_user_roles ur
                JOIN app_roles r ON r.id = ur.role_id
                WHERE ur.user_id = ? AND ur.deleted_at IS NULL AND r.deleted_at IS NULL
                ORDER BY r.level DESC
            ");
            $stmt->execute([$userId]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'getUserRoles');
        }
    }

    public function getUserMaxLevel(int $userId): int
    {
        try {
            $roles = $this->getUserRoles($userId);
            if (empty($roles)) {
                return 0;
            }
            return (int)max(array_column($roles, 'level'));
        } catch (RepositoryException $e) {
            throw $e;
        }
    }

    public function userHasRole(int $userId, int $roleId): bool
    {
        try {
            $stmt = $this->pdo->prepare("
                SELECT 1 FROM app_user_roles
                WHERE user_id = ? AND role_id = ? AND deleted_at IS NULL
            ");
            $stmt->execute([$userId, $roleId]);
            return (bool)$stmt->fetch();
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'userHasRole');
        }
    }

    public function assignRole(int $userId, int $roleId, int $assignedBy): bool
    {
        try {
            if ($this->userHasRole($userId, $roleId)) {
                return false;
            }

            $stmt = $this->pdo->prepare("
                INSERT INTO app_user_roles (user_id, role_id, assigned_by, assigned_at, created_at)
                VALUES (?, ?, ?, NOW(3), NOW(3))
            ");
            return $stmt->execute([$userId, $roleId, $assignedBy]);
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'assignRole');
        }
    }

    public function removeRole(int $userId, int $roleId): bool
    {
        try {
            $stmt = $this->pdo->prepare("
                UPDATE app_user_roles
                SET deleted_at = NOW(3)
                WHERE user_id = ? AND role_id = ? AND deleted_at IS NULL
            ");
            return $stmt->execute([$userId, $roleId]) && $stmt->rowCount() > 0;
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'removeRole');
        }
    }

    public function removeAllUserRoles(int $userId): int
    {
        try {
            $stmt = $this->pdo->prepare("
                UPDATE app_user_roles
                SET deleted_at = NOW(3)
                WHERE user_id = ? AND deleted_at IS NULL
            ");
            $stmt->execute([$userId]);
            return $stmt->rowCount();
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'removeAllUserRoles');
        }
    }

    // ════════════════════════════════════════════════════════════════════════
    // ROLES CATALOG
    // ════════════════════════════════════════════════════════════════════════

    public function getAllRoles(): array
    {
        try {
            $stmt = $this->pdo->query("
                SELECT id, role_key, role_name, description, level, is_system, created_at
                FROM app_roles
                WHERE deleted_at IS NULL
                ORDER BY level DESC
            ");
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'getAllRoles');
        }
    }

    public function getRoleById(int $roleId): ?array
    {
        try {
            $stmt = $this->pdo->prepare("
                SELECT id, role_key, role_name, description, level, is_system
                FROM app_roles
                WHERE id = ? AND deleted_at IS NULL
            ");
            $stmt->execute([$roleId]);
            return $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'getRoleById');
        }
    }

    public function getRoleByKey(string $roleKey): ?array
    {
        try {
            $stmt = $this->pdo->prepare("
                SELECT id, role_key, role_name, description, level, is_system
                FROM app_roles
                WHERE role_key = ? AND deleted_at IS NULL
            ");
            $stmt->execute([$roleKey]);
            return $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'getRoleByKey');
        }
    }

    public function countUsersWithRole(int $roleId): int
    {
        try {
            $stmt = $this->pdo->prepare("
                SELECT COUNT(DISTINCT user_id)
                FROM app_user_roles
                WHERE role_id = ? AND deleted_at IS NULL
            ");
            $stmt->execute([$roleId]);
            return (int)$stmt->fetchColumn();
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'countUsersWithRole');
        }
    }
}
