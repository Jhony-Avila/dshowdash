<?php
// DataTables / StatusRepository - status atual, agregacoes e interrupcoes
// @version 1.0.0
// @created 2026-07-20
// @app DataTables
//
// Sustenta a disponibilidade (§15) sem guardar cada verificacao individual:
// grava contadores por hora e por dia (§41). Com 5 min de intervalo isso
// significa 12 linhas/hora colapsadas em 1 - a serie de 90 dias cabe em ~2160
// linhas por conexao em vez de ~26 mil.
declare(strict_types=1);

require_once __DIR__ . '/../../core/repositories/RepositoryException.php';

final class DtStatusRepository
{
    /** Falhas consecutivas para considerar interrupcao confirmada. */
    private const OUTAGE_THRESHOLD = 2;

    /** Trocas de status na ultima hora acima disso => 'unstable' (§13.2). */
    private const FLAP_THRESHOLD = 4;

    private PDO $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    // ═══════════════════════════════════════════════════════════════
    // MANUTENCAO E LIMITES
    // ═══════════════════════════════════════════════════════════════

    /** Ha janela de manutencao aberta cobrindo esta conexao agora? (§27) */
    public function isUnderMaintenance(int $connId): bool
    {
        try {
            $st = $this->pdo->prepare(
                'SELECT COUNT(*) FROM DT_Manutencao
                  WHERE target_type = "connection" AND target_id = :id
                    AND ended_at IS NULL
                    AND started_at <= NOW()
                    AND (expected_end IS NULL OR expected_end >= NOW())'
            );
            $st->execute([':id' => $connId]);
            return (int)$st->fetchColumn() > 0;
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'DtStatusRepository::isUnderMaintenance');
        }
    }

    /** Limite de latencia: especifico da conexao, senao o default global. */
    public function slowThresholdFor(int $connId): int
    {
        try {
            $st = $this->pdo->prepare(
                'SELECT warn_value FROM DT_Limite
                  WHERE metric_key = "latency_ms" AND (connection_id = :id OR connection_id IS NULL)
                  ORDER BY connection_id IS NULL
                  LIMIT 1'
            );
            $st->execute([':id' => $connId]);
            $v = $st->fetchColumn();
            return $v !== false && $v !== null ? (int)$v : 1500;
        } catch (PDOException $e) {
            return 1500;
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // STATUS ATUAL
    // ═══════════════════════════════════════════════════════════════

    /**
     * Grava o status atual. Detecta oscilacao: se o status mudou muitas vezes
     * na ultima hora, o resultado final vira 'unstable' mesmo que este check
     * individual tenha passado - e o sintoma que o operador precisa ver.
     */
    public function upsertCurrent(int $connId, array $res, bool $isOk): void
    {
        try {
            $prev = $this->pdo->prepare(
                'SELECT status, since, consecutive_fail, flap_count_1h FROM DT_Status_Atual
                  WHERE connection_id = :id LIMIT 1'
            );
            $prev->execute([':id' => $connId]);
            $old = $prev->fetch(PDO::FETCH_ASSOC);

            $status  = $res['status'];
            $changed = $old === false || $old['status'] !== $status;

            $consecutiveFail = $isOk ? 0 : (int)(($old['consecutive_fail'] ?? 0)) + 1;
            $flap = (int)($old['flap_count_1h'] ?? 0) + ($changed && $old !== false ? 1 : 0);

            // Reescreve para 'unstable' se oscilou demais e o estado atual e saudavel.
            if ($flap >= self::FLAP_THRESHOLD && $isOk) {
                $status  = 'unstable';
                $changed = $old === false || $old['status'] !== $status;
            }

            $since = $changed ? date('Y-m-d H:i:s') : ($old['since'] ?? date('Y-m-d H:i:s'));

            $sql = 'INSERT INTO DT_Status_Atual
                      (connection_id, status, since, latency_ms, step_failed, read_ok, write_ok,
                       write_supported, last_error, checked_at, consecutive_fail, flap_count_1h)
                    VALUES
                      (:id, :st, :since, :lat, :step, :rok, :wok, :wsup, :err, :cat, :cfail, :flap)
                    ON DUPLICATE KEY UPDATE
                       status = VALUES(status), since = VALUES(since), latency_ms = VALUES(latency_ms),
                       step_failed = VALUES(step_failed), read_ok = VALUES(read_ok),
                       write_ok = VALUES(write_ok), write_supported = VALUES(write_supported),
                       last_error = VALUES(last_error), checked_at = VALUES(checked_at),
                       consecutive_fail = VALUES(consecutive_fail), flap_count_1h = VALUES(flap_count_1h)';

            $st = $this->pdo->prepare($sql);
            $st->execute([
                ':id' => $connId, ':st' => $status, ':since' => $since,
                ':lat' => $res['latency_ms'], ':step' => $res['step_failed'],
                ':rok' => $res['read_ok'], ':wok' => $res['write_ok'],
                ':wsup' => $res['write_supported'],
                ':err' => $res['error'] !== null ? mb_substr($res['error'], 0, 1000) : null,
                ':cat' => $res['checked_at'], ':cfail' => $consecutiveFail, ':flap' => $flap,
            ]);
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'DtStatusRepository::upsertCurrent');
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // AGREGACOES
    // ═══════════════════════════════════════════════════════════════

    /** Incrementa os contadores da hora e do dia correntes. */
    public function recordAggregate(int $connId, string $status, ?int $latencyMs, bool $isOk, bool $isMaint): void
    {
        $slow = $status === 'slow' ? 1 : 0;
        $fail = (!$isOk && !$isMaint) ? 1 : 0;
        $ok   = $isOk ? 1 : 0;
        $mnt  = $isMaint ? 1 : 0;
        $lat  = $latencyMs ?? 0;

        try {
            // HORA
            $this->pdo->prepare(
                'INSERT INTO DT_Verificacao_Hora
                   (connection_id, bucket_hour, checks_total, checks_ok, checks_slow, checks_fail,
                    maint_total, latency_avg_ms, latency_max_ms)
                 VALUES
                   (:id, DATE_FORMAT(NOW(), "%Y-%m-%d %H:00:00"), 1, :ok, :slow, :fail, :mnt, :lat_avg, :lat_max)
                 ON DUPLICATE KEY UPDATE
                    checks_total = checks_total + 1,
                    checks_ok    = checks_ok + VALUES(checks_ok),
                    checks_slow  = checks_slow + VALUES(checks_slow),
                    checks_fail  = checks_fail + VALUES(checks_fail),
                    maint_total  = maint_total + VALUES(maint_total),
                    latency_avg_ms = ROUND(((latency_avg_ms * (checks_total - 1)) + VALUES(latency_avg_ms)) / checks_total),
                    latency_max_ms = GREATEST(COALESCE(latency_max_ms,0), VALUES(latency_max_ms))'
            )->execute([':id' => $connId, ':ok' => $ok, ':slow' => $slow, ':fail' => $fail,
                        ':mnt' => $mnt, ':lat_avg' => $lat, ':lat_max' => $lat]);

            // DIA
            $this->pdo->prepare(
                'INSERT INTO DT_Verificacao_Dia
                   (connection_id, bucket_day, checks_total, checks_ok, checks_slow, checks_fail,
                    maint_total, latency_avg_ms, latency_max_ms)
                 VALUES
                   (:id, CURDATE(), 1, :ok, :slow, :fail, :mnt, :lat_avg, :lat_max)
                 ON DUPLICATE KEY UPDATE
                    checks_total = checks_total + 1,
                    checks_ok    = checks_ok + VALUES(checks_ok),
                    checks_slow  = checks_slow + VALUES(checks_slow),
                    checks_fail  = checks_fail + VALUES(checks_fail),
                    maint_total  = maint_total + VALUES(maint_total),
                    latency_avg_ms = ROUND(((latency_avg_ms * (checks_total - 1)) + VALUES(latency_avg_ms)) / checks_total),
                    latency_max_ms = GREATEST(COALESCE(latency_max_ms,0), VALUES(latency_max_ms))'
            )->execute([':id' => $connId, ':ok' => $ok, ':slow' => $slow, ':fail' => $fail,
                        ':mnt' => $mnt, ':lat_avg' => $lat, ':lat_max' => $lat]);
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'DtStatusRepository::recordAggregate');
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // INTERRUPCOES
    // ═══════════════════════════════════════════════════════════════

    /**
     * Abre interrupcao quando a falha se confirma e fecha quando recupera.
     * Exige OUTAGE_THRESHOLD falhas seguidas para nao registrar soluco de rede
     * como indisponibilidade.
     */
    public function reconcileOutage(int $connId, array $res, bool $isOk, bool $isMaint): void
    {
        try {
            $open = $this->pdo->prepare(
                'SELECT id, started_at FROM DT_Interrupcao
                  WHERE connection_id = :id AND ended_at IS NULL
                  ORDER BY id DESC LIMIT 1'
            );
            $open->execute([':id' => $connId]);
            $current = $open->fetch(PDO::FETCH_ASSOC);

            if ($isOk || $isMaint) {
                if ($current) {
                    $this->pdo->prepare(
                        'UPDATE DT_Interrupcao
                            SET ended_at = NOW(),
                                duration_sec = TIMESTAMPDIFF(SECOND, started_at, NOW()),
                                recovered = 1
                          WHERE id = :id'
                    )->execute([':id' => $current['id']]);
                }
                return;
            }

            if ($current) {
                return; // ja registrada
            }

            $cf = $this->pdo->prepare('SELECT consecutive_fail FROM DT_Status_Atual WHERE connection_id = :id');
            $cf->execute([':id' => $connId]);
            if ((int)$cf->fetchColumn() < self::OUTAGE_THRESHOLD) {
                return;
            }

            $this->pdo->prepare(
                'INSERT INTO DT_Interrupcao
                   (connection_id, started_at, status, reason, last_error, is_planned)
                 VALUES (:id, NOW(), :st, :rs, :err, 0)'
            )->execute([
                ':id'  => $connId,
                ':st'  => $res['status'],
                ':rs'  => 'Falha na etapa: ' . ($res['step_failed'] ?? 'desconhecida'),
                ':err' => $res['error'] !== null ? mb_substr($res['error'], 0, 1000) : null,
            ]);
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'DtStatusRepository::reconcileOutage');
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // DISPONIBILIDADE (§15.1)
    // ═══════════════════════════════════════════════════════════════

    /**
     * Disponibilidade percentual nos 4 periodos.
     * Manutencao planejada sai do denominador - nao e indisponibilidade
     * inesperada. Sem verificacoes no periodo devolve null (nao 100%, que
     * mentiria dizendo que estava tudo bem).
     */
    public function availability(int $connId): array
    {
        $out = [];
        try {
            // 24h e 7d pela agregacao horaria (granularidade fina).
            foreach (['24h' => 24, '7d' => 168] as $key => $hours) {
                $st = $this->pdo->prepare(
                    'SELECT SUM(checks_total) t, SUM(checks_ok) o, SUM(maint_total) m
                       FROM DT_Verificacao_Hora
                      WHERE connection_id = :id AND bucket_hour >= DATE_SUB(NOW(), INTERVAL :h HOUR)'
                );
                $st->bindValue(':id', $connId, PDO::PARAM_INT);
                $st->bindValue(':h', $hours, PDO::PARAM_INT);
                $st->execute();
                $out[$key] = $this->pct($st->fetch(PDO::FETCH_ASSOC));
            }

            // 30d e 90d pela agregacao diaria.
            foreach (['30d' => 30, '90d' => 90] as $key => $days) {
                $st = $this->pdo->prepare(
                    'SELECT SUM(checks_total) t, SUM(checks_ok) o, SUM(maint_total) m
                       FROM DT_Verificacao_Dia
                      WHERE connection_id = :id AND bucket_day >= DATE_SUB(CURDATE(), INTERVAL :d DAY)'
                );
                $st->bindValue(':id', $connId, PDO::PARAM_INT);
                $st->bindValue(':d', $days, PDO::PARAM_INT);
                $st->execute();
                $out[$key] = $this->pct($st->fetch(PDO::FETCH_ASSOC));
            }
            return $out;
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'DtStatusRepository::availability');
        }
    }

    private function pct(?array $row): ?float
    {
        if (!$row || $row['t'] === null) {
            return null;
        }
        $total = (int)$row['t'] - (int)$row['m'];   // manutencao fora do denominador
        if ($total <= 0) {
            return null;
        }
        return round(((int)$row['o'] / $total) * 100, 2);
    }

    /** Resumo de interrupcoes no periodo (§15.2). */
    public function outageSummary(int $connId, int $days = 30): array
    {
        try {
            $st = $this->pdo->prepare(
                'SELECT COUNT(*) failures,
                        COALESCE(SUM(duration_sec), 0) total_sec,
                        COALESCE(MAX(duration_sec), 0) longest_sec,
                        SUM(ended_at IS NULL) ongoing
                   FROM DT_Interrupcao
                  WHERE connection_id = :id AND started_at >= DATE_SUB(NOW(), INTERVAL :d DAY)'
            );
            $st->bindValue(':id', $connId, PDO::PARAM_INT);
            $st->bindValue(':d', $days, PDO::PARAM_INT);
            $st->execute();
            $r = $st->fetch(PDO::FETCH_ASSOC) ?: [];
            return [
                'failures'    => (int)($r['failures'] ?? 0),
                'total_sec'   => (int)($r['total_sec'] ?? 0),
                'longest_sec' => (int)($r['longest_sec'] ?? 0),
                'ongoing'     => (bool)($r['ongoing'] ?? false),
            ];
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'DtStatusRepository::outageSummary');
        }
    }

    /** Status atual + disponibilidade, para o card de saude (§12). */
    public function currentFor(int $connId): ?array
    {
        try {
            $st = $this->pdo->prepare('SELECT * FROM DT_Status_Atual WHERE connection_id = :id LIMIT 1');
            $st->execute([':id' => $connId]);
            $row = $st->fetch(PDO::FETCH_ASSOC);
            if (!$row) {
                return null;
            }
            foreach (['read_ok', 'write_ok'] as $k) {
                $row[$k] = $row[$k] === null ? null : (bool)$row[$k];
            }
            $row['write_supported'] = (bool)$row['write_supported'];
            $row['availability']    = $this->availability($connId);
            return $row;
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'DtStatusRepository::currentFor');
        }
    }

    /** Expurgo da retencao (§41): agregacao horaria so precisa cobrir 7 dias. */
    public function purgeOldAggregates(): array
    {
        try {
            $h = $this->pdo->exec(
                'DELETE FROM DT_Verificacao_Hora WHERE bucket_hour < DATE_SUB(NOW(), INTERVAL 8 DAY)'
            );
            $d = $this->pdo->exec(
                'DELETE FROM DT_Verificacao_Dia WHERE bucket_day < DATE_SUB(CURDATE(), INTERVAL 90 DAY)'
            );
            return ['hours_deleted' => (int)$h, 'days_deleted' => (int)$d];
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'DtStatusRepository::purgeOldAggregates');
        }
    }

    /** Zera o contador de oscilacao fora da janela de 1h. */
    public function decayFlapCounters(): void
    {
        try {
            $this->pdo->exec(
                'UPDATE DT_Status_Atual SET flap_count_1h = 0
                  WHERE checked_at < DATE_SUB(NOW(), INTERVAL 1 HOUR)'
            );
        } catch (PDOException $e) {
            // Nao critico.
        }
    }
}
