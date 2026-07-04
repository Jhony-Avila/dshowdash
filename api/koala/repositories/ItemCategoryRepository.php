<?php
// /api/koala/repositories/ItemCategoryRepository.php
// Acesso a koala_item_categories. @module koala.repository.item_category @version 1.0.0
declare(strict_types=1);

class ItemCategoryRepository
{
    private \PDO $pdo;
    public function __construct(\PDO $pdo) { $this->pdo = $pdo; }

    public function listAll(bool $activeOnly = true): array
    {
        $sql = 'SELECT id, name, slug, description, is_active, created_at, updated_at FROM koala_item_categories';
        if ($activeOnly) { $sql .= ' WHERE is_active = 1'; }
        $sql .= ' ORDER BY name';
        return $this->pdo->query($sql)->fetchAll(\PDO::FETCH_ASSOC);
    }

    public function findById(int $id): ?array
    {
        $stmt = $this->pdo->prepare('SELECT * FROM koala_item_categories WHERE id = ? LIMIT 1');
        $stmt->execute([$id]);
        return $stmt->fetch(\PDO::FETCH_ASSOC) ?: null;
    }

    public function create(string $name, string $slug, ?string $description): int
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO koala_item_categories (name, slug, description, is_active) VALUES (?, ?, ?, 1)'
        );
        $stmt->execute([$name, $slug, $description]);
        return (int) $this->pdo->lastInsertId();
    }
}
