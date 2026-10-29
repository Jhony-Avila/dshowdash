<?php
// Google Calendar / GcalManutencaoService - manutenção dos jobs `dead` (Q-V9.6 do APP DSHOW)
// @module google-calendar.manutencao
// @version 1.0.0
// @created 2026-10-29
// @app Google Calendar
//
// Um job vira `dead` por erro permanente ou depois de seis falhas (GcalRepository::falharJob).
// Até aqui o cron só AVISAVA ("N job(s) em estado 'dead' aguardando análise") e ninguém fechava
// o ciclo; pior, um calendário APAGADO no Google voltava à fila a cada rodada (next_sync_at NULL
// → agendarDevidos) e morria de novo — 24 `dead` do mesmo calendário em produção (DR-011).
//
// Esta classe fecha o ciclo SEM apagar nada:
//   notFound → o calendário não existe mais no Google: gcal_calendars.deleted = 1 (a MESMA marca
//              que a lista de calendários usa em marcarCalendariosAusentes) e o job vira
//              `cancelled` (migração 02e), com o erro original preservado em last_error.
//              Automático, a cada rodada do cron (gcal-cron.php).
//   demais   → continuam `dead` até decisão humana: `php scripts/gcal-manutencao.php --requeue=ID|all`
//              reenfileira os que NÃO são permanentes (ex.: o 1265 do event_type, corrigido pela
//              migração 02d) com attempts = 0. Permanentes (escopo revogado, sem permissão) nunca
//              são reenfileirados: o caminho é corrigir a causa.
// Nunca DELETE; nunca toca gcal_events; nenhuma chamada ao Google.
declare(strict_types=1);

final class GcalManutencaoService
{
    /** Motivos que o tempo não cura — espelho da lista em GcalQueueService::drenar (manter as duas iguais). */
    public const MOTIVOS_PERMANENTES = ['notFound', 'forbidden', 'insufficientPermissions', 'invalid_grant', 'requiredAccessLevel'];

    public function __construct(private GcalRepository $repo) {}

    /**
     * Jobs `dead` com o motivo deduzido: o último `error_code` registrado em gcal_sync_errors para o
     * mesmo (conta, calendário) depois do início do job; sem registro, o que a mensagem do job diz
     * ("Google Calendar recusou a chamada (notFound)").
     *
     * @return array<int,array<string,mixed>> cada job com `motivo` e `permanente`
     */
    public function listarMortos(): array
    {
        $out = [];
        foreach ($this->repo->jobsMortos() as $j) {
            $j['motivo']     = self::motivoDe($j);
            $j['permanente'] = in_array($j['motivo'], self::MOTIVOS_PERMANENTES, true);
            $out[] = $j;
        }
        return $out;
    }

    public static function motivoDe(array $job): string
    {
        $code = trim((string)($job['error_code'] ?? ''));
        if ($code !== '') return $code;
        if (preg_match('/\(([A-Za-z_]+)\)\s*$/', trim((string)($job['last_error'] ?? '')), $m)) return $m[1];
        return '';
    }

    /**
     * Trata os `dead` por notFound: calendário marcado como apagado + job `cancelled`. Idempotente.
     * `$seco` só conta o que faria. Se o banco recusar `cancelled` (migração 02e ainda não aplicada),
     * para no primeiro job, devolve `erro` e NÃO lança — o cron continua agendando.
     *
     * @return array{cancelados:int,calendarios_marcados:int,restantes:int,detalhe:array,erro:?string}
     */
    public function tratarMortos(bool $seco = false): array
    {
        $n = ['cancelados' => 0, 'calendarios_marcados' => 0, 'restantes' => 0, 'detalhe' => [], 'erro' => null];
        foreach ($this->listarMortos() as $j) {
            if ($j['motivo'] !== 'notFound' || $j['calendar_id'] === null || $j['calendar_id'] === '') {
                $n['restantes']++;
                continue;
            }
            if (!$seco) {
                try {
                    $n['calendarios_marcados'] += $this->repo->marcarCalendarioApagado((int)$j['account_id'], (string)$j['calendar_id']);
                    $this->repo->cancelarJob((int)$j['id'], 'calendário não existe mais no Google (notFound)');
                } catch (\PDOException $e) {
                    // 1265 "Data truncated for column 'status'" = ENUM sem 'cancelled' (02e pendente). Não derruba o cron.
                    $n['erro'] = 'não foi possível marcar o job ' . (int)$j['id'] . " como cancelled (migração 02e aplicada?): " . mb_substr($e->getMessage(), 0, 160);
                    $n['restantes']++;
                    break;
                }
            }
            $n['cancelados']++;
            $n['detalhe'][] = ['id' => (int)$j['id'], 'calendar_id' => (string)$j['calendar_id'], 'kind' => (string)$j['kind']];
        }
        return $n;
    }

    /**
     * Reenfileira `dead` NÃO permanentes (erro corrigido fora do Google). `$id` = um job; null = todos
     * os não permanentes. Permanentes são recusados, nunca reenfileirados.
     *
     * @return array{reenfileirados:int,recusados:int,detalhe:array}
     */
    public function reenfileirar(?int $id = null, bool $seco = false): array
    {
        $n = ['reenfileirados' => 0, 'recusados' => 0, 'detalhe' => []];
        foreach ($this->listarMortos() as $j) {
            if ($id !== null && (int)$j['id'] !== $id) continue;
            $linha = ['id' => (int)$j['id'], 'calendar_id' => $j['calendar_id'], 'kind' => (string)$j['kind'], 'motivo' => $j['motivo']];
            if ($j['permanente']) {
                $n['recusados']++;
                $n['detalhe'][] = $linha + ['acao' => 'recusado: motivo permanente'];
                continue;
            }
            if (!$seco) {
                $this->repo->reenfileirarJobMorto((int)$j['id'], 'reenfileirado pela manutenção');
            }
            $n['reenfileirados']++;
            $n['detalhe'][] = $linha + ['acao' => 'pending'];
        }
        return $n;
    }
}
