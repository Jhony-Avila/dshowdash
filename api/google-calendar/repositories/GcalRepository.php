<?php
// Google Calendar / GcalRepository - persistencia em GCAL_DSHOW (Fase 4)
// @module google-calendar.repository
// @version 1.0.0
// @created 2026-07-30
// @app Google Calendar
//
// ─────────────────────────────────────────────────────────────────────────────
// REGRA DE FUSO, repetida aqui porque e onde se erra: TODA coluna DATETIME
// deste banco guarda UTC. `mysql.time_zone_name` esta vazia neste servidor, e
// CONVERT_TZ por nome devolve NULL — que, dentro de um WHERE de janela, REMOVE
// o evento sem erro nenhum no log. A conversao acontece em lib/Tz.php.
//
// Evento de dia inteiro usa as colunas DATE (`start_date`/`end_date`) e deixa as
// UTC nulas: dia inteiro nao tem hora nem fuso (§48).
//
// Conexao pelo usuario `gcal_app`, que so tem DML neste schema — sem DDL, sem
// GRANT, sem alcance a outros bancos (provado no provisionamento).
declare(strict_types=1);

final class GcalRepository
{
    private PDO $pdo;

    public function __construct(?PDO $pdo = null)
    {
        $this->pdo = $pdo ?? getConnection('GCAL_DSHOW');
        $this->pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    }

    public function pdo(): PDO { return $this->pdo; }

    /** Transacao com rollback garantido — carga parcial e pior que carga nenhuma. */
    public function transacao(callable $fn): mixed
    {
        $jaEstava = $this->pdo->inTransaction();
        if (!$jaEstava) $this->pdo->beginTransaction();
        try {
            $r = $fn($this);
            if (!$jaEstava) $this->pdo->commit();
            return $r;
        } catch (\Throwable $e) {
            if (!$jaEstava && $this->pdo->inTransaction()) $this->pdo->rollBack();
            throw $e;
        }
    }

    private static function utc(?string $iso): ?string
    {
        if ($iso === null || $iso === '') return null;
        try {
            return (new \DateTimeImmutable($iso))->setTimezone(new \DateTimeZone('UTC'))
                ->format('Y-m-d H:i:s');
        } catch (\Throwable $e) { return null; }
    }

    // ═══════════════════════════════════════════════════════════════════
    // CONTAS E TOKENS
    // ═══════════════════════════════════════════════════════════════════

    public function acharConta(int $userId, string $googleAccountId): ?array
    {
        $st = $this->pdo->prepare(
            "SELECT * FROM gcal_accounts WHERE user_id = :u AND google_account_id = :g LIMIT 1");
        $st->execute([':u' => $userId, ':g' => $googleAccountId]);
        $r = $st->fetch(PDO::FETCH_ASSOC);
        return $r ?: null;
    }

    public function listarContas(int $userId): array
    {
        $st = $this->pdo->prepare(
            "SELECT * FROM gcal_accounts WHERE user_id = :u ORDER BY is_default DESC, id");
        $st->execute([':u' => $userId]);
        // scrub e a rede: a tabela nao guarda token, mas se um dia guardar, nao vaza.
        return array_map([GcalCrypto::class, 'scrub'], $st->fetchAll(PDO::FETCH_ASSOC));
    }

