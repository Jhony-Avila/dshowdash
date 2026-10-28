<?php
// Google Calendar / GcalLinks - entidades internas vinculaveis (§32, §34, §57)
// @module google-calendar.links
// @version 1.0.0
// @created 2026-07-30
// @app Google Calendar
//
// ─────────────────────────────────────────────────────────────────────────────
// SOMENTE LEITURA. Nenhum metodo aqui escreve em PIPE_DSHOW nem em DSHOWDASH:
// o modulo de agenda consulta o CRM, nao o administra. Escrever em base de outro
// modulo por um caminho lateral e como esse projeto ja se machucou antes.
//
// FONTES E POR QUE ESTAS:
//
//   Pipedrive (PIPE_DSHOW, LOCAL) — negocios, pessoas, organizacoes.
//   Medido em 2026-07-30: ~50-110 ms por busca sobre 19.947 negocios, 18.218
//   pessoas e 13.062 organizacoes ativas. Serve autocomplete com folga.
//
//   Koala (DSHOWDASH, LOCAL) — propostas. 12 registros, custo desprezivel.
//
//   DSHOW_PROD (clientes/fornecedores) — FICOU DE FORA, e a razao e medida:
//   o banco e REMOTO e o handshake sozinho leva ~752 ms; alem disso `ent_cliente`
//   nao guarda o nome (so `id_entidade`), entao cada busca exigiria um JOIN
//   remoto a mais. Autocomplete que responde em mais de um segundo nao e usado —
//   o usuario digita o nome inteiro antes de a primeira sugestao chegar. O
//   caminho certo e um cache local, que e trabalho de SINCRONIZACAO, nao de
//   vinculo. Registrado no 05-plano-fases.md.
//
// ARMADILHA DO SCHEMA (medida, nao suposta):
//   `pipe_organizations.name_norm` e `pipe_organizations.cnpj` estao 100% NULL
//   (13.063 de 13.063). O indice `ix_name` existe mas nao serve para nada, e
//   `persons.email_norm` esse SIM esta preenchido (98%). Por isso a busca de
//   organizacao vai por `name` mesmo (full scan medido em ~101 ms) e a de pessoa
//   aproveita o indice de e-mail.
declare(strict_types=1);

final class GcalLinks
{
    /** Menos que isto devolve meio banco e nao ajuda ninguem. */
    private const MIN_BUSCA = 2;
    private const LIMITE    = 12;

    public static function tipos(): array
    {
        return [
            ['id' => 'pipedrive_deal', 'rotulo' => 'Negócio',      'fonte' => 'Pipedrive'],
            ['id' => 'pessoa',         'rotulo' => 'Pessoa',       'fonte' => 'Pipedrive'],
            ['id' => 'organizacao',    'rotulo' => 'Organização',  'fonte' => 'Pipedrive'],
            ['id' => 'proposta',       'rotulo' => 'Proposta',     'fonte' => 'Koala'],
        ];
    }

    /** Conexao read-only ao Pipedrive; null quando indisponivel (degrada, nao quebra). */
    private static function pipe(): ?PDO
    {
        static $pdo = null, $tentou = false;
        if ($tentou) return $pdo;
        $tentou = true;
        try { $pdo = getConnection('PIPE_DSHOW'); }
        catch (\Throwable $e) {
            error_log('[gcal] PIPE_DSHOW indisponivel: ' . $e->getMessage());
            $pdo = null;
        }
        return $pdo;
    }

    private static function dash(): ?PDO
    {
        static $pdo = null, $tentou = false;
        if ($tentou) return $pdo;
        $tentou = true;
        try { $pdo = getConnection('DSHOWDASH'); }
        catch (\Throwable $e) {
            error_log('[gcal] DSHOWDASH indisponivel: ' . $e->getMessage());
            $pdo = null;
        }
        return $pdo;
    }

    private static function money(?string $v, ?string $moeda): ?string
    {
        if ($v === null || $v === '') return null;
        $n = (float)$v;
        if ($n <= 0) return null;
        $simbolo = ($moeda === 'BRL' || $moeda === null) ? 'R$' : $moeda . ' ';
        return $simbolo . ' ' . number_format($n, 2, ',', '.');
    }

