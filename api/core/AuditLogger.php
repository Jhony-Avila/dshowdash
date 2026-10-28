<?php
/**
 * AuditLogger - Sistema centralizado de auditoria
 * @version 1.1.0-ENTERPRISE
 * @created 2026-01-21
 * @updated 2026-07-27 - logSecurity() passou a gravar em app_user_security_events
 *                       (app_security_events nunca existiu — schema drift 6/6)
 *
 * Uso:
 *   AuditLogger::log($pdo, $actorId, 'permissions.role.created', 'role', $roleId, null, $newData, $context);
 */

declare(strict_types=1);

class AuditLogger {
    // Event types
    public const EVENT_ROLE_CREATED = 'permissions.role.created';
    public const EVENT_ROLE_UPDATED = 'permissions.role.updated';
    public const EVENT_ROLE_DELETED = 'permissions.role.deleted';
    public const EVENT_ROLE_ASSIGNED = 'permissions.role.assigned';
    public const EVENT_ROLE_REVOKED = 'permissions.role.revoked';

    public const EVENT_PERMISSION_GRANTED = 'permissions.permission.granted';
    public const EVENT_PERMISSION_REVOKED = 'permissions.permission.revoked';

    public const EVENT_TRIGGER_SET = 'uarps.trigger.set';
    public const EVENT_REGION_SET = 'uarps.region.set';
    public const EVENT_UARPS_RESET = 'uarps.reset';
    public const EVENT_UARPS_BULK = 'uarps.bulk';

    public const EVENT_USER_CREATED = 'admin.user.created';
    public const EVENT_USER_UPDATED = 'admin.user.updated';
    public const EVENT_USER_DELETED = 'admin.user.deleted';
    public const EVENT_SESSION_TERMINATED = 'admin.session.terminated';
    public const EVENT_PASSWORD_RESET = 'admin.password.reset';

    public const EVENT_LOGIN_SUCCESS = 'auth.login.success';
    public const EVENT_LOGIN_FAILED = 'auth.login.failed';
    public const EVENT_LOGIN_BLOCKED = 'auth.login.blocked';
    public const EVENT_LOGOUT = 'auth.logout';

    public const EVENT_SETTING_UPDATED = 'settings.updated';
    public const EVENT_FLAG_TOGGLED = 'feature.flag.toggled';

