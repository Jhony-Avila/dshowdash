<?php
// DataTables / AdminController - configuracoes de administracao (§38.15)
// @version 1.0.0
// @created 2026-07-20
// @app DataTables
//
// Rotas:
//   GET    /admin                         tudo de uma vez (limites, regras, canais, silencios, cron)
//   POST   /admin/limits                  salvar limite
//   DELETE /admin/limits/{id}             remover limite especifico de conexao
//   POST   /admin/rules                   salvar regra de alerta
//   DELETE /admin/rules/{id}              remover regra
//   PATCH  /admin/channels/{id}           configurar canal (segredo cifrado)
//   POST   /admin/silences                criar janela de silencio
//   POST   /admin/test-webhook            envio de teste no canal webhook
//   DELETE /admin/silences/{id}           encerrar janela
declare(strict_types=1);

final class DtAdminController
{
    public static function route(string $method, array $segments, PDO $pdo): void
    {
        $res = $segments[1] ?? '';
        $id  = isset($segments[2]) && $segments[2] !== '' ? (int)$segments[2] : null;

        if ($res === '') {
            requireMethod(['GET']);
            self::index($pdo);
        }

        $repo = new DtAdminRepository($pdo);

        try {
            match ($res) {
                'limits'   => self::limits($method, $id, $repo),
                'rules'    => self::rules($method, $id, $repo),
                'channels' => self::channels($method, $id, $repo, $pdo),
                'silences' => self::silences($method, $id, $repo),
                'test-webhook' => self::testWebhook($method, $pdo),
                default    => ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404,
                                  ['message' => 'Recurso de administracao desconhecido: ' . $res]),
            };
        } catch (InvalidArgumentException $e) {
            ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 400, ['message' => $e->getMessage()]);
        } catch (RuntimeException $e) {
            ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 409, ['message' => $e->getMessage()]);
        }
    }

    /** GET /admin — painel completo de configuracao. */
    private static function index(PDO $pdo): void
    {
        $repo = new DtAdminRepository($pdo);

        $conns = $pdo->query(
            'SELECT id, name FROM DT_Conexao WHERE is_active = 1 ORDER BY name'
        )->fetchAll(PDO::FETCH_ASSOC);

        ApiResponse::success([
            'limits'      => $repo->listLimits(),
            'rules'       => $repo->listAlertRules(),
            'channels'    => $repo->listChannels(),
            'silences'    => $repo->listSilences(),
            'schedules'   => $repo->schedules(),
            'connections' => $conns,
            'catalog'     => [
                'metrics'     => DtAdminRepository::METRICS,
                'alert_types' => DtAdminRepository::ALERT_TYPES,
            ],
        ], [
            'timestamp' => date('c'),
            'aviso'     => 'Entrega implementada: "app" (interno) e "webhook" (HTTP POST '
                         . 'assinado). E-mail, Slack e WhatsApp ainda NAO enviam — habilitar '
                         . 'armazena a configuracao, mas nada sai por esses canais.',
        ]);
    }

    // ── Limites ─────────────────────────────────────────────────
    private static function limits(string $method, ?int $id, DtAdminRepository $repo): void
    {
        if ($method === 'POST') {
            $b = dt_body();
            $repo->saveLimit(
                !empty($b['connection_id']) ? (int)$b['connection_id'] : null,
                (string)($b['metric_key'] ?? ''),
                isset($b['warn_value']) && $b['warn_value'] !== '' ? (float)$b['warn_value'] : null,
                isset($b['critical_value']) && $b['critical_value'] !== '' ? (float)$b['critical_value'] : null,
                (bool)($b['is_active'] ?? true)
            );
            ApiResponse::success(['limits' => $repo->listLimits()],
                ['timestamp' => date('c'), 'message' => 'Limite salvo. Vale a partir do próximo ciclo.']);
        }
        if ($method === 'DELETE' && $id !== null) {
            if (!$repo->deleteLimit($id)) {
                ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404, ['message' => 'Limite nao encontrado']);
            }
            ApiResponse::success(['limits' => $repo->listLimits()],
                ['timestamp' => date('c'), 'message' => 'Limite removido — volta a valer o padrão global.']);
        }
        ApiResponse::error(ApiResponse::ERR_METHOD_NOT_ALLOWED, 405, ['message' => 'Metodo nao permitido']);
    }

    // ── Regras de alerta ────────────────────────────────────────
    private static function rules(string $method, ?int $id, DtAdminRepository $repo): void
    {
        if ($method === 'POST') {
            $b = dt_body();
            $repo->saveAlertRule(
                !empty($b['connection_id']) ? (int)$b['connection_id'] : null,
                (string)($b['alert_type'] ?? ''),
                $b
            );
            ApiResponse::success(['rules' => $repo->listAlertRules()],
                ['timestamp' => date('c'), 'message' => 'Regra salva.']);
        }
        if ($method === 'DELETE' && $id !== null) {
            if (!$repo->deleteAlertRule($id)) {
                ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404, ['message' => 'Regra nao encontrada']);
            }
            ApiResponse::success(['rules' => $repo->listAlertRules()],
                ['timestamp' => date('c'), 'message' => 'Regra removida — volta a valer o padrão do tipo.']);
        }
        ApiResponse::error(ApiResponse::ERR_METHOD_NOT_ALLOWED, 405, ['message' => 'Metodo nao permitido']);
    }

    // ── Canais ──────────────────────────────────────────────────
    private static function channels(string $method, ?int $id, DtAdminRepository $repo, PDO $pdo): void
    {
        if (in_array($method, ['PATCH', 'PUT'], true) && $id !== null) {
            $b = dt_body();
            // Chave ausente = manter segredo; '' = remover; texto = trocar.
            $secret = array_key_exists('secret', $b) ? (string)$b['secret'] : null;
            $repo->saveChannel($id, $b, $secret);

            $chans = $repo->listChannels();
            $this_ = null;
            foreach ($chans as $c) {
                if ($c['id'] === $id) {
                    $this_ = $c;
                }
            }

            $msg = 'Canal atualizado.';
            if ($this_ !== null && $this_['is_enabled'] && !$this_['delivery_implemented']) {
                $msg .= ' ATENCAO: a entrega para este canal ainda nao esta implementada — '
                      . 'a configuracao foi guardada, mas nada sera enviado por ele.';
            }
            ApiResponse::success(['channels' => $chans], ['timestamp' => date('c'), 'message' => $msg]);
        }
        ApiResponse::error(ApiResponse::ERR_METHOD_NOT_ALLOWED, 405, ['message' => 'Metodo nao permitido']);
    }

    /** POST /admin/test-webhook — valida a configuracao sem esperar incidente. */
    private static function testWebhook(string $method, PDO $pdo): void
    {
        requireMethod(['POST']);
        $r = (new DtAlertService($pdo))->testWebhook();
        ApiResponse::success($r, [
            'timestamp' => date('c'),
            'message'   => $r['ok']
                ? "Webhook entregue (HTTP {$r['status']}) em {$r['ms']}ms."
                : 'Falha na entrega: ' . (string)($r['error'] ?? 'erro desconhecido'),
        ]);
    }

    // ── Silencios ───────────────────────────────────────────────
    private static function silences(string $method, ?int $id, DtAdminRepository $repo): void
    {
        if ($method === 'POST') {
            $newId = $repo->createSilence(dt_body(), (string)(AuthHelpers::getCurrentUserId() ?: ''));
            ApiResponse::success(['id' => $newId, 'silences' => $repo->listSilences()], [
                'timestamp' => date('c'),
                'message'   => 'Janela criada. O alerta continua sendo REGISTRADO internamente; '
                             . 'apenas o envio externo fica suspenso.',
            ], 201);
        }
        if ($method === 'DELETE' && $id !== null) {
            if (!$repo->deleteSilence($id)) {
                ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404, ['message' => 'Janela nao encontrada']);
            }
            ApiResponse::success(['silences' => $repo->listSilences()],
                ['timestamp' => date('c'), 'message' => 'Janela encerrada.']);
        }
        ApiResponse::error(ApiResponse::ERR_METHOD_NOT_ALLOWED, 405, ['message' => 'Metodo nao permitido']);
    }
}
