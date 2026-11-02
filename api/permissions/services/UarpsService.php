<?php
// UarpsService
// @version 1.1.0-ENTERPRISE
// @created 2026-01-21
// @updated 2026-01-21
// v1.1.0: Atualizado para usar UARPSRepository consolidado do /core/
// v1.0.0: Service com regras de negócio para UARPS

declare(strict_types=1);

require_once __DIR__ . '/../../core/repositories/UARPSRepository.php';
require_once __DIR__ . '/../validators/UarpsValidator.php';

use Permissions\Validators\UarpsValidator;

class UarpsService
{
    private UARPSRepository $repository;
    private \PDO $pdo;

    public function __construct(\PDO $pdo)
    {
        $this->pdo = $pdo;
        $this->repository = new UARPSRepository($pdo);
    }

    // ════════════════════════════════════════════════════════════════════════
    // CHECK PERMISSIONS
    // ════════════════════════════════════════════════════════════════════════

    public function checkTrigger(int $userId, string $triggerId): array
    {
        $perm = $this->repository->getTriggerPermission($userId, $triggerId);
        $state = $perm['state'] ?? 'inherit';
        $allowed = ($state === 'allow' || $state === 'inherit');

        return [
            'trigger_id' => $triggerId,
            'user_id' => $userId,
            'state' => $state,
            'allowed' => $allowed,
            'expires_at' => $perm['expires_at'] ?? null
        ];
    }

    public function checkRegion(int $userId, string $regionId): array
    {
        $perm = $this->repository->getRegionPermission($userId, $regionId);
        $state = $perm['state'] ?? 'inherit';
        $allowed = ($state === 'allow' || $state === 'inherit');

        return [
            'region_id' => $regionId,
            'user_id' => $userId,
            'state' => $state,
            'allowed' => $allowed,
            'expires_at' => $perm['expires_at'] ?? null
        ];
    }

    public function checkMultiple(int $userId, array $entityIds): array
    {
        $results = [];

        foreach ($entityIds as $entityId) {
            $entityId = trim($entityId);
            if (strpos($entityId, 'trigger:') === 0) {
                $perm = $this->repository->getTriggerPermission($userId, $entityId);
            } else {
                $perm = $this->repository->getRegionPermission($userId, $entityId);
            }

            $state = $perm['state'] ?? 'inherit';
            $results[$entityId] = [
                'state' => $state,
                'allowed' => ($state === 'allow' || $state === 'inherit')
            ];
        }

        return ['user_id' => $userId, 'results' => $results];
    }

    // ════════════════════════════════════════════════════════════════════════
    // GET PERMISSIONS
    // ════════════════════════════════════════════════════════════════════════

    public function getMyPermissions(int $userId): array
    {
        $triggers = $this->repository->getUserTriggers($userId, false);
        $regions = $this->repository->getUserRegions($userId, false);

        return [
            'user_id' => $userId,
            'triggers' => $triggers,
            'regions' => $regions,
            'counts' => ['triggers' => count($triggers), 'regions' => count($regions)]
        ];
    }

    public function getUserPermissions(int $userId): array
    {
        $triggers = $this->repository->getUserTriggersWithGranted($userId);
        $regions = $this->repository->getUserRegionsWithGranted($userId);

        return [
            'user_id' => $userId,
            'triggers' => $triggers,
            'regions' => $regions
        ];
    }

    public function getUserMatrix(int $userId): ?array
    {
        $userInfo = $this->repository->getUserInfo($userId);
        if (!$userInfo) return null;

        $triggers = $this->repository->getUserTriggersWithGranted($userId);
        $regions = $this->repository->getUserRegionsWithGranted($userId);

        $triggerMap = [];
        foreach ($triggers as $t) {
            $triggerMap[$t['trigger_id']] = $t['state'];
        }

        $regionMap = [];
        foreach ($regions as $r) {
            $regionMap[$r['region_id']] = $r['state'];
        }

        return [
            'user' => $userInfo,
            'triggers' => $triggerMap,
            'regions' => $regionMap,
            'details' => ['triggers' => $triggers, 'regions' => $regions]
        ];
    }

