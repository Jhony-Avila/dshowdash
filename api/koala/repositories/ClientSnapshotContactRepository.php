<?php
// /api/koala/repositories/ClientSnapshotContactRepository.php
// Contatos REPETÍVEIS do snapshot do cliente (cópia local; editar NUNCA altera o ERP).
// @module koala.repository.client_snapshot_contact @version 1.0.0
declare(strict_types=1);

class ClientSnapshotContactRepository
{
    private \PDO $pdo;
    public function __construct(\PDO $pdo) { $this->pdo = $pdo; }

    public const TYPES = ['phone', 'email'];

    public function listBySnapshot(int $snapshotId): array
    {
        $stmt = $this->pdo->prepare('SELECT id, snapshot_id, contact_name, contact_type, contact_value, display_order
            FROM koala_client_snapshot_contacts WHERE snapshot_id = ? ORDER BY display_order, id');
        $stmt->execute([$snapshotId]);
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }

    public function findById(int $id): ?array
    {
        $stmt = $this->pdo->prepare('SELECT id, snapshot_id, contact_name, contact_type, contact_value, display_order
            FROM koala_client_snapshot_contacts WHERE id = ? LIMIT 1');
        $stmt->execute([$id]);
        return $stmt->fetch(\PDO::FETCH_ASSOC) ?: null;
    }

    public function maxOrder(int $snapshotId): int
    {
        $stmt = $this->pdo->prepare('SELECT COALESCE(MAX(display_order),0) FROM koala_client_snapshot_contacts WHERE snapshot_id = ?');
        $stmt->execute([$snapshotId]);
        return (int) $stmt->fetchColumn();
    }

    public function insert(int $snapshotId, array $d): int
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO koala_client_snapshot_contacts (snapshot_id, contact_name, contact_type, contact_value, display_order)
             VALUES (:sid, :name, :type, :val, :ord)'
        );
        $stmt->execute([
            ':sid' => $snapshotId, ':name' => $d['contact_name'] ?? null,
            ':type' => $d['contact_type'] ?? 'phone', ':val' => $d['contact_value'],
            ':ord' => $d['display_order'] ?? 0,
        ]);
        return (int) $this->pdo->lastInsertId();
    }

    public function update(int $id, array $d): bool
    {
        $stmt = $this->pdo->prepare(
            'UPDATE koala_client_snapshot_contacts SET contact_name=:name, contact_type=:type, contact_value=:val WHERE id=:id'
        );
        return $stmt->execute([
            ':name' => $d['contact_name'] ?? null, ':type' => $d['contact_type'] ?? 'phone',
            ':val' => $d['contact_value'], ':id' => $id,
        ]);
    }

    public function delete(int $id): bool
    {
        $stmt = $this->pdo->prepare('DELETE FROM koala_client_snapshot_contacts WHERE id = ?');
        return $stmt->execute([$id]);
    }
}
