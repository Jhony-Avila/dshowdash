<?php
// Outlook / OutlookMock - provedor MOCK (sem Azure, sem banco) para testes de UI
// @version 1.0.0
// @created 2026-07-21
// @app Integracao Outlook
//
// Habilitado por OUTLOOK_PROVIDER=mock no .env. Estado mutavel por sessao
// ($_SESSION['outlook_mock']): marcar lido/arquivar/excluir/enviar/responder
// "grudam" durante o teste. NAO toca Graph nem OUTLOOK_DSHOW. Escopo natural:
// por sessao = por usuario. Reset: OutlookMock::reset() (rota /mock/reset).
declare(strict_types=1);

final class OutlookMock
{
    public static function isEnabled(): bool
    {
        $v = getenv('OUTLOOK_PROVIDER');
        if ($v === false || $v === '') { $v = $_ENV['OUTLOOK_PROVIDER'] ?? ''; }
        return strtolower(trim((string)$v)) === 'mock';
    }

    /** @return array referencia ao estado (semeia se ausente) */
    private static function &state(): array
    {
        if (!isset($_SESSION['outlook_mock']) || !is_array($_SESSION['outlook_mock'])) {
            $_SESSION['outlook_mock'] = self::seed();
        }
        return $_SESSION['outlook_mock'];
    }

    public static function reset(): void
    {
        unset($_SESSION['outlook_mock']);
    }

    // ── Semente ─────────────────────────────────────────────────────────
    private static function seed(): array
    {
        $now = time();
        $mkAcc = static function (int $id, string $email, string $name, string $type, bool $default) use ($now): array {
            return [
                'id' => $id, 'microsoft_account_id' => 'mock-' . $id, 'tenant_id' => 'mock',
                'email' => $email, 'display_name' => $name, 'account_type' => $type,
                'is_default' => $default, 'is_active' => true, 'connection_status' => 'connected',
                'scopes' => 'Mail.Read Mail.Send', 'token_expires_at' => date('c', $now + 3600),
                'last_sync_at' => date('c', $now), 'last_success_at' => date('c', $now),
                'last_error_code' => null, 'last_error_message' => null,
                'created_at' => date('c', $now - 86400), 'disconnected_at' => null,
            ];
        };

        // Remetentes e assuntos realistas (pt-BR).
        $tpl = [
            ['Ana Ribeiro', 'ana.ribeiro@clientexyz.com.br', 'Proposta comercial — evento de lançamento', 0, 1, 'high'],
            ['Financeiro Fornecedor', 'financeiro@fornecedor.com', 'Cobrança — fatura #4821 vencendo amanhã', 0, 1, 'normal'],
            ['Carlos Menezes', 'carlos@construtorabeta.com', 'Re: Orçamento de estruturas — dúvidas', 0, 0, 'normal'],
            ['RH Interno', 'rh@dshow.com.br', 'Confirmação de férias aprovada', 1, 0, 'normal'],
            ['Marina Costa', 'marina.costa@agenciaon.com', 'Materiais da campanha (logos + vídeos)', 0, 1, 'normal'],
            ['Suporte Microsoft', 'account-security@microsoft.com', 'Atividade de entrada na sua conta', 0, 0, 'normal'],
            ['João Paulo', 'jp@parceirotech.io', 'Reunião de kickoff — quinta 15h', 0, 0, 'high'],
            ['Nota Fiscal', 'nfe@sefaz.exemplo.gov.br', 'NF-e emitida — pedido 10293', 1, 1, 'normal'],
            ['Beatriz Almeida', 'bia@studiovisual.com', 'Aprovação do layout — versão final', 0, 0, 'normal'],
            ['Comercial Interno', 'comercial@dshow.com.br', 'Meta do trimestre — acompanhamento', 1, 0, 'normal'],
            ['Pedro Santos', 'pedro.santos@varejoplus.com', 'Solicitação de documentos para contrato', 0, 1, 'high'],
            ['Newsletter', 'news@setoreventos.com', 'Tendências de eventos corporativos 2026', 1, 0, 'low'],
            ['Fernanda Lima', 'fernanda@clientexyz.com.br', 'Re: Proposta comercial — ajustes', 0, 0, 'normal'],
            ['Logística', 'logistica@transportadora.com', 'Rastreamento — entrega prevista sexta', 1, 0, 'normal'],
            ['Diego Ramos', 'diego@parceirotech.io', 'Contrato assinado (em anexo)', 0, 1, 'normal'],
            ['Camila Souza', 'camila.souza@agenciaon.com', 'Briefing atualizado do projeto', 0, 0, 'normal'],
            ['TI Interno', 'ti@dshow.com.br', 'Manutenção programada no sistema — sábado', 1, 0, 'low'],
            ['Roberto Nunes', 'roberto@construtorabeta.com', 'Re: Orçamento — aprovado, seguir', 0, 0, 'high'],
            ['Gabriela Reis', 'gabi@studiovisual.com', 'Fotos do evento anterior', 1, 1, 'normal'],
            ['Financeiro Interno', 'financeiro@dshow.com.br', 'Reembolso processado', 1, 0, 'normal'],
            ['Lucas Ferreira', 'lucas@varejoplus.com', 'Dúvida sobre prazo de montagem', 0, 0, 'normal'],
            ['Patrícia Gomes', 'patricia@clientexyz.com.br', 'Agradecimento — parceria de sucesso', 1, 0, 'normal'],
        ];

        $messages = [];
        $seq = 1;
        // offsets em minutos: mistura de "hoje" (recebidos hoje p/ badge) e dias anteriores.
        $offsetsMin = [8, 35, 90, 150, 220, 300, 380, 460,           // hoje
                       1500, 1600, 1700, 1900,                        // ontem
                       2900, 3100, 3300,                              // 2 dias
                       4400, 4600, 5900, 7300, 8800, 10200, 11800];   // dias anteriores
        foreach ($tpl as $i => $t) {
            [$nome, $addr, $assunto, $lido, $anexo, $imp] = $t;
            $ts = $now - (($offsetsMin[$i] ?? (100 + $i * 90)) * 60);
            $id = 'mock-msg-' . $seq++;
            $messages[$id] = [
                'id' => $id, 'folder' => 'inbox',
                'subject' => $assunto,
                'from' => ['name' => $nome, 'address' => $addr],
                'to' => [['name' => 'Você', 'address' => 'voce@dshow.com.br']],
                'cc' => [],
                'received' => date('c', $ts), 'sent' => date('c', $ts),
                'is_read' => (bool)$lido, 'is_draft' => false,
                'has_attachments' => (bool)$anexo, 'importance' => $imp,
                'is_flagged' => false, 'categories' => [],
                'conversation_id' => 'conv-' . $seq,
                'body_html' => self::body($nome, $assunto),
                'preview' => self::preview($assunto),
            ];
        }

        // Alguns enviados.
        foreach ([
            ['carlos@construtorabeta.com', 'Re: Orçamento de estruturas — dúvidas', 60],
            ['ana.ribeiro@clientexyz.com.br', 'Re: Proposta comercial — evento de lançamento', 240],
            ['jp@parceirotech.io', 'Confirmado — reunião quinta 15h', 1400],
        ] as $s) {
            $id = 'mock-msg-' . $seq++;
            $ts = $now - ($s[2] * 60);
            $messages[$id] = [
                'id' => $id, 'folder' => 'sentitems', 'subject' => $s[1],
                'from' => ['name' => 'Você', 'address' => 'voce@dshow.com.br'],
                'to' => [['name' => '', 'address' => $s[0]]], 'cc' => [],
                'received' => date('c', $ts), 'sent' => date('c', $ts),
                'is_read' => true, 'is_draft' => false, 'has_attachments' => false,
                'importance' => 'normal', 'is_flagged' => false, 'categories' => [],
                'conversation_id' => 'conv-out-' . $seq,
                'body_html' => '<p>Segue conforme combinado. Qualquer coisa, estou à disposição.</p><p>Abraço.</p>',
                'preview' => 'Segue conforme combinado. Qualquer coisa, estou à disposição.',
            ];
        }

        // Alguns agendados (data/hora futura).
        foreach ([
            ['ana.ribeiro@clientexyz.com.br', 'Proposta revisada — envio agendado', 120],
            ['financeiro@fornecedor.com', 'Lembrete de pagamento', 1500],
        ] as $sc) {
            $id = 'mock-msg-' . $seq++;
            $when = $now + ($sc[2] * 60);
            $messages[$id] = [
                'id' => $id, 'folder' => 'scheduled', 'subject' => $sc[1],
                'from' => ['name' => 'Você', 'address' => 'voce@dshow.com.br'],
                'to' => [['name' => '', 'address' => $sc[0]]], 'cc' => [],
                'received' => date('c', $now), 'sent' => date('c', $now),
                'is_read' => true, 'is_draft' => false, 'has_attachments' => false,
                'importance' => 'normal', 'is_flagged' => false, 'categories' => [],
                'conversation_id' => 'conv-sch-' . $id,
                'body_html' => '<p>Mensagem agendada de demonstração.</p>',
                'preview' => 'Mensagem agendada de demonstração.',
                'scheduled_at' => date('c', $when), 'sched_status' => 'scheduled',
            ];
        }

        // Marca algumas mensagens com categorias (por palavra-chave no assunto).
        $tagRules = [
            'proposta' => ['Proposta', 'Cliente'], 'cobrança' => ['Financeiro', 'Urgente'],
            'fatura' => ['Financeiro'], 'documento' => ['Aguardando'], 'contrato' => ['Cliente'],
            'reunião' => ['Cliente'], 'reembolso' => ['Financeiro'], 'férias' => ['Pessoal'],
        ];
        foreach ($messages as &$mm) {
            if ($mm['folder'] !== 'inbox') { continue; }
            $sl = mb_strtolower($mm['subject']);
            foreach ($tagRules as $kw => $cats) {
                if (mb_strpos($sl, $kw) !== false) {
                    $mm['categories'] = array_values(array_unique(array_merge($mm['categories'], $cats)));
                }
            }
        }
        unset($mm);

        // Anexos de demonstração nas mensagens marcadas com anexo.
        foreach ($messages as &$mm) {
            if (($mm['folder'] ?? '') === 'inbox' && !empty($mm['has_attachments'])) {
                $mm['attachments'] = [self::demoAttachment('doc')];
                $sl = mb_strtolower($mm['subject']);
                if (mb_strpos($sl, 'foto') !== false || mb_strpos($sl, 'materia') !== false || mb_strpos($sl, 'logo') !== false) {
                    $mm['attachments'][] = self::demoAttachment('img');
                }
            }
        }
        unset($mm);

        return [
            'seeded' => true,
            'accounts' => [ $mkAcc(1, 'voce@dshow.com.br', 'Você (Demo Corporativa)', 'work', true) ],
            'next_account_id' => 2,
            'messages' => $messages,
            'seq' => $seq,
            'templates' => self::templatesSeed(),
            'next_template_id' => 100,
            'categories' => self::categoriesSeed(),
            'rules' => self::rulesSeed(),
            'next_rule_id' => 100,
        ];
    }

