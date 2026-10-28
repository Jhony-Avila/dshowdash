<?php
// Google Calendar / OverviewController - dashboards Hoje e Visao Geral (§15, §16, §38)
// @version 1.0.0  @created 2026-07-29
declare(strict_types=1);

final class GcalOverviewController
{
    /** GET /overview?tz= */
    public static function overview(GcalProvider $p): void
    {
        ApiResponse::success($p->overview(['tz' => Tz::normalizar(gcal_qstr('tz', 64))]));
    }
}
