<?php
// Outlook / MockController - roteia TODAS as rotas para o provedor OutlookMock
// @version 1.0.0
// @created 2026-07-21
// @app Integracao Outlook
//
// Ativo quando OUTLOOK_PROVIDER=mock. Bypassa Graph e OUTLOOK_DSHOW: serve dados
// ficticios com estado mutavel por sessao. Espelha os envelopes dos controllers reais.
declare(strict_types=1);

final class OutlookMockController
{
    /** Callback do fluxo "conectar" (roteado antes do gate CSRF, como o real). */
    public static function callback(): void
    {
        OutlookMock::connectAccount();
        $returnTo = isset($_GET['return_to']) ? (string)$_GET['return_to'] : '';
        $base = ($returnTo !== '' && $returnTo[0] === '/') ? $returnTo : '/#/panel-outlook/contas';
        $sep = strpos($base, '?') === false ? '?' : '&';
        header('Location: ' . $base . $sep . 'outlook_auth=connected', true, 302);
    }

    public static function route(string $method, array $segments): void
    {
        $seg0 = $segments[0] ?? '';
        switch ($seg0) {
            case '':
            case 'status':        ApiResponse::success(OutlookMock::status()); return;
            case 'accounts':      self::accounts($method, $segments); return;
            case 'messages':      self::messages($method, $segments); return;
            case 'templates':     self::templates($method, $segments); return;
            case 'categories':    self::categories($method, $segments); return;
            case 'rules':         self::rules($method, $segments); return;
            case 'mass':          self::mass($method, $segments); return;
            case 'folders':       ApiResponse::success(['folders' => OutlookMock::folders()]); return;
            case 'header-counter':ApiResponse::success(OutlookMock::headerCounter()); return;
            case 'dashboard':
                if (($segments[1] ?? '') === 'summary' && $method === 'GET') {
                    ApiResponse::success(OutlookMock::dashboard((string)($_GET['period'] ?? '7d'))); return;
                }
                ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404); return;
            case 'mock':
                if (($segments[1] ?? '') === 'reset' && $method === 'POST') {
                    OutlookMock::reset(); ApiResponse::success(['reset' => true]); return;
                }
                ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404); return;
            default:
                ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404, ['message' => 'Rota mock desconhecida.']);
        }
    }

    // ── contas ──────────────────────────────────────────────────────────
    private static function accounts(string $method, array $segments): void
    {
        $sub = $segments[1] ?? '';
        if ($sub === '' && $method === 'GET') {
            ApiResponse::success(['accounts' => OutlookMock::accountsPublic(), 'oauth_configured' => true, 'crypto_ready' => true]);
            return;
        }
        if ($sub === 'connect' && $method === 'POST') {
            $body = outlook_body();
            $rt = rawurlencode((string)($body['return_to'] ?? '#/panel-outlook/contas'));
            // authorize_url aponta ao callback mock -> cria conta e volta ao SPA
            ApiResponse::success(['authorize_url' => '/api/outlook/accounts/callback?mock=1&return_to=' . $rt]);
            return;
        }
        $id = (int)$sub;
        if ($id <= 0) { ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404); return; }
        $action = $segments[2] ?? '';
        if ($action === 'reconnect' && $method === 'POST') {
            ApiResponse::success(['authorize_url' => '/api/outlook/accounts/callback?mock=1&return_to=' . rawurlencode('#/panel-outlook/contas')]);
            return;
        }
        if ($action === '' && $method === 'PATCH') {
            $body = outlook_body();
            if (!empty($body['is_default'])) { OutlookMock::setDefault($id); }
            $acc = array_values(array_filter(OutlookMock::accountsPublic(), fn($a) => $a['id'] === $id));
            ApiResponse::success(['account' => $acc[0] ?? null]); return;
        }
        if ($action === '' && $method === 'DELETE') {
            $ok = OutlookMock::disconnect($id);
            if (!$ok) { ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404); return; }
            ApiResponse::success(['disconnected' => true, 'account_id' => $id]); return;
        }
        ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404);
    }

    // ── mensagens ───────────────────────────────────────────────────────
    private static function messages(string $method, array $segments): void
    {
        $sub = $segments[1] ?? '';
        if ($method === 'GET') {
            switch ($sub) {
                case '':
                    ApiResponse::success(OutlookMock::listMessages((string)($_GET['folder'] ?? 'inbox'),
                        (int)($_GET['top'] ?? 25), isset($_GET['skiptoken']) ? (string)$_GET['skiptoken'] : null,
                        isset($_GET['q']) ? (string)$_GET['q'] : null,
                        isset($_GET['filter']) ? (string)$_GET['filter'] : null,
                        isset($_GET['category']) ? (string)$_GET['category'] : null));
                    return;
                case 'item':
                    $id = (string)($_GET['id'] ?? '');
                    $m = OutlookMock::getMessage($id);
                    if ($m === null) { ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404, ['message' => 'Mensagem nao encontrada.']); return; }
                    ApiResponse::success(['message' => $m]); return;
                case 'attachments':
                    ApiResponse::success(['items' => OutlookMock::listAttachments((string)($_GET['id'] ?? ''))]); return;
                case 'attachment':
                    self::baixarAnexo((string)($_GET['id'] ?? ''), (string)($_GET['aid'] ?? '')); return;
                default:
                    ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404); return;
            }
        }
        if ($method !== 'POST') { ApiResponse::error(ApiResponse::ERR_METHOD_NOT_ALLOWED, 405); return; }

        $body = outlook_body();
        $id = trim((string)($body['id'] ?? ''));
        switch ($sub) {
            case 'send':
                $to = self::emails($body['to'] ?? []);
                if (!$to) { ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 400, ['message' => 'Informe ao menos um destinatario.']); return; }
                OutlookMock::appendSent((string)($body['subject'] ?? ''), (string)($body['body_html'] ?? ''), $to, is_array($body['attachments'] ?? null) ? $body['attachments'] : []);
                ApiResponse::success(['sent' => true]); return;
            case 'reply':
                $base = $id !== '' ? OutlookMock::peek($id) : null;
                $assunto = $base ? self::prefix('Re: ', $base['subject']) : 'Re:';
                $to = $base ? [$base['from']['address']] : [];
                OutlookMock::appendSent($assunto, (string)($body['comment'] ?? ''), $to);
                ApiResponse::success(['sent' => true]); return;
            case 'forward':
                $to = self::emails($body['to'] ?? []);
                if (!$to) { ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 400, ['message' => 'Informe ao menos um destinatario.']); return; }
                $base = $id !== '' ? OutlookMock::peek($id) : null;
                $assunto = $base ? self::prefix('Enc: ', $base['subject']) : 'Enc:';
                OutlookMock::appendSent($assunto, (string)($body['comment'] ?? ''), $to);
                ApiResponse::success(['sent' => true]); return;
            case 'mark-read':   self::mut(OutlookMock::patch($id, ['is_read' => (bool)($body['is_read'] ?? true)])); return;
            case 'flag':        self::mut(OutlookMock::patch($id, ['is_flagged' => (bool)($body['flagged'] ?? true)])); return;
            case 'importance':  self::mut(OutlookMock::patch($id, ['importance' => (string)($body['importance'] ?? 'normal')])); return;
            case 'categories':  self::mut(OutlookMock::patch($id, ['categories' => is_array($body['categories'] ?? null) ? $body['categories'] : []])); return;
            case 'move':        self::mut(OutlookMock::move($id, (string)($body['destination'] ?? 'archive'))); return;
            case 'archive':     self::mut(OutlookMock::move($id, 'archive')); return;
            case 'delete':      self::mut(OutlookMock::delete($id)); return;
            case 'draft':
                $newId = OutlookMock::createDraft((string)($body['subject'] ?? ''), (string)($body['body_html'] ?? ''), self::emails($body['to'] ?? []));
                ApiResponse::success(['id' => $newId, 'message' => null]); return;
            case 'update-draft':self::mut(OutlookMock::patch($id, ['subject' => (string)($body['subject'] ?? ''), 'body_html' => (string)($body['body_html'] ?? '')])); return;
            case 'send-draft':  OutlookMock::move($id, 'sentitems'); OutlookMock::patch($id, ['is_draft' => false]); ApiResponse::success(['sent' => true]); return;
            case 'bulk-action': self::bulk($body); return;
            case 'schedule':
                $to = self::emails($body['to'] ?? []);
                $when = trim((string)($body['scheduled_at'] ?? ''));
                if (!$to) { ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 400, ['message' => 'Informe ao menos um destinatario.']); return; }
                if ($when === '') { ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 400, ['message' => 'Informe data/hora do agendamento.']); return; }
                $nid = OutlookMock::scheduleCreate((string)($body['subject'] ?? ''), (string)($body['body_html'] ?? ''), $to, $when, is_array($body['attachments'] ?? null) ? $body['attachments'] : []);
                ApiResponse::success(['id' => $nid, 'scheduled' => true]); return;
            case 'schedule-cancel':   self::mut(OutlookMock::scheduleCancel($id)); return;
            case 'schedule-sendnow':  self::mut(OutlookMock::scheduleSendNow($id)); return;
            default:
                ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404, ['message' => 'Acao desconhecida.']);
        }
    }

    // ── modelos ─────────────────────────────────────────────────────────
    private static function templates(string $method, array $segments): void
    {
        $sub = $segments[1] ?? '';
        if ($method === 'GET' && $sub === '') {
            ApiResponse::success([
                'available'  => true,
                'templates'  => OutlookMock::templatesList(
                    isset($_GET['q']) ? (string)$_GET['q'] : null,
                    isset($_GET['category']) ? (string)$_GET['category'] : null),
                'categories' => OutlookMock::TEMPLATE_CATEGORIES,
            ]);
            return;
        }
        if ($method !== 'POST') { ApiResponse::error(ApiResponse::ERR_METHOD_NOT_ALLOWED, 405); return; }
        $body = outlook_body();
        $id = (int)($body['id'] ?? 0);
        switch ($sub) {
            case '':
                $nid = OutlookMock::templateCreate($body);
                ApiResponse::success(['id' => $nid]); return;
            case 'update':
                self::mut(OutlookMock::templateUpdate($id, $body)); return;
            case 'duplicate':
                $nid = OutlookMock::templateDuplicate($id);
                if ($nid === null) { ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404); return; }
                ApiResponse::success(['id' => $nid]); return;
            case 'delete':
                self::mut(OutlookMock::templateDelete($id)); return;
            case 'favorite':
                self::mut(OutlookMock::templateFavorite($id, (bool)($body['favorite'] ?? true))); return;
            default:
                ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404);
        }
    }

    // ── categorias ──────────────────────────────────────────────────────
    private static function categories(string $method, array $segments): void
    {
        $sub = $segments[1] ?? '';
        if ($method === 'GET' && $sub === '') {
            ApiResponse::success(['available' => true, 'categories' => OutlookMock::categoriesList()]);
            return;
        }
        if ($method !== 'POST') { ApiResponse::error(ApiResponse::ERR_METHOD_NOT_ALLOWED, 405); return; }
        $body = outlook_body();
        $name = trim((string)($body['name'] ?? ''));
        switch ($sub) {
            case '':      self::mut(OutlookMock::categoryCreate($name, (string)($body['color'] ?? ''))); return;
            case 'color': self::mut(OutlookMock::categorySetColor($name, (string)($body['color'] ?? ''))); return;
            case 'rename':self::mut(OutlookMock::categoryRename($name, (string)($body['new_name'] ?? ''))); return;
            case 'delete':self::mut(OutlookMock::categoryDelete($name)); return;
            default:      ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404);
        }
    }

    /** Serve o conteúdo bruto de um anexo (binário, com cabeçalhos seguros §20.2). */
    private static function baixarAnexo(string $id, string $aid): void
    {
        $att = OutlookMock::getAttachment($id, $aid);
        if ($att === null) {
            ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404, ['message' => 'Anexo nao encontrado.']);
            return;
        }
        $bytes = base64_decode((string)($att['content_b64'] ?? '')) ?: '';
        header_remove('Content-Type');
        header('Content-Type: ' . $att['contentType']);
        header('Content-Disposition: inline; filename="' . str_replace(['"', "\r", "\n"], '', (string)$att['name']) . '"');
        header('Content-Length: ' . strlen($bytes));
        header('X-Content-Type-Options: nosniff');
        echo $bytes;
    }

    // ── envio em massa ──────────────────────────────────────────────────
    private static function mass(string $method, array $segments): void
    {
        $sub = $segments[1] ?? '';
        if ($method === 'POST' && $sub === 'start') {
            $body = outlook_body();
            $recips = self::emails($body['recipients'] ?? []);
            if (!$recips) { ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 400, ['message' => 'Informe destinatarios validos.']); return; }
            if (count($recips) > 2000) { ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 400, ['message' => 'Maximo de 2000 destinatarios.']); return; }
            $id = OutlookMock::massStart((string)($body['subject'] ?? ''), (string)($body['body_html'] ?? ''), $recips, (bool)($body['use_bcc'] ?? true));
            ApiResponse::success(['id' => $id, 'total' => count($recips)]);
            return;
        }
        if ($method === 'GET' && $sub === 'status') {
            $st = OutlookMock::massStatus((int)($_GET['id'] ?? 0));
            if ($st === null) { ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404); return; }
            ApiResponse::success($st);
            return;
        }
        ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404);
    }

    // ── regras ──────────────────────────────────────────────────────────
    private static function rules(string $method, array $segments): void
    {
        $sub = $segments[1] ?? '';
        if ($method === 'GET' && $sub === '') {
            ApiResponse::success(['available' => true, 'rules' => OutlookMock::rulesList()]);
            return;
        }
        if ($method !== 'POST') { ApiResponse::error(ApiResponse::ERR_METHOD_NOT_ALLOWED, 405); return; }
        $body = outlook_body();
        $id = (int)($body['id'] ?? 0);
        switch ($sub) {
            case '':        ApiResponse::success(['id' => OutlookMock::ruleCreate($body)]); return;
            case 'update':  self::mut(OutlookMock::ruleUpdate($id, $body)); return;
            case 'delete':  self::mut(OutlookMock::ruleDelete($id)); return;
            case 'toggle':  self::mut(OutlookMock::ruleToggle($id, (bool)($body['enabled'] ?? true))); return;
            case 'reorder': self::mut(OutlookMock::ruleReorder($id, (string)($body['dir'] ?? 'up') === 'down' ? 'down' : 'up')); return;
            case 'test':    ApiResponse::success(['matches' => OutlookMock::ruleTest($id)]); return;
            case 'apply':   ApiResponse::success(OutlookMock::rulesApply()); return;
            default:        ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404);
        }
    }

    private static function bulk(array $body): void
    {
        $ids = is_array($body['ids'] ?? null) ? $body['ids'] : [];
        $action = (string)($body['action'] ?? '');
        $dest = (string)($body['destination'] ?? '');
        $ok = []; $failed = [];
        foreach ($ids as $mid) {
            $mid = (string)$mid; $r = false;
            switch ($action) {
                case 'read':        $r = OutlookMock::patch($mid, ['is_read' => true]); break;
                case 'unread':      $r = OutlookMock::patch($mid, ['is_read' => false]); break;
                case 'flag':        $r = OutlookMock::patch($mid, ['is_flagged' => true]); break;
                case 'unflag':      $r = OutlookMock::patch($mid, ['is_flagged' => false]); break;
                case 'important':   $r = OutlookMock::patch($mid, ['importance' => 'high']); break;
                case 'unimportant': $r = OutlookMock::patch($mid, ['importance' => 'normal']); break;
                case 'archive':     $r = OutlookMock::move($mid, 'archive'); break;
                case 'spam':        $r = OutlookMock::move($mid, 'junkemail'); break;
                case 'delete':      $r = OutlookMock::delete($mid); break;
                case 'move':        $r = OutlookMock::move($mid, $dest); break;
            }
            if ($r) { $ok[] = $mid; } else { $failed[] = ['id' => $mid, 'error' => 'NOT_FOUND']; }
        }
        ApiResponse::success(['succeeded' => $ok, 'failed' => $failed, 'total' => count($ids)]);
    }

    private static function mut(bool $ok): void
    {
        if (!$ok) { ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404, ['message' => 'Mensagem nao encontrada.']); return; }
        ApiResponse::success(['ok' => true]);
    }

    private static function prefix(string $pfx, string $subject): string
    {
        return preg_match('/^(re|enc|fw|fwd):/i', $subject) ? $subject : $pfx . $subject;
    }

    private static function emails($v): array
    {
        if (is_string($v)) { $v = preg_split('/[;,]/', $v) ?: []; }
        if (!is_array($v)) { return []; }
        $out = [];
        foreach ($v as $e) { $e = trim((string)$e); if ($e !== '' && filter_var($e, FILTER_VALIDATE_EMAIL)) { $out[] = $e; } }
        return array_values(array_unique($out));
    }
}
