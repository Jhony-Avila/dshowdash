<?php
// Google Calendar / GcalMock - provedor MOCK (sem Google API, sem banco)
// @module google-calendar.mock
// @version 1.0.0
// @created 2026-07-29
// @app Google Calendar
//
// Habilitado por GCAL_PROVIDER=mock no .env. Molde: api/outlook/lib/OutlookMock.php.
//
// Estado mutavel por sessao ($_SESSION['gcal_mock']): criar, editar, mover,
// excluir e responder convite "grudam" durante o teste. NAO toca a Google API
// nem banco algum. Escopo natural: por sessao = por usuario.
//
// DUAS DECISOES QUE VALE EXPLICAR:
//
// 1. A semente e ancorada em HOJE e re-semeia quando o dia vira. Mock de agenda
//    envelhece diferente de mock de lista: "proxima reuniao" e "conflitos de
//    hoje" viram mentira na manha seguinte, e a tela parece quebrada sem estar.
//
// 2. Conflitos, free/busy, KPIs e alertas sao COMPUTADOS a partir dos eventos,
//    nunca fixos. Se estivessem fixos, mover um evento na UI deixaria a central
//    de conflitos contradizendo a agenda ao lado — e a Fase 2 existe justamente
//    para validar esses fluxos antes de existir dado real.
declare(strict_types=1);

final class GcalMock extends GcalProviderBase
{
    // TZ vem da base (protected); redeclarar como private quebraria a herança.

    /**
     * Versao da SEMENTE. Bumpar sempre que eventosSeed()/calendariosSeed()
     * mudarem de forma.
     *
     * Sem isto, quem ja tem sessao continua vendo a semente antiga ate o dia
     * virar — e a gente "corrige o mock" sem que nada mude na tela. Aconteceu:
     * adicionei o cenario de cancelamento no passado, a suite CLI passou (sessao
     * nova) e o navegador seguiu sem ele.
     */
    /**
     * v5: paleta de calendario revista na HOMOLOGACAO. O evento do FullCalendar
     * usa texto quase-preto (#111827) — medido, branco reprovava em quase todas
     * as cores. Com o texto escuro, as cores VIVAS (#3B82F6, #8B5CF6, #EF4444,
     * #6B7280) ficavam entre 3,67 e 4,82:1. Estas passam de 5:1 com folga para
     * a hachura de "privado"/"disponivel", que escurece um pouco o fundo.
     */
    private const SEMENTE_VERSAO = 5;

    public static function isEnabled(): bool
    {
        $v = getenv('GCAL_PROVIDER');
        if ($v === false || $v === '') { $v = $_ENV['GCAL_PROVIDER'] ?? ''; }
        return strtolower(trim((string)$v)) === 'mock';
    }

    public function nome(): string { return 'mock'; }

    /** @return array referencia ao estado (semeia se ausente ou se o dia virou) */
    private static function &state(): array
    {
        $hoje = (new \DateTimeImmutable('now', new \DateTimeZone(self::TZ)))->format('Y-m-d');
        if (!isset($_SESSION['gcal_mock']['dia_semente'])
            || $_SESSION['gcal_mock']['dia_semente'] !== $hoje
            || ($_SESSION['gcal_mock']['versao'] ?? 0) !== self::SEMENTE_VERSAO) {
            $_SESSION['gcal_mock'] = self::seed($hoje);
        }
        return $_SESSION['gcal_mock'];
    }

    public static function reset(): void
    {
        unset($_SESSION['gcal_mock']);
    }

    // ═══════════════════════════════════════════════════════════════════
    // SEMENTE
    // ═══════════════════════════════════════════════════════════════════

    private static function seed(string $hoje): array
    {
        return [
            'dia_semente' => $hoje,
            'versao'      => self::SEMENTE_VERSAO,
            'contas'      => self::contasSeed(),
            'calendarios' => self::calendariosSeed(),
            'eventos'     => self::eventosSeed($hoje),
            'proximo_id'  => 9000,
            'sync'        => self::syncSeed(),
        ];
    }

    private static function contasSeed(): array
    {
        $agora = new \DateTimeImmutable('now', new \DateTimeZone('UTC'));
        return [
            [
                'id' => 1, 'google_account_id' => 'mock-acc-1',
                'email' => 'jhony@dshow.com.br', 'display_name' => 'Jhony (Dshow)',
                'account_type' => 'workspace', 'organization' => 'Dshow',
                'is_default' => true, 'is_active' => true,
                'connection_status' => 'connected',
                'scopes' => 'calendar.readonly calendar.freebusy',
                'token_expires_at' => $agora->modify('+50 minutes')->format('c'),
                'last_sync_at' => $agora->modify('-2 minutes')->format('c'),
                'last_error_code' => null, 'last_error_message' => null,
                'created_at' => $agora->modify('-30 days')->format('c'),
            ],
            [
                // Cenario §73 "conta desconectada": existe, aparece na lista,
                // mas nao contribui evento — a UI precisa mostrar isso, nao sumir.
                'id' => 2, 'google_account_id' => 'mock-acc-2',
                'email' => 'jhony.pessoal@gmail.com', 'display_name' => 'Jhony (pessoal)',
                'account_type' => 'personal', 'organization' => null,
                'is_default' => false, 'is_active' => true,
                'connection_status' => 'reauth_required',
                'scopes' => 'calendar.readonly',
                'token_expires_at' => $agora->modify('-3 hours')->format('c'),
                'last_sync_at' => $agora->modify('-3 hours')->format('c'),
                'last_error_code' => 'invalid_grant',
                'last_error_message' => 'O acesso foi revogado ou expirou. Reconecte a conta.',
                'created_at' => $agora->modify('-90 days')->format('c'),
            ],
        ];
    }

