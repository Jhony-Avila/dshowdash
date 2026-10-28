<?php
// Worker da fila de sincronizacao do Google Calendar (§50)
// @module google-calendar.worker
// @version 1.0.0
// @created 2026-07-30
//
//   php scripts/gcal-worker.php                drena ate 25 jobs e sai
//   php scripts/gcal-worker.php --max=100      teto diferente
//   php scripts/gcal-worker.php --once         so 1 job (util para depurar)
//
// PROCESSO CURTO, NAO DAEMON. Cron chama, ele drena e morre. Daemon PHP neste
// servidor precisaria de supervisor, e um worker que vaza memoria em processo
// longo e pior do que um que reinicia sempre.
//
// A trava de arquivo impede dois workers simultaneos: sem ela, dois crons
// sobrepostos — que e exatamente o que acontece quando um job esta lento —
// dobrariam o consumo de cota da API.
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

$opts = getopt('', ['max:', 'once', 'help']);
if (isset($opts['help'])) {
    echo "uso: php scripts/gcal-worker.php [--max=N] [--once]\n";
    exit(0);
}
$max = isset($opts['once']) ? 1 : (int)($opts['max'] ?? 25);

$agora = static fn(): string => gmdate('Y-m-d H:i:s');
$diz   = static fn(string $m) => print('[' . gmdate('H:i:s') . '] ' . $m . "\n");

// ── Trava ────────────────────────────────────────────────────────────
// NÃO abrir a trava com `@`: um erro ao ABRIR o arquivo é problema de
// permissão, não concorrência. Tratar os dois como "ocupado" faz o worker
// nunca rodar e ainda logar uma mensagem tranquilizadora — foi exatamente o
// que aconteceu no teste (arquivo em /tmp criado por root, cron como www-data).
$lock = @fopen(GcalGoLive::ARQUIVO_TRAVA, 'c');
if ($lock === false) {
    fwrite(STDERR, '[gcal-worker] não consegui abrir a trava '
        . GcalGoLive::ARQUIVO_TRAVA . " — verifique dono e permissão\n");
    exit(1);
}
if (!flock($lock, LOCK_EX | LOCK_NB)) {
    // Aqui sim: worker ocupado NÃO é erro, é o comportamento esperado. Sair 1
    // encheria o log do cron de falso alarme a cada 2 minutos.
    $diz('outro worker já está rodando — saindo');
    exit(0);
}

// Batimento ANTES do desvio do mock: prova que o CRON está vivo, o que é
// diferente de provar que há trabalho. Sem isso, "0 jobs processados" e "cron
// nunca rodou" ficam indistinguíveis — e só o segundo quebra a agenda.
if (!@touch(GcalGoLive::ARQUIVO_BATIMENTO)) {
    fwrite(STDERR, '[gcal-worker] não consegui gravar o batimento em '
        . GcalGoLive::ARQUIVO_BATIMENTO . "\n");
}

if (strtolower((string)(getenv('GCAL_PROVIDER') ?: 'mock')) !== 'google') {
    $diz('GCAL_PROVIDER não é google — nada a fazer');
    exit(0);
}

$repo  = new GcalRepository();
$auth  = new GcalAuthService($repo);
$watch = new GcalWatchService($repo, $auth);
$fila  = new GcalQueueService($repo, $auth, new GcalSyncService($repo, $auth), $watch);

$t0 = microtime(true);
$r = $fila->drenar($max, static function (array $l) use ($diz): void {
    // Uma linha por job, sempre. Cron que engole a saída deixou dois warm-cache
    // deste servidor quebrados por 14 dias sem ninguém notar.
    $diz(sprintf('  job %-6s %-12s %-38s %s  %d ms',
        $l['id'], $l['kind'], (string)($l['calendar_id'] ?? '(conta)'),
        $l['ok'] ? 'ok' : ('FALHA → ' . ($l['destino'] ?? '?') . ': ' . ($l['erro'] ?? '')),
        $l['ms']));
});

$diz(sprintf('%d processado(s) · %d ok · %d reagendado(s) · %d morto(s) · %.1fs',
    $r['processados'], $r['ok'], $r['falhas'], $r['mortos'], microtime(true) - $t0));

if ($r['mortos'] > 0) {
    // `dead` é o único estado que exige olho humano: retry não vai resolver.
    fwrite(STDERR, "[gcal-worker] {$r['mortos']} job(s) morto(s) em " . $agora() . " UTC — "
        . "ver gcal_sync_jobs WHERE status='dead'\n");
    exit(1);
}
exit(0);
