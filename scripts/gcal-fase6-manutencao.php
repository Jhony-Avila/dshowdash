<?php
// Fase 6 — prova da manutenção dos `dead` e da abertura de canais push, SEM banco e SEM Google
// @module google-calendar.fase6.prova
// @version 1.0.0
// @created 2026-10-29 (Q-V9.6/Q-V9.7 do APP DSHOW)
//
//     php scripts/gcal-fase6-manutencao.php          (exit 0 = tudo ok; roda em qualquer clone, não precisa de .env)
//
// PDO FALSO: prepare() casa a SQL normalizada com regex → linhas/afetadas; cada execute fica registrado.
// É o que permite provar, sem tocar GCAL_DSHOW: notFound → calendário apagado + job cancelled; 1265 fica
// `dead`; migração 02e ausente não derruba o cron; requeue recusa permanente; agendador só enfileira
// calendário vivo; watch_renew nasce quando falta canal e respeita o freio de 1 h; abrirFaltantes isola falha.
declare(strict_types=1);

if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
$raiz = dirname(__DIR__);
require_once $raiz . '/api/google-calendar/lib/Tz.php';
require_once $raiz . '/api/google-calendar/lib/GcalCrypto.php';
require_once $raiz . '/api/google-calendar/lib/GoogleOAuth.php';
require_once $raiz . '/api/google-calendar/lib/GcalTransport.php';
require_once $raiz . '/api/google-calendar/lib/GcalNormalizer.php';
require_once $raiz . '/api/google-calendar/lib/GoogleCalendarClient.php';
require_once $raiz . '/api/google-calendar/repositories/GcalRepository.php';
require_once $raiz . '/api/google-calendar/services/GcalAuthService.php';
require_once $raiz . '/api/google-calendar/services/GcalSyncService.php';
require_once $raiz . '/api/google-calendar/services/GcalWatchService.php';
require_once $raiz . '/api/google-calendar/services/GcalQueueService.php';
require_once $raiz . '/api/google-calendar/services/GcalManutencaoService.php';

$ok = 0; $falhas = [];
$check = static function (string $n, bool $c, string $o = '') use (&$ok, &$falhas): void {
    if ($c) { $ok++; printf("  ok      %s %s\n", $n, $o); }
    else    { $falhas[] = $n; printf("  FALHA   %s %s\n", $n, $o); }
};
$secao = static fn(string $t) => printf("\n%s\n%s\n", $t, str_repeat('─', mb_strlen($t)));

// ── PDO falso ───────────────────────────────────────────────────────────
class StmtFalso6 extends PDOStatement
{
    public array $binds = [];
    public function __construct(public string $sql, private array $linhas = [], private int $afetadas = 0, private ?PdoFalso6 $pdo = null) {}
    public function execute(?array $params = null): bool { $this->binds = $params ?? []; if ($this->pdo) $this->pdo->executadas[] = [$this->sql, $this->binds]; return true; }
    public function fetch(int $mode = PDO::FETCH_DEFAULT, int $cursorOrientation = PDO::FETCH_ORI_NEXT, int $cursorOffset = 0): mixed { return $this->linhas[0] ?? false; }
    public function fetchColumn(int $column = 0): mixed { $l = $this->linhas[0] ?? null; return $l === null ? false : (array_values($l)[$column] ?? false); }
    public function fetchAll(int $mode = PDO::FETCH_DEFAULT, mixed ...$args): array
    { return $mode === PDO::FETCH_COLUMN ? array_map(static fn($l) => array_values($l)[0], $this->linhas) : $this->linhas; }
    public function rowCount(): int { return $this->afetadas; }
    public function getIterator(): Iterator { return new ArrayIterator($this->linhas); }
}
final class PdoFalso6 extends PDO
{
    public array $executadas = [];
    /** @var array<string,array{linhas?:array,afetadas?:int}> regex → resposta */
    public array $respostas = [];
    /** @var array<string,string> regex → mensagem: prepare() lança PDOException */
    public array $lancar = [];
    public function __construct() {}
    public function setAttribute(int $attribute, mixed $value): bool { return true; }
    public function prepare(string $query, array $options = []): PDOStatement|false
    {
        $norm = preg_replace('/\s+/', ' ', trim($query));
        foreach ($this->lancar as $re => $msg) { if (preg_match($re, $norm)) throw new PDOException($msg); }
        foreach ($this->respostas as $re => $r) {
            if (preg_match($re, $norm)) return new StmtFalso6($norm, $r['linhas'] ?? [], $r['afetadas'] ?? 0, $this);
        }
        return new StmtFalso6($norm, [], 0, $this);
    }
    public function query(string $query, ?int $fetchMode = null, mixed ...$fetchModeArgs): PDOStatement|false
    { $st = $this->prepare($query); $st->execute([]); return $st; }
    public function lastInsertId(?string $name = null): string|false { return '77'; }
    public function beginTransaction(): bool { return true; }
    public function commit(): bool { return true; }
    public function rollBack(): bool { return true; }
    public function inTransaction(): bool { return false; }
    public function sqlExecutadas(string $re): array { return array_values(array_filter($this->executadas, static fn($e) => preg_match($re, $e[0]))); }
}
const RE_MORTOS   = '/^SELECT j\.id, j\.account_id, j\.calendar_id.* WHERE j\.status = \'dead\'/';
const RE_CAL_DEL  = '/^UPDATE gcal_calendars SET deleted = 1 WHERE account_id = :a AND calendar_id = :c AND deleted = 0/';
const RE_CANCEL   = '/^UPDATE gcal_sync_jobs SET status = \'cancelled\'/';
const RE_REQUEUE  = '/^UPDATE gcal_sync_jobs SET status = \'pending\', attempts = 0/';
const RE_DEVIDOS  = '/^SELECT s\.account_id, s\.calendar_id, s\.status FROM gcal_sync_state s/';
const RE_SEMCANAL = '/^SELECT c\.account_id, c\.calendar_id, c\.access_role FROM gcal_calendars c/';
const RE_RECENTE  = '/^SELECT 1 FROM gcal_sync_jobs WHERE kind = \'watch_renew\'/';
const RE_QUALQUER = '/^SELECT id FROM gcal_accounts WHERE is_active = 1 LIMIT 1/';
const RE_INSERT   = '/^INSERT INTO gcal_sync_jobs/';

