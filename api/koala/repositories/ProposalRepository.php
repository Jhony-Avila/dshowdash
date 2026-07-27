<?php
// /api/koala/repositories/ProposalRepository.php
// Acesso a koala_proposals. @module koala.repository.proposal @version 1.0.0
declare(strict_types=1);

class ProposalRepository
{
    private \PDO $pdo;
    public function __construct(\PDO $pdo) { $this->pdo = $pdo; }

    private const COLS = 'id, proposal_number, budget_number, template_id, template_version_id,
        current_version_id, published_version_id, published_at, public_revoked_at,
        seller_user_id, seller_name, seller_email, seller_phone, client_snapshot_id,
        title, project_name, objective, need_context, executive_summary, project_scope, commercial_notes,
        currency, status, proposal_date, valid_until, approval_deadline, public_slug, public_url, pdf_path,
        total_gross, total_discount, total_addition, proposal_discount_value, proposal_discount_percent,
        freight_value, installation_value, displacement_value, total_expenses,
        total_net, total_final, deleted_by_seller, created_at, updated_at';

    // Campos que o autosave pode alterar (whitelist).
    public const EDITABLE = ['title','project_name','currency','budget_number','template_id','template_version_id',
        'proposal_date','valid_until','approval_deadline','freight_value','installation_value','displacement_value',
        'objective','need_context','executive_summary','project_scope','commercial_notes',
        'proposal_discount_value','proposal_discount_percent','seller_name','seller_email','seller_phone'];

