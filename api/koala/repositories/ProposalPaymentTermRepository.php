<?php
// /api/koala/repositories/ProposalPaymentTermRepository.php
// Vínculo forma-de-pagamento ↔ proposta (koala_proposal_payment_terms).
// @module koala.repository.proposal_payment_term @version 1.0.0
declare(strict_types=1);

class ProposalPaymentTermRepository
{
    private \PDO $pdo;
    public function __construct(\PDO $pdo) { $this->pdo = $pdo; }

    /** Lista os vínculos da proposta com o nome da forma de pagamento (join no catálogo). */
    public function listByProposal(int $proposalId): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT t.id, t.proposal_id, t.payment_method_id, t.down_payment_value, t.installments_quantity,
                    t.installment_value, t.first_due_date, t.free_observations, pm.name AS payment_method_name
             FROM koala_proposal_payment_terms t
             LEFT JOIN koala_payment_methods pm ON pm.id = t.payment_method_id
             WHERE t.proposal_id = ? ORDER BY t.id'
        );
        $stmt->execute([$proposalId]);
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }

    public function findById(int $id): ?array
    {
        $stmt = $this->pdo->prepare('SELECT * FROM koala_proposal_payment_terms WHERE id = ? LIMIT 1');
        $stmt->execute([$id]);
        return $stmt->fetch(\PDO::FETCH_ASSOC) ?: null;
    }

    public function insert(int $proposalId, array $d): int
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO koala_proposal_payment_terms
              (proposal_id, payment_method_id, down_payment_value, installments_quantity, installment_value, first_due_date, free_observations)
             VALUES (:pid, :pm, :dp, :iq, :iv, :fd, :obs)'
        );
        $stmt->execute([
            ':pid' => $proposalId, ':pm' => $d['payment_method_id'] ?? null,
            ':dp' => $d['down_payment_value'] ?? null, ':iq' => $d['installments_quantity'] ?? null,
            ':iv' => $d['installment_value'] ?? null, ':fd' => $d['first_due_date'] ?? null,
            ':obs' => $d['free_observations'] ?? null,
        ]);
        return (int) $this->pdo->lastInsertId();
    }

    public function delete(int $id): bool
    {
        $stmt = $this->pdo->prepare('DELETE FROM koala_proposal_payment_terms WHERE id = ?');
        return $stmt->execute([$id]);
    }
}
