<?php
// Google Calendar / GcalNormalizer - Google API v3 <-> modelo interno
// @module google-calendar.normalizer
// @version 1.0.0
// @created 2026-07-30
// @app Google Calendar
//
// Ponto unico de traducao. Existe para que NENHUM outro arquivo precise saber o
// formato do Google — e para que as regras de fuso e de dia inteiro fiquem num
// lugar so, onde da para testar.
//
// AS DUAS REGRAS QUE MAIS SE ERRA AQUI:
//
// 1. `start.date` (sem hora) e `start.dateTime` (com hora) sao coisas
//    DIFERENTES. Evento de dia inteiro nao tem hora nem fuso: virar 00:00 de um
//    fuso e o erro classico que joga o evento para o dia anterior (§48).
//
// 2. Todo `dateTime` vira UTC ANTES de tocar o banco. `mysql.time_zone_name`
//    esta vazia neste servidor; conversao por nome em SQL devolve NULL, e NULL
//    num WHERE de janela some com o evento sem erro no log (§47).
declare(strict_types=1);

final class GcalNormalizer
{
    /**
     * Tipos de evento que o BANCO aceita — espelho EXATO do ENUM `gcal_events.event_type`
     * (docs/GOOGLE-CALENDAR/02-banco-GCAL_DSHOW.sql; migração 02d acrescentou `fromGmail`).
     * Lista fechada de propósito: um valor fora dela truncaria no INSERT (sql_mode STRICT →
     * 1265 "Data truncated for column 'event_type'") e, até 28/10/2026, derrubava a
     * sincronização do calendário INTEIRO. Tipo desconhecido vira `default` + aviso no log.
     * Documentação da API (events.eventType): default, outOfOffice, focusTime,
     * workingLocation, fromGmail (eventos criados pelo Gmail — voos, hotéis, reservas), birthday.
     * Acrescentar um tipo aqui EXIGE a migração do ENUM antes (ordem: banco → código).
     */
    public const TIPOS_EVENTO = ['default', 'focusTime', 'outOfOffice', 'workingLocation', 'birthday', 'fromGmail'];

    /** Tipos desconhecidos vistos neste processo → contagem (para log/teste; nunca conteúdo de evento). */
    public static array $tiposDesconhecidos = [];

    /** Tipo seguro para o banco: conhecido passa; desconhecido/ausente → 'default' (avisando UMA vez por tipo). */
    public static function tipoEvento(mixed $tipo, string $calendarId = ''): string
    {
        $t = is_string($tipo) ? trim($tipo) : '';
        if ($t === '') return 'default';
        if (in_array($t, self::TIPOS_EVENTO, true)) return $t;
        $t = mb_substr($t, 0, 40);
        if (!isset(self::$tiposDesconhecidos[$t])) {
            error_log('[gcal] eventType desconhecido "' . $t . '" gravado como default'
                . ($calendarId !== '' ? ' (calendário ' . $calendarId . ')' : '')
                . ' — ampliar o ENUM (migração) e TIPOS_EVENTO');
        }
        self::$tiposDesconhecidos[$t] = (self::$tiposDesconhecidos[$t] ?? 0) + 1;
        return 'default';
    }

    /** Mapa dos papéis do Google para os nossos (§30). */
    private const ACESSO = [
        'owner' => 'owner', 'writer' => 'writer',
        'reader' => 'reader', 'freeBusyReader' => 'freeBusyReader',
    ];

    private static function utc(?string $iso): ?string
    {
        if (!$iso) return null;
        try {
            return (new \DateTimeImmutable($iso))->setTimezone(new \DateTimeZone('UTC'))
                ->format('Y-m-d H:i:s');
        } catch (\Throwable $e) { return null; }
    }