    private static function calendariosSeed(): array
    {
        // access_role espelha os niveis do Google (§30). `freeBusyReader` existe
        // de proposito: a UI TEM de saber esconder titulo/participantes (§75.1).
        return [
            ['id' => 'primary', 'account_id' => 1, 'summary' => 'Minha Agenda',
             'description' => 'Calendário principal', 'time_zone' => self::TZ,
             'color' => '#60a5fa', 'access_role' => 'owner', 'primary' => true,
             'selected' => true, 'favorite' => true, 'kind' => 'personal', 'owner' => 'Jhony'],

            ['id' => 'comercial@dshow.com.br', 'account_id' => 1, 'summary' => 'Comercial',
             'description' => 'Agenda da equipe comercial', 'time_zone' => self::TZ,
             'color' => '#10B981', 'access_role' => 'writer', 'primary' => false,
             'selected' => true, 'favorite' => true, 'kind' => 'team', 'owner' => 'Marina Costa'],

            ['id' => 'diretoria@dshow.com.br', 'account_id' => 1, 'summary' => 'Diretoria',
             'description' => 'Somente disponibilidade', 'time_zone' => self::TZ,
             'color' => '#a78bfa', 'access_role' => 'freeBusyReader', 'primary' => false,
             'selected' => true, 'favorite' => false, 'kind' => 'team', 'owner' => 'Diretoria'],

            ['id' => 'operacoes@dshow.com.br', 'account_id' => 1, 'summary' => 'Operações',
             'description' => 'Montagens e entregas', 'time_zone' => self::TZ,
             'color' => '#F59E0B', 'access_role' => 'reader', 'primary' => false,
             'selected' => false, 'favorite' => false, 'kind' => 'team', 'owner' => 'Operações'],

            ['id' => 'sala.showroom@dshow.com.br', 'account_id' => 1, 'summary' => 'Showroom',
             'description' => 'Capacidade 20 · Projetor · Térreo', 'time_zone' => self::TZ,
             'color' => '#f87171', 'access_role' => 'writer', 'primary' => false,
             'selected' => false, 'favorite' => false, 'kind' => 'resource',
             'owner' => 'Recepção', 'capacity' => 20, 'resource_location' => 'Térreo'],

            ['id' => 'sala.reuniao1@dshow.com.br', 'account_id' => 1, 'summary' => 'Sala de Reunião 1',
             'description' => 'Capacidade 8 · TV · 2º andar', 'time_zone' => self::TZ,
             'color' => '#f472b6', 'access_role' => 'writer', 'primary' => false,
             'selected' => false, 'favorite' => false, 'kind' => 'resource',
             'owner' => 'Recepção', 'capacity' => 8, 'resource_location' => '2º andar'],

            ['id' => 'feriados@group.v.calendar.google.com', 'account_id' => 1,
             'summary' => 'Feriados no Brasil', 'description' => 'Somente leitura',
             'time_zone' => self::TZ, 'color' => '#9CA3AF', 'access_role' => 'reader',
             'primary' => false, 'selected' => true, 'favorite' => false,
             'kind' => 'holiday', 'owner' => 'Google'],
        ];
    }

