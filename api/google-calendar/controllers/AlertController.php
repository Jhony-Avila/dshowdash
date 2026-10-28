<?php
// Google Calendar / AlertController - alertas de agenda, organizacao e tecnicos (§62)
// @version 1.0.0  @created 2026-07-29
declare(strict_types=1);

final class GcalAlertController
{
    /** GET /alerts?categoria=agenda|organizacao|tecnico */
    public static function listar(GcalProvider $p): void
    {
        $f = gcal_filtros();
        $itens = $p->alertas($f);
        $porSeveridade = ['alta' => 0, 'media' => 0, 'baixa' => 0];
        foreach ($itens as $a) {
            $porSeveridade[$a['severidade']] = ($porSeveridade[$a['severidade']] ?? 0) + 1;
        }
        ApiResponse::success(
            ['alertas' => $itens, 'por_severidade' => $porSeveridade],
            ['total' => count($itens)]
        );
    }
}
