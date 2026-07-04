<?php
// /api/koala/services/SectionService.php
// Gestão do CATÁLOGO de seções reutilizáveis. Gate ADMIN fica no controller.
// @module koala.service.section @version 1.0.0
declare(strict_types=1);

class SectionService
{
    private \PDO $pdo;
    private SectionRepository $repo;

    public function __construct(\PDO $pdo)
    {
        $this->pdo = $pdo;
        $this->repo = new SectionRepository($pdo);
    }

    public function list(): array { return $this->repo->listAll(); }

    public function get(int $id): array
    {
        $s = $this->repo->findById($id);
        if ($s === null) { ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404, ['id' => $id]); }
        return $s;
    }

    public function create(array $koala, array $d): array
    {
        $name = trim((string) ($d['name'] ?? ''));
        if ($name === '') {
            ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 422, ['field' => 'name', 'message' => 'Nome obrigatorio']);
        }
        $key = trim((string) ($d['section_key'] ?? ''));
        $key = $key !== '' ? self::slugify($key) : self::slugify($name);
        $key = $this->uniqueKey($key);
        $id = $this->repo->insert([
            'section_key'    => $key,
            'name'           => $name,
            'description'    => $d['description'] ?? null,
            'section_type'   => $d['section_type'] ?? null,
            'structure_json' => $d['structure_json'] ?? null,
            'display_order'  => (int) ($d['display_order'] ?? 0),
            'created_by'     => (int) $koala['id'],
        ]);
        return $this->get($id);
    }

    public function update(array $koala, int $id, array $d): array
    {
        $this->get($id); // 404 se não existe
        if (array_key_exists('name', $d) && trim((string) $d['name']) === '') {
            ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 422, ['field' => 'name', 'message' => 'Nome nao pode ser vazio']);
        }
        $this->repo->updateMeta($id, $d);
        return $this->get($id);
    }

    public function setActive(array $koala, int $id, bool $active): array
    {
        $this->get($id);
        $this->repo->setActive($id, $active);
        return $this->get($id);
    }

    public function softDelete(array $koala, int $id): array
    {
        $this->get($id);
        $this->repo->softDelete($id);
        return ['deleted' => $id];
    }

    // ── helpers ──
    public static function slugify(string $s): string
    {
        $ascii = @iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $s);
        if ($ascii === false) { $ascii = $s; }
        $slug = trim(preg_replace('/[^a-z0-9]+/', '-', strtolower($ascii)), '-');
        return $slug === '' ? 'secao' : $slug;
    }

    private function uniqueKey(string $base): string
    {
        $key = $base;
        $i = 2;
        while ($this->repo->keyExists($key)) { $key = $base . '-' . $i; $i++; }
        return $key;
    }
}