    /**
     * Gera a janela de -30 a +45 dias.
     *
     * Determinismo importa: sem Math.random, o mesmo dia produz sempre a mesma
     * agenda. Bug de layout que so aparece "as vezes" e caro de perseguir, e um
     * mock instavel transforma qualquer regressao visual em duvida.
     */
    private static function eventosSeed(string $hoje): array
    {
        $tz  = new \DateTimeZone(self::TZ);
        $d0  = new \DateTimeImmutable($hoje . ' 00:00:00', $tz);
        $ev  = [];
        $id  = 1000;

        $pessoas = [
            ['Ana Ribeiro',    'ana.ribeiro@clientexyz.com.br',  true],
            ['Carlos Menezes', 'carlos@construtorabeta.com',     true],
            ['Marina Costa',   'marina.costa@dshow.com.br',      false],
            ['Rafael Lima',    'rafael.lima@dshow.com.br',       false],
            ['Paula Andrade',  'paula@fornecedorsul.com.br',     true],
            ['João Paulo',     'jp@parceirotech.io',             true],
            ['Beatriz Nunes',  'beatriz.nunes@dshow.com.br',     false],
        ];
        $eu = ['Jhony', 'jhony@dshow.com.br'];

        $mk = function (array $o) use (&$id, $tz, $eu): array {
            $id++;
            $ini = $o['ini'];  $fim = $o['fim'];
            $souOrganizador = $o['organizador'] ?? true;
            $conv = $o['participantes'] ?? [];
            $attendees = [];
            if ($conv) {
                $attendees[] = ['name' => $eu[0], 'email' => $eu[1],
                    'response' => $souOrganizador ? 'accepted' : ($o['minha_resposta'] ?? 'needsAction'),
                    'optional' => false, 'organizer' => $souOrganizador, 'external' => false, 'self' => true];
                foreach ($conv as $p) {
                    $attendees[] = ['name' => $p[0], 'email' => $p[1], 'response' => $p[2],
                        'optional' => $p[3] ?? false, 'organizer' => !$souOrganizador && ($p[4] ?? false),
                        'external' => $p[5] ?? false, 'self' => false];
                }
            }
            $diaInteiro = $o['all_day'] ?? false;
            return [
                'id'                  => 'evt_' . $id,
                'calendar_id'         => $o['cal'] ?? 'primary',
                'ical_uid'            => 'mock-' . $id . '@dshowdash.com.br',
                'recurring_event_id'  => $o['serie'] ?? null,
                'original_start_time' => null,
                'etag'                => '"mock-' . $id . '-1"',
                'sequence'            => 0,
                'status'              => $o['status'] ?? 'confirmed',
                'summary'             => $o['titulo'],
                'description'         => $o['desc'] ?? null,
                'location'            => $o['local'] ?? null,
                'all_day'             => $diaInteiro,
                'start'               => $diaInteiro ? $ini->format('Y-m-d') : $ini->format('c'),
                'end'                 => $diaInteiro ? $fim->format('Y-m-d') : $fim->format('c'),
                'time_zone'           => self::TZ,
                'transparency'        => $o['transp'] ?? 'opaque',
                'visibility'          => $o['visib'] ?? 'default',
                'event_type'          => $o['tipo'] ?? 'default',
                'organizer'           => $souOrganizador
                    ? ['name' => $eu[0], 'email' => $eu[1], 'self' => true]
                    : ['name' => $o['org'][0] ?? 'Externo', 'email' => $o['org'][1] ?? 'externo@exemplo.com', 'self' => false],
                'attendees'           => $attendees,
                'conference'          => $o['meet'] ?? null,
                'reminders'           => $o['lembretes'] ?? [['method' => 'popup', 'minutes' => 10]],
                'recurrence'          => $o['recorrencia'] ?? null,
                'links'               => $o['vinculos'] ?? [],
                'color'               => $o['cor'] ?? null,
                'is_organizer'        => $souOrganizador,
                'my_response'         => $souOrganizador ? 'accepted' : ($o['minha_resposta'] ?? 'needsAction'),
                'created'             => $ini->modify('-7 days')->format('c'),
                'updated'             => $ini->modify('-2 days')->format('c'),
            ];
        };

        $meet = function (string $codigo): array {
            return ['platform' => 'meet', 'uri' => 'https://meet.google.com/' . $codigo,
                    'code' => $codigo, 'phone' => '+55 11 4560-0000', 'pin' => '123456#'];
        };

        // ── HOJE: dia cheio, com conflito plantado e convite pendente ──────
        $ev[] = $mk(['titulo' => 'Daily Comercial', 'cal' => 'comercial@dshow.com.br',
            'ini' => $d0->setTime(9, 0), 'fim' => $d0->setTime(9, 15),
            'recorrencia' => ['rrule' => 'RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR',
                              'human' => 'Todos os dias úteis'],
            'serie' => 'ser_daily',
            'participantes' => [$pessoas[2] + [3 => false], $pessoas[3], $pessoas[6]],
            'meet' => $meet('abc-defg-hij')]);

        $ev[] = $mk(['titulo' => 'Reunião Comercial — Cliente XYZ',
            'ini' => $d0->setTime(9, 30), 'fim' => $d0->setTime(10, 30),
            'desc' => 'Apresentação da proposta de painéis para o lançamento.',
            'local' => 'Google Meet',
            'participantes' => [
                ['Ana Ribeiro', 'ana.ribeiro@clientexyz.com.br', 'accepted', false, false, true],
                ['Marina Costa', 'marina.costa@dshow.com.br', 'accepted', false, false, false],
                ['Rafael Lima', 'rafael.lima@dshow.com.br', 'needsAction', true, false, false],
            ],
            'meet' => $meet('kxq-mnop-rst'),
            'vinculos' => [
                ['entity_type' => 'pipedrive_deal', 'entity_id' => '4821',
                 'label' => 'Painéis LED — Cliente XYZ', 'relation' => 'reuniao',
                 'extra' => ['valor' => 'R$ 128.400,00', 'etapa' => 'Proposta enviada']],
                ['entity_type' => 'cliente', 'entity_id' => '312',
                 'label' => 'Cliente XYZ Ltda', 'relation' => 'cliente'],
            ]]);

        // Conflito: sobrepoe a reuniao das 10:00 as 10:30.
        $ev[] = $mk(['titulo' => 'Revisão Google Ads',
            'ini' => $d0->setTime(10, 0), 'fim' => $d0->setTime(11, 0),
            'desc' => 'Revisão de campanhas e orçamento do trimestre.',
            'participantes' => [$pessoas[6] + [2 => 'accepted']],
            'meet' => $meet('uvw-xyza-bcd')]);

        $ev[] = $mk(['titulo' => 'Almoço', 'ini' => $d0->setTime(12, 0), 'fim' => $d0->setTime(13, 0),
            'transp' => 'transparent', 'tipo' => 'default', 'cor' => '#b0b7c3']);

        $ev[] = $mk(['titulo' => 'Bloco de foco — proposta Construtora Beta',
            'ini' => $d0->setTime(13, 0), 'fim' => $d0->setTime(15, 0),
            'tipo' => 'focusTime', 'cor' => '#c4b5fd',
            'desc' => 'Recusa automática de convites durante o bloco.']);

        // Convite PENDENTE (§44): nao sou organizador e ainda nao respondi.
        $ev[] = $mk(['titulo' => 'Reunião com fornecedor — Fornecedor Sul',
            'ini' => $d0->setTime(14, 0), 'fim' => $d0->setTime(15, 0),
            'organizador' => false, 'org' => ['Paula Andrade', 'paula@fornecedorsul.com.br'],
            'minha_resposta' => 'needsAction',
            'local' => 'Showroom',
            'participantes' => [
                ['Paula Andrade', 'paula@fornecedorsul.com.br', 'accepted', false, true, true],
                ['Rafael Lima', 'rafael.lima@dshow.com.br', 'tentative', false, false, false],
            ],
            'vinculos' => [['entity_type' => 'fornecedor', 'entity_id' => '77',
                            'label' => 'Fornecedor Sul', 'relation' => 'fornecedor']]]);

        $ev[] = $mk(['titulo' => 'Reserva — Showroom', 'cal' => 'sala.showroom@dshow.com.br',
            'ini' => $d0->setTime(14, 0), 'fim' => $d0->setTime(15, 0),
            'desc' => 'Reservado para a reunião com Fornecedor Sul.']);

        $ev[] = $mk(['titulo' => 'Follow-up — Construtora Beta',
            'ini' => $d0->setTime(16, 30), 'fim' => $d0->setTime(17, 0),
            'organizador' => false, 'org' => ['Carlos Menezes', 'carlos@construtorabeta.com'],
            'minha_resposta' => 'tentative',
            'participantes' => [
                ['Carlos Menezes', 'carlos@construtorabeta.com', 'accepted', false, true, true],
            ],
            'meet' => $meet('efg-hijk-lmn'),
            'vinculos' => [['entity_type' => 'pipedrive_deal', 'entity_id' => '4790',
                            'label' => 'Estruturas — Construtora Beta', 'relation' => 'reuniao',
                            'extra' => ['valor' => 'R$ 76.900,00', 'etapa' => 'Negociação']]]]);

        // Evento privado de calendario freeBusyReader: a API devolve o bloco,
        // mas SEM titulo/participantes. A UI tem de aguentar isso (§75.1).
        $ev[] = $mk(['titulo' => 'Ocupado', 'cal' => 'diretoria@dshow.com.br',
            'ini' => $d0->setTime(11, 0), 'fim' => $d0->setTime(12, 0),
            'visib' => 'private']);

        // ── AMANHA e resto da semana ───────────────────────────────────────
        // $util conta DIAS UTEIS. Ancorar cenario em $d (dia corrido) faz o
        // caso sumir quando aquele dia cai no fim de semana — o `continue`
        // abaixo pula antes de chegar no if. Aconteceu com o evento "fora do
        // expediente": a suite passava numa quarta e falhava numa quinta.
        $util = 0;
        for ($d = 1; $d <= 45; $d++) {
            $dia = $d0->modify("+{$d} days");
            $dow = (int)$dia->format('N');   // 1=seg ... 7=dom
            if ($dow >= 6) {
                if ($d === 6) {
                    $ev[] = $mk(['titulo' => 'Feira do Setor — São Paulo', 'cal' => 'feriados@group.v.calendar.google.com',
                        'ini' => $dia, 'fim' => $dia->modify('+1 day'), 'all_day' => true,
                        'transp' => 'transparent', 'cor' => '#b0b7c3']);
                }
                continue;
            }
            $util++;

            // Recorrente: daily comercial em todo dia util.
            $ev[] = $mk(['titulo' => 'Daily Comercial', 'cal' => 'comercial@dshow.com.br',
                'ini' => $dia->setTime(9, 0), 'fim' => $dia->setTime(9, 15),
                'recorrencia' => ['rrule' => 'RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR',
                                  'human' => 'Todos os dias úteis'],
                'serie' => 'ser_daily',
                'participantes' => [$pessoas[2], $pessoas[3], $pessoas[6]],
                'meet' => $meet('abc-defg-hij')]);

            // Terca e quinta: comite quinzenal.
            if (($dow === 2 || $dow === 4) && $d % 14 < 7) {
                $ev[] = $mk(['titulo' => 'Comitê de Projetos',
                    'ini' => $dia->setTime(11, 0), 'fim' => $dia->setTime(12, 0),
                    'recorrencia' => ['rrule' => 'RRULE:FREQ=WEEKLY;INTERVAL=2;BYDAY=TU,TH',
                                      'human' => 'A cada 2 semanas, às terças e quintas'],
                    'serie' => 'ser_comite',
                    'participantes' => [$pessoas[2], $pessoas[3], $pessoas[6]],
                    'meet' => $meet('cmt-proj-001')]);
            }

            // Reuniao com cliente 2x por semana.
            if ($dow === 3 || $dow === 5) {
                $p = $pessoas[$d % 2 === 0 ? 0 : 1];
                $ev[] = $mk(['titulo' => 'Reunião — ' . explode(' ', $p[0])[0] . ' (' . (explode('@', $p[1])[1]) . ')',
                    'ini' => $dia->setTime(15, 0), 'fim' => $dia->setTime(16, 0),
                    'participantes' => [[$p[0], $p[1], $d % 3 === 0 ? 'needsAction' : 'accepted', false, false, true]],
                    'meet' => $meet('cli-' . str_pad((string)$d, 3, '0', STR_PAD_LEFT) . '-xyz'),
                    'vinculos' => [['entity_type' => 'pipedrive_deal', 'entity_id' => (string)(4600 + $d),
                                    'label' => 'Negócio #' . (4600 + $d), 'relation' => 'reuniao']]]);
            }

            // Fora do escritorio: uma viagem de 2 dias daqui a ~3 semanas.
            if ($d === 21 || $d === 22) {
                $ev[] = $mk(['titulo' => 'Fora do escritório — visita técnica',
                    'ini' => $dia, 'fim' => $dia->modify('+1 day'), 'all_day' => true,
                    'tipo' => 'outOfOffice', 'cor' => '#F59E0B',
                    'desc' => 'Recusando automaticamente novas reuniões.']);
            }

            // Local de trabalho: home as segundas.
            if ($dow === 1) {
                $ev[] = $mk(['titulo' => 'Home office', 'ini' => $dia, 'fim' => $dia->modify('+1 day'),
                    'all_day' => true, 'tipo' => 'workingLocation', 'transp' => 'transparent',
                    'cor' => '#6ee7b7']);
            }

            // Um evento cancelado, para a UI ter o estado (§59).
            if ($util === 3) {
                $ev[] = $mk(['titulo' => 'Alinhamento de campanha (cancelado)',
                    'ini' => $dia->setTime(10, 0), 'fim' => $dia->setTime(10, 30),
                    'status' => 'cancelled',
                    'organizador' => false, 'org' => ['Marina Costa', 'marina.costa@dshow.com.br'],
                    'minha_resposta' => 'accepted',
                    'participantes' => [['Marina Costa', 'marina.costa@dshow.com.br', 'accepted', false, true, false]]]);
            }

            // Participante em outro fuso (§47.2) — reuniao cedo com Shenzhen.
            if ($util === 4 || $util === 14) {
                $ev[] = $mk(['titulo' => 'Call fábrica — Shenzhen',
                    'ini' => $dia->setTime(8, 0), 'fim' => $dia->setTime(9, 0),
                    'desc' => 'Participantes em Asia/Shanghai (差 11h no horário de verão local).',
                    'participantes' => [['Li Wei', 'li.wei@factory.cn', 'accepted', false, false, true]],
                    'meet' => $meet('shz-' . $util . '-call')]);
            }

            // Conflito plantado tambem daqui a uma semana.
            if ($util === 6) {
                $ev[] = $mk(['titulo' => 'Treinamento interno',
                    'ini' => $dia->setTime(15, 30), 'fim' => $dia->setTime(16, 30),
                    'participantes' => [$pessoas[3], $pessoas[6]]]);
            }

            // Reuniao fora do expediente (alerta §62.2).
            if ($util === 8) {
                $ev[] = $mk(['titulo' => 'Call com investidor (fora do expediente)',
                    'ini' => $dia->setTime(20, 0), 'fim' => $dia->setTime(21, 0),
                    'participantes' => [$pessoas[5]],
                    'meet' => $meet('inv-late-001')]);
            }
        }

        // ── PASSADO: 30 dias, para relatorios e carga terem serie ──────────
        // Mesmo cuidado do loop do futuro: cenario ancorado em dia CORRIDO some
        // quando cai no fim de semana. Escolhi $d=5 e 19 numa quinta e ambos
        // cairam em sabado — o relatorio de cancelamentos ficou vazio e a suite
        // CLI nao pegou (la a data e outra). Contador de dias uteis resolve.
        $utilPassado = 0;
        for ($d = 30; $d >= 1; $d--) {
            $dia = $d0->modify("-{$d} days");
            $dow = (int)$dia->format('N');
            if ($dow >= 6) continue;
            $utilPassado++;
            $ev[] = $mk(['titulo' => 'Daily Comercial', 'cal' => 'comercial@dshow.com.br',
                'ini' => $dia->setTime(9, 0), 'fim' => $dia->setTime(9, 15),
                'serie' => 'ser_daily',
                'participantes' => [$pessoas[2], $pessoas[3]]]);
            if ($dow === 2 || $dow === 4) {
                $ev[] = $mk(['titulo' => 'Reunião de acompanhamento',
                    'ini' => $dia->setTime(14, 0), 'fim' => $dia->setTime(15, 0),
                    'participantes' => [$pessoas[$d % 7]]]);
            }
            // Cancelado e recusado no passado: o relatorio de cancelamentos e
            // RETROSPECTIVO, entao um cenario so no futuro o deixaria sempre vazio.
            if ($utilPassado === 4 || $utilPassado === 14) {
                $ev[] = $mk(['titulo' => 'Alinhamento semanal (cancelado)',
                    'ini' => $dia->setTime(11, 0), 'fim' => $dia->setTime(11, 30),
                    'status' => 'cancelled',
                    'organizador' => false, 'org' => ['Marina Costa', 'marina.costa@dshow.com.br'],
                    'minha_resposta' => 'accepted',
                    'participantes' => [['Marina Costa', 'marina.costa@dshow.com.br', 'accepted', false, true, false]]]);
            }
            if ($utilPassado === 9) {
                $ev[] = $mk(['titulo' => 'Convite recusado — evento paralelo',
                    'ini' => $dia->setTime(16, 0), 'fim' => $dia->setTime(17, 0),
                    'organizador' => false, 'org' => ['João Paulo', 'jp@parceirotech.io'],
                    'minha_resposta' => 'declined',
                    'participantes' => [['João Paulo', 'jp@parceirotech.io', 'accepted', false, true, true]]]);
            }
            if ($dow === 3) {
                $ev[] = $mk(['titulo' => 'Reunião com cliente',
                    'ini' => $dia->setTime(10, 0), 'fim' => $dia->setTime(11, 0),
                    'participantes' => [[$pessoas[0][0], $pessoas[0][1], 'accepted', false, false, true]],
                    'vinculos' => [['entity_type' => 'pipedrive_deal', 'entity_id' => (string)(4400 + $d),
                                    'label' => 'Negócio #' . (4400 + $d), 'relation' => 'reuniao']]]);
            }
        }

        return $ev;
    }

