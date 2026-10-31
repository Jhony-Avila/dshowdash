<?php
// Google Analytics / lib/GaGoogleClient.php — cliente HTTP da Google Analytics Data API v1 (GA4) e da Admin API, sem SDK
// @module  google-analytics.lib.client
// @version 1.0.0
// @created 2026-10-31 (Noite 2, Q-GA.1: o provedor real é da fila do app, pelo regime oficial do Dash)
//
// Autenticação por CONTA DE SERVIÇO: JWT RS256 assinado com `openssl_sign` (a chave privada do JSON nunca sai deste processo nem vai para
// log), trocado por um token OAuth em `token_uri` (escopo `analytics.readonly`); token guardado no Redis até 2 min antes de expirar.
// Sem composer/vendor (o projeto não tem) — molde de PipedriveClient. Erros viram GaIndisponivel TIPADO (o index.php e a Ponte v2
// convertem): credencial ausente/ inválida, permissão, cota (429/RESOURCE_EXHAUSTED), Google fora. Nunca cai para o mock.
//
// ⚠️ Endereços: produção = googleapis.com. Os testes apontam para um Google FALSO pela variável GA_API_TEST_BASE, aceita SÓ se for
// http://127.0.0.1:<porta> (nunca outro host) — não há como redirecionar a credencial para fora.
declare(strict_types=1);

final class GaIndisponivel extends RuntimeException
{
    public function __construct(public readonly string $codigo, public readonly int $status, string $mensagem, public readonly array $meta = [])
    {
        parent::__construct($mensagem);
    }
}

final class GaGoogleClient
{
    public const ESCOPO = 'https://www.googleapis.com/auth/analytics.readonly';
    private const DATA_BASE = 'https://analyticsdata.googleapis.com';
    private const ADMIN_BASE = 'https://analyticsadmin.googleapis.com';
    private const TOKEN_URL = 'https://oauth2.googleapis.com/token';
    private const TIMEOUT = 20;

    private ?array $conta = null;
    private ?string $token = null;
    private int $tokenExpira = 0;
    /** última cota devolvida pela Data API (`returnPropertyQuota`) — vai para o meta */
    public ?array $ultimaCota = null;

    public function __construct(private readonly string $arquivoConta, private readonly string $propertyId) {}

    /** Configuração a partir do ambiente (só NOMES no código; valores no .env do Dash). */
    public static function doAmbiente(): self
    {
        return new self(trim((string)getenv('GA_SERVICE_ACCOUNT_JSON')), trim((string)getenv('GA_PROPERTY_ID')));
    }

    public function propertyId(): string { return $this->propertyId; }

    /** Base de teste: só http://127.0.0.1:<porta>; qualquer outra coisa é ignorada (produção sempre googleapis.com). */
    public static function baseTeste(): ?string
    {
        $b = trim((string)getenv('GA_API_TEST_BASE'));
        return preg_match('#^http://127\.0\.0\.1:\d{2,5}$#', $b) ? $b : null;
    }
    private function url(string $tipo, string $caminho): string
    {
        $t = self::baseTeste();
        if ($t !== null) { return $t . '/' . $tipo . $caminho; }
        return ($tipo === 'admin' ? self::ADMIN_BASE : self::DATA_BASE) . $caminho;
    }
    private function tokenUrl(): string { $t = self::baseTeste(); return $t !== null ? $t . '/token' : self::TOKEN_URL; }

    /** Pendências de configuração (sem chamar o Google). Lista vazia = configurado. */
    public function pendencias(): array
    {
        $p = [];
        if ($this->arquivoConta === '') {
            $p[] = 'GA_SERVICE_ACCOUNT_JSON: caminho do arquivo JSON da conta de serviço (0600, fora do site)';
        } elseif (str_starts_with($this->arquivoConta, '{')) {
            $p[] = 'GA_SERVICE_ACCOUNT_JSON deve ser o CAMINHO do arquivo, não o conteúdo do JSON';
        } elseif (!is_readable($this->arquivoConta)) {
            $p[] = 'GA_SERVICE_ACCOUNT_JSON aponta para um arquivo que o PHP não consegue ler';
        }
        if (!preg_match('/^\d{5,15}$/', $this->propertyId)) {
            $p[] = 'GA_PROPERTY_ID: número da propriedade GA4 (Administrador › Detalhes da propriedade; não é o G-…)';
        }
        return $p;
    }