    /**
     * Busca unificada.
     *
     * @param string      $q     termo
     * @param string|null $tipo  restringe a um tipo; null = todos
     * @return array{itens:array,fontes:array,degradado:array}
     */
    public static function buscar(string $q, ?string $tipo = null): array
    {
        $q = trim($q);
        if (mb_strlen($q) < self::MIN_BUSCA) {
            return ['itens' => [], 'fontes' => [], 'degradado' => [],
                    'aviso' => 'Digite pelo menos ' . self::MIN_BUSCA . ' caracteres.'];
        }

        $itens = [];
        $fontes = [];
        $degradado = [];

        $quer = static fn(string $t): bool => $tipo === null || $tipo === $t;

        if ($quer('pipedrive_deal') || $quer('pessoa') || $quer('organizacao')) {
            $pdo = self::pipe();
            if ($pdo === null) {
                $degradado[] = 'Pipedrive indisponível no momento.';
            } else {
                if ($quer('pipedrive_deal'))  { $itens = array_merge($itens, self::negocios($pdo, $q)); $fontes[] = 'Pipedrive'; }
                if ($quer('pessoa'))          { $itens = array_merge($itens, self::pessoas($pdo, $q)); }
                if ($quer('organizacao'))     { $itens = array_merge($itens, self::organizacoes($pdo, $q)); }
            }
        }

        if ($quer('proposta')) {
            $pdo = self::dash();
            if ($pdo === null) {
                $degradado[] = 'Koala indisponível no momento.';
            } else {
                $itens = array_merge($itens, self::propostas($pdo, $q));
                $fontes[] = 'Koala';
            }
        }

        return ['itens' => $itens, 'fontes' => array_values(array_unique($fontes)),
                'degradado' => $degradado, 'aviso' => null];
    }

    private static function negocios(PDO $pdo, string $q): array
    {
        // `title` nao tem indice (medido): full scan de ~19,9 mil linhas em ~50 ms.
        // O LIMIT e o que mantem isso barato — sem ele, um "a" traria tudo.
        $sql = "SELECT d.pipedrive_id, d.title, d.value, d.currency, d.status,
                       d.expected_close_date, d.next_activity_date,
                       s.name AS etapa, o.name AS org, p.name AS pessoa,
                       u.name AS responsavel
                  FROM pipe_deals d
                  LEFT JOIN pipe_stages s        ON s.pipedrive_id = d.stage_id
                  LEFT JOIN pipe_organizations o ON o.pipedrive_id = d.org_id
                  LEFT JOIN pipe_persons p       ON p.pipedrive_id = d.person_id
                  LEFT JOIN pipe_users u         ON u.pipedrive_id = d.owner_id
                 WHERE d.is_deleted = 0
                   AND d.title LIKE :q
                 ORDER BY (d.status = 'open') DESC, d.update_time DESC
                 LIMIT " . self::LIMITE;
        $st = $pdo->prepare($sql);
        $st->execute([':q' => '%' . $q . '%']);

        $out = [];
        foreach ($st->fetchAll(PDO::FETCH_ASSOC) as $r) {
            $extra = [];
            $v = self::money($r['value'], $r['currency']);
            if ($v)               $extra['valor'] = $v;
            if ($r['etapa'])      $extra['etapa'] = $r['etapa'];
            if ($r['responsavel']) $extra['responsável'] = $r['responsavel'];
            $out[] = [
                'entity_type' => 'pipedrive_deal',
                'entity_id'   => (string)$r['pipedrive_id'],
                'label'       => $r['title'],
                'sublabel'    => trim(($r['org'] ?? $r['pessoa'] ?? '') . ' · ' . ($r['etapa'] ?? ''), ' ·'),
                'fonte'       => 'Pipedrive',
                'status'      => $r['status'],
                'extra'       => $extra,
            ];
        }
        return $out;
    }

    private static function pessoas(PDO $pdo, string $q): array
    {
        // email_norm ESTA preenchido (98%) e tem indice: o prefixo usa o indice;
        // o nome cai em scan, mas a tabela e menor que a de negocios.
        $sql = "SELECT p.pipedrive_id, p.name, p.primary_email, p.primary_phone,
                       p.job_title, o.name AS org
                  FROM pipe_persons p
                  LEFT JOIN pipe_organizations o ON o.pipedrive_id = p.org_id
                 WHERE p.is_deleted = 0
                   AND (p.name LIKE :q OR p.email_norm LIKE :qp)
                 ORDER BY p.update_time DESC
                 LIMIT " . self::LIMITE;
        $st = $pdo->prepare($sql);
        $st->execute([':q' => '%' . $q . '%', ':qp' => mb_strtolower($q) . '%']);

        $out = [];
        foreach ($st->fetchAll(PDO::FETCH_ASSOC) as $r) {
            $extra = [];
            if ($r['job_title']) $extra['cargo'] = $r['job_title'];
            if ($r['primary_phone']) $extra['telefone'] = $r['primary_phone'];
            $out[] = [
                'entity_type' => 'pessoa',
                'entity_id'   => (string)$r['pipedrive_id'],
                'label'       => $r['name'],
                'sublabel'    => trim(($r['primary_email'] ?? '') . ' · ' . ($r['org'] ?? ''), ' ·'),
                'fonte'       => 'Pipedrive',
                // O e-mail volta separado porque a UI oferece "convidar" direto.
                'email'       => $r['primary_email'],
                'extra'       => $extra,
            ];
        }
        return $out;
    }