    private static function syncSeed(): array
    {
        $agora = new \DateTimeImmutable('now', new \DateTimeZone('UTC'));
        $mk = function (string $cal, string $status, int $minAtras, int $proc, int $err = 0) use ($agora): array {
            return [
                'calendar_id' => $cal, 'status' => $status,
                'last_sync_at' => $agora->modify("-{$minAtras} minutes")->format('c'),
                'next_sync_at' => $agora->modify('+' . max(1, 15 - $minAtras) . ' minutes')->format('c'),
                'duration_ms' => 400 + ($proc * 3),
                'processed' => $proc, 'created' => intdiv($proc, 8),
                'updated' => intdiv($proc, 4), 'deleted' => intdiv($proc, 20),
                'errors' => $err,
                'sync_token' => '********',           // mascarado sempre (§78)
                'channel_id' => 'ch-' . substr(md5($cal), 0, 12),
                'channel_expires_at' => $agora->modify('+6 days')->format('c'),
                'attempt' => $err > 0 ? 3 : 1,
            ];
        };
        return [
            $mk('primary', 'ok', 2, 48),
            $mk('comercial@dshow.com.br', 'ok', 4, 96),
            $mk('diretoria@dshow.com.br', 'ok', 6, 12),
            $mk('operacoes@dshow.com.br', 'stale', 190, 0),      // atrasada (§62.3)
            $mk('sala.showroom@dshow.com.br', 'ok', 7, 8),
            $mk('sala.reuniao1@dshow.com.br', 'ok', 7, 5),
            $mk('feriados@group.v.calendar.google.com', 'ok', 60, 2),
        ];
    }