    /** Deduz o "tipo" do calendário para a UI a partir do que o Google entrega. */
    private static function tipoCalendario(array $c): string
    {
        $id = (string)($c['id'] ?? '');
        if (!empty($c['primary'])) return 'personal';
        // Calendário de recurso do Workspace tem id no formato .../resource.calendar.google.com
        if (str_contains($id, 'resource.calendar.google.com')) return 'resource';
        if (str_contains($id, '#holiday@group.v.calendar.google.com')) return 'holiday';
        if (str_contains($id, '#contacts@group.v.calendar.google.com')) return 'other';
        if (str_contains($id, 'group.calendar.google.com')) return 'team';
        return 'other';
    }

    public static function calendario(array $c): array
    {
        return [
            'calendar_id'  => (string)($c['id'] ?? ''),
            'summary'      => (string)($c['summaryOverride'] ?? $c['summary'] ?? '(sem nome)'),
            'description'  => $c['description'] ?? null,
            'time_zone'    => (string)($c['timeZone'] ?? 'America/Sao_Paulo'),
            'color_id'     => $c['colorId'] ?? null,
            'color_hex'    => $c['backgroundColor'] ?? null,
            'access_role'  => self::ACESSO[$c['accessRole'] ?? 'reader'] ?? 'reader',
            'is_primary'   => !empty($c['primary']),
            'kind'         => self::tipoCalendario($c),
            'etag'         => $c['etag'] ?? null,
            'selected'     => !empty($c['selected']),
            'resource_location' => $c['location'] ?? null,
        ];
    }

