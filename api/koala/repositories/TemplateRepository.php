<?php
// /api/koala/repositories/TemplateRepository.php
// Acesso a koala_templates + koala_template_versions. @module koala.repository.template @version 1.0.0
declare(strict_types=1);

class TemplateRepository
{
    private \PDO $pdo;
    public function __construct(\PDO $pdo) { $this->pdo = $pdo; }

    public function listPublished(): array
    {
        return $this->pdo->query(
            "SELECT id, name, slug, description, segment, status, orientation, page_format, is_default, current_version_id
             FROM koala_templates
             WHERE status = 'published' AND deleted_at IS NULL
             ORDER BY is_default DESC, name"
        )->fetchAll(\PDO::FETCH_ASSOC);
    }

    public function findById(int $id): ?array
    {
        $stmt = $this->pdo->prepare(
            'SELECT id, name, slug, description, segment, status, orientation, page_format, is_default, current_version_id
             FROM koala_templates WHERE id = ? AND deleted_at IS NULL LIMIT 1'
        );
        $stmt->execute([$id]);
        return $stmt->fetch(\PDO::FETCH_ASSOC) ?: null;
    }

    /** Id do template default publicado (Generico). Base do default explícito da proposta. */
    public function defaultPublishedId(): ?int
    {
        $id = $this->pdo->query(
            "SELECT id FROM koala_templates WHERE is_default = 1 AND status = 'published' AND deleted_at IS NULL ORDER BY id LIMIT 1"
        )->fetchColumn();
        return $id ? (int) $id : null;
    }

    /** Lista p/ o SELETOR: templates publicados (escolhíveis) + nº de páginas da versão publicada. */
    public function pickerList(): array
    {
        $rows = $this->pdo->query(
            "SELECT t.id, t.name, t.description, t.is_default, v.structure_json
             FROM koala_templates t
             JOIN koala_template_versions v ON v.id = t.current_version_id
             WHERE t.status = 'published' AND t.deleted_at IS NULL
             ORDER BY t.is_default DESC, t.name"
        )->fetchAll(\PDO::FETCH_ASSOC);
        return array_map(static function ($r) {
            $s = json_decode((string) $r['structure_json'], true);
            $pages = (is_array($s) && isset($s['pages']) && is_array($s['pages'])) ? count($s['pages']) : 0;
            return [
                'id' => (int) $r['id'],
                'name' => $r['name'],
                'description' => $r['description'],
                'is_default' => (int) $r['is_default'] === 1,
                'pages' => $pages,
            ];
        }, $rows);
    }

    /** Versão corrente (structure_json) do template. */
    public function getCurrentVersion(int $templateId): ?array
    {
        $stmt = $this->pdo->prepare(
            'SELECT v.id, v.template_id, v.version_number, v.structure_json, v.status
             FROM koala_template_versions v
             JOIN koala_templates t ON t.current_version_id = v.id
             WHERE t.id = ? LIMIT 1'
        );
        $stmt->execute([$templateId]);
        return $stmt->fetch(\PDO::FETCH_ASSOC) ?: null;
    }

    // ───────────────────────── Gestão (F6) ─────────────────────────

    /** Lista de GESTÃO: todos os não-deletados (inclui inativos), com versão publicada e flag de rascunho. */
    public function listForManagement(): array
    {
        return $this->pdo->query(
            "SELECT t.id, t.name, t.slug, t.description, t.segment, t.status, t.orientation,
                    t.page_format, t.is_default, t.current_version_id, t.updated_at,
                    cv.version_number AS published_version,
                    (SELECT COUNT(*) FROM koala_template_versions d
                       WHERE d.template_id = t.id AND d.status = 'draft') AS has_draft
             FROM koala_templates t
             LEFT JOIN koala_template_versions cv ON cv.id = t.current_version_id
             WHERE t.deleted_at IS NULL
             ORDER BY t.is_default DESC, t.updated_at DESC"
        )->fetchAll(\PDO::FETCH_ASSOC);
    }

    /** Rascunho pendente (status='draft') mais recente do template, ou null. */
    public function getDraftVersion(int $templateId): ?array
    {
        $stmt = $this->pdo->prepare(
            "SELECT id, template_id, version_number, structure_json, status
             FROM koala_template_versions
             WHERE template_id = ? AND status = 'draft'
             ORDER BY version_number DESC LIMIT 1"
        );
        $stmt->execute([$templateId]);
        return $stmt->fetch(\PDO::FETCH_ASSOC) ?: null;
    }

