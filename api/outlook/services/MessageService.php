<?php
// Outlook / MessageService - leitura, escrita e acoes de mensagens (Microsoft Graph)
// @version 1.1.0
// @created 2026-07-21
// @app Integracao Outlook
//
// Fase 1 (§10/§33): listar por pasta, abrir, criar/editar/enviar rascunho, responder,
// responder a todos, encaminhar, mover, arquivar, excluir, marcar lido/nao lido,
// favoritar, importancia, acoes em massa. O corpo dos e-mails NAO e persistido (§18):
// e buscado sob demanda no Graph. Em 401 no meio da operacao, forca 1 refresh e repete.
declare(strict_types=1);

final class OutlookMessageService
{
    /** Pastas bem-conhecidas do Graph aceitas como atalho. */
    private const WELL_KNOWN = [
        'inbox', 'sentitems', 'drafts', 'deleteditems', 'junkemail',
        'archive', 'outbox', 'clutter', 'scheduled', 'recoverableitemsdeletions',
    ];

    private PDO $pdo;
    private OutlookAuthService $auth;
    private OutlookLogRepository $logs;

    public function __construct(PDO $pdo, OutlookAuthService $auth)
    {
        $this->pdo  = $pdo;
        $this->auth = $auth;
        $this->logs = new OutlookLogRepository($pdo);
    }

    // ── Leitura ─────────────────────────────────────────────────────────
    /**
     * Lista mensagens de uma pasta (well-known name ou folderId). Paginacao por $skiptoken.
     * @return array ['ok'=>bool,'items'=>array,'next'=>?string,'error'=>?string,'error_code'=>?string,'http'=>int]
     */
    public function listMessages(int $userId, int $accountId, string $folder = 'inbox', int $top = 25, ?string $skiptoken = null, ?string $q = null, ?string $filter = null, ?string $category = null): array
    {
        $folderSeg = $this->folderPath($folder);
        $select = 'id,subject,from,toRecipients,receivedDateTime,sentDateTime,bodyPreview,isRead,hasAttachments,importance,flag,categories,isDraft,conversationId';
        $query = ['$top' => max(1, min($top, 100)), '$select' => $select];
        $headers = [];
        $q = $q !== null ? trim($q) : null;

        if ($q !== null && $q !== '') {
            // Busca (§17): $search ordena por relevancia (sem $orderby) e exige ConsistencyLevel.
            $query['$search'] = '"' . str_replace('"', '', $q) . '"';
            $headers['ConsistencyLevel'] = 'eventual';
        } else {
            $query['$orderby'] = 'receivedDateTime desc';
            $clauses = [];
            $qc = self::filtroGraph($filter);
            if ($qc !== null) { $clauses[] = $qc; }
            if ($category !== null && trim($category) !== '') {
                $cat = str_replace("'", "''", trim($category));
                $clauses[] = "categories/any(c:c eq '{$cat}')";
                $headers['ConsistencyLevel'] = 'eventual';
            }
            if ($clauses) { $query['$filter'] = implode(' and ', $clauses); }
        }
        if ($skiptoken !== null && $skiptoken !== '') {
            $query['$skiptoken'] = $skiptoken;
        }
        $res = $this->call($userId, $accountId, fn(GraphClient $g) => $g->get($folderSeg . '/messages', $query, $headers));
        if (!$res['ok']) {
            return $this->fail($res);
        }
        $data = $res['data'] ?? [];
        return [
            'ok'    => true,
            'items' => array_map([self::class, 'shapeListItem'], $data['value'] ?? []),
            'next'  => self::extractSkipToken($data['@odata.nextLink'] ?? null),
            'http'  => $res['status'],
        ];
    }

    /** Compat: lista a Caixa de Entrada. */
    public function listInbox(int $userId, int $accountId, int $top = 25, ?string $skiptoken = null): array
    {
        return $this->listMessages($userId, $accountId, 'inbox', $top, $skiptoken);
    }

