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

/** Lote com falha transitória: o token não avançou; o job deve ser tentado de novo. */
final class GcalLoteParcial extends \RuntimeException {}

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
            $this->fecharLote($accountId, $calendarId, (string)$r['syncToken'], $n, $t0,
                ['window_from' => $de->format('Y-m-d'), 'window_to' => $ate->format('Y-m-d')]);
        } catch (GcalLoteParcial $e) {
            throw $e;   // estado já gravado como 'stale' (parcial) pelo fecharLote; o job vai para nova tentativa
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
            $this->fecharLote($accountId, $calendarId, (string)$r['syncToken'], $n, $t0, []);
        } catch (GcalLoteParcial $e) {
            throw $e;
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
                    $transitorio = self::falhaTransitoria($ex);
                    $n[$transitorio ? 'transitorios' : 'permanentes'] = ($n[$transitorio ? 'transitorios' : 'permanentes'] ?? 0) + 1;
                    $msg = mb_substr($ex->getMessage(), 0, 200);
                    error_log('[gcal] evento ignorado em ' . ($calendarId !== '' ? $calendarId : $e['calendar_id'] ?? '?')
                        . ' (id ' . (string)($e['event_id'] ?? '?') . '): ' . $msg);
                    $r->registrarErro($accountId, [
                        'run_id' => $run, 'calendar_id' => $calendarId !== '' ? $calendarId : ($e['calendar_id'] ?? null),
                        'event_id' => (string)($e['event_id'] ?? ''), 'error_code' => $transitorio ? 'evento_transitorio' : 'evento_invalido',
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

    /**
     * DSHOW-024 (origem: Codex DSHOW-023, 18/11/2026). O token só avança quando o lote está ÍNTEGRO ou quando as
     * únicas falhas são PERMANENTES (dado que o banco recusa e que repetir não conserta):
     *  - falha TRANSITÓRIA (deadlock, lock wait, conexão) → o token NÃO avança, estado 'stale', e o job falha para
     *    nova tentativa com o MESMO token (a regravação é upsert: idempotente). A fila limita as tentativas;
     *  - falha PERMANENTE → o token avança (para não repetir sem fim), o evento fica na lista durável de rejeitados
     *    (gcal_sync_errors, error_code 'evento_invalido', com event_id) e o calendário fica 'stale' (PARCIAL, visível)
     *    enquanto houver rejeitado sem gravação posterior. 'stale' também tira o calendário da reconciliação
     *    (que só age em 'ok'), então um evento rejeitado nunca é marcado como apagado por engano.
     */
    private function fecharLote(int $accountId, string $calendarId, string $token, array $n, float $t0, array $janela): void
    {
        $ms = (int)round((microtime(true) - $t0) * 1000);
        $agora = new \DateTimeImmutable('now', new \DateTimeZone('UTC'));
        if (($n['transitorios'] ?? 0) > 0) {
            $this->repo->salvarSyncState($accountId, $calendarId, [
                'status' => 'stale', 'processed' => $n['processed'], 'duration_ms' => $ms, 'attempt' => 1,
                'next_sync_at' => $agora->modify('+2 minutes')->format('Y-m-d H:i:s'),
            ] + $janela);   // sem 'sync_token' → o COALESCE do repositório mantém o token anterior
            throw new GcalLoteParcial('lote parcial: ' . $n['transitorios'] . ' evento(s) com falha transitória; token mantido');
        }
        $pendentes = $this->repo->rejeitadosPendentes($accountId, $calendarId);
        $this->repo->salvarSyncState($accountId, $calendarId, [
            'sync_token' => $token, 'status' => $pendentes > 0 ? 'stale' : 'ok',
            'processed' => $n['processed'], 'duration_ms' => $ms, 'attempt' => 0,
            'next_sync_at' => $agora->modify('+15 minutes')->format('Y-m-d H:i:s'),
        ] + $janela);
    }

    /** Falha que tende a passar sozinha: deadlock/lock wait (1213/1205), conexão (2006/2013, SQLSTATE 08xxx/40001). */
    private static function falhaTransitoria(\Throwable $ex): bool
    {
        if (!$ex instanceof \PDOException) return false;
        $info = $ex->errorInfo ?? [];
        $sqlstate = (string)($info[0] ?? $ex->getCode());
        $codigo = (int)($info[1] ?? 0);
        return in_array($codigo, [1205, 1213, 2006, 2013], true) || $sqlstate === '40001' || str_starts_with($sqlstate, '08');
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
