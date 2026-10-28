<?php
// Google Calendar / LinkController - vinculos com entidades internas (§32, §34, §57)
// @version 1.0.0  @created 2026-07-30
declare(strict_types=1);

final class GcalLinkController
{
    /** GET /links/types — o que dá para vincular e de onde vem. */
    public static function tipos(): void
    {
        ApiResponse::success(['tipos' => GcalLinks::tipos()]);
    }

    /** GET /links/search?q=&tipo= — autocomplete sobre dados REAIS. */
    public static function buscar(): void
    {
        $q = gcal_qstr('q', 120) ?? '';
        $tipo = gcal_qstr('tipo', 32);
        if ($tipo !== null && !in_array($tipo, array_column(GcalLinks::tipos(), 'id'), true)) {
            ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 422, [
                'message' => 'Tipo de vínculo desconhecido.',
            ]);
        }
        $r = GcalLinks::buscar($q, $tipo);
        ApiResponse::success($r, ['total' => count($r['itens'])]);
    }

    /**
     * GET /links/entity/{tipo}/{id} — ficha lateral (§32.2).
     *
     * 404 quando a entidade nao existe MAIS. Isso acontece de verdade: o
     * vinculo fica no evento, e o negocio pode ser apagado no Pipedrive depois.
     * A UI mostra o rotulo guardado e avisa que a origem sumiu, em vez de
     * quebrar o drawer inteiro.
     */
    public static function ficha(string $tipo, string $id): void
    {
        $f = GcalLinks::ficha($tipo, $id);
        if ($f === null) {
            ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404, [
                'message' => 'Registro não encontrado na origem. Ele pode ter sido removido.',
                'entity_type' => $tipo, 'entity_id' => $id,
            ]);
        }
        ApiResponse::success($f);
    }

    /** POST /events/{calendarId}/{eventId}/links  body: {entity_type, entity_id, label, relation?, extra?} */
    public static function vincular(GcalProvider $p, string $calendarId, string $eventId): void
    {
        $b = gcal_body();
        $tipo = (string)($b['entity_type'] ?? '');
        $id   = (string)($b['entity_id'] ?? '');
        if ($tipo === '' || $id === '') {
            ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 422, [
                'message' => 'Informe entity_type e entity_id.',
            ]);
        }

        // Revalida na ORIGEM antes de gravar: aceitar o rótulo que o cliente
        // mandou deixaria o vínculo apontando para o que o usuário quisesse.
        $f = GcalLinks::ficha($tipo, $id);
        if ($f === null) {
            ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404, [
                'message' => 'Registro não encontrado na origem.',
            ]);
        }

        try {
            $e = $p->vincular($calendarId, $eventId, [
                'entity_type' => $tipo,
                'entity_id'   => $id,
                'label'       => $f['titulo'],
                'relation'    => (string)($b['relation'] ?? 'reuniao'),
                'extra'       => self::extraDaFicha($f),
            ]);
            ApiResponse::success($e, null, 201);
        } catch (RuntimeException $ex) {
            ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404, ['message' => $ex->getMessage()]);
        }
    }

    /** DELETE /events/{calendarId}/{eventId}/links/{tipo}/{id} */
    public static function desvincular(GcalProvider $p, string $calendarId, string $eventId,
                                       string $tipo, string $id): void
    {
        try {
            $e = $p->desvincular($calendarId, $eventId, $tipo, $id);
            ApiResponse::success($e);
        } catch (RuntimeException $ex) {
            ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404, ['message' => $ex->getMessage()]);
        }
    }

    /** Dois campos em destaque bastam para o chip do evento. */
    private static function extraDaFicha(array $f): array
    {
        $out = [];
        foreach (($f['campos'] ?? []) as $c) {
            if (!empty($c['destaque']) || in_array($c['rotulo'], ['Etapa', 'Situação'], true)) {
                $out[mb_strtolower($c['rotulo'])] = $c['valor'];
            }
            if (count($out) >= 2) break;
        }
        return $out;
    }
}
