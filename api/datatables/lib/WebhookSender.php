<?php
// DataTables / WebhookSender - entrega de alerta por webhook generico (§26.4)
// @version 1.0.0
// @created 2026-07-20
// @app DataTables
//
// Primeiro canal EXTERNO com entrega real. Contrato de saida:
//
//   POST <url>
//   Content-Type: application/json
//   X-DataTables-Event: alert
//   X-DataTables-Delivery: <uuid>            id unico da tentativa
//   X-DataTables-Timestamp: <unix>
//   X-DataTables-Signature: sha256=<hmac>    HMAC-SHA256 do corpo, chave = segredo do canal
//
// A assinatura permite ao receptor provar que a mensagem veio daqui e nao foi
// adulterada. Sem segredo configurado o header simplesmente nao vai - o envio
// continua funcionando, so nao e verificavel.
//
// O QUE NUNCA VAI NO CORPO: credencial de conexao, string de conexao, senha.
// O alerta carrega nome/host/status, que sao dados de diagnostico (§29).
declare(strict_types=1);

require_once __DIR__ . '/Crypto.php';

final class DtWebhookSender
{
    private const TIMEOUT_SEC  = 10;
    private const CONNECT_SEC  = 5;
    private const MAX_ATTEMPTS = 3;
    private const UA           = 'DShowDash-DataTables/1.0 (webhook)';

    /** Corpo de resposta lido so o suficiente para diagnostico. */
    private const MAX_RESPONSE_BYTES = 2048;

    /**
     * Envia um alerta para o webhook configurado.
     *
     * @param array $channel Linha de DT_Canal_Alerta (config_json + secret_encrypted)
     * @param array $alert   Dados do alerta ja montados
     * @return array{ok:bool, status:?int, attempts:int, ms:int, error:?string, delivery_id:string}
     */
    public static function send(array $channel, array $alert): array
    {
        $delivery = bin2hex(random_bytes(16));

        $cfg = [];
        if (!empty($channel['config_json'])) {
            $cfg = json_decode((string)$channel['config_json'], true) ?: [];
        }

        $url = trim((string)($cfg['url'] ?? $cfg['webhook_url'] ?? ''));
        if ($url === '' || !preg_match('#^https?://#i', $url)) {
            return self::fail($delivery, 'Webhook sem URL valida configurada', null, 0, 0);
        }

        // Segredo do canal assina o corpo. Ausente => envia sem assinatura.
        $secret = '';
        $stored = (string)($channel['secret_encrypted'] ?? '');
        if ($stored !== '') {
            try {
                $secret = DtCrypto::looksEncrypted($stored) ? DtCrypto::decrypt($stored) : $stored;
            } catch (Throwable $e) {
                return self::fail($delivery, 'Segredo do canal nao pode ser decifrado', null, 0, 0);
            }
        }

        $body = json_encode(self::buildPayload($alert, $delivery), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if ($body === false) {
            return self::fail($delivery, 'Falha ao serializar o payload', null, 0, 0);
        }

        $ts      = time();
        $headers = [
            'Content-Type: application/json; charset=utf-8',
            'Accept: application/json',
            'User-Agent: ' . self::UA,
            'X-DataTables-Event: alert',
            'X-DataTables-Delivery: ' . $delivery,
            'X-DataTables-Timestamp: ' . $ts,
        ];
        if ($secret !== '') {
            // Assina timestamp + corpo: sem o timestamp o receptor nao consegue
            // rejeitar replay de uma mensagem legitima antiga.
            $sig = hash_hmac('sha256', $ts . '.' . $body, $secret);
            $headers[] = 'X-DataTables-Signature: sha256=' . $sig;
        }
        // Cabecalhos extras opcionais (ex.: token de um gateway).
        foreach (($cfg['headers'] ?? []) as $k => $v) {
            if (is_string($k) && is_scalar($v) && !preg_match('/^x-datatables-/i', $k)) {
                $headers[] = $k . ': ' . $v;
            }
        }

        $t0       = microtime(true);
        $attempts = 0;
        $lastErr  = null;
        $lastCode = null;

        while ($attempts < self::MAX_ATTEMPTS) {
            $attempts++;
            [$code, $resp, $errNo, $errMsg] = self::post($url, $body, $headers);

            // 2xx = entregue.
            if ($errNo === 0 && $code >= 200 && $code < 300) {
                return [
                    'ok' => true, 'status' => $code, 'attempts' => $attempts,
                    'ms' => (int)round((microtime(true) - $t0) * 1000),
                    'error' => null, 'delivery_id' => $delivery,
                ];
            }

            $lastCode = $code ?: null;
            $lastErr  = $errNo !== 0
                ? self::safeError($errNo, $errMsg)
                : "HTTP {$code}" . ($resp !== '' ? ': ' . mb_substr(trim($resp), 0, 200) : '');

            // 4xx (exceto 408/429) e erro do REMETENTE: repetir nao ajuda e so
            // gera carga. 5xx e rede sao transitorios e merecem nova tentativa.
            if ($errNo === 0 && $code >= 400 && $code < 500 && $code !== 408 && $code !== 429) {
                break;
            }
            if ($attempts < self::MAX_ATTEMPTS) {
                usleep(250000 * $attempts);   // backoff progressivo: 0,25s, 0,5s
            }
        }

        return self::fail($delivery, $lastErr, $lastCode, $attempts,
            (int)round((microtime(true) - $t0) * 1000));
    }

    /** Contrato do corpo. Estavel: consumidores dependem destas chaves. */
    private static function buildPayload(array $a, string $delivery): array
    {
        return [
            'schema'      => 'dshowdash.datatables.alert/v1',
            'delivery_id' => $delivery,
            'sent_at'     => date('c'),
            'alert'       => [
                'id'            => (int)($a['id'] ?? 0),
                'fingerprint'   => (string)($a['fingerprint'] ?? ''),
                'type'          => (string)($a['alert_type'] ?? ''),
                'severity'      => (string)($a['severity'] ?? ''),
                'status'        => (string)($a['status'] ?? 'active'),
                'title'         => (string)($a['title'] ?? ''),
                'message'       => (string)($a['message'] ?? ''),
                'occurrences'   => (int)($a['occurrences'] ?? 1),
                'first_seen_at' => $a['first_seen_at'] ?? null,
                'last_seen_at'  => $a['last_seen_at'] ?? null,
            ],
            'target' => [
                'type'            => (string)($a['target_type'] ?? ''),
                'id'              => $a['target_id'] !== null ? (int)$a['target_id'] : null,
                'connection_id'   => $a['connection_id'] !== null ? (int)$a['connection_id'] : null,
                'connection_name' => $a['connection_name'] ?? null,
                'environment'     => $a['environment_label'] ?? null,
            ],
            'source' => [
                'app'   => 'DataTables',
                'panel' => '#/panel-datatables',
            ],
        ];
    }

    /** @return array{0:int,1:string,2:int,3:string} [httpCode, body, errNo, errMsg] */
    private static function post(string $url, string $body, array $headers): array
    {
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL            => $url,
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => $body,
            CURLOPT_HTTPHEADER     => $headers,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => self::TIMEOUT_SEC,
            CURLOPT_CONNECTTIMEOUT => self::CONNECT_SEC,
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_SSL_VERIFYHOST => 2,
            // Redirect em POST vira GET em alguns servidores: nao seguir evita
            // "entrega" fantasma que nunca chegou ao destino real.
            CURLOPT_FOLLOWLOCATION => false,
        ]);

