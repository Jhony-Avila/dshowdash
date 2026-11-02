<?php
// Outlook / GraphOAuth - Microsoft Identity Platform (OAuth2 Authorization Code + PKCE)
// @version 1.0.0
// @created 2026-07-21
// @app Integracao Outlook
//
// Fluxo DELEGADO (briefing §8.2): o Dshow Dash atua EM NOME do usuario conectado.
// App confidencial (web) multitenant + contas pessoais -> tenant 'common'.
//
// Endpoints v2.0:
//   authorize: https://login.microsoftonline.com/{tenant}/oauth2/v2.0/authorize
//   token:     https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token
//
// Config lida do .env (NENHUM segredo vai ao frontend):
//   MS_OAUTH_CLIENT_ID, MS_OAUTH_CLIENT_SECRET, MS_OAUTH_TENANT (default 'common'),
//   MS_OAUTH_REDIRECT_URI, MS_OAUTH_SCOPES (default: minimas da Fase 0).
//
// PKCE: code_verifier (43-128 chars) + code_challenge = base64url(sha256(verifier)).
declare(strict_types=1);

final class GraphOAuthException extends RuntimeException {}

final class GraphOAuth
{
    /** Scopes minimos da Fase 0 (prova de leitura + envio). offline_access = refresh token. */
    public const DEFAULT_SCOPES = 'openid profile email offline_access User.Read Mail.Read Mail.Send';

    private static function env(string $key, ?string $default = null): ?string
    {
        $v = getenv($key);
        if ($v === false || $v === '') {
            $v = $_ENV[$key] ?? null;
        }
        $v = is_string($v) ? trim($v) : $v;
        return ($v === null || $v === '') ? $default : $v;
    }

    public static function clientId(): string
    {
        $v = self::env('MS_OAUTH_CLIENT_ID');
        if ($v === null) {
            throw new GraphOAuthException('MS_OAUTH_CLIENT_ID ausente no .env');
        }
        return $v;
    }

    private static function clientSecret(): string
    {
        $v = self::env('MS_OAUTH_CLIENT_SECRET');
        if ($v === null) {
            throw new GraphOAuthException('MS_OAUTH_CLIENT_SECRET ausente no .env');
        }
        return $v;
    }

    public static function tenant(): string
    {
        return self::env('MS_OAUTH_TENANT', 'common');
    }

    public static function redirectUri(): string
    {
        $v = self::env('MS_OAUTH_REDIRECT_URI');
        if ($v === null) {
            throw new GraphOAuthException('MS_OAUTH_REDIRECT_URI ausente no .env');
        }
        return $v;
    }

    public static function scopes(): string
    {
        return self::env('MS_OAUTH_SCOPES', self::DEFAULT_SCOPES);
    }

    /** True se o minimo para operar (client_id/secret/redirect) esta presente. */
    public static function isConfigured(): bool
    {
        return self::env('MS_OAUTH_CLIENT_ID') !== null
            && self::env('MS_OAUTH_CLIENT_SECRET') !== null
            && self::env('MS_OAUTH_REDIRECT_URI') !== null;
    }

    private static function base(): string
    {
        return 'https://login.microsoftonline.com/' . rawurlencode(self::tenant()) . '/oauth2/v2.0';
    }

    // ── PKCE ──────────────────────────────────────────────────────────
    /** Gera um code_verifier PKCE (base64url, 43-128 chars). */
    public static function newCodeVerifier(): string
    {
        return self::b64url(random_bytes(48)); // 64 chars base64url
    }

    public static function codeChallenge(string $verifier): string
    {
        return self::b64url(hash('sha256', $verifier, true));
    }

    private static function b64url(string $bin): string
    {
        return rtrim(strtr(base64_encode($bin), '+/', '-_'), '=');
    }