$mortos = [
    ['id' => 101, 'account_id' => 1, 'calendar_id' => 'apagado@group.calendar.google.com', 'kind' => 'incremental', 'attempts' => 1,
     'started_at' => '2026-10-20 10:00:00', 'finished_at' => '2026-10-20 10:00:01', 'last_error' => 'Google Calendar recusou a chamada (notFound)', 'error_code' => 'notFound'],
    ['id' => 102, 'account_id' => 1, 'calendar_id' => 'apagado@group.calendar.google.com', 'kind' => 'full', 'attempts' => 1,
     'started_at' => '2026-10-20 10:05:00', 'finished_at' => '2026-10-20 10:05:01', 'last_error' => 'Google Calendar recusou a chamada (notFound)', 'error_code' => null],
    ['id' => 103, 'account_id' => 1, 'calendar_id' => 'principal@dshow.com.br', 'kind' => 'incremental', 'attempts' => 6,
     'started_at' => '2026-10-27 09:00:00', 'finished_at' => '2026-10-27 09:40:00', 'last_error' => "SQLSTATE[01000]: Warning: 1265 Data truncated for column 'event_type'", 'error_code' => 'erro'],
    ['id' => 104, 'account_id' => 2, 'calendar_id' => 'x@dshow.com.br', 'kind' => 'incremental', 'attempts' => 1,
     'started_at' => '2026-10-27 09:00:00', 'finished_at' => '2026-10-27 09:00:01', 'last_error' => 'Google Calendar recusou a chamada (forbidden)', 'error_code' => 'forbidden'],
];
$novoPdo = static function () use ($mortos): PdoFalso6 {
    $p = new PdoFalso6();
    $p->respostas = [
        RE_MORTOS  => ['linhas' => $mortos],
        RE_CAL_DEL => ['afetadas' => 1],
        RE_CANCEL  => ['afetadas' => 1],
        RE_REQUEUE => ['afetadas' => 1],
        RE_QUALQUER => ['linhas' => [['id' => 1]]],
    ];
    return $p;
};

echo "\nFASE 6 — MANUTENÇÃO DOS DEAD E CANAIS PUSH\n", str_repeat('═', 74), "\n";

$secao('1. Motivo deduzido');
$pdo = $novoPdo(); $repo = new GcalRepository($pdo); $m = new GcalManutencaoService($repo);
$lista = $m->listarMortos();
$check('4 dead listados', count($lista) === 4);
$check('error_code manda (101 = notFound)', $lista[0]['motivo'] === 'notFound' && $lista[0]['permanente']);
$check('sem error_code cai na mensagem "(notFound)" (102)', $lista[1]['motivo'] === 'notFound');
$check('1265 = "erro", NÃO permanente (103)', $lista[2]['motivo'] === 'erro' && !$lista[2]['permanente']);
$check('forbidden é permanente (104)', $lista[3]['permanente']);