    private static function rulesSeed(): array
    {
        $r = [];
        $r[1] = ['id' => 1, 'name' => 'Marcar propostas', 'enabled' => true, 'order' => 1,
            'conditions' => ['subject_contains' => 'proposta'],
            'actions' => ['assign_category' => 'Proposta', 'mark_important' => true]];
        $r[2] = ['id' => 2, 'name' => 'Arquivar newsletters', 'enabled' => true, 'order' => 2,
            'conditions' => ['from_contains' => 'news'],
            'actions' => ['move_to' => 'archive', 'mark_read' => true]];
        $r[3] = ['id' => 3, 'name' => 'Promoções → Spam', 'enabled' => false, 'order' => 3,
            'conditions' => ['subject_contains' => 'promoção'],
            'actions' => ['move_to' => 'junkemail', 'stop' => true]];
        return $r;
    }

    private static function categoriesSeed(): array
    {
        return [
            ['name' => 'Cliente',    'color' => '#16a34a'],
            ['name' => 'Urgente',    'color' => '#dc2626'],
            ['name' => 'Financeiro', 'color' => '#2563eb'],
            ['name' => 'Proposta',   'color' => '#7c3aed'],
            ['name' => 'Aguardando', 'color' => '#d97706'],
            ['name' => 'Pessoal',    'color' => '#0891b2'],
        ];
    }