    // ── Authorize URL ─────────────────────────────────────────────────
    /**
     * Monta a URL para redirecionar o navegador do usuario ao consentimento Microsoft.
     * $state e $codeChallenge sao gerados/armazenados pelo AuthService.
     */
    public static function authorizeUrl(string $state, string $codeChallenge): string
    {
        $params = [
            'client_id'             => self::clientId(),
            'response_type'         => 'code',
            'redirect_uri'          => self::redirectUri(),
            'response_mode'         => 'query',
            'scope'                 => self::scopes(),
            'state'                 => $state,
            'code_challenge'        => $codeChallenge,
            'code_challenge_method' => 'S256',
            // prompt=select_account: permite o usuario escolher/adicionar outra conta (multi-conta §7).
            'prompt'                => 'select_account',
        ];
        return self::base() . '/authorize?' . http_build_query($params);
    }

    // ── Troca de code -> tokens ────────────────────────────────────────
    /**
     * Troca o authorization code por tokens (grant_type=authorization_code).
     * @return array token endpoint response (access_token, refresh_token, expires_in, id_token, scope)
     * @throws GraphOAuthException em erro de rede ou resposta de erro OAuth
     */
    public static function exchangeCode(string $code, string $codeVerifier): array
    {
        return self::token([
            'client_id'     => self::clientId(),
            'client_secret' => self::clientSecret(),
            'grant_type'    => 'authorization_code',
            'code'          => $code,
            'redirect_uri'  => self::redirectUri(),
            'code_verifier' => $codeVerifier,
            'scope'         => self::scopes(),
        ]);
    }

    /**
     * Renova o access_token via refresh_token (grant_type=refresh_token).
     * A Microsoft pode devolver um refresh_token NOVO (rotacao) — o chamador deve
     * persistir o que vier em 'refresh_token', se presente.
     */
    public static function refresh(string $refreshToken): array
    {
        return self::token([
            'client_id'     => self::clientId(),
            'client_secret' => self::clientSecret(),
            'grant_type'    => 'refresh_token',
            'refresh_token' => $refreshToken,
            'scope'         => self::scopes(),
        ]);
    }

    /** POST form-urlencoded ao token endpoint. Lanca em erro (com o error/description da Microsoft). */
    private static function token(array $form): array
    {
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL            => self::base() . '/token',
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => http_build_query($form),
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => 30,
            CURLOPT_CONNECTTIMEOUT => 10,
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_SSL_VERIFYHOST => 2,
            CURLOPT_HTTPHEADER     => [
                'Content-Type: application/x-www-form-urlencoded',
                'Accept: application/json',
            ],
        ]);
        $raw    = curl_exec($ch);
        $errno  = curl_errno($ch);
        $err    = curl_error($ch);
        $status = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($raw === false || $errno !== 0) {
            throw new GraphOAuthException('NETWORK_ERROR ao contatar o token endpoint: ' . $err);
        }
        $json = json_decode((string)$raw, true);
        if (!is_array($json)) {
            throw new GraphOAuthException('Resposta nao-JSON do token endpoint (HTTP ' . $status . ')');
        }
        if ($status < 200 || $status >= 300 || isset($json['error'])) {
            // 'error' e um codigo estavel (ex.: invalid_grant, interaction_required); NAO logar tokens.
            $code = (string)($json['error'] ?? ('HTTP_' . $status));
            $desc = (string)($json['error_description'] ?? '');
            throw new GraphOAuthException($code . ($desc !== '' ? (': ' . self::firstLine($desc)) : ''));
        }
        return $json;
    }

    private static function firstLine(string $s): string
    {
        $s = trim($s);
        $nl = strpos($s, "\n");
        return $nl === false ? $s : substr($s, 0, $nl);
    }

    /**
     * Decodifica (sem validar assinatura) o payload de um id_token JWT para extrair
     * claims de identidade (oid, tid, preferred_username, name). Uso: identificar a
     * conta apos a troca de code. NAO usar para decisoes de seguranca sensiveis — a
     * autoridade e o proprio token endpoint (canal server-to-server ja autenticado).
     */
    public static function decodeIdToken(?string $idToken): array
    {
        if ($idToken === null || $idToken === '') {
            return [];
        }
        $parts = explode('.', $idToken);
        if (count($parts) < 2) {
            return [];
        }
        $payload = base64_decode(strtr($parts[1], '-_', '+/'), false);
        if ($payload === false) {
            return [];
        }
        $claims = json_decode($payload, true);
        return is_array($claims) ? $claims : [];
    }
}
