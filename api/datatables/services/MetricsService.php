<?php
// DataTables / MetricsService - serie historica de metricas (§16.1 / §18.4)
// @version 1.0.0
// @created 2026-07-20
// @app DataTables
//
// Coleta o que o MySQL ja expoe de graca:
//   - DT_Metrica_Banco  <- SHOW GLOBAL STATUS / VARIABLES (conexoes, lentas, deadlocks)
//   - DT_Metrica_Tabela <- tamanho e linhas aproximadas, ja lidos pelo inventario
//
// POR QUE ISSO EXISTE: sem serie historica nao ha como responder "esta tabela
// cresceu demais?" (§18.4). Uma foto isolada nao diz nada; a comparacao diz tudo.
//
// CUSTO: `SHOW GLOBAL STATUS` e leitura de contador em memoria, nao varre dado.
// As metricas de tabela vem do MESMO array que o inventario ja carregou - custo
// adicional ZERO no banco monitorado.
//
// PRIVILEGIO: `SHOW GLOBAL STATUS` costuma exigir apenas USAGE, mas alguns
// campos (PROCESSLIST) exigem PROCESS. Ausencia de privilegio NAO e erro:
// grava o que conseguiu e segue.
declare(strict_types=1);

require_once __DIR__ . '/../lib/ConnectionFactory.php';
require_once __DIR__ . '/../../core/repositories/RepositoryException.php';

final class DtMetricsService
{
    /** Amostras por tabela mantidas: 1 por dia. Mais que isso nao muda a analise. */
    private const SAMPLE_MIN_INTERVAL_HOURS = 20;

    private PDO $local;

    public function __construct(PDO $localPdo)
    {
        $this->local = $localPdo;
    }

    // ═══════════════════════════════════════════════════════════════
    // COLETA
    // ═══════════════════════════════════════════════════════════════

