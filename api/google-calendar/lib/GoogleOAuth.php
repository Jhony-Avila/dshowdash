<?php
// Google Calendar / GoogleOAuth - Google Identity (OAuth2 Authorization Code + PKCE)
// @module google-calendar.oauth
// @version 1.0.0
// @created 2026-07-29
// @app Google Calendar
//
// Molde: api/outlook/lib/GraphOAuth.php. Feito a mao sobre cURL, sem SDK — o
// projeto nao tem composer nem vendor/ (achado §5.3 da Fase 0), e o Outlook ja
// provou que o fluxo inteiro cabe em ~200 linhas.
//
// PKCE: code_verifier (43-128 chars) + code_challenge = base64url(sha256(verifier)).
// O `state` e gerado/armazenado pelo AuthService e consumido UMA vez.
//
// ESCOPOS (§31): pedir o MENOR que serve a fase. O escopo integral
// (.../auth/calendar) da muito mais acesso do que ler uma agenda e so deve
// aparecer se um fluxo administrativo provar necessidade.
//
// Identidade (openid email profile): o callback le QUEM conectou em
// https://www.googleapis.com/oauth2/v3/userinfo (GoogleCalendarClient::perfil —
// sub/email/name/hd). Esse endpoint e do OpenID Connect e NAO aceita um token
// que so tem escopos do Calendar: responde 401 invalid_request "Invalid
// Credentials" e a conexao morre DEPOIS da troca do code (go-live 28/10/2026:
// "[gcal] callback OAuth falhou: Nao foi possivel ler o perfil da conta
// Google"). O molde (api/outlook GraphOAuth) ja pedia `openid profile email`.
// Sao escopos nao-sensiveis; em app INTERNO do Workspace nao exigem revisao.
//
// Fase 4 (leitura):  openid email profile + calendar.readonly + calendar.freebusy
// Fase 6 (escrita):  + calendar.events
//
// Nada aqui e chamado enquanto GCAL_PROVIDER=mock.
declare(strict_types=1);

final class GoogleOAuthException extends RuntimeException {}

final class GoogleOAuth
{
    private const AUTH_URL  = 'https://accounts.google.com/o/oauth2/v2/auth';
    private const TOKEN_URL = 'https://oauth2.googleapis.com/token';
    private const REVOKE_URL = 'https://oauth2.googleapis.com/revoke';

    /** Escopos por fase. A fase corrente vem do .env (GCAL_OAUTH_STAGE). */
    /** Escopos de identidade exigidos pelo userinfo (perfil de quem conectou). */
    public const ESCOPOS_IDENTIDADE = 'openid email profile';

    private const ESCOPOS = [
        'read'  => self::ESCOPOS_IDENTIDADE . ' https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.freebusy',
        'write' => self::ESCOPOS_IDENTIDADE . ' https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.freebusy https://www.googleapis.com/auth/calendar.events',
    ];

    /**
     * Costura de TESTE para o token endpoint. Em producao e sempre null e o
     * fluxo passa por cURL; so os scripts de `scripts/gcal-*.php` a preenchem.
     *
     * POR QUE EXISTE: sem ela, a troca de `code` por token so seria executada
     * pela primeira vez com as credenciais reais do dono, em producao. Ou seja:
     * o unico teste do caminho critico seria o go-live. Com a costura, o fluxo
     * inteiro (state, PKCE, refresh ausente, persistencia cifrada) e provado
     * antes de existir credencial.
     *
     * @var null|callable(array):array
     */
    public static $postDeTeste = null;

    private static function env(string $key, ?string $default = null): ?string
    {
        $v = getenv($key);
        if ($v === false || $v === '') {
            $v = $_ENV[$key] ?? null;
        }
        $v = is_string($v) ? trim($v) : null;
        return ($v === null || $v === '') ? $default : $v;
    }

    public static function clientId(): string
    {
        $v = self::env('GOOGLE_CALENDAR_OAUTH_CLIENT_ID');
        if ($v === null) {
            throw new GoogleOAuthException('GOOGLE_CALENDAR_OAUTH_CLIENT_ID ausente no .env');
        }
        return $v;
    }

    private static function clientSecret(): string
    {
        $v = self::env('GOOGLE_CALENDAR_OAUTH_CLIENT_SECRET');
        if ($v === null) {
            throw new GoogleOAuthException('GOOGLE_CALENDAR_OAUTH_CLIENT_SECRET ausente no .env');
        }
        return $v;
    }

    public static function redirectUri(): string
    {
        return self::env('GOOGLE_CALENDAR_REDIRECT_URI',
            'https://dshowdash.com.br/api/google-calendar/accounts/callback');
    }

    /** Escopo da fase corrente; default = somente leitura (§31.1). */
    public static function scopes(): string
    {
        $stage = strtolower((string)self::env('GCAL_OAUTH_STAGE', 'read'));
        return self::ESCOPOS[$stage] ?? self::ESCOPOS['read'];
    }

