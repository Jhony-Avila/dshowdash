<?php
// Prova do #67: no caminho v1/v1root (leads, notes), o item ABAIXO da marca-d'agua nao
// pode mais ser regravado — e o item ACIMA dela nao pode ser perdido.
//
// @version 1.0.0
// @created 2026-07-29
// @app Pipedrive Analytics
//
// POR QUE SANDBOX: no caminho feliz a marca-d'agua vive colada em "agora", entao a rodada
// normal exercita so o caso trivial (tudo abaixo da marca -> pula tudo, proc=1). O ramo que
// importa — "acima GRAVA, abaixo PULA" — nunca aparece. Sem rebobinar a marca, esta prova
// passaria mesmo com o pulo escrito errado.
//
// COMO: CREATE TEMPORARY TABLE sombreia pipe_sync_cursors e pipe_sync_runs dentro desta
// conexao. O PipeSyncService real le a marca rebobinada sem saber; nenhuma outra conexao
// (nem o cron) enxerga; ao fechar o script as temporarias evaporam. Os upserts caem nas
// tabelas de dados reais — sao os MESMOS dados que o cron ja grava (idempotente) — e a
// guarda no fim confere, por uma segunda conexao, que o cursor real ficou intacto.
//
// Uso: php tools/screenshot/valida-pipedrive-marca-dagua.php
declare(strict_types=1);

$base = dirname(__DIR__, 2);

// Carrega o .env no processo (PipeCrypto le PIPEDRIVE_CRYPTO_KEY do ambiente).
require_once $base . '/config/db_connection.php';
require_once $base . '/api/pipedrive/lib/PipeCrypto.php';
require_once $base . '/api/pipedrive/lib/PipedriveClient.php';
require_once $base . '/api/pipedrive/repositories/AccountRepository.php';
require_once $base . '/api/pipedrive/repositories/SyncRepository.php';
require_once $base . '/api/pipedrive/repositories/QueueRepository.php';
require_once $base . '/api/pipedrive/repositories/MetricsRepository.php';
require_once $base . '/api/pipedrive/services/SyncService.php';

$env = [];
foreach (file($base . '/.env') as $l) {
    if (preg_match('/^([A-Z0-9_]+)=(.*)$/', trim($l), $m)) { $env[$m[1]] = $m[2]; }
}
// pipe_app NAO tem CREATE TEMPORARY TABLES (o grant e' CREATE, que e' outro privilegio) —
// a credencial administrativa entra SO para montar a sombra.
$conectar = static function () use ($env): PDO {
    return new PDO(
        sprintf('mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4',
            $env['DB_PIPE_DSHOW_HOST'], $env['DB_PIPE_DSHOW_PORT'], $env['DB_PIPE_DSHOW_NAME']),
        $env['DB_DSHOWDASH_USER'], $env['DB_DSHOWDASH_PASS'],
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_EMULATE_PREPARES => false,
         PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]
    );
};
$pdo = $conectar();

$falhas = 0;
$checks = 0;
$ok = static function (bool $cond, string $msg) use (&$falhas, &$checks): void {
    $checks++;
    if ($cond) { echo "  [ok] {$msg}\n"; return; }
    $falhas++;
    echo "  [XX] {$msg}\n";
};

// ── Sombra ──────────────────────────────────────────────────────────────────────
// Le as linhas reais ANTES de criar a temporaria: a partir dai o nome resolve para a
// sombra e a real fica inalcancavel nesta conexao (MySQL: "Can't reopen table" se as
// duas aparecem na mesma query).
$cursoresReais = $pdo->query("SELECT * FROM pipe_sync_cursors")->fetchAll();
$antes = [];
foreach ($cursoresReais as $r) { $antes[$r['entity']] = $r['watermark_update_time']; }

foreach (['pipe_sync_cursors', 'pipe_sync_runs'] as $t) {
    $ddl = $pdo->query("SHOW CREATE TABLE {$t}")->fetch()['Create Table'];
    $pdo->exec(preg_replace('/^CREATE TABLE/', 'CREATE TEMPORARY TABLE', $ddl, 1));
}
if ($cursoresReais) {
    $cols = array_keys($cursoresReais[0]);
    $ins = $pdo->prepare('INSERT INTO pipe_sync_cursors (' . implode(',', $cols) . ') VALUES ('
        . implode(',', array_fill(0, count($cols), '?')) . ')');
    foreach ($cursoresReais as $r) { $ins->execute(array_values($r)); }
}
echo "sombra de pipe_sync_cursors/pipe_sync_runs ativa nesta conexao\n";

