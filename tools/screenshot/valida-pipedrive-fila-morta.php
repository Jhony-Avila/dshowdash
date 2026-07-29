<?php
// Prova do #41 (fila morta em massa) com o CODIGO REAL do PipeQueueRepository.
//
// Por que sandbox: pipe_sync_jobs em producao tem ZERO mortos (3.597 jobs, 100% done),
// entao nenhum ramo novo e exercitado pelo caminho feliz. E o cron drena a fila A CADA
// MINUTO — inserir mortos sinteticos na tabela real faria o worker chamar a API do
// Pipedrive com ids inexistentes.
//
// Como: CREATE TEMPORARY TABLE pipe_sync_jobs SOMBREIA a tabela real dentro desta
// conexao. O repositorio real opera sobre ela sem saber; nenhuma outra conexao (nem o
// cron) enxerga; ao fechar o script a tabela evapora. Producao permanece intocada.
declare(strict_types=1);

$env = [];
foreach (file('/var/www/dshowdash/.env') as $l) {
    if (preg_match('/^([A-Z0-9_]+)=(.*)$/', trim($l), $m)) { $env[$m[1]] = $m[2]; }
}
// Credencial: o usuario do modulo (pipe_app) NAO tem CREATE TEMPORARY TABLES — grant
// e' CREATE, que e' outro privilegio. Para a sombra usamos a credencial administrativa,
// e SO para isso: nenhuma escrita desta prova alcanca a tabela real (guarda no fim).
// Preferida a temporaria em vez de criar banco/tabela de teste justamente por nao
// deixar objeto nenhum para tras.
$pdo = new PDO(
    sprintf('mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4',
        $env['DB_PIPE_DSHOW_HOST'], $env['DB_PIPE_DSHOW_PORT'], $env['DB_PIPE_DSHOW_NAME']),
    $env['DB_DSHOWDASH_USER'], $env['DB_DSHOWDASH_PASS'],
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_EMULATE_PREPARES => false,
     PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]
);

require_once '/var/www/dshowdash/api/pipedrive/repositories/QueueRepository.php';

// ── Guarda: so seguimos se a temporaria estiver mesmo sombreando ────
$antesReal = (int)$pdo->query("SELECT COUNT(*) FROM pipe_sync_jobs")->fetchColumn();
// "CREATE TEMPORARY TABLE x LIKE x" e recusado (1066: alias nao unico) — o LIKE
// resolve o nome ja com a temporaria em escopo. Reaproveitamos o DDL real.
$ddl = $pdo->query("SHOW CREATE TABLE pipe_sync_jobs")->fetch()['Create Table'];
$pdo->exec(preg_replace('/^CREATE TABLE/', 'CREATE TEMPORARY TABLE', $ddl, 1));
$agora = (int)$pdo->query("SELECT COUNT(*) FROM pipe_sync_jobs")->fetchColumn();
if ($agora !== 0) {
    fwrite(STDERR, "ABORTADO: a temporaria nao sombreou (contagem=$agora). Nada foi escrito.\n");
    exit(2);
}
printf("sandbox ativo: tabela real tem %d linhas, a sombra tem 0.\n", $antesReal);

$repo = new PipeQueueRepository($pdo);
$falhas = 0; $checagens = 0;

function ok(string $titulo, bool $cond, string $detalhe = ''): void {
    global $falhas, $checagens;
    $checagens++;
    if (!$cond) { $falhas++; printf("  [X] %s %s\n", $titulo, $detalhe); }
    else        { printf("  [ok] %s %s\n", $titulo, $detalhe); }
}

function semear(PDO $pdo): void {
    $pdo->exec("DELETE FROM pipe_sync_jobs");
    $ins = $pdo->prepare(
        "INSERT INTO pipe_sync_jobs (id, job_type, entity, external_id, priority, status, attempts, last_error, created_at, processed_at)
         VALUES (:id,'webhook',:e,:x,5,:s,:a,:err,NOW(),:p)"
    );
    // 3 mortos do MESMO negocio 500 (o caso que o colapso existe para resolver),
    // 1 morto de outro negocio, 2 mortos de activity, 1 job 'done' e 1 'pending'
    // no mesmo alvo de um morto (nao podem ser tocados pelo lote).
    $linhas = [
        [1, 'deal', '500', 'dead', 5, 'HTTP 500 upstream',       '2026-07-20 10:00:00'],
        [2, 'deal', '500', 'dead', 5, 'HTTP 500 upstream',       '2026-07-21 10:00:00'],
        [3, 'deal', '500', 'dead', 5, 'HTTP 500 upstream',       '2026-07-22 10:00:00'],
        [4, 'deal', '777', 'dead', 5, 'timeout ao re-buscar',    '2026-07-22 11:00:00'],
        [5, 'activity', '900', 'dead', 5, 'HTTP 403 sem escopo', '2026-07-22 12:00:00'],
        [6, 'activity', '901', 'dead', 5, 'HTTP 403 sem escopo', '2026-07-22 12:30:00'],
        [7, 'deal', '500', 'done', 0, null,                      '2026-07-23 09:00:00'],
        [8, 'deal', '777', 'pending', 0, null,                   null],
    ];
    foreach ($linhas as [$id, $e, $x, $s, $a, $err, $p]) {
        $ins->execute([':id' => $id, ':e' => $e, ':x' => $x, ':s' => $s, ':a' => $a, ':err' => $err, ':p' => $p]);
    }
}

