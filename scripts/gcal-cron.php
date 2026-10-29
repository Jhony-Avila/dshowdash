<?php
// Agendador do Google Calendar — enfileira o que esta devido (§50)
// @module google-calendar.cron
// @version 1.0.0
// @created 2026-07-30
//
//   php scripts/gcal-cron.php              agenda + renova canais + limpa
//   php scripts/gcal-cron.php --dry-run    so mostra o que faria
//
// SEPARADO DO WORKER de proposito: agendar e barato e deve rodar sempre;
// trabalhar e caro e pode estar travado. Se fossem o mesmo processo, um job
// lento impediria o agendamento de todos os outros.
//
// Crontab sugerido (a saida vai para arquivo — NUNCA /dev/null):
//   */5  * * * * php /var/www/dshowdash/scripts/gcal-cron.php   >> /var/log/gcal-cron.log 2>&1
//   */2  * * * * php /var/www/dshowdash/scripts/gcal-worker.php >> /var/log/gcal-worker.log 2>&1
declare(strict_types=1);

if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }

$raiz = dirname(__DIR__);
require_once $raiz . '/api/_helpers/ApiResponse.php';
require_once $raiz . '/config/db_connection.php';
require_once $raiz . '/api/google-calendar/lib/Tz.php';
require_once $raiz . '/api/google-calendar/lib/GcalCrypto.php';
require_once $raiz . '/api/google-calendar/lib/GoogleOAuth.php';
require_once $raiz . '/api/google-calendar/lib/GcalTransport.php';
require_once $raiz . '/api/google-calendar/lib/GcalNormalizer.php';
require_once $raiz . '/api/google-calendar/lib/GoogleCalendarClient.php';
require_once $raiz . '/api/google-calendar/lib/GcalGoLive.php';
require_once $raiz . '/api/google-calendar/repositories/GcalRepository.php';
require_once $raiz . '/api/google-calendar/services/GcalAuthService.php';
require_once $raiz . '/api/google-calendar/services/GcalSyncService.php';
require_once $raiz . '/api/google-calendar/services/GcalWatchService.php';
require_once $raiz . '/api/google-calendar/services/GcalQueueService.php';
require_once $raiz . '/api/google-calendar/services/GcalManutencaoService.php';

$seco = isset(getopt('', ['dry-run'])['dry-run']);
$diz  = static fn(string $m) => print('[' . gmdate('Y-m-d H:i:s') . ' UTC] ' . $m . "\n");

if (strtolower((string)(getenv('GCAL_PROVIDER') ?: 'mock')) !== 'google') {
    $diz('GCAL_PROVIDER não é google — nada a agendar');
    exit(0);
}

$repo  = new GcalRepository();
$auth  = new GcalAuthService($repo);
$watch = new GcalWatchService($repo, $auth);
$fila  = new GcalQueueService($repo, $auth, new GcalSyncService($repo, $auth), $watch);
$manut = new GcalManutencaoService($repo);

if ($seco) {
    $m = $manut->tratarMortos(true);
    $diz(sprintf('dry-run: %d job(s) dead por notFound seriam cancelados · %d dead ficariam para análise',
        $m['cancelados'], $m['restantes']));
    $devidos = (int)$repo->pdo()->query(
        "SELECT COUNT(*) FROM gcal_sync_state s
           JOIN gcal_accounts a ON a.id = s.account_id AND a.is_active = 1
          WHERE s.next_sync_at IS NULL OR s.next_sync_at <= UTC_TIMESTAMP()")->fetchColumn();
    $diz("dry-run: $devidos calendário(s) devido(s) · "
       . count($repo->canaisAVencer(GcalWatchService::HORAS_ANTECEDENCIA)) . ' canal(is) a renovar');
    exit(0);
}

$r = $fila->agendarDevidos();
$diz(sprintf('agendados %d · watch_renew %d · destravados %d · jobs antigos removidos %d',
    $r['incremental'], $r['watch_renew'], $r['destravados'], $r['limpos']));

// Q-V9.6 (2026-10-29): `dead` por calendário apagado no Google (notFound) é FECHADO aqui, a cada
// rodada — calendário marcado como apagado (gcal_calendars.deleted = 1) e job `cancelled`, erro
// original preservado. Os demais `dead` continuam esperando análise (scripts/gcal-manutencao.php).
// Nunca apaga nada; sem a migração 02e a manutenção só avisa e o agendamento segue.
try {
    $m = $manut->tratarMortos();
    if ($m['cancelados'] > 0) {
        $diz(sprintf('manutenção: %d job(s) dead por notFound → cancelled · %d calendário(s) marcado(s) como apagado(s)',
            $m['cancelados'], $m['calendarios_marcados']));
    }
    if ($m['erro'] !== null) { fwrite(STDERR, '[gcal-cron] manutenção: ' . $m['erro'] . "\n"); }
} catch (\Throwable $e) {
    fwrite(STDERR, '[gcal-cron] manutenção dos dead falhou: ' . $e->getMessage() . "\n");
}

// Um job preso denuncia worker morto; um job morto denuncia erro permanente.
// Os dois merecem aparecer no log do cron, não só numa tela que ninguém abre.
$mortos = (int)$repo->pdo()->query(
    "SELECT COUNT(*) FROM gcal_sync_jobs WHERE status = 'dead'")->fetchColumn();
if ($mortos > 0) {
    fwrite(STDERR, "[gcal-cron] ATENÇÃO: $mortos job(s) em estado 'dead' aguardando análise\n");
}

$semPush = 0;
if (GcalWatchService::configurado()) {
    $semPush = (int)$repo->pdo()->query(
        "SELECT COUNT(*) FROM gcal_calendars c
           JOIN gcal_accounts a ON a.id = c.account_id AND a.is_active = 1
           LEFT JOIN gcal_watch_channels w
                  ON w.account_id = c.account_id AND w.calendar_id = c.calendar_id
                 AND w.stopped_at IS NULL
          WHERE c.deleted = 0 AND w.channel_id IS NULL")->fetchColumn();
    if ($semPush > 0) {
        // Sem canal a agenda continua funcionando pelo fallback de 15 min —
        // só deixa de ser tempo real. É aviso, não erro.
        $diz("aviso: $semPush calendário(s) sem canal push (sincronizam pelo fallback)");
    }
}

exit($mortos > 0 ? 1 : 0);
