<?php
// DataTables / AlertService - motor de alertas com deduplicacao (§26)
// @version 1.0.0
// @created 2026-07-20
// @app DataTables
//
// DEDUPLICACAO (§26.5): a identidade de um incidente e o fingerprint
// hash(tipo + alvo). Enquanto o problema persistir, NAO nascem alertas novos -
// o mesmo incidente incrementa `occurrences` e move `last_seen_at`. Isso e o que
// impede a enxurrada de 288 alertas/dia que um ciclo de 5 min produziria.
//
// SILENCIO (§26.6) silencia apenas o ENVIO EXTERNO. O alerta continua registrado
// internamente - janela de silencio nao pode virar ponto cego.
declare(strict_types=1);

require_once __DIR__ . '/../../core/repositories/RepositoryException.php';
require_once __DIR__ . '/../lib/WebhookSender.php';

final class DtAlertService
{
    // Severidades (§26.2)
    public const SEV_INFO     = 'informativo';
    public const SEV_WARN     = 'atencao';
    public const SEV_CRITICAL = 'critico';

    /** Severidade default por tipo de alerta (§26.1). Regra por conexao sobrescreve. */
    private const TYPE_SEVERITY = [
        'db_offline'        => self::SEV_CRITICAL,
        'cred_expired'      => self::SEV_CRITICAL,
        'read_failed'       => self::SEV_CRITICAL,
        'write_failed'      => self::SEV_CRITICAL,
        'fk_broken'         => self::SEV_CRITICAL,
        'quality_critical'  => self::SEV_CRITICAL,
        'db_unstable'       => self::SEV_WARN,
        'db_slow'           => self::SEV_WARN,
        'low_disk'          => self::SEV_WARN,
        'abnormal_growth'   => self::SEV_WARN,
        'null_excess'       => self::SEV_WARN,
        'new_table'         => self::SEV_INFO,
        'new_field'         => self::SEV_INFO,
        'table_removed'     => self::SEV_WARN,
        'field_removed'     => self::SEV_WARN,
        'type_changed'      => self::SEV_WARN,
        'maintenance_open'  => self::SEV_INFO,
        // Descoberta (§23): gerados pela auditoria ao diferir uma rodada da anterior.
        'discovery_new_db'      => self::SEV_INFO,   // novo banco acessível encontrado
        'discovery_new_server'  => self::SEV_INFO,   // novo servidor/host acessível
        'discovery_db_vanished' => self::SEV_WARN,   // banco antes acessível desapareceu
        'discovery_backup_only' => self::SEV_WARN,   // banco passou a existir só em backup
        'discovery_ref_found'   => self::SEV_INFO,   // referenciado (código/config/backup) não localizado
        'discovery_partial'     => self::SEV_WARN,   // host falhou / visão parcial (inventário parcial)
        'discovery_collision'   => self::SEV_WARN,   // colisão/duplicidade de nome
        'discovery_db_moved'    => self::SEV_WARN,   // banco mudou de servidor (server_uuid §19/§20)
    ];

    private PDO $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    // ═══════════════════════════════════════════════════════════════
    // API PRINCIPAL
    // ═══════════════════════════════════════════════════════════════