    public const TEMPLATE_CATEGORIES = [
        'Propostas', 'Cobrança', 'Acompanhamento comercial', 'Confirmação de pedido',
        'Solicitação de documentos', 'Atendimento', 'Compras', 'Financeiro', 'Geral',
    ];

    private static function templatesSeed(): array
    {
        $now = time();
        $t = [];
        $add = static function (int $id, string $name, string $cat, string $subj, string $body, bool $fav) use (&$t, $now): void {
            $t[$id] = ['id' => $id, 'name' => $name, 'category' => $cat, 'subject' => $subj,
                'body_html' => $body, 'is_favorite' => $fav, 'created_at' => date('c', $now - $id * 3600)];
        };
        $add(1, 'Envio de proposta comercial', 'Propostas',
            'Proposta comercial — {{empresa}}',
            '<p>Olá, {{nome_cliente}},</p><p>Segue nossa proposta nº <strong>{{numero_proposta}}</strong> no valor de <strong>{{valor_proposta}}</strong>, conforme conversamos.</p><p>Fico à disposição para dúvidas.</p><p>Atenciosamente,<br>{{nome_usuario}}<br>{{email_usuario}} · {{telefone}}</p>', true);
        $add(2, 'Lembrete de fatura', 'Cobrança',
            'Lembrete: fatura em aberto',
            '<p>Olá, {{nome_contato}},</p><p>Passando para lembrar da fatura com vencimento em {{data_atual}}. Caso já tenha efetuado o pagamento, favor desconsiderar.</p><p>Obrigado,<br>{{nome_usuario}}</p>', false);
        $add(3, 'Follow-up após reunião', 'Acompanhamento comercial',
            'Retomando nossa conversa',
            '<p>Olá, {{nome_cliente}},</p><p>Foi ótimo falar com você. Como combinado, envio um resumo dos próximos passos.</p><p>Qualquer dúvida, estou à disposição.</p><p>Abraço,<br>{{nome_vendedor}}</p>', true);
        $add(4, 'Pedido confirmado', 'Confirmação de pedido',
            'Seu pedido foi confirmado',
            '<p>Olá, {{nome_cliente}},</p><p>Confirmamos o recebimento do seu pedido. Em breve enviaremos os detalhes de produção e prazos.</p><p>Atenciosamente,<br>{{empresa}}</p>', false);
        $add(5, 'Solicitação de documentos', 'Solicitação de documentos',
            'Documentos necessários para prosseguir',
            '<p>Olá, {{nome_contato}},</p><p>Para darmos andamento, precisamos dos seguintes documentos:</p><ul><li>Documento 1</li><li>Documento 2</li></ul><p>Obrigado,<br>{{nome_usuario}}</p>', false);
        $add(6, 'Confirmação de atendimento', 'Atendimento',
            'Recebemos sua solicitação',
            '<p>Olá, {{nome_contato}},</p><p>Recebemos sua solicitação e nossa equipe já está cuidando dela. Retornaremos em breve.</p><p>Atenciosamente,<br>Equipe {{empresa}}</p>', false);
        $add(7, 'Agradecimento', 'Geral',
            'Obrigado!',
            '<p>Olá, {{nome_cliente}},</p><p>Muito obrigado pela parceria e pela confiança. Seguimos à disposição.</p><p>Abraço,<br>{{nome_usuario}}</p>', true);
        return $t;
    }

    // ── Modelos (§22) ───────────────────────────────────────────────────
    public static function templatesList(?string $q = null, ?string $category = null): array
    {
        $s = &self::state();
        $itens = array_values($s['templates'] ?? []);
        if ($category !== null && $category !== '' && $category !== 'all') {
            $itens = array_values(array_filter($itens, fn($t) => $t['category'] === $category));
        }
        if ($q !== null && trim($q) !== '') {
            $n = mb_strtolower(trim($q));
            $itens = array_values(array_filter($itens, function ($t) use ($n) {
                return mb_strpos(mb_strtolower($t['name'] . ' ' . $t['subject'] . ' ' . strip_tags($t['body_html'])), $n) !== false;
            }));
        }
        usort($itens, fn($a, $b) => ($b['is_favorite'] <=> $a['is_favorite']) ?: strcasecmp($a['name'], $b['name']));
        return $itens;
    }

    public static function templateCreate(array $f): int
    {
        $s = &self::state();
        $id = $s['next_template_id']++;
        $s['templates'][$id] = [
            'id' => $id, 'name' => trim((string)($f['name'] ?? 'Sem nome')) ?: 'Sem nome',
            'category' => (string)($f['category'] ?? 'Geral'), 'subject' => (string)($f['subject'] ?? ''),
            'body_html' => (string)($f['body_html'] ?? ''), 'is_favorite' => false, 'created_at' => date('c'),
        ];
        return $id;
    }

    public static function templateUpdate(int $id, array $f): bool
    {
        $s = &self::state();
        if (!isset($s['templates'][$id])) { return false; }
        foreach (['name', 'category', 'subject', 'body_html'] as $k) {
            if (array_key_exists($k, $f)) { $s['templates'][$id][$k] = (string)$f[$k]; }
        }
        return true;
    }

    public static function templateDuplicate(int $id): ?int
    {
        $s = &self::state();
        if (!isset($s['templates'][$id])) { return null; }
        $novo = $s['templates'][$id];
        $nid = $s['next_template_id']++;
        $novo['id'] = $nid; $novo['name'] = $novo['name'] . ' (cópia)';
        $novo['is_favorite'] = false; $novo['created_at'] = date('c');
        $s['templates'][$nid] = $novo;
        return $nid;
    }

    public static function templateDelete(int $id): bool
    {
        $s = &self::state();
        if (!isset($s['templates'][$id])) { return false; }
        unset($s['templates'][$id]);
        return true;
    }

    public static function templateFavorite(int $id, bool $fav): bool
    {
        $s = &self::state();
        if (!isset($s['templates'][$id])) { return false; }
        $s['templates'][$id]['is_favorite'] = $fav;
        return true;
    }

    // ── Categorias (§15) ────────────────────────────────────────────────
    public static function categoriesList(): array
    {
        $s = &self::state();
        return array_values($s['categories'] ?? []);
    }

    public static function categoryCreate(string $name, string $color): bool
    {
        $name = trim($name);
        if ($name === '') { return false; }
        $s = &self::state();
        foreach ($s['categories'] as $c) { if (mb_strtolower($c['name']) === mb_strtolower($name)) { return false; } }
        $s['categories'][] = ['name' => $name, 'color' => $color !== '' ? $color : '#64748b'];
        return true;
    }

