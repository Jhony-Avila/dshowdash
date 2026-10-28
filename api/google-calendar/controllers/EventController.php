<?php
// Google Calendar / EventController - CRUD de eventos (§17, §19, §59, §60)
// @version 1.0.0  @created 2026-07-29
declare(strict_types=1);

final class GcalEventController
{
    /** GET /events?de=&ate=&tz=&calendars=&q=&tipo=&resposta= */
    public static function listar(GcalProvider $p): void
    {
        $f = gcal_filtros();
        $itens = $p->eventos($f);
        ApiResponse::success(
            ['eventos' => $itens, 'time_zone' => $f['tz']],
            ['total' => count($itens), 'de' => $f['de'], 'ate' => $f['ate']]
        );
    }

    /** GET /events/{calendarId}/{eventId} */
    public static function abrir(GcalProvider $p, string $calendarId, string $eventId): void
    {
        $e = $p->evento($calendarId, $eventId);
        if ($e === null) {
            ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404, ['message' => 'Evento não encontrado.']);
        }
        ApiResponse::success($e);
    }

    /** POST /events */
    public static function criar(GcalProvider $p): void
    {
        $body = gcal_body();
        $erros = self::validar($body);
        if ($erros) {
            ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 422,
                ['message' => 'Verifique os campos destacados.', 'campos' => $erros]);
        }
        try {
            ApiResponse::success($p->criarEvento($body), null, 201);
        } catch (InvalidArgumentException $e) {
            ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 422, ['message' => $e->getMessage()]);
        } catch (RuntimeException $e) {
            ApiResponse::error(ApiResponse::ERR_NOT_AUTHORIZED, 403, ['message' => $e->getMessage()]);
        }
    }

    /** PATCH /events/{calendarId}/{eventId}?escopo=this|following|all */
    public static function atualizar(GcalProvider $p, string $calendarId, string $eventId): void
    {
        $body = gcal_body();
        // Validacao parcial: PATCH pode mandar so um campo (arrastar na grade
        // manda apenas start/end).
        if (isset($body['start']) || isset($body['end'])) {
            $erros = self::validarPeriodo($body);
            if ($erros) {
                ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 422,
                    ['message' => 'Período inválido.', 'campos' => $erros]);
            }
        }
        $escopo = self::escopo();
        try {
            ApiResponse::success($p->atualizarEvento($calendarId, $eventId, $body, $escopo));
        } catch (InvalidArgumentException $e) {
            ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 422, ['message' => $e->getMessage()]);
        } catch (RuntimeException $e) {
            ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404, ['message' => $e->getMessage()]);
        }
    }

    /** DELETE /events/{calendarId}/{eventId}?notificar=1&escopo=this */
    public static function excluir(GcalProvider $p, string $calendarId, string $eventId): void
    {
        // §59: quem cancela decide se o participante e avisado. O default e
        // NAO notificar — avisar 20 pessoas por engano nao tem desfazer.
        $notificar = (gcal_qstr('notificar', 5) === '1');
        try {
            $p->excluirEvento($calendarId, $eventId, $notificar, self::escopo());
            ApiResponse::success(['removido' => true, 'notificados' => $notificar]);
        } catch (RuntimeException $e) {
            ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404, ['message' => $e->getMessage()]);
        }
    }

    private static function escopo(): string
    {
        $v = gcal_qstr('escopo', 12) ?? 'this';
        return in_array($v, ['this', 'following', 'all'], true) ? $v : 'this';
    }

    /** Validacoes do §17.3 que dao para checar no servidor. */
    private static function validar(array $b): array
    {
        $erros = [];
        if (trim((string)($b['summary'] ?? '')) === '') {
            $erros['summary'] = 'Informe um título.';
        }
        if (empty($b['start']) || empty($b['end'])) {
            $erros['start'] = 'Informe início e fim.';
        }
        return $erros + self::validarPeriodo($b);
    }

    private static function validarPeriodo(array $b): array
    {
        $erros = [];
        if (empty($b['start']) || empty($b['end'])) return $erros;

        $diaInteiro = !empty($b['all_day']);
        try {
            $i = new \DateTimeImmutable((string)$b['start']);
            $f = new \DateTimeImmutable((string)$b['end']);
        } catch (\Throwable $e) {
            return ['start' => 'Data ou hora em formato inválido.'];
        }
        if ($f <= $i) {
            $erros['end'] = 'O término deve ser posterior ao início.';
        }
        // Dia inteiro nao vira evento de 24h (§48); a duracao maxima abaixo so
        // vale para evento com hora.
        if (!$diaInteiro) {
            $horas = ($f->getTimestamp() - $i->getTimestamp()) / 3600;
            if ($horas > 24) {
                $erros['end'] = 'Duração acima de 24 h. Use um evento de dia inteiro.';
            }
        }
        if (!empty($b['time_zone']) && !Tz::valido((string)$b['time_zone'])) {
            $erros['time_zone'] = 'Fuso horário desconhecido.';
        }
        foreach (($b['attendees'] ?? []) as $k => $a) {
            $mail = (string)($a['email'] ?? '');
            if ($mail === '' || !filter_var($mail, FILTER_VALIDATE_EMAIL)) {
                $erros['attendees'] = 'Participante ' . ($k + 1) . ' está sem e-mail válido.';
                break;
            }
        }
        return $erros;
    }
}