    /** Cria ou atualiza a conta. Devolve o id interno. */
    public function salvarConta(int $userId, array $d): int
    {
        $ex = $this->acharConta($userId, (string)$d['google_account_id']);
        if ($ex) {
            $st = $this->pdo->prepare(
                "UPDATE gcal_accounts
                    SET email = :e, display_name = :n, account_type = :t, organization = :o,
                        is_active = 1, connection_status = 'connected', scopes = :s,
                        last_success_at = UTC_TIMESTAMP(), last_error_code = NULL,
                        last_error_message = NULL, disconnected_at = NULL
                  WHERE id = :id");
            $st->execute([
                ':e' => $d['email'], ':n' => $d['display_name'] ?? null,
                ':t' => $d['account_type'] ?? 'personal', ':o' => $d['organization'] ?? null,
                ':s' => $d['scopes'] ?? '', ':id' => $ex['id'],
            ]);
            return (int)$ex['id'];
        }

        // A PRIMEIRA conta do usuario vira a padrao — senao ele conecta e nada
        // acontece, porque nenhuma esta marcada.
        $st = $this->pdo->prepare("SELECT COUNT(*) FROM gcal_accounts WHERE user_id = :u");
        $st->execute([':u' => $userId]);
        $primeira = ((int)$st->fetchColumn()) === 0;

        $st = $this->pdo->prepare(
            "INSERT INTO gcal_accounts
                (user_id, google_account_id, email, display_name, account_type, organization,
                 is_default, is_active, connection_status, scopes, last_success_at)
             VALUES (:u, :g, :e, :n, :t, :o, :d, 1, 'connected', :s, UTC_TIMESTAMP())");
        $st->execute([
            ':u' => $userId, ':g' => $d['google_account_id'], ':e' => $d['email'],
            ':n' => $d['display_name'] ?? null, ':t' => $d['account_type'] ?? 'personal',
            ':o' => $d['organization'] ?? null, ':d' => $primeira ? 1 : 0,
            ':s' => $d['scopes'] ?? '',
        ]);
        return (int)$this->pdo->lastInsertId();
    }

    public function marcarErroConta(int $accountId, string $codigo, string $msg): void
    {
        $st = $this->pdo->prepare(
            "UPDATE gcal_accounts
                SET connection_status = CASE WHEN :c1 IN ('invalid_grant','unauthorized_client')
                                             THEN 'reauth_required' ELSE 'error' END,
                    last_error_code = :c2, last_error_message = :m
              WHERE id = :id");
        // Mensagem CURTA: o §75.2 proibe descricao completa em log/registro.
        $st->execute([':c1' => $codigo, ':c2' => $codigo,
                      ':m' => mb_substr($msg, 0, 480), ':id' => $accountId]);
    }

    /**
     * Guarda os tokens cifrados.
     *
     * ARMADILHA DO GOOGLE: a resposta do refresh normalmente NAO traz
     * refresh_token. Sobrescrever com o campo ausente APAGA a credencial e
     * desconecta a conta em silencio — o sintoma so aparece no dia seguinte.
     * Por isso o refresh so e gravado quando vem preenchido.
     */
    public function salvarTokens(int $accountId, array $tok): void
    {
        $access  = GcalCrypto::encrypt((string)($tok['access_token'] ?? ''));
        $refresh = !empty($tok['refresh_token']) ? GcalCrypto::encrypt((string)$tok['refresh_token']) : null;
        $expira  = (new \DateTimeImmutable('now', new \DateTimeZone('UTC')))
            ->modify('+' . max(60, (int)($tok['expires_in'] ?? 3600)) . ' seconds')
            ->format('Y-m-d H:i:s');

        $st = $this->pdo->prepare(
            "INSERT INTO gcal_oauth_tokens (account_id, access_token_enc, refresh_token_enc, expires_at, token_type)
             VALUES (:a, :ac, :rf, :ex, :tt)
             ON DUPLICATE KEY UPDATE
                access_token_enc = VALUES(access_token_enc),
                refresh_token_enc = COALESCE(VALUES(refresh_token_enc), refresh_token_enc),
                expires_at = VALUES(expires_at),
                rotated_at = UTC_TIMESTAMP()");
        $st->execute([':a' => $accountId, ':ac' => $access, ':rf' => $refresh,
                      ':ex' => $expira, ':tt' => $tok['token_type'] ?? 'Bearer']);
    }

    /** @return array{access:string,refresh:?string,expira:string}|null */
    public function lerTokens(int $accountId): ?array
    {
        $st = $this->pdo->prepare("SELECT * FROM gcal_oauth_tokens WHERE account_id = :a LIMIT 1");
        $st->execute([':a' => $accountId]);
        $r = $st->fetch(PDO::FETCH_ASSOC);
        if (!$r) return null;
        return [
            'access'  => GcalCrypto::decrypt((string)$r['access_token_enc']),
            'refresh' => $r['refresh_token_enc'] ? GcalCrypto::decrypt((string)$r['refresh_token_enc']) : null,
            'expira'  => (string)$r['expires_at'],
        ];
    }

    /** Access token vencido (com 60s de folga para não usar um que expira no caminho). */
    public function tokenVencido(int $accountId): bool
    {
        $st = $this->pdo->prepare(
            "SELECT expires_at <= DATE_ADD(UTC_TIMESTAMP(), INTERVAL 60 SECOND)
               FROM gcal_oauth_tokens WHERE account_id = :a");
        $st->execute([':a' => $accountId]);
        $v = $st->fetchColumn();
        return $v === false ? true : (bool)$v;
    }

    public function desconectar(int $accountId): void
    {
        $this->transacao(function (self $r) use ($accountId): void {
            $r->pdo->prepare("DELETE FROM gcal_oauth_tokens WHERE account_id = :a")
                ->execute([':a' => $accountId]);
            $r->pdo->prepare(
                "UPDATE gcal_accounts SET is_active = 0, connection_status = 'revoked',
                        disconnected_at = UTC_TIMESTAMP() WHERE id = :a")
                ->execute([':a' => $accountId]);
        });
    }

    // ═══════════════════════════════════════════════════════════════════
    // ESTADO OAUTH (state + PKCE)
    // ═══════════════════════════════════════════════════════════════════

    public function criarState(int $userId, string $state, string $verifier, ?string $redirect): void
    {
        $st = $this->pdo->prepare(
            "INSERT INTO gcal_oauth_states (state, user_id, code_verifier_enc, redirect_after, expires_at)
             VALUES (:s, :u, :v, :r, DATE_ADD(UTC_TIMESTAMP(), INTERVAL 10 MINUTE))");
        $st->execute([':s' => $state, ':u' => $userId,
                      ':v' => GcalCrypto::encrypt($verifier), ':r' => $redirect]);
    }

    /**
     * Consome o state UMA vez.
     *
     * O `consumed_at IS NULL` no UPDATE e o que impede replay: duas requisicoes
     * com o mesmo state, so a primeira encontra linha para marcar.
     */
    public function consumirState(string $state): ?array
    {
        return $this->transacao(function (self $r) use ($state): ?array {
            $st = $r->pdo->prepare(
                "SELECT * FROM gcal_oauth_states
                  WHERE state = :s AND consumed_at IS NULL AND expires_at > UTC_TIMESTAMP()
                  LIMIT 1 FOR UPDATE");
            $st->execute([':s' => $state]);
            $row = $st->fetch(PDO::FETCH_ASSOC);
            if (!$row) return null;

            $r->pdo->prepare("UPDATE gcal_oauth_states SET consumed_at = UTC_TIMESTAMP() WHERE state = :s")
                ->execute([':s' => $state]);

            return [
                'user_id'  => (int)$row['user_id'],
                'verifier' => GcalCrypto::decrypt((string)$row['code_verifier_enc']),
                'redirect' => $row['redirect_after'],
            ];
        });
    }

    public function limparStatesVencidos(): int
    {
        $st = $this->pdo->prepare("DELETE FROM gcal_oauth_states WHERE expires_at < UTC_TIMESTAMP()");
        $st->execute();
        return $st->rowCount();
    }

    // ═══════════════════════════════════════════════════════════════════
    // CALENDARIOS
    // ═══════════════════════════════════════════════════════════════════

    public function salvarCalendario(int $accountId, array $c): void
    {
        $st = $this->pdo->prepare(
            "INSERT INTO gcal_calendars
                (account_id, calendar_id, summary, description, time_zone, color_id, color_hex,
                 access_role, is_primary, kind, capacity, resource_location, etag, deleted, synced_at)
             VALUES (:a, :cid, :s, :d, :tz, :ci, :ch, :ar, :pr, :k, :cap, :loc, :et, 0, UTC_TIMESTAMP())
             ON DUPLICATE KEY UPDATE
                summary = VALUES(summary), description = VALUES(description),
                time_zone = VALUES(time_zone), color_id = VALUES(color_id),
                color_hex = VALUES(color_hex), access_role = VALUES(access_role),
                is_primary = VALUES(is_primary), kind = VALUES(kind),
                capacity = VALUES(capacity), resource_location = VALUES(resource_location),
                etag = VALUES(etag), deleted = 0, synced_at = UTC_TIMESTAMP()");
        $st->execute([
            ':a' => $accountId, ':cid' => $c['calendar_id'], ':s' => $c['summary'],
            ':d' => $c['description'] ?? null, ':tz' => $c['time_zone'] ?? 'America/Sao_Paulo',
            ':ci' => $c['color_id'] ?? null, ':ch' => $c['color_hex'] ?? null,
            ':ar' => $c['access_role'] ?? 'reader', ':pr' => !empty($c['is_primary']) ? 1 : 0,
            ':k' => $c['kind'] ?? 'other', ':cap' => $c['capacity'] ?? null,
            ':loc' => $c['resource_location'] ?? null, ':et' => $c['etag'] ?? null,
        ]);
    }

    public function listarCalendarios(int $userId): array
    {
        $st = $this->pdo->prepare(
            "SELECT c.*, e.selected, e.favorite, e.order_index, e.color_override
               FROM gcal_calendars c
               JOIN gcal_accounts a ON a.id = c.account_id
               LEFT JOIN gcal_calendar_list_entries e
                      ON e.account_id = c.account_id AND e.calendar_id = c.calendar_id
              WHERE a.user_id = :u AND c.deleted = 0 AND a.is_active = 1
              ORDER BY c.is_primary DESC, e.order_index, c.summary");
        $st->execute([':u' => $userId]);
        return $st->fetchAll(PDO::FETCH_ASSOC);
    }

    public function marcarCalendariosAusentes(int $accountId, array $idsVivos): int
    {
        if (!$idsVivos) return 0;
        $in = implode(',', array_fill(0, count($idsVivos), '?'));
        // Marca como apagado, NAO deleta: o evento vinculado ainda referencia.
        $st = $this->pdo->prepare(
            "UPDATE gcal_calendars SET deleted = 1
              WHERE account_id = ? AND deleted = 0 AND calendar_id NOT IN ($in)");
        $st->execute(array_merge([$accountId], $idsVivos));
        return $st->rowCount();
    }

    // ═══════════════════════════════════════════════════════════════════
    // EVENTOS
    // ═══════════════════════════════════════════════════════════════════

    /**
     * Upsert de evento normalizado.
     *
     * `payload_hash` evita UPDATE quando nada mudou de fato: o Google reenvia
     * itens por mudanca de etag que nao altera nada visivel, e sem esse guarda
     * cada sync incremental reescreveria a tabela inteira.
     *
     * @return string 'inserido'|'atualizado'|'inalterado'
     */
    public function salvarEvento(int $accountId, array $e): string
    {
        $hash = sha1(json_encode([
            $e['summary'] ?? null, $e['description'] ?? null, $e['location'] ?? null,
            $e['start_utc'] ?? null, $e['end_utc'] ?? null,
            $e['start_date'] ?? null, $e['end_date'] ?? null,
            $e['status'] ?? null, $e['transparency'] ?? null, $e['visibility'] ?? null,
            $e['event_type'] ?? null, $e['sequence'] ?? null,
            $e['attendees'] ?? [], $e['recurrence'] ?? null, $e['conference'] ?? null,
        ], JSON_UNESCAPED_UNICODE));

        $st = $this->pdo->prepare(
            "SELECT id, payload_hash FROM gcal_events
              WHERE account_id = :a AND calendar_id = :c AND event_id = :e LIMIT 1");
        $st->execute([':a' => $accountId, ':c' => $e['calendar_id'], ':e' => $e['event_id']]);
        $ex = $st->fetch(PDO::FETCH_ASSOC);

        if ($ex && $ex['payload_hash'] === $hash) {
            $this->pdo->prepare("UPDATE gcal_events SET synced_at = UTC_TIMESTAMP() WHERE id = :id")
                ->execute([':id' => $ex['id']]);
            return 'inalterado';
        }

        $par = [
            ':a' => $accountId, ':c' => $e['calendar_id'], ':e' => $e['event_id'],
            ':uid' => $e['ical_uid'] ?? null, ':rec' => $e['recurring_event_id'] ?? null,
            ':ost' => self::utc($e['original_start_time'] ?? null),
            ':stt' => $e['status'] ?? 'confirmed', ':sum' => $e['summary'] ?? null,
            ':des' => $e['description'] ?? null, ':loc' => $e['location'] ?? null,
            ':ad' => !empty($e['all_day']) ? 1 : 0,
            ':su' => $e['start_utc'] ?? null, ':eu' => $e['end_utc'] ?? null,
            ':sd' => $e['start_date'] ?? null, ':ed' => $e['end_date'] ?? null,
            ':etz' => $e['event_time_zone'] ?? null,
            ':tr' => $e['transparency'] ?? 'opaque', ':vi' => $e['visibility'] ?? 'default',
            ':ty' => $e['event_type'] ?? 'default',
            ':oe' => $e['organizer_email'] ?? null, ':on' => $e['organizer_name'] ?? null,
            ':os' => !empty($e['organizer_self']) ? 1 : 0,
            ':mr' => $e['my_response'] ?? null, ':col' => $e['color_id'] ?? null,
            ':et' => $e['etag'] ?? null, ':seq' => (int)($e['sequence'] ?? 0),
            ':hl' => $e['html_link'] ?? null,
            ':gc' => self::utc($e['google_created'] ?? null),
            ':gu' => self::utc($e['google_updated'] ?? null),
            // `deleted` significa SUMIU DA ORIGEM — não "cancelado". O §59 pede
            // justamente diferenciar os dois: evento cancelado continua
            // existindo (aparece riscado, entra no relatório de cancelamentos)
            // e só sai da grade porque a consulta filtra por `status`.
            // Colapsar os dois fazia o cancelado desaparecer até de
            // `incluirCancelados = true`.
            ':del' => !empty($e['sumiu_da_origem']) ? 1 : 0,
            ':ph' => $hash,
            ':raw' => isset($e['raw']) ? json_encode($e['raw'], JSON_UNESCAPED_UNICODE) : null,
        ];

        $this->pdo->prepare(
            "INSERT INTO gcal_events
                (account_id, calendar_id, event_id, ical_uid, recurring_event_id, original_start_utc,
                 status, summary, description, location, all_day, start_utc, end_utc,
                 start_date, end_date, event_time_zone, transparency, visibility, event_type,
                 organizer_email, organizer_name, organizer_self, my_response, color_id,
                 etag, sequence, html_link, google_created, google_updated, synced_at,
                 deleted, payload_hash, raw_payload)
             VALUES (:a,:c,:e,:uid,:rec,:ost,:stt,:sum,:des,:loc,:ad,:su,:eu,:sd,:ed,:etz,
                     :tr,:vi,:ty,:oe,:on,:os,:mr,:col,:et,:seq,:hl,:gc,:gu,UTC_TIMESTAMP(),
                     :del,:ph,:raw)
             ON DUPLICATE KEY UPDATE
                ical_uid=VALUES(ical_uid), recurring_event_id=VALUES(recurring_event_id),
                original_start_utc=VALUES(original_start_utc), status=VALUES(status),
                summary=VALUES(summary), description=VALUES(description), location=VALUES(location),
                all_day=VALUES(all_day), start_utc=VALUES(start_utc), end_utc=VALUES(end_utc),
                start_date=VALUES(start_date), end_date=VALUES(end_date),
                event_time_zone=VALUES(event_time_zone), transparency=VALUES(transparency),
                visibility=VALUES(visibility), event_type=VALUES(event_type),
                organizer_email=VALUES(organizer_email), organizer_name=VALUES(organizer_name),
                organizer_self=VALUES(organizer_self), my_response=VALUES(my_response),
                color_id=VALUES(color_id), etag=VALUES(etag), sequence=VALUES(sequence),
                html_link=VALUES(html_link), google_created=VALUES(google_created),
                google_updated=VALUES(google_updated), synced_at=UTC_TIMESTAMP(),
                deleted=VALUES(deleted), payload_hash=VALUES(payload_hash),
                raw_payload=VALUES(raw_payload)")
            ->execute($par);

        $pk = $ex ? (int)$ex['id'] : (int)$this->pdo->lastInsertId();
        $this->salvarFilhos($pk, $e);
        return $ex ? 'atualizado' : 'inserido';
    }

    /** Participantes, lembretes, recorrência e conferência: substitui o conjunto. */
    private function salvarFilhos(int $eventPk, array $e): void
    {
        $this->pdo->prepare("DELETE FROM gcal_event_attendees WHERE event_pk = :p")->execute([':p' => $eventPk]);
        $st = $this->pdo->prepare(
            "INSERT INTO gcal_event_attendees
                (event_pk, email, display_name, response, optional, is_organizer, is_self, is_resource, comment)
             VALUES (:p,:e,:n,:r,:o,:g,:s,:rs,:c)");
        foreach (($e['attendees'] ?? []) as $a) {
            if (empty($a['email'])) continue;
            $st->execute([
                ':p' => $eventPk, ':e' => $a['email'], ':n' => $a['display_name'] ?? null,
                ':r' => $a['response'] ?? 'needsAction', ':o' => !empty($a['optional']) ? 1 : 0,
                ':g' => !empty($a['is_organizer']) ? 1 : 0, ':s' => !empty($a['is_self']) ? 1 : 0,
                ':rs' => !empty($a['is_resource']) ? 1 : 0,
                ':c' => isset($a['comment']) ? mb_substr((string)$a['comment'], 0, 480) : null,
            ]);
        }

        $this->pdo->prepare("DELETE FROM gcal_event_reminders WHERE event_pk = :p")->execute([':p' => $eventPk]);
        $st = $this->pdo->prepare(
            "INSERT INTO gcal_event_reminders (event_pk, method, minutes) VALUES (:p,:m,:n)");
        foreach (($e['reminders'] ?? []) as $r) {
            $metodo = ($r['method'] ?? 'popup') === 'email' ? 'email' : 'popup';
            $st->execute([':p' => $eventPk, ':m' => $metodo, ':n' => (int)($r['minutes'] ?? 10)]);
        }

        $this->pdo->prepare("DELETE FROM gcal_event_recurrence WHERE event_pk = :p")->execute([':p' => $eventPk]);
        if (!empty($e['recurrence']['rrule'])) {
            $this->pdo->prepare(
                "INSERT INTO gcal_event_recurrence (event_pk, rrule, rdate, exdate, human)
                 VALUES (:p,:r,:rd,:ex,:h)")
                ->execute([
                    ':p' => $eventPk, ':r' => $e['recurrence']['rrule'],
                    ':rd' => $e['recurrence']['rdate'] ?? null,
                    ':ex' => $e['recurrence']['exdate'] ?? null,
                    ':h' => $e['recurrence']['human'] ?? null,
                ]);
        }

        $this->pdo->prepare("DELETE FROM gcal_event_conferences WHERE event_pk = :p")->execute([':p' => $eventPk]);
        if (!empty($e['conference']['uri'])) {
            $this->pdo->prepare(
                "INSERT INTO gcal_event_conferences (event_pk, platform, uri, meeting_code, phone, pin_enc)
                 VALUES (:p,:pl,:u,:c,:t,:pin)")
                ->execute([
                    ':p' => $eventPk, ':pl' => $e['conference']['platform'] ?? 'meet',
                    ':u' => $e['conference']['uri'],
                    ':c' => $e['conference']['meeting_code'] ?? null,
                    ':t' => $e['conference']['phone'] ?? null,
                    // PIN e credencial de acesso a sala: cifrado (§24.2).
                    ':pin' => !empty($e['conference']['pin'])
                        ? GcalCrypto::encrypt((string)$e['conference']['pin']) : null,
                ]);
        }
    }

    /**
     * Janela de eventos.
     *
     * A comparacao e em UTC direto — sem CONVERT_TZ. Dia inteiro entra pelo
     * ramo das colunas DATE, que nao tem fuso.
     */
    public function eventosDaJanela(int $userId, string $deUtc, string $ateUtc,
                                    ?array $calendarios = null, bool $incluirCancelados = false): array
    {
        $par = [':u' => $userId, ':de' => $deUtc, ':ate' => $ateUtc,
                ':de2' => substr($deUtc, 0, 10), ':ate2' => substr($ateUtc, 0, 10)];
        $filtroCal = '';
        if ($calendarios) {
            $ph = [];
            foreach (array_values($calendarios) as $i => $c) { $ph[] = ":c$i"; $par[":c$i"] = $c; }
            $filtroCal = ' AND e.calendar_id IN (' . implode(',', $ph) . ')';
        }
        $filtroCanc = $incluirCancelados ? '' : " AND e.status <> 'cancelled'";

        $sql = "SELECT e.*, c.summary AS calendar_summary, c.color_hex AS calendar_color,
                       c.access_role
                  FROM gcal_events e
                  JOIN gcal_accounts a ON a.id = e.account_id
                  LEFT JOIN gcal_calendars c
                         ON c.account_id = e.account_id AND c.calendar_id = e.calendar_id
                 WHERE a.user_id = :u AND a.is_active = 1 AND e.deleted = 0
                   $filtroCal $filtroCanc
                   AND ( (e.all_day = 0 AND e.end_utc > :de AND e.start_utc < :ate)
                      OR (e.all_day = 1 AND e.end_date > :de2 AND e.start_date < :ate2) )
                 ORDER BY COALESCE(e.start_utc, e.start_date)";
        $st = $this->pdo->prepare($sql);
        $st->execute($par);
        return $st->fetchAll(PDO::FETCH_ASSOC);
    }

    public function participantesDe(array $eventPks): array
    {
        if (!$eventPks) return [];
        $in = implode(',', array_fill(0, count($eventPks), '?'));
        $st = $this->pdo->prepare(
            "SELECT * FROM gcal_event_attendees WHERE event_pk IN ($in) ORDER BY is_organizer DESC, email");
        $st->execute($eventPks);
        $out = [];
        foreach ($st->fetchAll(PDO::FETCH_ASSOC) as $r) { $out[(int)$r['event_pk']][] = $r; }
        return $out;
    }

    // ═══════════════════════════════════════════════════════════════════
    // SINCRONIZACAO
    // ═══════════════════════════════════════════════════════════════════

    public function lerSyncToken(int $accountId, string $calendarId): ?string
    {
        $st = $this->pdo->prepare(
            "SELECT sync_token_enc FROM gcal_sync_state WHERE account_id = :a AND calendar_id = :c");
        $st->execute([':a' => $accountId, ':c' => $calendarId]);
        $v = $st->fetchColumn();
        return ($v === false || $v === null || $v === '') ? null : GcalCrypto::decrypt((string)$v);
    }

    public function salvarSyncState(int $accountId, string $calendarId, array $d): void
    {
        $st = $this->pdo->prepare(
            "INSERT INTO gcal_sync_state
                (account_id, calendar_id, sync_token_enc, status, last_sync_at, next_sync_at,
                 last_duration_ms, processed, attempt, window_from, window_to)
             VALUES (:a,:c,:t,:s,UTC_TIMESTAMP(),:n,:d,:p,:at,:wf,:wt)
             ON DUPLICATE KEY UPDATE
                sync_token_enc = COALESCE(VALUES(sync_token_enc), sync_token_enc),
                status = VALUES(status), last_sync_at = UTC_TIMESTAMP(),
                next_sync_at = VALUES(next_sync_at), last_duration_ms = VALUES(last_duration_ms),
                processed = VALUES(processed), attempt = VALUES(attempt),
                window_from = COALESCE(VALUES(window_from), window_from),
                window_to = COALESCE(VALUES(window_to), window_to)");
        $st->execute([
            ':a' => $accountId, ':c' => $calendarId,
            ':t' => isset($d['sync_token']) ? GcalCrypto::encrypt((string)$d['sync_token']) : null,
            ':s' => $d['status'] ?? 'ok',
            ':n' => $d['next_sync_at'] ?? null,
            ':d' => (int)($d['duration_ms'] ?? 0), ':p' => (int)($d['processed'] ?? 0),
            ':at' => (int)($d['attempt'] ?? 0),
            ':wf' => $d['window_from'] ?? null, ':wt' => $d['window_to'] ?? null,
        ]);
    }

    /** Token de sync invalidado (HTTP 410): marca para recarga, NÃO apaga dado (§49.3). */
    public function exigirCargaCompleta(int $accountId, string $calendarId): void
    {
        $this->pdo->prepare(
            "UPDATE gcal_sync_state
                SET status = 'full_resync_required', sync_token_enc = NULL, attempt = attempt + 1
              WHERE account_id = :a AND calendar_id = :c")
            ->execute([':a' => $accountId, ':c' => $calendarId]);
    }

    /**
     * Estado de sincronizacao de TODOS os calendarios, nao so dos ja rodados.
     *
     * O LEFT JOIN parte de `gcal_calendars`, e nao de `gcal_sync_state`, de
     * proposito: calendario recem-descoberto ainda nao tem linha de estado, e
     * partir do estado o esconderia. A tela de Sincronizacao e exatamente onde
     * a pessoa olha logo depois de conectar a conta — um calendario faltando
     * ali le-se como "sumiu", nao como "ainda nao rodou".
     */
    public function listarSyncState(int $userId): array
    {
        $st = $this->pdo->prepare(
            "SELECT c.calendar_id, c.summary, c.account_id,
                    COALESCE(s.status, 'pending') AS status,
                    s.last_sync_at, s.next_sync_at, s.last_duration_ms,
                    COALESCE(s.processed, 0) AS processed,
                    COALESCE(s.attempt, 0) AS attempt,
                    (s.account_id IS NULL) AS nunca_sincronizado
               FROM gcal_calendars c
               JOIN gcal_accounts a ON a.id = c.account_id
               LEFT JOIN gcal_sync_state s
                      ON s.account_id = c.account_id AND s.calendar_id = c.calendar_id
              WHERE a.user_id = :u AND a.is_active = 1 AND c.deleted = 0
              ORDER BY c.is_primary DESC, c.summary");
        $st->execute([':u' => $userId]);
        return $st->fetchAll(PDO::FETCH_ASSOC);
    }

    public function abrirRun(int $accountId, ?string $calendarId, string $kind, string $cid): int
    {
        $st = $this->pdo->prepare(
            "INSERT INTO gcal_sync_runs (account_id, calendar_id, kind, started_at, correlation_id)
             VALUES (:a,:c,:k,UTC_TIMESTAMP(),:cid)");
        $st->execute([':a' => $accountId, ':c' => $calendarId, ':k' => $kind, ':cid' => $cid]);
        return (int)$this->pdo->lastInsertId();
    }

    public function fecharRun(int $runId, array $n): void
    {
        $this->pdo->prepare(
            "UPDATE gcal_sync_runs
                SET finished_at = UTC_TIMESTAMP(),
                    duration_ms = :d, processed = :p, created_n = :c,
                    updated_n = :u, deleted_n = :x, errors_n = :e
              WHERE id = :id")
            ->execute([
                ':d' => (int)($n['duration_ms'] ?? 0), ':p' => (int)($n['processed'] ?? 0),
                ':c' => (int)($n['created'] ?? 0), ':u' => (int)($n['updated'] ?? 0),
                ':x' => (int)($n['deleted'] ?? 0), ':e' => (int)($n['errors'] ?? 0),
                ':id' => $runId,
            ]);
    }

    public function registrarErro(int $accountId, array $e): void
    {
        $this->pdo->prepare(
            "INSERT INTO gcal_sync_errors
                (run_id, account_id, calendar_id, event_id, http_status, error_code, message, correlation_id)
             VALUES (:r,:a,:c,:e,:h,:co,:m,:cid)")
            ->execute([
                ':r' => $e['run_id'] ?? null, ':a' => $accountId,
                ':c' => $e['calendar_id'] ?? null, ':e' => $e['event_id'] ?? null,
                ':h' => $e['http_status'] ?? null, ':co' => $e['error_code'] ?? null,
                // Mensagem CURTA e sem conteudo de evento (§75.2).
                ':m' => mb_substr((string)($e['message'] ?? ''), 0, 480),
                ':cid' => $e['correlation_id'] ?? null,
            ]);
    }

    // ═══════════════════════════════════════════════════════════════════
    // AUDITORIA (§76)
    // ═══════════════════════════════════════════════════════════════════

    public function auditar(int $userId, string $acao, array $d = []): void
    {
        $this->pdo->prepare(
            "INSERT INTO gcal_audit_logs
                (user_id, account_id, calendar_id, event_id, action, before_json, after_json,
                 result, ip, origin, correlation_id)
             VALUES (:u,:a,:c,:e,:ac,:b,:af,:r,:ip,:o,:cid)")
            ->execute([
                ':u' => $userId, ':a' => $d['account_id'] ?? null,
                ':c' => $d['calendar_id'] ?? null, ':e' => $d['event_id'] ?? null,
                ':ac' => $acao,
                // scrub antes de gravar: o log de auditoria nao pode virar
                // deposito de token nem de descricao de evento (§75.2).
                ':b' => isset($d['before']) ? json_encode(GcalCrypto::scrub($d['before']), JSON_UNESCAPED_UNICODE) : null,
                ':af' => isset($d['after']) ? json_encode(GcalCrypto::scrub($d['after']), JSON_UNESCAPED_UNICODE) : null,
                ':r' => $d['result'] ?? 'ok',
                ':ip' => $d['ip'] ?? null, ':o' => $d['origin'] ?? 'painel',
                ':cid' => $d['correlation_id'] ?? null,
            ]);
    }

    // ═══════════════════════════════════════════════════════════════════
    // FILA DE JOBS (§50, Fase 5)
    // ═══════════════════════════════════════════════════════════════════

    /**
     * Enfileira um job, SEM duplicar o que já está esperando.
     *
     * A deduplicação não é enfeite: o webhook do Google dispara uma notificação
     * por alteração, e uma edição em lote na agenda vira dezenas de POSTs em
     * segundos. Sem isto a fila encheria de `incremental` idênticos e cada um
     * gastaria uma chamada de API para descobrir que não havia mais nada.
     *
     * @return int id do job (novo ou o já existente)
     */
    public function enfileirar(int $accountId, ?string $calendarId, string $kind,
                               array $payload = [], int $atrasoSeg = 0, int $prioridade = 5): int
    {
        $existe = $this->pdo->prepare(
            "SELECT id FROM gcal_sync_jobs
              WHERE account_id = :a AND kind = :k AND status = 'pending'
                AND (calendar_id <=> :c)
              LIMIT 1");
        $existe->execute([':a' => $accountId, ':k' => $kind, ':c' => $calendarId]);
        $id = $existe->fetchColumn();
        if ($id !== false) {
            // Já há um pendente: antecipa se o novo pedido é mais urgente. Um
            // webhook não deve esperar o fallback de 15 min só porque chegou
            // depois de um job agendado.
            $this->pdo->prepare(
                "UPDATE gcal_sync_jobs
                    SET run_after = LEAST(run_after, UTC_TIMESTAMP() + INTERVAL :s SECOND),
                        priority  = LEAST(priority, :p)
                  WHERE id = :id")
                ->execute([':s' => $atrasoSeg, ':p' => $prioridade, ':id' => (int)$id]);
            return (int)$id;
        }

        $this->pdo->prepare(
            "INSERT INTO gcal_sync_jobs (account_id, calendar_id, kind, status, priority, run_after, payload)
             VALUES (:a,:c,:k,'pending',:p, UTC_TIMESTAMP() + INTERVAL :s SECOND, :j)")
            ->execute([
                ':a' => $accountId, ':c' => $calendarId, ':k' => $kind, ':p' => $prioridade,
                ':s' => $atrasoSeg,
                ':j' => $payload ? json_encode($payload, JSON_UNESCAPED_UNICODE) : null,
            ]);
        return (int)$this->pdo->lastInsertId();
    }

    /**
     * Reserva o próximo job devido, marcando-o como `running` de forma atômica.
     *
     * `FOR UPDATE SKIP LOCKED` (MySQL 8) é o que permite mais de um worker sem
     * dois pegarem o mesmo job. Sem ele, dois crons sobrepostos — e cron
     * sobreposto acontece justamente quando um job está lento — fariam a mesma
     * carga duas vezes, dobrando o consumo de cota da API.
     *
     * @return ?array o job reservado, ou null se não há nada devido
     */
    public function reservarJob(): ?array
    {
        return $this->transacao(function (GcalRepository $r): ?array {
            $st = $r->pdo->query(
                "SELECT * FROM gcal_sync_jobs
                  WHERE status = 'pending' AND run_after <= UTC_TIMESTAMP()
                  ORDER BY priority, run_after, id
                  LIMIT 1
                  FOR UPDATE SKIP LOCKED");
            $j = $st->fetch(PDO::FETCH_ASSOC);
            if (!$j) return null;

            $r->pdo->prepare(
                "UPDATE gcal_sync_jobs
                    SET status = 'running', started_at = UTC_TIMESTAMP(), attempts = attempts + 1
                  WHERE id = :id")
                ->execute([':id' => (int)$j['id']]);

            $j['attempts'] = (int)$j['attempts'] + 1;
            return $j;
        });
    }

    public function concluirJob(int $jobId): void
    {
        $this->pdo->prepare(
            "UPDATE gcal_sync_jobs SET status = 'done', finished_at = UTC_TIMESTAMP(), last_error = NULL
              WHERE id = :id")->execute([':id' => $jobId]);
    }

    /**
     * Job falhou: reagenda com backoff exponencial, ou mata após 6 tentativas.
     *
     * O teto existe porque retry infinito sobre erro permanente (escopo
     * revogado, calendário apagado) queima cota para sempre e o problema nunca
     * aparece — `dead` é o que faz o alerta técnico acontecer.
     */
    public function falharJob(int $jobId, int $tentativas, string $erro, bool $permanente = false): string
    {
        $morreu = $permanente || $tentativas >= 6;
        if ($morreu) {
            $this->pdo->prepare(
                "UPDATE gcal_sync_jobs SET status = 'dead', finished_at = UTC_TIMESTAMP(), last_error = :e
                  WHERE id = :id")
                ->execute([':e' => mb_substr($erro, 0, 480), ':id' => $jobId]);
            return 'dead';
        }
        // 1, 2, 4, 8, 16, 32 min.
        $espera = (int)(2 ** max(0, $tentativas - 1));
        $this->pdo->prepare(
            "UPDATE gcal_sync_jobs
                SET status = 'pending', last_error = :e,
                    run_after = UTC_TIMESTAMP() + INTERVAL :m MINUTE
              WHERE id = :id")
            ->execute([':e' => mb_substr($erro, 0, 480), ':m' => $espera, ':id' => $jobId]);
        return 'reagendado em ' . $espera . ' min';
    }

    /**
     * Devolve à fila os jobs presos em `running`.
     *
     * Um worker morto (OOM, deploy no meio, timeout do PHP) deixa o job em
     * `running` para sempre e aquele calendário simplesmente para de
     * sincronizar — sem erro em lugar nenhum. Só o tempo denuncia.
     */
    public function destravarJobs(int $minutos = 30): int
    {
        $st = $this->pdo->prepare(
            "UPDATE gcal_sync_jobs
                SET status = 'pending', last_error = 'worker não finalizou; devolvido à fila'
              WHERE status = 'running' AND started_at < UTC_TIMESTAMP() - INTERVAL :m MINUTE");
        $st->execute([':m' => $minutos]);
        return $st->rowCount();
    }

    /** Resumo da fila para a tela de Sincronização e para o /status. */
    public function resumoFila(?int $userId = null): array
    {
        $sql = "SELECT j.status, j.kind, COUNT(*) n, MIN(j.run_after) proxima
                  FROM gcal_sync_jobs j";
        $par = [];
        if ($userId !== null) {
            $sql .= " JOIN gcal_accounts a ON a.id = j.account_id AND a.user_id = :u";
            $par[':u'] = $userId;
        }
        $sql .= " WHERE j.status IN ('pending','running','dead') GROUP BY j.status, j.kind";
        $st = $this->pdo->prepare($sql);
        $st->execute($par);
        return $st->fetchAll(PDO::FETCH_ASSOC);
    }

    /** Jobs concluídos há mais de N dias saem: a fila não é histórico. */
    public function limparJobsAntigos(int $dias = 7): int
    {
        $st = $this->pdo->prepare(
            "DELETE FROM gcal_sync_jobs
              WHERE status = 'done' AND finished_at < UTC_TIMESTAMP() - INTERVAL :d DAY");
        $st->execute([':d' => $dias]);
        return $st->rowCount();
    }

    // ── Manutenção dos `dead` (Q-V9.6 do APP DSHOW, 2026-10-29) — GcalManutencaoService ──

    /**
     * Jobs `dead` com o último `error_code` registrado para o mesmo (conta, calendário) depois do
     * início do job. O motivo não fica no job (last_error é texto livre); fica em gcal_sync_errors.
     */
    public function jobsMortos(): array
    {
        return $this->pdo->query(
            "SELECT j.id, j.account_id, j.calendar_id, j.kind, j.attempts, j.started_at, j.finished_at, j.last_error,
                    (SELECT e.error_code FROM gcal_sync_errors e
                      WHERE e.account_id = j.account_id
                        AND ((j.calendar_id IS NULL AND e.calendar_id IS NULL) OR e.calendar_id = j.calendar_id)
                        AND (j.started_at IS NULL OR e.occurred_at >= j.started_at)
                      ORDER BY e.occurred_at DESC LIMIT 1) AS error_code
               FROM gcal_sync_jobs j
              WHERE j.status = 'dead'
              ORDER BY j.id")->fetchAll(PDO::FETCH_ASSOC);
    }

    /** `dead` → `cancelled` (migração 02e), preservando o erro original. Só mexe se ainda estiver `dead`. */
    public function cancelarJob(int $jobId, string $motivo): void
    {
        $this->pdo->prepare(
            "UPDATE gcal_sync_jobs
                SET status = 'cancelled', finished_at = UTC_TIMESTAMP(),
                    last_error = CONCAT(:m, ' · ', LEFT(COALESCE(last_error, ''), 380))
              WHERE id = :id AND status = 'dead'")
            ->execute([':m' => mb_substr($motivo, 0, 100), ':id' => $jobId]);
    }

    /** `dead` → `pending` com attempts zerado (erro corrigido fora do Google). Só mexe se ainda estiver `dead`. */
    public function reenfileirarJobMorto(int $jobId, string $nota): int
    {
        $st = $this->pdo->prepare(
            "UPDATE gcal_sync_jobs
                SET status = 'pending', attempts = 0, run_after = UTC_TIMESTAMP(), started_at = NULL, finished_at = NULL,
                    last_error = CONCAT(:n, ' · ', LEFT(COALESCE(last_error, ''), 400))
              WHERE id = :id AND status = 'dead'");
        $st->execute([':n' => mb_substr($nota, 0, 80), ':id' => $jobId]);
        return $st->rowCount();
    }

    /** Um calendário que o Google diz não existir mais: mesma marca de marcarCalendariosAusentes (NÃO deleta). */
    public function marcarCalendarioApagado(int $accountId, string $calendarId): int
    {
        $st = $this->pdo->prepare(
            "UPDATE gcal_calendars SET deleted = 1
              WHERE account_id = :a AND calendar_id = :c AND deleted = 0");
        $st->execute([':a' => $accountId, ':c' => $calendarId]);
        return $st->rowCount();
    }

    // ── Canais push faltantes (Q-V9.7 do APP DSHOW, 2026-10-29) — GcalWatchService::abrirFaltantes ──

    /**
     * Calendários vivos de contas ativas e conectadas SEM canal push ativo. `freeBusyReader` fica de
     * fora: sem acesso aos eventos o Google recusa events.watch, e a recusa se repetiria a cada hora.
     */
    public function calendariosSemCanal(): array
    {
        return $this->pdo->query(
            "SELECT c.account_id, c.calendar_id, c.access_role
               FROM gcal_calendars c
               JOIN gcal_accounts a ON a.id = c.account_id AND a.is_active = 1 AND a.connection_status = 'connected'
               LEFT JOIN gcal_watch_channels w
                      ON w.account_id = c.account_id AND w.calendar_id = c.calendar_id AND w.stopped_at IS NULL
              WHERE c.deleted = 0 AND c.access_role <> 'freeBusyReader' AND w.channel_id IS NULL
              ORDER BY c.account_id, c.calendar_id")->fetchAll(PDO::FETCH_ASSOC);
    }

    /** Houve `watch_renew` pendente/rodando ou concluído nos últimos N minutos? (freio da abertura automática) */
    public function houveWatchRenewRecente(int $minutos = 60): bool
    {
        $st = $this->pdo->prepare(
            "SELECT 1 FROM gcal_sync_jobs
              WHERE kind = 'watch_renew'
                AND (status IN ('pending','running')
                     OR (finished_at IS NOT NULL AND finished_at >= UTC_TIMESTAMP() - INTERVAL :m MINUTE))
              LIMIT 1");
        $st->execute([':m' => $minutos]);
        return $st->fetchColumn() !== false;
    }

    // ═══════════════════════════════════════════════════════════════════
    // CANAIS PUSH (§50)
    // ═══════════════════════════════════════════════════════════════════

    public function salvarCanal(array $c): void
    {
        $this->pdo->prepare(
            "INSERT INTO gcal_watch_channels
                (channel_id, account_id, calendar_id, resource_id, token_enc, expiration)
             VALUES (:ch,:a,:c,:r,:t,:e)")
            ->execute([
                ':ch' => $c['channel_id'], ':a' => $c['account_id'], ':c' => $c['calendar_id'],
                ':r' => $c['resource_id'],
                // O token do canal é a senha do webhook: cifrado, como o resto.
                ':t' => GcalCrypto::encrypt((string)$c['token']),
                ':e' => $c['expiration'],
            ]);
    }

    /**
     * Canal ativo pelo id, para o webhook validar quem está chamando.
     *
     * @return ?array com `token` já decifrado
     */
    public function canalAtivo(string $channelId): ?array
    {
        $st = $this->pdo->prepare(
            "SELECT * FROM gcal_watch_channels WHERE channel_id = :ch AND stopped_at IS NULL");
        $st->execute([':ch' => $channelId]);
        $c = $st->fetch(PDO::FETCH_ASSOC);
        if (!$c) return null;
        $c['token'] = $c['token_enc'] ? GcalCrypto::decrypt((string)$c['token_enc']) : '';
        unset($c['token_enc']);
        return $c;
    }

    /**
     * Canais ativos de um calendário.
     *
     * ⚠️ Devolve LISTA, não um só. A `UNIQUE KEY (account_id, calendar_id,
     * stopped_at)` NÃO impede dois canais ativos: em MySQL, NULLs são sempre
     * distintos numa chave única. A unicidade real é responsabilidade do
     * código — por isso a renovação para o antigo explicitamente.
     */
    public function canaisAtivosDe(int $accountId, string $calendarId): array
    {
        $st = $this->pdo->prepare(
            "SELECT * FROM gcal_watch_channels
              WHERE account_id = :a AND calendar_id = :c AND stopped_at IS NULL
              ORDER BY expiration DESC");
        $st->execute([':a' => $accountId, ':c' => $calendarId]);
        return $st->fetchAll(PDO::FETCH_ASSOC);
    }

    public function marcarCanalParado(string $channelId): void
    {
        $this->pdo->prepare(
            "UPDATE gcal_watch_channels SET stopped_at = UTC_TIMESTAMP()
              WHERE channel_id = :ch AND stopped_at IS NULL")
            ->execute([':ch' => $channelId]);
    }

    /** Canais que expiram dentro da janela — alvo do job `watch_renew`. */
    public function canaisAVencer(int $horas = 24): array
    {
        $st = $this->pdo->prepare(
            "SELECT w.* FROM gcal_watch_channels w
               JOIN gcal_accounts a ON a.id = w.account_id AND a.is_active = 1
              WHERE w.stopped_at IS NULL
                AND w.expiration < UTC_TIMESTAMP() + INTERVAL :h HOUR
              ORDER BY w.expiration");
        $st->execute([':h' => $horas]);
        return $st->fetchAll(PDO::FETCH_ASSOC);
    }

    /** Canais ativos de um usuário, para a tela de Sincronização. */
    public function canaisDoUsuario(int $userId): array
    {
        $st = $this->pdo->prepare(
            "SELECT w.channel_id, w.calendar_id, w.expiration, w.created_at
               FROM gcal_watch_channels w
               JOIN gcal_accounts a ON a.id = w.account_id
              WHERE a.user_id = :u AND w.stopped_at IS NULL
              ORDER BY w.expiration");
        $st->execute([':u' => $userId]);
        return $st->fetchAll(PDO::FETCH_ASSOC);
    }

    /** ULID simplificado: ordenável no tempo e único o bastante para correlacionar. */
    public static function correlationId(): string
    {
        return strtoupper(base_convert((string)time(), 10, 32)) . bin2hex(random_bytes(9));
    }
}
