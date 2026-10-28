<?php
// DataTables / ConnectionController - CRUD de conexoes + acoes sob demanda
// @version 1.0.0
// @created 2026-07-20
// @app DataTables
//
// SEGURANCA (§30.1): a senha entra por 'password' no body e sai cifrada para o
// banco. NUNCA e devolvida - nem mascarada com o valor real. O front so recebe
// o booleano has_password.
declare(strict_types=1);

final class DtConnectionController
{
    /** Tipos de fonte aceitos no cadastro (§6). */
    private const SOURCE_TYPES = ['mysql', 'api', 'file', 'queue', 'cache', 'integration'];

    public static function route(string $method, array $segments, PDO $pdo): void
    {
        $id     = isset($segments[1]) && $segments[1] !== '' ? (int)$segments[1] : null;
        $action = $segments[2] ?? null;

        // Subacoes: /connections/{id}/check | /inventory | /health
        if ($id !== null && $action !== null) {
            match ($action) {
                'check'     => self::check($id, $pdo),
                'inventory' => self::inventory($id, $pdo),
                'health'    => self::health($id, $pdo),
                default     => ApiResponse::error(ApiResponse::ERR_INVALID_ACTION, 404,
                                   ['message' => 'Acao desconhecida: ' . $action]),
            };
            return;
        }

        match ($method) {
            'GET'    => $id !== null ? self::show($id, $pdo) : self::index($pdo),
            'POST'   => self::create($pdo),
            'PATCH', 'PUT' => self::update($id, $pdo),
            'DELETE' => self::destroy($id, $pdo),
            default  => ApiResponse::error(ApiResponse::ERR_METHOD_NOT_ALLOWED, 405,
                            ['message' => 'Metodo nao permitido']),
        };
    }

    // ═══════════════════════════════════════════════════════════════
    // LEITURA
    // ═══════════════════════════════════════════════════════════════

    private static function index(PDO $pdo): void
    {
        $f    = dt_query(['environment_id', 'server_id', 'status', 'source_type', 'is_active']);
        $rows = (new DtConnectionRepository($pdo))->listAll($f);
        ApiResponse::success($rows, ['timestamp' => date('c'), 'total' => count($rows)]);
    }

