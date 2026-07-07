<?php
// /api/koala/services/LogService.php
// Log/auditoria central do Koala (F5-E2): "toda alteração relevante gera log" (briefing).
// Best-effort: NUNCA lança — observabilidade não pode quebrar o fluxo de negócio.
// @module koala.service.log @version 1.0.0-F5
declare(strict_types=1);

class LogService
{
    private \PDO $pdo;
    public function __construct(\PDO $pdo) { $this->pdo = $pdo; }

    /**
     * Grava um evento em koala_logs. $e aceita:
     *   action (obrigatório, <=40), proposal_id, proposal_version_id, template_id,
     *   entity_type, entity_id, field_name, old_value, new_value, metadata (array->json).
     */
    public function log(array $koala, array $e): void
    {
        try {
            $stmt = $this->pdo->prepare(
                'INSERT INTO koala_logs
                   (user_id, proposal_id, proposal_version_id, template_id, action, entity_type, entity_id,
                    field_name, old_value, new_value, metadata_json, ip_address, user_agent)
                 VALUES (:uid,:pid,:pvid,:tid,:act,:etype,:eid,:fname,:old,:new,:meta,:ip,:ua)'
            );
            $stmt->execute([
                ':uid'   => ((int) ($koala['id'] ?? 0)) ?: null,
                ':pid'   => $e['proposal_id'] ?? null,
                ':pvid'  => $e['proposal_version_id'] ?? null,
                ':tid'   => $e['template_id'] ?? null,
                ':act'   => substr((string) ($e['action'] ?? 'unknown'), 0, 40),
                ':etype' => isset($e['entity_type']) ? substr((string) $e['entity_type'], 0, 40) : null,
                ':eid'   => $e['entity_id'] ?? null,
                ':fname' => isset($e['field_name']) ? substr((string) $e['field_name'], 0, 80) : null,
                ':old'   => isset($e['old_value']) ? (string) $e['old_value'] : null,
                ':new'   => isset($e['new_value']) ? (string) $e['new_value'] : null,
                ':meta'  => isset($e['metadata']) ? json_encode($e['metadata'], JSON_UNESCAPED_UNICODE) : null,
                ':ip'    => $_SERVER['REMOTE_ADDR'] ?? null,
                ':ua'    => isset($_SERVER['HTTP_USER_AGENT']) ? substr((string) $_SERVER['HTTP_USER_AGENT'], 0, 255) : null,
            ]);
        } catch (\Throwable $ex) {
            // silencioso por design (best-effort).
        }
    }

    /** Log de mudança de UM campo (grava só se old != new). */
    public function field(array $koala, int $proposalId, string $field, $old, $new, string $entityType = 'proposal', ?int $entityId = null): void
    {
        if ((string) $old === (string) $new) { return; }
        $this->log($koala, [
            'proposal_id' => $proposalId,
            'action'      => 'field_updated',
            'entity_type' => $entityType,
            'entity_id'   => $entityId ?? $proposalId,
            'field_name'  => $field,
            'old_value'   => $old,
            'new_value'   => $new,
        ]);
    }

    /** Timeline legível (últimas N), autor resolvido via koala_users. */
    public function timeline(int $proposalId, int $limit = 50): array
    {
        $limit = max(1, min(200, $limit));
        $stmt = $this->pdo->prepare(
            'SELECT l.id, l.action, l.entity_type, l.field_name, l.old_value, l.new_value,
                    l.metadata_json, l.created_at, l.proposal_version_id,
                    COALESCE(u.name, u.email, CONCAT("user#", l.user_id)) AS author
             FROM koala_logs l
             LEFT JOIN koala_users u ON u.id = l.user_id
             WHERE l.proposal_id = ?
             ORDER BY l.id DESC
             LIMIT ' . $limit
        );
        $stmt->execute([$proposalId]);
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }
}