    // ═══════════════════════════════════════════════════════════════════
    // LEITURA
    // ═══════════════════════════════════════════════════════════════════

    public function status(): array
    {
        $st = &self::state();
        $contas = $st['contas'];
        $problemas = array_values(array_filter($contas, fn($c) => $c['connection_status'] !== 'connected'));
        $atrasadas = array_values(array_filter($st['sync'], fn($s) => $s['status'] !== 'ok'));

        return [
            'provider'   => 'mock',
            'mock'       => true,
            'configured' => true,
            'connected'  => count($contas) > 0,
            'accounts'   => count($contas),
            'accounts_with_problem' => count($problemas),
            'calendars'  => count($st['calendarios']),
            'scopes'     => ['calendar.readonly', 'calendar.freebusy'],
            'oauth_stage' => 'read',
            'last_sync_at' => $st['sync'][0]['last_sync_at'] ?? null,
            'stale_calendars' => count($atrasadas),
            'message'    => 'Ambiente de demonstração — os compromissos exibidos são simulados.',
        ];
    }

    public function contas(): array
    {
        $st = &self::state();
        // Nunca devolve token: a semente ja nao guarda, mas o scrub e a rede.
        return array_map(fn($c) => GcalCrypto::scrub($c), $st['contas']);
    }

    public function calendarios(): array
    {
        $st = &self::state();
        return $st['calendarios'];
    }

