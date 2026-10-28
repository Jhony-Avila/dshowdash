<?php
// Google Calendar / GoogleCalendarClient - chamadas a Google Calendar API v3
// @module google-calendar.client
// @version 1.0.0
// @created 2026-07-30
// @app Google Calendar
//
// REST puro sobre o transporte injetavel (GcalTransport). Sem SDK: o projeto
// nao tem composer nem vendor/, e o GraphOAuth do Outlook ja provou que o fluxo
// inteiro cabe em poucas centenas de linhas.
//
// O que este arquivo NAO faz: decidir quando sincronizar (isso e o servico) nem
// persistir (isso e o repositorio). Ele so fala com o Google e devolve dado
// normalizado.
declare(strict_types=1);

final class GcalApiException extends RuntimeException
{
    public function __construct(string $msg, public readonly string $motivo = '',
                                public readonly int $status = 0)
    { parent::__construct($msg); }
}

/** Sinaliza HTTP 410: o syncToken morreu e exige carga completa (§49.3). */
final class GcalSyncTokenInvalido extends RuntimeException {}

final class GoogleCalendarClient
{
    private const BASE = 'https://www.googleapis.com/calendar/v3';
    /** Teto do Google por página em events.list. */
    private const POR_PAGINA = 250;

    public function __construct(
        private GcalTransport $transporte,
        private string $accessToken,
        /** Chamado quando o access token vence; deve devolver um novo. */
        private $renovar = null
    ) {}

    public function comToken(string $t): self
    {
        $c = clone $this;
        $c->accessToken = $t;
        return $c;
    }

    /**
     * Executa a chamada tratando os erros que o Google realmente devolve.
     *
     * 401 → tenta renovar UMA vez e repete. Renovar em laço mascara credencial
     *       morta e vira tempestade de requisições.
     * 403 rateLimitExceeded / 429 → backoff exponencial COM JITTER. Sem jitter,
     *       todos os calendários da mesma conta voltam juntos e levam 429 de novo.
     * 410 → exceção própria: quem chama decide recarregar; NÃO apaga nada aqui.
     */
    private function chamar(string $metodo, string $caminho, array $query = [],
                            ?array $corpo = null, int $tentativa = 0, bool $jaRenovou = false): array
    {
        $r = $this->transporte->enviar($metodo, self::BASE . $caminho, $query, $corpo, $this->accessToken);

        if ($r->ok()) return $r->corpo;

        $motivo = $r->motivo();

        if ($r->status === 401 && !$jaRenovou && is_callable($this->renovar)) {
            $novo = ($this->renovar)();
            if (is_string($novo) && $novo !== '') {
                $this->accessToken = $novo;
                return $this->chamar($metodo, $caminho, $query, $corpo, $tentativa, true);
            }
        }

        if ($r->status === 410 || $motivo === 'fullSyncRequired') {
            throw new GcalSyncTokenInvalido('syncToken inválido — carga completa necessária');
        }

        $limite = ($r->status === 429)
               || ($r->status === 403 && in_array($motivo, ['rateLimitExceeded', 'userRateLimitExceeded'], true));
        if (($limite || $r->status >= 500 || $r->status === 0) && $tentativa < 4) {
            $espera = (int)((2 ** $tentativa) * 1000) + random_int(0, 400);   // ms, com jitter
            usleep($espera * 1000);
            return $this->chamar($metodo, $caminho, $query, $corpo, $tentativa + 1, $jaRenovou);
        }

        throw new GcalApiException(
            'Google Calendar recusou a chamada (' . $motivo . ')', $motivo, $r->status);
    }

    // ═══════════════════════════════════════════════════════════════════
    // CALENDARIOS
    // ═══════════════════════════════════════════════════════════════════

    /** @return array<int,array> calendários normalizados */
    public function listarCalendarios(): array
    {
        $out = [];
        $pageToken = null;
        do {
            $q = ['maxResults' => 250, 'showHidden' => 'true'];
            if ($pageToken) $q['pageToken'] = $pageToken;
            $d = $this->chamar('GET', '/users/me/calendarList', $q);
            foreach (($d['items'] ?? []) as $c) { $out[] = GcalNormalizer::calendario($c); }
            $pageToken = $d['nextPageToken'] ?? null;
        } while ($pageToken);
        return $out;
    }