    private function conta(): array
    {
        if ($this->conta !== null) { return $this->conta; }
        if ($this->pendencias() !== []) {
            throw new GaIndisponivel('GA_PROVIDER_NAO_CONFIGURADO', 503, 'Integração com o Google Analytics não configurada.', ['pendencias' => $this->pendencias()]);
        }
        $raw = @file_get_contents($this->arquivoConta);
        $j = is_string($raw) ? json_decode($raw, true) : null;
        if (!is_array($j) || ($j['type'] ?? '') !== 'service_account' || empty($j['client_email']) || empty($j['private_key'])) {
            throw new GaIndisponivel('GA_CREDENCIAL_INVALIDA', 503, 'O arquivo da conta de serviço não é um JSON de conta de serviço válido.');
        }
        return $this->conta = ['email' => (string)$j['client_email'], 'chave' => (string)$j['private_key']];
    }

    private static function b64url(string $s): string { return rtrim(strtr(base64_encode($s), '+/', '-_'), '='); }

    /** JWT de asserção (RS256). Público para o teste conferir a assinatura com a chave pública. */
    public function assercao(int $agora): string
    {
        $c = $this->conta();
        $cab = self::b64url(json_encode(['alg' => 'RS256', 'typ' => 'JWT']));
        $corpo = self::b64url(json_encode(['iss' => $c['email'], 'scope' => self::ESCOPO, 'aud' => self::TOKEN_URL, 'iat' => $agora, 'exp' => $agora + 3600]));
        $chave = openssl_pkey_get_private($c['chave']);
        if ($chave === false || !openssl_sign($cab . '.' . $corpo, $assinatura, $chave, OPENSSL_ALGO_SHA256)) {
            throw new GaIndisponivel('GA_CREDENCIAL_INVALIDA', 503, 'Não foi possível assinar com a chave da conta de serviço.');
        }
        return $cab . '.' . $corpo . '.' . self::b64url($assinatura);
    }

    private function chaveCache(): string { return 'ga:token:' . substr(hash('sha256', $this->conta()['email'] . '|' . self::ESCOPO), 0, 24); }

    private function tokenAcesso(): string
    {
        $agora = time();
        if ($this->token !== null && $this->tokenExpira - 120 > $agora) { return $this->token; }
        $semCache = getenv('GA_CACHE_OFF') === '1';   // só testes
        $cache = !$semCache && class_exists('RedisHelper') ? RedisHelper::tryGetCache($this->chaveCache()) : null;
        if (is_string($cache) && ($c = json_decode($cache, true)) && is_array($c) && ($c['exp'] ?? 0) - 120 > $agora) {
            $this->token = (string)$c['t']; $this->tokenExpira = (int)$c['exp'];
            return $this->token;
        }
        [$st, $r] = $this->http('POST', $this->tokenUrl(), http_build_query(['grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer', 'assertion' => $this->assercao($agora)]), 'application/x-www-form-urlencoded', null);
        if ($st !== 200 || !is_string($r['access_token'] ?? null)) {
            throw new GaIndisponivel('GA_CREDENCIAL_INVALIDA', 503, 'O Google recusou a credencial da conta de serviço.', ['google_status' => $st]);
        }
        $this->token = $r['access_token']; $this->tokenExpira = $agora + max(60, (int)($r['expires_in'] ?? 3600));
        if (!$semCache && class_exists('RedisHelper')) { RedisHelper::setCache($this->chaveCache(), json_encode(['t' => $this->token, 'exp' => $this->tokenExpira]), max(60, $this->tokenExpira - $agora - 120)); }
        return $this->token;
    }

