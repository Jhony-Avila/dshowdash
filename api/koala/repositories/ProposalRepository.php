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
        $sql .= ' ORDER BY created_at DESC LIMIT 200';
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
        $stmt = $this->pdo->prepare('UPDATE koala_proposals SET deleted_by_seller = 1, status = \'user_deleted\' WHERE id = ?');
        return $stmt->execute([$id]);
    }

    public function setClientSnapshot(int $id, int $snapshotId, ?string $budgetNumber): bool
    {
        $stmt = $this->pdo->prepare('UPDATE koala_proposals SET client_snapshot_id = ?, budget_number = COALESCE(?, budget_number) WHERE id = ? AND deleted_at IS NULL');
        return $stmt->execute([$snapshotId, $budgetNumber, $id]);
    }
}