    public static function categorySetColor(string $name, string $color): bool
    {
        $s = &self::state();
        foreach ($s['categories'] as &$c) { if ($c['name'] === $name) { $c['color'] = $color; unset($c); return true; } }
        unset($c);
        return false;
    }

    /** §15.1: renomear = criar novo + reaplicar + remover antigo. No mock, renomeia em tudo. */
    public static function categoryRename(string $old, string $new): bool
    {
        $new = trim($new);
        if ($new === '') { return false; }
        $s = &self::state();
        $achou = false;
        foreach ($s['categories'] as &$c) { if ($c['name'] === $old) { $c['name'] = $new; $achou = true; } }
        unset($c);
        if (!$achou) { return false; }
        foreach ($s['messages'] as &$m) {
            if (in_array($old, $m['categories'], true)) {
                $m['categories'] = array_values(array_unique(array_map(fn($x) => $x === $old ? $new : $x, $m['categories'])));
            }
        }
        unset($m);
        return true;
    }

    public static function categoryDelete(string $name): bool
    {
        $s = &self::state();
        $antes = count($s['categories']);
        $s['categories'] = array_values(array_filter($s['categories'], fn($c) => $c['name'] !== $name));
        if (count($s['categories']) === $antes) { return false; }
        foreach ($s['messages'] as &$m) {
            if (in_array($name, $m['categories'], true)) {
                $m['categories'] = array_values(array_filter($m['categories'], fn($x) => $x !== $name));
            }
        }
        unset($m);
        return true;
    }

    private static function body(string $nome, string $assunto): string
    {
        $p = htmlspecialchars($nome, ENT_QUOTES);
        $a = htmlspecialchars($assunto, ENT_QUOTES);
        return '<p>Olá,</p>'
            . '<p>Este é um e-mail de <strong>demonstração</strong> gerado pelo modo de testes do módulo '
            . 'de E-mails do Dshow Dash (sem conexão real com a Microsoft).</p>'
            . '<p>Assunto: <em>' . $a . '</em>.</p>'
            . '<p>Você pode <strong>responder</strong>, <strong>encaminhar</strong>, <strong>arquivar</strong>, '
            . 'marcar como lido/não lido e excluir — as mudanças ficam salvas na sua sessão de teste.</p>'
            . '<p>Atenciosamente,<br>' . $p . '</p>';
    }

    private static function preview(string $assunto): string
    {
        return 'Olá, este é um e-mail de demonstração do módulo de E-mails. Assunto: ' . $assunto . '…';
    }

    // ── Leitura ─────────────────────────────────────────────────────────
    public static function accountsPublic(): array
    {
        $s = &self::state();
        return $s['accounts'];
    }

    public static function status(): array
    {
        $s = &self::state();
        $accs = $s['accounts'];
        $ativas = array_values(array_filter($accs, fn($a) => $a['is_active']));
        return [
            'phase' => 1, 'db_ready' => true, 'crypto_ready' => true,
            'oauth_configured' => true, 'tenant' => 'mock', 'redirect_uri' => null,
            'provider' => 'mock',
            'accounts_total' => count($accs), 'accounts_active' => count($ativas),
            'accounts_need_auth' => 0, 'accounts' => $accs,
            'message' => 'Modo de testes (dados fictícios). Conecte o Azure para e-mails reais.',
        ];
    }

    public static function listMessages(string $folder, int $top, ?string $skiptoken, ?string $q = null, ?string $filter = null, ?string $category = null): array
    {
        $s = &self::state();
        self::processScheduled(); // simula o job: agendados vencidos "se enviam"
        $folder = $folder === '' ? 'inbox' : $folder;
        $itens = array_values(array_filter($s['messages'], fn($m) => $m['folder'] === $folder));

        // Filtro por categoria (§15)
        if ($category !== null && trim($category) !== '') {
            $itens = array_values(array_filter($itens, fn($m) => in_array($category, $m['categories'], true)));
        }

        // Filtro rápido (§17.3)
        $hoje = date('Y-m-d');
        $itens = array_values(array_filter($itens, static function ($m) use ($filter, $hoje) {
            switch ($filter) {
                case 'unread':      return !$m['is_read'];
                case 'important':   return $m['importance'] === 'high';
                case 'flagged':     return $m['is_flagged'];
                case 'attachments': return $m['has_attachments'];
                case 'today':       return substr($m['received'], 0, 10) === $hoje;
                default:            return true;
            }
        }));

        // Busca (§17.1): assunto / remetente / trecho
        if ($q !== null && trim($q) !== '') {
            $needle = mb_strtolower(trim($q));
            $itens = array_values(array_filter($itens, static function ($m) use ($needle) {
                $hay = mb_strtolower(($m['subject'] ?? '') . ' ' . ($m['from']['name'] ?? '') . ' '
                    . ($m['from']['address'] ?? '') . ' ' . ($m['preview'] ?? ''));
                return mb_strpos($hay, $needle) !== false;
            }));
        }

        usort($itens, fn($a, $b) => strcmp($b['received'], $a['received']));
        $offset = max(0, (int)($skiptoken ?? 0));
        $top = max(1, min($top, 100));
        $page = array_slice($itens, $offset, $top);
        $next = ($offset + $top < count($itens)) ? (string)($offset + $top) : null;
        return ['items' => array_map([self::class, 'shapeList'], $page), 'next' => $next];
    }

    /** Leitura crua sem efeitos (para derivar assunto em reply/forward). */
    public static function peek(string $id): ?array
    {
        $s = &self::state();
        return $s['messages'][$id] ?? null;
    }

    public static function getMessage(string $id): ?array
    {
        $s = &self::state();
        if (!isset($s['messages'][$id])) { return null; }
        // abrir marca como lido
        $s['messages'][$id]['is_read'] = true;
        return self::shapeDetail($s['messages'][$id]);
    }

