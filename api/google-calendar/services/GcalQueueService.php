<?php
// Google Calendar / GcalQueueService - executor da fila de sincronizacao (§50)
// @module google-calendar.queue
// @version 1.0.0
// @created 2026-07-30
// @app Google Calendar
//
// A fila existe por um motivo especifico: o webhook do Google precisa responder
// 200 em milissegundos. Se demorar, o Google faz backoff e depois PARA de
// enviar — a agenda passa a atrasar sem nada quebrar visivelmente. Entao o
// webhook so enfileira; quem trabalha e o worker.
//
// Quatro tipos de job (§50):
//   incremental  delta por syncToken — o caminho normal
//   full         carga da janela — primeira conexao, 410, pedido do admin
//   watch_renew  renova canais push perto de vencer
//   reconcile    compara banco x API e marca o que sumiu da origem
declare(strict_types=1);

final class GcalQueueService
{
    public function __construct(
        private GcalRepository $repo,
        private GcalAuthService $auth,
        private GcalSyncService $sync,
        private GcalWatchService $watch
    ) {}

    /**
     * Processa até `$max` jobs devidos.
     *
     * SERIAL de propósito. Disparar os calendários em paralelo é o caminho mais
     * curto para o 429 da Calendar API, e o 429 atrasa TODAS as contas — não só
     * a que apressou.
     *
     * @return array{processados:int,ok:int,falhas:int,mortos:int,detalhe:array}
     */
    public function drenar(int $max = 25, ?callable $aoProcessar = null): array
    {
        $n = ['processados' => 0, 'ok' => 0, 'falhas' => 0, 'mortos' => 0, 'detalhe' => []];

        for ($i = 0; $i < $max; $i++) {
            $job = $this->repo->reservarJob();
            if ($job === null) break;

            $n['processados']++;
            $cid = GcalRepository::correlationId();
            $t0 = microtime(true);

            try {
                $r = $this->executar($job);
                $this->repo->concluirJob((int)$job['id']);
                $n['ok']++;
                $linha = ['id' => (int)$job['id'], 'kind' => $job['kind'],
                          'calendar_id' => $job['calendar_id'], 'ok' => true,
                          'ms' => (int)round((microtime(true) - $t0) * 1000)] + $r;
            } catch (\Throwable $e) {
                // Erro PERMANENTE não merece 6 tentativas: escopo revogado ou
                // calendário apagado não melhora com o tempo, e insistir só
                // queima cota e enche o log.
                $permanente = $e instanceof GcalApiException
                    && in_array($e->motivo, ['notFound', 'forbidden', 'insufficientPermissions',
                                             'invalid_grant', 'requiredAccessLevel'], true);
                $destino = $this->repo->falharJob(
                    (int)$job['id'], (int)$job['attempts'], $e->getMessage(), $permanente);

                if ($destino === 'dead') { $n['mortos']++; } else { $n['falhas']++; }

                $this->repo->registrarErro((int)$job['account_id'], [
                    'calendar_id' => $job['calendar_id'],
                    'error_code' => $e instanceof GcalApiException ? $e->motivo : 'erro',
                    'http_status' => $e instanceof GcalApiException ? $e->status : null,
                    'message' => $e->getMessage(), 'correlation_id' => $cid,
                ]);

                $linha = ['id' => (int)$job['id'], 'kind' => $job['kind'],
                          'calendar_id' => $job['calendar_id'], 'ok' => false,
                          'destino' => $destino, 'erro' => mb_substr($e->getMessage(), 0, 180),
                          'ms' => (int)round((microtime(true) - $t0) * 1000)];
            }

            $n['detalhe'][] = $linha;
            if ($aoProcessar !== null) $aoProcessar($linha);
        }

        return $n;
    }

    /** @return array dados extras do resultado, para o log do worker */
    private function executar(array $job): array
    {
        $acc = (int)$job['account_id'];
        $cal = $job['calendar_id'] !== null ? (string)$job['calendar_id'] : null;

        switch ($job['kind']) {
            case 'incremental':
                if ($cal === null) return $this->sync->sincronizarConta($acc, false);
                $r = $this->sync->incremental($acc, $cal);
                return ['processed' => $r['processed'] ?? 0, 'created' => $r['created'] ?? 0];

            case 'full':
                if ($cal === null) return $this->sync->sincronizarConta($acc, true);
                $r = $this->sync->cargaCompleta($acc, $cal);
                return ['processed' => $r['processed'] ?? 0, 'created' => $r['created'] ?? 0];

            case 'watch_renew':
                $r = $this->watch->renovarVencendo();
                return ['renovados' => $r['renovados'], 'falhas' => $r['falhas']];

            case 'reconcile':
                return $this->reconciliar($acc, $cal);
        }
        throw new RuntimeException('Tipo de job desconhecido: ' . $job['kind']);
    }