    /** Abre uma mensagem completa (corpo HTML incluso). */
    public function getMessage(int $userId, int $accountId, string $messageId): array
    {
        $query = [
            '$select' => 'id,subject,from,sender,toRecipients,ccRecipients,bccRecipients,replyTo,'
                       . 'receivedDateTime,sentDateTime,body,bodyPreview,isRead,hasAttachments,'
                       . 'importance,flag,categories,isDraft,conversationId,webLink',
        ];
        $res = $this->call($userId, $accountId, fn(GraphClient $g) => $g->get('/me/messages/' . rawurlencode($messageId), $query));
        if (!$res['ok']) {
            return $this->fail($res);
        }
        // Marca como lida ao abrir (comportamento padrao de leitor). Best-effort, sem bloquear.
        if (is_array($res['data']) && ($res['data']['isRead'] ?? true) === false) {
            $this->markRead($userId, $accountId, $messageId, true);
            $res['data']['isRead'] = true;
        }
        return ['ok' => true, 'message' => $res['data'] ?? null, 'http' => $res['status']];
    }

    /** Lista metadados dos anexos de uma mensagem (sem baixar conteudo). */
    public function listAttachments(int $userId, int $accountId, string $messageId): array
    {
        $res = $this->call($userId, $accountId, fn(GraphClient $g) =>
            $g->get('/me/messages/' . rawurlencode($messageId) . '/attachments', [
                '$select' => 'id,name,contentType,size,isInline',
            ]));
        if (!$res['ok']) {
            return $this->fail($res);
        }
        return ['ok' => true, 'items' => ($res['data']['value'] ?? []), 'http' => $res['status']];
    }

    // ── Envio direto ────────────────────────────────────────────────────
    /**
     * Envia uma mensagem imediatamente (POST /me/sendMail). Grava em Enviados.
     * $msg: ['subject','body_html','to'=>[],'cc'=>[],'bcc'=>[],'importance']
     */
    public function sendMail(int $userId, int $accountId, array $msg): array
    {
        $payload = ['message' => self::buildMessage($msg), 'saveToSentItems' => true];
        $res = $this->call($userId, $accountId, fn(GraphClient $g) => $g->post('/me/sendMail', $payload));
        if (!$res['ok']) {
            $this->logs->error('send.fail', $userId, $accountId, $res['error_code'] ?? null, $res['error'] ?? null, ['http' => $res['status']]);
            return $this->fail($res);
        }
        $this->logs->info('send.ok', $userId, $accountId, 'Mensagem enviada');
        return ['ok' => true, 'http' => $res['status']];
    }

    // ── Rascunhos (editor com autosave) ─────────────────────────────────
    /** Cria um rascunho e devolve o id (Graph cria em Rascunhos). */
    public function createDraft(int $userId, int $accountId, array $msg): array
    {
        $res = $this->call($userId, $accountId, fn(GraphClient $g) => $g->post('/me/messages', self::buildMessage($msg)));
        if (!$res['ok']) {
            return $this->fail($res);
        }
        return ['ok' => true, 'id' => $res['data']['id'] ?? null, 'message' => $res['data'] ?? null, 'http' => $res['status']];
    }

    /** Atualiza um rascunho existente (autosave). */
    public function updateDraft(int $userId, int $accountId, string $draftId, array $msg): array
    {
        $res = $this->call($userId, $accountId, fn(GraphClient $g) =>
            $g->patch('/me/messages/' . rawurlencode($draftId), self::buildMessage($msg)));
        if (!$res['ok']) {
            return $this->fail($res);
        }
        return ['ok' => true, 'message' => $res['data'] ?? null, 'http' => $res['status']];
    }

    /** Envia um rascunho ja existente (POST /me/messages/{id}/send). */
    public function sendDraft(int $userId, int $accountId, string $draftId): array
    {
        $res = $this->call($userId, $accountId, fn(GraphClient $g) => $g->post('/me/messages/' . rawurlencode($draftId) . '/send', null));
        if (!$res['ok']) {
            $this->logs->error('send.fail', $userId, $accountId, $res['error_code'] ?? null, $res['error'] ?? null, ['http' => $res['status']]);
            return $this->fail($res);
        }
        $this->logs->info('send.ok', $userId, $accountId, 'Rascunho enviado');
        return ['ok' => true, 'http' => $res['status']];
    }

