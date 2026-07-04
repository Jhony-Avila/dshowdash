<?php
// /api/koala/repositories/SectionRepository.php
// Catálogo de seções reutilizáveis (koala_sections_catalog). @module koala.repository.section @version 1.0.0
declare(strict_types=1);

class SectionRepository
{
    private \PDO $pdo;
    public function __construct(\PDO $pdo) { $this->pdo = $pdo; }

    private const COLS = 'id, section_key, name, description, section_type, display_order, is_active, created_by, created_at, updated_at';

    /** Lista com contagem de imagens ativas por seção. */
    public function listAll(): array
    {
        return $this->pdo->query(
            "SELECT s.id, s.section_key, s.name, s.description, s.section_type, s.display_order, s.is_active, s.updated_at,
                    (SELECT COUNT(*) FROM koala_section_images i WHERE i.section_id = s.id AND i.deleted_at IS NULL) AS image_count
             FROM koala_sections_catalog s
             WHERE s.deleted_at IS NULL
             ORDER BY s.display_order, s.name"
        )->fetchAll(\PDO::FETCH_ASSOC);
    }

    public function findById(int $id): ?array
    {
        $stmt = $this->pdo->prepare('SELECT ' . self::COLS . ' FROM koala_sections_catalog WHERE id = ? AND deleted_at IS NULL LIMIT 1');
        $stmt->execute([$id]);
        return $stmt->fetch(\PDO::FETCH_ASSOC) ?: null;
    }

    public function keyExists(string $key): bool
    {
        $stmt = $this->pdo->prepare('SELECT 1 FROM koala_sections_catalog WHERE section_key = ? LIMIT 1');
        $stmt->execute([$key]);
        return (bool) $stmt->fetchColumn();
    }

    public function insert(array $d): int
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO koala_sections_catalog (section_key, name, description, section_type, structure_json, display_order, is_active, created_by)
             VALUES (:key, :name, :desc, :type, :struct, :ord, 1, :cby)'
        );
        $stmt->execute([
            ':key' => $d['section_key'], ':name' => $d['name'], ':desc' => $d['description'] ?? null,
            ':type' => $d['section_type'] ?? null, ':struct' => $d['structure_json'] ?? null,
            ':ord' => $d['display_order'] ?? 0, ':cby' => $d['created_by'] ?? null,
        ]);
        return (int) $this->pdo->lastInsertId();
    }

    /** id da seção viva por chave (para seed idempotente). */
    public function idByKey(string $key): ?int
    {
        $stmt = $this->pdo->prepare('SELECT id FROM koala_sections_catalog WHERE section_key = ? AND deleted_at IS NULL LIMIT 1');
        $stmt->execute([$key]);
        $id = $stmt->fetchColumn();
        return $id === false ? null : (int) $id;
    }

    /** structure_json cru (string) ou null se a seção não tem estrutura própria. */
    public function getStructure(int $id): ?string
    {
        $stmt = $this->pdo->prepare('SELECT structure_json FROM koala_sections_catalog WHERE id = ? AND deleted_at IS NULL LIMIT 1');
        $stmt->execute([$id]);
        $v = $stmt->fetchColumn();
        return ($v === false || $v === null) ? null : (string) $v;
    }

    public function setStructure(int $id, ?string $json): bool
    {
        $stmt = $this->pdo->prepare('UPDATE koala_sections_catalog SET structure_json = ? WHERE id = ? AND deleted_at IS NULL');
        return $stmt->execute([$json, $id]);
    }

    public function updateMeta(int $id, array $d): bool
    {
        $set = [];
        $params = [];
        foreach (['name', 'description', 'section_type', 'display_order'] as $f) {
            if (array_key_exists($f, $d)) { $set[] = "$f = ?"; $params[] = $d[$f]; }
        }
        if (!$set) { return false; }
        $params[] = $id;
        $stmt = $this->pdo->prepare('UPDATE koala_sections_catalog SET ' . implode(', ', $set) . ' WHERE id = ? AND deleted_at IS NULL');
        return $stmt->execute($params);
    }

    public function setActive(int $id, bool $active): bool
    {
        $stmt = $this->pdo->prepare('UPDATE koala_sections_catalog SET is_active = ? WHERE id = ? AND deleted_at IS NULL');
        return $stmt->execute([$active ? 1 : 0, $id]);
    }

    public function softDelete(int $id): bool
    {
        $stmt = $this->pdo->prepare('UPDATE koala_sections_catalog SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL');
        return $stmt->execute([$id]);
    }
}