    /**
     * Log de evento de auditoria
     *
     * @param PDO $pdo Conexão com banco
     * @param int|null $actorId ID do usuário que realizou a ação (null para sistema)
     * @param string $eventType Tipo do evento (usar constantes)
     * @param string $resourceType Tipo do recurso (role, user, permission, trigger, etc)
     * @param int|string|null $resourceId ID do recurso afetado
     * @param array|null $before Estado anterior (para updates)
     * @param array|null $after Novo estado
     * @param array $context Contexto adicional
     */
    public static function log(
        PDO $pdo,
        ?int $actorId,
        string $eventType,
        string $resourceType,
        $resourceId = null,
        ?array $before = null,
        ?array $after = null,
        array $context = []
    ): bool {
        try {
            $ip = self::getClientIp();
            $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? '';

            $stmt = $pdo->prepare("
                INSERT INTO app_audit_log
                (actor_id, event_type, resource_type, resource_id, before_state, after_state, context_json, ip_address, user_agent)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");

            return $stmt->execute([
                $actorId,
                $eventType,
                $resourceType,
                $resourceId,
                $before ? json_encode($before) : null,
                $after ? json_encode($after) : null,
                !empty($context) ? json_encode($context) : null,
                $ip,
                substr($userAgent, 0, 500)
            ]);
        } catch (Exception $e) {
            error_log("[AuditLogger] Failed to log: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Log de evento de segurança (tabela separada)
     *
     * A tabela real é `app_user_security_events` (a antiga `app_security_events` nunca
     * existiu). Como ela não tem colunas `description`/`target_resource`/`metadata_json`,
     * os três viram chaves de `event_context_json` — a assinatura pública fica intacta.
     * Mesmo contrato de escrita usado por AuthRepository::logSecurityEvent().
     *
     * @param string $severity info|warning|critical (enum da coluna event_severity)
     */
    public static function logSecurity(
        PDO $pdo,
        ?int $userId,
        string $eventType,
        string $description,
        ?string $targetResource = null,
        array $metadata = [],
        string $severity = 'info'
    ): bool {
        try {
            $ip = self::getClientIp();
            $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? '';

            $context = [];
            if ($description !== '') {
                $context['description'] = $description;
            }
            if ($targetResource !== null) {
                $context['target_resource'] = $targetResource;
            }
            if (!empty($metadata)) {
                $context['metadata'] = $metadata;
            }

            $stmt = $pdo->prepare("
                INSERT INTO app_user_security_events
                (user_id, event_type, event_severity, ip_address, user_agent, event_context_json)
                VALUES (?, ?, ?, ?, ?, ?)
            ");

            return $stmt->execute([
                $userId,
                substr($eventType, 0, 50),
                in_array($severity, ['info', 'warning', 'critical'], true) ? $severity : 'info',
                $ip,
                substr($userAgent, 0, 500),
                !empty($context) ? json_encode($context) : null
            ]);
        } catch (Exception $e) {
            error_log("[AuditLogger] Failed to log security event: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Log de permissão de auditoria (tabela existente)
     */
    public static function logPermissionAudit(
        PDO $pdo,
        int $userId,
        string $permissionKey,
        string $action,
        ?string $resourceType = null,
        ?string $resourceId = null,
        ?array $context = null
    ): bool {
        try {
            $ip = self::getClientIp();
            $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? '';

            $stmt = $pdo->prepare("
                INSERT INTO app_permission_audit_log
                (user_id, permission_key, action, resource_type, resource_id, context_json, ip_address, user_agent, ip_user)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");

            return $stmt->execute([
                $userId,
                $permissionKey,
                $action,
                $resourceType,
                $resourceId,
                $context ? json_encode($context) : null,
                $ip,
                substr($userAgent, 0, 500),
                $ip
            ]);
        } catch (Exception $e) {
            error_log("[AuditLogger] Failed to log permission audit: " . $e->getMessage());
            return false;
        }
    }

    // === Métodos de conveniência ===

    /**
     * Log de criação de role
     */
    public static function roleCreated(PDO $pdo, int $actorId, int $roleId, array $roleData): bool {
        return self::log($pdo, $actorId, self::EVENT_ROLE_CREATED, 'role', $roleId, null, $roleData);
    }

    /**
     * Log de atualização de role
     */
    public static function roleUpdated(PDO $pdo, int $actorId, int $roleId, array $before, array $after): bool {
        return self::log($pdo, $actorId, self::EVENT_ROLE_UPDATED, 'role', $roleId, $before, $after);
    }

    /**
     * Log de deleção de role
     */
    public static function roleDeleted(PDO $pdo, int $actorId, int $roleId, array $roleData): bool {
        return self::log($pdo, $actorId, self::EVENT_ROLE_DELETED, 'role', $roleId, $roleData, null);
    }

    /**
     * Log de atribuição de role a usuário
     */
    public static function roleAssigned(PDO $pdo, int $actorId, int $userId, int $roleId, array $context = []): bool {
        return self::log($pdo, $actorId, self::EVENT_ROLE_ASSIGNED, 'user_role', null, null, [
            'user_id' => $userId,
            'role_id' => $roleId
        ], $context);
    }

    /**
     * Log de revogação de role de usuário
     */
    public static function roleRevoked(PDO $pdo, int $actorId, int $userId, int $roleId, array $context = []): bool {
        return self::log($pdo, $actorId, self::EVENT_ROLE_REVOKED, 'user_role', null, [
            'user_id' => $userId,
            'role_id' => $roleId
        ], null, $context);
    }

    /**
     * Log de permissão concedida a role
     */
    public static function permissionGranted(PDO $pdo, int $actorId, int $roleId, int $permissionId): bool {
        return self::log($pdo, $actorId, self::EVENT_PERMISSION_GRANTED, 'role_permission', null, null, [
            'role_id' => $roleId,
            'permission_id' => $permissionId
        ]);
    }

    /**
     * Log de permissão revogada de role
     */
    public static function permissionRevoked(PDO $pdo, int $actorId, int $roleId, int $permissionId): bool {
        return self::log($pdo, $actorId, self::EVENT_PERMISSION_REVOKED, 'role_permission', null, [
            'role_id' => $roleId,
            'permission_id' => $permissionId
        ], null);
    }

    /**
     * Log de trigger UARPS
     */
    public static function triggerSet(PDO $pdo, int $actorId, int $targetUserId, string $triggerId, ?string $oldState, string $newState, ?string $reason = null): bool {
        return self::log($pdo, $actorId, self::EVENT_TRIGGER_SET, 'uarps_trigger', $triggerId,
            $oldState ? ['state' => $oldState] : null,
            ['state' => $newState, 'user_id' => $targetUserId],
            $reason ? ['reason' => $reason] : []
        );
    }

    /**
     * Log de region UARPS
     */
    public static function regionSet(PDO $pdo, int $actorId, int $targetUserId, string $regionId, ?string $oldState, string $newState, ?string $reason = null): bool {
        return self::log($pdo, $actorId, self::EVENT_REGION_SET, 'uarps_region', $regionId,
            $oldState ? ['state' => $oldState] : null,
            ['state' => $newState, 'user_id' => $targetUserId],
            $reason ? ['reason' => $reason] : []
        );
    }

    /**
     * Log de login bem-sucedido
     */
    public static function loginSuccess(PDO $pdo, int $userId, array $deviceInfo = []): bool {
        return self::log($pdo, $userId, self::EVENT_LOGIN_SUCCESS, 'session', null, null, null, $deviceInfo);
    }

    /**
     * Log de login falhou
     */
    public static function loginFailed(PDO $pdo, string $username, string $reason): bool {
        return self::log($pdo, null, self::EVENT_LOGIN_FAILED, 'auth', null, null, null, [
            'username' => $username,
            'reason' => $reason
        ]);
    }

    /**
     * Log de atualização de usuário
     */
    public static function userUpdated(PDO $pdo, int $actorId, int $userId, array $before, array $after, array $changedFields = []): bool {
        return self::log($pdo, $actorId, self::EVENT_USER_UPDATED, 'user', $userId, $before, $after, [
            'changed_fields' => $changedFields
        ]);
    }

    /**
     * Log de sessão terminada
     */
    public static function sessionTerminated(PDO $pdo, int $actorId, string $sessionId, array $sessionInfo = []): bool {
        return self::log($pdo, $actorId, self::EVENT_SESSION_TERMINATED, 'session', $sessionId, $sessionInfo, null);
    }

    /**
     * Obtém IP do cliente
     */
    private static function getClientIp(): string {
        $headers = ['HTTP_CF_CONNECTING_IP', 'HTTP_X_FORWARDED_FOR', 'HTTP_X_REAL_IP', 'REMOTE_ADDR'];

        foreach ($headers as $header) {
            if (!empty($_SERVER[$header])) {
                $ip = $_SERVER[$header];
                if (strpos($ip, ',') !== false) {
                    $ip = trim(explode(',', $ip)[0]);
                }
                if (filter_var($ip, FILTER_VALIDATE_IP)) {
                    return $ip;
                }
            }
        }

        return '0.0.0.0';
    }
}
