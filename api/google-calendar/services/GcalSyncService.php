<?php
// Google Calendar / GcalSyncService - carga inicial e incremental (§49)
// @module google-calendar.sync
// @version 1.0.0
// @created 2026-07-30
// @app Google Calendar
//
// Detalhe do desenho em docs/GOOGLE-CALENDAR/03-sincronizacao-e-filas.md.
// Aqui ficam as duas operacoes; o AGENDAMENTO (cron/fila) e da Fase 5.
declare(strict_types=1);

final class GcalSyncService
{
    /** Janela da carga inicial (§49.1): nunca "tudo". */
    private const DIAS_ATRAS  = 90;
    private const DIAS_FRENTE = 365;

    public function __construct(
        private GcalRepository $repo,
        private GcalAuthService $auth
    ) {}

    /** Descobre e persiste os calendários da conta. */
    public function sincronizarCalendarios(int $accountId): int
    {
        $cliente = $this->auth->clientePara($accountId);
        $cals = $cliente->listarCalendarios();

        $vivos = [];
        foreach ($cals as $c) {
            $this->repo->salvarCalendario($accountId, $c);
            $vivos[] = $c['calendar_id'];
        }
        // Some da lista → marca apagado, NÃO deleta: evento vinculado ainda aponta.
        $this->repo->marcarCalendariosAusentes($accountId, $vivos);
        return count($vivos);
    }

    /**
     * Carga completa de um calendário, dentro da janela.
     *
     * @return array{processed:int,created:int,updated:int,inalterados:int,errors:int}
     */
    public function cargaCompleta(int $accountId, string $calendarId): array
    {
        $cid = GcalRepository::correlationId();
        $run = $this->repo->abrirRun($accountId, $calendarId, 'full', $cid);
        $t0 = microtime(true);

        $de  = (new \DateTimeImmutable('now', new \DateTimeZone('UTC')))
            ->modify('-' . self::DIAS_ATRAS . ' days');
        $ate = (new \DateTimeImmutable('now', new \DateTimeZone('UTC')))
            ->modify('+' . self::DIAS_FRENTE . ' days');

        $n = ['processed' => 0, 'created' => 0, 'updated' => 0, 'inalterados' => 0, 'errors' => 0];
        try {
            $cliente = $this->auth->clientePara($accountId);
            $r = $cliente->listarEventos($calendarId, [
                'timeMin' => $de->format('c'), 'timeMax' => $ate->format('c'),
            ]);
            $n = $this->gravar($accountId, $r['eventos'], $n, $calendarId, $run, $cid);

            $this->repo->salvarSyncState($accountId, $calendarId, [
                'sync_token'  => $r['syncToken'],
                'status'      => 'ok',
                'processed'   => $n['processed'],
                'duration_ms' => (int)round((microtime(true) - $t0) * 1000),
                'attempt'     => 0,
                'window_from' => $de->format('Y-m-d'),
                'window_to'   => $ate->format('Y-m-d'),
                'next_sync_at' => (new \DateTimeImmutable('now', new \DateTimeZone('UTC')))
                    ->modify('+15 minutes')->format('Y-m-d H:i:s'),
            ]);
        } catch (\Throwable $e) {
            $n['errors']++;
            $this->repo->registrarErro($accountId, [
                'run_id' => $run, 'calendar_id' => $calendarId,
                'error_code' => $e instanceof GcalApiException ? $e->motivo : 'erro',
                'http_status' => $e instanceof GcalApiException ? $e->status : null,
                'message' => $e->getMessage(), 'correlation_id' => $cid,
            ]);
            $this->repo->salvarSyncState($accountId, $calendarId, ['status' => 'error']);
            throw $e;
        } finally {
            $n['duration_ms'] = (int)round((microtime(true) - $t0) * 1000);
            $this->repo->fecharRun($run, $n + ['deleted' => 0]);
        }
        return $n;
    }