    /**
     * Reconciliação (§49.3): o que sumiu da origem some daqui.
     *
     * Roda DEPOIS de uma carga completa bem-sucedida e só dentro da janela que
     * a carga cobriu. Marcar como `deleted` fora dessa janela apagaria eventos
     * que a carga nem chegou a olhar — o modo mais silencioso de esvaziar uma
     * agenda.
     *
     * `deleted` é só "sumiu da origem"; evento CANCELADO continua existindo
     * (§59) e não entra aqui.
     */
    private function reconciliar(int $accountId, ?string $calendarId): array
    {
        $st = $this->repo->pdo()->prepare(
            "SELECT calendar_id, window_from, window_to, last_sync_at
               FROM gcal_sync_state
              WHERE account_id = :a AND status = 'ok' AND window_from IS NOT NULL"
            . ($calendarId !== null ? " AND calendar_id = :c" : ''));
        $par = [':a' => $accountId];
        if ($calendarId !== null) $par[':c'] = $calendarId;
        $st->execute($par);

        $marcados = 0; $calendarios = 0;
        foreach ($st->fetchAll(PDO::FETCH_ASSOC) as $s) {
            $calendarios++;
            // `synced_at < last_sync_at` = a última varredura passou por este
            // calendário e NÃO tocou neste evento, logo ele não voltou da API.
            $up = $this->repo->pdo()->prepare(
                "UPDATE gcal_events
                    SET deleted = 1
                  WHERE account_id = :a AND calendar_id = :c AND deleted = 0
                    AND synced_at < :ult
                    AND ( (all_day = 0 AND start_utc >= :de AND start_utc < :ate)
                       OR (all_day = 1 AND start_date >= :de2 AND start_date < :ate2) )");
            $up->execute([
                ':a' => $accountId, ':c' => $s['calendar_id'], ':ult' => $s['last_sync_at'],
                ':de' => $s['window_from'] . ' 00:00:00', ':ate' => $s['window_to'] . ' 00:00:00',
                ':de2' => $s['window_from'], ':ate2' => $s['window_to'],
            ]);
            $marcados += $up->rowCount();
        }
        return ['calendarios' => $calendarios, 'marcados_deleted' => $marcados];
    }

    // ═══════════════════════════════════════════════════════════════════
    // AGENDAMENTO
    // ═══════════════════════════════════════════════════════════════════

    /**
     * Enfileira o que está devido. Chamado pelo cron.
     *
     * O fallback de 15 min existe mesmo com push ligado: canal pode expirar,
     * a entrega pode falhar e o Google pode desistir. Push é otimização, não
     * garantia — desenhar como se fosse garantia é o que produz agenda
     * silenciosamente desatualizada.
     *
     * @return array{incremental:int,watch_renew:int,destravados:int,limpos:int}
     */
    public function agendarDevidos(int $minutos = 15): array
    {
        $n = ['incremental' => 0, 'watch_renew' => 0, 'destravados' => 0, 'limpos' => 0];

        $n['destravados'] = $this->repo->destravarJobs(30);

        $st = $this->repo->pdo()->query(
            "SELECT s.account_id, s.calendar_id, s.status
               FROM gcal_sync_state s
               JOIN gcal_accounts a ON a.id = s.account_id
                                   AND a.is_active = 1
                                   AND a.connection_status = 'connected'
              WHERE s.next_sync_at IS NULL OR s.next_sync_at <= UTC_TIMESTAMP()");
        foreach ($st->fetchAll(PDO::FETCH_ASSOC) as $s) {
            // Quem pediu recarga completa recebe `full`; enfileirar
            // `incremental` aqui reentraria no mesmo 410 para sempre.
            $kind = $s['status'] === 'full_resync_required' ? 'full' : 'incremental';
            $this->repo->enfileirar((int)$s['account_id'], (string)$s['calendar_id'], $kind);
            $n['incremental']++;
        }

        // Calendário descoberto e nunca sincronizado: entra como carga completa.
        $novos = $this->repo->pdo()->query(
            "SELECT c.account_id, c.calendar_id
               FROM gcal_calendars c
               JOIN gcal_accounts a ON a.id = c.account_id AND a.is_active = 1
               LEFT JOIN gcal_sync_state s
                      ON s.account_id = c.account_id AND s.calendar_id = c.calendar_id
              WHERE c.deleted = 0 AND s.account_id IS NULL");
        foreach ($novos->fetchAll(PDO::FETCH_ASSOC) as $c) {
            $this->repo->enfileirar((int)$c['account_id'], (string)$c['calendar_id'], 'full', [], 0, 3);
            $n['incremental']++;
        }

        if ($this->repo->canaisAVencer(GcalWatchService::HORAS_ANTECEDENCIA)) {
            $qualquer = $this->repo->pdo()->query(
                "SELECT id FROM gcal_accounts WHERE is_active = 1 LIMIT 1")->fetchColumn();
            if ($qualquer !== false) {
                // `watch_renew` varre todas as contas de uma vez; um job basta.
                $this->repo->enfileirar((int)$qualquer, null, 'watch_renew', [], 0, 2);
                $n['watch_renew'] = 1;
            }
        }

        $n['limpos'] = $this->repo->limparJobsAntigos(7);
        return $n;
    }
}