        $resp  = curl_exec($ch);
        $code  = (int)curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
        $errNo = curl_errno($ch);
        $errMs = curl_error($ch);
        curl_close($ch);

        return [$code, is_string($resp) ? mb_substr($resp, 0, self::MAX_RESPONSE_BYTES) : '', $errNo, $errMs];
    }

    /** Mensagem de erro sem credencial. Hostname permanece (diagnostico §29). */
    private static function safeError(int $errNo, string $msg): string
    {
        $msg = preg_replace('#://([^/:@\s]+):([^/@\s]+)@#', '://$1:***@', $msg) ?? $msg;
        $msg = preg_replace(
            '/\b(api[_-]?key|apikey|token|secret|password|signature|sig)\s*=\s*[^\s&;"\']+/i',
            '$1=***', $msg) ?? $msg;
        return mb_substr("curl({$errNo}): {$msg}", 0, 500);
    }

    private static function fail(string $delivery, ?string $err, ?int $code, int $attempts, int $ms): array
    {
        return [
            'ok' => false, 'status' => $code, 'attempts' => $attempts, 'ms' => $ms,
            'error' => $err !== null ? mb_substr($err, 0, 900) : 'erro desconhecido',
            'delivery_id' => $delivery,
        ];
    }

    /**
     * Envio de teste, para o operador validar a configuracao sem esperar
     * um incidente real acontecer.
     */
    public static function sendTest(array $channel): array
    {
        return self::send($channel, [
            'id' => 0,
            'fingerprint' => 'teste',
            'alert_type' => 'webhook_test',
            'severity' => 'informativo',
            'status' => 'active',
            'title' => 'Teste de webhook do DataTables',
            'message' => 'Se voce recebeu isto, a configuracao do webhook esta correta.',
            'occurrences' => 1,
            'first_seen_at' => date('Y-m-d H:i:s'),
            'last_seen_at' => date('Y-m-d H:i:s'),
            'target_type' => 'channel',
            'target_id' => null,
            'connection_id' => null,
            'connection_name' => null,
            'environment_label' => null,
        ]);
    }
}
