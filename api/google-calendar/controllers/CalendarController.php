<?php
// Google Calendar / CalendarController - calendarios e recursos (§27, §28, §29)
// @version 1.0.0  @created 2026-07-29
declare(strict_types=1);

final class GcalCalendarController
{
    /** GET /calendars — todos os calendarios acessiveis, com papel de acesso. */
    public static function listar(GcalProvider $p): void
    {
        $cals = $p->calendarios();
        $kind = gcal_qstr('kind', 20);
        if ($kind !== null) {
            $cals = array_values(array_filter($cals, fn($c) => ($c['kind'] ?? '') === $kind));
        }
        ApiResponse::success(['calendarios' => $cals], ['total' => count($cals)]);
    }

    /**
     * GET /calendars/resources — salas, showroom, veiculos (§29).
     *
     * Separado de /calendars porque a tela de reserva precisa de capacidade e
     * localizacao, que so recurso tem; misturar os dois obrigaria a UI a
     * filtrar sempre e a errar uma vez.
     */
    public static function recursos(GcalProvider $p): void
    {
        $out = array_values(array_filter($p->calendarios(), fn($c) => ($c['kind'] ?? '') === 'resource'));
        ApiResponse::success(['recursos' => $out], ['total' => count($out)]);
    }
}