    public function insert(array $d): int
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO koala_proposals
              (proposal_number, seller_user_id, seller_name, seller_email, seller_phone, currency, status,
               title, project_name, template_id, proposal_date, valid_until, created_by)
             VALUES (:num, :seller, :sname, :semail, :sphone, :cur, :st, :title, :proj, :tpl, :pdate, :valid, :cby)'
        );
        $stmt->execute([
            ':num' => $d['proposal_number'], ':seller' => $d['seller_user_id'],
            ':sname' => $d['seller_name'] ?? null, ':semail' => $d['seller_email'] ?? null, ':sphone' => $d['seller_phone'] ?? null,
            ':cur' => $d['currency'] ?? 'BRL', ':st' => $d['status'] ?? 'draft',
            ':title' => $d['title'] ?? null, ':proj' => $d['project_name'] ?? null,
            ':tpl' => $d['template_id'] ?? null,
            ':pdate' => $d['proposal_date'] ?? null, ':valid' => $d['valid_until'] ?? null,
            ':cby' => $d['created_by'] ?? null,
        ]);
        return (int) $this->pdo->lastInsertId();
    }

    public function findById(int $id): ?array
    {
        $stmt = $this->pdo->prepare('SELECT ' . self::COLS . ' FROM koala_proposals WHERE id = ? AND deleted_at IS NULL LIMIT 1');
        $stmt->execute([$id]);
        return $stmt->fetch(\PDO::FETCH_ASSOC) ?: null;
    }

    /** Lista por papel: gestor/admin veem todas; vendedor só as dele e não excluídas por ele. */
    public function listByRole(bool $seeAll, int $sellerUserId, ?string $status): array
    {
        // client_display: nome do cliente do snapshot p/ a coluna Cliente da lista (subquery evita
        // JOIN ambíguo com COLS bare). Aditivo — não altera os campos existentes.
        $sql = 'SELECT ' . self::COLS . ',
                (SELECT COALESCE(NULLIF(cs.legal_name, \'\'), NULLIF(cs.trade_name, \'\'), NULLIF(cs.client_name, \'\'))
                   FROM koala_client_snapshots cs WHERE cs.id = koala_proposals.client_snapshot_id) AS client_display
             FROM koala_proposals WHERE deleted_at IS NULL';
        $params = [];
        if (!$seeAll) {
            $sql .= ' AND seller_user_id = ? AND deleted_by_seller = 0';
            $params[] = $sellerUserId;
        }
        if ($status !== null && $status !== '') {
            $sql .= ' AND status = ?';
            $params[] = $status;
        }
        // Client-side: front pagina/ordena/filtra em memória. Teto alto (não é paginação server-side,
        // que fica como evolução quando o volume passar deste teto). @see ProposalsList paginação.
        $sql .= ' ORDER BY created_at DESC LIMIT 2000';
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }

    public function updateFields(int $id, array $fields): bool
    {
        $set = [];
        $params = [];
        foreach ($fields as $k => $v) {
            if (in_array($k, self::EDITABLE, true)) { $set[] = "$k = ?"; $params[] = $v; }
        }
        if (!$set) { return false; }
        $params[] = $id;
        $stmt = $this->pdo->prepare('UPDATE koala_proposals SET ' . implode(', ', $set) . ' WHERE id = ? AND deleted_at IS NULL');
        return $stmt->execute($params);
    }

    public function updateTotals(int $id, array $t): bool
    {
        $stmt = $this->pdo->prepare(
            'UPDATE koala_proposals SET total_gross=?, total_discount=?, total_addition=?, total_net=?,
                total_expenses=?, total_final=?
             WHERE id = ? AND deleted_at IS NULL'
        );
        return $stmt->execute([
            $t['total_gross'], $t['total_discount'], $t['total_addition'], $t['total_net'],
            $t['total_expenses'] ?? 0, $t['total_final'], $id,
        ]);
    }

    public function setStatus(int $id, string $status): bool
    {
        $stmt = $this->pdo->prepare('UPDATE koala_proposals SET status = ? WHERE id = ? AND deleted_at IS NULL');
        return $stmt->execute([$status, $id]);
    }

    public function markDeletedForSeller(int $id): bool
    {
        // Revoga o link público junto: sem public_revoked_at, /p/{slug} de uma proposta "excluída"
        // pelo vendedor continuava servindo o documento congelado ao público (só deleted_at/revoked
        // barram resolvePublic). NOW() é idempotente e inócuo se nunca foi publicada.
        $stmt = $this->pdo->prepare(
            "UPDATE koala_proposals SET deleted_by_seller = 1, status = 'user_deleted', public_revoked_at = NOW() WHERE id = ?"
        );
        return $stmt->execute([$id]);
    }

    public function setClientSnapshot(int $id, int $snapshotId, ?string $budgetNumber): bool
    {
        $stmt = $this->pdo->prepare('UPDATE koala_proposals SET client_snapshot_id = ?, budget_number = COALESCE(?, budget_number) WHERE id = ? AND deleted_at IS NULL');
        return $stmt->execute([$snapshotId, $budgetNumber, $id]);
    }

    /**
     * Duplica a linha da proposta (conteúdo + totais + snapshot de cliente/vendedor), como RASCUNHO novo.
     * NÃO copia artefatos de publicação/versão (slug/url/pdf/versões/published_*) — a cópia nasce limpa.
     * Título recebe sufixo " (cópia)". Datas são renovadas (hoje / +30 dias). Retorna o novo id.
     */
    public function duplicate(int $srcId, string $number, int $createdBy): int
    {
        $stmt = $this->pdo->prepare(
            "INSERT INTO koala_proposals
              (proposal_number, budget_number, template_id, template_version_id,
               seller_user_id, seller_name, seller_email, seller_phone, client_snapshot_id,
               title, project_name, objective, need_context, executive_summary, project_scope, commercial_notes,
               currency, status, proposal_date, valid_until, approval_deadline,
               total_gross, total_discount, total_addition, proposal_discount_value, proposal_discount_percent,
               freight_value, installation_value, displacement_value, total_expenses, total_net, total_final,
               created_by)
             SELECT :num, budget_number, template_id, template_version_id,
               seller_user_id, seller_name, seller_email, seller_phone, client_snapshot_id,
               CONCAT(COALESCE(NULLIF(title, ''), 'Proposta'), ' (cópia)'), project_name, objective, need_context, executive_summary, project_scope, commercial_notes,
               currency, 'draft', CURDATE(), DATE_ADD(CURDATE(), INTERVAL 30 DAY), approval_deadline,
               total_gross, total_discount, total_addition, proposal_discount_value, proposal_discount_percent,
               freight_value, installation_value, displacement_value, total_expenses, total_net, total_final,
               :cby
             FROM koala_proposals WHERE id = :src AND deleted_at IS NULL"
        );
        $stmt->execute([':num' => $number, ':cby' => $createdBy, ':src' => $srcId]);
        return (int) $this->pdo->lastInsertId();
    }

    /** Copia itens, despesas e condições de pagamento da origem para a proposta nova (version_id zerado). */
    public function copyChildren(int $srcId, int $newId): void
    {
        $this->pdo->prepare(
            'INSERT INTO koala_proposal_items
              (proposal_id, proposal_version_id, catalog_item_id, description, category_name, quantity, unit_measure,
               unit_price, discount_value, discount_percent, addition_value, addition_percent, subtotal, observation, display_order)
             SELECT ?, NULL, catalog_item_id, description, category_name, quantity, unit_measure,
               unit_price, discount_value, discount_percent, addition_value, addition_percent, subtotal, observation, display_order
             FROM koala_proposal_items WHERE proposal_id = ? AND deleted_at IS NULL'
        )->execute([$newId, $srcId]);

        $this->pdo->prepare(
            'INSERT INTO koala_proposal_expenses
              (proposal_id, proposal_version_id, description, category_name, quantity, unit_measure,
               unit_price, discount_value, discount_percent, addition_value, addition_percent, subtotal, observation, display_order)
             SELECT ?, NULL, description, category_name, quantity, unit_measure,
               unit_price, discount_value, discount_percent, addition_value, addition_percent, subtotal, observation, display_order
             FROM koala_proposal_expenses WHERE proposal_id = ? AND deleted_at IS NULL'
        )->execute([$newId, $srcId]);

        $this->pdo->prepare(
            'INSERT INTO koala_proposal_payment_terms
              (proposal_id, payment_method_id, commercial_term_id, down_payment_value, installments_quantity,
               installment_value, first_due_date, free_observations)
             SELECT ?, payment_method_id, commercial_term_id, down_payment_value, installments_quantity,
               installment_value, first_due_date, free_observations
             FROM koala_proposal_payment_terms WHERE proposal_id = ?'
        )->execute([$newId, $srcId]);
    }
}
