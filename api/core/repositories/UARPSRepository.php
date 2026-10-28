<?php
// UARPSRepository - Camada de acesso a dados UARPS (Consolidado)
// @version 2.0.0-ENTERPRISE
// @created 2026-01-21
// @updated 2026-01-21
// v2.0.0: Consolidação - Unificado core + permissions em único Repository
// v1.1.0: Added try-catch blocks around all PDO operations
//
// UARPS = User Access Rights & Permissions System
// Gerencia triggers e regions de permissão por usuário
// Este é o ÚNICO Repository UARPS da aplicação (Single Source of Truth)

declare(strict_types=1);

require_once __DIR__ . '/RepositoryException.php';

class UARPSRepository
{
    private PDO $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // TRIGGERS - READ
    // ═══════════════════════════════════════════════════════════════════════════

    public function getTriggerState(int $userId, string $triggerId): ?string
    {
        try {
            $stmt = $this->pdo->prepare("
                SELECT state FROM app_user_trigger_permissions
                WHERE user_id = ? AND trigger_id = ? AND deleted_at IS NULL
            ");
            $stmt->execute([$userId, $triggerId]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return $result ? $result['state'] : null;
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'getTriggerState');
        }
    }

    public function getTriggerPermission(int $userId, string $triggerId): ?array
    {
        try {
            $stmt = $this->pdo->prepare("
                SELECT state, expires_at FROM app_user_trigger_permissions
                WHERE user_id = ? AND trigger_id = ? AND deleted_at IS NULL
                  AND (expires_at IS NULL OR expires_at > NOW())
                LIMIT 1
            ");
            $stmt->execute([$userId, $triggerId]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return $result ?: null;
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'getTriggerPermission');
        }
    }

    public function getTriggerPermissionFull(int $userId, string $triggerId): ?array
    {
        try {
            $stmt = $this->pdo->prepare("
                SELECT id, state, expires_at, reason, granted_by, granted_at
                FROM app_user_trigger_permissions
                WHERE user_id = ? AND trigger_id = ? AND deleted_at IS NULL
            ");
            $stmt->execute([$userId, $triggerId]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return $result ?: null;
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'getTriggerPermissionFull');
        }
    }

    public function getUserTriggers(int $userId, bool $includeExpired = true): array
    {
        try {
            $sql = "
                SELECT trigger_id, state, created_at, updated_at, expires_at, reason
                FROM app_user_trigger_permissions
                WHERE user_id = ? AND deleted_at IS NULL
            ";
            if (!$includeExpired) {
                $sql .= " AND (expires_at IS NULL OR expires_at > NOW())";
            }
            $sql .= " ORDER BY trigger_id";

            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$userId]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'getUserTriggers');
        }
    }

    public function getUserTriggersWithGranted(int $userId): array
    {
        try {
            $stmt = $this->pdo->prepare("
                SELECT trigger_id, state, granted_at, expires_at, reason
                FROM app_user_trigger_permissions
                WHERE user_id = ? AND deleted_at IS NULL
                ORDER BY trigger_id
            ");
            $stmt->execute([$userId]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'getUserTriggersWithGranted');
        }
    }

    public function getUsersWithTrigger(string $triggerId, ?string $state = null): array
    {
        try {
            $sql = "
                SELECT utp.user_id, u.username, p.nome, utp.state, utp.created_at
                FROM app_user_trigger_permissions utp
                JOIN app_users u ON u.id = utp.user_id
                LEFT JOIN app_user_profiles p ON p.user_id = u.id
                WHERE utp.trigger_id = ? AND utp.deleted_at IS NULL AND u.deleted_at IS NULL
            ";
            $params = [$triggerId];

            if ($state !== null) {
                $sql .= " AND utp.state = ?";
                $params[] = $state;
            }

            $sql .= " ORDER BY u.username";

            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'getUsersWithTrigger');
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // TRIGGERS - WRITE
    // ═══════════════════════════════════════════════════════════════════════════

    public function setTriggerState(int $userId, string $triggerId, string $state, int $setBy, string $ip = ''): bool
    {
        try {
            $existing = $this->getTriggerPermissionFull($userId, $triggerId);

            if ($existing) {
                $stmt = $this->pdo->prepare("
                    UPDATE app_user_trigger_permissions
                    SET state = ?, updated_at = NOW(3), ip_user = ?
                    WHERE user_id = ? AND trigger_id = ? AND deleted_at IS NULL
                ");
                return $stmt->execute([$state, $ip, $userId, $triggerId]);
            }

            $stmt = $this->pdo->prepare("
                INSERT INTO app_user_trigger_permissions
                (user_id, trigger_id, state, granted_by, ip_user)
                VALUES (?, ?, ?, ?, ?)
            ");
            return $stmt->execute([$userId, $triggerId, $state, $setBy, $ip]);
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'setTriggerState');
        }
    }

    public function setTriggerPermission(int $userId, string $triggerId, string $state, ?string $expiresAt, ?string $reason, int $grantedBy, string $ip): bool
    {
        try {
            $existing = $this->getTriggerPermissionFull($userId, $triggerId);

            if ($existing) {
                $stmt = $this->pdo->prepare("
                    UPDATE app_user_trigger_permissions
                    SET state = ?, expires_at = ?, reason = ?, granted_by = ?, granted_at = NOW(3), ip_user = ?
                    WHERE id = ?
                ");
                return $stmt->execute([$state, $expiresAt, $reason, $grantedBy, $ip, $existing['id']]);
            }

            $stmt = $this->pdo->prepare("
                INSERT INTO app_user_trigger_permissions
                (user_id, trigger_id, state, expires_at, reason, granted_by, ip_user)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ");
            return $stmt->execute([$userId, $triggerId, $state, $expiresAt, $reason, $grantedBy, $ip]);
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'setTriggerPermission');
        }
    }

    public function removeTrigger(int $userId, string $triggerId, string $ip = ''): bool
    {
        try {
            $stmt = $this->pdo->prepare("
                UPDATE app_user_trigger_permissions
                SET deleted_at = NOW(3), ip_user = ?
                WHERE user_id = ? AND trigger_id = ? AND deleted_at IS NULL
            ");
            return $stmt->execute([$ip, $userId, $triggerId]) && $stmt->rowCount() > 0;
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'removeTrigger');
        }
    }

    public function clearUserTriggers(int $userId, string $ip = ''): int
    {
        try {
            $stmt = $this->pdo->prepare("
                UPDATE app_user_trigger_permissions
                SET deleted_at = NOW(3), ip_user = ?
                WHERE user_id = ? AND deleted_at IS NULL
            ");
            $stmt->execute([$ip, $userId]);
            return $stmt->rowCount();
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'clearUserTriggers');
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // REGIONS - READ
    // ═══════════════════════════════════════════════════════════════════════════

    public function getRegionState(int $userId, string $regionId): ?string
    {
        try {
            $stmt = $this->pdo->prepare("
                SELECT state FROM app_user_region_permissions
                WHERE user_id = ? AND region_id = ? AND deleted_at IS NULL
            ");
            $stmt->execute([$userId, $regionId]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return $result ? $result['state'] : null;
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'getRegionState');
        }
    }

    public function getRegionPermission(int $userId, string $regionId): ?array
    {
        try {
            $stmt = $this->pdo->prepare("
                SELECT state, expires_at FROM app_user_region_permissions
                WHERE user_id = ? AND region_id = ? AND deleted_at IS NULL
                  AND (expires_at IS NULL OR expires_at > NOW())
                LIMIT 1
            ");
            $stmt->execute([$userId, $regionId]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return $result ?: null;
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'getRegionPermission');
        }
    }

    public function getRegionPermissionFull(int $userId, string $regionId): ?array
    {
        try {
            $stmt = $this->pdo->prepare("
                SELECT id, state, expires_at, reason, granted_by, granted_at
                FROM app_user_region_permissions
                WHERE user_id = ? AND region_id = ? AND deleted_at IS NULL
            ");
            $stmt->execute([$userId, $regionId]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return $result ?: null;
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'getRegionPermissionFull');
        }
    }

    public function getUserRegions(int $userId, bool $includeExpired = true): array
    {
        try {
            $sql = "
                SELECT region_id, state, created_at, updated_at, expires_at, reason
                FROM app_user_region_permissions
                WHERE user_id = ? AND deleted_at IS NULL
            ";
            if (!$includeExpired) {
                $sql .= " AND (expires_at IS NULL OR expires_at > NOW())";
            }
            $sql .= " ORDER BY region_id";

            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$userId]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'getUserRegions');
        }
    }

    public function getUserRegionsWithGranted(int $userId): array
    {
        try {
            $stmt = $this->pdo->prepare("
                SELECT region_id, state, granted_at, expires_at, reason
                FROM app_user_region_permissions
                WHERE user_id = ? AND deleted_at IS NULL
                ORDER BY region_id
            ");
            $stmt->execute([$userId]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'getUserRegionsWithGranted');
        }
    }

    public function getUsersWithRegion(string $regionId, ?string $state = null): array
    {
        try {
            $sql = "
                SELECT urp.user_id, u.username, p.nome, urp.state, urp.created_at
                FROM app_user_region_permissions urp
                JOIN app_users u ON u.id = urp.user_id
                LEFT JOIN app_user_profiles p ON p.user_id = u.id
                WHERE urp.region_id = ? AND urp.deleted_at IS NULL AND u.deleted_at IS NULL
            ";
            $params = [$regionId];

            if ($state !== null) {
                $sql .= " AND urp.state = ?";
                $params[] = $state;
            }

            $sql .= " ORDER BY u.username";

            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'getUsersWithRegion');
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // REGIONS - WRITE
    // ═══════════════════════════════════════════════════════════════════════════

    public function setRegionState(int $userId, string $regionId, string $state, int $setBy, string $ip = ''): bool
    {
        try {
            $existing = $this->getRegionPermissionFull($userId, $regionId);

            if ($existing) {
                $stmt = $this->pdo->prepare("
                    UPDATE app_user_region_permissions
                    SET state = ?, updated_at = NOW(3), ip_user = ?
                    WHERE user_id = ? AND region_id = ? AND deleted_at IS NULL
                ");
                return $stmt->execute([$state, $ip, $userId, $regionId]);
            }

            $stmt = $this->pdo->prepare("
                INSERT INTO app_user_region_permissions
                (user_id, region_id, state, granted_by, ip_user)
                VALUES (?, ?, ?, ?, ?)
            ");
            return $stmt->execute([$userId, $regionId, $state, $setBy, $ip]);
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'setRegionState');
        }
    }

    public function setRegionPermission(int $userId, string $regionId, string $state, ?string $expiresAt, ?string $reason, int $grantedBy, string $ip): bool
    {
        try {
            $existing = $this->getRegionPermissionFull($userId, $regionId);

            if ($existing) {
                $stmt = $this->pdo->prepare("
                    UPDATE app_user_region_permissions
                    SET state = ?, expires_at = ?, reason = ?, granted_by = ?, granted_at = NOW(3), ip_user = ?
                    WHERE id = ?
                ");
                return $stmt->execute([$state, $expiresAt, $reason, $grantedBy, $ip, $existing['id']]);
            }

            $stmt = $this->pdo->prepare("
                INSERT INTO app_user_region_permissions
                (user_id, region_id, state, expires_at, reason, granted_by, ip_user)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ");
            return $stmt->execute([$userId, $regionId, $state, $expiresAt, $reason, $grantedBy, $ip]);
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'setRegionPermission');
        }
    }

    public function removeRegion(int $userId, string $regionId, string $ip = ''): bool
    {
        try {
            $stmt = $this->pdo->prepare("
                UPDATE app_user_region_permissions
                SET deleted_at = NOW(3), ip_user = ?
                WHERE user_id = ? AND region_id = ? AND deleted_at IS NULL
            ");
            return $stmt->execute([$ip, $userId, $regionId]) && $stmt->rowCount() > 0;
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'removeRegion');
        }
    }

    public function clearUserRegions(int $userId, string $ip = ''): int
    {
        try {
            $stmt = $this->pdo->prepare("
                UPDATE app_user_region_permissions
                SET deleted_at = NOW(3), ip_user = ?
                WHERE user_id = ? AND deleted_at IS NULL
            ");
            $stmt->execute([$ip, $userId]);
            return $stmt->rowCount();
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'clearUserRegions');
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // BULK OPERATIONS
    // ═══════════════════════════════════════════════════════════════════════════

    public function setMultipleTriggers(int $userId, array $triggers, int $setBy, string $ip = ''): int
    {
        $count = 0;
        foreach ($triggers as $triggerId => $state) {
            if ($this->setTriggerState($userId, (string)$triggerId, $state, $setBy, $ip)) {
                $count++;
            }
        }
        return $count;
    }

    public function setMultipleRegions(int $userId, array $regions, int $setBy, string $ip = ''): int
    {
        $count = 0;
        foreach ($regions as $regionId => $state) {
            if ($this->setRegionState($userId, (string)$regionId, $state, $setBy, $ip)) {
                $count++;
            }
        }
        return $count;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // USERS
    // ═══════════════════════════════════════════════════════════════════════════

    public function getUserInfo(int $userId): ?array
    {
        try {
            $stmt = $this->pdo->prepare("
                SELECT u.id, u.username, u.email,
                       COALESCE(p.nome_completo, u.username) as nome,
                       COALESCE(r.level, 0) as level
                FROM app_users u
                LEFT JOIN app_user_profiles p ON p.user_id = u.id
                LEFT JOIN app_user_roles ur ON ur.user_id = u.id AND ur.deleted_at IS NULL
                LEFT JOIN app_roles r ON r.id = ur.role_id
                WHERE u.id = ? AND u.deleted_at IS NULL
            ");
            $stmt->execute([$userId]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return $result ?: null;
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'getUserInfo');
        }
    }

    public function getUsersWithPermissions(): array
    {
        try {
            $stmt = $this->pdo->query("
                SELECT DISTINCT u.id, u.username, u.email,
                       COALESCE(p.nome_completo, u.username) as nome,
                       COALESCE(r.level, 0) as level,
                       (SELECT COUNT(*) FROM app_user_trigger_permissions WHERE user_id = u.id AND deleted_at IS NULL) as trigger_count,
                       (SELECT COUNT(*) FROM app_user_region_permissions WHERE user_id = u.id AND deleted_at IS NULL) as region_count
                FROM app_users u
                LEFT JOIN app_user_profiles p ON p.user_id = u.id
                LEFT JOIN app_user_roles ur ON ur.user_id = u.id AND ur.deleted_at IS NULL
                LEFT JOIN app_roles r ON r.id = ur.role_id
                WHERE u.deleted_at IS NULL
                  AND (EXISTS (SELECT 1 FROM app_user_trigger_permissions WHERE user_id = u.id AND deleted_at IS NULL)
                       OR EXISTS (SELECT 1 FROM app_user_region_permissions WHERE user_id = u.id AND deleted_at IS NULL))
                ORDER BY COALESCE(p.nome_completo, u.username)
            ");
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'getUsersWithPermissions');
        }
    }

    public function getAllUsers(): array
    {
        try {
            $stmt = $this->pdo->query("
                SELECT u.id, u.username, u.email,
                       COALESCE(p.nome_completo, u.username) as nome,
                       COALESCE(r.level, 0) as level
                FROM app_users u
                LEFT JOIN app_user_profiles p ON p.user_id = u.id
                LEFT JOIN app_user_roles ur ON ur.user_id = u.id AND ur.deleted_at IS NULL
                LEFT JOIN app_roles r ON r.id = ur.role_id
                WHERE u.deleted_at IS NULL
                ORDER BY COALESCE(p.nome_completo, u.username)
            ");
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'getAllUsers');
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // AUDIT
    // ═══════════════════════════════════════════════════════════════════════════

    public function getAuditLogs(int $limit, ?int $targetUserId = null): array
    {
        try {
            if ($targetUserId) {
                $stmt = $this->pdo->prepare("
                    SELECT a.*, u.username as actor_username, tu.username as target_username
                    FROM app_uarps_audit_log a
                    LEFT JOIN app_users u ON u.id = a.user_id
                    LEFT JOIN app_users tu ON tu.id = a.target_user_id
                    WHERE a.target_user_id = ?
                    ORDER BY a.created_at DESC
                    LIMIT ?
                ");
                $stmt->execute([$targetUserId, $limit]);
            } else {
                $stmt = $this->pdo->prepare("
                    SELECT a.*, u.username as actor_username, tu.username as target_username
                    FROM app_uarps_audit_log a
                    LEFT JOIN app_users u ON u.id = a.user_id
                    LEFT JOIN app_users tu ON tu.id = a.target_user_id
                    ORDER BY a.created_at DESC
                    LIMIT ?
                ");
                $stmt->execute([$limit]);
            }
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'getAuditLogs');
        }
    }

    public function insertAuditLog(int $actorId, string $action, string $entityType, string $entityId, int $targetUserId, ?string $oldState, ?string $newState, ?string $reason, string $ip): bool
    {
        try {
            $stmt = $this->pdo->prepare("
                INSERT INTO app_uarps_audit_log
                (user_id, action, entity_type, entity_id, target_user_id, old_state, new_state, reason, ip_address)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            return $stmt->execute([$actorId, $action, $entityType, $entityId, $targetUserId, $oldState, $newState, $reason, $ip]);
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'insertAuditLog');
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // STATISTICS
    // ═══════════════════════════════════════════════════════════════════════════

    public function countConfiguredTriggers(): int
    {
        try {
            $stmt = $this->pdo->query("
                SELECT COUNT(DISTINCT trigger_id)
                FROM app_user_trigger_permissions
                WHERE deleted_at IS NULL
            ");
            return (int)$stmt->fetchColumn();
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'countConfiguredTriggers');
        }
    }

    public function countConfiguredRegions(): int
    {
        try {
            $stmt = $this->pdo->query("
                SELECT COUNT(DISTINCT region_id)
                FROM app_user_region_permissions
                WHERE deleted_at IS NULL
            ");
            return (int)$stmt->fetchColumn();
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'countConfiguredRegions');
        }
    }

    public function countUsersWithPermissions(): int
    {
        try {
            $stmt = $this->pdo->query("
                SELECT COUNT(DISTINCT user_id) FROM (
                    SELECT user_id FROM app_user_trigger_permissions WHERE deleted_at IS NULL
                    UNION
                    SELECT user_id FROM app_user_region_permissions WHERE deleted_at IS NULL
                ) as combined
            ");
            return (int)$stmt->fetchColumn();
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'countUsersWithPermissions');
        }
    }

    public function getStatistics(): array
    {
        return [
            'total_triggers' => $this->countConfiguredTriggers(),
            'total_regions' => $this->countConfiguredRegions(),
            'users_with_permissions' => $this->countUsersWithPermissions()
        ];
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // COPY PERMISSIONS
    // ═══════════════════════════════════════════════════════════════════════════

    public function copyPermissions(int $sourceUserId, int $targetUserId, int $copiedBy, string $ip = ''): array
    {
        $copiedTriggers = 0;
        $copiedRegions = 0;

        $triggers = $this->getUserTriggers($sourceUserId);
        foreach ($triggers as $trigger) {
            if ($this->setTriggerState($targetUserId, $trigger['trigger_id'], $trigger['state'], $copiedBy, $ip)) {
                $copiedTriggers++;
            }
        }

        $regions = $this->getUserRegions($sourceUserId);
        foreach ($regions as $region) {
            if ($this->setRegionState($targetUserId, $region['region_id'], $region['state'], $copiedBy, $ip)) {
                $copiedRegions++;
            }
        }

        return [
            'triggers' => $copiedTriggers,
            'regions' => $copiedRegions
        ];
    }
}
