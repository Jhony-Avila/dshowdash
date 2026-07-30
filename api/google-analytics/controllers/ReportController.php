<?php
// Google Analytics / controllers/ReportController.php
// @module  google-analytics.controllers.report
// @version 1.0.0
// @created 2026-07-30
//
// Um método por família de relatório. Todos seguem a MESMA forma:
//   1. `ga_filtros()` normaliza a entrada (janela com teto, fuso na borda);
//   2. o provedor devolve dados + `meta` de procedência;
//   3. o `meta` sai do corpo e vai para o envelope.
//
// ⚠️ O `meta` NUNCA é descartado: é o que carrega `fonte`, `categoria_quota`,
// `atualizado_em` e `parcial`. A §49 do briefing proíbe esconder divergência, e a §69.4
// (dados desatualizados) depende desse campo para existir na tela.
declare(strict_types=1);

final class GaReportController
{
    /** Tira o `meta` do corpo e devolve o par [dados, meta] pronto para o envelope. */
    private static function separa(array $d): array
    {
        $meta = $d['meta'] ?? [];
        unset($d['meta']);
        return [$d, $meta];
    }

    private static function responde(array $d, array $filtros): void
    {
        [$dados, $meta] = self::separa($d);
        ApiResponse::success($dados, $meta + [
            'ts'      => date('c'),
            'filtros' => [
                'periodo' => $filtros['periodo'],
                'inicio'  => $filtros['inicio'],
                'fim'     => $filtros['fim'],
                'dias'    => $filtros['dias'],
            ],
        ]);
    }

    /** GET /overview — §15, §16, §17 */
    public static function overview(GaProvider $p): void
    {
        $f = ga_filtros();
        self::responde($p->overview($f), $f);
    }

    /** GET /realtime — §18. ⚠️ Quota Realtime, categoria separada. */
    public static function tempoReal(GaProvider $p): void
    {
        $f = ga_filtros();
        self::responde($p->tempoReal($f), $f);
    }

    /** GET /acquisition — §19, §20, §22 */
    public static function aquisicao(GaProvider $p): void
    {
        $f = ga_filtros();
        self::responde($p->aquisicao($f), $f);
    }

    /** GET /acquisition/flow — §21 (Sankey) */
    public static function fluxo(GaProvider $p): void
    {
        $f = ga_filtros();
        self::responde($p->fluxoAquisicao($f), $f);
    }

    /** GET /pages — §23, §24 */
    public static function paginas(GaProvider $p): void
    {
        $f = ga_filtros();
        self::responde($p->paginas($f), $f);
    }

    /** GET /events — §28 */
    public static function eventos(GaProvider $p): void
    {
        $f = ga_filtros();
        self::responde($p->eventos($f), $f);
    }

    /** GET /conversions — §29, §32 */
    public static function conversoes(GaProvider $p): void
    {
        $f = ga_filtros();
        self::responde($p->conversoes($f), $f);
    }

    /** GET /funnel — §30, §31. ⚠️ Quota Funnel, categoria separada. */
    public static function funil(GaProvider $p): void
    {
        $f = ga_filtros();
        self::responde($p->funil($f), $f);
    }

    /** GET /journey — §25, §26 */
    public static function jornada(GaProvider $p): void
    {
        $f = ga_filtros();
        self::responde($p->jornada($f), $f);
    }

    /** GET /ecommerce — §33, §34, §35 */
    public static function ecommerce(GaProvider $p): void
    {
        $f = ga_filtros();
        self::responde($p->ecommerce($f), $f);
    }

    /** GET /users — §36, §37, §39, §40 */
    public static function usuarios(GaProvider $p): void
    {
        $f = ga_filtros();
        self::responde($p->usuarios($f), $f);
    }

    /** GET /quality — §42, §44 */
    public static function qualidade(GaProvider $p): void
    {
        $f = ga_filtros();
        self::responde($p->qualidade($f), $f);
    }

    /** GET /alerts — §50, §52 */
    public static function alertas(GaProvider $p): void
    {
        $f = ga_filtros();
        self::responde($p->alertas($f), $f);
    }
}
