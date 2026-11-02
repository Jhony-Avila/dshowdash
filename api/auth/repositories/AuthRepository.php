<?php
// AuthRepository
// @version 2.0.0-ENTERPRISE
// @created 2026-01-21
// @updated 2026-01-25
// v2.0.0: P2 - Adicionados métodos para logout/refresh com observabilidade
// Repository para operações de autenticação

declare(strict_types=1);

class AuthRepository
{
    private PDO $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    // ════════════════════════════════════════════════════════════
    // MÉTODOS DE USUÁRIO
    // ════════════════════════════════════════════════════════════

    public function findUserByLogin(string $login): ?array
    {
        $stmt = $this->pdo->prepare("
            SELECT u.id, u.username, u.email, u.password, u.status, u.avatar_url, u.locale, u.created_at,
                   p.nome, p.nome_resumido, p.nome_completo, p.funcao, p.departamento
            FROM app_users u
            LEFT JOIN app_user_profiles p ON p.user_id = u.id
            WHERE (LOWER(u.username) = LOWER(:login) OR LOWER(u.email) = LOWER(:login2))
              AND u.deleted_at IS NULL
            LIMIT 1
        ");
        $stmt->execute(['login' => $login, 'login2' => $login]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result ?: null;
    }

    public function findUserById(int $userId): ?array
    {
        $stmt = $this->pdo->prepare("
            SELECT u.id, u.username, u.email, u.status
            FROM app_users u
            WHERE u.id = :id AND u.deleted_at IS NULL
            LIMIT 1
        ");
        $stmt->execute(['id' => $userId]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result ?: null;
    }

    public function updateLastLogin(int $userId, string $ip): bool
    {
        $stmt = $this->pdo->prepare("UPDATE app_users SET last_login_at = NOW(3), ip_user = :ip WHERE id = :id");
        return $stmt->execute(['ip' => $ip, 'id' => $userId]);
    }

    // ════════════════════════════════════════════════════════════
    // MÉTODOS DE ROLES/PERMISSIONS
    // ════════════════════════════════════════════════════════════

    public function hasActiveRoles(int $userId): bool
    {
        $stmt = $this->pdo->prepare("
            SELECT COUNT(*) FROM app_user_roles 
            WHERE user_id = ? AND deleted_at IS NULL AND (expires_at IS NULL OR expires_at > NOW())
        ");
        $stmt->execute([$userId]);
        return $stmt->fetchColumn() > 0;
    }

    public function getUserRoles(int $userId): array
    {
        $stmt = $this->pdo->prepare("
            SELECT r.role_key, r.level
            FROM app_user_roles ur
            JOIN app_roles r ON r.id = ur.role_id
            WHERE ur.user_id = ? AND ur.deleted_at IS NULL AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
            ORDER BY r.level DESC
        ");
        $stmt->execute([$userId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getUserPermissions(int $userId): array
    {
        $stmt = $this->pdo->prepare("
            SELECT DISTINCT p.permission_key
            FROM app_role_permissions rp
            JOIN app_permissions p ON p.id = rp.permission_id
            JOIN app_user_roles ur ON ur.role_id = rp.role_id
            WHERE ur.user_id = ? AND ur.deleted_at IS NULL AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
            ORDER BY p.permission_key
        ");
        $stmt->execute([$userId]);
        return $stmt->fetchAll(PDO::FETCH_COLUMN);
    }

    // ════════════════════════════════════════════════════════════
    // MÉTODOS DE SESSÃO
    // ════════════════════════════════════════════════════════════

    public function findSessionByToken(string $token): ?array
    {
        $stmt = $this->pdo->prepare("SELECT id, user_id, is_active FROM app_user_sessions WHERE session_token = ?");
        $stmt->execute([$token]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result ?: null;
    }

    public function findActiveSessionByToken(string $token): ?array
    {
        $stmt = $this->pdo->prepare("
            SELECT id, user_id, csrf_token, expires_at, last_activity_at
            FROM app_user_sessions 
            WHERE session_token = ? AND is_active = 1
        ");
        $stmt->execute([$token]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result ?: null;
    }

    public function updateSession(string $token, int $userId, string $csrf, array $device, string $ip, int $expiresAt): bool
    {
        $stmt = $this->pdo->prepare("
            UPDATE app_user_sessions 
            SET user_id = ?, csrf_token = ?, device_type = ?, browser = ?, os = ?, 
                origin_ip = ?, is_active = 1, expires_at = FROM_UNIXTIME(?), last_activity_at = NOW(3)
            WHERE session_token = ?
        ");
        return $stmt->execute([
            $userId, $csrf, $device['device_type'], $device['browser'],
            $device['os'], $ip, $expiresAt, $token
        ]);
    }

    public function createSession(string $token, int $userId, string $csrf, array $device, string $ip, int $expiresAt): bool
    {
        $stmt = $this->pdo->prepare("
            INSERT INTO app_user_sessions 
            (user_id, session_token, csrf_token, device_type, browser, os, origin_ip, is_active, expires_at, last_activity_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, 1, FROM_UNIXTIME(?), NOW(3))
        ");
        return $stmt->execute([
            $userId, $token, $csrf, $device['device_type'],
            $device['browser'], $device['os'], $ip, $expiresAt
        ]);
    }

    public function deactivateSession(string $token, int $userId): bool
    {
        $stmt = $this->pdo->prepare("
            UPDATE app_user_sessions 
            SET is_active = 0, updated_at = NOW(3)
            WHERE session_token = ? AND user_id = ?
        ");
        return $stmt->execute([$token, $userId]);
    }

    public function deleteSession(string $token, int $userId): bool
    {
        $stmt = $this->pdo->prepare("
            DELETE FROM app_user_sessions 
            WHERE user_id = ? AND session_token = ?
        ");
        return $stmt->execute([$userId, $token]);
    }

    public function refreshSessionActivity(string $token, int $userId, string $newCsrf, int $expiresAt): bool
    {
        $stmt = $this->pdo->prepare("
            UPDATE app_user_sessions 
            SET csrf_token = ?, last_activity_at = NOW(3), expires_at = FROM_UNIXTIME(?)
            WHERE session_token = ? AND user_id = ? AND is_active = 1
        ");
        return $stmt->execute([$newCsrf, $expiresAt, $token, $userId]);
    }

    // ════════════════════════════════════════════════════════════
    // MÉTODOS DE LOGGING/OBSERVABILIDADE
    // ════════════════════════════════════════════════════════════

    public function logSecurityEvent(?int $userId, string $eventType, string $severity, string $ip, ?string $details = null): void
    {
        try {
            $stmt = $this->pdo->prepare("
                INSERT INTO app_user_security_events (user_id, event_type, event_severity, ip_address, user_agent, event_context_json)
                VALUES (?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $userId,
                $eventType,
                $severity,
                $ip,
                $_SERVER['HTTP_USER_AGENT'] ?? null,
                $details
            ]);
        } catch (\Exception $e) {
            error_log("[AuthRepository] Security event log error: " . $e->getMessage());
        }
    }

    public function logAuthEvent(string $eventType, ?int $userId, string $ip, array $context = []): void
    {
        $severity = $this->getSeverityForEvent($eventType);
        $contextJson = !empty($context) ? json_encode($context) : null;
        $this->logSecurityEvent($userId, $eventType, $severity, $ip, $contextJson);
    }

    private function getSeverityForEvent(string $eventType): string
    {
        $severityMap = [
            'login_success' => 'info',
            'login_failed' => 'warning',
            'login_blocked' => 'warning',
            'logout_success' => 'info',
            'logout_failed' => 'warning',
            'csrf_failure' => 'warning',
            'session_refresh' => 'info',
            'session_expired' => 'info',
            'session_hijack_attempt' => 'critical'
        ];

        return $severityMap[$eventType] ?? 'info';
    }
}
