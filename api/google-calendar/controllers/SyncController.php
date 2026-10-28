<?php
// Google Calendar / SyncController - estado e disparo da sincronizacao (§51)
// @version 2.0.0  @created 2026-07-29  @updated 2026-07-30
declare(strict_types=1);

final class GcalSyncController
{
    /** GET /sync */
    public static function listar(GcalProvider $p): void
    {
        $itens = $p->sincronizacao();
        // `pending` é fila, não falha — contá-lo como problema pintaria de
        // vermelho um calendário recém-descoberto que está apenas na vez dele.
        $comErro = count(array_filter($itens, static fn($s) =>
            !in_array($s['status'] ?? '', ['ok', 'pending'], true)));

        ApiResponse::success(
            ['calendarios' => $itens, 'com_problema' => $comErro] + self::infraestrutura(),
            ['total' => count($itens)]
        );
    }

    /**
     * Estado da fila e dos canais push (Fase 5).
     *
     * Vai junto do GET /sync porque responde a mesma pergunta do operador: "a
     * sincronização está viva?". Em mock devolve vazio — inventar fila aqui
     * faria a tela mentir sobre uma infraestrutura que não está rodando.
     */
    private static function infraestrutura(): array
    {
        if (gcal_is_mock()) {
            return ['fila' => [], 'canais' => [], 'push_configurado' => false];
        }
        try {
            $repo = new GcalRepository();
            $userId = AuthHelpers::getCurrentUserId();
            return [
                'fila'   => $repo->resumoFila($userId),
                'canais' => array_map(static fn($c) => [
                    // O channel_id não precisa ir inteiro ao navegador; o
                    // prefixo basta para correlacionar com o log.
                    'channel_id'  => substr((string)$c['channel_id'], 0, 8) . '…',
                    'calendar_id' => $c['calendar_id'],
                    'expiration'  => str_replace(' ', 'T', (string)$c['expiration']) . 'Z',
                    'created_at'  => str_replace(' ', 'T', (string)$c['created_at']) . 'Z',
                ], $repo->canaisDoUsuario($userId)),
                'push_configurado' => GcalWatchService::configurado(),
            ];
        } catch (\Throwable $e) {
            error_log('[gcal] resumo de fila indisponível: ' . $e->getMessage());
            return ['fila' => [], 'canais' => [], 'push_configurado' => false];
        }
    }

    /**
     * POST /sync/watch — (re)abre os canais push das contas do usuário.
     *
     * Existe como botão porque canal expira, entrega falha e o Google desiste
     * em silêncio. Sem uma forma manual de religar, a única saída seria esperar
     * o cron — ou reconectar a conta inteira.
     */
    public static function religarCanais(GcalProvider $p): void
    {
        if (gcal_is_mock()) {
            ApiResponse::error(ApiResponse::ERR_INVALID_ACTION, 501, [
                'message' => 'Ambiente de demonstração: não há canais reais a abrir.',
            ]);
        }
        if (!GcalWatchService::configurado()) {
            ApiResponse::error(ApiResponse::ERR_DATABASE_ERROR, 503, [
                'message' => 'Notificações push exigem uma URL https pública (GCAL_WEBHOOK_URL).',
            ]);
        }

        try {
            $repo = new GcalRepository();
            $watch = new GcalWatchService($repo, new GcalAuthService($repo));
            $userId = AuthHelpers::getCurrentUserId();

            $total = ['abertos' => 0, 'falhas' => 0, 'contas' => 0];
            foreach ($repo->listarContas($userId) as $c) {
                if (empty($c['is_active'])) continue;
                $total['contas']++;
                $r = $watch->abrirDaConta((int)$c['id']);
                $total['abertos'] += $r['abertos'];
                $total['falhas']  += $r['falhas'];
            }
        } catch (\Throwable $e) {
            ApiResponse::error(ApiResponse::ERR_DATABASE_ERROR, 503, ['message' => $e->getMessage()]);
        }

        ApiResponse::success($total);
    }

    /**
     * POST /sync/run — dispara a sincronizacao das contas do usuario.
     *
     * SINCRONA de proposito nesta fase. A fila (§50, Fase 5) ainda nao existe, e
     * um "202 aceito" sem fila atras e promessa que ninguem vai cumprir. Como a
     * janela e limitada (90 dias atras, 365 a frente), a chamada termina em
     * segundos para uma agenda normal.
     *
     * Corpo opcional: {"account_id": 3, "completa": true}
     */
    public static function executar(GcalProvider $p): void
    {
        if (gcal_is_mock()) {
            // No mock nao ha o que sincronizar. Sucesso falso aqui e o tipo de
            // coisa que faz o operador confiar num pipeline que nao existe.
            ApiResponse::success([
                'disparado' => true, 'simulado' => true,
                'message' => 'Ambiente de demonstração: nenhuma sincronização real foi executada.',
            ], null, 202);
        }

        $body = gcal_body();
        $completa = !empty($body['completa']);
        $userId = AuthHelpers::getCurrentUserId();

        try {
            $repo = new GcalRepository();
            $svc  = new GcalSyncService($repo, new GcalAuthService($repo));

            // So as contas DESTE usuario entram na lista — o filtro e o que
            // impede um `account_id` no corpo de sincronizar agenda alheia.
            $minhas = [];
            foreach ($repo->listarContas($userId) as $c) {
                if (!empty($c['is_active'])) $minhas[(int)$c['id']] = $c['email'];
            }
            if (isset($body['account_id'])) {
                $alvo = (int)$body['account_id'];
                if (!isset($minhas[$alvo])) {
                    ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404,
                        ['message' => 'Conta não encontrada.']);
                }
                $minhas = [$alvo => $minhas[$alvo]];
            }
            if (!$minhas) {
                ApiResponse::error(ApiResponse::ERR_INVALID_ACTION, 409, [
                    'message'    => 'Nenhuma conta Google conectada para sincronizar.',
                    'pendencias' => GcalGoLive::pendencias(),
                ]);
            }

            $resultados = [];
            foreach ($minhas as $id => $email) {
                try {
                    $resultados[] = ['account_id' => $id, 'email' => $email, 'ok' => true]
                                  + $svc->sincronizarConta($id, $completa);
                } catch (\Throwable $e) {
                    // Uma conta com token revogado nao pode derrubar as outras.
                    $resultados[] = ['account_id' => $id, 'email' => $email, 'ok' => false,
                                     'erro' => mb_substr($e->getMessage(), 0, 180)];
                }
            }
        } catch (\Throwable $e) {
            ApiResponse::error(ApiResponse::ERR_DATABASE_ERROR, 503, [
                'message'    => $e->getMessage(),
                'pendencias' => GcalGoLive::pendencias(),
            ]);
        }

        ApiResponse::success([
            'disparado' => true, 'simulado' => false, 'completa' => $completa,
            'contas'    => $resultados,
            'com_falha' => count(array_filter($resultados, static fn($r) => empty($r['ok']))),
        ], ['total' => count($resultados)]);
    }
}