    private static function organizacoes(PDO $pdo, string $q): array
    {
        $sql = "SELECT o.pipedrive_id, o.name, o.city, o.state,
                       (SELECT COUNT(*) FROM pipe_deals d
                         WHERE d.org_id = o.pipedrive_id AND d.is_deleted = 0 AND d.status = 'open') AS abertos
                  FROM pipe_organizations o
                 WHERE o.is_deleted = 0
                   AND o.name LIKE :q
                 ORDER BY o.update_time DESC
                 LIMIT " . self::LIMITE;
        $st = $pdo->prepare($sql);
        $st->execute([':q' => '%' . $q . '%']);

        $out = [];
        foreach ($st->fetchAll(PDO::FETCH_ASSOC) as $r) {
            $extra = [];
            if ((int)$r['abertos'] > 0) $extra['negócios abertos'] = (string)(int)$r['abertos'];
            $out[] = [
                'entity_type' => 'organizacao',
                'entity_id'   => (string)$r['pipedrive_id'],
                'label'       => $r['name'],
                'sublabel'    => trim(($r['city'] ?? '') . ' ' . ($r['state'] ?? '')),
                'fonte'       => 'Pipedrive',
                'extra'       => $extra,
            ];
        }
        return $out;
    }

    private static function propostas(PDO $pdo, string $q): array
    {
        $sql = "SELECT id, proposal_number, title, project_name, status,
                       total_final, currency, seller_name, public_slug, proposal_date
                  FROM koala_proposals
                 WHERE deleted_at IS NULL
                   AND (title LIKE :q1 OR project_name LIKE :q2 OR proposal_number LIKE :q3)
                 ORDER BY created_at DESC
                 LIMIT " . self::LIMITE;
        // Um placeholder POR OCORRENCIA: com prepares nativos (emulacao desligada),
        // reutilizar `:q` nas tres condicoes da "Invalid parameter number".
        $st = $pdo->prepare($sql);
        $like = '%' . $q . '%';
        $st->execute([':q1' => $like, ':q2' => $like, ':q3' => $like]);

        $out = [];
        foreach ($st->fetchAll(PDO::FETCH_ASSOC) as $r) {
            $extra = [];
            $v = self::money($r['total_final'], $r['currency']);
            if ($v) $extra['valor'] = $v;
            if ($r['status']) $extra['status'] = $r['status'];
            if ($r['seller_name']) $extra['vendedor'] = $r['seller_name'];
            $out[] = [
                'entity_type' => 'proposta',
                'entity_id'   => (string)$r['id'],
                'label'       => $r['title'] ?: ($r['project_name'] ?: ('Proposta ' . $r['proposal_number'])),
                'sublabel'    => trim(('nº ' . $r['proposal_number']) . ' · ' . ($r['project_name'] ?? ''), ' ·'),
                'fonte'       => 'Koala',
                // Link público, quando existir: a ficha oferece "abrir proposta".
                'url'         => $r['public_slug'] ? '/p/' . $r['public_slug'] : null,
                'extra'       => $extra,
            ];
        }
        return $out;
    }

    /**
     * Ficha lateral de uma entidade (§32.2).
     *
     * Devolve SEMPRE o mesmo formato — {titulo, subtitulo, campos, atividades,
     * acoes} — para a UI ter um componente so, do mesmo jeito que os relatorios.
     */
    public static function ficha(string $tipo, string $id): ?array
    {
        return match ($tipo) {
            'pipedrive_deal' => self::fichaNegocio($id),
            'pessoa'         => self::fichaPessoa($id),
            'organizacao'    => self::fichaOrganizacao($id),
            'proposta'       => self::fichaProposta($id),
            default          => null,
        };
    }

