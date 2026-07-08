<?php
// /api/koala/services/ExpirationService.php
// F4-E4 — Expiração automática: marca 'expired' propostas sent/viewed com validade vencida. Idempotente.
// @module koala.service.expiration @version 1.0.0-F4
declare(strict_types=1);

class ExpirationService
{
    private \PDO $pdo;
    private const VIEWS_RETENTION_DAYS = 180; // retenção das visualizações públicas (observabilidade)
    public function __construct(\PDO $pdo) { $this->pdo = $pdo; }

    /** Marca vencidas como expired + poda views antigas + loga. Retorna [count, ids, views_pruned]. Idempotente. */
    public function run(): array
    {
        $stmt = $this->pdo->query(
            "SELECT id, status FROM koala_proposals
             WHERE status IN ('sent','viewed') AND valid_until IS NOT NULL AND valid_until < CURDATE()
               AND deleted_at IS NULL"
        );
        $rows = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        $log = new LogService($this->pdo);
        $upd = $this->pdo->prepare("UPDATE koala_proposals SET status = 'expired' WHERE id = ? AND status IN ('sent','viewed')");
        $ids = [];
        foreach ($rows as $r) {
            $id = (int) $r['id'];
            if ($upd->execute([$id]) && $upd->rowCount() > 0) {
                $ids[] = $id;
                $log->log([], [ // sistema (sem koala user) => user_id null
                    'proposal_id' => $id, 'action' => 'status_changed', 'entity_type' => 'proposal', 'entity_id' => $id,
                    'field_name' => 'status', 'old_value' => $r['status'], 'new_value' => 'expired',
                    'metadata' => ['source' => 'expiration_job'],
                ]);
            }
        }
        return ['count' => count($ids), 'ids' => $ids, 'views_pruned' => $this->pruneViews()];
    }

    /**
     * Retenção: apaga visualizações públicas mais antigas que N dias — a tabela recebe INSERT na porta
     * pública (registerView) e não tinha teto. O corte é calculado em PHP (evita placeholder dentro de
     * INTERVAL) e comparado a viewed_at. Idempotente; retorna quantas linhas foram apagadas.
     */
    public function pruneViews(int $days = self::VIEWS_RETENTION_DAYS): int
    {
        $cutoff = date('Y-m-d H:i:s', time() - max(1, $days) * 86400);
        $stmt = $this->pdo->prepare('DELETE FROM koala_public_views WHERE viewed_at < ?');
        $stmt->execute([$cutoff]);
        return $stmt->rowCount();
    }
}