    /**
     * Registra (ou readmite) um alerta. Idempotente por fingerprint.
     *
     * @param string $type       Tipo canonico (chave de TYPE_SEVERITY)
     * @param string $targetType connection|database|table|field|server
     * @param int|null $targetId
     * @param string $title
     * @param string|null $message
     * @param int|null $connectionId Conexao associada (para regra e silencio)
     * @return array{id:int,created:bool,severity:string,notified:bool}
     */
    public function raise(
        string $type,
        string $targetType,
        ?int $targetId,
        string $title,
        ?string $message = null,
        ?int $connectionId = null
    ): array {
        $fingerprint = $this->fingerprint($type, $targetType, $targetId);
        $rule        = $this->ruleFor($type, $connectionId);

        // Regra desabilitada: nem registra. O operador desligou de proposito.
        if ($rule !== null && (int)$rule['is_enabled'] === 0) {
            return ['id' => 0, 'created' => false, 'severity' => self::SEV_INFO, 'notified' => false, 'skipped' => 'regra_desabilitada'];
        }

        $severity = $rule['severity'] ?? (self::TYPE_SEVERITY[$type] ?? self::SEV_WARN);

        try {
            $existing = $this->findActive($fingerprint);

            if ($existing !== null) {
                $this->pdo->prepare(
                    'UPDATE DT_Alerta
                        SET occurrences = occurrences + 1,
                            last_seen_at = NOW(),
                            message = COALESCE(:msg, message),
                            severity = :sev
                      WHERE id = :id'
                )->execute([
                    ':msg' => $message !== null ? mb_substr($message, 0, 1000) : null,
                    ':sev' => $severity,
                    ':id'  => $existing['id'],
                ]);

                $this->addOccurrence((int)$existing['id'], $message);
                $notified = $this->maybeNotify((int)$existing['id'], $type, $severity, $rule, $connectionId, false);

                return ['id' => (int)$existing['id'], 'created' => false, 'severity' => $severity, 'notified' => $notified];
            }

            $this->pdo->prepare(
                'INSERT INTO DT_Alerta
                   (fingerprint, alert_type, severity, target_type, target_id, connection_id,
                    title, message, status, occurrences, first_seen_at, last_seen_at)
                 VALUES (:fp, :t, :sev, :tt, :ti, :ci, :title, :msg, "active", 1, NOW(), NOW())'
            )->execute([
                ':fp'    => $fingerprint,
                ':t'     => $type,
                ':sev'   => $severity,
                ':tt'    => $targetType,
                ':ti'    => $targetId,
                ':ci'    => $connectionId,
                ':title' => mb_substr($title, 0, 200),
                ':msg'   => $message !== null ? mb_substr($message, 0, 1000) : null,
            ]);

            $id = (int)$this->pdo->lastInsertId();
            $this->addOccurrence($id, $message);
            $notified = $this->maybeNotify($id, $type, $severity, $rule, $connectionId, true);

            return ['id' => $id, 'created' => true, 'severity' => $severity, 'notified' => $notified];

        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'DtAlertService::raise');
        }
    }

    /**
     * Resolve o incidente ativo daquele fingerprint, se existir.
     * Chamado quando a condicao deixa de valer (ex.: banco voltou).
     */
    public function resolve(string $type, string $targetType, ?int $targetId): bool
    {
        $fp = $this->fingerprint($type, $targetType, $targetId);
        try {
            $st = $this->pdo->prepare(
                'UPDATE DT_Alerta
                    SET status = "resolved", resolved_at = NOW()
                  WHERE fingerprint = :fp AND status IN ("active", "acknowledged")'   // APP DSHOW Lote 30 (D3): reconhecido tambem resolve quando a condicao acaba
            );
            $st->execute([':fp' => $fp]);
            return $st->rowCount() > 0;
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'DtAlertService::resolve');
        }
    }

    /** Reconhece um alerta (§28.2). */
    public function acknowledge(int $id, string $by): bool
    {
        try {
            $st = $this->pdo->prepare(
                'UPDATE DT_Alerta
                    SET status = "acknowledged", acknowledged_at = NOW(), acknowledged_by = :by
                  WHERE id = :id AND status = "active"'
            );
            $st->execute([':by' => mb_substr($by, 0, 100), ':id' => $id]);
            return $st->rowCount() > 0;
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'DtAlertService::acknowledge');
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // AVALIACAO A PARTIR DO RESULTADO DE UMA VERIFICACAO
    // ═══════════════════════════════════════════════════════════════

    /**
     * Traduz o resultado de um health check em alertas (§26.1).
     * Levanta o que se aplica e RESOLVE o que deixou de valer - sem isso
     * um alerta de 'offline' ficaria ativo para sempre depois da recuperacao.
     */
    public function evaluateCheck(int $connId, string $connName, array $res): array
    {
        $status = $res['status'] ?? 'untested';
        $raised = [];

        $map = [
            'offline'            => ['db_offline',   "Banco offline: {$connName}"],
            'credential_expired' => ['cred_expired', "Credencial expirada: {$connName}"],
            'unstable'           => ['db_unstable',  "Conexao instavel: {$connName}"],
            'slow'               => ['db_slow',      "Conexao lenta: {$connName}"],
        ];

        foreach ($map as $st => [$type, $title]) {
            if ($status === $st) {
                $detail = $res['error'] ?? null;
                if ($st === 'slow') {
                    $detail = 'Latencia de ' . ($res['latency_ms'] ?? '?') . 'ms acima do limite configurado';
                }
                $raised[] = $this->raise($type, 'connection', $connId, $title, $detail, $connId) + ['type' => $type];
            } else {
                $this->resolve($type, 'connection', $connId);
            }
        }

        // Falha de gravacao so e alerta quando a gravacao E suportada.
        // Banco read-only devolve write_ok=null e nao pode gerar critico falso.
        if (($res['write_supported'] ?? 1) && ($res['write_ok'] ?? null) === 0) {
            $raised[] = $this->raise('write_failed', 'connection', $connId,
                "Falha no teste de gravacao: {$connName}", $res['error'] ?? null, $connId) + ['type' => 'write_failed'];
        } else {
            $this->resolve('write_failed', 'connection', $connId);
        }

        // APP DSHOW Lote 30 (D3, dados reais 28/10): sem conexao nao houve teste de leitura — o catch do HealthCheckService
        // devolve read_ok=0 e cada banco fora do ar virava DOIS criticos (db_offline + read_failed). Leitura falha so conta
        // quando a conexao abriu (status diferente de offline/credential_expired).
        $readTested = !in_array($status, ['offline', 'credential_expired'], true);
        if ($readTested && ($res['read_ok'] ?? null) === 0) {
            $raised[] = $this->raise('read_failed', 'connection', $connId,
                "Falha no teste de leitura: {$connName}", $res['error'] ?? null, $connId) + ['type' => 'read_failed'];
        } else {
            $this->resolve('read_failed', 'connection', $connId);
        }

        return array_values(array_filter($raised, fn($r) => ($r['id'] ?? 0) > 0));
    }

    /** Alertas de mudanca estrutural detectada pelo inventario (§36.2/36.3). */
    public function evaluateInventoryDiff(int $connId, array $diff): array
    {
        $out = [];
        foreach (($diff['new_tables'] ?? []) as $t) {
            $out[] = $this->raise('new_table', 'table', (int)$t['id'],
                "Nova tabela identificada: {$t['name']}", "Banco: {$t['database_name']}", $connId);
        }
        foreach (($diff['removed_tables'] ?? []) as $t) {
            $out[] = $this->raise('table_removed', 'table', (int)$t['id'],
                "Tabela nao encontrada: {$t['name']}",
                "Mantida no catalogo para consulta historica. Ultima vez vista: {$t['last_seen_at']}", $connId);
        }
        foreach (($diff['new_fields'] ?? []) as $f) {
            $out[] = $this->raise('new_field', 'field', (int)$f['id'],
                "Novo campo: {$f['table_name']}.{$f['name']}", "Banco: {$f['database_name']}", $connId);
        }
        foreach (($diff['removed_fields'] ?? []) as $f) {
            $out[] = $this->raise('field_removed', 'field', (int)$f['id'],
                "Campo nao encontrado: {$f['table_name']}.{$f['name']}",
                "Mantido no catalogo para consulta historica. Banco: {$f['database_name']}", $connId);
        }
        foreach (($diff['type_changed'] ?? []) as $f) {
            $out[] = $this->raise('type_changed', 'field', (int)$f['id'],
                "Tipo de campo alterado: {$f['table_name']}.{$f['name']}",
                "De '{$f['old_type']}' para '{$f['new_type']}'. Banco: {$f['database_name']}", $connId);
        }
        return $out;
    }

    // ═══════════════════════════════════════════════════════════════
    // SILENCIO E NOTIFICACAO
    // ═══════════════════════════════════════════════════════════════

    /**
     * Ha janela de silencio cobrindo este alerta agora? (§26.6)
     * Cobre dois formatos: intervalo absoluto e janela diaria recorrente
     * (inclusive quando ela cruza a meia-noite, ex.: 22:00-06:00).
     */
    public function isSilenced(string $type, ?int $connId): bool
    {
        try {
            $st = $this->pdo->prepare(
                'SELECT starts_at, ends_at, daily_from, daily_to
                   FROM DT_Silencio_Alerta
                  WHERE is_active = 1
                    AND (connection_id IS NULL OR connection_id = :cid)
                    AND (alert_type IS NULL OR alert_type = :t)'
            );
            $st->execute([':cid' => $connId, ':t' => $type]);

            $now     = time();
            $nowTime = date('H:i:s', $now);

            foreach ($st->fetchAll(PDO::FETCH_ASSOC) as $s) {
                // Intervalo absoluto
                if ($s['starts_at'] !== null && $s['ends_at'] !== null) {
                    if ($now >= strtotime($s['starts_at']) && $now <= strtotime($s['ends_at'])) {
                        return true;
                    }
                }
                // Janela diaria recorrente
                if ($s['daily_from'] !== null && $s['daily_to'] !== null) {
                    $from = $s['daily_from'];
                    $to   = $s['daily_to'];
                    if ($from <= $to) {
                        if ($nowTime >= $from && $nowTime <= $to) {
                            return true;
                        }
                    } else {
                        // Cruza a meia-noite: 22:00 -> 06:00
                        if ($nowTime >= $from || $nowTime <= $to) {
                            return true;
                        }
                    }
                }
            }
            return false;
        } catch (PDOException $e) {
            // Falha ao consultar silencio NAO pode suprimir alerta: erra para o
            // lado de notificar. Ficar calado e o pior desfecho possivel aqui.
            error_log('[datatables:alert] falha ao avaliar silencio: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Decide e registra a notificacao externa.
     * Retorna se notificou. Hoje so o canal 'app' esta habilitado - os demais
     * existem no cadastro mas nascem desligados ate terem credencial.
     */
    private function maybeNotify(int $alertId, string $type, string $severity, ?array $rule, ?int $connId, bool $isNew): bool
    {
        if ($this->isSilenced($type, $connId)) {
            return false;
        }

        // Anti-flood: respeita min_interval_sec desde a ultima notificacao.
        $minInterval = (int)($rule['min_interval_sec'] ?? 3600);
        if (!$isNew) {
            $st = $this->pdo->prepare('SELECT notified_at FROM DT_Alerta WHERE id = :id');
            $st->execute([':id' => $alertId]);
            $last = $st->fetchColumn();
            if ($last !== null && $last !== false && (time() - strtotime((string)$last)) < $minInterval) {
                return false;
            }
        }

        $channels = $this->enabledChannels($rule);
        if ($channels === []) {
            return false;
        }

        $delivered = false;
        foreach ($channels as $ch) {
            if ($ch === 'app') {
                $delivered = $this->deliverInApp($alertId, $severity, $rule) || $delivered;
                continue;
            }
            if ($ch === 'webhook') {
                $delivered = $this->deliverWebhook($alertId) || $delivered;
                continue;
            }
            // Demais canais externos: estrutura pronta, entrega ainda nao
            // implementada. Registrado no log para nao dar falsa impressao.
            error_log("[datatables:alert] canal '{$ch}' habilitado mas sem implementacao de envio (alerta {$alertId})");
        }

        if ($delivered) {
            $this->pdo->prepare('UPDATE DT_Alerta SET notified_at = NOW() WHERE id = :id')
                      ->execute([':id' => $alertId]);
        }
        return $delivered;
    }

    /** Canais habilitados: os da regra, interseccao com os ligados no cadastro. */
    private function enabledChannels(?array $rule): array
    {
        $wanted = ['app'];
        if ($rule !== null && !empty($rule['channels_json'])) {
            $decoded = json_decode((string)$rule['channels_json'], true);
            if (is_array($decoded) && $decoded !== []) {
                $wanted = $decoded;
            }
        }

        try {
            $st = $this->pdo->query('SELECT channel_key FROM DT_Canal_Alerta WHERE is_enabled = 1');
            $enabled = $st->fetchAll(PDO::FETCH_COLUMN) ?: [];
        } catch (PDOException $e) {
            $enabled = ['app'];
        }

        return array_values(array_intersect($wanted, $enabled));
    }

    /**
     * Entrega in-app reusando app_notifications (ja existe no ecossistema).
     *
     * app_notifications.user_id e NOT NULL - nao existe notificacao "global".
     * Precisa de destinatarios concretos: os da regra, ou os usuarios de nivel
     * &gt;= MIN_RECIPIENT_LEVEL (a equipe de dev, publico do modulo §4).
     * Severidade informativa NAO vira notificacao: viraria ruido diario.
     */
    private const MIN_RECIPIENT_LEVEL = 80;
    private const MAX_RECIPIENTS      = 25;

    private function deliverInApp(int $alertId, string $severity, ?array $rule = null): bool
    {
        if ($severity === self::SEV_INFO) {
            return false;   // fica so na central de alertas do painel
        }

        try {
            $a = $this->pdo->prepare('SELECT title, message FROM DT_Alerta WHERE id = :id');
            $a->execute([':id' => $alertId]);
            $row = $a->fetch(PDO::FETCH_ASSOC);
            if (!$row) {
                return false;
            }

            $recipients = $this->resolveRecipients($rule);
            if ($recipients === []) {
                error_log("[datatables:alert] alerta {$alertId} sem destinatario in-app; visivel apenas na central");
                return false;
            }

            $priority = $severity === self::SEV_CRITICAL ? 'high' : 'normal';

            $st = $this->pdo->prepare(
                'INSERT INTO app_notifications
                   (user_id, notification_type, category, title, message, priority, is_read, action_url, created_at)
                 VALUES (:u, "system", "datatables", :t, :m, :p, 0, "#/panel-datatables", NOW())'
            );

            $sent = 0;
            foreach ($recipients as $uid) {
                try {
                    $st->execute([
                        ':u' => $uid,
                        ':t' => mb_substr((string)$row['title'], 0, 190),
                        ':m' => mb_substr((string)($row['message'] ?? ''), 0, 500),
                        ':p' => $priority,
                    ]);
                    $sent++;
                } catch (PDOException $e) {
                    error_log("[datatables:alert] falha ao notificar user {$uid}: " . $e->getMessage());
                }
            }
            return $sent > 0;

        } catch (PDOException $e) {
            // Schema de app_notifications pode divergir; nao derruba o ciclo.
            error_log('[datatables:alert] entrega in-app falhou: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Entrega por webhook generico (§26.4). Primeiro canal EXTERNO real.
     * Grava o desfecho em DT_Canal_Alerta para o operador ver na tela de
     * administracao se as entregas estao passando ou falhando.
     */
    private function deliverWebhook(int $alertId): bool
    {
        try {
            $ch = $this->pdo->prepare(
                'SELECT * FROM DT_Canal_Alerta WHERE channel_key = "webhook" AND is_enabled = 1 LIMIT 1'
            );
            $ch->execute();
            $channel = $ch->fetch(PDO::FETCH_ASSOC);
            if (!$channel) {
                return false;
            }

            $a = $this->pdo->prepare(
                'SELECT al.*, c.name connection_name, e.label environment_label
                   FROM DT_Alerta al
              LEFT JOIN DT_Conexao  c ON c.id = al.connection_id
              LEFT JOIN DT_Ambiente e ON e.id = c.environment_id
                  WHERE al.id = :id LIMIT 1'
            );
            $a->execute([':id' => $alertId]);
            $alert = $a->fetch(PDO::FETCH_ASSOC);
            if (!$alert) {
                return false;
            }

            $r = DtWebhookSender::send($channel, $alert);
            $this->recordChannelResult((int)$channel['id'], $r);

            if (!$r['ok']) {
                error_log("[datatables:alert] webhook falhou (alerta {$alertId}, "
                    . "tentativas {$r['attempts']}): " . (string)$r['error']);
            }
            return $r['ok'];

        } catch (Throwable $e) {
            error_log('[datatables:alert] entrega webhook: ' . $e->getMessage());
            return false;
        }
    }

    /** Estado da ultima entrega do canal, visivel na administracao. */
    private function recordChannelResult(int $channelId, array $r): void
    {
        try {
            $this->pdo->prepare(
                'UPDATE DT_Canal_Alerta
                    SET last_error = :e'
                . ($r['ok'] ? ', last_ok_at = NOW()' : '') .
                ' WHERE id = :id'
            )->execute([
                ':e'  => $r['ok'] ? null : mb_substr((string)$r['error'], 0, 1000),
                ':id' => $channelId,
            ]);
        } catch (PDOException $e) {
            // Registro de estado e acessorio; nao derruba a entrega.
        }
    }

    /** Dispara um envio de teste no canal webhook, sem depender de incidente real. */
    public function testWebhook(): array
    {
        $ch = $this->pdo->prepare('SELECT * FROM DT_Canal_Alerta WHERE channel_key = "webhook" LIMIT 1');
        $ch->execute();
        $channel = $ch->fetch(PDO::FETCH_ASSOC);
        if (!$channel) {
            return ['ok' => false, 'error' => 'Canal webhook nao cadastrado', 'attempts' => 0];
        }

        $r = DtWebhookSender::sendTest($channel);
        $this->recordChannelResult((int)$channel['id'], $r);
        return $r;
    }

    /** IDs de usuario destinatarios: da regra, senao a equipe de nivel alto. */
    private function resolveRecipients(?array $rule): array
    {
        if ($rule !== null && !empty($rule['recipients'])) {
            $ids = array_filter(array_map('intval', preg_split('/[,;\s]+/', (string)$rule['recipients'])));
            if ($ids !== []) {
                return array_slice(array_values(array_unique($ids)), 0, self::MAX_RECIPIENTS);
            }
        }

        try {
            $st = $this->pdo->prepare(
                'SELECT u.id
                   FROM app_users u
                   JOIN app_user_roles ur ON ur.user_id = u.id
                   JOIN app_roles r       ON r.id = ur.role_id
                  WHERE u.status = "active" AND u.deleted_at IS NULL
               GROUP BY u.id
                 HAVING MAX(r.level) >= :lvl
                  LIMIT ' . self::MAX_RECIPIENTS
            );
            $st->bindValue(':lvl', self::MIN_RECIPIENT_LEVEL, PDO::PARAM_INT);
            $st->execute();
            return array_map('intval', $st->fetchAll(PDO::FETCH_COLUMN) ?: []);
        } catch (PDOException $e) {
            error_log('[datatables:alert] falha ao resolver destinatarios: ' . $e->getMessage());
            return [];
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // AUXILIARES
    // ═══════════════════════════════════════════════════════════════

    /** Identidade estavel do incidente. Mesmo problema => mesmo fingerprint. */
    private function fingerprint(string $type, string $targetType, ?int $targetId): string
    {
        return substr(hash('sha256', $type . '|' . $targetType . '|' . ($targetId ?? 0)), 0, 64);
    }

    private function findActive(string $fingerprint): ?array
    {
        $st = $this->pdo->prepare(
            'SELECT id, occurrences FROM DT_Alerta
              WHERE fingerprint = :fp AND status IN ("active", "acknowledged")
              ORDER BY status = "active" DESC LIMIT 1'   // APP DSHOW Lote 30 (D3): a ocorrencia soma no reconhecido, em vez de abrir um 2o incidente
        );
        $st->execute([':fp' => $fingerprint]);
        return $st->fetch(PDO::FETCH_ASSOC) ?: null;
    }

    /** Regra especifica da conexao; senao a global; senao null. */
    private function ruleFor(string $type, ?int $connId): ?array
    {
        try {
            $st = $this->pdo->prepare(
                'SELECT * FROM DT_Regra_Alerta
                  WHERE alert_type = :t AND (connection_id = :cid OR connection_id IS NULL)
               ORDER BY connection_id IS NULL
                  LIMIT 1'
            );
            $st->execute([':t' => $type, ':cid' => $connId]);
            return $st->fetch(PDO::FETCH_ASSOC) ?: null;
        } catch (PDOException $e) {
            return null;
        }
    }

    private function addOccurrence(int $alertId, ?string $detail): void
    {
        try {
            $this->pdo->prepare(
                'INSERT INTO DT_Alerta_Ocorrencia (alert_id, occurred_at, detail)
                 VALUES (:id, NOW(), :d)'
            )->execute([
                ':id' => $alertId,
                ':d'  => $detail !== null ? mb_substr($detail, 0, 1000) : null,
            ]);
        } catch (PDOException $e) {
            // Historico de ocorrencia e acessorio; nao derruba o alerta.
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // LEITURA (central de alertas §28)
    // ═══════════════════════════════════════════════════════════════

    public function listAlerts(array $f = []): array
    {
        $where  = ['1=1'];
        $params = [];

        if (!empty($f['status']))     { $where[] = 'a.status = :st';     $params[':st']  = (string)$f['status']; }
        if (!empty($f['severity']))   { $where[] = 'a.severity = :sev';  $params[':sev'] = (string)$f['severity']; }
        if (!empty($f['alert_type'])) { $where[] = 'a.alert_type = :t';  $params[':t']   = (string)$f['alert_type']; }
        if (!empty($f['connection_id'])) { $where[] = 'a.connection_id = :cid'; $params[':cid'] = (int)$f['connection_id']; }

        $limit = max(1, min((int)($f['limit'] ?? 100), 200));

        try {
            $sql = 'SELECT a.*, c.name connection_name, e.label environment_label,
                           TIMESTAMPDIFF(SECOND, a.first_seen_at, COALESCE(a.resolved_at, NOW())) age_sec
                      FROM DT_Alerta a
                 LEFT JOIN DT_Conexao  c ON c.id = a.connection_id
                 LEFT JOIN DT_Ambiente e ON e.id = c.environment_id
                     WHERE ' . implode(' AND ', $where) . '
                  ORDER BY a.status = "active" DESC,
                           FIELD(a.severity, "critico", "atencao", "informativo"),
                           a.last_seen_at DESC
                     LIMIT :lim';

            $st = $this->pdo->prepare($sql);
            foreach ($params as $k => $v) {
                $st->bindValue($k, $v);
            }
            $st->bindValue(':lim', $limit, PDO::PARAM_INT);
            $st->execute();
            return $st->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'DtAlertService::listAlerts');
        }
    }

    public function counters(): array
    {
        try {
            return $this->pdo->query(
                'SELECT
                   SUM(status = "active")                                   active,
                   SUM(status = "active" AND severity = "critico")          critical,
                   SUM(status = "active" AND severity = "atencao")          warning,
                   SUM(status = "active" AND severity = "informativo")      info,
                   SUM(status = "acknowledged")                             acknowledged,
                   SUM(status = "resolved")                                 resolved
                 FROM DT_Alerta'
            )->fetch(PDO::FETCH_ASSOC) ?: [];
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'DtAlertService::counters');
        }
    }

    /**
     * Detalhe de UM alerta (§28) para o drawer: a linha do alerta (mesmos JOINs
     * da lista, para status/idade sempre frescos) + a LINHA DO TEMPO de
     * ocorrencias individuais de DT_Alerta_Ocorrencia (historico do incidente,
     * que a lista so contabiliza em `occurrences`). Read-only. Devolve null se o
     * id nao existir. Ocorrencias limitadas (bounded) e mais recentes primeiro.
     */
    public function getAlertDetail(int $id): ?array
    {
        try {
            $st = $this->pdo->prepare(
                'SELECT a.*, c.name connection_name, e.label environment_label,
                        TIMESTAMPDIFF(SECOND, a.first_seen_at, COALESCE(a.resolved_at, NOW())) age_sec
                   FROM DT_Alerta a
              LEFT JOIN DT_Conexao  c ON c.id = a.connection_id
              LEFT JOIN DT_Ambiente e ON e.id = c.environment_id
                  WHERE a.id = :id'
            );
            $st->execute([':id' => $id]);
            $alert = $st->fetch(PDO::FETCH_ASSOC);
            if (!$alert) {
                return null;
            }

            $occ = $this->pdo->prepare(
                'SELECT id, occurred_at, detail
                   FROM DT_Alerta_Ocorrencia
                  WHERE alert_id = :id
               ORDER BY occurred_at DESC, id DESC
                  LIMIT 200'
            );
            $occ->execute([':id' => $id]);

            return [
                'alert'       => $alert,
                'occurrences' => $occ->fetchAll(PDO::FETCH_ASSOC),
            ];
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'DtAlertService::getAlertDetail');
        }
    }
}