    private static function fichaNegocio(string $id): ?array
    {
        $pdo = self::pipe();
        if ($pdo === null) return null;

        $st = $pdo->prepare(
            "SELECT d.*, s.name AS etapa, o.name AS org, p.name AS pessoa,
                    p.primary_email AS pessoa_email, u.name AS responsavel
               FROM pipe_deals d
               LEFT JOIN pipe_stages s        ON s.pipedrive_id = d.stage_id
               LEFT JOIN pipe_organizations o ON o.pipedrive_id = d.org_id
               LEFT JOIN pipe_persons p       ON p.pipedrive_id = d.person_id
               LEFT JOIN pipe_users u         ON u.pipedrive_id = d.owner_id
              WHERE d.pipedrive_id = :id AND d.is_deleted = 0
              LIMIT 1");
        $st->execute([':id' => (int)$id]);
        $d = $st->fetch(PDO::FETCH_ASSOC);
        if (!$d) return null;

        // Ultimas atividades (§32.2). Limite baixo de proposito: a ficha e um
        // resumo lateral, nao a tela do Pipedrive.
        $sa = $pdo->prepare(
            "SELECT subject, type, due_date, due_time, done
               FROM pipe_activities
              WHERE deal_pd_id = :id
              ORDER BY due_date DESC, due_time DESC
              LIMIT 5");
        $sa->execute([':id' => (int)$id]);
        $atividades = array_map(static fn($a) => [
            'titulo' => $a['subject'] ?: '(sem assunto)',
            'tipo'   => $a['type'],
            'quando' => trim(((string)$a['due_date']) . ' ' . (string)($a['due_time'] ?? '')),
            'feita'  => (bool)$a['done'],
        ], $sa->fetchAll(PDO::FETCH_ASSOC));

        $campos = [];
        $v = self::money($d['value'], $d['currency']);
        if ($v)                  $campos[] = ['rotulo' => 'Valor', 'valor' => $v, 'destaque' => true];
        if ($d['etapa'])         $campos[] = ['rotulo' => 'Etapa', 'valor' => $d['etapa']];
        $campos[] = ['rotulo' => 'Situação', 'valor' => match ($d['status']) {
            'open' => 'Em aberto', 'won' => 'Ganho', 'lost' => 'Perdido', default => (string)$d['status'],
        }];
        if ($d['responsavel'])   $campos[] = ['rotulo' => 'Responsável', 'valor' => $d['responsavel']];
        if ($d['org'])           $campos[] = ['rotulo' => 'Organização', 'valor' => $d['org']];
        if ($d['pessoa'])        $campos[] = ['rotulo' => 'Contato', 'valor' => $d['pessoa']];
        if ($d['expected_close_date']) $campos[] = ['rotulo' => 'Previsão de fechamento', 'valor' => $d['expected_close_date']];
        if ($d['next_activity_date'])  $campos[] = ['rotulo' => 'Próxima ação', 'valor' => $d['next_activity_date']];
        if ($d['status'] === 'lost' && $d['lost_reason']) {
            $campos[] = ['rotulo' => 'Motivo da perda', 'valor' => $d['lost_reason']];
        }

        return [
            'entity_type' => 'pipedrive_deal',
            'entity_id'   => (string)$d['pipedrive_id'],
            'titulo'      => $d['title'],
            'subtitulo'   => $d['org'] ?: ($d['pessoa'] ?: 'Pipedrive'),
            'fonte'       => 'Pipedrive',
            'campos'      => $campos,
            'atividades'  => $atividades,
            // Rota interna do painel do Pipedrive — abre no MESMO shell (§68).
            'rota'        => '#/panel-pipedrive/negocios?deal=' . rawurlencode((string)$d['pipedrive_id']),
            'convidar'    => $d['pessoa_email'] ?: null,
        ];
    }

    private static function fichaPessoa(string $id): ?array
    {
        $pdo = self::pipe();
        if ($pdo === null) return null;
        $st = $pdo->prepare(
            "SELECT p.*, o.name AS org,
                    (SELECT COUNT(*) FROM pipe_deals d
                      WHERE d.person_id = p.pipedrive_id AND d.is_deleted = 0 AND d.status='open') AS abertos
               FROM pipe_persons p
               LEFT JOIN pipe_organizations o ON o.pipedrive_id = p.org_id
              WHERE p.pipedrive_id = :id AND p.is_deleted = 0 LIMIT 1");
        $st->execute([':id' => (int)$id]);
        $p = $st->fetch(PDO::FETCH_ASSOC);
        if (!$p) return null;

        $campos = [];
        if ($p['primary_email']) $campos[] = ['rotulo' => 'E-mail', 'valor' => $p['primary_email']];
        if ($p['primary_phone']) $campos[] = ['rotulo' => 'Telefone', 'valor' => $p['primary_phone']];
        if ($p['job_title'])     $campos[] = ['rotulo' => 'Cargo', 'valor' => $p['job_title']];
        if ($p['org'])           $campos[] = ['rotulo' => 'Organização', 'valor' => $p['org']];
        $campos[] = ['rotulo' => 'Negócios abertos', 'valor' => (string)(int)$p['abertos'], 'destaque' => true];

        return [
            'entity_type' => 'pessoa', 'entity_id' => (string)$p['pipedrive_id'],
            'titulo' => $p['name'], 'subtitulo' => $p['org'] ?: 'Pipedrive',
            'fonte' => 'Pipedrive', 'campos' => $campos, 'atividades' => [],
            'rota' => '#/panel-pipedrive/entidades?pessoa=' . rawurlencode((string)$p['pipedrive_id']),
            'convidar' => $p['primary_email'] ?: null,
        ];
    }

    private static function fichaOrganizacao(string $id): ?array
    {
        $pdo = self::pipe();
        if ($pdo === null) return null;
        $st = $pdo->prepare(
            "SELECT o.*,
                    (SELECT COUNT(*) FROM pipe_deals d WHERE d.org_id=o.pipedrive_id AND d.is_deleted=0 AND d.status='open') AS abertos,
                    (SELECT COALESCE(SUM(d.value),0) FROM pipe_deals d WHERE d.org_id=o.pipedrive_id AND d.is_deleted=0 AND d.status='open') AS pipeline,
                    (SELECT COUNT(*) FROM pipe_persons p WHERE p.org_id=o.pipedrive_id AND p.is_deleted=0) AS contatos
               FROM pipe_organizations o
              WHERE o.pipedrive_id = :id AND o.is_deleted = 0 LIMIT 1");
        $st->execute([':id' => (int)$id]);
        $o = $st->fetch(PDO::FETCH_ASSOC);
        if (!$o) return null;

        $campos = [];
        $pl = self::money((string)$o['pipeline'], 'BRL');
        if ($pl) $campos[] = ['rotulo' => 'Pipeline em aberto', 'valor' => $pl, 'destaque' => true];
        $campos[] = ['rotulo' => 'Negócios abertos', 'valor' => (string)(int)$o['abertos']];
        $campos[] = ['rotulo' => 'Contatos', 'valor' => (string)(int)$o['contatos']];
        $local = trim(($o['city'] ?? '') . ' ' . ($o['state'] ?? ''));
        if ($local !== '') $campos[] = ['rotulo' => 'Local', 'valor' => $local];
        if ($o['address']) $campos[] = ['rotulo' => 'Endereço', 'valor' => $o['address']];

        return [
            'entity_type' => 'organizacao', 'entity_id' => (string)$o['pipedrive_id'],
            'titulo' => $o['name'], 'subtitulo' => 'Organização · Pipedrive',
            'fonte' => 'Pipedrive', 'campos' => $campos, 'atividades' => [],
            'rota' => '#/panel-pipedrive/entidades?org=' . rawurlencode((string)$o['pipedrive_id']),
            'convidar' => null,
        ];
    }

    private static function fichaProposta(string $id): ?array
    {
        $pdo = self::dash();
        if ($pdo === null) return null;
        $st = $pdo->prepare(
            "SELECT * FROM koala_proposals WHERE id = :id AND deleted_at IS NULL LIMIT 1");
        $st->execute([':id' => (int)$id]);
        $p = $st->fetch(PDO::FETCH_ASSOC);
        if (!$p) return null;

        $campos = [];
        $v = self::money((string)$p['total_final'], $p['currency']);
        if ($v) $campos[] = ['rotulo' => 'Valor final', 'valor' => $v, 'destaque' => true];
        $campos[] = ['rotulo' => 'Número', 'valor' => (string)$p['proposal_number']];
        if ($p['status'])       $campos[] = ['rotulo' => 'Situação', 'valor' => (string)$p['status']];
        if ($p['seller_name'])  $campos[] = ['rotulo' => 'Vendedor', 'valor' => $p['seller_name']];
        if ($p['proposal_date']) $campos[] = ['rotulo' => 'Data', 'valor' => (string)$p['proposal_date']];
        if ($p['valid_until'])  $campos[] = ['rotulo' => 'Válida até', 'valor' => (string)$p['valid_until']];

        return [
            'entity_type' => 'proposta', 'entity_id' => (string)$p['id'],
            'titulo' => $p['title'] ?: ($p['project_name'] ?: ('Proposta ' . $p['proposal_number'])),
            'subtitulo' => 'Koala · proposta',
            'fonte' => 'Koala', 'campos' => $campos, 'atividades' => [],
            'rota' => '#/koala',
            // Link publico so quando publicado E nao revogado — mostrar um /p/
            // morto seria pior do que nao mostrar.
            'url' => ($p['public_slug'] && $p['published_at'] && !$p['public_revoked_at'])
                ? '/p/' . $p['public_slug'] : null,
            'convidar' => null,
        ];
    }
}
