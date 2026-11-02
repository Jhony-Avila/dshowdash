<?php
// Ads / AdsAuthController - OAuth2 do Google Ads (connect + callback), caminho REAL
// @version 0.1.0-scaffold
// @created 2026-07-24
// @app Ads Intelligence
//
// Fluxo (so no modo real): connect() gera state+PKCE, guarda na sessao e devolve a URL de
// consentimento; callback() valida o state, troca o code por tokens e (TODO go-live) persiste
// cifrado em ADS_DSHOW. Espelha o GraphOAuth do Outlook, adaptado ao Google (PKCE S256).
declare(strict_types=1);

final class AdsAuthController
{
    private const SESS_KEY = 'ads_oauth';

    /** URL absoluta do callback deste modulo. */
    private static function redirectUri(): string
    {
        $scheme = (($_SERVER['HTTPS'] ?? '') !== '' && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'https';
        $host = (string)($_SERVER['HTTP_HOST'] ?? 'dshowdash.com.br');
        return $scheme . '://' . $host . '/api/ads/accounts/callback';
    }

    private static function b64url(string $bin): string
    {
        return rtrim(strtr(base64_encode($bin), '+/', '-_'), '=');
    }

    /** POST /accounts/connect -> { authorize_url }. Guarda state+verifier na sessao. */
    public static function connect(): void
    {
        if (!GoogleAdsClient::isConfigured()) {
            ApiResponse::error(ApiResponse::ERR_DATABASE_ERROR, 503, [
                'message' => 'Integracao Google Ads nao provisionada (developer token + OAuth + ADS_CRYPTO_KEY). Ver docs/GOOGLE-ADS/05-plano-fases.md.',
            ]);
            return;
        }
        $body = ads_body();
        $returnTo = (string)($body['return_to'] ?? '#/panel-ads/contas');

        $state    = self::b64url(random_bytes(16));
        $verifier = self::b64url(random_bytes(32));
        $challenge = self::b64url(hash('sha256', $verifier, true));

        $_SESSION[self::SESS_KEY] = [
            'state'     => $state,
            'verifier'  => $verifier,
            'return_to' => $returnTo,
            'ts'        => time(),
        ];

        ApiResponse::success([
            'authorize_url' => GoogleAdsClient::authorizeUrl(self::redirectUri(), $state, $challenge),
        ]);
    }

    /**
     * GET /accounts/callback?code&state -> valida, troca por tokens e volta ao SPA.
     * Chamado por index.php ANTES do gate CSRF (protecao pelo state, como o mock).
     */
    public static function callback(): void
    {
        $sess = $_SESSION[self::SESS_KEY] ?? null;
        unset($_SESSION[self::SESS_KEY]);   // one-shot
        $back = static function (string $reason) {
            header('Location: /#/panel-ads/contas?ads_auth=error&reason=' . rawurlencode($reason), true, 302);
        };

        $code  = (string)($_GET['code'] ?? '');
        $state = (string)($_GET['state'] ?? '');
        if (isset($_GET['error'])) { $back('denied'); return; }
        if (!is_array($sess) || $state === '' || !hash_equals((string)$sess['state'], $state)) {
            $back('state'); return;
        }
        if ($code === '') { $back('no_code'); return; }
        if (!GoogleAdsClient::isConfigured()) { $back('not_configured'); return; }

        try {
            $tokens = GoogleAdsClient::exchangeCode($code, (string)$sess['verifier'], self::redirectUri());
        } catch (\Throwable $e) {
            error_log('[ads] oauth exchange falhou: ' . $e->getMessage());
            $back('exchange'); return;
        }

        $refresh = (string)($tokens['refresh_token'] ?? '');
        if ($refresh === '') { $back('no_refresh'); return; }

        // TODO(go-live): persistir cifrado em ADS_DSHOW (ads_accounts): AdsCrypto::encrypt($refresh),
        // descobrir os customer ids acessiveis (customers:listAccessibleCustomers) e semear as contas.
        // Enquanto o banco ADS_DSHOW nao estiver provisionado, avisamos sem quebrar o SPA.
        if (!self::dbReady()) { $back('db_not_ready'); return; }

        // (com DB pronto) o armazenamento cifrado entra aqui na Fase 1.
        header('Location: /#/panel-ads/contas?ads_auth=ok', true, 302);
    }

    private static function dbReady(): bool
    {
        $r = GoogleAdsClient::readiness();
        return !empty($r['db']);
    }
}
