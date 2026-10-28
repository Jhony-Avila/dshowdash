<?php
// Google Calendar / ConflictController - central de conflitos (§23)
// @version 1.0.0  @created 2026-07-29
declare(strict_types=1);

final class GcalConflictController
{
    /** GET /conflicts?de=&ate=&tz=&severidade=alta|media|baixa */
    public static function listar(GcalProvider $p): void
    {
        $f = gcal_filtros();
        $itens = $p->conflitos($f);
        $porTipo = [];
        foreach ($itens as $c) {
            $porTipo[$c['tipo']] = ($porTipo[$c['tipo']] ?? 0) + 1;
        }
        ApiResponse::success(
            ['conflitos' => $itens, 'por_tipo' => $porTipo, 'time_zone' => $f['tz']],
            ['total' => count($itens)]
        );
    }
}
