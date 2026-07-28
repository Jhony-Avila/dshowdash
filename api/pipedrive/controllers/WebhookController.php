<?php
// Pipedrive / WebhookController - receptor externo + gestao da fila e dos webhooks
// @version 1.0.0
// @created 2026-07-21
// @app Pipedrive Analytics
//
// receive()  POST /webhook   EXTERNO. Autenticado por HTTP Basic Auth (creds no .env),
//            NAO por sessao/CSRF. Roteado ANTES dos gates em index.php. Grava o evento,
//            enfileira e responde 2XX rapido (< 10s) — o trabalho real roda na drenagem.
// queue()    /queue          admin(80): observabilidade e drenagem manual (diagnostico).
// admin()    /webhooks       admin(80): registrar/listar/remover webhooks no Pipedrive.
declare(strict_types=1);

final class PipeWebhookController
{
    private const RECEIVER_URL = 'https://dshowdash.com.br/api/pipedrive/webhook';
    private const MAX_BODY = 1_000_000; // 1 MB — payloads do Pipedrive sao pequenos

    // ── Receptor externo ────────────────────────────────────────────

    public static function receive(string $method, PDO $pdo): void
    {
        if ($method !== 'POST') {
            http_response_code(405);
            header('Allow: POST');
            exit;
        }
        if (!self::checkBasicAuth()) {
            // Sem detalhes: nao revelar se e user/senha, se esta configurado, etc.
            http_response_code(401);
            header('Content-Type: application/json');
            echo '{"ok":false}';
            exit;
        }

        $raw = file_get_contents('php://input');
        if ($raw === false) { $raw = ''; }
        if (strlen($raw) > self::MAX_BODY) {
            http_response_code(413);
            exit;
        }

        $payload = json_decode($raw, true);
        // Responder 2XX mesmo para payload estranho evita retry/ban do Pipedrive.
        $result = ['status' => 'ignored', 'reason' => 'unparseable'];
        if (is_array($payload)) {
            try {
                $svc = new PipeQueueService($pdo);
                $result = $svc->ingestWebhook($payload);
            } catch (\Throwable $e) {
                error_log('[pipedrive] webhook ingest falhou: ' . $e->getMessage());
                $result = ['status' => 'error'];
                // ainda respondemos 200: o dado esta perdido nesta entrega, mas a
                // reconciliacao por polling recupera; retry do Pipedrive nao ajudaria.
            }
        }

        http_response_code(200);
        header('Content-Type: application/json');
        echo json_encode(['ok' => true] + $result, JSON_UNESCAPED_UNICODE);
        exit;
    }

    /** Basic Auth em tempo constante contra as credenciais do .env. */
    private static function checkBasicAuth(): bool
    {
        $expUser = (string)(getenv('PIPEDRIVE_WEBHOOK_USER') ?: ($_ENV['PIPEDRIVE_WEBHOOK_USER'] ?? ''));
        $expPass = (string)(getenv('PIPEDRIVE_WEBHOOK_PASS') ?: ($_ENV['PIPEDRIVE_WEBHOOK_PASS'] ?? ''));
        if ($expUser === '' || $expPass === '') {
            error_log('[pipedrive] webhook recebido mas PIPEDRIVE_WEBHOOK_USER/PASS ausentes no .env');
            return false;
        }

        [$user, $pass] = self::readBasicCreds();
        // hash_equals em ambos (sem short-circuit) para nao vazar qual campo diferiu.
        $okUser = hash_equals($expUser, (string)$user);
        $okPass = hash_equals($expPass, (string)$pass);
        return $okUser && $okPass;
    }

    /** Le user/senha de PHP_AUTH_* ou do header Authorization: Basic. */
    private static function readBasicCreds(): array
    {
        $user = $_SERVER['PHP_AUTH_USER'] ?? null;
        $pass = $_SERVER['PHP_AUTH_PW'] ?? null;
        if ($user !== null) { return [$user, $pass]; }

        $hdr = $_SERVER['HTTP_AUTHORIZATION'] ?? ($_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '');
        if (stripos($hdr, 'Basic ') === 0) {
            $decoded = base64_decode(substr($hdr, 6), true);
            if ($decoded !== false && strpos($decoded, ':') !== false) {
                return explode(':', $decoded, 2);
            }
        }
        return [null, null];
    }

    // ── Fila (admin) ────────────────────────────────────────────────

