<?php
// Pipedrive / PipedriveClient - cliente HTTP da API do Pipedrive
// @version 1.0.0
// @created 2026-07-21
// @app Pipedrive Analytics
//
// So o backend fala com o Pipedrive (briefing §25.2). O token NUNCA vai ao
// navegador nem ao log (ver PipeCrypto::scrub).
//
// Autenticacao: header "x-api-token" (v2 NAO aceita ?api_token= na URL).
// Base URL: https://api.pipedrive.com (token) — futuro OAuth usa api_domain.
// Paginacao v2: cursor (additional_data.next_cursor); v1: start/limit.
// Rate-limit por CUSTO de token: captura x-ratelimit-* e x-daily-ratelimit-token-*.
declare(strict_types=1);

final class PipedriveClient
{
    private string $token;
    private string $baseUrl;
    private int $timeout;

    public function __construct(string $token, ?string $baseUrl = null, int $timeout = 30)
    {
        $this->token   = $token;
        $this->baseUrl = rtrim($baseUrl ?: 'https://api.pipedrive.com', '/');
        $this->timeout = $timeout;
    }

    /**
     * Valida o token e retorna dados da conta (empresa + usuario).
     * GET /v1/users/me. Nao ha versao v2 desse endpoint.
     * @return array ['ok'=>bool, 'status'=>int, 'data'=>?array, 'error'=>?string, 'meta'=>array]
     */
    public function validateToken(): array
    {
        $res = $this->request('GET', 'v1', '/users/me');
        if ($res['ok'] && isset($res['data']) && is_array($res['data'])) {
            return $res;
        }
        // normaliza mensagem de erro de auth
        if ($res['status'] === 401) {
            $res['error'] = $res['error'] ?: 'unauthorized access';
        }
        return $res;
    }

    /**
     * Requisicao generica. $version = 'v1'|'v2'.
     * Retorna envelope neutro (nunca lanca por status HTTP; lanca so em falha de rede).
     */
    public function request(string $method, string $version, string $path, array $query = [], ?array $body = null): array
    {
        // v2 -> /api/v2 ; v1 -> /api/v1 ; v1root -> /v1 (ex.: leads vive em /v1/leads, SEM /api)
        $prefix = $version === 'v2' ? '/api/v2' : ($version === 'v1root' ? '/v1' : '/api/v1');
        $url = $this->baseUrl . $prefix . '/' . ltrim($path, '/');
        if ($query) {
            $url .= (strpos($url, '?') === false ? '?' : '&') . http_build_query($query);
        }

        $ch = curl_init();
        $headers = [
            'x-api-token: ' . $this->token,
            'Accept: application/json',
        ];
        $opts = [
            CURLOPT_URL            => $url,
            CURLOPT_CUSTOMREQUEST  => strtoupper($method),
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HEADER         => true,
            CURLOPT_TIMEOUT        => $this->timeout,
            CURLOPT_CONNECTTIMEOUT => 10,
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_SSL_VERIFYHOST => 2,
        ];
        if ($body !== null) {
            $headers[] = 'Content-Type: application/json';
            $opts[CURLOPT_POSTFIELDS] = json_encode($body, JSON_UNESCAPED_UNICODE);
        }
        $opts[CURLOPT_HTTPHEADER] = $headers;
        curl_setopt_array($ch, $opts);

        $t0  = microtime(true);
        $raw = curl_exec($ch);
        $durationMs = (int)round((microtime(true) - $t0) * 1000);

        if ($raw === false) {
            $err = curl_error($ch);
            curl_close($ch);
            return [
                'ok' => false, 'status' => 0, 'data' => null,
                'error' => 'NETWORK_ERROR: ' . $err,
                'meta' => ['duration_ms' => $durationMs],
            ];
        }

        $status     = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $headerSize = (int)curl_getinfo($ch, CURLINFO_HEADER_SIZE);
        $rawHeaders = substr($raw, 0, $headerSize);
        $rawBody    = substr($raw, $headerSize);
        curl_close($ch);

        $meta = $this->parseRateLimit($rawHeaders);
        $meta['duration_ms'] = $durationMs;

        $json = json_decode($rawBody, true);
        $ok = ($status >= 200 && $status < 300) && is_array($json) && ($json['success'] ?? false) === true;

        $error = null;
        if (!$ok) {
            $error = is_array($json)
                ? ($json['error'] ?? ($json['error_info'] ?? ('HTTP_' . $status)))
                : ('HTTP_' . $status);
        }

        return [
            'ok'     => $ok,
            'status' => $status,
            'data'   => is_array($json) ? ($json['data'] ?? null) : null,
            'additional_data' => is_array($json) ? ($json['additional_data'] ?? null) : null,
            'error'  => $error,
            'meta'   => $meta,
        ];
    }

