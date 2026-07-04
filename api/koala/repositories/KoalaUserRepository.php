<?php
// /api/koala/repositories/KoalaUserRepository.php
// Acesso a koala_users (perfil próprio do Koala Docs). system_user_id faz a ponte com app_users.id.
// @module koala.repository.user
// @version 1.0.0
// @created 2026-07-03

declare(strict_types=1);

class KoalaUserRepository
{
    private \PDO $pdo;

    public function __construct(\PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    /** Busca o vínculo Koala pelo id do usuário do sistema (app_users.id). */
    public function findBySystemUserId(int $systemUserId): ?array
    {
        $stmt = $this->pdo->prepare(
            'SELECT id, system_user_id, name, email, role, is_active, created_at, updated_at
             FROM koala_users WHERE system_user_id = ? LIMIT 1'
        );
        $stmt->execute([$systemUserId]);
        $row = $stmt->fetch(\PDO::FETCH_ASSOC);
        return $row ?: null;
    }

    public function findById(int $id): ?array
    {
        $stmt = $this->pdo->prepare(
            'SELECT id, system_user_id, name, email, role, is_active, created_at, updated_at
             FROM koala_users WHERE id = ? LIMIT 1'
        );
        $stmt->execute([$id]);
        $row = $stmt->fetch(\PDO::FETCH_ASSOC);
        return $row ?: null;
    }

    /**
     * Cria o vínculo Koala com o papel mais restrito (seller) — auto-provisão no 1º acesso.
     * Retorna o id novo.
     */
    public function createSeller(int $systemUserId, ?string $name, ?string $email): int
    {
        $stmt = $this->pdo->prepare(
            "INSERT INTO koala_users (system_user_id, name, email, role, is_active)
             VALUES (?, ?, ?, 'seller', 1)"
        );
        $stmt->execute([$systemUserId, $name, $email]);
        return (int) $this->pdo->lastInsertId();
    }

    public function listAll(): array
    {
        return $this->pdo->query(
            'SELECT id, system_user_id, name, email, role, is_active, created_at, updated_at
             FROM koala_users ORDER BY name'
        )->fetchAll(\PDO::FETCH_ASSOC);
    }

    public function updateRole(int $id, string $role): bool
    {
        $stmt = $this->pdo->prepare('UPDATE koala_users SET role = ? WHERE id = ?');
        return $stmt->execute([$role, $id]);
    }

    /** Conta usuários ATIVOS com um dado papel (usado p/ impedir lockout do último admin). */
    public function countActiveByRole(string $role): int
    {
        $stmt = $this->pdo->prepare('SELECT COUNT(*) FROM koala_users WHERE role = ? AND is_active = 1');
        $stmt->execute([$role]);
        return (int) $stmt->fetchColumn();
    }

    /** Dados canônicos do usuário do sistema (para preencher name/email na provisão). */
    public function fetchSystemUser(int $systemUserId): ?array
    {
        $stmt = $this->pdo->prepare(
            'SELECT id, username, email FROM app_users WHERE id = ? AND deleted_at IS NULL LIMIT 1'
        );
        $stmt->execute([$systemUserId]);
        $row = $stmt->fetch(\PDO::FETCH_ASSOC);
        return $row ?: null;
    }
}
