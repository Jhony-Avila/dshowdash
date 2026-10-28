<?php
// UsersRepository - Camada de acesso a dados de usuarios (Core)
// @version 2.0.0-ENTERPRISE
// @created 2026-01-21
// @updated 2026-01-21
// v2.0.0: Modularização AAA - Separado por domínio (Core apenas)
// v1.1.0: Adicionado try-catch em todos os metodos PDO

declare(strict_types=1);

require_once __DIR__ . '/RepositoryException.php';

class UsersRepository
{
    private PDO $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    // ════════════════════════════════════════════════════════════════════════
    // FIND METHODS
    // ════════════════════════════════════════════════════════════════════════

    public function findById(int $userId): ?array
    {
        try {
            $stmt = $this->pdo->prepare("
                SELECT u.id, u.username, u.email, u.status, u.avatar_url, u.locale,
                       u.last_login_at, u.created_at, u.updated_at,
                       p.nome, p.nome_resumido, p.nome_completo, p.funcao,
                       p.departamento, p.id_cargo, p.id_matricula
                FROM app_users u
                LEFT JOIN app_user_profiles p ON p.user_id = u.id
                WHERE u.id = ? AND u.deleted_at IS NULL
            ");
            $stmt->execute([$userId]);
            return $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'findById');
        }
    }

    public function findByUsername(string $username): ?array
    {
        try {
            $stmt = $this->pdo->prepare("
                SELECT u.*, p.nome, p.nome_completo, p.funcao, p.departamento
                FROM app_users u
                LEFT JOIN app_user_profiles p ON p.user_id = u.id
                WHERE u.username = ? AND u.deleted_at IS NULL
            ");
            $stmt->execute([$username]);
            return $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'findByUsername');
        }
    }

    public function findByEmail(string $email): ?array
    {
        try {
            $stmt = $this->pdo->prepare("
                SELECT u.*, p.nome, p.nome_completo, p.funcao, p.departamento
                FROM app_users u
                LEFT JOIN app_user_profiles p ON p.user_id = u.id
                WHERE u.email = ? AND u.deleted_at IS NULL
            ");
            $stmt->execute([$email]);
            return $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'findByEmail');
        }
    }

    // ════════════════════════════════════════════════════════════════════════
    // LIST METHODS
    // ════════════════════════════════════════════════════════════════════════

    public function list(
        ?string $search = null,
        ?string $status = null,
        ?string $roleKey = null,
        int $limit = 500,
        int $offset = 0
    ): array {
        try {
            $where = "u.deleted_at IS NULL";
            $params = [];

            if ($search) {
                $where .= " AND (u.username LIKE ? OR u.email LIKE ? OR p.nome LIKE ? OR p.nome_completo LIKE ?)";
                $searchTerm = "%{$search}%";
                $params = array_merge($params, [$searchTerm, $searchTerm, $searchTerm, $searchTerm]);
            }

            if ($status) {
                $where .= " AND u.status = ?";
                $params[] = $status;
            }

            $roleJoin = "";
            if ($roleKey) {
                $roleJoin = "JOIN app_user_roles ur_filter ON ur_filter.user_id = u.id AND ur_filter.deleted_at IS NULL
                             JOIN app_roles r_filter ON r_filter.id = ur_filter.role_id AND r_filter.role_key = ?";
                $params[] = $roleKey;
            }

            $countSql = "SELECT COUNT(DISTINCT u.id) FROM app_users u LEFT JOIN app_user_profiles p ON p.user_id = u.id $roleJoin WHERE $where";
            $countStmt = $this->pdo->prepare($countSql);
            $countStmt->execute($params);
            $total = (int)$countStmt->fetchColumn();

            $stmt = $this->pdo->prepare("
                SELECT DISTINCT u.id, u.username, u.email, u.status, u.avatar_url,
                       u.last_login_at, u.created_at, u.updated_at,
                       p.nome, p.nome_resumido, p.nome_completo, p.funcao, p.departamento
                FROM app_users u
                LEFT JOIN app_user_profiles p ON p.user_id = u.id
                $roleJoin
                WHERE $where
                ORDER BY u.created_at DESC
                LIMIT :limit OFFSET :offset
            ");

            foreach ($params as $key => $value) {
                $stmt->bindValue($key + 1, $value);
            }
            $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
            $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
            $stmt->execute();

            return ['users' => $stmt->fetchAll(PDO::FETCH_ASSOC), 'total' => $total];
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'list');
        }
    }

    // ════════════════════════════════════════════════════════════════════════
    // UPDATE METHODS
    // ════════════════════════════════════════════════════════════════════════

    public function updateUser(int $userId, array $data): bool
    {
        try {
            $allowedFields = ['username', 'email', 'status', 'avatar_url', 'locale'];
            $updates = [];
            $params = [];

            foreach ($allowedFields as $field) {
                if (isset($data[$field])) {
                    $updates[] = "$field = ?";
                    $params[] = $data[$field];
                }
            }

            if (empty($updates)) {
                return false;
            }

            $updates[] = "updated_at = NOW(3)";
            $params[] = $userId;

            $stmt = $this->pdo->prepare("UPDATE app_users SET " . implode(', ', $updates) . " WHERE id = ?");
            return $stmt->execute($params);
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'updateUser');
        }
    }

    public function resetPassword(int $userId, string $newPasswordHash): bool
    {
        try {
            $stmt = $this->pdo->prepare("UPDATE app_users SET password = ?, updated_at = NOW(3) WHERE id = ?");
            return $stmt->execute([$newPasswordHash, $userId]);
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'resetPassword');
        }
    }

    // ════════════════════════════════════════════════════════════════════════
    // COUNT METHODS
    // ════════════════════════════════════════════════════════════════════════

    public function countActiveUsers(): int
    {
        try {
            $stmt = $this->pdo->query("SELECT COUNT(*) FROM app_users WHERE deleted_at IS NULL AND status = 'active'");
            return (int)$stmt->fetchColumn();
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'countActiveUsers');
        }
    }

    public function countAll(): int
    {
        try {
            $stmt = $this->pdo->query("SELECT COUNT(*) FROM app_users WHERE deleted_at IS NULL");
            return (int)$stmt->fetchColumn();
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'countAll');
        }
    }
}
