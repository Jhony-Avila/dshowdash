<?php
// UserSessionsRepository - Camada de acesso a dados de sessoes de usuario
// @version 1.0.0-ENTERPRISE
// @created 2026-01-21
// Extraído de UsersRepository para modularização AAA

declare(strict_types=1);

require_once __DIR__ . '/RepositoryException.php';

class UserSessionsRepository
{
    private PDO $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    // ════════════════════════════════════════════════════════════════════════
    // FIND METHODS
    // ════════════════════════════════════════════════════════════════════════

    public function getUserSessions(int $userId, int $limit = 50): array
    {
        try {
            $stmt = $this->pdo->prepare("
                SELECT id, session_token, origin_ip AS ip_address, CONCAT_WS(' · ', browser, os) AS user_agent, is_active,
                       created_at AS login_at, logout_at, logout_reason, last_activity_at
                FROM app_user_sessions
                WHERE user_id = ?
                ORDER BY created_at DESC
                LIMIT ?
            ");
            $stmt->execute([$userId, $limit]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'getUserSessions');
        }
    }

    public function getActiveSessions(int $userId): array
    {
        try {
            $stmt = $this->pdo->prepare("
                SELECT id, session_token, origin_ip AS ip_address, CONCAT_WS(' · ', browser, os) AS user_agent, created_at AS login_at, last_activity_at
                FROM app_user_sessions
                WHERE user_id = ? AND is_active = 1
                ORDER BY last_activity_at DESC
            ");
            $stmt->execute([$userId]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'getActiveSessions');
        }
    }

    public function getSessionInfo(int $sessionId): ?array
    {
        try {
            $stmt = $this->pdo->prepare("
                SELECT id, user_id, session_token, origin_ip AS ip_address, CONCAT_WS(' · ', browser, os) AS user_agent, is_active, created_at AS login_at, last_activity_at
                FROM app_user_sessions
                WHERE id = ?
            ");
            $stmt->execute([$sessionId]);
            return $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'getSessionInfo');
        }
    }

    public function getSessionByToken(string $token): ?array
    {
        try {
            $stmt = $this->pdo->prepare("
                SELECT id, user_id, origin_ip AS ip_address, CONCAT_WS(' · ', browser, os) AS user_agent, is_active, created_at AS login_at, last_activity_at
                FROM app_user_sessions
                WHERE session_token = ?
            ");
            $stmt->execute([$token]);
            return $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'getSessionByToken');
        }
    }

    // ════════════════════════════════════════════════════════════════════════
    // TERMINATE METHODS
    // ════════════════════════════════════════════════════════════════════════

    public function terminateSession(int $sessionId, string $reason = 'admin_terminated'): bool
    {
        try {
            $stmt = $this->pdo->prepare("
                UPDATE app_user_sessions
                SET is_active = 0, logout_at = NOW(3), logout_reason = ?
                WHERE id = ?
            ");
            return $stmt->execute([$reason, $sessionId]) && $stmt->rowCount() > 0;
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'terminateSession');
        }
    }

    public function terminateAllUserSessions(int $userId, string $reason = 'admin_terminated_all'): int
    {
        try {
            $stmt = $this->pdo->prepare("
                UPDATE app_user_sessions
                SET is_active = 0, logout_at = NOW(3), logout_reason = ?
                WHERE user_id = ? AND is_active = 1
            ");
            $stmt->execute([$reason, $userId]);
            return $stmt->rowCount();
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'terminateAllUserSessions');
        }
    }

    public function terminateSessionByToken(string $token, string $reason = 'logout'): bool
    {
        try {
            $stmt = $this->pdo->prepare("
                UPDATE app_user_sessions
                SET is_active = 0, logout_at = NOW(3), logout_reason = ?
                WHERE session_token = ? AND is_active = 1
            ");
            return $stmt->execute([$reason, $token]) && $stmt->rowCount() > 0;
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'terminateSessionByToken');
        }
    }

    // ════════════════════════════════════════════════════════════════════════
    // AGGREGATE METHODS
    // ════════════════════════════════════════════════════════════════════════

    public function getUsersWithActiveSessions(int $limit = 100): array
    {
        try {
            $stmt = $this->pdo->prepare("
                SELECT DISTINCT u.id, u.username, p.nome,
                       MAX(s.last_activity_at) as last_activity,
                       COUNT(s.id) as active_sessions
                FROM app_users u
                LEFT JOIN app_user_profiles p ON p.user_id = u.id
                INNER JOIN app_user_sessions s ON s.user_id = u.id AND s.is_active = 1
                WHERE u.deleted_at IS NULL
                GROUP BY u.id
                ORDER BY last_activity DESC
                LIMIT ?
            ");
            $stmt->execute([$limit]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'getUsersWithActiveSessions');
        }
    }

    public function countActiveSessions(): int
    {
        try {
            $stmt = $this->pdo->query("SELECT COUNT(*) FROM app_user_sessions WHERE is_active = 1");
            return (int)$stmt->fetchColumn();
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'countActiveSessions');
        }
    }

    public function countUserActiveSessions(int $userId): int
    {
        try {
            $stmt = $this->pdo->prepare("SELECT COUNT(*) FROM app_user_sessions WHERE user_id = ? AND is_active = 1");
            $stmt->execute([$userId]);
            return (int)$stmt->fetchColumn();
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'countUserActiveSessions');
        }
    }

    // ════════════════════════════════════════════════════════════════════════
    // UPDATE ACTIVITY
    // ════════════════════════════════════════════════════════════════════════

    public function updateLastActivity(int $sessionId): bool
    {
        try {
            $stmt = $this->pdo->prepare("
                UPDATE app_user_sessions
                SET last_activity_at = NOW(3)
                WHERE id = ? AND is_active = 1
            ");
            return $stmt->execute([$sessionId]);
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'updateLastActivity');
        }
    }
}
