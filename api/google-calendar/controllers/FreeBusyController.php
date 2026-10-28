<?php
// Google Calendar / FreeBusyController - disponibilidade e melhores horarios (§22)
// @version 1.0.0  @created 2026-07-29
declare(strict_types=1);

final class GcalFreeBusyController
{
    /** GET /freebusy?de=&ate=&tz=&pessoas=a@x,b@y&duracao=60 */
    public static function consultar(GcalProvider $p): void
    {
        $f = gcal_filtros();
        $pessoas = gcal_qstr('pessoas', 1000);
        $lista = $pessoas === null
            ? ['jhony@dshow.com.br']
            : array_values(array_filter(array_map('trim', explode(',', $pessoas))));

        if (count($lista) > 20) {
            ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 422, [
                'message' => 'Consulte no máximo 20 participantes por vez.',
            ]);
        }
        ApiResponse::success($p->freeBusy([
            'de' => $f['de'], 'ate' => $f['ate'], 'tz' => $f['tz'],
            'pessoas' => $lista,
            'duracao_min' => gcal_qint('duracao', 60, 15, 480),
            'expediente_inicio' => gcal_qint('exp_ini', 9, 0, 23),
            'expediente_fim' => gcal_qint('exp_fim', 18, 1, 24),
            'evitar_almoco' => gcal_qstr('almoco', 5) !== '0',
        ]));
    }
}