$st = static fn(PDO $p, int $id): array => $p->query("SELECT status, last_error, attempts, next_attempt_at FROM pipe_sync_jobs WHERE id=$id")->fetch();

// ── 1. Agregados ───────────────────────────────────────────────────
echo "\n=== 1. deadStats / deadEntities ===\n";
semear($pdo);
$s = $repo->deadStats();
ok('total de mortos = 6',        $s['total'] === 6, "(veio {$s['total']})");
ok('alvos distintos = 4',        $s['alvos'] === 4, "(veio {$s['alvos']}) — 3 mortos do deal 500 sao UM alvo");
ok('entidades so as com morto',  $repo->deadEntities() === ['activity', 'deal'], json_encode($repo->deadEntities()));
$deal = array_values(array_filter($s['por_entidade'], static fn($r) => $r['entity'] === 'deal'))[0];
ok('deal: 4 mortos / 2 alvos',   $deal['total'] === 4 && $deal['alvos'] === 2);
ok('por_erro agrupa a mesma falha', (array_values(array_filter($s['por_erro'], static fn($r) => str_starts_with($r['erro'], 'HTTP 500')))[0]['total'] ?? 0) === 3);

// ── 2. Listagem ────────────────────────────────────────────────────
echo "\n=== 2. listDead ===\n";
$l = $repo->listDead(null, 1, 25);
ok('sem filtro lista os 6',      $l['total'] === 6 && count($l['itens']) === 6);
ok('nao vaza done/pending',      !in_array('7', array_column($l['itens'], 'id'), false) && !in_array('8', array_column($l['itens'], 'id'), false));
$l2 = $repo->listDead('activity', 1, 25);
ok('filtro activity = 2',        $l2['total'] === 2);
$p1 = $repo->listDead(null, 1, 4); $p2 = $repo->listDead(null, 2, 4);
ok('paginacao 4+2 sem repetir',  count($p1['itens']) === 4 && count($p2['itens']) === 2
                                 && !array_intersect(array_column($p1['itens'], 'id'), array_column($p2['itens'], 'id')));
ok('paginas calculadas = 2',     $p1['paginas'] === 2);

// ── 3. O caso central: colapso por alvo ────────────────────────────
echo "\n=== 3. requeueDeadBulk — colapso por alvo ===\n";
semear($pdo);
$r = $repo->requeueDeadBulk([1, 2, 3], null, 200);
ok('1 reenfileirado, nao 3',     $r['reenfileirados'] === 1, json_encode($r));
ok('2 irmaos colapsados',        $r['colapsados'] === 2);
ok('custo = 1 chamada de API',   $r['alvos'] === 1);
ok('o lider e o MAIS RECENTE',   $st($pdo, 3)['status'] === 'pending', 'job 3 (22/07) é o líder');
ok('lider zera attempts/erro',   $st($pdo, 3)['attempts'] === 0 && $st($pdo, 3)['last_error'] === null);
ok('lider tem next_attempt_at',  $st($pdo, 3)['next_attempt_at'] !== null);
ok('irmao 1 sai de dead',        $st($pdo, 1)['status'] === 'done');
ok('irmao guarda quem assumiu',  $st($pdo, 1)['last_error'] === 'COALESCIDO_NO_JOB_3', $st($pdo, 1)['last_error'] ?? 'null');
ok('done alheio intocado',       $st($pdo, 7)['status'] === 'done' && $st($pdo, 7)['last_error'] === null);
ok('pending alheio intocado',    $st($pdo, 8)['status'] === 'pending');
ok('mortos de outra entidade ficam', $repo->deadStats()['total'] === 3);

// ── 4. Teto conta ALVOS, nao linhas ────────────────────────────────
// Politica: quando o teto corta, sobrevivem os alvos MAIS RECENTES — a mesma ordem
// da listagem, para que o operador reprocesse o que esta vendo no topo da tela.
// Em 'deal' ha 2 alvos: 777 (morto as 11h) e 500 (as 10h, com 3 linhas).
echo "\n=== 4. teto por alvo + restantes ===\n";
semear($pdo);
$r = $repo->requeueDeadBulk(null, 'deal', 1);   // 4 mortos, 2 alvos, teto 1 alvo
ok('teto 1 => 1 reenfileirado',  $r['reenfileirados'] === 1, json_encode($r));
ok('o teto escolhe o mais recente', $r['ids'] === [4], 'alvo 777 (11h) antes do 500 (10h)');
ok('alvo sem irmao => 0 colapso', $r['colapsados'] === 0);
ok('declara 1 alvo restante',    $r['restantes'] === 1);
ok('as 3 linhas do 500 seguem mortas', $repo->listDead('deal', 1, 25)['total'] === 3);
ok('nenhum morto de activity tocado',  $repo->listDead('activity', 1, 25)['total'] === 2);