$secao('2. tratarMortos: notFound → calendário apagado + cancelled; o resto fica');
$r = $m->tratarMortos();
$check('2 cancelados (101, 102), 2 restantes', $r['cancelados'] === 2 && $r['restantes'] === 2, json_encode([$r['cancelados'], $r['restantes']]));
$check('UPDATE gcal_calendars deleted=1 só para o calendário apagado', count($pdo->sqlExecutadas(RE_CAL_DEL)) === 2
    && $pdo->sqlExecutadas(RE_CAL_DEL)[0][1][':c'] === 'apagado@group.calendar.google.com');
$cancel = $pdo->sqlExecutadas(RE_CANCEL);
$check('UPDATE … cancelled para 101 e 102, com WHERE status = dead', count($cancel) === 2 && $cancel[0][1][':id'] === 101 && str_contains($cancel[0][0], "AND status = 'dead'"));
$check('nenhum UPDATE em 103/104', !array_filter($cancel, static fn($e) => in_array($e[1][':id'], [103, 104], true)));
$check('sem erro', $r['erro'] === null);
$pdo2 = $novoPdo(); $m2 = new GcalManutencaoService(new GcalRepository($pdo2));
$r2 = $m2->tratarMortos(true);
$check('dry-run conta (2) e não grava nada', $r2['cancelados'] === 2 && !$pdo2->sqlExecutadas(RE_CANCEL) && !$pdo2->sqlExecutadas(RE_CAL_DEL));

$secao('3. Migração 02e ausente: ENUM recusa cancelled → erro reportado, sem exceção');
$pdo3 = $novoPdo(); $pdo3->lancar = [RE_CANCEL => "SQLSTATE[01000]: Warning: 1265 Data truncated for column 'status' at row 1"];
$m3 = new GcalManutencaoService(new GcalRepository($pdo3));
try { $r3 = $m3->tratarMortos(); $lancou = false; } catch (\Throwable $e) { $lancou = true; $r3 = ['erro' => null, 'cancelados' => -1]; }
$check('não lança', !$lancou);
$check('erro menciona a migração 02e e nada é contado como cancelado', $r3['erro'] !== null && str_contains($r3['erro'], '02e') && $r3['cancelados'] === 0);

$secao('4. reenfileirar: só os NÃO permanentes');
$pdo4 = $novoPdo(); $m4 = new GcalManutencaoService(new GcalRepository($pdo4));
$r4 = $m4->reenfileirar(null);
$check('all: 1 reenfileirado (103), 3 recusados', $r4['reenfileirados'] === 1 && $r4['recusados'] === 3);
$req = $pdo4->sqlExecutadas(RE_REQUEUE);
$check('UPDATE pending/attempts=0 só para 103, com WHERE status = dead', count($req) === 1 && $req[0][1][':id'] === 103 && str_contains($req[0][0], "AND status = 'dead'"));
$pdo5 = $novoPdo(); $m5 = new GcalManutencaoService(new GcalRepository($pdo5));
$r5 = $m5->reenfileirar(104);
$check('id permanente (104) é recusado e nada é gravado', $r5['reenfileirados'] === 0 && $r5['recusados'] === 1 && !$pdo5->sqlExecutadas(RE_REQUEUE));
$r6 = $m5->reenfileirar(103, true);
$check('dry-run de um id conta sem gravar', $r6['reenfileirados'] === 1 && !$pdo5->sqlExecutadas(RE_REQUEUE));

$secao('5. agendarDevidos: só calendários vivos; watch_renew quando falta canal, no máximo 1/h');
putenv('GCAL_WEBHOOK_URL=https://dshowdash.com.br/api/google-calendar/webhook');
$fila = static function (PdoFalso6 $p): GcalQueueService {
    $repo = new GcalRepository($p); $auth = new GcalAuthService($repo);
    return new GcalQueueService($repo, $auth, new GcalSyncService($repo, $auth), new GcalWatchService($repo, $auth));
};
$semCanal = [['account_id' => 1, 'calendar_id' => 'principal@dshow.com.br', 'access_role' => 'owner']];
$p = $novoPdo(); $p->respostas[RE_SEMCANAL] = ['linhas' => $semCanal]; $p->respostas[RE_RECENTE] = ['linhas' => []];
$n = $fila($p)->agendarDevidos();
$devidos = $p->sqlExecutadas(RE_DEVIDOS);
$check('consulta dos devidos faz JOIN em gcal_calendars com c.deleted = 0', count($devidos) === 1
    && str_contains($devidos[0][0], 'JOIN gcal_calendars c ON c.account_id = s.account_id AND c.calendar_id = s.calendar_id AND c.deleted = 0'));