    // ── Responder / Encaminhar (envio imediato com comentario) ──────────
    public function reply(int $userId, int $accountId, string $messageId, string $comment, bool $all = false): array
    {
        $endpoint = '/me/messages/' . rawurlencode($messageId) . ($all ? '/replyAll' : '/reply');
        $res = $this->call($userId, $accountId, fn(GraphClient $g) => $g->post($endpoint, ['comment' => $comment]));
        if (!$res['ok']) {
            $this->logs->error('send.fail', $userId, $accountId, $res['error_code'] ?? null, $res['error'] ?? null, ['http' => $res['status'], 'op' => $all ? 'replyAll' : 'reply']);
            return $this->fail($res);
        }
        $this->logs->info('send.ok', $userId, $accountId, $all ? 'Respondido a todos' : 'Respondido');
        return ['ok' => true, 'http' => $res['status']];
    }

    public function forward(int $userId, int $accountId, string $messageId, array $to, string $comment = ''): array
    {
        $body = ['comment' => $comment, 'toRecipients' => self::recipients($to)];
        $res = $this->call($userId, $accountId, fn(GraphClient $g) => $g->post('/me/messages/' . rawurlencode($messageId) . '/forward', $body));
        if (!$res['ok']) {
            $this->logs->error('send.fail', $userId, $accountId, $res['error_code'] ?? null, $res['error'] ?? null, ['http' => $res['status'], 'op' => 'forward']);
            return $this->fail($res);
        }
        $this->logs->info('send.ok', $userId, $accountId, 'Encaminhado');
        return ['ok' => true, 'http' => $res['status']];
    }

    // ── Acoes sobre a mensagem ──────────────────────────────────────────
    public function markRead(int $userId, int $accountId, string $messageId, bool $isRead): array
    {
        return $this->patchMessage($userId, $accountId, $messageId, ['isRead' => $isRead]);
    }

    public function setImportance(int $userId, int $accountId, string $messageId, string $importance): array
    {
        if (!in_array($importance, ['low', 'normal', 'high'], true)) {
            return ['ok' => false, 'error' => 'Importancia invalida.', 'error_code' => 'VALIDATION', 'http' => 400];
        }
        return $this->patchMessage($userId, $accountId, $messageId, ['importance' => $importance]);
    }

    public function setFlag(int $userId, int $accountId, string $messageId, bool $flagged): array
    {
        return $this->patchMessage($userId, $accountId, $messageId, [
            'flag' => ['flagStatus' => $flagged ? 'flagged' : 'notFlagged'],
        ]);
    }

    public function setCategories(int $userId, int $accountId, string $messageId, array $categories): array
    {
        $cats = array_values(array_filter(array_map('strval', $categories), fn($c) => $c !== ''));
        return $this->patchMessage($userId, $accountId, $messageId, ['categories' => $cats]);
    }

    /** Move para uma pasta (well-known ou folderId). Devolve o novo id (o Graph recria a msg). */
    public function move(int $userId, int $accountId, string $messageId, string $destination): array
    {
        $destId = in_array($destination, self::WELL_KNOWN, true) ? $destination : $destination;
        $res = $this->call($userId, $accountId, fn(GraphClient $g) =>
            $g->post('/me/messages/' . rawurlencode($messageId) . '/move', ['destinationId' => $destId]));
        if (!$res['ok']) {
            return $this->fail($res);
        }
        return ['ok' => true, 'id' => $res['data']['id'] ?? null, 'http' => $res['status']];
    }

    /** Arquiva (move para a pasta Arquivo bem-conhecida). */
    public function archive(int $userId, int $accountId, string $messageId): array
    {
        return $this->move($userId, $accountId, $messageId, 'archive');
    }

    /** Exclui: DELETE move para a Lixeira do Outlook (soft delete). */
    public function delete(int $userId, int $accountId, string $messageId): array
    {
        $res = $this->call($userId, $accountId, fn(GraphClient $g) => $g->delete('/me/messages/' . rawurlencode($messageId)));
        if (!$res['ok']) {
            return $this->fail($res);
        }
        return ['ok' => true, 'http' => $res['status']];
    }