    // ════════════════════════════════════════════════════════════════════════
    // GET USERS
    // ════════════════════════════════════════════════════════════════════════

    public function getUsersWithPermissions(): array
    {
        return ['users' => $this->repository->getUsersWithPermissions()];
    }

    public function getAllUsers(): array
    {
        return ['users' => $this->repository->getAllUsers()];
    }

    // ════════════════════════════════════════════════════════════════════════
    // GET AUDIT
    // ════════════════════════════════════════════════════════════════════════

    public function getAuditLogs(int $limit, ?int $targetUserId = null): array
    {
        $logs = $this->repository->getAuditLogs($limit, $targetUserId);
        return ['logs' => $logs];
    }

    // ════════════════════════════════════════════════════════════════════════
    // SET TRIGGER
    // ════════════════════════════════════════════════════════════════════════

    public function setTrigger(array $input, int $actorId, string $ip): array
    {
        $errors = UarpsValidator::validateSetTrigger($input);
        if (!empty($errors)) {
            return ['success' => false, 'error' => 'VALIDATION_ERROR', 'details' => $errors];
        }

        $data = UarpsValidator::sanitizeInput($input);
        $targetUserId = $data['user_id'];
        $triggerId = $data['trigger_id'];
        $state = $data['state'];

        $existing = $this->repository->getTriggerPermissionFull($targetUserId, $triggerId);
        $oldState = $existing['state'] ?? null;

        $this->repository->setTriggerPermission(
            $targetUserId,
            $triggerId,
            $state,
            $data['expires_at'],
            $data['reason'],
            $actorId,
            $ip
        );

        $this->logAudit($actorId, 'set_trigger', 'trigger', $triggerId, $targetUserId, $oldState, $state, $data['reason'], $ip);

        return [
            'success' => true,
            'trigger_id' => $triggerId,
            'state' => $state
        ];
    }

    // ════════════════════════════════════════════════════════════════════════
    // SET REGION
    // ════════════════════════════════════════════════════════════════════════

    public function setRegion(array $input, int $actorId, string $ip): array
    {
        $errors = UarpsValidator::validateSetRegion($input);
        if (!empty($errors)) {
            return ['success' => false, 'error' => 'VALIDATION_ERROR', 'details' => $errors];
        }

        $data = UarpsValidator::sanitizeInput($input);
        $targetUserId = $data['user_id'];
        $regionId = $data['region_id'];
        $state = $data['state'];

        $existing = $this->repository->getRegionPermissionFull($targetUserId, $regionId);
        $oldState = $existing['state'] ?? null;

        $this->repository->setRegionPermission(
            $targetUserId,
            $regionId,
            $state,
            $data['expires_at'],
            $data['reason'],
            $actorId,
            $ip
        );

        $this->logAudit($actorId, 'set_region', 'region', $regionId, $targetUserId, $oldState, $state, $data['reason'], $ip);

        return [
            'success' => true,
            'region_id' => $regionId,
            'state' => $state
        ];
    }

    // ════════════════════════════════════════════════════════════════════════
    // BULK SET TRIGGERS
    // ════════════════════════════════════════════════════════════════════════

    public function bulkSetTriggers(array $input, int $actorId, string $ip): array
    {
        $errors = UarpsValidator::validateBulkSet($input);
        if (!empty($errors)) {
            return ['success' => false, 'error' => 'VALIDATION_ERROR', 'details' => $errors];
        }

        $targetUserId = (int)$input['user_id'];
        $permissions = $input['permissions'];
        $reason = $input['reason'] ?? 'Bulk update';

        $updated = 0;
        foreach ($permissions as $triggerId => $state) {
            if (!UarpsValidator::isValidState($state)) continue;

            $existing = $this->repository->getTriggerPermissionFull($targetUserId, (string)$triggerId);
            $oldState = $existing['state'] ?? null;

            $this->repository->setTriggerPermission($targetUserId, (string)$triggerId, $state, null, $reason, $actorId, $ip);
            $this->logAudit($actorId, 'bulk_set_trigger', 'trigger', (string)$triggerId, $targetUserId, $oldState, $state, $reason, $ip);
            $updated++;
        }

        return ['success' => true, 'updated' => $updated];
    }