    /**
     * Pagina uma listagem inteira, chamando $onBatch($items, $meta, $page) por pagina.
     * Cuida de: cursor v2 (additional_data.next_cursor) / offset v1 (next_start);
     * throttle por rate-limit (pausa quando remaining baixo) e retry em 429.
     *
     * $opts:
     *   version   'v2'|'v1'        (default 'v2')
     *   query     array            filtros extra (updated_since, sort_by, etc.)
     *   limit     int              (default 500; max da API)
     *   maxPages  int              trava de seguranca (0 = sem limite)
     *   maxItems  int              trava de seguranca (0 = sem limite)
     *   listCost  int              custo em tokens por listagem (default 20)
     *
     * @return array ['ok'=>bool,'pages'=>int,'items'=>int,'api_calls'=>int,
     *                'token_cost'=>int,'status'=>int,'error'=>?string]
     */
    public function paginate(string $path, array $opts, callable $onBatch): array
    {
        $version  = in_array($opts['version'] ?? 'v2', ['v1', 'v1root', 'v2'], true) ? $opts['version'] : 'v2';
        $isV2     = $version === 'v2'; // cursor vs offset (v1/v1root usam start/limit)
        $limit    = (int)($opts['limit'] ?? 500);
        $maxPages = (int)($opts['maxPages'] ?? 0);
        $maxItems = (int)($opts['maxItems'] ?? 0);
        $listCost = (int)($opts['listCost'] ?? 20);
        $baseQuery = is_array($opts['query'] ?? null) ? $opts['query'] : [];

        $pages = 0; $items = 0; $apiCalls = 0; $tokenCost = 0;
        $cursor = null; $start = 0;
        $lastStatus = 0;

        while (true) {
            $query = $baseQuery + ['limit' => $limit];
            if ($isV2) {
                if ($cursor !== null) { $query['cursor'] = $cursor; }
            } else {
                $query['start'] = $start;
            }

            // ── chamada com retry para 429 ────────────────────────
            $res = null;
            for ($tent = 0; $tent < 4; $tent++) {
                $res = $this->request('GET', $version, $path, $query);
                $apiCalls++;
                $tokenCost += $listCost;
                $lastStatus = (int)($res['status'] ?? 0);
                if ($lastStatus !== 429) { break; }
                // 429: sem Retry-After -> usar reset (janela 2s) + jitter
                $reset = (int)($res['meta']['ratelimit_reset'] ?? 2);
                $this->pause(min(max($reset, 1), 10) + (mt_rand(0, 400) / 1000));
            }

            if (!$res || !$res['ok']) {
                return [
                    'ok' => false, 'pages' => $pages, 'items' => $items,
                    'api_calls' => $apiCalls, 'token_cost' => $tokenCost,
                    'status' => $lastStatus, 'error' => $res['error'] ?? 'ERRO_PAGINACAO',
                ];
            }

            $lote = is_array($res['data'] ?? null) ? $res['data'] : [];
            $pages++;
            $items += count($lote);
            // onBatch pode retornar false para PARAR a paginacao (stop-early incremental v1).
            // Retornos null/void (demais chamadores) NAO param — retrocompativel.
            $pararCedo = ($onBatch($lote, $res['meta'] ?? [], $pages) === false);

            // ── proxima pagina ────────────────────────────────────
            $add = $res['additional_data'] ?? [];
            if ($isV2) {
                $cursor = $add['next_cursor'] ?? null;
                $fim = ($cursor === null || $cursor === '');
            } else {
                $pg = $add['pagination'] ?? [];
                $fim = !($pg['more_items_in_collection'] ?? false);
                $start = (int)($pg['next_start'] ?? ($start + $limit));
            }

            if ($fim || $pararCedo) { break; }
            if ($maxPages > 0 && $pages >= $maxPages) { break; }
            if ($maxItems > 0 && $items >= $maxItems) { break; }

            // throttle preventivo: se o orcamento da janela esta acabando, pausa
            $rem = $res['meta']['ratelimit_remaining'] ?? null;
            if ($rem !== null && $rem <= 2) {
                $reset = (int)($res['meta']['ratelimit_reset'] ?? 2);
                $this->pause(min(max($reset, 1), 5));
            }
        }

        return [
            'ok' => true, 'pages' => $pages, 'items' => $items,
            'api_calls' => $apiCalls, 'token_cost' => $tokenCost,
            'status' => $lastStatus, 'error' => null,
        ];
    }

    /** Pausa (segundos, aceita fracao). Isolada para nao dormir em teste unitario. */
    private function pause(float $seconds): void
    {
        if ($seconds > 0) { usleep((int)round($seconds * 1_000_000)); }
    }

    /** Extrai headers de rate-limit por custo de token. */
    private function parseRateLimit(string $rawHeaders): array
    {
        $get = function (string $name) use ($rawHeaders): ?int {
            if (preg_match('/^' . preg_quote($name, '/') . ':\s*(\d+)/mi', $rawHeaders, $m)) {
                return (int)$m[1];
            }
            return null;
        };
        return [
            'ratelimit_remaining' => $get('x-ratelimit-remaining'),
            'ratelimit_limit'     => $get('x-ratelimit-limit'),
            'ratelimit_reset'     => $get('x-ratelimit-reset'),
            'daily_token_limit'   => $get('x-daily-ratelimit-token-limit'),
            'daily_token_left'    => $get('x-daily-ratelimit-token-remaining'),
        ];
    }
}
