<?php
// Google Calendar / GcalAuthService - fluxo OAuth completo (§54)
// @module google-calendar.auth
// @version 1.0.0
// @created 2026-07-30
// @app Google Calendar
//
// Authorization Code + PKCE S256. O `state` e o `code_verifier` vivem no banco
// (cifrado), nao na sessao: o callback pode chegar em outro processo PHP-FPM, e
// sessao nao atravessa isso de forma confiavel.
declare(strict_types=1);

final class GcalAuthService
{
    public function __construct(
        private GcalRepository $repo,
        /** Injetavel para teste: no runtime e o transporte HTTP real. */
        private ?GcalTransport $transporte = null
    ) {}

    /** Passo 1: gera state + PKCE, persiste e devolve a URL de consentimento. */
    public function iniciar(int $userId, ?string $redirectDepois = null): string
    {
        if (!GoogleOAuth::isConfigured()) {
            throw new RuntimeException('OAuth do Google Calendar não configurado no .env.');
        }
        if (!GcalCrypto::isConfigured()) {
            throw new RuntimeException('GCAL_CRYPTO_KEY ausente — sem ela o token não pode ser guardado.');
        }

        $state    = bin2hex(random_bytes(24));
        $verifier = GoogleOAuth::newCodeVerifier();
        $this->repo->criarState($userId, $state, $verifier, $redirectDepois);
        $this->repo->limparStatesVencidos();

        return GoogleOAuth::authorizeUrl($state, GoogleOAuth::codeChallenge($verifier));
    }

    /**
     * Passo 2: o Google devolve `code` + `state`.
     *
     * @return array{account_id:int,email:string,redirect:?string}
     *
     * Ordem importa: consumir o state ANTES de trocar o código. Se a troca
     * falhar, o state já foi queimado — e tem de ser mesmo, senão um `code`
     * roubado poderia ser retentado com o mesmo state.
     */
    public function concluir(string $code, string $state): array
    {
        $st = $this->repo->consumirState($state);
        if ($st === null) {
            throw new RuntimeException('Autorização expirada ou já utilizada. Tente conectar de novo.');
        }

        $tok = GoogleOAuth::exchangeCode($code, $st['verifier']);

        // Sem refresh_token não há sincronização em background: a conta
        // reconecta a cada hora e o sintoma só aparece no dia seguinte. Isso é
        // erro de configuração (falta access_type=offline / prompt=consent),
        // então falha agora, alto e claro.
        if (empty($tok['refresh_token'])) {
            throw new RuntimeException(
                'O Google não devolveu refresh_token. Revogue o acesso do app na conta Google e '
                . 'conecte novamente para forçar um novo consentimento.');
        }

        $cliente = new GoogleCalendarClient(
            $this->transporte ?? new GcalTransportHttp(),
            (string)$tok['access_token']);
        $perfil = $cliente->perfil();
        if ($perfil['google_account_id'] === '' || $perfil['email'] === '') {
            throw new RuntimeException('Não foi possível identificar a conta Google.');
        }

        return $this->repo->transacao(function (GcalRepository $r) use ($perfil, $tok, $st): array {
            $accountId = $r->salvarConta($st['user_id'], $perfil + [
                'scopes' => (string)($tok['scope'] ?? GoogleOAuth::scopes()),
            ]);
            $r->salvarTokens($accountId, $tok);
            $r->auditar($st['user_id'], 'connect', [
                'account_id' => $accountId,
                'after' => ['email' => $perfil['email'], 'scopes' => $tok['scope'] ?? null],
            ]);
            return ['account_id' => $accountId, 'email' => $perfil['email'],
                    'redirect' => $st['redirect']];
        });
    }

    /**
     * Access token válido para a conta, renovando quando preciso.
     *
     * É o único ponto que sabe renovar; o cliente da API recebe isto como
     * callback e não precisa conhecer o banco.
     */
    public function tokenValido(int $accountId): string
    {
        $t = $this->repo->lerTokens($accountId);
        if ($t === null) {
            throw new RuntimeException('Conta sem token. Reconecte a conta Google.');
        }
        if (!$this->repo->tokenVencido($accountId)) {
            return $t['access'];
        }
        if (empty($t['refresh'])) {
            $this->repo->marcarErroConta($accountId, 'no_refresh_token',
                'Token expirado e sem refresh. Reconecte a conta.');
            throw new RuntimeException('Sessão do Google expirada. Reconecte a conta.');
        }

        try {
            $novo = GoogleOAuth::refresh($t['refresh']);
        } catch (\Throwable $e) {
            // `invalid_grant` = o usuário revogou ou a senha mudou. Marcar a
            // conta é o que faz a UI pedir reconexão em vez de repetir para
            // sempre uma chamada que nunca vai funcionar.
            $this->repo->marcarErroConta($accountId, 'invalid_grant', $e->getMessage());
            throw new RuntimeException('O acesso ao Google foi revogado. Reconecte a conta.');
        }

        $this->repo->salvarTokens($accountId, $novo);
        return (string)$novo['access_token'];
    }

    /** Cliente pronto, já com renovação automática ligada. */
    public function clientePara(int $accountId): GoogleCalendarClient
    {
        return new GoogleCalendarClient(
            $this->transporte ?? new GcalTransportHttp(),
            $this->tokenValido($accountId),
            fn() => $this->tokenValido($accountId)
        );
    }

    /** Desconecta: revoga no Google (melhor esforço) e limpa localmente. */
    public function desconectar(int $userId, int $accountId): void
    {
        $t = $this->repo->lerTokens($accountId);
        if ($t !== null) {
            // Se a revogação falhar, seguimos: o token local tem de sumir de
            // qualquer forma. Deixar credencial guardada porque a rede caiu
            // seria o pior dos dois mundos.
            try { GoogleOAuth::revoke($t['refresh'] ?? $t['access']); }
            catch (\Throwable $e) { error_log('[gcal] revoke falhou: ' . $e->getMessage()); }
        }
        $this->repo->desconectar($accountId);
        $this->repo->auditar($userId, 'disconnect', ['account_id' => $accountId]);
    }
}
