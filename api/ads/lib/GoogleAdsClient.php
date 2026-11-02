<?php
// Ads / GoogleAdsClient - cliente do caminho REAL (Google Ads API)
// @version 0.1.0-scaffold
// @created 2026-07-24
// @app Ads Intelligence
//
// Esqueleto do cliente real (Fase 1). NUNCA executa no modo mock (ADS_PROVIDER=mock):
// so e instanciado pelo AdsRealController quando ADS_PROVIDER=google. Concentra:
//   - OAuth2: URL de consentimento (PKCE), troca de code->tokens, refresh do access_token
//   - GAQL: googleAds:searchStream  (leitura; custo em micros -> /1e6)
//   - mutate + validate_only  (motor de PREVIEW de escrita, §32)
//
// Divergencias vs Pipedrive (moldam este cliente): developer token (aprovacao MCC),
// login-customer-id, custo em micros, SEM webhooks (pull por change_event/change_status),
// conversoes retroagem -> reprocessar janela movel (UPSERT idempotente em ads_metrics_daily).
//
// O que FALTA para o go-live (marcado com TODO(go-live)): persistir tokens cifrados em
// ADS_DSHOW, montar as GAQL por tela e o mapeamento linha->DTO das telas. As credenciais
// (developer token + OAuth + login-customer-id) sao provisionadas pelo dono/DBA.
declare(strict_types=1);

require_once __DIR__ . '/AdsCrypto.php';

final class AdsNotConfiguredException extends RuntimeException {}
final class GoogleAdsApiException extends RuntimeException {}

final class GoogleAdsClient
{
    private const API_VERSION   = 'v18';
    private const OAUTH_AUTH    = 'https://accounts.google.com/o/oauth2/v2/auth';
    private const OAUTH_TOKEN   = 'https://oauth2.googleapis.com/token';
    private const SCOPE         = 'https://www.googleapis.com/auth/adwords';
    private const API_BASE      = 'https://googleads.googleapis.com';
    private const HTTP_TIMEOUT  = 20;

    /** Config presente para tentar o caminho real (nao garante credenciais validas). */
    public static function isConfigured(): bool
    {
        return self::env('GOOGLE_ADS_DEVELOPER_TOKEN') !== ''
            && self::env('GOOGLE_ADS_OAUTH_CLIENT_ID') !== ''
            && self::env('GOOGLE_ADS_OAUTH_CLIENT_SECRET') !== ''
            && AdsCrypto::isConfigured();
    }

    /** Prontidao granular (para /status): cada peca do provisionamento. */
    public static function readiness(): array
    {
        return [
            'developer_token' => self::env('GOOGLE_ADS_DEVELOPER_TOKEN') !== '',
            'oauth_client'    => self::env('GOOGLE_ADS_OAUTH_CLIENT_ID') !== '' && self::env('GOOGLE_ADS_OAUTH_CLIENT_SECRET') !== '',
            'login_customer'  => self::env('GOOGLE_ADS_LOGIN_CUSTOMER_ID') !== '',
            'crypto_key'      => AdsCrypto::isConfigured(),
            'db'              => self::env('DB_ADS_DSHOW_NAME') !== '' && self::env('DB_ADS_DSHOW_USER') !== '',
        ];
    }

    // ── OAuth2 ──────────────────────────────────────────────────────────

    /** URL de consentimento (PKCE S256). $state protege o callback. */
    public static function authorizeUrl(string $redirectUri, string $state, string $codeChallenge): string
    {
        self::assertConfigured();
        $params = [
            'client_id'              => self::env('GOOGLE_ADS_OAUTH_CLIENT_ID'),
            'redirect_uri'           => $redirectUri,
            'response_type'          => 'code',
            'scope'                  => self::SCOPE,
            'access_type'            => 'offline',   // refresh_token
            'prompt'                 => 'consent',
            'include_granted_scopes' => 'true',
            'state'                  => $state,
            'code_challenge'         => $codeChallenge,
            'code_challenge_method'  => 'S256',
        ];
        return self::OAUTH_AUTH . '?' . http_build_query($params);
    }

    /** Troca o authorization code por tokens (PKCE). Retorna array cru do Google. */
    public static function exchangeCode(string $code, string $codeVerifier, string $redirectUri): array
    {
        self::assertConfigured();
        return self::postForm(self::OAUTH_TOKEN, [
            'code'          => $code,
            'client_id'     => self::env('GOOGLE_ADS_OAUTH_CLIENT_ID'),
            'client_secret' => self::env('GOOGLE_ADS_OAUTH_CLIENT_SECRET'),
            'redirect_uri'  => $redirectUri,
            'grant_type'    => 'authorization_code',
            'code_verifier' => $codeVerifier,
        ]);
    }