    /** Histórico de versões (recente primeiro) com nome do autor. */
    public function listVersions(int $templateId): array
    {
        $stmt = $this->pdo->prepare(
            "SELECT v.id, v.version_number, v.status, v.created_at, v.created_by, u.name AS author_name
             FROM koala_template_versions v
             LEFT JOIN koala_users u ON u.id = v.created_by
             WHERE v.template_id = ?
             ORDER BY v.version_number DESC"
        );
        $stmt->execute([$templateId]);
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }

    public function maxVersionNumber(int $templateId): int
    {
        $stmt = $this->pdo->prepare('SELECT COALESCE(MAX(version_number),0) FROM koala_template_versions WHERE template_id = ?');
        $stmt->execute([$templateId]);
        return (int) $stmt->fetchColumn();
    }

    public function slugExists(string $slug): bool
    {
        $stmt = $this->pdo->prepare('SELECT 1 FROM koala_templates WHERE slug = ? LIMIT 1');
        $stmt->execute([$slug]);
        return (bool) $stmt->fetchColumn();
    }

    public function insertTemplate(array $d): int
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO koala_templates (name, slug, description, segment, status, orientation, page_format, is_default, created_by)
             VALUES (:name, :slug, :desc, :seg, :st, :ori, :fmt, 0, :cby)'
        );
        $stmt->execute([
            ':name' => $d['name'], ':slug' => $d['slug'], ':desc' => $d['description'] ?? null,
            ':seg' => $d['segment'] ?? null, ':st' => $d['status'] ?? 'inactive',
            ':ori' => $d['orientation'] ?? 'portrait', ':fmt' => $d['page_format'] ?? 'A4',
            ':cby' => $d['created_by'] ?? null,
        ]);
        return (int) $this->pdo->lastInsertId();
    }

    public function insertVersion(int $templateId, int $versionNumber, string $structureJson, string $status, ?int $createdBy): int
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO koala_template_versions (template_id, version_number, structure_json, status, created_by)
             VALUES (?, ?, ?, ?, ?)'
        );
        $stmt->execute([$templateId, $versionNumber, $structureJson, $status, $createdBy]);
        return (int) $this->pdo->lastInsertId();
    }

    public function updateVersionStructure(int $versionId, string $structureJson): bool
    {
        $stmt = $this->pdo->prepare('UPDATE koala_template_versions SET structure_json = ? WHERE id = ?');
        return $stmt->execute([$structureJson, $versionId]);
    }

    public function setVersionStatus(int $versionId, string $status): bool
    {
        $stmt = $this->pdo->prepare('UPDATE koala_template_versions SET status = ? WHERE id = ?');
        return $stmt->execute([$status, $versionId]);
    }

    /** Edita metadados (whitelist name/description/segment). */
    public function updateMeta(int $id, array $d): bool
    {
        $set = [];
        $params = [];
        foreach (['name', 'description', 'segment'] as $f) {
            if (array_key_exists($f, $d)) { $set[] = "$f = ?"; $params[] = $d[$f]; }
        }
        if (!$set) { return false; }
        $params[] = $id;
        $stmt = $this->pdo->prepare('UPDATE koala_templates SET ' . implode(', ', $set) . ' WHERE id = ? AND deleted_at IS NULL');
        return $stmt->execute($params);
    }

    public function setCurrentVersion(int $templateId, int $versionId): bool
    {
        $stmt = $this->pdo->prepare('UPDATE koala_templates SET current_version_id = ? WHERE id = ?');
        return $stmt->execute([$versionId, $templateId]);
    }

    public function setStatus(int $templateId, string $status): bool
    {
        $stmt = $this->pdo->prepare('UPDATE koala_templates SET status = ? WHERE id = ? AND deleted_at IS NULL');
        return $stmt->execute([$status, $templateId]);
    }

    public function softDelete(int $templateId): bool
    {
        $stmt = $this->pdo->prepare('UPDATE koala_templates SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL');
        return $stmt->execute([$templateId]);
    }

    /** Nº de templates ATIVOS (published, não-deletados). Base da guarda "único ativo". */
    public function countActivePublished(): int
    {
        return (int) $this->pdo->query(
            "SELECT COUNT(*) FROM koala_templates WHERE status = 'published' AND deleted_at IS NULL"
        )->fetchColumn();
    }
}
