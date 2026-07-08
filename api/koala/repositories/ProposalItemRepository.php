<?php
// /api/koala/repositories/ProposalItemRepository.php
// Line items do RASCUNHO da proposta (proposal_version_id IS NULL). @module koala.repository.proposal_item @version 1.0.0
declare(strict_types=1);

class ProposalItemRepository
{
    private \PDO $pdo;
    public function __construct(\PDO $pdo) { $this->pdo = $pdo; }

    private const COLS = 'id, proposal_id, proposal_version_id, catalog_item_id, description, category_name,
        quantity, unit_measure, unit_price, discount_value, discount_percent, addition_value, addition_percent,
        subtotal, observation, display_order';

    public function listDraft(int $proposalId): array
    {
        $stmt = $this->pdo->prepare('SELECT ' . self::COLS . ' FROM koala_proposal_items
            WHERE proposal_id = ? AND proposal_version_id IS NULL AND deleted_at IS NULL ORDER BY display_order, id');
        $stmt->execute([$proposalId]);
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }

    public function findById(int $itemId): ?array
    {
        $stmt = $this->pdo->prepare('SELECT ' . self::COLS . ' FROM koala_proposal_items WHERE id = ? AND deleted_at IS NULL LIMIT 1');
        $stmt->execute([$itemId]);
        return $stmt->fetch(\PDO::FETCH_ASSOC) ?: null;
    }

    public function maxOrder(int $proposalId): int
    {
        $stmt = $this->pdo->prepare('SELECT COALESCE(MAX(display_order),0) FROM koala_proposal_items WHERE proposal_id = ? AND proposal_version_id IS NULL AND deleted_at IS NULL');
        $stmt->execute([$proposalId]);
        return (int) $stmt->fetchColumn();
    }

    public function insert(int $proposalId, array $d): int
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO koala_proposal_items
              (proposal_id, proposal_version_id, catalog_item_id, description, category_name, quantity, unit_measure,
               unit_price, discount_value, discount_percent, addition_value, addition_percent, subtotal, observation, display_order)
             VALUES (:pid, NULL, :cat, :desc, :catn, :qty, :um, :up, :dv, :dp, :av, :ap, :sub, :obs, :ord)'
        );
        $stmt->execute([
            ':pid' => $proposalId, ':cat' => $d['catalog_item_id'] ?? null, ':desc' => $d['description'],
            ':catn' => $d['category_name'] ?? null, ':qty' => $d['quantity'], ':um' => $d['unit_measure'] ?? null,
            ':up' => $d['unit_price'], ':dv' => $d['discount_value'] ?? null, ':dp' => $d['discount_percent'] ?? null,
            ':av' => $d['addition_value'] ?? null, ':ap' => $d['addition_percent'] ?? null,
            ':sub' => $d['subtotal'], ':obs' => $d['observation'] ?? null, ':ord' => $d['display_order'] ?? 0,
        ]);
        return (int) $this->pdo->lastInsertId();
    }

    public function update(int $itemId, array $d): bool
    {
        $stmt = $this->pdo->prepare(
            'UPDATE koala_proposal_items SET description=:desc, category_name=:catn, quantity=:qty, unit_measure=:um,
               unit_price=:up, discount_value=:dv, discount_percent=:dp, addition_value=:av, addition_percent=:ap,
               subtotal=:sub, observation=:obs WHERE id=:id AND proposal_version_id IS NULL'
        );
        return $stmt->execute([
            ':desc' => $d['description'], ':catn' => $d['category_name'] ?? null, ':qty' => $d['quantity'],
            ':um' => $d['unit_measure'] ?? null, ':up' => $d['unit_price'], ':dv' => $d['discount_value'] ?? null,
            ':dp' => $d['discount_percent'] ?? null, ':av' => $d['addition_value'] ?? null, ':ap' => $d['addition_percent'] ?? null,
            ':sub' => $d['subtotal'], ':obs' => $d['observation'] ?? null, ':id' => $itemId,
        ]);
    }

    /** Soft-delete da linha de rascunho (R5: nada de DELETE físico de dado do usuário). */
    public function delete(int $itemId): bool
    {
        $stmt = $this->pdo->prepare('UPDATE koala_proposal_items SET deleted_at = NOW()
            WHERE id = ? AND proposal_version_id IS NULL AND deleted_at IS NULL');
        return $stmt->execute([$itemId]);
    }

    public function setOrder(int $itemId, int $order, int $proposalId): bool
    {
        // proposal_id no WHERE: sem ele, um vendedor reordenaria itens de rascunho de OUTRA proposta
        // passando ids arbitrários no /reorder (IDOR de escrita). O escopo garante que só mexe nos seus.
        $stmt = $this->pdo->prepare('UPDATE koala_proposal_items SET display_order = ? WHERE id = ? AND proposal_id = ? AND proposal_version_id IS NULL');
        return $stmt->execute([$order, $itemId, $proposalId]);
    }
}