    public static function folders(): array
    {
        $s = &self::state();
        $map = [
            'inbox' => 'Caixa de Entrada', 'drafts' => 'Rascunhos', 'scheduled' => 'Agendados',
            'sentitems' => 'Enviados', 'archive' => 'Arquivados', 'junkemail' => 'Spam', 'deleteditems' => 'Lixeira',
        ];
        $out = [];
        foreach ($map as $key => $label) {
            $inFolder = array_filter($s['messages'], fn($m) => $m['folder'] === $key);
            $unread = array_filter($inFolder, fn($m) => !$m['is_read']);
            $out[] = ['id' => $key, 'well_known' => $key, 'display_name' => $label,
                      'unread' => count($unread), 'total' => count($inFolder), 'children' => []];
        }
        return $out;
    }

    public static function headerCounter(): array
    {
        $s = &self::state();
        $inbox = array_filter($s['messages'], fn($m) => $m['folder'] === 'inbox');
        $today = date('Y-m-d');
        $rec = array_filter($inbox, fn($m) => substr($m['received'], 0, 10) === $today);
        $unread = array_filter($inbox, fn($m) => !$m['is_read']);
        return ['received_today' => count($rec), 'unread' => count($unread),
                'updated_at' => date('c'), 'degraded' => false];
    }

    // ── Regras automáticas (§16) ────────────────────────────────────────
    public static function rulesList(): array
    {
        $s = &self::state();
        $itens = array_values($s['rules'] ?? []);
        usort($itens, fn($a, $b) => ($a['order'] ?? 0) <=> ($b['order'] ?? 0));
        return $itens;
    }

    public static function ruleCreate(array $r): int
    {
        $s = &self::state();
        $id = $s['next_rule_id']++;
        $maxOrder = 0;
        foreach ($s['rules'] as $x) { $maxOrder = max($maxOrder, (int)($x['order'] ?? 0)); }
        $norm = self::normalizeRule($r);
        $norm['id'] = $id; $norm['order'] = $maxOrder + 1;
        $s['rules'][$id] = $norm;
        return $id;
    }

    public static function ruleUpdate(int $id, array $r): bool
    {
        $s = &self::state();
        if (!isset($s['rules'][$id])) { return false; }
        $norm = self::normalizeRule($r);
        $norm['id'] = $id; $norm['order'] = $s['rules'][$id]['order'];
        $s['rules'][$id] = $norm;
        return true;
    }

    public static function ruleDelete(int $id): bool
    {
        $s = &self::state();
        if (!isset($s['rules'][$id])) { return false; }
        unset($s['rules'][$id]);
        return true;
    }

    public static function ruleToggle(int $id, bool $enabled): bool
    {
        $s = &self::state();
        if (!isset($s['rules'][$id])) { return false; }
        $s['rules'][$id]['enabled'] = $enabled;
        return true;
    }

    /** Move a regra para cima/baixo trocando 'order' com a vizinha. */
    public static function ruleReorder(int $id, string $dir): bool
    {
        $s = &self::state();
        if (!isset($s['rules'][$id])) { return false; }
        $ordenadas = self::rulesList();
        $idx = null;
        foreach ($ordenadas as $i => $r) { if ($r['id'] === $id) { $idx = $i; break; } }
        if ($idx === null) { return false; }
        $alvo = $dir === 'up' ? $idx - 1 : $idx + 1;
        if ($alvo < 0 || $alvo >= count($ordenadas)) { return false; }
        $a = $ordenadas[$idx]['id']; $b = $ordenadas[$alvo]['id'];
        $tmp = $s['rules'][$a]['order'];
        $s['rules'][$a]['order'] = $s['rules'][$b]['order'];
        $s['rules'][$b]['order'] = $tmp;
        return true;
    }

    public static function ruleTest(int $id): int
    {
        $s = &self::state();
        if (!isset($s['rules'][$id])) { return 0; }
        $rule = $s['rules'][$id];
        $n = 0;
        foreach ($s['messages'] as $m) {
            if (($m['folder'] ?? '') === 'inbox' && self::ruleMatches($rule, $m)) { $n++; }
        }
        return $n;
    }

    /** Roda as regras ativas (em ordem) sobre a Caixa de Entrada. */
    public static function rulesApply(): array
    {
        $s = &self::state();
        $ativas = array_values(array_filter(self::rulesList(), fn($r) => $r['enabled']));
        $afetadas = 0; $acoes = 0;
        foreach ($s['messages'] as &$m) {
            if (($m['folder'] ?? '') !== 'inbox') { continue; }
            $mudou = false;
            foreach ($ativas as $rule) {
                if (!self::ruleMatches($rule, $m)) { continue; }
                $a = $rule['actions'];
                if (!empty($a['mark_read']))      { $m['is_read'] = true; $mudou = true; }
                if (!empty($a['mark_important']))  { $m['importance'] = 'high'; $mudou = true; }
                if (!empty($a['assign_category']) && !in_array($a['assign_category'], $m['categories'], true)) {
                    $m['categories'][] = $a['assign_category']; $mudou = true;
                }
                if (!empty($a['move_to']))  { $m['folder'] = $a['move_to']; $mudou = true; }
                if (!empty($a['delete']))   { $m['folder'] = 'deleteditems'; $mudou = true; }
                $acoes++;
                if (!empty($a['stop']) || ($m['folder'] ?? '') !== 'inbox') { break; }
            }
            if ($mudou) { $afetadas++; }
        }
        unset($m);
        return ['affected' => $afetadas, 'actions' => $acoes, 'rules' => count($ativas)];
    }

    private static function ruleMatches(array $rule, array $m): bool
    {
        $c = $rule['conditions'] ?? [];
        if (!self::hasAnyCondition($c)) { return false; }
        if (!empty($c['from_contains']) && mb_stripos(($m['from']['name'] ?? '') . ' ' . ($m['from']['address'] ?? ''), $c['from_contains']) === false) { return false; }
        if (!empty($c['subject_contains']) && mb_stripos($m['subject'] ?? '', $c['subject_contains']) === false) { return false; }
        if (!empty($c['body_contains']) && mb_stripos(strip_tags($m['body_html'] ?? ''), $c['body_contains']) === false) { return false; }
        if (!empty($c['has_attachment']) && empty($m['has_attachments'])) { return false; }
        if (!empty($c['importance']) && ($m['importance'] ?? '') !== $c['importance']) { return false; }
        if (!empty($c['category']) && !in_array($c['category'], $m['categories'] ?? [], true)) { return false; }
        return true;
    }

    private static function hasAnyCondition(array $c): bool
    {
        return !empty($c['from_contains']) || !empty($c['subject_contains']) || !empty($c['body_contains'])
            || !empty($c['has_attachment']) || !empty($c['importance']) || !empty($c['category']);
    }