    public static function isConfigured(): bool
    {
        return self::env('GOOGLE_CALENDAR_OAUTH_CLIENT_ID') !== null
            && self::env('GOOGLE_CALENDAR_OAUTH_CLIENT_SECRET') !== null;
    }

    // ── PKCE ──────────────────────────────────────────────────────────
    /** Gera um code_verifier PKCE (base64url, 43-128 chars). */
    public static function newCodeVerifier(): string
    {
        return self::b64url(random_bytes(48));   // 64 chars base64url
    }

    public static function codeChallenge(string $verifier): string
    {
        return self::b64url(hash('sha256', $verifier, true));
    }

    private static function b64url(string $bin): string
    {
        return rtrim(strtr(base64_encode($bin), '+/', '-_'), '=');
    }

    /**
     * URL de consentimento.
     *
     * `access_type=offline` + `prompt=consent` sao o que faz o Google devolver
     * refresh_token. Sem eles a conta reconecta a cada hora e a sincronizacao
     * em background (§49) simplesmente para — e o sintoma aparece so no dia
     * seguinte, o que torna o erro caro de diagnosticar.
     */
    public static function authorizeUrl(string $state, string $codeChallenge): string
    {
        $q = [
            'client_id'             => self::clientId(),
            'redirect_uri'          => self::redirectUri(),
            'response_type'         => 'code',
            'scope'                 => self::scopes(),
            'state'                 => $state,
            'code_challenge'        => $codeChallenge,
            'code_challenge_method' => 'S256',
            'access_type'           => 'offline',
            'prompt'                => 'consent',
            'include_granted_scopes' => 'true',
        ];
        return self::AUTH_URL . '?' . http_build_query($q);
    }

    /** @return array resposta do token endpoint (access_token, refresh_token, expires_in, scope) */
    public static function exchangeCode(string $code, string $codeVerifier): array
    {
        return self::post([
            'client_id'     => self::clientId(),
            'client_secret' => self::clientSecret(),
            'code'          => $code,
            'code_verifier' => $codeVerifier,
            'redirect_uri'  => self::redirectUri(),
            'grant_type'    => 'authorization_code',
        ]);
    }

    /**
     * Renova o access_token.
     *
     * ATENCAO: a resposta do refresh do Google normalmente NAO traz
     * refresh_token. Quem sobrescreve o refresh guardado com o campo ausente
     * apaga a credencial e desconecta a conta silenciosamente — preservar o
     * valor anterior quando a chave nao vier.
     */
    public static function refresh(string $refreshToken): array
    {
        return self::post([
            'client_id'     => self::clientId(),
            'client_secret' => self::clientSecret(),
            'refresh_token' => $refreshToken,
            'grant_type'    => 'refresh_token',
        ]);
    }

    /** Revogacao explicita ao desconectar a conta (§54.2, §75). */
    public static function revoke(string $token): bool
    {
        $ch = curl_init(self::REVOKE_URL);
        curl_setopt_array($ch, [
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => http_build_query(['token' => $token]),
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => 15,
            CURLOPT_HTTPHEADER     => ['Content-Type: application/x-www-form-urlencoded'],
        ]);
        curl_exec($ch);
        $http = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        return $http >= 200 && $http < 300;
    }

    /** POST form-urlencoded no token endpoint, com erro sem vazamento de segredo. */
    private static function post(array $campos): array
    {
        // Em CLI a costura de teste pode estar montada. Fora do CLI ela e
        // ignorada mesmo que alguem a preencha — producao nunca desvia daqui.
        if (PHP_SAPI === 'cli' && is_callable(self::$postDeTeste)) {
            return (self::$postDeTeste)($campos);
        }

        $ch = curl_init(self::TOKEN_URL);
        curl_setopt_array($ch, [
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => http_build_query($campos),
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => 20,
            CURLOPT_HTTPHEADER     => ['Content-Type: application/x-www-form-urlencoded'],
        ]);
        $body = curl_exec($ch);
        $err  = curl_error($ch);
        $http = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($body === false) {
            throw new GoogleOAuthException('Falha de rede no token endpoint: ' . $err);
        }
        $data = json_decode((string)$body, true);
        if (!is_array($data)) {
            throw new GoogleOAuthException('Resposta nao-JSON do token endpoint (HTTP ' . $http . ')');
        }
        if ($http < 200 || $http >= 300) {
            // `error_description` do Google nao carrega segredo; ainda assim so
            // o codigo curto vai para o log (§75.2).
            $code = (string)($data['error'] ?? 'unknown_error');
            error_log('[gcal] oauth token endpoint HTTP ' . $http . ' error=' . $code);
            throw new GoogleOAuthException('OAuth recusado pelo Google: ' . $code);
        }
        return $data;
    }
}
