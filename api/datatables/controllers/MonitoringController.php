<?php
// DataTables / MonitoringController - manutencao planejada (§27)
// @version 1.0.0
// @created 2026-07-20
// @app DataTables
declare(strict_types=1);

final class DtMonitoringController
{
    private const TARGET_TYPES = ['connection', 'server', 'database'];

    public static function maintenance(string $method, array $segments, PDO $pdo): void
    {
        $id     = isset($segments[1]) && $segments[1] !== '' ? (int)$segments[1] : null;
        $action = $segments[2] ?? null;

        if ($id !== null && $action === 'close') {
            self::close($id, $pdo);
            return;
        }

        match ($method) {
            'GET'   => self::index($pdo),
            'POST'  => self::open($pdo),
            default => ApiResponse::error(ApiResponse::ERR_METHOD_NOT_ALLOWED, 405,
                           ['message' => 'Metodo nao permitido']),
        };
    }

    /** GET /maintenance - janelas abertas e recentes */
    private static function index(PDO $pdo): void
    {
        $st = $pdo->query(
            'SELECT m.*, c.name connection_name,
                    TIMESTAMPDIFF(SECOND, m.started_at, COALESCE(m.ended_at, NOW())) elapsed_sec
               FROM DT_Manutencao m
          LEFT JOIN DT_Conexao c ON c.id = m.target_id AND m.target_type = "connection"
              WHERE m.ended_at IS NULL
                 OR m.started_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
           ORDER BY m.ended_at IS NULL DESC, m.started_at DESC
              LIMIT 100'
        );
        ApiResponse::success($st->fetchAll(PDO::FETCH_ASSOC), ['timestamp' => date('c')]);
    }

    /** POST /maintenance - abre janela */
    private static function open(PDO $pdo): void
    {
        $b = dt_body();

        $type = (string)($b['target_type'] ?? 'connection');
        if (!in_array($type, self::TARGET_TYPES, true)) {
            ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 400, [
                'message' => 'target_type invalido. Aceitos: ' . implode(', ', self::TARGET_TYPES),
            ]);
        }

        $targetId = (int)($b['target_id'] ?? 0);
        if ($targetId <= 0) {
            ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 400, ['message' => 'target_id obrigatorio']);
        }

        // Alvo precisa existir - senao a janela silencia alertas de nada.
        $table = match ($type) {
            'connection' => 'DT_Conexao',
            'server'     => 'DT_Servidor',
            'database'   => 'DT_Banco',
        };
        $chk = $pdo->prepare("SELECT COUNT(*) FROM {$table} WHERE id = :id");
        $chk->execute([':id' => $targetId]);
        if ((int)$chk->fetchColumn() === 0) {
            ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404, [
                'message' => "Alvo {$type} #{$targetId} nao encontrado",
            ]);
        }

        // Janela ja aberta para o mesmo alvo: nao duplica.
        $dup = $pdo->prepare(
            'SELECT id FROM DT_Manutencao
              WHERE target_type = :t AND target_id = :id AND ended_at IS NULL LIMIT 1'
        );
        $dup->execute([':t' => $type, ':id' => $targetId]);
        if ($existing = $dup->fetchColumn()) {
            ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 409, [
                'message'     => 'Ja existe janela de manutencao aberta para este alvo',
                'maintenance_id' => (int)$existing,
            ]);
        }

        $st = $pdo->prepare(
            'INSERT INTO DT_Manutencao
               (target_type, target_id, started_at, expected_end, reason, created_by, suppress_alerts, notes)
             VALUES (:t, :id, COALESCE(:start, NOW()), :end, :reason, :by, :sup, :notes)'
        );
        $st->execute([
            ':t'      => $type,
            ':id'     => $targetId,
            ':start'  => $b['started_at'] ?? null,
            ':end'    => $b['expected_end'] ?? null,
            ':reason' => isset($b['reason']) ? mb_substr((string)$b['reason'], 0, 500) : null,
            ':by'     => (string)(AuthHelpers::getCurrentUserId() ?? ''),
            ':sup'    => isset($b['suppress_alerts']) ? (int)((bool)$b['suppress_alerts']) : 1,
            ':notes'  => isset($b['notes']) ? mb_substr((string)$b['notes'], 0, 500) : null,
        ]);
        $newId = (int)$pdo->lastInsertId();

        // Reflete o estado imediatamente: status azul sem esperar o proximo ciclo.
        if ($type === 'connection') {
            $pdo->prepare('UPDATE DT_Conexao SET status = "maintenance" WHERE id = :id')
                ->execute([':id' => $targetId]);
        }

        ApiResponse::success(['id' => $newId, 'target_type' => $type, 'target_id' => $targetId], [
            'timestamp' => date('c'),
            'message'   => 'Janela de manutencao aberta. Alertas externos suspensos conforme configuracao.',
        ], 201);
    }

    /** POST /maintenance/{id}/close */
    private static function close(int $id, PDO $pdo): void
    {
        requireMethod(['POST']);

        $sel = $pdo->prepare('SELECT * FROM DT_Manutencao WHERE id = :id LIMIT 1');
        $sel->execute([':id' => $id]);
        $row = $sel->fetch(PDO::FETCH_ASSOC);

        if (!$row) {
            ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404, ['message' => 'Janela nao encontrada']);
        }
        if ($row['ended_at'] !== null) {
            ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 409, ['message' => 'Janela ja encerrada']);
        }

        $pdo->prepare('UPDATE DT_Manutencao SET ended_at = NOW() WHERE id = :id')->execute([':id' => $id]);

        // Sair da manutencao dispara verificacao imediata (§14): o operador
        // precisa saber se o recurso voltou, nao esperar ate 5 min.
        $check = null;
        if ($row['target_type'] === 'connection') {
            try {
                $repo = new DtConnectionRepository($pdo);
                $conn = $repo->findForConnect((int)$row['target_id']);
                if ($conn !== null) {
                    $check = (new DtHealthCheckService($pdo))->check($conn);
                }
            } catch (Throwable $e) {
                error_log('[datatables] check pos-manutencao falhou: ' . $e->getMessage());
            }
        }

        ApiResponse::success(['id' => $id, 'closed' => true, 'check' => $check], [
            'timestamp' => date('c'),
            'message'   => 'Janela encerrada',
        ]);
    }
}
