<?php
// Outlook / MessageController - leitura, escrita e acoes de mensagens (Fase 1)
// @version 1.1.0
// @created 2026-07-21
// @app Integracao Outlook
//
// IMPORTANTE: o id da mensagem vai em QUERY/BODY (nao no path). IDs do Graph podem
// conter '/', '+', '=' — que o nginx decodifica de %2F e quebraria o PATH_INFO.
// Por isso as rotas sao verbos ('/messages/reply' + {id}) e nao '/messages/{id}/reply'.
//
// Rotas:
//   GET  /messages?account_id=&folder=&top=&skiptoken=   lista por pasta
//   GET  /messages/item?account_id=&id=                  abre uma mensagem
//   GET  /messages/attachments?account_id=&id=           metadados de anexos
//   POST /messages/send         {account_id, subject, body_html, to[], cc[], bcc[], importance}
//   POST /messages/reply        {account_id, id, comment, all}
//   POST /messages/forward      {account_id, id, to[], comment}
//   POST /messages/mark-read    {account_id, id, is_read}
//   POST /messages/flag         {account_id, id, flagged}
//   POST /messages/importance   {account_id, id, importance}
//   POST /messages/categories   {account_id, id, categories[]}
//   POST /messages/move         {account_id, id, destination}
//   POST /messages/archive      {account_id, id}
//   POST /messages/delete       {account_id, id}
//   POST /messages/draft        {account_id, ...}          cria rascunho -> {id}
//   POST /messages/update-draft {account_id, id, ...}      autosave
//   POST /messages/send-draft   {account_id, id}
//   POST /messages/bulk-action  {account_id, ids[], action, destination?}
declare(strict_types=1);

final class OutlookMessageController
{
    public static function route(string $method, array $segments, PDO $pdo): void
    {
        $sub = $segments[1] ?? '';

        // GET: lista, item, attachments
        if ($method === 'GET') {
            switch ($sub) {
                case '':           self::listMessages($pdo); return;
                case 'item':       self::getMessage($pdo); return;
                case 'attachments':self::attachments($pdo); return;
                case 'attachment': self::downloadAttachment($pdo); return;
                default:
                    ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404, ['message' => 'Rota GET desconhecida.']);
                    return;
            }
        }

        if ($method !== 'POST') {
            ApiResponse::error(ApiResponse::ERR_METHOD_NOT_ALLOWED, 405);
            return;
        }

