<?php
// /api/koala/repositories/CommercialTermRepository.php
// Acesso a koala_commercial_terms. @module koala.repository.commercial_term @version 1.0.0
declare(strict_types=1);

class CommercialTermRepository
{
    private \PDO $pdo;
    public function __construct(\PDO $pdo) { $this->pdo = $pdo; }

    public function listAll(bool $activeOnly = true): array
    {
        $sql = 'SELECT id, name, description, content, is_active, created_by, created_at, updated_at FROM koala_commercial_terms';
        if ($activeOnly) { $sql .= ' WHERE is_active = 1'; }
        $sql .= ' ORDER BY name';
        return $this->pdo->query($sql)->fetchAll(\PDO::FETCH_ASSOC);
    }

    public function findById(int $id): ?array
    {
        $stmt = $this->pdo->prepare('SELECT * FROM koala_commercial_terms WHERE id = ? LIMIT 1');
        $stmt->execute([$id]);
        return $stmt->fetch(\PDO::FETCH_ASSOC) ?: null;
    }

    public function create(array $d, ?int $createdBy): int
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO koala_commercial_terms (name, description, content, is_active, created_by) VALUES (?, ?, ?, 1, ?)'
        );
        $stmt->execute([$d['name'], $d['description'] ?? null, $d['content'] ?? null, $createdBy]);
        return (int) $this->pdo->lastInsertId();
    }

    public function update(int $id, array $d): bool
    {
        $stmt = $this->pdo->prepare(
            'UPDATE koala_commercial_terms SET name = ?, description = ?, content = ?, is_active = ? WHERE id = ?'
        );
        return $stmt->execute([$d['name'], $d['description'] ?? null, $d['content'] ?? null, (int)($d['is_active'] ?? 1), $id]);
    }
}
