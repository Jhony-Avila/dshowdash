<?php
// Google Calendar / AccountController - contas Google conectadas (§54, §55)
// @version 2.0.0  @created 2026-07-29  @updated 2026-07-30
//
// Fase 4: o fluxo OAuth deixou de ser 503 e passou a funcionar de verdade. A
// mecanica toda mora em GcalAuthService; aqui so ficam entrada, saida e as
// decisoes de HTTP.
declare(strict_types=1);

final class GcalAccountController
{
    /** GET /accounts */
    public static function listar(GcalProvider $p): void
    {
        $itens = $p->contas();
        ApiResponse::success(
            ['contas' => $itens, 'golive' => GcalGoLive::resumo()],
            ['total' => count($itens)]
        );
    }

    /**
     * POST /accounts/connect — inicia o OAuth e devolve a URL de consentimento.
     *
     * No mock nao existe consentimento a pedir. Devolver uma URL falsa levaria o
     * usuario para fora do app; devolver 501 com motivo mantem o botao honesto e
     * a tela de Contas utilizavel.
     */
    public static function conectar(GcalProvider $p): void
    {
        if (gcal_is_mock()) {
            ApiResponse::error(ApiResponse::ERR_INVALID_ACTION, 501, [
                'message' => 'Ambiente de demonstração: conectar conta real exige GCAL_PROVIDER=google '
                           . 'e as credenciais do Google Cloud.',
                'golive'  => GcalGoLive::resumo(),
            ]);
        }

        try {
            $repo = new GcalRepository();
            $url = (new GcalAuthService($repo))->iniciar(
                AuthHelpers::getCurrentUserId(),
                self::destinoSeguro(gcal_body()['redirect'] ?? null)
            );
        } catch (\Throwable $e) {
            // A pendencia vai junto: quem clicou em "Conectar" e exatamente
            // quem esta tentando ligar o modulo, e precisa saber o que falta
            // sem trocar de tela.
            ApiResponse::error(ApiResponse::ERR_DATABASE_ERROR, 503, [
                'message'    => $e->getMessage(),
                'pendencias' => GcalGoLive::pendencias(),
            ]);
        }

        ApiResponse::success(['authorize_url' => $url]);
    }

    /**
     * GET /accounts/callback — o Google devolve o navegador para ca.
     *
     * Sempre REDIRECIONA, nunca responde JSON: quem chega aqui e uma janela de
     * navegador vinda do Google, e JSON cru na tela e beco sem saida. O erro vai
     * no query string para a tela de Contas explicar em portugues.
     *
     * Chamado FORA do gate de CSRF: o redirect nao carrega token. A protecao e o
     * `state`, unico, com validade curta e consumido uma unica vez.
     */
    public static function callback(): void
    {
        $base = '/#/panel-google-calendar/contas';
        $code  = isset($_GET['code'])  && is_string($_GET['code'])  ? $_GET['code']  : '';
        $state = isset($_GET['state']) && is_string($_GET['state']) ? $_GET['state'] : '';

        // O usuario pode ter clicado em "Cancelar" na tela do Google. Isso nao e
        // falha do sistema e nao deve parecer uma.
        if (isset($_GET['error'])) {
            self::voltar($base, ['gcal_auth' => 'cancelado',
                                 'reason' => (string)$_GET['error']]);
        }
        if ($code === '' || $state === '') {
            self::voltar($base, ['gcal_auth' => 'error', 'reason' => 'parametros_ausentes']);
        }

        try {
            $repo = new GcalRepository();
            $auth = new GcalAuthService($repo);
            $r = $auth->concluir($code, $state);

            // Primeira carga JA aqui: sem isso a tela abre vazia depois de
            // conectar e o usuario conclui que nao funcionou. A sincronizacao
            // completa continua sendo do cron; esta e so a dos calendarios,
            // que e rapida.
            try {
                (new GcalSyncService($repo, $auth))->sincronizarCalendarios($r['account_id']);
            } catch (\Throwable $e) {
                // Conectou; so a descoberta de calendarios falhou. Nao desfaz a
                // conexao por causa disso — a tela de Sincronizacao resolve.
                error_log('[gcal] descoberta de calendarios pos-conexao falhou: ' . $e->getMessage());
            }

            self::voltar($r['redirect'] ?: $base,
                ['gcal_auth' => 'ok', 'email' => $r['email']]);
        } catch (\Throwable $e) {
            // GcalApiException carrega o motivo curto do Google (ex.: invalid_request)
            // e o HTTP: sem eles o log diz so "nao foi possivel ler o perfil" e a
            // causa (escopo, token, rede) fica invisivel. Nunca o token nem o corpo.
            $extra = $e instanceof GcalApiException
                ? sprintf(' (google=%s http=%d)', $e->motivo, $e->status) : '';
            error_log('[gcal] callback OAuth falhou: ' . $e->getMessage() . $extra);
            self::voltar($base, ['gcal_auth' => 'error', 'reason' => 'falha',
                                 'detalhe' => mb_substr($e->getMessage() . $extra, 0, 180)]);
        }
    }

    /** DELETE /accounts/{id} — desconecta e revoga. */
    public static function desconectar(GcalProvider $p, string $accountId): void
    {
        if (gcal_is_mock()) {
            ApiResponse::error(ApiResponse::ERR_INVALID_ACTION, 501, [
                'message' => 'Ambiente de demonstração: não há conta real para desconectar.',
            ]);
        }
        if (!ctype_digit($accountId)) {
            ApiResponse::error(ApiResponse::ERR_VALIDATION, 400, ['message' => 'Conta inválida.']);
        }

        $userId = AuthHelpers::getCurrentUserId();
        $repo = new GcalRepository();

        // Dono confirmado ANTES de revogar: sem isso um id na URL desconectaria
        // a conta de outra pessoa. `listarContas` ja filtra por user_id.
        $minha = false;
        foreach ($repo->listarContas($userId) as $c) {
            if ((int)$c['id'] === (int)$accountId) { $minha = true; break; }
        }
        if (!$minha) {
            ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404, ['message' => 'Conta não encontrada.']);
        }

        (new GcalAuthService($repo))->desconectar($userId, (int)$accountId);
        ApiResponse::success(['desconectada' => (int)$accountId]);
    }

    // ── Auxiliares ───────────────────────────────────────────────────

    /**
     * So aceita destino interno.
     *
     * `redirect` vem do cliente e termina num header Location. Sem esta trava, o
     * modulo viraria redirecionador aberto: `//evil.com` e `https://evil.com`
     * sairiam do dominio, e um link de "conectar sua agenda" e justamente o tipo
     * de coisa em que a pessoa clica sem olhar.
     */
    private static function destinoSeguro(mixed $v): ?string
    {
        if (!is_string($v) || $v === '') return null;
        if ($v[0] !== '/' || str_starts_with($v, '//')) return null;
        if (str_contains($v, "\r") || str_contains($v, "\n")) return null;
        return mb_substr($v, 0, 300);
    }

    /** @return never */
    private static function voltar(string $base, array $params): void
    {
        // O destino e uma rota de hash (`/#/...`); o separador correto e `?`
        // DENTRO do fragmento, senao o React Router nao enxerga o parametro.
        $sep = str_contains($base, '?') ? '&' : '?';
        header('Location: ' . $base . $sep . http_build_query($params), true, 302);
        exit;
    }
}