    /**
     * Acao em massa sobre varias mensagens. $action: read|unread|flag|unflag|important|
     * unimportant|archive|delete|move|spam. Retorna sucessos/falhas por id.
     */
    public function bulkAction(int $userId, int $accountId, array $messageIds, string $action, array $opts = []): array
    {
        $ok = []; $failed = [];
        foreach ($messageIds as $mid) {
            $mid = (string)$mid;
            if ($mid === '') { continue; }
            $r = $this->applyAction($userId, $accountId, $mid, $action, $opts);
            if ($r['ok'] ?? false) { $ok[] = $mid; }
            else { $failed[] = ['id' => $mid, 'error' => $r['error_code'] ?? 'ERROR']; }
        }
        return ['ok' => true, 'succeeded' => $ok, 'failed' => $failed, 'total' => count($messageIds)];
    }

    private function applyAction(int $userId, int $accountId, string $mid, string $action, array $opts): array
    {
        switch ($action) {
            case 'read':        return $this->markRead($userId, $accountId, $mid, true);
            case 'unread':      return $this->markRead($userId, $accountId, $mid, false);
            case 'flag':        return $this->setFlag($userId, $accountId, $mid, true);
            case 'unflag':      return $this->setFlag($userId, $accountId, $mid, false);
            case 'important':   return $this->setImportance($userId, $accountId, $mid, 'high');
            case 'unimportant': return $this->setImportance($userId, $accountId, $mid, 'normal');
            case 'archive':     return $this->archive($userId, $accountId, $mid);
            case 'delete':      return $this->delete($userId, $accountId, $mid);
            case 'spam':        return $this->move($userId, $accountId, $mid, 'junkemail');
            case 'move':        return $this->move($userId, $accountId, $mid, (string)($opts['destination'] ?? ''));
            default:            return ['ok' => false, 'error_code' => 'UNKNOWN_ACTION'];
        }
    }

    // ── infra ───────────────────────────────────────────────────────────
    private function patchMessage(int $userId, int $accountId, string $messageId, array $fields): array
    {
        $res = $this->call($userId, $accountId, fn(GraphClient $g) => $g->patch('/me/messages/' . rawurlencode($messageId), $fields));
        if (!$res['ok']) {
            return $this->fail($res);
        }
        return ['ok' => true, 'http' => $res['status']];
    }

    /**
     * Executa uma chamada ao Graph com token valido; em 401, forca 1 refresh e repete.
     * @param callable $fn fn(GraphClient): array(envelope do GraphClient)
     */
    private function call(int $userId, int $accountId, callable $fn): array
    {
        $token = $this->auth->accessTokenFor($userId, $accountId);
        if ($token === null) {
            return ['ok' => false, 'status' => 401, 'error' => 'Conta requer nova autenticacao.', 'error_code' => 'NEEDS_AUTH', 'meta' => []];
        }
        $res = $fn(new GraphClient($token));
        if (($res['status'] ?? 0) === 401) {
            $token = $this->auth->accessTokenFor($userId, $accountId, true); // refresh forcado
            if ($token === null) {
                return ['ok' => false, 'status' => 401, 'error' => 'Conta requer nova autenticacao.', 'error_code' => 'NEEDS_AUTH', 'meta' => []];
            }
            $res = $fn(new GraphClient($token));
        }
        return $res;
    }

    private function fail(array $res): array
    {
        return [
            'ok'         => false,
            'error'      => $res['error'] ?? 'Falha ao comunicar com a Microsoft.',
            'error_code' => $res['error_code'] ?? 'GRAPH_ERROR',
            'http'       => $res['status'] ?? 0,
        ];
    }

    /** Mapeia o chip de filtro rapido (§17.3) para uma clausula $filter do Graph. */
    private static function filtroGraph(?string $filter): ?string
    {
        switch ($filter) {
            case 'unread':      return 'isRead eq false';
            case 'important':   return "importance eq 'high'";
            case 'flagged':     return "flag/flagStatus eq 'flagged'";
            case 'attachments': return 'hasAttachments eq true';
            case 'today':       return 'receivedDateTime ge ' . gmdate('Y-m-d\T00:00:00\Z');
            default:            return null;
        }
    }

    /** Caminho da pasta: well-known -> /me/mailFolders/{name} ; id -> /me/mailFolders/{id}. */
    private function folderPath(string $folder): string
    {
        $f = trim($folder);
        if ($f === '' ) { $f = 'inbox'; }
        return '/me/mailFolders/' . rawurlencode($f);
    }