    /**
     * Captura metricas do servidor MySQL monitorado.
     *
     * @param PDO   $remote  Conexao ja aberta pelo inventario (reuso, sem custo extra)
     * @param int   $dbId    DT_Banco.id
     * @return bool Gravou?
     */
    public function captureDatabase(PDO $remote, int $dbId): bool
    {
        $status = $this->globalStatus($remote);
        if ($status === []) {
            return false;
        }

        $size = null;
        $tables = null;
        try {
            $st = $this->local->prepare('SELECT size_bytes, table_count FROM DT_Banco WHERE id = :id');
            $st->execute([':id' => $dbId]);
            if ($r = $st->fetch(PDO::FETCH_ASSOC)) {
                $size   = $r['size_bytes'] !== null ? (int)$r['size_bytes'] : null;
                $tables = (int)$r['table_count'];
            }
        } catch (PDOException $e) {
            // Sem agregado ainda: grava o que veio do status.
        }

        try {
            $this->local->prepare(
                'INSERT INTO DT_Metrica_Banco
                   (database_id, captured_at, size_bytes, table_count, connections,
                    threads_running, slow_queries, deadlocks, uptime_sec)
                 VALUES (:db, NOW(), :size, :tc, :conn, :thr, :slow, :dead, :up)'
            )->execute([
                ':db'   => $dbId,
                ':size' => $size,
                ':tc'   => $tables,
                ':conn' => $status['Threads_connected'] ?? null,
                ':thr'  => $status['Threads_running'] ?? null,
                ':slow' => $status['Slow_queries'] ?? null,
                // Innodb_deadlocks nao existe em todo servidor; ausencia vira NULL.
                ':dead' => $status['Innodb_deadlocks'] ?? null,
                ':up'   => $status['Uptime'] ?? null,
            ]);
            return true;
        } catch (PDOException $e) {
            error_log('[datatables:metrics] captureDatabase: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Grava uma amostra por tabela, no maximo 1 a cada SAMPLE_MIN_INTERVAL_HOURS.
     * O inventario roda 2x ao dia; sem esse teto a serie dobraria sem ganho.
     *
     * @param array $tables Linhas ja lidas pelo inventario: [['id','size_bytes','row_count_approx'], ...]
     */
    public function captureTables(int $dbId, array $tables): int
    {
        if ($tables === []) {
            return 0;
        }

        try {
            // Uma consulta so descobre quais tabelas ja tem amostra recente.
            $recent = [];
            $st = $this->local->prepare(
                'SELECT table_id, MAX(captured_at) last_at
                   FROM DT_Metrica_Tabela
                  WHERE captured_at >= DATE_SUB(NOW(), INTERVAL :h HOUR)
               GROUP BY table_id'
            );
            $st->bindValue(':h', self::SAMPLE_MIN_INTERVAL_HOURS, PDO::PARAM_INT);
            $st->execute();
            foreach ($st->fetchAll(PDO::FETCH_ASSOC) as $r) {
                $recent[(int)$r['table_id']] = true;
            }

            $ins = $this->local->prepare(
                'INSERT INTO DT_Metrica_Tabela (table_id, captured_at, size_bytes, row_count_approx)
                 VALUES (:t, NOW(), :s, :r)'
            );

            $n = 0;
            $own = !$this->local->inTransaction();
            if ($own) {
                $this->local->beginTransaction();
            }
            try {
                foreach ($tables as $t) {
                    $id = (int)($t['id'] ?? 0);
                    if ($id <= 0 || isset($recent[$id])) {
                        continue;
                    }
                    $ins->execute([
                        ':t' => $id,
                        ':s' => $t['size_bytes'] ?? null,
                        ':r' => $t['row_count_approx'] ?? null,
                    ]);
                    $n++;
                }
                if ($own) {
                    $this->local->commit();
                }
            } catch (Throwable $e) {
                if ($own && $this->local->inTransaction()) {
                    $this->local->rollBack();
                }
                throw $e;
            }
            return $n;
        } catch (PDOException $e) {
            error_log('[datatables:metrics] captureTables: ' . $e->getMessage());
            return 0;
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // CRESCIMENTO ANORMAL (§18.4)
    // ═══════════════════════════════════════════════════════════════

    /**
     * Compara a amostra mais recente com a mais antiga dentro da janela.
     *
     * DECISOES QUE EVITAM ALARME FALSO:
     *  - exige ao menos 2 amostras separadas por >= 24h; sem isso nao ha tendencia
     *  - ignora tabela que era minuscula (ruido: 10 -> 100 linhas e +900% e irrelevante)
     *  - compara TAMANHO e LINHAS; sinaliza pelo maior dos dois
     *
     * @return array Lista de crescimentos detectados
     */
    public function detectAbnormalGrowth(int $connId, int $windowDays = 7): array
    {
        $limit = $this->growthLimit($connId);

        try {
            $st = $this->local->prepare(
                'SELECT m.table_id,
                        t.name  table_name,
                        b.name  database_name,
                        MIN(m.captured_at) first_at,
                        MAX(m.captured_at) last_at,
                        COUNT(*) samples,
                        SUBSTRING_INDEX(GROUP_CONCAT(m.size_bytes ORDER BY m.captured_at ASC), ",", 1)  first_size,
                        SUBSTRING_INDEX(GROUP_CONCAT(m.size_bytes ORDER BY m.captured_at DESC), ",", 1) last_size,
                        SUBSTRING_INDEX(GROUP_CONCAT(m.row_count_approx ORDER BY m.captured_at ASC), ",", 1)  first_rows,
                        SUBSTRING_INDEX(GROUP_CONCAT(m.row_count_approx ORDER BY m.captured_at DESC), ",", 1) last_rows
                   FROM DT_Metrica_Tabela m
                   JOIN DT_Tabela t ON t.id = m.table_id
                   JOIN DT_Banco  b ON b.id = t.database_id
                  WHERE b.connection_id = :c
                    AND m.captured_at >= DATE_SUB(NOW(), INTERVAL :d DAY)
                    AND t.is_present = 1
               GROUP BY m.table_id, t.name, b.name
                 HAVING samples >= 2
                    AND TIMESTAMPDIFF(HOUR, first_at, last_at) >= 24'
            );
            $st->bindValue(':c', $connId, PDO::PARAM_INT);
            $st->bindValue(':d', $windowDays, PDO::PARAM_INT);
            $st->execute();

            $found = [];
            foreach ($st->fetchAll(PDO::FETCH_ASSOC) as $r) {
                $growth = $this->computeGrowth($r);
                if ($growth === null || $growth['pct'] < $limit) {
                    continue;
                }
                $found[] = $growth + [
                    'table_id'      => (int)$r['table_id'],
                    'table_name'    => $r['table_name'],
                    'database_name' => $r['database_name'],
                    'window_days'   => $windowDays,
                    'limit_pct'     => $limit,
                ];
            }
            return $found;
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'DtMetricsService::detectAbnormalGrowth');
        }
    }

    /**
     * Percentual de crescimento, com piso de relevancia.
     * @return array{pct:float,metric:string,from:int,to:int}|null
     */
    private function computeGrowth(array $r): ?array
    {
        $cands = [];

        // Piso: tabela abaixo disso cresce percentualmente muito por nada.
        $MIN_BYTES = 1024 * 1024;   // 1 MB
        $MIN_ROWS  = 1000;

        $fs = (int)$r['first_size'];
        $ls = (int)$r['last_size'];
        if ($fs >= $MIN_BYTES && $ls > $fs) {
            $cands[] = ['pct' => round((($ls - $fs) / $fs) * 100, 2), 'metric' => 'tamanho',
                        'from' => $fs, 'to' => $ls];
        }

        $fr = (int)$r['first_rows'];
        $lr = (int)$r['last_rows'];
        if ($fr >= $MIN_ROWS && $lr > $fr) {
            $cands[] = ['pct' => round((($lr - $fr) / $fr) * 100, 2), 'metric' => 'registros',
                        'from' => $fr, 'to' => $lr];
        }

        if ($cands === []) {
            return null;
        }
        usort($cands, static fn($a, $b) => $b['pct'] <=> $a['pct']);
        return $cands[0];
    }

    /** Limite configurado em DT_Limite (growth_pct_7d), senao 50%. */
    private function growthLimit(int $connId): float
    {
        try {
            $st = $this->local->prepare(
                'SELECT warn_value FROM DT_Limite
                  WHERE metric_key = "growth_pct_7d" AND (connection_id = :c OR connection_id IS NULL)
                    AND is_active = 1
               ORDER BY connection_id IS NULL LIMIT 1'
            );
            $st->execute([':c' => $connId]);
            $v = $st->fetchColumn();
            return $v !== false && $v !== null ? (float)$v : 50.0;
        } catch (PDOException $e) {
            return 50.0;
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // LEITURA
    // ═══════════════════════════════════════════════════════════════

    /** Serie do banco, para a tela de detalhe. */
    public function databaseSeries(int $dbId, int $days = 30): array
    {
        try {
            $st = $this->local->prepare(
                'SELECT captured_at, size_bytes, table_count, connections,
                        threads_running, slow_queries, deadlocks
                   FROM DT_Metrica_Banco
                  WHERE database_id = :d AND captured_at >= DATE_SUB(NOW(), INTERVAL :n DAY)
               ORDER BY captured_at'
            );
            $st->bindValue(':d', $dbId, PDO::PARAM_INT);
            $st->bindValue(':n', $days, PDO::PARAM_INT);
            $st->execute();
            return $st->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'DtMetricsService::databaseSeries');
        }
    }

    /** Serie de uma tabela. */
    public function tableSeries(int $tableId, int $days = 90): array
    {
        try {
            $st = $this->local->prepare(
                'SELECT captured_at, size_bytes, row_count_approx
                   FROM DT_Metrica_Tabela
                  WHERE table_id = :t AND captured_at >= DATE_SUB(NOW(), INTERVAL :n DAY)
               ORDER BY captured_at'
            );
            $st->bindValue(':t', $tableId, PDO::PARAM_INT);
            $st->bindValue(':n', $days, PDO::PARAM_INT);
            $st->execute();
            return $st->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'DtMetricsService::tableSeries');
        }
    }

    /** Cobertura da serie — o front precisa saber se ja da para confiar. */
    public function coverage(): array
    {
        try {
            return $this->local->query(
                'SELECT
                   (SELECT COUNT(*) FROM DT_Metrica_Tabela)                                     table_samples,
                   (SELECT COUNT(DISTINCT table_id) FROM DT_Metrica_Tabela)                     tables_covered,
                   (SELECT COUNT(*) FROM DT_Metrica_Banco)                                      db_samples,
                   (SELECT MIN(captured_at) FROM DT_Metrica_Tabela)                             since,
                   (SELECT TIMESTAMPDIFF(HOUR, MIN(captured_at), MAX(captured_at))
                      FROM DT_Metrica_Tabela)                                                   span_hours'
            )->fetch(PDO::FETCH_ASSOC) ?: [];
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'DtMetricsService::coverage');
        }
    }

    /**
     * Serie de tendencia executiva (Visao Geral): tamanho e nº de tabelas do MAIOR
     * banco catalogado ao longo do tempo. Deliberadamente NAO somamos todos os
     * bancos — cada rodada do cron amostra um numero diferente de conexoes online,
     * entao a soma oscilaria por amostragem, nao por crescimento real. O maior
     * banco (o que tem dados) da uma linha limpa. Enquanto o cron acumula
     * historico, retorna poucos pontos — o front usa `coverage` para rotular
     * "historico em formacao". Retorna tambem o rotulo do banco escolhido.
     */
    public function overviewSeries(int $days = 90): array
    {
        try {
            $alvo = $this->local->query(
                'SELECT id, name FROM DT_Banco ORDER BY size_bytes DESC, table_count DESC LIMIT 1'
            )->fetch(PDO::FETCH_ASSOC);
            if (!$alvo) {
                return ['db' => null, 'points' => []];
            }
            $st = $this->local->prepare(
                'SELECT captured_at t, ROUND(size_bytes) size_bytes, table_count
                   FROM DT_Metrica_Banco
                  WHERE database_id = :d AND captured_at >= DATE_SUB(NOW(), INTERVAL :n DAY)
               ORDER BY captured_at'
            );
            $st->bindValue(':d', (int) $alvo['id'], PDO::PARAM_INT);
            $st->bindValue(':n', $days, PDO::PARAM_INT);
            $st->execute();
            $points = array_map(static fn (array $r): array => [
                't'           => $r['t'],
                'size_bytes'  => (int) $r['size_bytes'],
                'table_count' => (int) $r['table_count'],
            ], $st->fetchAll(PDO::FETCH_ASSOC));
            return ['db' => $alvo['name'], 'points' => $points];
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'DtMetricsService::overviewSeries');
        }
    }

    /** Expurgo (§41): serie de tabela vive 90 dias; a de banco, 30. */
    public function purge(): array
    {
        try {
            $t = $this->local->exec(
                'DELETE FROM DT_Metrica_Tabela WHERE captured_at < DATE_SUB(NOW(), INTERVAL 90 DAY)'
            );
            $d = $this->local->exec(
                'DELETE FROM DT_Metrica_Banco WHERE captured_at < DATE_SUB(NOW(), INTERVAL 30 DAY)'
            );
            return ['table_metrics_deleted' => (int)$t, 'db_metrics_deleted' => (int)$d];
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'DtMetricsService::purge');
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // AUXILIARES
    // ═══════════════════════════════════════════════════════════════

    /** SHOW GLOBAL STATUS filtrado. Falha de privilegio devolve [] sem estourar. */
    private function globalStatus(PDO $remote): array
    {
        $wanted = ['Threads_connected', 'Threads_running', 'Slow_queries',
                   'Innodb_deadlocks', 'Uptime', 'Questions', 'Aborted_connects'];
        $out = [];
        try {
            $rows = $remote->query('SHOW GLOBAL STATUS')->fetchAll(PDO::FETCH_ASSOC);
            foreach ($rows as $r) {
                $name = $r['Variable_name'] ?? '';
                if (in_array($name, $wanted, true)) {
                    $out[$name] = is_numeric($r['Value']) ? (int)$r['Value'] : null;
                }
            }
        } catch (Throwable $e) {
            // Sem privilegio ou servidor exotico: metrica e opcional (§16.3).
            return [];
        }
        return $out;
    }
}