    // ════════════════════════════════════════════════════════════════════════
    // BULK SET REGIONS
    // ════════════════════════════════════════════════════════════════════════

    public function bulkSetRegions(array $input, int $actorId, string $ip): array
    {
        $errors = UarpsValidator::validateBulkSet($input);
        if (!empty($errors)) {
            return ['success' => false, 'error' => 'VALIDATION_ERROR', 'details' => $errors];
        }

        $targetUserId = (int)$input['user_id'];
        $permissions = $input['permissions'];
        $reason = $input['reason'] ?? 'Bulk update';

        $updated = 0;
        foreach ($permissions as $regionId => $state) {
            if (!UarpsValidator::isValidState($state)) continue;

            $existing = $this->repository->getRegionPermissionFull($targetUserId, (string)$regionId);
            $oldState = $existing['state'] ?? null;

            $this->repository->setRegionPermission($targetUserId, (string)$regionId, $state, null, $reason, $actorId, $ip);
            $this->logAudit($actorId, 'bulk_set_region', 'region', (string)$regionId, $targetUserId, $oldState, $state, $reason, $ip);
            $updated++;
        }

        return ['success' => true, 'updated' => $updated];
    }

    // ════════════════════════════════════════════════════════════════════════
    // RESET USER
    // ════════════════════════════════════════════════════════════════════════

    public function resetUser(int $targetUserId, int $actorId, string $ip, ?string $reason = null): array
    {
        $triggersReset = $this->repository->clearUserTriggers($targetUserId, $ip);
        $regionsReset = $this->repository->clearUserRegions($targetUserId, $ip);

        $this->logAudit($actorId, 'reset_user', 'user', (string)$targetUserId, $targetUserId, null, null, $reason ?? 'Reset to defaults', $ip);

        return [
            'success' => true,
            'triggers_reset' => $triggersReset,
            'regions_reset' => $regionsReset
        ];
    }

    // ════════════════════════════════════════════════════════════════════════
    // REMOVE TRIGGER
    // ════════════════════════════════════════════════════════════════════════

    public function removeTrigger(int $targetUserId, string $triggerId, int $actorId, string $ip): array
    {
        $existing = $this->repository->getTriggerPermissionFull($targetUserId, $triggerId);
        $this->repository->removeTrigger($targetUserId, $triggerId, $ip);

        $this->logAudit($actorId, 'remove_trigger', 'trigger', $triggerId, $targetUserId, $existing['state'] ?? null, null, null, $ip);

        return ['success' => true];
    }

    // ════════════════════════════════════════════════════════════════════════
    // REMOVE REGION
    // ════════════════════════════════════════════════════════════════════════

    public function removeRegion(int $targetUserId, string $regionId, int $actorId, string $ip): array
    {
        $existing = $this->repository->getRegionPermissionFull($targetUserId, $regionId);
        $this->repository->removeRegion($targetUserId, $regionId, $ip);

        $this->logAudit($actorId, 'remove_region', 'region', $regionId, $targetUserId, $existing['state'] ?? null, null, null, $ip);

        return ['success' => true];
    }

    // ════════════════════════════════════════════════════════════════════════
    // AUDIT LOG (PRIVATE)
    // ════════════════════════════════════════════════════════════════════════

    private function logAudit(int $actorId, string $action, string $entityType, string $entityId, int $targetUserId, ?string $oldState, ?string $newState, ?string $reason, string $ip): void
    {
        try {
            $this->repository->insertAuditLog($actorId, $action, $entityType, $entityId, $targetUserId, $oldState, $newState, $reason, $ip);
        } catch (\Exception $e) {
            error_log("UARPS audit log failed: " . $e->getMessage());
        }
    }
}
