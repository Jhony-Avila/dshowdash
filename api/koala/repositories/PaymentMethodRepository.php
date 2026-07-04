<?php
// /api/koala/repositories/PaymentMethodRepository.php
// Acesso a koala_payment_methods. @module koala.repository.payment_method @version 1.0.0
declare(strict_types=1);

class PaymentMethodRepository
{
    private \PDO $pdo;
    public function __construct(\PDO $pdo) { $this->pdo = $pdo; }

    private const TYPES = ['cash','installment','bank_transfer','boleto','pix','custom'];

    public static function validTypes(): array { return self::TYPES; }

    public function listAll(bool $activeOnly = true): array
    {
        $sql = 'SELECT id, name, description, payment_type, installments_quantity, down_payment_percent,
                       down_payment_value, first_due_days, is_active, created_by, created_at, updated_at
                FROM koala_payment_methods';
        if ($activeOnly) { $sql .= ' WHERE is_active = 1'; }
        $sql .= ' ORDER BY name';
        return $this->pdo->query($sql)->fetchAll(\PDO::FETCH_ASSOC);
    }

    public function findById(int $id): ?array
    {
        $stmt = $this->pdo->prepare('SELECT * FROM koala_payment_methods WHERE id = ? LIMIT 1');
        $stmt->execute([$id]);
        return $stmt->fetch(\PDO::FETCH_ASSOC) ?: null;
    }

    public function create(array $d, ?int $createdBy): int
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO koala_payment_methods
              (name, description, payment_type, installments_quantity, down_payment_percent, down_payment_value, first_due_days, is_active, created_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)'
        );
        $stmt->execute([
            $d['name'], $d['description'] ?? null, $d['payment_type'] ?? 'custom',
            $d['installments_quantity'] ?? null, $d['down_payment_percent'] ?? null,
            $d['down_payment_value'] ?? null, $d['first_due_days'] ?? null, $createdBy,
        ]);
        return (int) $this->pdo->lastInsertId();
    }

    public function update(int $id, array $d): bool
    {
        $stmt = $this->pdo->prepare(
            'UPDATE koala_payment_methods SET
              name = ?, description = ?, payment_type = ?, installments_quantity = ?,
              down_payment_percent = ?, down_payment_value = ?, first_due_days = ?, is_active = ?
             WHERE id = ?'
        );
        return $stmt->execute([
            $d['name'], $d['description'] ?? null, $d['payment_type'] ?? 'custom',
            $d['installments_quantity'] ?? null, $d['down_payment_percent'] ?? null,
            $d['down_payment_value'] ?? null, $d['first_due_days'] ?? null, (int)($d['is_active'] ?? 1), $id,
        ]);
    }
}