$svc  = new PipeSyncService($pdo);
$repo = new PipeSyncRepository($pdo);

$syncList = new ReflectionMethod(PipeSyncService::class, 'syncList');
$syncList->setAccessible(true);
$mkClient = new ReflectionMethod(PipeSyncService::class, 'client');
$mkClient->setAccessible(true);
$client = $mkClient->invoke($svc);
if (!$client) { fwrite(STDERR, "sem credencial ativa do Pipedrive\n"); exit(2); }

$entidades = [
    ['leads', 'leads', 'v1root', 'pipe_leads', static fn(array $x) => $repo->upsertLead($x)],
    ['notes', 'notes', 'v1',     'pipe_notes', static fn(array $x) => $repo->upsertNote($x)],
];

foreach ($entidades as [$ent, $path, $ver, $tabela, $upsert]) {
    echo "\n=== {$ent} ===\n";

    foreach ([['24 h', '-24 HOUR'], ['7 dias', '-7 DAY']] as [$rotulo, $intervalo]) {
        $pdo->exec("UPDATE pipe_sync_cursors SET watermark_update_time = DATE_ADD(watermark_update_time, INTERVAL {$intervalo}) WHERE entity = '{$ent}'");
        $marca = $pdo->query("SELECT watermark_update_time w FROM pipe_sync_cursors WHERE entity = '{$ent}'")->fetch()['w'];

        // Contagem INDEPENDENTE do que deveria ser gravado: itens da pagina 1 acima da
        // marca. Vem direto da API, sem passar pelo codigo sob teste.
        $res   = $client->request('GET', $ver, $path, ['sort' => 'update_time DESC', 'limit' => 500, 'start' => 0]);
        $items = $res['data']['data'] ?? ($res['data'] ?? []);
        $esperado = 0;
        foreach ($items as $it) {
            $ut = PipeSyncRepository::dt($it['update_time'] ?? null);
            if ($ut === null || $ut >= $marca) { $esperado++; }
        }

        $out = $syncList->invoke($svc, $client, $ent, $path, $ver, $upsert, 'incremental', ['limit' => 500], true);
        $s = $out['stats'];
        echo "marca rebobinada {$rotulo} ({$marca}): processed={$s['processed']} skipped={$s['skipped']} api={$s['api_calls']}\n";

        $ok($s['processed'] === $esperado, "gravou exatamente os itens acima da marca  {$s['processed']} == {$esperado}");
        $ok($s['processed'] > 0, 'o ramo de GRAVACAO foi exercitado (nao pulou tudo)');
        $ok($s['skipped'] > 0, 'o ramo de PULO foi exercitado');
        $ok((int)$s['errors'] === 0, 'zero erros');
        $ok((int)$s['api_calls'] === 1, 'segue 1 chamada de API — pular nao adiciona trafego');

        // O risco real do pulo: descartar algo que mudou e ficar com a linha velha.
        $st = $pdo->prepare("SELECT update_time FROM {$tabela} WHERE pipedrive_id = :id");
        $divergentes = 0;
        foreach ($items as $it) {
            $ut = PipeSyncRepository::dt($it['update_time'] ?? null);
            if ($ut === null || $ut < $marca) { continue; }
            $st->execute([':id' => (string)$it['id']]);
            $db = $st->fetchColumn();
            if ($db === false || (string)$db !== (string)$ut) { $divergentes++; }
        }
        $ok($divergentes === 0, "nenhum item acima da marca ficou desatualizado no banco  {$divergentes} divergente(s)");
    }
}

// ── Guarda: producao intocada ───────────────────────────────────────────────────
echo "\n=== guarda ===\n";
$pdo2 = $conectar();
foreach ($pdo2->query("SELECT entity, watermark_update_time w FROM pipe_sync_cursors WHERE entity IN ('leads','notes')") as $r) {
    $ok((string)$r['w'] === (string)$antes[$r['entity']], "cursor real de {$r['entity']} intacto  {$r['w']}");
}

echo "\n" . ($falhas === 0
    ? "PASSOU — {$checks} checagens, 0 falha(s)\n"
    : "REPROVOU — {$falhas} falha(s) em {$checks} checagens\n");
exit($falhas === 0 ? 0 : 1);
