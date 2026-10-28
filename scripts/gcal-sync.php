<?php
// Sincronizacao do Google Calendar pela linha de comando
// @module google-calendar.sync.cli
// @version 1.0.0
// @created 2026-07-30
//
//   php scripts/gcal-sync.php                    todas as contas, incremental
//   php scripts/gcal-sync.php --full             forca carga completa
//   php scripts/gcal-sync.php --account=3        so uma conta
//   php scripts/gcal-sync.php --dry-run          so mostra o que faria
//
// E o mesmo GcalSyncService que a rota POST /sync/run usa — nao ha um "caminho
// do cron" e outro "caminho da UI" que possam divergir. Serve tanto para o
// primeiro carregamento manual quanto para o cron da Fase 5.
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

$opts = getopt('', ['full', 'account:', 'dry-run', 'help']);
if (isset($opts['help'])) {
    echo "uso: php scripts/gcal-sync.php [--full] [--account=ID] [--dry-run]\n";
    exit(0);
}
$completa = isset($opts['full']);
$seco     = isset($opts['dry-run']);
$soConta  = isset($opts['account']) ? (int)$opts['account'] : null;

// Fora do go-live nao ha o que sincronizar; melhor dizer isso do que estourar
// uma excecao de conexao no meio do cron.
if (!GcalGoLive::pronto()) {
    fwrite(STDERR, "Módulo ainda não está pronto para sincronizar:\n");
    foreach (GcalGoLive::pendencias() as $p) { fwrite(STDERR, "  • $p\n"); }
    fwrite(STDERR, "\nDiagnóstico completo:  php scripts/gcal-golive.php\n");
    exit(1);
}

$repo = new GcalRepository();
$auth = new GcalAuthService($repo);
$svc  = new GcalSyncService($repo, $auth);

$contas = $repo->pdo()->query(
    "SELECT id, email, user_id FROM gcal_accounts WHERE is_active = 1 ORDER BY id")
    ->fetchAll(PDO::FETCH_ASSOC);
if ($soConta !== null) {
    $contas = array_values(array_filter($contas, static fn($c) => (int)$c['id'] === $soConta));
    if (!$contas) { fwrite(STDERR, "Conta $soConta não encontrada ou inativa.\n"); exit(1); }
}
if (!$contas) { echo "Nenhuma conta ativa.\n"; exit(0); }

printf("%s de %d conta(s)%s\n\n", $completa ? 'Carga COMPLETA' : 'Incremental',
    count($contas), $seco ? '  [DRY-RUN: nada será gravado]' : '');

$falhas = 0;
foreach ($contas as $c) {
    printf("  conta %-4s %s\n", $c['id'], $c['email']);
    if ($seco) { echo "         (dry-run)\n\n"; continue; }

    $t0 = microtime(true);
    try {
        $r = $svc->sincronizarConta((int)$c['id'], $completa);
        printf("         %d calendários · %d processados · %d novos · %d atualizados · %d erro(s) · %.1fs\n\n",
            $r['calendarios'], $r['processed'], $r['created'], $r['updated'], $r['errors'],
            microtime(true) - $t0);
        if ($r['errors'] > 0) $falhas++;
    } catch (\Throwable $e) {
        // Uma conta com token revogado nao pode abortar o lote inteiro: as
        // outras agendas continuam validas e precisam ser atualizadas.
        $falhas++;
        printf("         FALHA: %s\n\n", $e->getMessage());
    }
}

exit($falhas > 0 ? 1 : 0);