    /**
     * Evento do Google → modelo interno.
     *
     * `$meuEmail` permite marcar `is_self` e `my_response` sem uma segunda
     * consulta. Quando ausente, o Google já sinaliza com `self: true`.
     */
    public static function evento(array $e, string $calendarId, ?string $meuEmail = null): array
    {
        $inicio = $e['start'] ?? [];
        $fim    = $e['end'] ?? [];
        // `date` presente = dia inteiro. Nunca inferir por outro caminho.
        $diaInteiro = isset($inicio['date']);

        $attendees = [];
        $minhaResposta = null;
        foreach (($e['attendees'] ?? []) as $a) {
            $eu = !empty($a['self'])
               || ($meuEmail !== null && strcasecmp((string)($a['email'] ?? ''), $meuEmail) === 0);
            if ($eu) $minhaResposta = $a['responseStatus'] ?? 'needsAction';
            $attendees[] = [
                'email'        => (string)($a['email'] ?? ''),
                'display_name' => $a['displayName'] ?? null,
                'response'     => (string)($a['responseStatus'] ?? 'needsAction'),
                'optional'     => !empty($a['optional']),
                'is_organizer' => !empty($a['organizer']),
                'is_self'      => $eu,
                'is_resource'  => !empty($a['resource']),
                'comment'      => $a['comment'] ?? null,
            ];
        }

        // `reminders.useDefault` significa "o que o calendário definir": não é
        // ausência de lembrete, e copiar como vazio faria o usuário achar que
        // perdeu o alerta.
        $lembretes = [];
        if (!empty($e['reminders']['overrides'])) {
            foreach ($e['reminders']['overrides'] as $r) {
                $lembretes[] = ['method' => $r['method'] ?? 'popup', 'minutes' => (int)($r['minutes'] ?? 10)];
            }
        } elseif (!empty($e['reminders']['useDefault'])) {
            $lembretes[] = ['method' => 'popup', 'minutes' => 10, 'padrao_do_calendario' => true];
        }

        $conf = null;
        if (!empty($e['conferenceData']['entryPoints'])) {
            foreach ($e['conferenceData']['entryPoints'] as $p) {
                if (($p['entryPointType'] ?? '') === 'video' && !empty($p['uri'])) {
                    $conf = [
                        'platform'     => $e['conferenceData']['conferenceSolution']['name'] ?? 'meet',
                        'uri'          => (string)$p['uri'],
                        'meeting_code' => $p['meetingCode'] ?? null,
                        'pin'          => $p['pin'] ?? null,
                    ];
                }
                if (($p['entryPointType'] ?? '') === 'phone' && $conf !== null && empty($conf['phone'])) {
                    $conf['phone'] = $p['uri'] ?? null;
                }
            }
        }

        $rec = null;
        if (!empty($e['recurrence'])) {
            $rrule = null; $rdate = []; $exdate = [];
            foreach ($e['recurrence'] as $linha) {
                if (str_starts_with($linha, 'RRULE:'))       $rrule = $linha;
                elseif (str_starts_with($linha, 'RDATE'))    $rdate[] = $linha;
                elseif (str_starts_with($linha, 'EXDATE'))   $exdate[] = $linha;
            }
            if ($rrule) {
                $rec = [
                    'rrule'  => $rrule,
                    'rdate'  => $rdate ? implode("\n", $rdate) : null,
                    'exdate' => $exdate ? implode("\n", $exdate) : null,
                    'human'  => self::rruleEmTexto($rrule),
                ];
            }
        }

        return [
            'calendar_id'         => $calendarId,
            'event_id'            => (string)($e['id'] ?? ''),
            'ical_uid'            => $e['iCalUID'] ?? null,
            'recurring_event_id'  => $e['recurringEventId'] ?? null,
            'original_start_time' => $e['originalStartTime']['dateTime']
                                  ?? $e['originalStartTime']['date'] ?? null,
            'status'              => (string)($e['status'] ?? 'confirmed'),
            'summary'             => $e['summary'] ?? null,
            'description'         => $e['description'] ?? null,
            'location'            => $e['location'] ?? null,
            'all_day'             => $diaInteiro,
            // Um ramo OU o outro — nunca os dois.
            'start_utc'           => $diaInteiro ? null : self::utc($inicio['dateTime'] ?? null),
            'end_utc'             => $diaInteiro ? null : self::utc($fim['dateTime'] ?? null),
            'start_date'          => $diaInteiro ? ($inicio['date'] ?? null) : null,
            'end_date'            => $diaInteiro ? ($fim['date'] ?? null) : null,
            'event_time_zone'     => $inicio['timeZone'] ?? null,
            'transparency'        => ($e['transparency'] ?? 'opaque') === 'transparent' ? 'transparent' : 'opaque',
            'visibility'          => (string)($e['visibility'] ?? 'default'),
            'event_type'          => self::tipoEvento($e['eventType'] ?? null, $calendarId),
            'organizer_email'     => $e['organizer']['email'] ?? null,
            'organizer_name'      => $e['organizer']['displayName'] ?? null,
            'organizer_self'      => !empty($e['organizer']['self']),
            'my_response'         => $minhaResposta,
            'color_id'            => $e['colorId'] ?? null,
            'etag'                => $e['etag'] ?? null,
            'sequence'            => (int)($e['sequence'] ?? 0),
            'html_link'           => $e['htmlLink'] ?? null,
            'google_created'      => $e['created'] ?? null,
            'google_updated'      => $e['updated'] ?? null,
            'attendees'           => $attendees,
            'reminders'           => $lembretes,
            'recurrence'          => $rec,
            'conference'          => $conf,
            'raw'                 => $e,
        ];
    }

