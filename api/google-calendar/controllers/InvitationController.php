<?php
// Google Calendar / InvitationController - central de convites (§44)
// @version 1.0.0  @created 2026-07-29
declare(strict_types=1);

final class GcalInvitationController
{
    /** GET /invitations?de=&ate=&tz=&categoria=aguardando|aceitos|recusados|talvez|cancelados */
    public static function listar(GcalProvider $p): void
    {
        $f = gcal_filtros();
        $itens = $p->convites($f);

        // Contagem por categoria SEM o filtro aplicado: as abas precisam do
        // total de cada uma, senao a aba selecionada zera as outras.
        $todos = $p->convites(['de' => $f['de'], 'ate' => $f['ate'], 'tz' => $f['tz']]);
        $porCategoria = [];
        foreach ($todos as $c) {
            $porCategoria[$c['categoria']] = ($porCategoria[$c['categoria']] ?? 0) + 1;
        }

        ApiResponse::success(
            ['convites' => $itens, 'por_categoria' => $porCategoria, 'time_zone' => $f['tz']],
            ['total' => count($itens)]
        );
    }

    /** POST /invitations/{calendarId}/{eventId}/respond  body: {resposta, comentario?} */
    public static function responder(GcalProvider $p, string $calendarId, string $eventId): void
    {
        $body = gcal_body();
        $resposta = (string)($body['resposta'] ?? '');
        $comentario = isset($body['comentario']) ? (string)$body['comentario'] : null;

        try {
            $e = $p->responderConvite($calendarId, $eventId, $resposta, $comentario);
            ApiResponse::success($e);
        } catch (InvalidArgumentException $ex) {
            ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 422, [
                'message' => 'Resposta deve ser accepted, declined ou tentative.',
            ]);
        } catch (RuntimeException $ex) {
            ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404, ['message' => $ex->getMessage()]);
        }
    }
}
