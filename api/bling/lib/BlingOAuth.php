<?php
// Bling / lib/BlingOAuth.php - fluxo OAuth 2.0 do Bling v3
// @module  bling.oauth
// @version 1.0.0
// @created 2026-07-30
//
// §4 é inegociável: o navegador NUNCA vê client_secret, access_token ou
// refresh_token. Todo o fluxo acontece aqui, no servidor; o browser só recebe a
// URL de autorização e, no fim, um redirect.
//
// O Bling v3 usa authorization_code com Basic auth na troca (client_id e secret
// no cabeçalho, não no corpo).
declare(strict_types=1);

// Ponto de entrada único: `public/api` é symlink para esta árvore, então cada
// arquivo daqui é alcançável por HTTP. Sem este guarda, um usuário autenticado
// conseguiria executar internals fora do roteador — que é onde moram o gate de
// permissão, o CSRF e o envelope de resposta.
if (!defined('BLING_ENTRADA')) { http_response_code(404); exit; }

final class BlingOAuth
{
    private const URL_AUTORIZAR = 'https://www.bling.com.br/Api/v3/oauth/authorize';
    private const URL_TOKEN     = 'https://www.bling.com.br/Api/v3/oauth/token';

    /** Renova com folga: token que expira em menos de 5 min já é renovado. */
    public const FOLGA_RENOVACAO_SEG = 300;

    public function __construct(
        private readonly BlingTransporte $transporte,
    ) {}

    // ── Configuração ────────────────────────────────────────────

    public static function clientId(): string
    {
        return trim((string) (getenv('BLING_CLIENT_ID')
            ?: ($_ENV['BLING_CLIENT_ID'] ?? '')));
    }

    public static function clientSecret(): string
    {
        return trim((string) (getenv('BLING_CLIENT_SECRET')
            ?: ($_ENV['BLING_CLIENT_SECRET'] ?? '')));
    }

    public static function redirectUri(): string
    {
        return trim((string) (getenv('BLING_REDIRECT_URI')
            ?: ($_ENV['BLING_REDIRECT_URI'] ?? '')));
    }

    public static function configurado(): bool
    {
        return self::clientId() !== '' && self::clientSecret() !== '' && self::redirectUri() !== '';
    }

    // ── Autorização ─────────────────────────────────────────────

    /**
     * URL para onde mandar o usuário. O `state` é anti-CSRF e precisa ser
     * persistido antes de redirecionar — sem isso, um callback forjado
     * conectaria a conta de um atacante na sessão da vítima.
     */
    public function urlAutorizacao(string $state): string
    {
        if (!self::configurado()) {
            throw new RuntimeException(
                'OAuth do Bling não configurado: faltam BLING_CLIENT_ID, BLING_CLIENT_SECRET ou BLING_REDIRECT_URI.'
            );
        }
        return self::URL_AUTORIZAR . '?' . http_build_query([
            'response_type' => 'code',
            'client_id'     => self::clientId(),
            'redirect_uri'  => self::redirectUri(),
            'state'         => $state,
        ]);
    }

    /** Gera um state imprevisível. */
    public static function novoState(): string
    {
        return bin2hex(random_bytes(32));
    }

    // ── Troca e renovação ───────────────────────────────────────

    /**
     * Troca o `code` do callback por tokens.
     * @return array{access_token:string,refresh_token:?string,expires_in:int,token_type:string}
     */
    public function trocarCodigo(string $codigo): array
    {
        return $this->pedirToken([
            'grant_type'   => 'authorization_code',
            'code'         => $codigo,
            'redirect_uri' => self::redirectUri(),
        ]);
    }

    /**
     * Renova com o refresh_token.
     *
     * ⚠️ O Bling nem sempre devolve um refresh_token novo na renovação. Quando
     * não devolve, o antigo CONTINUA VALENDO — sobrescrever com null zera a
     * conexão e obriga o usuário a reconectar do nada. Por isso o campo volta
     * como null e quem grava usa COALESCE. Mesmo comportamento do Google, e o
     * módulo Google Calendar já apanhou disso.
     */
    public function renovar(string $refreshToken): array
    {
        return $this->pedirToken([
            'grant_type'    => 'refresh_token',
            'refresh_token' => $refreshToken,
        ]);
    }

    private function pedirToken(array $form): array
    {
        if (!self::configurado()) {
            throw new RuntimeException('OAuth do Bling não configurado.');
        }

        // Basic auth: o Bling v3 espera client_id:client_secret no cabeçalho.
        // Mandar no corpo devolve 401 sem explicar por quê.
        $basic = base64_encode(self::clientId() . ':' . self::clientSecret());

        $r = $this->transporte->enviar('POST', self::URL_TOKEN, [
            'headers' => ['Authorization: Basic ' . $basic],
            'form'    => $form,
            'timeout' => 20,
        ]);

        if (!$r->ok()) {
            $codigo = (string) ($r->corpo['error'] ?? $r->corpo['erro'] ?? 'HTTP_' . $r->status);
            $desc   = (string) ($r->corpo['error_description'] ?? $r->corpo['message'] ?? '');
            throw new RuntimeException(
                sprintf('Falha no OAuth do Bling (%d): %s %s', $r->status, $codigo, $desc)
            );
        }

        $acesso = (string) ($r->corpo['access_token'] ?? '');
        if ($acesso === '') {
            throw new RuntimeException('Resposta do OAuth sem access_token.');
        }

        $refresh = $r->corpo['refresh_token'] ?? null;

        return [
            'access_token'  => $acesso,
            // null = "mantenha o que já existe", NÃO "apague".
            'refresh_token' => is_string($refresh) && $refresh !== '' ? $refresh : null,
            'expires_in'    => (int) ($r->corpo['expires_in'] ?? 21600),
            'token_type'    => (string) ($r->corpo['token_type'] ?? 'Bearer'),
        ];
    }

    /** Um token que expira em menos que a folga já deve ser renovado. */
    public static function precisaRenovar(?string $expiraEmUtc): bool
    {
        if ($expiraEmUtc === null || $expiraEmUtc === '') {
            return true;
        }
        $t = strtotime($expiraEmUtc . ' UTC');
        return $t === false || $t - time() <= self::FOLGA_RENOVACAO_SEG;
    }
}