    /** Monta o objeto message do Graph a partir de um payload simples. */
    private static function buildMessage(array $msg): array
    {
        $m = [
            'subject' => (string)($msg['subject'] ?? ''),
            'body'    => ['contentType' => 'HTML', 'content' => (string)($msg['body_html'] ?? '')],
        ];
        if (isset($msg['to']))  { $m['toRecipients']  = self::recipients($msg['to']); }
        if (isset($msg['cc']))  { $m['ccRecipients']  = self::recipients($msg['cc']); }
        if (isset($msg['bcc'])) { $m['bccRecipients'] = self::recipients($msg['bcc']); }
        if (!empty($msg['importance']) && in_array($msg['importance'], ['low', 'normal', 'high'], true)) {
            $m['importance'] = $msg['importance'];
        }
        // Anexos pequenos inline (§20.3): fileAttachment base64. Grandes (>~3MB) exigem
        // upload session (Fase 2) — não tratados aqui.
        if (!empty($msg['attachments']) && is_array($msg['attachments'])) {
            $atts = [];
            foreach ($msg['attachments'] as $a) {
                if (!is_array($a) || empty($a['name']) || empty($a['content_b64'])) { continue; }
                $atts[] = [
                    '@odata.type' => '#microsoft.graph.fileAttachment',
                    'name'        => (string)$a['name'],
                    'contentType' => (string)($a['contentType'] ?? 'application/octet-stream'),
                    'contentBytes'=> (string)$a['content_b64'],
                ];
            }
            if ($atts) { $m['attachments'] = $atts; }
        }
        return $m;
    }

    /** Conteúdo de um anexo (para download). @return ['ok','name','contentType','bytes'] | fail */
    public function getAttachmentContent(int $userId, int $accountId, string $messageId, string $attachmentId): array
    {
        $res = $this->call($userId, $accountId, fn(GraphClient $g) =>
            $g->get('/me/messages/' . rawurlencode($messageId) . '/attachments/' . rawurlencode($attachmentId)));
        if (!$res['ok']) {
            return $this->fail($res);
        }
        $d = $res['data'] ?? [];
        return [
            'ok' => true,
            'name' => (string)($d['name'] ?? 'anexo'),
            'contentType' => (string)($d['contentType'] ?? 'application/octet-stream'),
            'bytes' => base64_decode((string)($d['contentBytes'] ?? '')) ?: '',
        ];
    }

    private static function recipients(array $emails): array
    {
        $out = [];
        foreach ($emails as $e) {
            $e = trim((string)$e);
            if ($e !== '') {
                $out[] = ['emailAddress' => ['address' => $e]];
            }
        }
        return $out;
    }

    private static function shapeListItem(array $m): array
    {
        $flag = $m['flag']['flagStatus'] ?? 'notFlagged';
        return [
            'id'               => $m['id'] ?? null,
            'subject'          => ($m['subject'] ?? '') !== '' ? $m['subject'] : '(sem assunto)',
            'from'             => $m['from']['emailAddress'] ?? null,
            'to'               => array_map(fn($r) => $r['emailAddress'] ?? null, $m['toRecipients'] ?? []),
            'received'         => $m['receivedDateTime'] ?? null,
            'sent'             => $m['sentDateTime'] ?? null,
            'preview'          => $m['bodyPreview'] ?? '',
            'is_read'          => (bool)($m['isRead'] ?? false),
            'is_draft'         => (bool)($m['isDraft'] ?? false),
            'has_attachments'  => (bool)($m['hasAttachments'] ?? false),
            'importance'       => $m['importance'] ?? 'normal',
            'is_flagged'       => $flag === 'flagged',
            'categories'       => $m['categories'] ?? [],
            'conversation_id'  => $m['conversationId'] ?? null,
        ];
    }

    private static function extractSkipToken(?string $nextLink): ?string
    {
        if ($nextLink === null || $nextLink === '') {
            return null;
        }
        $qs = parse_url($nextLink, PHP_URL_QUERY);
        if (!is_string($qs)) {
            return null;
        }
        parse_str($qs, $params);
        return $params['$skiptoken'] ?? ($params['%24skiptoken'] ?? null);
    }
}