    /** POST/GET com JSON; devolve [status, corpo decodificado]. Rede fora = GaIndisponivel. */
    private function http(string $metodo, string $url, ?string $corpo, string $tipo, ?string $token): array
    {
        $ch = curl_init($url);
        $hdr = ['Accept: application/json'];
        if ($corpo !== null) { $hdr[] = 'Content-Type: ' . $tipo; }
        if ($token !== null) { $hdr[] = 'Authorization: Bearer ' . $token; }
        curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_CUSTOMREQUEST => $metodo, CURLOPT_HTTPHEADER => $hdr, CURLOPT_TIMEOUT => self::TIMEOUT,
            CURLOPT_CONNECTTIMEOUT => 8, CURLOPT_FOLLOWLOCATION => false, CURLOPT_PROTOCOLS => CURLPROTO_HTTPS | CURLPROTO_HTTP]);
        if ($corpo !== null) { curl_setopt($ch, CURLOPT_POSTFIELDS, $corpo); }
        $resp = curl_exec($ch);
        $st = (int)curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
        curl_close($ch);
        if ($resp === false || $st === 0) {
            throw new GaIndisponivel('GA_INDISPONIVEL', 503, 'O Google Analytics não respondeu. Tente de novo em instantes.');
        }
        $j = json_decode((string)$resp, true);
        return [$st, is_array($j) ? $j : []];
    }

    /** Chamada autenticada; mapeia erros do Google para códigos estáveis. */
    private function chamar(string $tipo, string $caminho, ?array $corpo, string $categoria): array
    {
        $token = $this->tokenAcesso();
        [$st, $r] = $this->http($corpo === null ? 'GET' : 'POST', $this->url($tipo, $caminho), $corpo === null ? null : json_encode($corpo, JSON_UNESCAPED_SLASHES), 'application/json', $token);
        if ($st === 200) {
            if (isset($r['propertyQuota']) && is_array($r['propertyQuota'])) { $this->ultimaCota = ['categoria' => $categoria] + $r['propertyQuota']; }
            return $r;
        }
        $status = (string)($r['error']['status'] ?? '');
        if ($st === 429 || $status === 'RESOURCE_EXHAUSTED') {
            throw new GaIndisponivel('GA_COTA_ESGOTADA', 503, 'A cota do Google Analytics para esta propriedade se esgotou. Os números voltam quando a cota renovar.', ['categoria_quota' => $categoria]);
        }
        if ($st === 401) { $this->token = null; throw new GaIndisponivel('GA_CREDENCIAL_INVALIDA', 503, 'O Google recusou o token da conta de serviço.'); }
        if ($st === 403 || $status === 'PERMISSION_DENIED') {
            throw new GaIndisponivel('GA_SEM_ACESSO', 503, 'A conta de serviço não tem acesso de Leitor a esta propriedade do GA4.');
        }
        if ($st === 400 || $status === 'INVALID_ARGUMENT') {
            error_log('[ga] consulta recusada pelo Google (' . $categoria . '): ' . substr((string)($r['error']['message'] ?? ''), 0, 200));
            throw new GaIndisponivel('GA_CONSULTA_INVALIDA', 503, 'O Google recusou a consulta deste relatório.', ['categoria_quota' => $categoria]);
        }
        throw new GaIndisponivel('GA_INDISPONIVEL', 503, 'O Google Analytics respondeu com erro. Tente de novo em instantes.', ['google_status' => $st]);
    }

    // ── Data API v1 ─────────────────────────────────────────────────────
    public function runReport(array $corpo): array
    {
        return $this->chamar('data', '/v1beta/properties/' . $this->propertyId . ':runReport', $corpo + ['returnPropertyQuota' => true], 'core');
    }
    public function runRealtimeReport(array $corpo): array
    {
        return $this->chamar('data', '/v1beta/properties/' . $this->propertyId . ':runRealtimeReport', $corpo + ['returnPropertyQuota' => true], 'realtime');
    }
    public function runFunnelReport(array $corpo): array
    {
        return $this->chamar('data', '/v1alpha/properties/' . $this->propertyId . ':runFunnelReport', $corpo + ['returnPropertyQuota' => true], 'funnel');
    }
    public function metadata(): array
    {
        return $this->chamar('data', '/v1beta/properties/' . $this->propertyId . '/metadata', null, 'core');
    }
    // ── Admin API v1beta ────────────────────────────────────────────────
    public function accountSummaries(): array { return $this->chamar('admin', '/v1beta/accountSummaries?pageSize=50', null, 'admin'); }
    public function dataStreams(): array { return $this->chamar('admin', '/v1beta/properties/' . $this->propertyId . '/dataStreams?pageSize=50', null, 'admin'); }
    public function keyEvents(): array { return $this->chamar('admin', '/v1beta/properties/' . $this->propertyId . '/keyEvents?pageSize=200', null, 'admin'); }

    /** Linhas de um runReport como [ [dim1, dim2…, met1, met2…], … ] com números convertidos. */
    public static function linhas(array $r): array
    {
        $out = [];
        foreach ($r['rows'] ?? [] as $row) {
            $l = [];
            foreach ($row['dimensionValues'] ?? [] as $d) { $l[] = (string)($d['value'] ?? ''); }
            foreach ($row['metricValues'] ?? [] as $m) { $l[] = is_numeric($m['value'] ?? null) ? $m['value'] + 0 : 0; }
            $out[] = $l;
        }
        return $out;
    }
}