// Segunda passada: o que sobrou do teto e' recuperavel sem intervencao manual.
$r2 = $repo->requeueDeadBulk(null, 'deal', 1);
ok('2a passada pega o alvo restante', $r2['reenfileirados'] === 1 && $r2['ids'] === [3], json_encode($r2));
ok('e agora colapsa os 2 irmaos',     $r2['colapsados'] === 2);
ok('deal zerado apos as 2 passadas',  $repo->listDead('deal', 1, 25)['total'] === 0);

// Teto conta ALVOS e nao linhas: 3 linhas de um alvo so cabem sob teto 1.
semear($pdo);
$r3 = $repo->requeueDeadBulk([1, 2, 3], null, 1);
ok('teto 1 cabe alvo de 3 linhas', $r3['reenfileirados'] === 1 && $r3['colapsados'] === 2, json_encode($r3));
ok('e nao sobra restante',         $r3['restantes'] === 0);

// ── 5. Filtro por entidade ─────────────────────────────────────────
echo "\n=== 5. recorte por entidade ===\n";
semear($pdo);
$r = $repo->requeueDeadBulk(null, 'activity', 200);
ok('so activity (2 alvos)',      $r['reenfileirados'] === 2 && $r['colapsados'] === 0);
ok('deal permanece morto',       $repo->listDead('deal', 1, 25)['total'] === 4);

// ── 6. "Nada" nunca vira "tudo" ────────────────────────────────────
echo "\n=== 6. sem alvo = operacao nula ===\n";
semear($pdo);
foreach ([[null, null], [[], null], [[0, -5], null]] as $i => [$ids, $ent]) {
    $r = $repo->requeueDeadBulk($ids, $ent, 200);
    ok("chamada sem alvo #$i nao move nada", $r['reenfileirados'] === 0 && $r['colapsados'] === 0);
}
ok('os 6 mortos continuam la',   $repo->deadStats()['total'] === 6);

// ── 7. Idempotencia ────────────────────────────────────────────────
echo "\n=== 7. repetir o lote nao duplica trabalho ===\n";
semear($pdo);
$a = $repo->requeueDeadBulk([1, 2, 3], null, 200);
$b = $repo->requeueDeadBulk([1, 2, 3], null, 200);   // ninguem mais esta 'dead'
ok('2a chamada e no-op',         $b['reenfileirados'] === 0 && $b['colapsados'] === 0, json_encode($b));
ok('lider segue pending (1 so)', $st($pdo, 3)['status'] === 'pending');

// ── 8. Ids inexistentes / de outro status ──────────────────────────
echo "\n=== 8. ids invalidos ===\n";
semear($pdo);
$r = $repo->requeueDeadBulk([7, 8, 99999], null, 200);  // done, pending e inexistente
ok('nada reenfileirado',         $r['reenfileirados'] === 0 && $r['colapsados'] === 0, json_encode($r));
ok('job done intocado',          $st($pdo, 7)['status'] === 'done');
ok('job pending intocado',       $st($pdo, 8)['status'] === 'pending');

// ── 9. Teto maximo e' respeitado mesmo se pedirem mais ─────────────
echo "\n=== 9. teto maximo ===\n";
semear($pdo);
$r = $repo->requeueDeadBulk(null, 'deal', 99999);
ok('limite absurdo nao estoura', $r['reenfileirados'] <= PipeQueueRepository::REQUEUE_MAX);
ok('REQUEUE_MAX exposto = 200',  PipeQueueRepository::REQUEUE_MAX === 200);

// ── Encerramento: a producao nao foi tocada ────────────────────────
$pdo->exec("DROP TEMPORARY TABLE pipe_sync_jobs");
$depoisReal = (int)$pdo->query("SELECT COUNT(*) FROM pipe_sync_jobs")->fetchColumn();
$mortosReais = (int)$pdo->query("SELECT COUNT(*) FROM pipe_sync_jobs WHERE status='dead'")->fetchColumn();
echo "\n=== producao ===\n";
ok('tabela real com o mesmo total', $depoisReal === $antesReal, "($antesReal -> $depoisReal)");
ok('producao segue sem mortos',     $mortosReais === 0);

printf("\n%s — %d checagens, %d falha(s)\n", $falhas === 0 ? 'PASSOU' : 'REPROVOU', $checagens, $falhas);
exit($falhas === 0 ? 0 : 1);