    private static function normalizeRule(array $r): array
    {
        $c = is_array($r['conditions'] ?? null) ? $r['conditions'] : [];
        $a = is_array($r['actions'] ?? null) ? $r['actions'] : [];
        return [
            'name' => (trim((string)($r['name'] ?? 'Regra')) ?: 'Regra'),
            'enabled' => (bool)($r['enabled'] ?? true),
            'conditions' => [
                'from_contains'    => trim((string)($c['from_contains'] ?? '')),
                'subject_contains' => trim((string)($c['subject_contains'] ?? '')),
                'body_contains'    => trim((string)($c['body_contains'] ?? '')),
                'has_attachment'   => (bool)($c['has_attachment'] ?? false),
                'importance'       => ($c['importance'] ?? '') === 'high' ? 'high' : '',
                'category'         => trim((string)($c['category'] ?? '')),
            ],
            'actions' => [
                'move_to'         => trim((string)($a['move_to'] ?? '')),
                'assign_category' => trim((string)($a['assign_category'] ?? '')),
                'mark_read'       => (bool)($a['mark_read'] ?? false),
                'mark_important'  => (bool)($a['mark_important'] ?? false),
                'delete'          => (bool)($a['delete'] ?? false),
                'stop'            => (bool)($a['stop'] ?? false),
            ],
        ];
    }

    // ── Envio em massa (§23) ────────────────────────────────────────────
    public static function massStart(string $subject, string $bodyHtml, array $recipients, bool $useBcc): int
    {
        $s = &self::state();
        if (!isset($s['mass_jobs'])) { $s['mass_jobs'] = []; }
        if (!isset($s['next_mass_id'])) { $s['next_mass_id'] = 1; }
        $id = $s['next_mass_id']++;
        $recips = array_values(array_unique(array_filter(array_map('trim', $recipients), fn($e) => $e !== '')));
        $s['mass_jobs'][$id] = [
            'id' => $id, 'subject' => $subject, 'body_html' => $bodyHtml, 'use_bcc' => $useBcc,
            'recipients' => $recips, 'total' => count($recips), 'started_at' => time(),
        ];
        return $id;
    }

    /** Progresso baseado em tempo (simula processamento em lotes ~8/s). */
    public static function massStatus(int $id): ?array
    {
        $s = &self::state();
        if (!isset($s['mass_jobs'][$id])) { return null; }
        $j = $s['mass_jobs'][$id];
        $total = (int)$j['total'];
        $elapsed = max(0, time() - (int)$j['started_at']);
        $processed = $total > 0 ? min($total, (int)floor($elapsed * 8) + 2) : 0;
        $results = []; $success = 0; $failure = 0;
        for ($i = 0; $i < $processed; $i++) {
            $e = $j['recipients'][$i];
            $ok = (bool)filter_var($e, FILTER_VALIDATE_EMAIL) && ($i % 13 !== 5); // falha demonstrativa ocasional
            $results[] = ['email' => $e, 'status' => $ok ? 'sent' : 'failed'];
            $ok ? $success++ : $failure++;
        }
        return [
            'id' => $id, 'total' => $total, 'processed' => $processed,
            'success' => $success, 'failure' => $failure,
            'status' => $processed >= $total ? 'done' : 'processing',
            'results' => $results,
        ];
    }

    // ── Dashboard (§24) — computa dos dados da sessão ───────────────────
    public static function dashboard(string $period = '7d'): array
    {
        $s = &self::state();
        $msgs = array_values($s['messages']);
        $hoje = date('Y-m-d');
        $dias = $period === '30d' ? 30 : ($period === 'today' ? 1 : 7);
        $limite = strtotime("-{$dias} days", strtotime($hoje . ' 00:00:00'));

        $inbox = array_filter($msgs, fn($m) => $m['folder'] === 'inbox');
        $sent  = array_filter($msgs, fn($m) => $m['folder'] === 'sentitems');

        $recHoje = count(array_filter($inbox, fn($m) => substr($m['received'], 0, 10) === $hoje));
        $envHoje = count(array_filter($sent,  fn($m) => substr($m['sent'], 0, 10) === $hoje));
        $naoLidos = count(array_filter($inbox, fn($m) => !$m['is_read']));
        $importantes = count(array_filter($inbox, fn($m) => $m['importance'] === 'high'));
        $comAnexo = count(array_filter($inbox, fn($m) => $m['has_attachments']));
        $arquivadas = count(array_filter($msgs, fn($m) => $m['folder'] === 'archive'));
        $lidas = count(array_filter($inbox, fn($m) => $m['is_read']));
        $totalPeriodo = count(array_filter($inbox, fn($m) => strtotime($m['received']) >= $limite));

        // Série por dia (últimos N dias): recebidos e enviados
        $porDia = [];
        for ($i = $dias - 1; $i >= 0; $i--) {
            $d = date('Y-m-d', strtotime("-{$i} days", strtotime($hoje . ' 00:00:00')));
            $r = count(array_filter($inbox, fn($m) => substr($m['received'], 0, 10) === $d));
            $e = count(array_filter($sent,  fn($m) => substr($m['sent'], 0, 10) === $d));
            $porDia[] = ['date' => $d, 'received' => $r, 'sent' => $e];
        }

        // Volume por hora (0-23) dos recebidos
        $porHora = array_fill(0, 24, 0);
        foreach ($inbox as $m) {
            $h = (int)date('G', strtotime($m['received']));
            $porHora[$h]++;
        }
        $porHoraArr = [];
        foreach ($porHora as $h => $c) { $porHoraArr[] = ['hour' => $h, 'count' => $c]; }

        // Top contatos (remetentes mais frequentes)
        $cont = [];
        foreach ($inbox as $m) {
            $addr = $m['from']['address'] ?? '?';
            if (!isset($cont[$addr])) { $cont[$addr] = ['name' => $m['from']['name'] ?? $addr, 'address' => $addr, 'count' => 0]; }
            $cont[$addr]['count']++;
        }
        usort($cont, fn($a, $b) => $b['count'] - $a['count']);
        $top = array_slice(array_values($cont), 0, 5);

        // Tempo médio de resposta (ilustrativo no mock)
        $avgResp = 5400 + ($naoLidos * 240); // ~1h30 + carga

        return [
            'available' => true, 'provider' => 'mock', 'period' => $period,
            'big' => [
                'received_today' => $recHoje, 'sent_today' => $envHoje, 'unread' => $naoLidos,
                'important' => $importantes, 'with_attachments' => $comAnexo,
                'total_period' => $totalPeriodo, 'avg_per_day' => round($totalPeriodo / max($dias, 1), 1),
                'avg_response_seconds' => $avgResp,
            ],
            'by_day' => $porDia,
            'by_hour' => $porHoraArr,
            'top_contacts' => $top,
            'status' => ['read' => $lidas, 'unread' => $naoLidos, 'important' => $importantes, 'archived' => $arquivadas],
            'attachments_count' => $comAnexo,
        ];
    }