    // ═══════════════════════════════════════════════════════════════════
    // EVENTOS
    // ═══════════════════════════════════════════════════════════════════

    /**
     * Lista eventos de um calendário, paginando até o fim.
     *
     * @param ?string $syncToken quando presente, faz o INCREMENTAL
     * @return array{eventos:array,syncToken:?string}
     *
     * ARMADILHA: o Google recusa `syncToken` junto com `timeMin`/`timeMax`/
     * `orderBy`. No incremental só vão o token e os flags de conteúdo.
     */
    public function listarEventos(string $calendarId, array $opts = []): array
    {
        $sync = $opts['syncToken'] ?? null;
        $eventos = [];
        $pageToken = null;
        $novoSync = null;

        do {
            $q = ['maxResults' => self::POR_PAGINA, 'showDeleted' => 'true', 'singleEvents' => 'false'];
            if ($sync) {
                $q['syncToken'] = $sync;
            } else {
                if (!empty($opts['timeMin'])) $q['timeMin'] = $opts['timeMin'];
                if (!empty($opts['timeMax'])) $q['timeMax'] = $opts['timeMax'];
            }
            if ($pageToken) $q['pageToken'] = $pageToken;

            $d = $this->chamar('GET', '/calendars/' . rawurlencode($calendarId) . '/events', $q);
            foreach (($d['items'] ?? []) as $e) {
                $eventos[] = GcalNormalizer::evento($e, $calendarId);
            }
            $pageToken = $d['nextPageToken'] ?? null;
            // nextSyncToken só vem na ÚLTIMA página. Guardar o de uma página do
            // meio faria o próximo incremental pular eventos em silêncio.
            if (!$pageToken) $novoSync = $d['nextSyncToken'] ?? null;
        } while ($pageToken);

        return ['eventos' => $eventos, 'syncToken' => $novoSync];
    }

    public function obterEvento(string $calendarId, string $eventId): array
    {
        $d = $this->chamar('GET', '/calendars/' . rawurlencode($calendarId)
                                . '/events/' . rawurlencode($eventId));
        return GcalNormalizer::evento($d, $calendarId);
    }

    public function criarEvento(string $calendarId, array $payload, bool $notificar = false): array
    {
        $d = $this->chamar('POST', '/calendars/' . rawurlencode($calendarId) . '/events',
            ['sendUpdates' => $notificar ? 'all' : 'none'],
            GcalNormalizer::paraGoogle($payload));
        return GcalNormalizer::evento($d, $calendarId);
    }

    public function atualizarEvento(string $calendarId, string $eventId, array $payload,
                                    bool $notificar = false): array
    {
        $d = $this->chamar('PATCH',
            '/calendars/' . rawurlencode($calendarId) . '/events/' . rawurlencode($eventId),
            ['sendUpdates' => $notificar ? 'all' : 'none'],
            GcalNormalizer::paraGoogle($payload));
        return GcalNormalizer::evento($d, $calendarId);
    }

    /** §59: quem cancela decide se o participante é avisado. */
    public function excluirEvento(string $calendarId, string $eventId, bool $notificar = false): void
    {
        $this->chamar('DELETE',
            '/calendars/' . rawurlencode($calendarId) . '/events/' . rawurlencode($eventId),
            ['sendUpdates' => $notificar ? 'all' : 'none']);
    }

