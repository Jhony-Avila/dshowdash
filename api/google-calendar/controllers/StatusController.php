<?php
// Google Calendar / StatusController - prontidao da integracao (§8.3, §51)
// @version 1.0.0  @created 2026-07-29
declare(strict_types=1);

final class GcalStatusController
{
    /**
     * O `golive` vai junto SEMPRE, inclusive em mock.
     *
     * E de proposito: a tela de Contas mostra a checklist enquanto o modulo
     * ainda roda em mock, entao quem for ligar as credenciais ja sabe o que
     * falta ANTES de virar a chave — em vez de virar, quebrar, e so entao
     * descobrir que faltava a GCAL_CRYPTO_KEY.
     */
    public static function status(GcalProvider $p): void
    {
        ApiResponse::success($p->status() + ['golive' => GcalGoLive::resumo()]);
    }

    /**
     * Resumo enxuto para o ICONE e o POPOVER do header (§8.2, §9).
     *
     * Endpoint separado do /status de proposito: o header pede isto a cada
     * poucos minutos em toda navegacao, e nao pode arrastar a agenda inteira
     * junto. Devolve so o que cabe no tooltip.
     */
    public static function headerSummary(GcalProvider $p): void
    {
        $tz = Tz::normalizar(gcal_qstr('tz', 64));
        $st = $p->status();

        // Sem conta conectada o header nao deve inventar contagem.
        if (empty($st['connected'])) {
            ApiResponse::success([
                'estado' => 'not_connected', 'hoje' => 0, 'proxima' => null,
                'convites_pendentes' => 0, 'conflitos' => 0,
                'livre_min' => 0, 'updated_at' => gmdate('c'),
                'mock' => !empty($st['mock']),
            ]);
            return;
        }

        $ov = $p->overview(['tz' => $tz]);
        $h  = $ov['hoje'];
        $prox = $h['proxima_reuniao'] ?? null;

        // Estado do icone (§8.3), na ordem em que importa ao usuario.
        $estado = 'connected';
        if (!empty($st['mock']))                       $estado = 'mock';
        if (($st['stale_calendars'] ?? 0) > 0)         $estado = 'stale';
        if (($h['conflitos'] ?? 0) > 0)                $estado = 'attention';
        if (($st['accounts_with_problem'] ?? 0) > 0)   $estado = 'error';
        if ($prox !== null) {
            $faltam = (new \DateTimeImmutable($prox['start']))->getTimestamp() - time();
            if ($faltam >= 0 && $faltam <= 900) $estado = 'upcoming';
        }

        ApiResponse::success([
            'estado'  => $estado,
            'hoje'    => $h['compromissos'] ?? 0,
            'proxima' => $prox === null ? null : [
                'id' => $prox['id'], 'calendar_id' => $prox['calendar_id'],
                'summary' => $prox['summary'], 'start' => $prox['start'],
                'conference' => $prox['conference']['uri'] ?? null,
            ],
            'convites_pendentes' => $h['convites_pendentes'] ?? 0,
            'conflitos' => $h['conflitos'] ?? 0,
            'livre_min' => $h['livre_min'] ?? 0,
            'mock' => !empty($st['mock']),
            'updated_at' => gmdate('c'),
        ]);
    }

    /**
     * Os 3 proximos compromissos do popover (§9).
     *
     * Respeita privacidade: evento redigido chega aqui ja sem titulo, e nao
     * cabe ao header "melhorar" isso.
     */
    public static function proximos(GcalProvider $p): void
    {
        $tz = Tz::normalizar(gcal_qstr('tz', 64));
        $hoje = (new \DateTimeImmutable('now', new \DateTimeZone($tz)));
        $lista = $p->eventos([
            'de' => $hoje->format('Y-m-d'),
            'ate' => $hoje->modify('+2 days')->format('Y-m-d'),
            'tz' => $tz,
        ]);
        $agora = $hoje->getTimestamp();
        $out = [];
        foreach ($lista as $e) {
            if (!empty($e['all_day'])) continue;
            if ((new \DateTimeImmutable($e['start']))->getTimestamp() < $agora) continue;
            $out[] = [
                'id' => $e['id'], 'calendar_id' => $e['calendar_id'],
                'summary' => $e['summary'], 'start' => $e['start'], 'end' => $e['end'],
                'calendar_color' => $e['calendar_color'] ?? null,
                'attendees_count' => count($e['attendees'] ?? []),
                'conference' => $e['conference']['uri'] ?? null,
                'my_response' => $e['my_response'] ?? null,
                'redacted' => !empty($e['redacted']),
            ];
            if (count($out) >= 3) break;
        }
        ApiResponse::success(['proximos' => $out, 'time_zone' => $tz]);
    }
}
