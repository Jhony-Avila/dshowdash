<?php
// Google Calendar / GcalDb - provedor REAL, servindo as telas a partir do banco
// @module google-calendar.db
// @version 1.0.0
// @created 2026-07-30
// @app Google Calendar
//
// Ultima peca da Fase 4. Herda de GcalProviderBase, entao conflitos,
// disponibilidade, convites, alertas, KPIs e relatorios sao calculados pelo
// MESMO codigo que serve o mock — se a regra de conflito mudar, muda nos dois.
//
// A unica responsabilidade daqui e traduzir LINHA DE BANCO para o formato
// canonico de evento que as telas ja consomem. Nada de novo aparece na UI: e
// exatamente esse o ponto do §87 (trocar a fonte nao reconstroi a tela).
//
// FUSO: o banco guarda UTC. A conversao para o fuso pedido acontece aqui, na
// borda — nunca em SQL (CONVERT_TZ por nome devolve NULL neste servidor).
declare(strict_types=1);

final class GcalDb extends GcalProviderBase
{
    public function __construct(
        private GcalRepository $repo,
        private GcalAuthService $auth,
        private int $userId
    ) {}

    public function nome(): string { return 'google'; }

    // ═══════════════════════════════════════════════════════════════════
    // FONTES
    // ═══════════════════════════════════════════════════════════════════

    public function contas(): array
    {
        $out = [];
        foreach ($this->repo->listarContas($this->userId) as $c) {
            $out[] = [
                'id' => (int)$c['id'], 'google_account_id' => $c['google_account_id'],
                'email' => $c['email'], 'display_name' => $c['display_name'],
                'account_type' => $c['account_type'], 'organization' => $c['organization'],
                'is_default' => (bool)$c['is_default'], 'is_active' => (bool)$c['is_active'],
                'connection_status' => $c['connection_status'], 'scopes' => $c['scopes'],
                'token_expires_at' => null,   // nunca sai do servidor
                'last_sync_at' => self::iso($c['last_sync_at']),
                'last_error_code' => $c['last_error_code'],
                'last_error_message' => $c['last_error_message'],
                'created_at' => self::iso($c['created_at']),
            ];
        }
        return $out;
    }

    public function calendarios(): array
    {
        $out = [];
        foreach ($this->repo->listarCalendarios($this->userId) as $c) {
            $out[] = [
                'id' => $c['calendar_id'], 'account_id' => (int)$c['account_id'],
                'summary' => $c['summary'], 'description' => $c['description'],
                'time_zone' => $c['time_zone'],
                // Cor local do usuário vence a do Google (§70).
                'color' => $c['color_override'] ?: ($c['color_hex'] ?: '#60a5fa'),
                'access_role' => $c['access_role'], 'primary' => (bool)$c['is_primary'],
                'selected' => $c['selected'] === null ? true : (bool)$c['selected'],
                'favorite' => (bool)($c['favorite'] ?? false),
                'kind' => $c['kind'], 'owner' => $c['summary'],
                'capacity' => $c['capacity'] !== null ? (int)$c['capacity'] : null,
                'resource_location' => $c['resource_location'],
            ];
        }
        return $out;
    }

    public function eventos(array $f): array
    {
        $tz = Tz::normalizar($f['tz'] ?? static::TZ);
        [$de, $ate] = Tz::janela($f['de'], $f['ate'], $tz);

        $linhas = $this->repo->eventosDaJanela(
            $this->userId,
            $de->format('Y-m-d H:i:s'), $ate->format('Y-m-d H:i:s'),
            $f['calendars'] ?? null,
            !empty($f['incluir_cancelados'])
        );
        if (!$linhas) return [];

        $pks = array_map(static fn($l) => (int)$l['id'], $linhas);
        $porEvento = $this->repo->participantesDe($pks);
        $det  = $this->detalhesDe($pks);
        $mapa = $this->mapaCalendarios();

        $out = [];
        foreach ($linhas as $l) {
            $e = $this->paraCanonico($l, $porEvento[(int)$l['id']] ?? [], $tz, $det);

            if (!empty($f['tipo']) && $e['event_type'] !== $f['tipo']) continue;
            if (!empty($f['resposta']) && ($e['my_response'] ?? null) !== $f['resposta']) continue;
            if (!empty($f['q'])) {
                $q = mb_strtolower((string)$f['q']);
                $alvo = mb_strtolower(($e['summary'] ?? '') . ' ' . ($e['description'] ?? '')
                      . ' ' . ($e['location'] ?? '') . ' '
                      . implode(' ', array_column($e['attendees'], 'email')));
                if (!str_contains($alvo, $q)) continue;
            }

            if (isset($mapa[$e['calendar_id']])) {
                $e = $this->aplicarPrivacidade($e, $mapa[$e['calendar_id']]);
                $e['calendar_color']   = $mapa[$e['calendar_id']]['color'];
                $e['calendar_summary'] = $mapa[$e['calendar_id']]['summary'];
            }
            $out[] = $e;
        }

        usort($out, static fn($a, $b) => strcmp((string)$a['start'], (string)$b['start']));

        $ids = [];
        foreach ($this->detectarConflitos($out, $tz) as $c) {
            foreach ($c['event_ids'] as $i) { $ids[$i] = true; }
        }
        foreach ($out as &$e) { $e['has_conflict'] = isset($ids[$e['id']]); }
        unset($e);

        return $out;
    }