    /** Responde a um convite alterando SÓ o próprio attendee. */
    public function responderConvite(string $calendarId, string $eventId, string $email,
                                     string $resposta, ?string $comentario = null): array
    {
        $atual = $this->chamar('GET',
            '/calendars/' . rawurlencode($calendarId) . '/events/' . rawurlencode($eventId));

        $attendees = $atual['attendees'] ?? [];
        $achou = false;
        foreach ($attendees as $i => $a) {
            if (strcasecmp((string)($a['email'] ?? ''), $email) === 0) {
                $attendees[$i]['responseStatus'] = $resposta;
                if ($comentario !== null && $comentario !== '') {
                    $attendees[$i]['comment'] = mb_substr($comentario, 0, 480);
                }
                $achou = true;
            }
        }
        if (!$achou) {
            throw new GcalApiException('Você não está na lista de participantes deste evento.',
                'notAttendee', 400);
        }

        $d = $this->chamar('PATCH',
            '/calendars/' . rawurlencode($calendarId) . '/events/' . rawurlencode($eventId),
            ['sendUpdates' => 'all'], ['attendees' => $attendees]);
        return GcalNormalizer::evento($d, $calendarId);
    }

    // ═══════════════════════════════════════════════════════════════════
    // DISPONIBILIDADE (§22)
    // ═══════════════════════════════════════════════════════════════════

    /**
     * @param array<int,string> $ids e-mails ou ids de calendário
     * @return array<string,array<int,array{inicio:string,fim:string}>>
     */
    public function freeBusy(string $timeMinIso, string $timeMaxIso, array $ids, string $tz): array
    {
        // O Google aceita no máximo 50 por chamada.
        $ids = array_slice(array_values(array_unique($ids)), 0, 50);
        $d = $this->chamar('POST', '/freeBusy', [], [
            'timeMin' => $timeMinIso, 'timeMax' => $timeMaxIso, 'timeZone' => $tz,
            'items' => array_map(static fn($i) => ['id' => $i], $ids),
        ]);

        $out = [];
        foreach (($d['calendars'] ?? []) as $id => $c) {
            // `errors` aqui é NORMAL: significa que não há permissão para ver
            // aquele calendário. Vira lista vazia, e quem chama sinaliza na UI —
            // fingir "livre" seria pior do que dizer "não sei".
            $out[$id] = [
                'ocupado' => array_map(
                    static fn($b) => ['inicio' => $b['start'], 'fim' => $b['end']],
                    $c['busy'] ?? []),
                'erro' => isset($c['errors'][0]['reason']) ? (string)$c['errors'][0]['reason'] : null,
            ];
        }
        return $out;
    }

    // ═══════════════════════════════════════════════════════════════════
    // CANAIS PUSH (§50) — usados na Fase 5
    // ═══════════════════════════════════════════════════════════════════

    public function abrirCanal(string $calendarId, string $channelId, string $endereco,
                               string $token): array
    {
        return $this->chamar('POST',
            '/calendars/' . rawurlencode($calendarId) . '/events/watch', [], [
                'id' => $channelId, 'type' => 'web_hook',
                'address' => $endereco, 'token' => $token,
            ]);
    }

    public function fecharCanal(string $channelId, string $resourceId): void
    {
        // channels.stop não fica sob /calendars.
        $this->transporte->enviar('POST', 'https://www.googleapis.com/calendar/v3/channels/stop',
            [], ['id' => $channelId, 'resourceId' => $resourceId], $this->accessToken);
    }

    /** Perfil da conta — usado no callback para saber QUEM conectou. */
    public function perfil(): array
    {
        $r = $this->transporte->enviar('GET', 'https://www.googleapis.com/oauth2/v3/userinfo',
            [], null, $this->accessToken);
        if (!$r->ok()) {
            throw new GcalApiException('Não foi possível ler o perfil da conta Google',
                $r->motivo(), $r->status);
        }
        return [
            'google_account_id' => (string)($r->corpo['sub'] ?? ''),
            'email'             => (string)($r->corpo['email'] ?? ''),
            'display_name'      => $r->corpo['name'] ?? null,
            'organization'      => $r->corpo['hd'] ?? null,
            // `hd` (hosted domain) só existe em conta Workspace — é o jeito
            // oficial de distinguir corporativa de pessoal.
            'account_type'      => !empty($r->corpo['hd']) ? 'workspace' : 'personal',
        ];
    }
}