        // POST: acoes (id no corpo)
        switch ($sub) {
            case 'send':         self::send($pdo); return;
            case 'reply':        self::reply($pdo); return;
            case 'forward':      self::forward($pdo); return;
            case 'mark-read':    self::markRead($pdo); return;
            case 'flag':         self::flag($pdo); return;
            case 'importance':   self::importance($pdo); return;
            case 'categories':   self::categories($pdo); return;
            case 'move':         self::move($pdo); return;
            case 'archive':      self::archive($pdo); return;
            case 'delete':       self::deleteMsg($pdo); return;
            case 'draft':        self::createDraft($pdo); return;
            case 'update-draft': self::updateDraft($pdo); return;
            case 'send-draft':   self::sendDraft($pdo); return;
            case 'bulk-action':  self::bulk($pdo); return;
            case 'schedule':
            case 'schedule-cancel':
            case 'schedule-sendnow':
                // Agendamento real = rascunho no Graph + job/fila local (§13.1) — Fase 2.
                ApiResponse::error(ApiResponse::ERR_DATABASE_ERROR, 503, [
                    'message' => 'O agendamento de envio entra na Fase 2 (fila + job).',
                ]);
                return;
            default:
                ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404, ['message' => 'Acao desconhecida.']);
        }
    }

    // ── infra ───────────────────────────────────────────────────────────
    private static function service(PDO $pdo): OutlookMessageService
    {
        return new OutlookMessageService($pdo, new OutlookAuthService($pdo));
    }

    /** account_id do body (POST) ou query (GET), validado como pertencente ao usuario. */
    private static function ctx(PDO $pdo, ?array $body = null): ?array
    {
        $userId = getCurrentUserId();
        $accountId = (int)($body['account_id'] ?? ($_GET['account_id'] ?? 0));
        if ($accountId <= 0) {
            ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 400, ['message' => 'account_id obrigatorio.']);
            return null;
        }
        $repo = new OutlookAccountRepository($pdo);
        if ($repo->getPublic($userId, $accountId) === null) {
            ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404, ['message' => 'Conta nao encontrada.']);
            return null;
        }
        return ['user_id' => $userId, 'account_id' => $accountId];
    }

    private static function requireId(array $body): ?string
    {
        $id = trim((string)($body['id'] ?? ''));
        if ($id === '') {
            ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 400, ['message' => 'id da mensagem obrigatorio.']);
            return null;
        }
        return $id;
    }

    private static function requireIdQuery(): ?string
    {
        $id = trim((string)($_GET['id'] ?? ''));
        if ($id === '') {
            ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 400, ['message' => 'id da mensagem obrigatorio.']);
            return null;
        }
        return $id;
    }

    /** Traduz o envelope do service em resposta HTTP coerente. */
    private static function respond(array $res, array $successPayload): void
    {
        if ($res['ok'] ?? false) {
            ApiResponse::success($successPayload);
            return;
        }
        $code = $res['error_code'] ?? 'GRAPH_ERROR';
        if ($code === 'NEEDS_AUTH') {
            ApiResponse::error('NEEDS_AUTH', 401, ['message' => 'A conta requer nova autenticacao. Reconecte-a.']);
            return;
        }
        $http = (int)($res['http'] ?? 0);
        $status = ($http >= 400 && $http < 600) ? $http : 502;
        ApiResponse::error(ApiResponse::ERR_INTERNAL_ERROR, $status, [
            'message' => 'Falha ao comunicar com a Microsoft.',
            'code'    => $code,
        ]);
    }

    private static function emailList($v): array
    {
        if (is_string($v)) { $v = preg_split('/[;,]/', $v) ?: []; }
        if (!is_array($v)) { return []; }
        $out = [];
        foreach ($v as $e) {
            $e = trim((string)$e);
            if ($e !== '' && filter_var($e, FILTER_VALIDATE_EMAIL)) { $out[] = $e; }
        }
        return array_values(array_unique($out));
    }

    // ── GET ─────────────────────────────────────────────────────────────
    private static function listMessages(PDO $pdo): void
    {
        $ctx = self::ctx($pdo); if ($ctx === null) { return; }
        $folder = (string)($_GET['folder'] ?? 'inbox');
        $top = (int)($_GET['top'] ?? 25);
        $skiptoken = isset($_GET['skiptoken']) ? (string)$_GET['skiptoken'] : null;
        $q = isset($_GET['q']) ? (string)$_GET['q'] : null;
        $filter = isset($_GET['filter']) ? (string)$_GET['filter'] : null;
        $category = isset($_GET['category']) ? (string)$_GET['category'] : null;
        $res = self::service($pdo)->listMessages($ctx['user_id'], $ctx['account_id'], $folder, $top, $skiptoken, $q, $filter, $category);
        self::respond($res, ['items' => $res['items'] ?? [], 'next' => $res['next'] ?? null]);
    }

    private static function getMessage(PDO $pdo): void
    {
        $ctx = self::ctx($pdo); if ($ctx === null) { return; }
        $id = self::requireIdQuery(); if ($id === null) { return; }
        $res = self::service($pdo)->getMessage($ctx['user_id'], $ctx['account_id'], $id);
        self::respond($res, ['message' => $res['message'] ?? null]);
    }

    private static function attachments(PDO $pdo): void
    {
        $ctx = self::ctx($pdo); if ($ctx === null) { return; }
        $id = self::requireIdQuery(); if ($id === null) { return; }
        $res = self::service($pdo)->listAttachments($ctx['user_id'], $ctx['account_id'], $id);
        self::respond($res, ['items' => $res['items'] ?? []]);
    }

    // ── POST ────────────────────────────────────────────────────────────
    private static function send(PDO $pdo): void
    {
        $body = outlook_body();
        $ctx = self::ctx($pdo, $body); if ($ctx === null) { return; }
        $to = self::emailList($body['to'] ?? []);
        if (empty($to)) { ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 400, ['message' => 'Informe ao menos um destinatario.']); return; }
        if (trim((string)($body['subject'] ?? '')) === '' && empty($body['allow_empty_subject'])) {
            // assunto vazio permitido, mas sinalizado; o front ja confirma
        }
        $res = self::service($pdo)->sendMail($ctx['user_id'], $ctx['account_id'], [
            'subject'    => (string)($body['subject'] ?? ''),
            'body_html'  => (string)($body['body_html'] ?? ''),
            'to'         => $to,
            'cc'         => self::emailList($body['cc'] ?? []),
            'bcc'        => self::emailList($body['bcc'] ?? []),
            'importance' => $body['importance'] ?? null,
            'attachments'=> is_array($body['attachments'] ?? null) ? $body['attachments'] : [],
        ]);
        self::respond($res, ['sent' => true]);
    }

    private static function downloadAttachment(PDO $pdo): void
    {
        $ctx = self::ctx($pdo); if ($ctx === null) { return; }
        $id = self::requireIdQuery(); if ($id === null) { return; }
        $aid = trim((string)($_GET['aid'] ?? ''));
        if ($aid === '') { ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 400, ['message' => 'aid obrigatorio.']); return; }
        $res = self::service($pdo)->getAttachmentContent($ctx['user_id'], $ctx['account_id'], $id, $aid);
        if (!($res['ok'] ?? false)) {
            $code = $res['error_code'] ?? 'GRAPH_ERROR';
            if ($code === 'NEEDS_AUTH') { ApiResponse::error('NEEDS_AUTH', 401, ['message' => 'Reconecte a conta.']); return; }
            ApiResponse::error(ApiResponse::ERR_INTERNAL_ERROR, 502, ['message' => 'Falha ao baixar o anexo.']);
            return;
        }
        header_remove('Content-Type');
        header('Content-Type: ' . $res['contentType']);
        header('Content-Disposition: inline; filename="' . str_replace(['"', "\r", "\n"], '', (string)$res['name']) . '"');
        header('Content-Length: ' . strlen((string)$res['bytes']));
        header('X-Content-Type-Options: nosniff');
        echo $res['bytes'];
    }

    private static function reply(PDO $pdo): void
    {
        $body = outlook_body();
        $ctx = self::ctx($pdo, $body); if ($ctx === null) { return; }
        $id = self::requireId($body); if ($id === null) { return; }
        $res = self::service($pdo)->reply($ctx['user_id'], $ctx['account_id'], $id, (string)($body['comment'] ?? ''), !empty($body['all']));
        self::respond($res, ['sent' => true]);
    }

    private static function forward(PDO $pdo): void
    {
        $body = outlook_body();
        $ctx = self::ctx($pdo, $body); if ($ctx === null) { return; }
        $id = self::requireId($body); if ($id === null) { return; }
        $to = self::emailList($body['to'] ?? []);
        if (empty($to)) { ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 400, ['message' => 'Informe ao menos um destinatario.']); return; }
        $res = self::service($pdo)->forward($ctx['user_id'], $ctx['account_id'], $id, $to, (string)($body['comment'] ?? ''));
        self::respond($res, ['sent' => true]);
    }

    private static function markRead(PDO $pdo): void
    {
        $body = outlook_body();
        $ctx = self::ctx($pdo, $body); if ($ctx === null) { return; }
        $id = self::requireId($body); if ($id === null) { return; }
        $res = self::service($pdo)->markRead($ctx['user_id'], $ctx['account_id'], $id, (bool)($body['is_read'] ?? true));
        self::respond($res, ['ok' => true]);
    }

    private static function flag(PDO $pdo): void
    {
        $body = outlook_body();
        $ctx = self::ctx($pdo, $body); if ($ctx === null) { return; }
        $id = self::requireId($body); if ($id === null) { return; }
        $res = self::service($pdo)->setFlag($ctx['user_id'], $ctx['account_id'], $id, (bool)($body['flagged'] ?? true));
        self::respond($res, ['ok' => true]);
    }

    private static function importance(PDO $pdo): void
    {
        $body = outlook_body();
        $ctx = self::ctx($pdo, $body); if ($ctx === null) { return; }
        $id = self::requireId($body); if ($id === null) { return; }
        $res = self::service($pdo)->setImportance($ctx['user_id'], $ctx['account_id'], $id, (string)($body['importance'] ?? 'normal'));
        self::respond($res, ['ok' => true]);
    }

    private static function categories(PDO $pdo): void
    {
        $body = outlook_body();
        $ctx = self::ctx($pdo, $body); if ($ctx === null) { return; }
        $id = self::requireId($body); if ($id === null) { return; }
        $cats = is_array($body['categories'] ?? null) ? $body['categories'] : [];
        $res = self::service($pdo)->setCategories($ctx['user_id'], $ctx['account_id'], $id, $cats);
        self::respond($res, ['ok' => true]);
    }

    private static function move(PDO $pdo): void
    {
        $body = outlook_body();
        $ctx = self::ctx($pdo, $body); if ($ctx === null) { return; }
        $id = self::requireId($body); if ($id === null) { return; }
        $dest = trim((string)($body['destination'] ?? ''));
        if ($dest === '') { ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 400, ['message' => 'destination obrigatorio.']); return; }
        $res = self::service($pdo)->move($ctx['user_id'], $ctx['account_id'], $id, $dest);
        self::respond($res, ['ok' => true, 'id' => $res['id'] ?? null]);
    }

    private static function archive(PDO $pdo): void
    {
        $body = outlook_body();
        $ctx = self::ctx($pdo, $body); if ($ctx === null) { return; }
        $id = self::requireId($body); if ($id === null) { return; }
        $res = self::service($pdo)->archive($ctx['user_id'], $ctx['account_id'], $id);
        self::respond($res, ['ok' => true, 'id' => $res['id'] ?? null]);
    }

    private static function deleteMsg(PDO $pdo): void
    {
        $body = outlook_body();
        $ctx = self::ctx($pdo, $body); if ($ctx === null) { return; }
        $id = self::requireId($body); if ($id === null) { return; }
        $res = self::service($pdo)->delete($ctx['user_id'], $ctx['account_id'], $id);
        self::respond($res, ['ok' => true]);
    }

    private static function createDraft(PDO $pdo): void
    {
        $body = outlook_body();
        $ctx = self::ctx($pdo, $body); if ($ctx === null) { return; }
        $res = self::service($pdo)->createDraft($ctx['user_id'], $ctx['account_id'], self::draftFields($body));
        self::respond($res, ['id' => $res['id'] ?? null, 'message' => $res['message'] ?? null]);
    }

    private static function updateDraft(PDO $pdo): void
    {
        $body = outlook_body();
        $ctx = self::ctx($pdo, $body); if ($ctx === null) { return; }
        $id = self::requireId($body); if ($id === null) { return; }
        $res = self::service($pdo)->updateDraft($ctx['user_id'], $ctx['account_id'], $id, self::draftFields($body));
        self::respond($res, ['ok' => true, 'message' => $res['message'] ?? null]);
    }

    private static function sendDraft(PDO $pdo): void
    {
        $body = outlook_body();
        $ctx = self::ctx($pdo, $body); if ($ctx === null) { return; }
        $id = self::requireId($body); if ($id === null) { return; }
        $res = self::service($pdo)->sendDraft($ctx['user_id'], $ctx['account_id'], $id);
        self::respond($res, ['sent' => true]);
    }

    private static function draftFields(array $body): array
    {
        return [
            'subject'    => (string)($body['subject'] ?? ''),
            'body_html'  => (string)($body['body_html'] ?? ''),
            'to'         => self::emailList($body['to'] ?? []),
            'cc'         => self::emailList($body['cc'] ?? []),
            'bcc'        => self::emailList($body['bcc'] ?? []),
            'importance' => $body['importance'] ?? null,
        ];
    }

    private static function bulk(PDO $pdo): void
    {
        $body = outlook_body();
        $ctx = self::ctx($pdo, $body); if ($ctx === null) { return; }
        $ids = is_array($body['ids'] ?? null) ? $body['ids'] : [];
        $action = (string)($body['action'] ?? '');
        if (empty($ids) || $action === '') {
            ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 400, ['message' => 'ids e action obrigatorios.']);
            return;
        }
        if (count($ids) > 200) {
            ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 400, ['message' => 'Maximo de 200 mensagens por acao em massa.']);
            return;
        }
        $res = self::service($pdo)->bulkAction($ctx['user_id'], $ctx['account_id'], $ids, $action, [
            'destination' => (string)($body['destination'] ?? ''),
        ]);
        ApiResponse::success($res);
    }
}