$ins = $p->sqlExecutadas(RE_INSERT);
$check('watch_renew enfileirado (falta canal, nenhum recente, webhook https)', $n['watch_renew'] === 1 && count($ins) === 1 && $ins[0][1][':k'] === 'watch_renew');
$p = $novoPdo(); $p->respostas[RE_SEMCANAL] = ['linhas' => $semCanal]; $p->respostas[RE_RECENTE] = ['linhas' => [[1]]];
$n = $fila($p)->agendarDevidos();
$check('freio: watch_renew recente → não enfileira de novo', $n['watch_renew'] === 0 && !$p->sqlExecutadas(RE_INSERT));
$p = $novoPdo(); $p->respostas[RE_SEMCANAL] = ['linhas' => []]; $p->respostas[RE_RECENTE] = ['linhas' => []];
$n = $fila($p)->agendarDevidos();
$check('todos com canal e nada a vencer → nenhum watch_renew', $n['watch_renew'] === 0 && !$p->sqlExecutadas(RE_INSERT));
putenv('GCAL_WEBHOOK_URL=http://localhost/webhook');
$p = $novoPdo(); $p->respostas[RE_SEMCANAL] = ['linhas' => $semCanal]; $p->respostas[RE_RECENTE] = ['linhas' => []];
$n = $fila($p)->agendarDevidos();
$check('webhook não https → não abre canal (nem enfileira)', $n['watch_renew'] === 0 && !$p->sqlExecutadas(RE_INSERT));
putenv('GCAL_WEBHOOK_URL=https://dshowdash.com.br/api/google-calendar/webhook');

$secao('6. abrirFaltantes: isola falha, respeita configurado()');
$p = $novoPdo(); $p->respostas[RE_SEMCANAL] = ['linhas' => [
    ['account_id' => 1, 'calendar_id' => 'ok@dshow.com.br', 'access_role' => 'owner'],
    ['account_id' => 1, 'calendar_id' => 'recusa@dshow.com.br', 'access_role' => 'reader'],
]];
$repo = new GcalRepository($p); $w = new GcalWatchService($repo, new GcalAuthService($repo));
$chamados = [];
$r = $w->abrirFaltantes(static function (int $a, string $c) use (&$chamados): array {
    $chamados[] = $c;
    if ($c === 'recusa@dshow.com.br') throw new RuntimeException('Google Calendar recusou a chamada (forbidden)');
    return ['channel_id' => 'uuid', 'expiration' => '2026-11-05 00:00:00'];
});
$check('abre o que dá, registra a falha do outro', $r['abertos'] === 1 && $r['falhas'] === 1 && $chamados === ['ok@dshow.com.br', 'recusa@dshow.com.br']);
$check('detalhe traz expiração do aberto e erro do recusado', ($r['detalhe'][0]['expira'] ?? null) === '2026-11-05 00:00:00' && str_contains($r['detalhe'][1]['erro'] ?? '', 'forbidden'));
putenv('GCAL_WEBHOOK_URL=http://localhost/webhook');
$r = $w->abrirFaltantes(static function (int $a, string $c): array { throw new LogicException('não devia chamar'); });
$check('sem webhook https → não tenta nada', $r['abertos'] === 0 && $r['falhas'] === 0);
putenv('GCAL_WEBHOOK_URL=https://dshowdash.com.br/api/google-calendar/webhook');

$secao('7. Guardas textuais (as duas listas de motivos permanentes continuam iguais)');
$fonteFila = file_get_contents($raiz . '/api/google-calendar/services/GcalQueueService.php');
preg_match("/in_array\(\\\$e->motivo, \[([^\]]+)\]/s", $fonteFila, $mm);
$listaFila = array_map(static fn($s) => trim($s, " '\n\r\t"), explode(',', $mm[1] ?? ''));
$check('GcalQueueService::drenar e GcalManutencaoService::MOTIVOS_PERMANENTES iguais', $listaFila === GcalManutencaoService::MOTIVOS_PERMANENTES, json_encode($listaFila));
$fonteCron = file_get_contents($raiz . '/scripts/gcal-cron.php');
$check('gcal-cron.php chama tratarMortos() e trata o erro sem derrubar', str_contains($fonteCron, '->tratarMortos()') && str_contains($fonteCron, "\$m['erro'] !== null"));
$fonteSql = file_get_contents($raiz . '/docs/GOOGLE-CALENDAR/02-banco-GCAL_DSHOW.sql');
$check("02-banco documenta 'cancelled' no ENUM de gcal_sync_jobs.status", str_contains($fonteSql, "'dead','cancelled'"));
$fonteTsx = file_get_contents($raiz . '/public/components/panels/panel-google-calendar/src/screens/Admin.tsx');
$check('Admin.tsx decide o texto do go-live pelo passo provider', str_contains($fonteTsx, "i.id === 'provider'") && str_contains($fonteTsx, 'Provedor Google ativo'));

printf("\n%s\n%d ok · %d falha(s)%s\n", str_repeat('═', 74), $ok, count($falhas), $falhas ? ': ' . implode(' | ', $falhas) : '');
exit($falhas ? 1 : 0);