    public function eventos(array $f): array
    {
        $st  = &self::state();
        $tz  = Tz::normalizar($f['tz'] ?? self::TZ);
        [$de, $ate] = Tz::janela($f['de'], $f['ate'], $tz);
        $cals = $f['calendars'] ?? null;
        $q    = isset($f['q']) ? mb_strtolower((string)$f['q']) : null;
        $mapa = $this->mapaCalendarios();

        $out = [];
        foreach ($st['eventos'] as $e) {
            if ($cals && !in_array($e['calendar_id'], $cals, true)) continue;
            if (!isset($mapa[$e['calendar_id']])) continue;

            [$ei, $ef] = $this->instantes($e, $tz);
            if ($ef <= $de || $ei >= $ate) continue;

            if ($q !== null) {
                $alvo = mb_strtolower(($e['summary'] ?? '') . ' ' . ($e['description'] ?? '')
                      . ' ' . ($e['location'] ?? '') . ' '
                      . implode(' ', array_column($e['attendees'] ?? [], 'email')));
                if (!str_contains($alvo, $q)) continue;
            }
            if (!empty($f['tipo']) && ($e['event_type'] ?? 'default') !== $f['tipo']) continue;
            if (!empty($f['resposta']) && ($e['my_response'] ?? null) !== $f['resposta']) continue;
            // Cancelado nao some do banco (§59): some da grade, salvo quando pedido.
            if (($e['status'] ?? '') === 'cancelled' && empty($f['incluir_cancelados'])) continue;

            $e = $this->aplicarPrivacidade($e, $mapa[$e['calendar_id']]);
            $e['calendar_color']   = $mapa[$e['calendar_id']]['color'];
            $e['calendar_summary'] = $mapa[$e['calendar_id']]['summary'];
            $e['duration_min']     = intdiv($ef->getTimestamp() - $ei->getTimestamp(), 60);
            $out[] = $e;
        }

        usort($out, fn($a, $b) => strcmp((string)$a['start'], (string)$b['start']));

        // Marca conflito no proprio item: a grade precisa disso sem 2ª chamada.
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
        $st = &self::state();
        $mapa = $this->mapaCalendarios();
        foreach ($st['eventos'] as $e) {
            if ($e['id'] === $eventId && $e['calendar_id'] === $calendarId) {
                if (!isset($mapa[$calendarId])) return null;
                $e = $this->aplicarPrivacidade($e, $mapa[$calendarId]);
                $e['calendar_color']   = $mapa[$calendarId]['color'];
                $e['calendar_summary'] = $mapa[$calendarId]['summary'];
                return $e;
            }
        }
        return null;
    }

