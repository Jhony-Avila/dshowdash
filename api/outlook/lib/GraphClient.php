<?php
// Outlook / GraphClient - cliente HTTP do Microsoft Graph
// @version 1.0.0
// @created 2026-07-21
// @app Integracao Outlook
//
// So o backend fala com o Graph (briefing §27.2). O access_token NUNCA vai ao
// navegador nem ao log (ver OutlookCrypto::scrub).
//
// Autenticacao: header Authorization: Bearer <access_token>.
// Base: https://graph.microsoft.com/v1.0
// Throttling (§32): respeita 429 + Retry-After com backoff; retenta ate 4x.
//
// request() devolve envelope neutro (nunca lanca por status HTTP; lanca so em
// falha de rede). Quem chama decide o que fazer com 401 (token invalido -> refresh).
declare(strict_types=1);

final class GraphClient
{
    private string $accessToken;
    private string $baseUrl;
    private int $timeout;

    public function __construct(string $accessToken, ?string $baseUrl = null, int $timeout = 30)
    {
        $this->accessToken = $accessToken;
        $this->baseUrl     = rtrim($baseUrl ?: 'https://graph.microsoft.com/v1.0', '/');
        $this->timeout     = $timeout;
    }

    public function get(string $path, array $query = [], array $extraHeaders = []): array
    {
        return $this->request('GET', $path, $query, null, $extraHeaders);
    }

    public function post(string $path, ?array $body = null): array
    {
        return $this->request('POST', $path, [], $body);
    }

    public function patch(string $path, ?array $body = null): array
    {
        return $this->request('PATCH', $path, [], $body);
    }

    public function delete(string $path): array
    {
        return $this->request('DELETE', $path, [], null);
    }

    /**
     * Requisicao generica ao Graph, com retry para 429/503 respeitando Retry-After.
     * @return array ['ok'=>bool,'status'=>int,'data'=>?array,'error'=>?string,'error_code'=>?string,'meta'=>array]
     */
    public function request(string $method, string $path, array $query = [], ?array $body = null, array $extraHeaders = []): array
    {
        $url = $this->baseUrl . '/' . ltrim($path, '/');
        if ($query) {
            // Graph usa parametros com $ (ex.: $top, $select, $filter). http_build_query cuida do encode.
            $url .= (strpos($url, '?') === false ? '?' : '&') . http_build_query($query);
        }

        $lastRes = null;
        for ($attempt = 0; $attempt < 4; $attempt++) {
            $res = $this->send($method, $url, $body, $extraHeaders);
            $lastRes = $res;

            $status = $res['status'];
            if ($status !== 429 && $status !== 503) {
                return $res;
            }
            // Throttling: respeitar Retry-After (segundos). Fallback: backoff exponencial + jitter.
            $retryAfter = $res['meta']['retry_after'] ?? null;
            $wait = $retryAfter !== null
                ? min(max((int)$retryAfter, 1), 60)
                : min((int)pow(2, $attempt), 30);
            $this->pause($wait + (mt_rand(0, 400) / 1000));
        }
        return $lastRes;
    }

    /** Uma tentativa de request. */
    private function send(string $method, string $url, ?array $body, array $extraHeaders = []): array
    {
        $ch = curl_init();
        $headers = [
            'Authorization: Bearer ' . $this->accessToken,
            'Accept: application/json',
        ];
        foreach ($extraHeaders as $k => $v) {
            $headers[] = $k . ': ' . $v;
        }
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
                'error' => 'NETWORK_ERROR: ' . $err, 'error_code' => 'NETWORK_ERROR',
                'meta' => ['duration_ms' => $durationMs],
            ];
        }

        $status     = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $headerSize = (int)curl_getinfo($ch, CURLINFO_HEADER_SIZE);
        $rawHeaders = substr($raw, 0, $headerSize);
        $rawBody    = substr($raw, $headerSize);
        curl_close($ch);

        $meta = ['duration_ms' => $durationMs];
        if (preg_match('/^Retry-After:\s*(\d+)/mi', $rawHeaders, $m)) {
            $meta['retry_after'] = (int)$m[1];
        }
        if (preg_match('/^request-id:\s*([^\r\n]+)/mi', $rawHeaders, $m)) {
            $meta['graph_request_id'] = trim($m[1]);
        }

        // 204/205 sem corpo (ex.: DELETE, sendMail ok) -> sucesso sem data.
        $json = ($rawBody === '' ) ? null : json_decode($rawBody, true);
        $ok = ($status >= 200 && $status < 300);

        $error = null; $errorCode = null;
        if (!$ok) {
            if (is_array($json) && isset($json['error'])) {
                $errorCode = (string)($json['error']['code'] ?? ('HTTP_' . $status));
                $error     = (string)($json['error']['message'] ?? $errorCode);
            } else {
                $errorCode = 'HTTP_' . $status;
                $error     = 'HTTP_' . $status;
            }
        }

        return [
            'ok'         => $ok,
            'status'     => $status,
            'data'       => is_array($json) ? $json : null,
            'error'      => $error,
            'error_code' => $errorCode,
            'meta'       => $meta,
        ];
    }

    private function pause(float $seconds): void
    {
        if ($seconds > 0) { usleep((int)round($seconds * 1_000_000)); }
    }
}
