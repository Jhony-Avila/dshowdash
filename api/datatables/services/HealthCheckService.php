<?php
// DataTables / HealthCheckService - verificacao de conexao em 8 etapas (§14)
// @version 1.0.0
// @created 2026-07-20
// @app DataTables
//
// REGRA INVIOLAVEL (§14.3): o teste de gravacao NUNCA escreve em tabela de
// negocio. Usa exclusivamente DT_Write_Probe, dentro de transacao com ROLLBACK.
// Se o usuario for read-only, isso NAO e falha: e 'nao aplicavel'. Marcar um
// banco read-only como offline geraria alerta critico falso permanente.
declare(strict_types=1);

require_once __DIR__ . '/../lib/ConnectionFactory.php';
require_once __DIR__ . '/../repositories/StatusRepository.php';

final class DtHealthCheckService
{
    // Etapas da verificacao (§14.1), na ordem
    public const STEP_HOST      = 'host';
    public const STEP_CONNECT   = 'connect';
    public const STEP_AUTH      = 'auth';
    public const STEP_SELECT_DB = 'select_db';
    public const STEP_READ      = 'read';
    public const STEP_WRITE     = 'write';

    private const PROBE_TABLE = 'DT_Write_Probe';

    private PDO $local;
    private DtStatusRepository $status;

    public function __construct(PDO $localPdo)
    {
        $this->local  = $localPdo;
        $this->status = new DtStatusRepository($localPdo);
    }