    // ═══════════════════════════════════════════════════════════════════
    // ESCRITA (persiste na sessao)
    // ═══════════════════════════════════════════════════════════════════

    public function criarEvento(array $p): array
    {
        $st = &self::state();
        $cal = (string)($p['calendar_id'] ?? 'primary');
        $mapa = $this->mapaCalendarios();
        if (!isset($mapa[$cal])) {
            throw new InvalidArgumentException('Calendário inexistente.');
        }
        if (in_array($mapa[$cal]['access_role'], ['reader', 'freeBusyReader'], true)) {
            throw new RuntimeException('Sem permissão de escrita neste calendário.');
        }

        $st['proximo_id']++;
        $id = 'evt_' . $st['proximo_id'];
        $agora = (new \DateTimeImmutable('now', new \DateTimeZone('UTC')))->format('c');

        $novo = [
            'id' => $id, 'calendar_id' => $cal,
            'ical_uid' => 'mock-' . $st['proximo_id'] . '@dshowdash.com.br',
            'recurring_event_id' => null, 'original_start_time' => null,
            'etag' => '"mock-' . $st['proximo_id'] . '-1"', 'sequence' => 0,
            'status' => 'confirmed',
            'summary' => (string)($p['summary'] ?? '(sem título)'),
            'description' => $p['description'] ?? null,
            'location' => $p['location'] ?? null,
            'all_day' => (bool)($p['all_day'] ?? false),
            'start' => (string)$p['start'], 'end' => (string)$p['end'],
            'time_zone' => Tz::normalizar($p['time_zone'] ?? self::TZ),
            'transparency' => $p['transparency'] ?? 'opaque',
            'visibility' => $p['visibility'] ?? 'default',
            'event_type' => $p['event_type'] ?? 'default',
            'organizer' => ['name' => 'Jhony', 'email' => 'jhony@dshow.com.br', 'self' => true],
            'attendees' => $p['attendees'] ?? [],
            'conference' => $p['conference'] ?? null,
            'reminders' => $p['reminders'] ?? [['method' => 'popup', 'minutes' => 10]],
            'recurrence' => $p['recurrence'] ?? null,
            'links' => $p['links'] ?? [],
            'color' => $p['color'] ?? null,
            'is_organizer' => true, 'my_response' => 'accepted',
            'created' => $agora, 'updated' => $agora,
        ];
        $st['eventos'][] = $novo;
        return $novo;
    }

    public function atualizarEvento(string $calendarId, string $eventId, array $p, string $escopo = 'this'): array
    {
        $st = &self::state();
        $mapa = $this->mapaCalendarios();
        $alvo = null; $serie = null;

        foreach ($st['eventos'] as $i => $e) {
            if ($e['id'] === $eventId && $e['calendar_id'] === $calendarId) { $alvo = $i; $serie = $e['recurring_event_id']; break; }
        }
        if ($alvo === null) {
            throw new RuntimeException('Evento não encontrado.');
        }
        $cal = $mapa[$calendarId] ?? null;
        if ($cal && in_array($cal['access_role'], ['reader', 'freeBusyReader'], true)) {
            throw new RuntimeException('Sem permissão de escrita neste calendário.');
        }

        $campos = ['summary','description','location','start','end','all_day','transparency',
                   'visibility','event_type','attendees','conference','reminders','recurrence',
                   'links','color','calendar_id','time_zone'];

        // `following`/`all` so fazem sentido em serie; fora dela viram `this`.
        $indices = [$alvo];
        if ($serie && $escopo !== 'this') {
            $inicioAlvo = (string)$st['eventos'][$alvo]['start'];
            $indices = [];
            foreach ($st['eventos'] as $i => $e) {
                if ($e['recurring_event_id'] !== $serie) continue;
                if ($escopo === 'all' || (string)$e['start'] >= $inicioAlvo) { $indices[] = $i; }
            }
        }

        $agora = (new \DateTimeImmutable('now', new \DateTimeZone('UTC')))->format('c');
        foreach ($indices as $i) {
            foreach ($campos as $c) {
                if (!array_key_exists($c, $p)) continue;
                // Mover a serie inteira de horario exigiria recalcular cada
                // ocorrencia; no mock so a instancia alvo muda start/end.
                if (in_array($c, ['start', 'end'], true) && $i !== $alvo) continue;
                $st['eventos'][$i][$c] = $p[$c];
            }
            $st['eventos'][$i]['sequence'] = (int)$st['eventos'][$i]['sequence'] + 1;
            $st['eventos'][$i]['etag'] = '"mock-' . $st['eventos'][$i]['id'] . '-' . $st['eventos'][$i]['sequence'] . '"';
            $st['eventos'][$i]['updated'] = $agora;
        }
        return $st['eventos'][$alvo];
    }

