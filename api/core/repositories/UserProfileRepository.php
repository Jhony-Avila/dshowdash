<?php
// UserProfileRepository - Camada de acesso a dados de perfil de usuario
// @version 1.0.0-ENTERPRISE
// @created 2026-01-21
// Extraído de UsersRepository para modularização AAA

declare(strict_types=1);

require_once __DIR__ . '/RepositoryException.php';

class UserProfileRepository
{
    private PDO $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    // ════════════════════════════════════════════════════════════════════════
    // FIND METHODS
    // ════════════════════════════════════════════════════════════════════════

    public function findByUserId(int $userId): ?array
    {
        try {
            $stmt = $this->pdo->prepare("
                SELECT user_id, nome, nome_resumido, nome_completo, funcao,
                       departamento, id_cargo, id_matricula, created_at, updated_at
                FROM app_user_profiles
                WHERE user_id = ?
            ");
            $stmt->execute([$userId]);
            return $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'findByUserId');
        }
    }

    public function exists(int $userId): bool
    {
        try {
            $stmt = $this->pdo->prepare("SELECT 1 FROM app_user_profiles WHERE user_id = ?");
            $stmt->execute([$userId]);
            return (bool)$stmt->fetch();
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'exists');
        }
    }

    // ════════════════════════════════════════════════════════════════════════
    // UPDATE METHODS
    // ════════════════════════════════════════════════════════════════════════

    public function update(int $userId, array $data): bool
    {
        try {
            $allowedFields = ['nome', 'nome_resumido', 'nome_completo', 'funcao', 'departamento', 'id_cargo', 'id_matricula'];
            $updates = [];
            $params = [];

            foreach ($allowedFields as $field) {
                if (array_key_exists($field, $data)) {
                    $updates[] = "$field = ?";
                    $params[] = $data[$field];
                }
            }

            if (empty($updates)) {
                return false;
            }

            if ($this->exists($userId)) {
                $updates[] = "updated_at = NOW(3)";
                $params[] = $userId;
                $stmt = $this->pdo->prepare("UPDATE app_user_profiles SET " . implode(', ', $updates) . " WHERE user_id = ?");
                return $stmt->execute($params);
            }

            return $this->create($userId, $data);
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'update');
        }
    }

    public function create(int $userId, array $data): bool
    {
        try {
            $allowedFields = ['nome', 'nome_resumido', 'nome_completo', 'funcao', 'departamento', 'id_cargo', 'id_matricula'];
            $fields = ['user_id'];
            $values = ['?'];
            $params = [$userId];

            foreach ($allowedFields as $field) {
                if (array_key_exists($field, $data)) {
                    $fields[] = $field;
                    $values[] = '?';
                    $params[] = $data[$field];
                }
            }

            $stmt = $this->pdo->prepare("INSERT INTO app_user_profiles (" . implode(', ', $fields) . ") VALUES (" . implode(', ', $values) . ")");
            return $stmt->execute($params);
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'create');
        }
    }

    public function delete(int $userId): bool
    {
        try {
            $stmt = $this->pdo->prepare("DELETE FROM app_user_profiles WHERE user_id = ?");
            return $stmt->execute([$userId]) && $stmt->rowCount() > 0;
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'delete');
        }
    }
}
