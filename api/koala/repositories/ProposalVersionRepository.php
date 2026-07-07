<?php
// /api/koala/repositories/ProposalVersionRepository.php
// Versões CONGELADAS (imutáveis) da proposta. @module koala.repo.proposal_version @version 1.0.0-F5
declare(strict_types=1);

class ProposalVersionRepository
{
    private \PDO $pdo;
    public function __construct(\PDO $pdo) { $this->pdo = $pdo; }

    /** Insere uma versão congelada; retorna o id. */
    public function insert(array $d): int
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO koala_proposal_versions
              (proposal_id, version_number, trigger_event, template_id, template_version_id,
               snapshot_json, snapshot_hash, totals_json, pdf_path, created_by, restored_from_version_id)
             VALUES (:pid,:vn,:trg,:tid,:tvid,:snap,:hash,:tot,:pdf,:by,:rest)'
        );
        $stmt->execute([
            ':pid'  => $d['proposal_id'],
            ':vn'   => $d['version_number'],
            ':trg'  => $d['trigger_event'] ?? null,
            ':tid'  => $d['template_id'] ?? null,
            ':tvid' => $d['template_version_id'] ?? null,
            ':snap' => $d['snapshot_json'],
            ':hash' => $d['snapshot_hash'] ?? null,
            ':tot'  => $d['totals_json'] ?? null,
            ':pdf'  => $d['pdf_path'] ?? null,
            ':by'   => $d['created_by'] ?? null,
            ':rest' => $d['restored_from_version_id'] ?? null,
        ]);
        return (int) $this->pdo->lastInsertId();
    }

    /** Lista (histórico) sem o snapshot pesado. Mais recente primeiro. */
    public function listByProposal(int $proposalId): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT id, proposal_id, version_number, trigger_event, template_version_id,
                    totals_json, pdf_path, created_by, created_at, restored_from_version_id
             FROM koala_proposal_versions WHERE proposal_id = ? ORDER BY version_number DESC, id DESC'
        );
        $stmt->execute([$proposalId]);
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }

    /** Versão completa (inclui snapshot_json). */
    public function findById(int $id): ?array
    {
        $stmt = $this->pdo->prepare('SELECT * FROM koala_proposal_versions WHERE id = ? LIMIT 1');
        $stmt->execute([$id]);
        return $stmt->fetch(\PDO::FETCH_ASSOC) ?: null;
    }

    /** Última versão congelada (maior version_number) — p/ dirty-detection e próximo número. */
    public function lastByProposal(int $proposalId): ?array
    {
        $stmt = $this->pdo->prepare(
            'SELECT * FROM koala_proposal_versions WHERE proposal_id = ? ORDER BY version_number DESC, id DESC LIMIT 1'
        );
        $stmt->execute([$proposalId]);
        return $stmt->fetch(\PDO::FETCH_ASSOC) ?: null;
    }

    public function setPdfPath(int $versionId, string $pdfPath): bool
    {
        $stmt = $this->pdo->prepare('UPDATE koala_proposal_versions SET pdf_path = ? WHERE id = ?');
        return $stmt->execute([$pdfPath, $versionId]);
    }
}