    /**
     * Incremental por syncToken (§49.2).
     *
     * Sem token guardado, cai para carga completa — é o caminho da primeira vez
     * e o do 410 já tratado.
     */
    public function incremental(int $accountId, string $calendarId): array
    {
        $token = $this->repo->lerSyncToken($accountId, $calendarId);
        if ($token === null) {
            return $this->cargaCompleta($accountId, $calendarId);
        }

        $cid = GcalRepository::correlationId();
        $run = $this->repo->abrirRun($accountId, $calendarId, 'incremental', $cid);
        $t0 = microtime(true);
        $n = ['processed' => 0, 'created' => 0, 'updated' => 0, 'inalterados' => 0, 'errors' => 0];

        try {
            $cliente = $this->auth->clientePara($accountId);
            $r = $cliente->listarEventos($calendarId, ['syncToken' => $token]);
            $n = $this->gravar($accountId, $r['eventos'], $n, $calendarId, $run, $cid);

            $this->repo->salvarSyncState($accountId, $calendarId, [
                'sync_token'  => $r['syncToken'],
                'status'      => 'ok',
                'processed'   => $n['processed'],
                'duration_ms' => (int)round((microtime(true) - $t0) * 1000),
                'attempt'     => 0,
                'next_sync_at' => (new \DateTimeImmutable('now', new \DateTimeZone('UTC')))
                    ->modify('+15 minutes')->format('Y-m-d H:i:s'),
            ]);
        } catch (GcalSyncTokenInvalido $e) {
            // §49.3: NÃO apaga nada. Marca para recarga e refaz a carga
            // completa; a reconciliação acontece dentro dela, por upsert.
            $this->repo->exigirCargaCompleta($accountId, $calendarId);
            $this->repo->registrarErro($accountId, [
                'run_id' => $run, 'calendar_id' => $calendarId, 'http_status' => 410,
                'error_code' => 'fullSyncRequired',
                'message' => 'syncToken invalidado; recarga completa disparada',
                'correlation_id' => $cid,
            ]);
            $this->repo->fecharRun($run, $n + ['deleted' => 0]);
            return $this->cargaCompleta($accountId, $calendarId);
        } catch (\Throwable $e) {
            $n['errors']++;
            $this->repo->registrarErro($accountId, [
                'run_id' => $run, 'calendar_id' => $calendarId,
                'error_code' => $e instanceof GcalApiException ? $e->motivo : 'erro',
                'message' => $e->getMessage(), 'correlation_id' => $cid,
            ]);
            $this->repo->salvarSyncState($accountId, $calendarId, ['status' => 'error']);
            throw $e;
        } finally {
            $n['duration_ms'] = (int)round((microtime(true) - $t0) * 1000);
            $this->repo->fecharRun($run, $n + ['deleted' => 0]);
        }
        return $n;
    }

    /**
     * Grava o lote em UMA transação (carga parcial é pior que carga nenhuma), mas a falha é POR EVENTO:
     * cada evento roda dentro de um SAVEPOINT; se o banco recusar (ex.: 1265 "Data truncated for column
     * 'event_type'" em 28/10/2026 — um único evento `fromGmail` derrubava a sincronização do calendário
     * inteiro), só aquele evento é desfeito e registrado em gcal_sync_errors (event_id + mensagem curta,
     * nunca conteúdo); os demais seguem e o calendário termina `ok`. `errors` conta os ignorados.
     */
    private function gravar(int $accountId, array $eventos, array $n, string $calendarId = '',
                            ?int $run = null, ?string $cid = null): array
    {
        return $this->repo->transacao(function (GcalRepository $r) use ($accountId, $eventos, $n, $calendarId, $run, $cid): array {
            $pdo = $r->pdo();
            foreach ($eventos as $e) {
                $pdo->exec('SAVEPOINT gcal_evento');
                try {
                    $res = $r->salvarEvento($accountId, $e);
                    $pdo->exec('RELEASE SAVEPOINT gcal_evento');
                } catch (\Throwable $ex) {
                    $pdo->exec('ROLLBACK TO SAVEPOINT gcal_evento');
                    $n['processed']++;
                    $n['errors']++;
                    $msg = mb_substr($ex->getMessage(), 0, 200);
                    error_log('[gcal] evento ignorado em ' . ($calendarId !== '' ? $calendarId : $e['calendar_id'] ?? '?')
                        . ' (id ' . (string)($e['event_id'] ?? '?') . '): ' . $msg);
                    $r->registrarErro($accountId, [
                        'run_id' => $run, 'calendar_id' => $calendarId !== '' ? $calendarId : ($e['calendar_id'] ?? null),
                        'event_id' => (string)($e['event_id'] ?? ''), 'error_code' => 'evento_invalido',
                        'message' => 'evento ignorado na gravação: ' . $msg, 'correlation_id' => $cid,
                    ]);
                    continue;
                }
                $n['processed']++;
                if ($res === 'inserido')        $n['created']++;
                elseif ($res === 'atualizado')  $n['updated']++;
                else                            $n['inalterados']++;
            }
            return $n;
        });
    }

    /** Sincroniza todos os calendários selecionados de uma conta. */
    public function sincronizarConta(int $accountId, bool $completa = false): array
    {
        $this->sincronizarCalendarios($accountId);
        $st = $this->repo->pdo()->prepare(
            "SELECT calendar_id FROM gcal_calendars WHERE account_id = :a AND deleted = 0");
        $st->execute([':a' => $accountId]);

        $total = ['calendarios' => 0, 'processed' => 0, 'created' => 0, 'updated' => 0, 'errors' => 0];
        foreach ($st->fetchAll(PDO::FETCH_COLUMN) as $cal) {
            $total['calendarios']++;
            try {
                $r = $completa ? $this->cargaCompleta($accountId, (string)$cal)
                               : $this->incremental($accountId, (string)$cal);
                foreach (['processed', 'created', 'updated'] as $k) { $total[$k] += $r[$k] ?? 0; }
            } catch (\Throwable $e) {
                // Um calendário sem permissão não pode abortar os outros.
                $total['errors']++;
                error_log('[gcal] sync falhou em ' . $cal . ': ' . $e->getMessage());
            }
        }
        return $total;
    }
}
