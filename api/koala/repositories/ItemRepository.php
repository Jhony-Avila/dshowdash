<?php
// /api/koala/repositories/ItemRepository.php
// Acesso a koala_items_catalog (bi-moeda brl/usd). @module koala.repository.item @version 1.0.0
declare(strict_types=1);

class ItemRepository
{
    private \PDO $pdo;
    public function __construct(\PDO $pdo) { $this->pdo = $pdo; }

    private const COLS = 'id, sku, name, description, category_id, unit_measure,
        default_unit_price_brl, default_unit_price_usd, is_active, created_by, created_at, updated_at';

    public function listAll(bool $activeOnly = true, ?int $categoryId = null): array
    {
        // +category_name (subquery evita JOIN ambíguo com COLS bare). Aditivo p/ a coluna Categoria da lista.
        $sql = 'SELECT ' . self::COLS . ',
                (SELECT name FROM koala_item_categories c WHERE c.id = koala_items_catalog.category_id) AS category_name
             FROM koala_items_catalog WHERE deleted_at IS NULL';
        $params = [];
        if ($activeOnly) { $sql .= ' AND is_active = 1'; }
        if ($categoryId !== null) { $sql .= ' AND category_id = ?'; $params[] = $categoryId; }
        $sql .= ' ORDER BY name';
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }

    public function search(string $q, ?int $categoryId = null): array
    {
        $sql = 'SELECT ' . self::COLS . ' FROM koala_items_catalog
                WHERE deleted_at IS NULL AND is_active = 1 AND (name LIKE ? OR description LIKE ? OR sku LIKE ?)';
        $like = '%' . $q . '%';
        $params = [$like, $like, $like];
        if ($categoryId !== null) { $sql .= ' AND category_id = ?'; $params[] = $categoryId; }
        $sql .= ' ORDER BY name LIMIT 50';
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }

    public function findById(int $id): ?array
    {
        $stmt = $this->pdo->prepare('SELECT ' . self::COLS . ' FROM koala_items_catalog WHERE id = ? AND deleted_at IS NULL LIMIT 1');
        $stmt->execute([$id]);
        return $stmt->fetch(\PDO::FETCH_ASSOC) ?: null;
    }

    public function create(array $d, ?int $createdBy): int
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO koala_items_catalog
              (sku, name, description, category_id, unit_measure, default_unit_price_brl, default_unit_price_usd, is_active, created_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)'
        );
        $stmt->execute([
            $d['sku'] ?? null, $d['name'], $d['description'] ?? null,
            $d['category_id'] ?? null, $d['unit_measure'] ?? null,
            $d['default_unit_price_brl'] ?? null, $d['default_unit_price_usd'] ?? null, $createdBy,
        ]);
        return (int) $this->pdo->lastInsertId();
    }

    public function update(int $id, array $d): bool
    {
        $stmt = $this->pdo->prepare(
            'UPDATE koala_items_catalog SET
              sku = ?, name = ?, description = ?, category_id = ?, unit_measure = ?,
              default_unit_price_brl = ?, default_unit_price_usd = ?
             WHERE id = ? AND deleted_at IS NULL'
        );
        return $stmt->execute([
            $d['sku'] ?? null, $d['name'], $d['description'] ?? null,
            $d['category_id'] ?? null, $d['unit_measure'] ?? null,
            $d['default_unit_price_brl'] ?? null, $d['default_unit_price_usd'] ?? null, $id,
        ]);
    }

    /** Soft-delete (regra da casa): is_active=0 + deleted_at. Nada removido fisicamente. */
    public function deactivate(int $id): bool
    {
        $stmt = $this->pdo->prepare('UPDATE koala_items_catalog SET is_active = 0, deleted_at = NOW() WHERE id = ?');
        return $stmt->execute([$id]);
    }
}