    public static function queue(string $method, array $segments, PDO $pdo): void
    {
        AuthHelpers::requireAuth(80);
        $sub = $segments[1] ?? '';
        $repo = new PipeQueueRepository($pdo);

        if ($sub === '' && $method === 'GET') {
            ApiResponse::success([
                'stats' => $repo->stats(),
                'dead'  => $repo->recentDead(20),
            ], ['ts' => date('c')]);
            return;
        }
        if ($sub === 'drain' && $method === 'POST') {
            $body = pipe_body();
            $limit = isset($body['limit']) && is_numeric($body['limit']) ? (int)$body['limit'] : 100;
            $svc = new PipeQueueService($pdo);
            $r = $svc->drainQueue(max(1, min($limit, 500)));
            if (($r['error'] ?? '') === 'SEM_CREDENCIAL') {
                ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 422, ['reason' => 'SEM_CREDENCIAL']);
            }
            ApiResponse::success($r, ['action' => 'drain']);
            return;
        }
        if ($sub === 'requeue' && $method === 'POST') {
            $body = pipe_body();
            $id = isset($body['id']) && is_numeric($body['id']) ? (int)$body['id'] : 0;
            if ($id <= 0) { ApiResponse::error(ApiResponse::ERR_ID_REQUIRED, 400); }
            $ok = $repo->requeueDead($id);
            ApiResponse::success(['requeued' => $ok, 'id' => $id]);
            return;
        }
        ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404, ['message' => 'Rota de fila desconhecida']);
    }

    // ── Gestao dos webhooks no Pipedrive (admin) ────────────────────

    public static function admin(string $method, array $segments, PDO $pdo): void
    {
        AuthHelpers::requireAuth(80);
        $accounts = new PipeAccountRepository($pdo);
        $token = $accounts->getActiveToken();
        if ($token === null) {
            ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 422, [
                'reason' => 'SEM_CREDENCIAL',
                'message' => 'Conecte um token na tela de Configuracoes antes de gerenciar webhooks.',
            ]);
        }
        $client = new PipedriveClient($token);
        $id = $segments[1] ?? '';

        // GET /webhooks -> estado do receptor + lista atual no Pipedrive
        if ($id === '' && $method === 'GET') {
            $res = $client->request('GET', 'v1root', '/webhooks');
            $accounts->logApiRequest('GET', '/webhooks', $res);
            $lista = [];
            foreach ((is_array($res['data'] ?? null) ? $res['data'] : []) as $w) {
                $lista[] = self::maskWebhook($w);
            }
            ApiResponse::success([
                'receiver' => [
                    'url' => self::RECEIVER_URL,
                    'basic_auth_configured' => self::basicAuthConfigured(),
                ],
                'webhooks' => $lista,
            ]);
            return;
        }

        // POST /webhooks/register -> cria o webhook apontando para o receptor
        if ($id === 'register' && $method === 'POST') {
            if (!self::basicAuthConfigured()) {
                ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 422, [
                    'reason' => 'BASIC_AUTH_AUSENTE',
                    'message' => 'PIPEDRIVE_WEBHOOK_USER/PASS ausentes no .env.',
                ]);
            }
            $body = pipe_body();
            $reqBody = [
                'subscription_url'   => self::RECEIVER_URL,
                'event_action'       => self::sanitizeEvent($body['event_action'] ?? '*'),
                'event_object'       => self::sanitizeEvent($body['event_object'] ?? '*'),
                'http_auth_user'     => (string)getenv('PIPEDRIVE_WEBHOOK_USER'),
                'http_auth_password' => (string)getenv('PIPEDRIVE_WEBHOOK_PASS'),
                'version'            => '2.0',
            ];
            $res = $client->request('POST', 'v1root', '/webhooks', [], $reqBody);
            $accounts->logApiRequest('POST', '/webhooks', $res);
            if (!($res['ok'] ?? false)) {
                ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 422, [
                    'reason' => 'PIPEDRIVE_REJEITOU',
                    'message' => (string)($res['error'] ?? 'Pipedrive recusou o registro do webhook.'),
                    'http_status' => $res['status'] ?? null,
                ]);
            }
            ApiResponse::success(['webhook' => self::maskWebhook(is_array($res['data'] ?? null) ? $res['data'] : [])], ['action' => 'register']);
            return;
        }

        // DELETE /webhooks/{id} -> remove no Pipedrive
        if ($id !== '' && $id !== 'register' && $method === 'DELETE') {
            if (!ctype_digit((string)$id)) { ApiResponse::error(ApiResponse::ERR_ID_REQUIRED, 400); }
            $res = $client->request('DELETE', 'v1root', '/webhooks/' . $id);
            $accounts->logApiRequest('DELETE', '/webhooks/{id}', $res);
            if (!($res['ok'] ?? false) && (int)($res['status'] ?? 0) !== 404) {
                ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 422, [
                    'reason' => 'PIPEDRIVE_REJEITOU',
                    'message' => (string)($res['error'] ?? 'Pipedrive recusou a remocao.'),
                ]);
            }
            ApiResponse::success(['deleted' => true, 'id' => (int)$id], ['action' => 'delete']);
            return;
        }

        ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404, ['message' => 'Rota de webhooks desconhecida']);
    }

    // ── helpers ─────────────────────────────────────────────────────

    private static function basicAuthConfigured(): bool
    {
        return (getenv('PIPEDRIVE_WEBHOOK_USER') ?: '') !== '' && (getenv('PIPEDRIVE_WEBHOOK_PASS') ?: '') !== '';
    }

    private static function sanitizeEvent($v): string
    {
        $v = strtolower(trim((string)$v));
        // allowlist: '*' ou tokens simples [a-z_]. Evita injetar valores estranhos na API.
        return ($v === '' || $v === '*' || preg_match('/^[a-z_]+$/', $v) !== 1) ? '*' : $v;
    }

    /** Nunca devolver a senha do webhook ao front (mesmo mascarada, some do payload). */
    private static function maskWebhook(array $w): array
    {
        unset($w['http_auth_password']);
        return [
            'id'               => $w['id'] ?? null,
            'subscription_url' => $w['subscription_url'] ?? null,
            'event_action'     => $w['event_action'] ?? null,
            'event_object'     => $w['event_object'] ?? null,
            'http_auth_user'   => $w['http_auth_user'] ?? null,
            'version'          => $w['version'] ?? ($w['type'] ?? null),
            'is_active'        => $w['is_active'] ?? ($w['active_flag'] ?? null),
            'add_time'         => $w['add_time'] ?? null,
        ];
    }
}
