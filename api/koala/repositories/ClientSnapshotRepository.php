<?php
// /api/koala/repositories/ClientSnapshotRepository.php
// Cópia LOCAL dos dados do cliente (koala_client_snapshots). Editar aqui NÃO altera o ERP.
// @module koala.repository.client_snapshot @version 1.0.0-F2
declare(strict_types=1);

class ClientSnapshotRepository
{
    private \PDO $pdo;
    public function __construct(\PDO $pdo) { $this->pdo = $pdo; }

    public function insert(array $d): int
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO koala_client_snapshots
              (external_client_id, external_budget_id, client_name, trade_name, legal_name,
               document_type, document_number, state_registration, internal_client_code,
               contact_email, raw_external_data_json)
             VALUES (:ext, :budg, :name, :trade, :legal, :dtype, :dnum, :ie, :code, :email, :raw)'
        );
        $stmt->execute([
            ':ext' => $d['external_client_id'] ?? null, ':budg' => $d['external_budget_id'] ?? null,
            ':name' => $d['client_name'] ?? null, ':trade' => $d['trade_name'] ?? null, ':legal' => $d['legal_name'] ?? null,
            ':dtype' => $d['document_type'] ?? null, ':dnum' => $d['document_number'] ?? null,
            ':ie' => $d['state_registration'] ?? null, ':code' => $d['internal_client_code'] ?? null,
            ':email' => $d['contact_email'] ?? null,
            ':raw' => isset($d['raw']) ? json_encode($d['raw'], JSON_UNESCAPED_UNICODE) : null,
        ]);
        return (int) $this->pdo->lastInsertId();
    }

    /** Snapshot "vazio" para preenchimento manual do cliente (sem import do ERP). */
    public function insertEmpty(): int
    {
        $stmt = $this->pdo->prepare('INSERT INTO koala_client_snapshots (created_at, updated_at) VALUES (NOW(), NOW())');
        $stmt->execute();
        return (int) $this->pdo->lastInsertId();
    }

    public function findById(int $id): ?array
    {
        $stmt = $this->pdo->prepare('SELECT * FROM koala_client_snapshots WHERE id = ? LIMIT 1');
        $stmt->execute([$id]);
        return $stmt->fetch(\PDO::FETCH_ASSOC) ?: null;
    }

    // Campos do cliente editáveis na proposta (NUNCA altera o ERP — só a cópia local).
    public const EDITABLE = ['client_name','trade_name','legal_name','document_type','document_number',
        'state_registration','internal_client_code','logo_url','address','address_number','address_complement',
        'district','city','state','postal_code','contact_name','contact_position','contact_email','contact_phone'];

    public function update(int $id, array $fields): bool
    {
        $set = [];
        $params = [];
        foreach ($fields as $k => $v) {
            if (in_array($k, self::EDITABLE, true)) { $set[] = "$k = ?"; $params[] = $v; }
        }
        if (!$set) { return false; }
        $params[] = $id;
        $stmt = $this->pdo->prepare('UPDATE koala_client_snapshots SET ' . implode(', ', $set) . ' WHERE id = ?');
        return $stmt->execute($params);
    }
}