    /** Renova o access_token a partir do refresh_token (texto puro ja decifrado). */
    public static function refreshAccessToken(string $refreshToken): string
    {
        self::assertConfigured();
        $res = self::postForm(self::OAUTH_TOKEN, [
            'client_id'     => self::env('GOOGLE_ADS_OAUTH_CLIENT_ID'),
            'client_secret' => self::env('GOOGLE_ADS_OAUTH_CLIENT_SECRET'),
            'refresh_token' => $refreshToken,
            'grant_type'    => 'refresh_token',
        ]);
        $tok = (string)($res['access_token'] ?? '');
        if ($tok === '') {
            throw new GoogleAdsApiException('Refresh sem access_token');
        }
        return $tok;
    }

    // ── GAQL (leitura) ──────────────────────────────────────────────────

    /**
     * Executa uma consulta GAQL via googleAds:searchStream e devolve as linhas.
     * $customerId sem tracos (ex.: '4738105926'). $accessToken ja renovado.
     * TODO(go-live): paginacao/streaming de respostas grandes.
     */
    public static function search(string $customerId, string $gaql, string $accessToken): array
    {
        self::assertConfigured();
        $url = self::API_BASE . '/' . self::API_VERSION . '/customers/' . rawurlencode($customerId) . '/googleAds:searchStream';
        $resp = self::postJson($url, ['query' => $gaql], $accessToken);
        // searchStream devolve um array de batches { results: [...] }.
        $rows = [];
        $batches = isset($resp[0]) ? $resp : [$resp];
        foreach ($batches as $b) {
            foreach (($b['results'] ?? []) as $r) { $rows[] = $r; }
        }
        return $rows;
    }

    /**
     * mutate com validate_only=true -> motor de PREVIEW (§32): valida sem aplicar.
     * $operations no formato da API (ex.: campaignOperations). TODO(go-live): tipar por recurso.
     */
    public static function previewMutate(string $customerId, string $mutateResource, array $operations, string $accessToken): array
    {
        self::assertConfigured();
        $url = self::API_BASE . '/' . self::API_VERSION . '/customers/' . rawurlencode($customerId) . '/' . $mutateResource . ':mutate';
        return self::postJson($url, ['operations' => $operations, 'validateOnly' => true], $accessToken);
    }

    /** micros -> unidade monetaria (Google reporta custo/valores em micros). */
    public static function microsToCurrency($micros): float
    {
        return round(((float)$micros) / 1_000_000, 2);
    }

    // ── HTTP ────────────────────────────────────────────────────────────

    private static function postForm(string $url, array $form): array
    {
        return self::request($url, http_build_query($form), [
            'Content-Type: application/x-www-form-urlencoded',
        ]);
    }

    private static function postJson(string $url, array $body, string $accessToken): array
    {
        $headers = [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $accessToken,
            'developer-token: ' . self::env('GOOGLE_ADS_DEVELOPER_TOKEN'),
        ];
        $login = self::env('GOOGLE_ADS_LOGIN_CUSTOMER_ID');
        if ($login !== '') {
            $headers[] = 'login-customer-id: ' . preg_replace('/\D/', '', $login);
        }
        return self::request($url, json_encode($body), $headers);
    }

    private static function request(string $url, string $payload, array $headers): array
    {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => $payload,
            CURLOPT_HTTPHEADER     => $headers,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => self::HTTP_TIMEOUT,
            CURLOPT_CONNECTTIMEOUT => 8,
        ]);
        $raw  = curl_exec($ch);
        $errno = curl_errno($ch);
        $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($errno !== 0 || $raw === false) {
            throw new GoogleAdsApiException('Falha de transporte (curl ' . $errno . ')');
        }
        $json = json_decode((string)$raw, true);
        if (!is_array($json)) {
            throw new GoogleAdsApiException('Resposta nao-JSON (HTTP ' . $code . ')');
        }
        if ($code >= 400) {
            // NUNCA vazar o corpo cru ao cliente; o chamador loga com scrub.
            throw new GoogleAdsApiException('Google Ads API HTTP ' . $code);
        }
        return $json;
    }

    // ── util ────────────────────────────────────────────────────────────

    private static function env(string $key): string
    {
        $v = getenv($key);
        if ($v === false || $v === '') { $v = $_ENV[$key] ?? ''; }
        return trim((string)$v);
    }

    private static function assertConfigured(): void
    {
        if (!self::isConfigured()) {
            throw new AdsNotConfiguredException('Google Ads API nao configurada (developer token/OAuth/ADS_CRYPTO_KEY).');
        }
    }
}