    public function evento(string $calendarId, string $eventId): ?array
    {
        $st = $this->repo->pdo()->prepare(
            "SELECT e.*, c.summary AS calendar_summary, c.color_hex AS calendar_color, c.access_role
               FROM gcal_events e
               JOIN gcal_accounts a ON a.id = e.account_id
               LEFT JOIN gcal_calendars c ON c.account_id = e.account_id AND c.calendar_id = e.calendar_id
              WHERE a.user_id = :u AND e.calendar_id = :c AND e.event_id = :e LIMIT 1");
        $st->execute([':u' => $this->userId, ':c' => $calendarId, ':e' => $eventId]);
        $l = $st->fetch(PDO::FETCH_ASSOC);
        if (!$l) return null;

        $pk  = (int)$l['id'];
        $att = $this->repo->participantesDe([$pk]);
        $e = $this->paraCanonico($l, $att[$pk] ?? [], static::TZ, $this->detalhesDe([$pk]));

        $mapa = $this->mapaCalendarios();
        if (isset($mapa[$calendarId])) {
            $e = $this->aplicarPrivacidade($e, $mapa[$calendarId]);
            $e['calendar_color']   = $mapa[$calendarId]['color'];
            $e['calendar_summary'] = $mapa[$calendarId]['summary'];
        }
        return $e;
    }

    public function sincronizacao(): array
    {
        $out = [];
        foreach ($this->repo->listarSyncState($this->userId) as $s) {
            $atrasado = $s['last_sync_at'] !== null
                && (time() - strtotime((string)$s['last_sync_at'] . ' UTC')) > 3 * 3600;
            $out[] = [
                'calendar_id' => $s['calendar_id'],
                'calendar_summary' => $s['summary'],
                'status' => $s['status'] === 'ok' && $atrasado ? 'stale' : $s['status'],
                'nunca_sincronizado' => (bool)$s['nunca_sincronizado'],
                'last_sync_at' => self::iso($s['last_sync_at']),
                'next_sync_at' => self::iso($s['next_sync_at']),
                'duration_ms' => (int)$s['last_duration_ms'],
                'processed' => (int)$s['processed'],
                'created' => 0, 'updated' => 0, 'deleted' => 0,
                'errors' => 0,
                'sync_token' => '********',   // §78: nunca sai do servidor
                'channel_id' => '—', 'channel_expires_at' => null,
                'attempt' => (int)$s['attempt'],
            ];
        }
        return $out;
    }

    public function status(): array
    {
        $contas = $this->contas();
        $problemas = array_filter($contas, static fn($c) => $c['connection_status'] !== 'connected');
        $sync = $this->sincronizacao();
        $atrasados = array_filter($sync, static fn($s) => $s['status'] !== 'ok');
        $escopos = [];
        foreach ($contas as $c) {
            foreach (explode(' ', (string)$c['scopes']) as $e) {
                if ($e !== '') $escopos[] = basename(str_replace('/auth/', '/', $e));
            }
        }

        return [
            'provider' => 'google', 'mock' => false,
            'configured' => GoogleOAuth::isConfigured() && GcalCrypto::isConfigured(),
            'connected' => count($contas) > 0,
            'accounts' => count($contas),
            'accounts_with_problem' => count($problemas),
            'calendars' => count($this->calendarios()),
            'scopes' => array_values(array_unique($escopos)),
            'oauth_stage' => getenv('GCAL_OAUTH_STAGE') ?: 'read',
            'last_sync_at' => $sync[0]['last_sync_at'] ?? null,
            'stale_calendars' => count($atrasados),
            'message' => count($contas) > 0
                ? 'Conectado ao Google Calendar.'
                : 'Nenhuma conta Google conectada.',
        ];
    }

    // ═══════════════════════════════════════════════════════════════════
    // ESCRITA — vai ao Google e reflete no banco
    // ═══════════════════════════════════════════════════════════════════

    /** Descobre a conta dona do calendário; sem ela não há a quem pedir. */
    private function contaDo(string $calendarId): int
    {
        $st = $this->repo->pdo()->prepare(
            "SELECT c.account_id FROM gcal_calendars c
               JOIN gcal_accounts a ON a.id = c.account_id
              WHERE a.user_id = :u AND c.calendar_id = :c AND a.is_active = 1 LIMIT 1");
        $st->execute([':u' => $this->userId, ':c' => $calendarId]);
        $id = $st->fetchColumn();
        if ($id === false) throw new RuntimeException('Calendário não encontrado nesta conta.');
        return (int)$id;
    }

    /** O papel de acesso é conferido AQUI, não só na UI (§30). */
    private function exigirEscrita(string $calendarId): int
    {
        $mapa = $this->mapaCalendarios();
        $papel = $mapa[$calendarId]['access_role'] ?? 'reader';
        if (!in_array($papel, ['owner', 'writer'], true)) {
            throw new RuntimeException('Sem permissão de escrita neste calendário.');
        }
        return $this->contaDo($calendarId);
    }

    public function criarEvento(array $p): array
    {
        $cal = (string)($p['calendar_id'] ?? '');
        $acc = $this->exigirEscrita($cal);
        $novo = $this->auth->clientePara($acc)->criarEvento($cal, $p, !empty($p['notificar']));
        $this->repo->salvarEvento($acc, $novo);
        $this->repo->auditar($this->userId, 'create', [
            'account_id' => $acc, 'calendar_id' => $cal, 'event_id' => $novo['event_id'],
            'after' => ['summary' => $novo['summary']],
        ]);
        return $this->evento($cal, $novo['event_id']) ?? [];
    }

    public function atualizarEvento(string $calendarId, string $eventId, array $p, string $escopo = 'this'): array
    {
        $acc = $this->exigirEscrita($calendarId);
        // `escopo` de série exige alterar o evento-mestre, não a instância —
        // por isso o alvo muda quando o usuário pede "toda a série".
        $alvo = $eventId;
        if ($escopo === 'all') {
            $st = $this->repo->pdo()->prepare(
                "SELECT recurring_event_id FROM gcal_events
                  WHERE account_id = :a AND calendar_id = :c AND event_id = :e LIMIT 1");
            $st->execute([':a' => $acc, ':c' => $calendarId, ':e' => $eventId]);
            $mestre = $st->fetchColumn();
            if (is_string($mestre) && $mestre !== '') $alvo = $mestre;
        }

        $atualizado = $this->auth->clientePara($acc)
            ->atualizarEvento($calendarId, $alvo, $p, !empty($p['notificar']));
        $this->repo->salvarEvento($acc, $atualizado);
        $this->repo->auditar($this->userId, 'update', [
            'account_id' => $acc, 'calendar_id' => $calendarId, 'event_id' => $eventId,
            'after' => $p,
        ]);
        return $this->evento($calendarId, $atualizado['event_id']) ?? [];
    }

    public function excluirEvento(string $calendarId, string $eventId, bool $notificar, string $escopo = 'this'): void
    {
        $acc = $this->exigirEscrita($calendarId);
        $this->auth->clientePara($acc)->excluirEvento($calendarId, $eventId, $notificar);
        // O Google devolve o evento como `cancelled` no próximo sync; marcamos
        // já para a UI não mostrar um evento que o usuário acabou de apagar.
        $this->repo->pdo()->prepare(
            "UPDATE gcal_events SET status = 'cancelled'
              WHERE account_id = :a AND calendar_id = :c AND event_id = :e")
            ->execute([':a' => $acc, ':c' => $calendarId, ':e' => $eventId]);
        $this->repo->auditar($this->userId, 'delete', [
            'account_id' => $acc, 'calendar_id' => $calendarId, 'event_id' => $eventId,
            'after' => ['notificados' => $notificar],
        ]);
    }

    public function responderConvite(string $calendarId, string $eventId, string $resposta, ?string $comentario): array
    {
        if (!in_array($resposta, ['accepted', 'declined', 'tentative'], true)) {
            throw new InvalidArgumentException('Resposta inválida.');
        }
        $acc = $this->contaDo($calendarId);
        $st = $this->repo->pdo()->prepare("SELECT email FROM gcal_accounts WHERE id = :a");
        $st->execute([':a' => $acc]);
        $meu = (string)$st->fetchColumn();

        $ev = $this->auth->clientePara($acc)
            ->responderConvite($calendarId, $eventId, $meu, $resposta, $comentario);
        $this->repo->salvarEvento($acc, $ev);
        $this->repo->auditar($this->userId, 'respond', [
            'account_id' => $acc, 'calendar_id' => $calendarId, 'event_id' => $eventId,
            'after' => ['resposta' => $resposta],
        ]);
        return $this->evento($calendarId, $eventId) ?? [];
    }

    public function vincular(string $calendarId, string $eventId, array $link): array
    {
        $acc = $this->contaDo($calendarId);
        $st = $this->repo->pdo()->prepare(
            "SELECT id FROM gcal_events WHERE account_id = :a AND calendar_id = :c AND event_id = :e");
        $st->execute([':a' => $acc, ':c' => $calendarId, ':e' => $eventId]);
        $pk = $st->fetchColumn();
        if ($pk === false) throw new RuntimeException('Evento não encontrado.');

        $this->repo->pdo()->prepare(
            "INSERT INTO gcal_event_links (event_pk, entity_type, entity_id, relation_type, label_cache, created_by)
             VALUES (:p,:t,:i,:r,:l,:u)
             ON DUPLICATE KEY UPDATE label_cache = VALUES(label_cache)")
            ->execute([':p' => $pk, ':t' => $link['entity_type'], ':i' => $link['entity_id'],
                       ':r' => $link['relation'] ?? 'reuniao', ':l' => $link['label'] ?? null,
                       ':u' => $this->userId]);
        return $this->evento($calendarId, $eventId) ?? [];
    }

    public function desvincular(string $calendarId, string $eventId, string $tipo, string $id): array
    {
        $acc = $this->contaDo($calendarId);
        $this->repo->pdo()->prepare(
            "DELETE l FROM gcal_event_links l
               JOIN gcal_events e ON e.id = l.event_pk
              WHERE e.account_id = :a AND e.calendar_id = :c AND e.event_id = :e
                AND l.entity_type = :t AND l.entity_id = :i")
            ->execute([':a' => $acc, ':c' => $calendarId, ':e' => $eventId, ':t' => $tipo, ':i' => $id]);
        return $this->evento($calendarId, $eventId) ?? [];
    }

    // ═══════════════════════════════════════════════════════════════════
    // TRADUCAO
    // ═══════════════════════════════════════════════════════════════════

    private static function iso(?string $dtUtc): ?string
    {
        if (!$dtUtc) return null;
        try {
            return (new \DateTimeImmutable($dtUtc . ' UTC'))->format('c');
        } catch (\Throwable $e) { return null; }
    }

    /**
     * Conferência, recorrência, lembretes e vínculos de TODOS os eventos da
     * janela, em 4 consultas.
     *
     * Buscar isso dentro do laço custaria 4 × N: um mês de agenda cheia passa
     * de mil idas ao banco para montar uma tela. O ganho não é teórico — é a
     * diferença entre a tela abrir e a tela travar.
     *
     * @param array<int,int> $pks
     * @return array{conf:array,rec:array,rem:array,link:array}
     */
    private function detalhesDe(array $pks): array
    {
        $vazio = ['conf' => [], 'rec' => [], 'rem' => [], 'link' => []];
        if (!$pks) return $vazio;
        $in = implode(',', array_fill(0, count($pks), '?'));

        $ler = function (string $sql) use ($in, $pks): array {
            $st = $this->repo->pdo()->prepare(str_replace('{IN}', $in, $sql));
            $st->execute($pks);
            return $st->fetchAll(PDO::FETCH_ASSOC);
        };

        $out = $vazio;
        foreach ($ler("SELECT event_pk, platform, uri, meeting_code, phone
                         FROM gcal_event_conferences WHERE event_pk IN ({IN})") as $r) {
            $out['conf'][(int)$r['event_pk']] = $r;
        }
        foreach ($ler("SELECT event_pk, rrule, human
                         FROM gcal_event_recurrence WHERE event_pk IN ({IN})") as $r) {
            $out['rec'][(int)$r['event_pk']] = $r;
        }
        foreach ($ler("SELECT event_pk, method, minutes
                         FROM gcal_event_reminders WHERE event_pk IN ({IN}) ORDER BY minutes DESC") as $r) {
            $out['rem'][(int)$r['event_pk']][] = ['method' => $r['method'], 'minutes' => (int)$r['minutes']];
        }
        foreach ($ler("SELECT event_pk, entity_type, entity_id, relation_type, label_cache
                         FROM gcal_event_links WHERE event_pk IN ({IN})") as $r) {
            $out['link'][(int)$r['event_pk']][] = [
                'entity_type' => $r['entity_type'], 'entity_id' => $r['entity_id'],
                'label' => $r['label_cache'] ?: $r['entity_id'], 'relation' => $r['relation_type'],
            ];
        }
        return $out;
    }

    /** Linha do banco → evento canônico (o mesmo formato que o mock produz). */
    private function paraCanonico(array $l, array $attendees, string $tz, array $det): array
    {
        $diaInteiro = (bool)$l['all_day'];
        $inicio = $diaInteiro ? (string)$l['start_date'] : (string)self::iso($l['start_utc']);
        $fim    = $diaInteiro ? (string)$l['end_date']   : (string)self::iso($l['end_utc']);

        $dur = 0;
        if (!$diaInteiro && $l['start_utc'] && $l['end_utc']) {
            $dur = (int)round((strtotime((string)$l['end_utc'] . ' UTC')
                             - strtotime((string)$l['start_utc'] . ' UTC')) / 60);
        }

        $part = [];
        $souOrganizador = (bool)$l['organizer_self'];
        foreach ($attendees as $a) {
            $part[] = [
                'name' => $a['display_name'] ?: $a['email'], 'email' => $a['email'],
                'response' => $a['response'], 'optional' => (bool)$a['optional'],
                'organizer' => (bool)$a['is_organizer'], 'self' => (bool)$a['is_self'],
                'resource' => (bool)($a['is_resource'] ?? false),
                // "Externo" = fora do domínio da conta. Sem `hd`, o melhor sinal
                // é o domínio do e-mail do organizador.
                'external' => !str_ends_with(mb_strtolower((string)$a['email']),
                    '@' . self::dominio((string)$l['organizer_email'])),
            ];
        }

        $pk = (int)$l['id'];
        $c = $det['conf'][$pk] ?? null;
        $r = $det['rec'][$pk] ?? null;

        return [
            'id' => $l['event_id'], 'calendar_id' => $l['calendar_id'],
            'ical_uid' => (string)($l['ical_uid'] ?? ''),
            'recurring_event_id' => $l['recurring_event_id'],
            'original_start_time' => self::iso($l['original_start_utc']),
            'etag' => (string)($l['etag'] ?? ''), 'sequence' => (int)$l['sequence'],
            'status' => $l['status'], 'summary' => (string)($l['summary'] ?? '(sem título)'),
            'description' => $l['description'], 'location' => $l['location'],
            'all_day' => $diaInteiro, 'start' => $inicio, 'end' => $fim,
            'time_zone' => $l['event_time_zone'] ?: $tz,
            'transparency' => $l['transparency'], 'visibility' => $l['visibility'],
            'event_type' => $l['event_type'],
            'organizer' => ['name' => $l['organizer_name'] ?: (string)$l['organizer_email'],
                            'email' => (string)$l['organizer_email'], 'self' => $souOrganizador],
            'attendees' => $part,
            'conference' => $c ? ['platform' => $c['platform'], 'uri' => $c['uri'],
                                  'code' => $c['meeting_code'], 'phone' => $c['phone']] : null,
            'reminders' => $det['rem'][$pk] ?? [],
            'recurrence' => $r ? ['rrule' => $r['rrule'], 'human' => $r['human'] ?: $r['rrule']] : null,
            'links' => $det['link'][$pk] ?? [],
            'color' => null,
            'is_organizer' => $souOrganizador,
            'my_response' => $l['my_response'] ?: ($souOrganizador ? 'accepted' : 'needsAction'),
            'created' => self::iso($l['google_created']),
            'updated' => self::iso($l['google_updated']),
            'duration_min' => $dur,
        ];
    }

    private static function dominio(string $email): string
    {
        $p = explode('@', $email);
        return count($p) === 2 ? mb_strtolower($p[1]) : 'dshow.com.br';
    }
}
