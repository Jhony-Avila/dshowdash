<?php
// /api/koala/repositories/SectionImageRepository.php
// Imagens por seção (koala_section_images). @module koala.repository.section_image @version 1.0.0
declare(strict_types=1);

class SectionImageRepository
{
    private \PDO $pdo;
    public function __construct(\PDO $pdo) { $this->pdo = $pdo; }

    private const COLS = 'id, section_id, title, file_name, original_name, file_path, mime_type, file_size, width, height, display_order, uploaded_by, created_at';

    public function listBySection(int $sectionId): array
    {
        $stmt = $this->pdo->prepare('SELECT ' . self::COLS . ' FROM koala_section_images WHERE section_id = ? AND deleted_at IS NULL ORDER BY display_order, id');
        $stmt->execute([$sectionId]);
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }

    public function findById(int $id): ?array
    {
        $stmt = $this->pdo->prepare('SELECT ' . self::COLS . ', deleted_at FROM koala_section_images WHERE id = ? LIMIT 1');
        $stmt->execute([$id]);
        return $stmt->fetch(\PDO::FETCH_ASSOC) ?: null;
    }

    public function insert(array $d): int
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO koala_section_images (section_id, title, file_name, original_name, file_path, mime_type, file_size, width, height, uploaded_by)
             VALUES (:sid, :title, :fn, :on, :fp, :mime, :size, :w, :h, :ub)'
        );
        $stmt->execute([
            ':sid' => $d['section_id'], ':title' => $d['title'] ?? null,
            ':fn' => $d['file_name'], ':on' => $d['original_name'] ?? null, ':fp' => $d['file_path'],
            ':mime' => $d['mime_type'], ':size' => $d['file_size'],
            ':w' => $d['width'] ?? null, ':h' => $d['height'] ?? null, ':ub' => $d['uploaded_by'] ?? null,
        ]);
        return (int) $this->pdo->lastInsertId();
    }

    /** Soft-delete + registra o novo caminho (arquivo movido p/ _trash, não some do disco). */
    public function softDelete(int $id, string $newPath): bool
    {
        $stmt = $this->pdo->prepare('UPDATE koala_section_images SET deleted_at = NOW(), file_path = ? WHERE id = ? AND deleted_at IS NULL');
        return $stmt->execute([$newPath, $id]);
    }
}
