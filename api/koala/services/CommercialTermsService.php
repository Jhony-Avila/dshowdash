<?php
// /api/koala/services/CommercialTermsService.php
// Regras de condições comerciais. @module koala.service.commercial_terms @version 1.0.0
declare(strict_types=1);

class CommercialTermsService
{
    private CommercialTermRepository $repo;
    public function __construct(\PDO $pdo) { $this->repo = new CommercialTermRepository($pdo); }

    private static function requireName(array $d): void
    {
        if (trim((string) ($d['name'] ?? '')) === '') {
            ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 422, ['field' => 'name', 'message' => 'Nome obrigatorio']);
        }
    }

    public function list(): array { return $this->repo->listAll(true); }

    public function create(array $d, ?int $createdBy): array
    {
        self::requireName($d);
        $id = $this->repo->create($d, $createdBy);
        return $this->repo->findById($id) ?? [];
    }

    public function update(int $id, array $d): array
    {
        if ($this->repo->findById($id) === null) {
            ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404, ['id' => $id]);
        }
        self::requireName($d);
        $this->repo->update($id, $d);
        return $this->repo->findById($id) ?? [];
    }
}