    /**
     * Modelo interno → payload do Google.
     *
     * Só manda o que veio: um PATCH com campo ausente não apaga nada, mas um
     * PATCH com campo `null` APAGA. Por isso o array é montado por presença.
     */
    public static function paraGoogle(array $p): array
    {
        $out = [];
        if (array_key_exists('summary', $p))     $out['summary'] = $p['summary'];
        if (array_key_exists('description', $p)) $out['description'] = $p['description'];
        if (array_key_exists('location', $p))    $out['location'] = $p['location'];

        if (isset($p['start']) || isset($p['end'])) {
            $diaInteiro = !empty($p['all_day']);
            $tz = $p['time_zone'] ?? 'America/Sao_Paulo';
            if (isset($p['start'])) {
                $out['start'] = $diaInteiro
                    ? ['date' => substr((string)$p['start'], 0, 10)]
                    : ['dateTime' => (string)$p['start'], 'timeZone' => $tz];
            }
            if (isset($p['end'])) {
                $out['end'] = $diaInteiro
                    ? ['date' => substr((string)$p['end'], 0, 10)]
                    : ['dateTime' => (string)$p['end'], 'timeZone' => $tz];
            }
        }

        if (isset($p['transparency'])) $out['transparency'] = $p['transparency'];
        if (isset($p['visibility']))   $out['visibility'] = $p['visibility'];
        if (isset($p['color']))        $out['colorId'] = $p['color'];

        if (isset($p['attendees'])) {
            $out['attendees'] = array_values(array_map(static fn($a) => array_filter([
                'email'       => $a['email'] ?? null,
                'displayName' => $a['name'] ?? $a['display_name'] ?? null,
                'optional'    => !empty($a['optional']) ? true : null,
            ], static fn($v) => $v !== null), $p['attendees']));
        }

        if (isset($p['reminders'])) {
            $out['reminders'] = [
                'useDefault' => false,
                'overrides'  => array_values(array_map(static fn($r) => [
                    'method' => $r['method'] ?? 'popup', 'minutes' => (int)($r['minutes'] ?? 10),
                ], $p['reminders'])),
            ];
        }

        if (isset($p['recurrence']) && !empty($p['recurrence']['rrule'])) {
            $out['recurrence'] = [$p['recurrence']['rrule']];
        }

        // Criar Meet exige `conferenceDataVersion=1` na query; quem chama cuida.
        if (!empty($p['conference'])) {
            $out['conferenceData'] = [
                'createRequest' => [
                    'requestId' => bin2hex(random_bytes(8)),
                    'conferenceSolutionKey' => ['type' => 'hangoutsMeet'],
                ],
            ];
        }
        return $out;
    }

    /**
     * RRULE em português, para a UI.
     *
     * Cobre os casos que o próprio módulo cria e os mais comuns vindos do
     * Google. O que não casar volta a regra crua — melhor mostrar
     * "RRULE:FREQ=..." do que inventar uma descrição errada.
     */
    public static function rruleEmTexto(string $rrule): string
    {
        $p = [];
        foreach (explode(';', substr($rrule, strlen('RRULE:'))) as $par) {
            [$k, $v] = array_pad(explode('=', $par, 2), 2, '');
            if ($k !== '') $p[strtoupper($k)] = $v;
        }
        $freq = $p['FREQ'] ?? '';
        $intervalo = max(1, (int)($p['INTERVAL'] ?? 1));

        $dias = ['MO' => 'segunda', 'TU' => 'terça', 'WE' => 'quarta', 'TH' => 'quinta',
                 'FR' => 'sexta', 'SA' => 'sábado', 'SU' => 'domingo'];
        $porDia = [];
        foreach (array_filter(explode(',', $p['BYDAY'] ?? '')) as $d) {
            $porDia[] = $dias[substr($d, -2)] ?? $d;
        }

        $base = match ($freq) {
            'DAILY'   => $intervalo === 1 ? 'Todos os dias' : "A cada {$intervalo} dias",
            'WEEKLY'  => $intervalo === 1 ? 'Toda semana' : "A cada {$intervalo} semanas",
            'MONTHLY' => $intervalo === 1 ? 'Todo mês' : "A cada {$intervalo} meses",
            'YEARLY'  => $intervalo === 1 ? 'Todo ano' : "A cada {$intervalo} anos",
            default   => $rrule,
        };
        if ($base === $rrule) return $rrule;

        if ($porDia) {
            $lista = count($porDia) === 5 && !array_diff($porDia, ['segunda','terça','quarta','quinta','sexta'])
                ? 'nos dias úteis'
                : ('às ' . implode(', ', $porDia));
            $base .= ', ' . $lista;
        }
        if (!empty($p['COUNT']))  $base .= ', ' . (int)$p['COUNT'] . ' vezes';
        if (!empty($p['UNTIL'])) {
            $u = $p['UNTIL'];
            $d = substr($u, 6, 2) . '/' . substr($u, 4, 2) . '/' . substr($u, 0, 4);
            $base .= ", até {$d}";
        }
        return $base;
    }
}
