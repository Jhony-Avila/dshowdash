<?php
// DataTables / AlertController - central de alertas (§28)
// @version 1.0.0
// @created 2026-07-20
// @app DataTables
declare(strict_types=1);

// W1 do Programa PARIDADE TOTAL (2026-10-28): a regra de `resolve` saiu para a lib compartilhada com a Ponte v2
// (api/ponte/libs/AlertaLib.php, movimento textual); este controller só responde HTTP. `acknowledge` já era DtAlertService.
require_once __DIR__ . '/../../ponte/libs/AlertaLib.php';

final class DtAlertController
{
    public static function route(string $method, array $segments, PDO $pdo): void
    {
        $id     = isset($segments[1]) && $segments[1] !== '' ? (int)$segments[1] : null;
        $action = $segments[2] ?? null;

        if ($id !== null && $action !== null) {
            match ($action) {
                'acknowledge' => self::acknowledge($id, $pdo),
                'resolve'     => self::resolve($id, $pdo),
                default       => ApiResponse::error(ApiResponse::ERR_INVALID_ACTION, 404,
                                     ['message' => 'Acao desconhecida: ' . $action]),
            };
            return;
        }

        // GET /alerts/{id} -> detalhe (alerta + linha do tempo de ocorrencias).
        if ($id !== null) {
            requireMethod(['GET']);
            self::detail($id, $pdo);
            return;
        }

        requireMethod(['GET']);
        self::index($pdo);
    }

    /** GET /alerts/{id} - detalhe para o drawer (§28). */
    private static function detail(int $id, PDO $pdo): void
    {
        $d = (new DtAlertService($pdo))->getAlertDetail($id);
        if ($d === null) {
            ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404, [
                'message' => 'Alerta nao encontrado',
            ]);
        }
        ApiResponse::success($d, ['timestamp' => date('c')]);
    }

    /** GET /alerts?status=&severity=&alert_type=&connection_id=&limit= */
    private static function index(PDO $pdo): void
    {
        $svc = new DtAlertService($pdo);
        $f   = dt_query(['status', 'severity', 'alert_type', 'connection_id', 'limit']);

        ApiResponse::success([
            'alerts'   => $svc->listAlerts($f),
            'counters' => $svc->counters(),
        ], ['timestamp' => date('c')]);
    }

    /** POST /alerts/{id}/acknowledge (§28.2) */
    private static function acknowledge(int $id, PDO $pdo): void
    {
        requireMethod(['POST']);

        $by = (string)(AuthHelpers::getCurrentUserId() ?: 'desconhecido');
        $ok = (new DtAlertService($pdo))->acknowledge($id, $by);

        if (!$ok) {
            ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404, [
                'message' => 'Alerta nao encontrado ou nao esta ativo',
            ]);
        }
        ApiResponse::success(['id' => $id, 'acknowledged' => true],
            ['timestamp' => date('c'), 'message' => 'Alerta reconhecido']);
    }

    /**
     * POST /alerts/{id}/resolve - encerramento MANUAL.
     * O caminho normal e a resolucao automatica quando a condicao deixa de
     * valer; isto cobre o caso em que o operador sabe que ja foi tratado.
     */
    private static function resolve(int $id, PDO $pdo): void
    {
        requireMethod(['POST']);

        try {
            $dados = alerta_resolver($pdo, $id);
        } catch (PonteErro $e) {
            ApiResponse::error($e->codigo, $e->status, $e->extra ?? []);
        }

        ApiResponse::success($dados, [
            'timestamp' => date('c'),
            'message'   => ALERTA_MSG_RESOLVIDO,
        ]);
    }
}
