<?php
// /api/koala/services/PaymentTermsService.php
// Regras de formas de pagamento reutilizáveis. @module koala.service.payment_terms @version 1.0.0
declare(strict_types=1);

class PaymentTermsService
{
    private PaymentMethodRepository $repo;
    public function __construct(\PDO $pdo) { $this->repo = new PaymentMethodRepository($pdo); }

    private static function validate(array $d): void
    {
        if (trim((string) ($d['name'] ?? '')) === '') {
            ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 422, ['field' => 'name', 'message' => 'Nome obrigatorio']);
        }
        $type = $d['payment_type'] ?? 'custom';
        if (!in_array($type, PaymentMethodRepository::validTypes(), true)) {
            ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 422, [
                'field' => 'payment_type', 'allowed' => PaymentMethodRepository::validTypes(),
            ]);
        }
    }

    public function list(): array { return $this->repo->listAll(true); }

    public function create(array $d, ?int $createdBy): array
    {
        self::validate($d);
        $id = $this->repo->create($d, $createdBy);
        return $this->repo->findById($id) ?? [];
    }

    public function update(int $id, array $d): array
    {
        if ($this->repo->findById($id) === null) {
            ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404, ['id' => $id]);
        }
        self::validate($d);
        $this->repo->update($id, $d);
        return $this->repo->findById($id) ?? [];
    }
}