    /**
     * Executa a verificacao completa de uma conexao e persiste o resultado.
     *
     * @param array $conn Linha de DT_Conexao COM password_encrypted
     * @return array Resultado normalizado
     */
    public function check(array $conn): array
    {
        $connId = (int)$conn['id'];

        // Manutencao vence qualquer resultado tecnico (§27.2): o recurso esta
        // fora por decisao humana, nao por falha.
        if ($this->status->isUnderMaintenance($connId)) {
            $res = $this->result(DtConnectionFactory::ST_MAINTENANCE, null, null, null, null, null, true);
            $this->persist($connId, $res, $conn);
            return $res;
        }

        $slowMs = $this->status->slowThresholdFor($connId);
        $remote = null;
        $t0     = microtime(true);

        try {
            // Etapas 1-4: host, conexao, autenticacao, selecao do banco.
            // O driver funde as quatro; a classificacao do erro as separa.
            $remote = DtConnectionFactory::open($conn);
            $latency = (microtime(true) - $t0) * 1000;

            // Etapa 5-6: leitura simples e barata (§14.2).
            $readOk = $this->probeRead($remote);
            if (!$readOk) {
                $res = $this->result(
                    DtConnectionFactory::ST_OFFLINE, $latency, self::STEP_READ,
                    0, null, 'Consulta de leitura nao retornou o valor esperado', true
                );
                $this->persist($connId, $res, $conn);
                return $res;
            }

            // Etapa 7: gravacao isolada. Tres desfechos: ok, nao suportado, falha.
            // POLITICA SOMENTE-LEITURA (§14.3.1): conexoes marcadas
            // `monitor_read_only` no extra_json NUNCA sao gravadas — nem o CREATE
            // da tabela-sonda (ensureProbeTable faz DDL, que auto-commita e NAO
            // volta no rollback). Protege bancos de PRODUCAO monitorados com
            // credencial privilegiada (o read/SELECT 1 continua indicando online).
            $write = $this->isReadOnlyPolicy($conn)
                ? ['ok' => null, 'supported' => false,
                   'error' => 'Gravacao nao aplicavel: conexao somente-leitura por politica']
                : $this->probeWrite($remote, $connId);

            // Etapa 8: tempo total decide online vs slow.
            $totalMs = (microtime(true) - $t0) * 1000;
            $status  = DtConnectionFactory::classifyLatency($totalMs, $slowMs);

            $res = $this->result(
                $status, $totalMs, null, 1,
                $write['ok'], $write['error'], $write['supported']
            );
            $this->persist($connId, $res, $conn);
            return $res;

        } catch (Throwable $e) {
            $latency = (microtime(true) - $t0) * 1000;
            $status  = DtConnectionFactory::classifyError($e);
            $step    = $status === DtConnectionFactory::ST_CRED_EXPIRED
                     ? self::STEP_AUTH : self::STEP_CONNECT;

            $res = $this->result(
                $status, $latency, $step, 0, null,
                DtConnectionFactory::safeError($e), true
            );
            $this->persist($connId, $res, $conn);
            return $res;

        } finally {
            DtConnectionFactory::close($remote);
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // PROBES
    // ═══════════════════════════════════════════════════════════════

    /**
     * Politica somente-leitura: extra_json.monitor_read_only === true.
     * `extra_json` chega como string (SELECT * do findMonitorable/findForConnect)
     * ou ja como array — tolera os dois.
     */
    private function isReadOnlyPolicy(array $conn): bool
    {
        $raw = $conn['extra_json'] ?? null;
        if (is_string($raw) && $raw !== '') {
            $j = json_decode($raw, true);
            return is_array($j) && !empty($j['monitor_read_only']);
        }
        if (is_array($raw)) {
            return !empty($raw['monitor_read_only']);
        }
        return false;
    }

    /** Leitura minima e de custo desprezivel (§14.2). */
    private function probeRead(PDO $remote): bool
    {
        try {
            $v = $remote->query('SELECT 1')->fetchColumn();
            return (int)$v === 1;
        } catch (Throwable $e) {
            return false;
        }
    }

    /**
     * Gravacao isolada em DT_Write_Probe (§14.3).
     *
     * Fluxo: BEGIN -> INSERT -> confirma leitura -> DELETE -> ROLLBACK.
     * O rollback torna a escrita invisivel mesmo se algo falhar no meio.
     *
     * @return array{ok:?int, supported:bool, error:?string}
     */
    private function probeWrite(PDO $remote, int $connId): array
    {
        // A tabela precisa existir no banco monitorado. Se nao houver permissao
        // para cria-la, o teste e "nao aplicavel" - nao e falha.
        if (!$this->ensureProbeTable($remote)) {
            return [
                'ok' => null, 'supported' => false,
                'error' => 'Gravacao nao aplicavel: sem permissao para criar/usar ' . self::PROBE_TABLE,
            ];
        }

        $uuid = bin2hex(random_bytes(16));
        $inTx = false;

        try {
            $remote->beginTransaction();
            $inTx = true;

            $st = $remote->prepare(
                'INSERT INTO ' . self::PROBE_TABLE . ' (probe_uuid, probe_at, origin) VALUES (?, NOW(), ?)'
            );
            $st->execute([$uuid, 'datatables:conn=' . $connId]);

            // Confirma que o registro existe DENTRO da transacao.
            $chk = $remote->prepare('SELECT COUNT(*) FROM ' . self::PROBE_TABLE . ' WHERE probe_uuid = ?');
            $chk->execute([$uuid]);
            $found = (int)$chk->fetchColumn() === 1;

            $del = $remote->prepare('DELETE FROM ' . self::PROBE_TABLE . ' WHERE probe_uuid = ?');
            $del->execute([$uuid]);

            // ROLLBACK e nao COMMIT: nada persiste, nem a linha de teste.
            $remote->rollBack();
            $inTx = false;

            return $found
                ? ['ok' => 1, 'supported' => true, 'error' => null]
                : ['ok' => 0, 'supported' => true, 'error' => 'Registro de teste nao encontrado apos insercao'];

        } catch (Throwable $e) {
            if ($inTx) {
                try { $remote->rollBack(); } catch (Throwable $ignored) {}
            }

            // Erro de permissao => read-only, nao falha operacional.
            if ($this->isPermissionError($e)) {
                return [
                    'ok' => null, 'supported' => false,
                    'error' => 'Gravacao nao aplicavel: credencial somente-leitura',
                ];
            }

            return ['ok' => 0, 'supported' => true, 'error' => DtConnectionFactory::safeError($e)];
        }
    }

    /** Cria a tabela tecnica se faltar. Falha silenciosa => sem permissao. */
    private function ensureProbeTable(PDO $remote): bool
    {
        try {
            $st = $remote->query('SHOW TABLES LIKE ' . $remote->quote(self::PROBE_TABLE));
            if ($st->fetchColumn() !== false) {
                return true;
            }
        } catch (Throwable $e) {
            return false;
        }

        try {
            $remote->exec(
                'CREATE TABLE IF NOT EXISTS ' . self::PROBE_TABLE . ' (
                    id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
                    probe_uuid VARCHAR(36) NOT NULL,
                    probe_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    origin     VARCHAR(64) NULL,
                    PRIMARY KEY (id),
                    KEY idx_probe_uuid (probe_uuid)
                 ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
            );
            return true;
        } catch (Throwable $e) {
            return false;
        }
    }

    /** MySQL: 1142 sem privilegio na tabela, 1044 no banco, 1227 operacao negada. */
    private function isPermissionError(Throwable $e): bool
    {
        $s = $e->getCode() . ' ' . $e->getMessage();
        return (bool)preg_match('/\b(1142|1044|1227|1045)\b/', $s)
            || stripos($s, 'command denied') !== false
            || stripos($s, 'access denied') !== false
            || stripos($s, 'read-only') !== false
            || stripos($s, 'super-read-only') !== false;
    }

    // ═══════════════════════════════════════════════════════════════
    // RESULTADO E PERSISTENCIA
    // ═══════════════════════════════════════════════════════════════

    private function result(
        string $status, ?float $latencyMs, ?string $stepFailed,
        ?int $readOk, ?int $writeOk, ?string $error, bool $writeSupported
    ): array {
        return [
            'status'          => $status,
            'latency_ms'      => $latencyMs !== null ? (int)round($latencyMs) : null,
            'step_failed'     => $stepFailed,
            'read_ok'         => $readOk,
            'write_ok'        => $writeOk,
            'write_supported' => $writeSupported ? 1 : 0,
            'error'           => $error,
            'checked_at'      => date('Y-m-d H:i:s'),
        ];
    }

    /** Grava status atual, agregacoes, interrupcao e espelha em DT_Conexao. */
    private function persist(int $connId, array $res, array $conn): void
    {
        $isOk = in_array($res['status'], [
            DtConnectionFactory::ST_ONLINE,
            DtConnectionFactory::ST_SLOW,
        ], true);
        $isMaint = $res['status'] === DtConnectionFactory::ST_MAINTENANCE;

        $this->status->upsertCurrent($connId, $res, $isOk);
        $this->status->recordAggregate($connId, $res['status'], $res['latency_ms'], $isOk, $isMaint);
        $this->status->reconcileOutage($connId, $res, $isOk, $isMaint);

        // Espelha na conexao para as listagens nao precisarem de JOIN.
        $st = $this->local->prepare(
            'UPDATE DT_Conexao
                SET status = :st, last_check_at = NOW(), last_error = :err'
            . ($isOk ? ', last_success_at = NOW()' : '') .
            ' WHERE id = :id'
        );
        $st->execute([
            ':st'  => $res['status'],
            ':err' => $res['error'] !== null ? mb_substr($res['error'], 0, 1000) : null,
            ':id'  => $connId,
        ]);
    }
}
