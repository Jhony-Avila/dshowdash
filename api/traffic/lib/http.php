<?php
/**
 * Traffic API - HTTP helper (chamada externa server-side)
 * @version 1.0.0
 * Molde: api/currencies/history.php (stream_context, timeout, sem cURL).
 */

if (!function_exists('traffic_http_get_json')) {
    /**
     * GET JSON com timeout. Retorna array decodificado ou null em falha.
     * NUNCA loga a URL completa (pode conter a key).
     */
    /**
     * GET com o STATUS HTTP (Trânsito 23/11/2026): a falha do provedor deixa de virar "sem dados".
     * @return array{status:int, json:?array}  status 0 = sem resposta. NUNCA loga a URL (pode conter a key).
     */
    function traffic_http_get(string $url, int $timeout = 8, array $headers = []): array {
        $hdr = "User-Agent: DShowDash/1.0 (traffic-monitor)\r\n";
        foreach ($headers as $k => $v) { $hdr .= $k . ': ' . $v . "\r\n"; }
        $ctx = stream_context_create([
            'http' => ['method' => 'GET', 'timeout' => $timeout, 'header' => $hdr, 'ignore_errors' => true],
            'ssl'  => ['verify_peer' => true, 'verify_peer_name' => true],
        ]);
        $raw = @file_get_contents($url, false, $ctx);
        $status = 0;
        foreach (($http_response_header ?? []) as $h) {
            if (preg_match('#^HTTP/\S+\s+(\d{3})#', (string) $h, $m) === 1) { $status = (int) $m[1]; }   // a última linha de status vale
        }
        if ($raw === false) { return ['status' => 0, 'json' => null]; }
        $data = $raw === '' ? null : json_decode($raw, true);
        return ['status' => $status, 'json' => is_array($data) ? $data : null];
    }

    /**
     * Classe da falha (para health e qualidade), sem expor detalhe do provedor:
     * ok | cota (429, ou 403 de limite/QPS) | chave (401/403 de chave) | servidor (5xx) | sem_resposta (0) | http_<n>
     */
    function traffic_http_classificar(int $status, ?array $json): string {
        if ($status >= 200 && $status < 300) { return 'ok'; }
        if ($status === 0) { return 'sem_resposta'; }
        if ($status === 429) { return 'cota'; }
        $txt = strtolower(json_encode($json ?? []) ?: '');
        if ($status === 403 && preg_match('/over|limit|quota|qps|rate/', $txt) === 1) { return 'cota'; }
        if ($status === 401 || $status === 403) { return 'chave'; }
        if ($status >= 500) { return 'servidor'; }
        return 'http_' . $status;
    }

    /** Compatível com o uso antigo: devolve o JSON SÓ em 2xx (JSON de ERRO do provedor nunca mais conta como dado). */
    function traffic_http_get_json(string $url, int $timeout = 8, array $headers = []): ?array {
        $r = traffic_http_get($url, $timeout, $headers);
        return ($r['status'] >= 200 && $r['status'] < 300) ? $r['json'] : null;
    }

}