    // ── Mutações ────────────────────────────────────────────────────────
    public static function patch(string $id, array $fields): bool
    {
        $s = &self::state();
        if (!isset($s['messages'][$id])) { return false; }
        foreach ($fields as $k => $v) { $s['messages'][$id][$k] = $v; }
        return true;
    }

    public static function move(string $id, string $dest): bool
    {
        return self::patch($id, ['folder' => $dest]);
    }

    public static function delete(string $id): bool
    {
        $s = &self::state();
        if (!isset($s['messages'][$id])) { return false; }
        // DELETE = move p/ Lixeira (soft), como no Outlook
        $s['messages'][$id]['folder'] = 'deleteditems';
        return true;
    }

    // ── Anexos (§20) ────────────────────────────────────────────────────
    private static function demoAttachment(string $type): array
    {
        if ($type === 'img') {
            $b64 = 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAKklEQVR42mNkYPhfz0AEYBxVSF8Fg/8ZGBj+U2CgQBqDQ4XhP1UYCgD6+wf5cQhIQwAAAABJRU5ErkJggg==';
            return ['id' => 'att-' . bin2hex(random_bytes(4)), 'name' => 'imagem-demo.png',
                'contentType' => 'image/png', 'size' => strlen(base64_decode($b64)), 'content_b64' => $b64, 'isInline' => false];
        }
        $txt = base64_encode("Documento de demonstração\nConteúdo fictício para teste de anexos no Dshow Dash.\n");
        return ['id' => 'att-' . bin2hex(random_bytes(4)), 'name' => 'documento-demo.txt',
            'contentType' => 'text/plain', 'size' => strlen(base64_decode($txt)), 'content_b64' => $txt, 'isInline' => false];
    }

    /** Normaliza anexos recebidos do front ({name, contentType, size, content_b64}). */
    private static function normalizeAttachments($arr): array
    {
        if (!is_array($arr)) { return []; }
        $out = [];
        foreach ($arr as $a) {
            if (!is_array($a) || empty($a['name'])) { continue; }
            $b64 = (string)($a['content_b64'] ?? '');
            $out[] = [
                'id' => 'att-' . bin2hex(random_bytes(4)),
                'name' => mb_substr((string)$a['name'], 0, 255),
                'contentType' => (string)($a['contentType'] ?? 'application/octet-stream'),
                'size' => (int)($a['size'] ?? strlen(base64_decode($b64) ?: '')),
                'content_b64' => $b64, 'isInline' => false,
            ];
        }
        return $out;
    }

    /** Metadados dos anexos de uma mensagem (sem o conteúdo). */
    public static function listAttachments(string $id): array
    {
        $m = self::peek($id);
        $atts = $m['attachments'] ?? [];
        return array_map(fn($a) => [
            'id' => $a['id'], 'name' => $a['name'], 'contentType' => $a['contentType'],
            'size' => $a['size'], 'isInline' => $a['isInline'] ?? false,
        ], $atts);
    }

    /** Anexo completo (com content_b64) para download, ou null. */
    public static function getAttachment(string $id, string $aid): ?array
    {
        $m = self::peek($id);
        foreach (($m['attachments'] ?? []) as $a) {
            if ($a['id'] === $aid) { return $a; }
        }
        return null;
    }

    /** Cria uma mensagem em Enviados (send/reply/forward). */
    public static function appendSent(string $subject, string $bodyHtml, array $to, array $attachments = []): string
    {
        $s = &self::state();
        $id = 'mock-msg-' . ($s['seq']++);
        $now = time();
        $atts = self::normalizeAttachments($attachments);
        $s['messages'][$id] = [
            'id' => $id, 'folder' => 'sentitems', 'subject' => $subject !== '' ? $subject : '(sem assunto)',
            'from' => ['name' => 'Você', 'address' => 'voce@dshow.com.br'],
            'to' => array_map(fn($e) => ['name' => '', 'address' => $e], $to), 'cc' => [],
            'received' => date('c', $now), 'sent' => date('c', $now),
            'is_read' => true, 'is_draft' => false, 'has_attachments' => count($atts) > 0,
            'importance' => 'normal', 'is_flagged' => false, 'categories' => [],
            'conversation_id' => 'conv-out-' . $id,
            'body_html' => $bodyHtml !== '' ? $bodyHtml : '<p>(sem conteúdo)</p>',
            'preview' => mb_substr(trim(strip_tags($bodyHtml)), 0, 120),
            'attachments' => $atts,
        ];
        return $id;
    }

    // ── Agendamento (§13) ───────────────────────────────────────────────
    /** Simula o job: agendados com horário vencido migram para Enviados. */
    public static function processScheduled(): int
    {
        $s = &self::state();
        $now = time();
        $n = 0;
        foreach ($s['messages'] as &$m) {
            if (($m['folder'] ?? '') === 'scheduled' && ($m['sched_status'] ?? '') === 'scheduled'
                && !empty($m['scheduled_at']) && strtotime($m['scheduled_at']) <= $now) {
                $m['folder'] = 'sentitems';
                $m['sched_status'] = 'sent';
                $m['sent'] = date('c', $now);
                $m['received'] = date('c', $now);
                $n++;
            }
        }
        unset($m);
        return $n;
    }