    public function excluirEvento(string $calendarId, string $eventId, bool $notificar, string $escopo = 'this'): void
    {
        $st = &self::state();
        $serie = null;
        foreach ($st['eventos'] as $e) {
            if ($e['id'] === $eventId && $e['calendar_id'] === $calendarId) { $serie = $e['recurring_event_id']; break; }
        }
        $st['eventos'] = array_values(array_filter($st['eventos'], function ($e) use ($eventId, $calendarId, $serie, $escopo) {
            if ($e['calendar_id'] !== $calendarId) return true;
            if ($escopo === 'all' && $serie && $e['recurring_event_id'] === $serie) return false;
            return $e['id'] !== $eventId;
        }));
        // $notificar so muda o que o Google enviaria; no mock fica no log.
        error_log('[gcal:mock] evento removido ' . $eventId . ' notificar=' . ($notificar ? '1' : '0'));
    }

    public function responderConvite(string $calendarId, string $eventId, string $resposta, ?string $comentario): array
    {
        $validas = ['accepted', 'declined', 'tentative'];
        if (!in_array($resposta, $validas, true)) {
            throw new InvalidArgumentException('Resposta inválida.');
        }
        $st = &self::state();
        foreach ($st['eventos'] as $i => $e) {
            if ($e['id'] !== $eventId || $e['calendar_id'] !== $calendarId) continue;
            $st['eventos'][$i]['my_response'] = $resposta;
            foreach (($st['eventos'][$i]['attendees'] ?? []) as $j => $a) {
                if (!empty($a['self'])) { $st['eventos'][$i]['attendees'][$j]['response'] = $resposta; }
            }
            if ($comentario !== null && $comentario !== '') {
                $st['eventos'][$i]['response_comment'] = mb_substr($comentario, 0, 500);
            }
            $st['eventos'][$i]['updated'] = (new \DateTimeImmutable('now', new \DateTimeZone('UTC')))->format('c');
            return $st['eventos'][$i];
        }
        throw new RuntimeException('Convite não encontrado.');
    }

    // ═══════════════════════════════════════════════════════════════════
    // DERIVADOS (computados dos eventos — nunca fixos)
    // ═══════════════════════════════════════════════════════════════════

    // `conflitos()` vem da base: e derivado de `eventos()`, entao mock e banco
    // tem de acusar os mesmos conflitos.

    public function sincronizacao(): array
    {
        $st = &self::state();
        return $st['sync'];
    }

    // ═══════════════════════════════════════════════════════════════════
    // VINCULOS INTERNOS (§32, §57)
    // ═══════════════════════════════════════════════════════════════════

    /**
     * O vinculo mora no EVENTO (aqui, na sessao do mock); a ENTIDADE vem do
     * Pipedrive/Koala reais. Na Fase 4 isto vira uma linha em
     * `gcal_event_links` e a busca continua exatamente igual.
     */
    public function vincular(string $calendarId, string $eventId, array $link): array
    {
        $st = &self::state();
        foreach ($st['eventos'] as $i => $e) {
            if ($e['id'] !== $eventId || $e['calendar_id'] !== $calendarId) continue;
            $links = $st['eventos'][$i]['links'] ?? [];
            // Idempotente: vincular duas vezes atualiza, nao duplica.
            foreach ($links as $k => $l) {
                if ($l['entity_type'] === $link['entity_type'] && $l['entity_id'] === $link['entity_id']) {
                    $links[$k] = $link;
                    $st['eventos'][$i]['links'] = array_values($links);
                    return $st['eventos'][$i];
                }
            }
            $links[] = $link;
            $st['eventos'][$i]['links'] = array_values($links);
            $st['eventos'][$i]['updated'] = (new \DateTimeImmutable('now', new \DateTimeZone('UTC')))->format('c');
            return $st['eventos'][$i];
        }
        throw new RuntimeException('Evento nao encontrado.');
    }

    public function desvincular(string $calendarId, string $eventId, string $tipo, string $id): array
    {
        $st = &self::state();
        foreach ($st['eventos'] as $i => $e) {
            if ($e['id'] !== $eventId || $e['calendar_id'] !== $calendarId) continue;
            $st['eventos'][$i]['links'] = array_values(array_filter(
                $st['eventos'][$i]['links'] ?? [],
                static fn($l) => !($l['entity_type'] === $tipo && $l['entity_id'] === $id)
            ));
            return $st['eventos'][$i];
        }
        throw new RuntimeException('Evento nao encontrado.');
    }

    // ═══════════════════════════════════════════════════════════════════
    // RELATORIOS (§64) e VISUALIZACOES (§40, §65)
    // ═══════════════════════════════════════════════════════════════════


}
