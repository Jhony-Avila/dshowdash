<?php
// DataTables / ServerController - CRUD de servidores, aplicacoes e modulos
// @version 1.0.0
// @created 2026-07-20
// @app DataTables
declare(strict_types=1);

final class DtServerController
{
    // ═══════════════════════════════════════════════════════════════
    // SERVIDORES  /servers[/{id}]
    // ═══════════════════════════════════════════════════════════════

    public static function servers(string $method, array $segments, PDO $pdo): void
    {
        $id = isset($segments[1]) && $segments[1] !== '' ? (int)$segments[1] : null;

        match ($method) {
            'GET'    => $id !== null ? self::showServer($id, $pdo)
                                     : ApiResponse::success(
                                           (new DtCatalogRepository($pdo))->listServers(),
                                           ['timestamp' => date('c')]
                                       ),
            'POST'   => self::createServer($pdo),
            'PATCH', 'PUT' => self::updateServer($id, $pdo),
            'DELETE' => self::deactivateServer($id, $pdo),
            default  => ApiResponse::error(ApiResponse::ERR_METHOD_NOT_ALLOWED, 405,
                            ['message' => 'Metodo nao permitido']),
        };
    }

    private static function showServer(int $id, PDO $pdo): void
    {
        $row = (new DtServerRepository($pdo))->findServer($id);
        if ($row === null) {
            ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404, ['message' => 'Servidor nao encontrado']);
        }
        ApiResponse::success($row, ['timestamp' => date('c')]);
    }

    private static function createServer(PDO $pdo): void
    {
        $b   = dt_body();
        $err = self::validateServer($b, true);
        if ($err !== null) {
            ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 400, ['message' => $err]);
        }

        try {
            $repo = new DtServerRepository($pdo);
            $id   = $repo->createServer($b, (string)(AuthHelpers::getCurrentUserId() ?: ''));
            ApiResponse::success($repo->findServer($id),
                ['timestamp' => date('c'), 'message' => 'Servidor cadastrado'], 201);
        } catch (RuntimeException $e) {
            ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 409, ['message' => $e->getMessage()]);
        }
    }

    private static function updateServer(?int $id, PDO $pdo): void
    {
        if ($id === null || $id <= 0) {
            ApiResponse::error(ApiResponse::ERR_ID_REQUIRED, 400, ['message' => 'ID obrigatorio']);
        }

        $repo = new DtServerRepository($pdo);
        if ($repo->findServer($id) === null) {
            ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404, ['message' => 'Servidor nao encontrado']);
        }

        $b   = dt_body();
        $err = self::validateServer($b, false);
        if ($err !== null) {
            ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 400, ['message' => $err]);
        }

        try {
            $repo->updateServer($id, $b);
            ApiResponse::success($repo->findServer($id),
                ['timestamp' => date('c'), 'message' => 'Servidor atualizado']);
        } catch (RuntimeException $e) {
            ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 409, ['message' => $e->getMessage()]);
        }
    }

    private static function deactivateServer(?int $id, PDO $pdo): void
    {
        if ($id === null || $id <= 0) {
            ApiResponse::error(ApiResponse::ERR_ID_REQUIRED, 400, ['message' => 'ID obrigatorio']);
        }

        $r = (new DtServerRepository($pdo))->deactivateServer($id);
        if (!$r['ok']) {
            ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404, ['message' => 'Servidor nao encontrado']);
        }

        ApiResponse::success($r, [
            'timestamp' => date('c'),
            'message'   => $r['unlinked_connections'] > 0
                ? "Servidor desativado. {$r['unlinked_connections']} conexao(oes) desvinculada(s) — "
                  . 'elas continuam sendo monitoradas, agora sem servidor associado.'
                : 'Servidor desativado.',
        ]);
    }

    // ═══════════════════════════════════════════════════════════════
    // APLICACOES  /applications[/{id}[/modules[/{modId}]]]
    // ═══════════════════════════════════════════════════════════════

    public static function applications(string $method, array $segments, PDO $pdo): void
    {
        $id    = isset($segments[1]) && $segments[1] !== '' ? (int)$segments[1] : null;
        $sub   = $segments[2] ?? null;
        $subId = isset($segments[3]) && $segments[3] !== '' ? (int)$segments[3] : null;

        // Sub-recurso: modulos
        if ($id !== null && $sub === 'modules') {
            $repo = new DtServerRepository($pdo);
            if ($method === 'POST') {
                try {
                    $modId = $repo->createModule($id, dt_body());
                    ApiResponse::success(['id' => $modId, 'application_id' => $id],
                        ['timestamp' => date('c'), 'message' => 'Modulo criado'], 201);
                } catch (InvalidArgumentException $e) {
                    ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 400, ['message' => $e->getMessage()]);
                }
            }
            if ($method === 'DELETE' && $subId !== null) {
                $ok = $repo->deleteModule($subId);
                if (!$ok) {
                    ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404, ['message' => 'Modulo nao encontrado']);
                }
                ApiResponse::success(['id' => $subId, 'deleted' => true],
                    ['timestamp' => date('c'), 'message' => 'Modulo removido']);
            }
            ApiResponse::error(ApiResponse::ERR_METHOD_NOT_ALLOWED, 405, ['message' => 'Metodo nao permitido']);
        }

        match ($method) {
            'GET'    => $id !== null ? self::showApplication($id, $pdo) : self::listApplications($pdo),
            'POST'   => self::createApplication($pdo),
            'PATCH', 'PUT' => self::updateApplication($id, $pdo),
            'DELETE' => self::deactivateApplication($id, $pdo),
            default  => ApiResponse::error(ApiResponse::ERR_METHOD_NOT_ALLOWED, 405,
                            ['message' => 'Metodo nao permitido']),
        };
    }

    private static function listApplications(PDO $pdo): void
    {
        // 'tree' devolve a visao hierarquica usada na aba Infraestrutura.
        if (($_GET['view'] ?? '') === 'tree') {
            ApiResponse::success((new DtCatalogRepository($pdo))->applicationTree(),
                ['timestamp' => date('c')]);
        }
        ApiResponse::success((new DtServerRepository($pdo))->listApplications(),
            ['timestamp' => date('c')]);
    }

    private static function showApplication(int $id, PDO $pdo): void
    {
        $row = (new DtServerRepository($pdo))->findApplication($id);
        if ($row === null) {
            ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404, ['message' => 'Aplicacao nao encontrada']);
        }
        ApiResponse::success($row, ['timestamp' => date('c')]);
    }

    private static function createApplication(PDO $pdo): void
    {
        try {
            $repo = new DtServerRepository($pdo);
            $id   = $repo->createApplication(dt_body());
            ApiResponse::success($repo->findApplication($id),
                ['timestamp' => date('c'), 'message' => 'Aplicacao cadastrada'], 201);
        } catch (InvalidArgumentException $e) {
            ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 400, ['message' => $e->getMessage()]);
        } catch (RuntimeException $e) {
            ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 409, ['message' => $e->getMessage()]);
        }
    }

    private static function updateApplication(?int $id, PDO $pdo): void
    {
        if ($id === null || $id <= 0) {
            ApiResponse::error(ApiResponse::ERR_ID_REQUIRED, 400, ['message' => 'ID obrigatorio']);
        }
        $repo = new DtServerRepository($pdo);
        if ($repo->findApplication($id) === null) {
            ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404, ['message' => 'Aplicacao nao encontrada']);
        }
        try {
            $repo->updateApplication($id, dt_body());
            ApiResponse::success($repo->findApplication($id),
                ['timestamp' => date('c'), 'message' => 'Aplicacao atualizada']);
        } catch (RuntimeException $e) {
            ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 409, ['message' => $e->getMessage()]);
        }
    }

    private static function deactivateApplication(?int $id, PDO $pdo): void
    {
        if ($id === null || $id <= 0) {
            ApiResponse::error(ApiResponse::ERR_ID_REQUIRED, 400, ['message' => 'ID obrigatorio']);
        }
        $r = (new DtServerRepository($pdo))->deactivateApplication($id);
        if (!$r['ok']) {
            ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404, ['message' => 'Aplicacao nao encontrada']);
        }
        ApiResponse::success($r, [
            'timestamp' => date('c'),
            'message'   => $r['unlinked_connections'] > 0
                ? "Aplicacao desativada. {$r['unlinked_connections']} conexao(oes) desvinculada(s)."
                : 'Aplicacao desativada.',
        ]);
    }

    // ═══════════════════════════════════════════════════════════════
    // VALIDACAO
    // ═══════════════════════════════════════════════════════════════

    private static function validateServer(array $b, bool $isCreate): ?string
    {
        if ($isCreate && (!isset($b['name']) || trim((string)$b['name']) === '')) {
            return 'Nome do servidor e obrigatorio';
        }
        if (isset($b['name']) && mb_strlen((string)$b['name']) > 120) {
            return 'Nome excede 120 caracteres';
        }
        if (isset($b['hostname']) && mb_strlen((string)$b['hostname']) > 190) {
            return 'Hostname excede 190 caracteres';
        }
        if (isset($b['ip']) && trim((string)$b['ip']) !== ''
            && !filter_var(trim((string)$b['ip']), FILTER_VALIDATE_IP)) {
            return 'IP invalido';
        }
        if (isset($b['server_type']) && (string)$b['server_type'] !== ''
            && !in_array($b['server_type'], DtServerRepository::SERVER_TYPES, true)) {
            return 'Tipo invalido. Aceitos: ' . implode(', ', DtServerRepository::SERVER_TYPES);
        }
        return null;
    }
}
