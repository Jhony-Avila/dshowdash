<?php
// AdminUsersService
// @version 1.0.0-ENTERPRISE
// @created 2026-01-21
// Service com regras de negócio para administração de usuários
// Reutiliza Repositories do /core/repositories/

declare(strict_types=1);

require_once __DIR__ . '/../../../core/repositories/UsersRepository.php';
require_once __DIR__ . '/../../../core/repositories/UserProfileRepository.php';
require_once __DIR__ . '/../../../core/repositories/UserRolesRepository.php';
require_once __DIR__ . '/../../../core/repositories/UserSessionsRepository.php';
require_once __DIR__ . '/../../../core/repositories/UserPreferencesRepository.php';
require_once __DIR__ . '/../../../core/AuditLogger.php';
require_once __DIR__ . '/../validators/AdminUsersValidator.php';

// FIX: Removido use statements - classes são globais

class AdminUsersService
{
    private PDO $pdo;
    private UsersRepository $usersRepo;
    private UserProfileRepository $profileRepo;
    private UserRolesRepository $rolesRepo;
    private UserSessionsRepository $sessionsRepo;
    private UserPreferencesRepository $prefsRepo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
        $this->usersRepo = new UsersRepository($pdo);
        $this->profileRepo = new UserProfileRepository($pdo);
        $this->rolesRepo = new UserRolesRepository($pdo);
        $this->sessionsRepo = new UserSessionsRepository($pdo);
        $this->prefsRepo = new UserPreferencesRepository($pdo);
    }

    // ════════════════════════════════════════════════════════════════════════
    // LIST USERS
    // ════════════════════════════════════════════════════════════════════════

    public function listUsers(?string $search, ?string $status, ?string $role, int $limit, int $offset): array
    {
        $result = $this->usersRepo->list($search, $status, $role, $limit, $offset);

        foreach ($result['users'] as &$user) {
            $roles = $this->rolesRepo->getUserRoles((int)$user['id']);
            $user['roles'] = $roles;
            $user['role'] = $roles[0]['role_key'] ?? null;
        }

        return [
            'users' => $result['users'],
            'total' => $result['total'],
            'limit' => $limit,
            'offset' => $offset
        ];
    }

    // ════════════════════════════════════════════════════════════════════════
    // GET USER
    // ════════════════════════════════════════════════════════════════════════

    public function getUser(int $userId): ?array
    {
        $user = $this->usersRepo->findById($userId);
        if (!$user) return null;

        $roles = $this->rolesRepo->getUserRoles($userId);
        $user['roles'] = $roles;
        $user['role'] = $roles[0]['role_key'] ?? null;

        return $user;
    }

    // ════════════════════════════════════════════════════════════════════════
    // UPDATE USER
    // ════════════════════════════════════════════════════════════════════════

    public function updateUser(int $userId, array $input, int $actorId): array
    {
        $errors = AdminUsersValidator::validateUpdate($input);
        if (!empty($errors)) {
            return ['success' => false, 'error' => 'VALIDATION_ERROR', 'details' => $errors];
        }

        $beforeState = $this->usersRepo->findById($userId);
        if (!$beforeState) {
            return ['success' => false, 'error' => 'NOT_FOUND', 'message' => 'Usuário não encontrado'];
        }

        $userFields = AdminUsersValidator::extractUserFields($input);
        $profileFields = AdminUsersValidator::extractProfileFields($input);

        $this->pdo->beginTransaction();
        try {
            if (!empty($userFields)) {
                $this->usersRepo->updateUser($userId, $userFields);
            }

            if (!empty($profileFields)) {
                $this->profileRepo->update($userId, $profileFields);
            }

            $this->pdo->commit();

            $this->audit($actorId, 'admin.user.update', (string)$userId, $beforeState, $input, ['fields' => array_keys($input)]);

            return ['success' => true];
        } catch (\Exception $e) {
            $this->pdo->rollBack();
            error_log('[AdminUsersService] UPDATE ERROR: ' . $e->getMessage());
            return ['success' => false, 'error' => 'UPDATE_FAILED', 'message' => 'Erro interno'];
        }
    }

    // ════════════════════════════════════════════════════════════════════════
    // RESET PASSWORD
    // ════════════════════════════════════════════════════════════════════════

    public function resetPassword(int $userId, int $actorId): array
    {
        $user = $this->usersRepo->findById($userId);
        if (!$user) {
            return ['success' => false, 'error' => 'NOT_FOUND', 'message' => 'Usuário não encontrado'];
        }

        $tempPassword = bin2hex(random_bytes(8));
        $hashedPassword = password_hash($tempPassword, PASSWORD_BCRYPT);

        $this->usersRepo->resetPassword($userId, $hashedPassword);

        $this->audit($actorId, 'admin.user.reset-password', (string)$userId, null, null, ['target_username' => $user['username']]);

        return ['success' => true, 'temp_password' => $tempPassword];
    }

    // ════════════════════════════════════════════════════════════════════════
    // SESSIONS
    // ════════════════════════════════════════════════════════════════════════

    public function getUserSessions(int $userId): array
    {
        return $this->sessionsRepo->getUserSessions($userId, 50);
    }

    public function terminateSession(int $sessionId, int $actorId): array
    {
        $sessionInfo = $this->sessionsRepo->getSessionInfo($sessionId);
        $terminated = $this->sessionsRepo->terminateSession($sessionId, 'admin_terminated');

        if ($terminated && $sessionInfo) {
            $this->audit($actorId, 'admin.session.terminate', (string)$sessionId, $sessionInfo, null, ['target_user_id' => $sessionInfo['user_id'] ?? null]);
        }

        return ['success' => true, 'terminated' => $terminated];
    }

    public function terminateAllUserSessions(int $userId, int $actorId): array
    {
        $count = $this->sessionsRepo->terminateAllUserSessions($userId, 'admin_terminated_all');

        $this->audit($actorId, 'admin.sessions.terminate-all', (string)$userId, null, null, ['terminated_count' => $count]);

        return ['success' => true, 'terminated_count' => $count];
    }

    // ════════════════════════════════════════════════════════════════════════
    // PREFERENCES
    // ════════════════════════════════════════════════════════════════════════

    public function getUserPreferences(int $userId): array
    {
        return $this->prefsRepo->getAll($userId);
    }

    // ════════════════════════════════════════════════════════════════════════
    // ROLES
    // ════════════════════════════════════════════════════════════════════════

    public function getAllRoles(): array
    {
        return $this->rolesRepo->getAllRoles();
    }

    public function assignRole(int $userId, ?int $roleId, ?string $roleKey, int $actorId): array
    {
        $role = null;

        if ($roleKey) {
            $role = $this->rolesRepo->getRoleByKey($roleKey);
        } elseif ($roleId) {
            $role = $this->rolesRepo->getRoleById($roleId);
        }

        if (!$role) {
            return ['success' => false, 'error' => 'NOT_FOUND', 'message' => 'Role não encontrada'];
        }

        if ($this->rolesRepo->userHasRole($userId, (int)$role['id'])) {
            return ['success' => false, 'error' => 'DUPLICATE', 'message' => 'Usuário já possui esta role', 'role_key' => $role['role_key']];
        }

        $this->rolesRepo->assignRole($userId, (int)$role['id'], $actorId);

        $this->audit($actorId, 'admin.role.assign', (string)$userId, null, ['role_key' => $role['role_key']], ['role_id' => $role['id']]);

        return ['success' => true, 'role_key' => $role['role_key']];
    }

    public function removeRole(int $userId, int $roleId, int $actorId): array
    {
        $role = $this->rolesRepo->getRoleById($roleId);
        $roleKey = $role['role_key'] ?? 'unknown';

        $removed = $this->rolesRepo->removeRole($userId, $roleId);

        if ($removed) {
            $this->audit($actorId, 'admin.role.remove', (string)$userId, ['role_key' => $roleKey], null, ['role_id' => $roleId]);
        }

        return ['success' => true, 'removed' => $removed];
    }

    // ════════════════════════════════════════════════════════════════════════
    // AUDIT (PRIVATE)
    // ════════════════════════════════════════════════════════════════════════

    private function audit(int $actorId, string $actionKey, string $resourceId, ?array $oldValue, ?array $newValue, ?array $context = null): void
    {
        try {
            AuditLogger::log($this->pdo, $actorId, $actionKey, 'user', $resourceId, $oldValue, $newValue, $context);
        } catch (\Exception $e) {
            error_log('[AdminUsersService] Audit failed: ' . $e->getMessage());
        }
    }
}
