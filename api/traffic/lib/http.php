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
    function traffic_http_get_json(string $url, int $timeout = 8, array $headers = []): ?array {
        $hdr = "User-Agent: DShowDash/1.0 (traffic-monitor)\r\n";
        foreach ($headers as $k => $v) { $hdr .= $k . ': ' . $v . "\r\n"; }

        $ctx = stream_context_create([
            'http' => [
                'method'        => 'GET',
                'timeout'       => $timeout,
                'header'        => $hdr,
                'ignore_errors' => true,
            ],
            'ssl' => [
                'verify_peer'      => true,
                'verify_peer_name' => true,
            ],
        ]);

        $raw = @file_get_contents($url, false, $ctx);
        if ($raw === false || $raw === '') {
            return null;
        }
        $data = json_decode($raw, true);
        return is_array($data) ? $data : null;
    }
}
