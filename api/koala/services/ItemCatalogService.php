<?php
// /api/koala/services/ItemCatalogService.php
// Regras de itens e categorias do catálogo. @module koala.service.item_catalog @version 1.0.0
declare(strict_types=1);

class ItemCatalogService
{
    private ItemRepository $items;
    private ItemCategoryRepository $categories;

    public function __construct(\PDO $pdo)
    {
        $this->items = new ItemRepository($pdo);
        $this->categories = new ItemCategoryRepository($pdo);
    }

    private static function slugify(string $s): string
    {
        $s = strtolower(trim($s));
        $s = preg_replace('/[^a-z0-9]+/', '-', $s) ?? '';
        return trim($s, '-') ?: 'categoria';
    }

    private static function requireName(array $d): string
    {
        $name = trim((string) ($d['name'] ?? ''));
        if ($name === '') {
            ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 422, ['field' => 'name', 'message' => 'Nome obrigatorio']);
        }
        return $name;
    }

    // ── categorias ──
    public function listCategories(): array { return $this->categories->listAll(true); }

    public function createCategory(array $d): array
    {
        $name = self::requireName($d);
        $slug = trim((string) ($d['slug'] ?? '')) ?: self::slugify($name);
        $id = $this->categories->create($name, $slug, $d['description'] ?? null);
        return $this->categories->findById($id) ?? [];
    }

    // ── itens ──
    public function listItems(?int $categoryId): array { return $this->items->listAll(true, $categoryId); }

    public function searchItems(string $q, ?int $categoryId): array { return $this->items->search($q, $categoryId); }

    public function createItem(array $d, ?int $createdBy): array
    {
        self::requireName($d);
        $id = $this->items->create($d, $createdBy);
        return $this->items->findById($id) ?? [];
    }

    public function updateItem(int $id, array $d): array
    {
        if ($this->items->findById($id) === null) {
            ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404, ['id' => $id]);
        }
        self::requireName($d);
        $this->items->update($id, $d);
        return $this->items->findById($id) ?? [];
    }

    public function deactivateItem(int $id): void
    {
        if ($this->items->findById($id) === null) {
            ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404, ['id' => $id]);
        }
        $this->items->deactivate($id);
    }
}