    public static function scheduleCreate(string $subject, string $bodyHtml, array $to, string $scheduledAt, array $attachments = []): string
    {
        $s = &self::state();
        $id = 'mock-msg-' . ($s['seq']++);
        $now = time();
        $atts = self::normalizeAttachments($attachments);
        $s['messages'][$id] = [
            'id' => $id, 'folder' => 'scheduled', 'subject' => $subject !== '' ? $subject : '(sem assunto)',
            'from' => ['name' => 'Você', 'address' => 'voce@dshow.com.br'],
            'to' => array_map(fn($e) => ['name' => '', 'address' => $e], $to), 'cc' => [],
            'received' => date('c', $now), 'sent' => date('c', $now),
            'is_read' => true, 'is_draft' => false, 'has_attachments' => count($atts) > 0,
            'importance' => 'normal', 'is_flagged' => false, 'categories' => [],
            'conversation_id' => 'conv-sch-' . $id,
            'body_html' => $bodyHtml !== '' ? $bodyHtml : '<p>(sem conteúdo)</p>',
            'preview' => mb_substr(trim(strip_tags($bodyHtml)), 0, 120),
            'scheduled_at' => $scheduledAt, 'sched_status' => 'scheduled',
            'attachments' => $atts,
        ];
        return $id;
    }

    public static function scheduleCancel(string $id): bool
    {
        $s = &self::state();
        if (!isset($s['messages'][$id]) || ($s['messages'][$id]['folder'] ?? '') !== 'scheduled') { return false; }
        $s['messages'][$id]['sched_status'] = 'cancelled';
        return true;
    }

    public static function scheduleSendNow(string $id): bool
    {
        $s = &self::state();
        if (!isset($s['messages'][$id]) || ($s['messages'][$id]['folder'] ?? '') !== 'scheduled') { return false; }
        $now = time();
        $s['messages'][$id]['folder'] = 'sentitems';
        $s['messages'][$id]['sched_status'] = 'sent';
        $s['messages'][$id]['sent'] = date('c', $now);
        $s['messages'][$id]['received'] = date('c', $now);
        return true;
    }

    public static function createDraft(string $subject, string $bodyHtml, array $to): string
    {
        $s = &self::state();
        $id = 'mock-msg-' . ($s['seq']++);
        $now = time();
        $s['messages'][$id] = [
            'id' => $id, 'folder' => 'drafts', 'subject' => $subject,
            'from' => ['name' => 'Você', 'address' => 'voce@dshow.com.br'],
            'to' => array_map(fn($e) => ['name' => '', 'address' => $e], $to), 'cc' => [],
            'received' => date('c', $now), 'sent' => date('c', $now),
            'is_read' => true, 'is_draft' => true, 'has_attachments' => false,
            'importance' => 'normal', 'is_flagged' => false, 'categories' => [],
            'conversation_id' => 'conv-draft-' . $id,
            'body_html' => $bodyHtml, 'preview' => mb_substr(trim(strip_tags($bodyHtml)), 0, 120),
        ];
        return $id;
    }

    // ── Contas ──────────────────────────────────────────────────────────
    /** "Conecta" uma nova conta pessoal mock (chamado pelo callback). */
    public static function connectAccount(): int
    {
        $s = &self::state();
        $id = $s['next_account_id']++;
        $now = time();
        $s['accounts'][] = [
            'id' => $id, 'microsoft_account_id' => 'mock-' . $id, 'tenant_id' => 'consumers',
            'email' => 'voce.pessoal@outlook.com', 'display_name' => 'Você (Demo Pessoal)',
            'account_type' => 'personal', 'is_default' => false, 'is_active' => true,
            'connection_status' => 'connected', 'scopes' => 'Mail.Read Mail.Send',
            'token_expires_at' => date('c', $now + 3600), 'last_sync_at' => date('c', $now),
            'last_success_at' => date('c', $now), 'last_error_code' => null, 'last_error_message' => null,
            'created_at' => date('c', $now), 'disconnected_at' => null,
        ];
        return $id;
    }

    public static function disconnect(int $id): bool
    {
        $s = &self::state();
        $found = false;
        foreach ($s['accounts'] as $i => $a) {
            if ($a['id'] === $id) {
                unset($s['accounts'][$i]); $found = true;
            }
        }
        $s['accounts'] = array_values($s['accounts']);
        if ($found && !array_filter($s['accounts'], fn($a) => $a['is_default']) && $s['accounts']) {
            $s['accounts'][0]['is_default'] = true;
        }
        return $found;
    }

    public static function setDefault(int $id): bool
    {
        $s = &self::state();
        $ok = false;
        foreach ($s['accounts'] as &$a) { $a['is_default'] = ($a['id'] === $id); if ($a['id'] === $id) { $ok = true; } }
        unset($a);
        return $ok;
    }

    public static function ownsAccount(int $id): bool
    {
        $s = &self::state();
        foreach ($s['accounts'] as $a) { if ($a['id'] === $id) { return true; } }
        return false;
    }

    // ── shapers (mesmas chaves do MessageService real) ──────────────────
    private static function shapeList(array $m): array
    {
        return [
            'id' => $m['id'], 'subject' => $m['subject'], 'from' => $m['from'], 'to' => $m['to'],
            'received' => $m['received'], 'sent' => $m['sent'], 'preview' => $m['preview'],
            'is_read' => $m['is_read'], 'is_draft' => $m['is_draft'], 'has_attachments' => $m['has_attachments'],
            'importance' => $m['importance'], 'is_flagged' => $m['is_flagged'],
            'categories' => $m['categories'], 'conversation_id' => $m['conversation_id'],
            'scheduled_at' => $m['scheduled_at'] ?? null, 'sched_status' => $m['sched_status'] ?? null,
        ];
    }

    /** Mesma forma que o Graph devolve em /me/messages/{id} (o front consome assim). */
    private static function shapeDetail(array $m): array
    {
        $rcpt = fn($x) => ['emailAddress' => ['name' => $x['name'] ?? '', 'address' => $x['address'] ?? '']];
        return [
            'id' => $m['id'], 'subject' => $m['subject'],
            'from' => ['emailAddress' => $m['from']],
            'toRecipients' => array_map($rcpt, $m['to']),
            'ccRecipients' => array_map($rcpt, $m['cc'] ?? []),
            'bccRecipients' => [],
            'receivedDateTime' => $m['received'], 'sentDateTime' => $m['sent'],
            'body' => ['contentType' => 'HTML', 'content' => $m['body_html']],
            'bodyPreview' => $m['preview'], 'isRead' => $m['is_read'],
            'hasAttachments' => $m['has_attachments'], 'importance' => $m['importance'],
            'categories' => $m['categories'], 'webLink' => null,
        ];
    }
}