    private static function show(int $id, PDO $pdo): void
    {
        $row = (new DtConnectionRepository($pdo))->find($id);
        if ($row === null) {
            ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404, ['message' => 'Conexao nao encontrada']);
        }
        ApiResponse::success($row, ['timestamp' => date('c')]);
    }

    /** GET /connections/{id}/health - card de saude (§12) */
    private static function health(int $id, PDO $pdo): void
    {
        requireMethod(['GET']);

        $repo = new DtConnectionRepository($pdo);
        if ($repo->find($id) === null) {
            ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404, ['message' => 'Conexao nao encontrada']);
        }

        $sr = new DtStatusRepository($pdo);
        ApiResponse::success([
            'connection'   => $repo->find($id),
            'status'       => $sr->currentFor($id),
            'outages_30d'  => $sr->outageSummary($id, 30),
        ], ['timestamp' => date('c')]);
    }

    // ═══════════════════════════════════════════════════════════════
    // ESCRITA
    // ═══════════════════════════════════════════════════════════════

    private static function create(PDO $pdo): void
    {
        $body = dt_body();
        $err  = self::validate($body, true);
        if ($err !== null) {
            ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 400, ['message' => $err]);
        }

        $password = array_key_exists('password', $body) ? (string)$body['password'] : null;
        $repo     = new DtConnectionRepository($pdo);
        $id       = $repo->create($body, $password, (string)(AuthHelpers::getCurrentUserId() ?? ''));

        // Verificacao imediata apos cadastro (§14): o operador precisa saber
        // agora se a credencial funciona, sem esperar o proximo ciclo de 5 min.
        $checkResult = null;
        try {
            $checkResult = (new DtHealthCheckService($pdo))->check($repo->findForConnect($id));
        } catch (Throwable $e) {
            error_log('[datatables] check pos-cadastro falhou: ' . $e->getMessage());
        }

        ApiResponse::success([
            'connection' => $repo->find($id),
            'check'      => $checkResult,
        ], ['timestamp' => date('c'), 'message' => 'Conexao cadastrada'], 201);
    }

    private static function update(?int $id, PDO $pdo): void
    {
        if ($id === null || $id <= 0) {
            ApiResponse::error(ApiResponse::ERR_ID_REQUIRED, 400, ['message' => 'ID obrigatorio']);
        }

        $repo = new DtConnectionRepository($pdo);
        if ($repo->find($id) === null) {
            ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404, ['message' => 'Conexao nao encontrada']);
        }

        $body = dt_body();
        $err  = self::validate($body, false);
        if ($err !== null) {
            ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 400, ['message' => $err]);
        }

        // Distincao essencial: chave ausente = manter senha; chave presente
        // com '' = remover. O front nunca reenvia a senha existente.
        $password = array_key_exists('password', $body) ? (string)$body['password'] : null;
        $repo->update($id, $body, $password);

        // Credencial trocada exige reverificacao imediata (§14).
        $checkResult = null;
        if ($password !== null) {
            try {
                $checkResult = (new DtHealthCheckService($pdo))->check($repo->findForConnect($id));
            } catch (Throwable $e) {
                error_log('[datatables] check pos-troca-credencial falhou: ' . $e->getMessage());
            }
        }

        ApiResponse::success([
            'connection' => $repo->find($id),
            'check'      => $checkResult,
        ], ['timestamp' => date('c'), 'message' => 'Conexao atualizada']);
    }

    /** Desativa em vez de apagar (§7.2 - historico preservado). */
    private static function destroy(?int $id, PDO $pdo): void
    {
        if ($id === null || $id <= 0) {
            ApiResponse::error(ApiResponse::ERR_ID_REQUIRED, 400, ['message' => 'ID obrigatorio']);
        }

        $ok = (new DtConnectionRepository($pdo))->deactivate($id);
        if (!$ok) {
            ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404, ['message' => 'Conexao nao encontrada']);
        }

        ApiResponse::success(['id' => $id, 'deactivated' => true], [
            'timestamp' => date('c'),
            'message'   => 'Conexao desativada. O catalogo historico foi preservado.',
        ]);
    }

    // ═══════════════════════════════════════════════════════════════
    // ACOES
    // ═══════════════════════════════════════════════════════════════

    /** POST /connections/{id}/check (§14) */
    private static function check(int $id, PDO $pdo): void
    {
        requireMethod(['POST']);

        $repo = new DtConnectionRepository($pdo);
        $conn = $repo->findForConnect($id);
        if ($conn === null) {
            ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404, ['message' => 'Conexao nao encontrada']);
        }

        $res = (new DtHealthCheckService($pdo))->check($conn);
        ApiResponse::success(['check' => $res, 'connection' => $repo->find($id)],
            ['timestamp' => date('c')]);
    }

    /** POST /connections/{id}/inventory (§7) */
    private static function inventory(int $id, PDO $pdo): void
    {
        requireMethod(['POST']);

        $repo = new DtConnectionRepository($pdo);
        $conn = $repo->findForConnect($id);
        if ($conn === null) {
            ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404, ['message' => 'Conexao nao encontrada']);
        }
        if (($conn['source_type'] ?? 'mysql') !== 'mysql') {
            ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 400, [
                'message' => 'Inventario estrutural disponivel apenas para fontes MySQL',
            ]);
        }

        // Rotina sincrona: pode levar segundos em schema grande. O front deve
        // chamar com timeout generoso; o cron cobre o caso periodico.
        @set_time_limit(120);
        $res = (new DtInventoryService($pdo))->runForConnection($conn);

        ApiResponse::success(['inventory' => $res, 'connection' => $repo->find($id)],
            ['timestamp' => date('c')]);
    }

    // ═══════════════════════════════════════════════════════════════
    // VALIDACAO
    // ═══════════════════════════════════════════════════════════════

    /** @return string|null Mensagem de erro, ou null se valido. */
    private static function validate(array $b, bool $isCreate): ?string
    {
        if ($isCreate) {
            foreach (['name', 'host'] as $req) {
                if (!isset($b[$req]) || trim((string)$b[$req]) === '') {
                    return "Campo obrigatorio ausente: {$req}";
                }
            }
        }

        if (isset($b['source_type']) && !in_array($b['source_type'], self::SOURCE_TYPES, true)) {
            return 'source_type invalido. Aceitos: ' . implode(', ', self::SOURCE_TYPES);
        }

        if (isset($b['port'])) {
            $p = (int)$b['port'];
            if ($p < 1 || $p > 65535) {
                return 'Porta fora do intervalo 1-65535';
            }
        }

        if (isset($b['name']) && mb_strlen((string)$b['name']) > 120) {
            return 'Nome excede 120 caracteres';
        }
        if (isset($b['host']) && mb_strlen((string)$b['host']) > 190) {
            return 'Host excede 190 caracteres';
        }

        return null;
    }
}
