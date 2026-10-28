<?php
// scripts/gcal-homologacao.php — auditoria de HOMOLOGACAO do Google Calendar (Fase 8).
// @version 1.0.0  @created 2026-07-30
//
// Diferente do gcal-smoke-all.php, que verifica se o modulo FUNCIONA, esta
// suite verifica se ele esta CORRETO nos criterios do briefing: seguranca
// (§74, §86), privacidade/LGPD (§75), fusos (§47), recorrencia (§19-§20),
// multiplas contas (§55) e performance (§77).
//
// Auditoria de CODIGO + de COMPORTAMENTO. Regex sozinho da falso positivo; por
// isso, sempre que da, o check exercita o comportamento de verdade.
//
// Rodar: php scripts/gcal-homologacao.php   (exit 0 = homologado)
declare(strict_types=1);
error_reporting(E_ALL);
ini_set('display_errors', '1');

$_SESSION = [];
putenv('GCAL_PROVIDER=mock');
$_ENV['GCAL_PROVIDER'] = 'mock';

$API  = '/var/www/dshowdash/api/google-calendar';
$SRC  = '/var/www/dshowdash/public/components/panels/panel-google-calendar/src';

require_once '/var/www/dshowdash/config/db_connection.php';
require_once $API . '/lib/Tz.php';
require_once $API . '/lib/GcalProvider.php';
require_once $API . '/lib/GcalProviderBase.php';
require_once $API . '/lib/GcalCrypto.php';
require_once $API . '/lib/GcalLinks.php';
require_once $API . '/lib/GcalReports.php';
require_once $API . '/lib/GcalMock.php';

$falhas = 0; $avisos = 0;
function ok(string $t, bool $c, string $x = ''): void {
    global $falhas;
    if (!$c) { $falhas++; echo "  [FALHA] $t $x\n"; } else { echo "  [ok]    $t $x\n"; }
}
function aviso(string $t, string $x = ''): void {
    global $avisos; $avisos++; echo "  [aviso] $t $x\n";
}
function arquivos(string $dir, string $ext): array {
    $out = [];
    $it = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($dir));
    foreach ($it as $f) { if ($f->isFile() && str_ends_with($f->getFilename(), $ext)) $out[] = $f->getPathname(); }
    return $out;
}

echo "═══════════════════════════════════════════════════════════\n";
echo "  HOMOLOGAÇÃO — Google Calendar (Fase 8)\n";
echo "═══════════════════════════════════════════════════════════\n";

// ═══════════════════════════════════════════════════════════════════════
echo "\n▸ SEGURANÇA (§74, §86)\n";
// ═══════════════════════════════════════════════════════════════════════

$index = file_get_contents($API . '/index.php');

ok('gate de sessão antes do roteamento',
   str_contains($index, 'SessionGate::start()') && str_contains($index, 'gcal_require_access()'));
ok('CSRF central para toda escrita',
   str_contains($index, 'AuthHelpers::requireCsrfForWrite()'));
// O gate de CSRF tem de vir ANTES do switch, senao uma rota nova nasce sem ele.
$posCsrf = strpos($index, 'requireCsrfForWrite');
$posSwitch = strpos($index, 'switch ($segments[0]');
ok('CSRF vem ANTES do switch (rota nova já nasce protegida)',
   $posCsrf !== false && $posSwitch !== false && $posCsrf < $posSwitch);
ok('display_errors desligado (não vaza stack/path)',
   str_contains($index, "@ini_set('display_errors', '0')"));
ok('handler de exceção não devolve a mensagem crua',
   str_contains($index, 'ERR_INTERNAL_ERROR') && str_contains($index, 'Erro interno'));

// Toda concatenacao de variavel dentro de SQL e suspeita.
$sqlRaw = 0; $ondeRaw = [];
foreach (arquivos($API, '.php') as $f) {
    foreach (file($f) as $n => $linha) {
        if (preg_match('/(SELECT|INSERT|UPDATE|DELETE|FROM|WHERE)\s.*\.\s*\$/i', $linha)
            && !str_contains($linha, 'self::LIMITE')) {
            $sqlRaw++; $ondeRaw[] = basename($f) . ':' . ($n + 1);
        }
    }
}
ok('nenhuma interpolação de variável em SQL', $sqlRaw === 0, implode(' ', $ondeRaw));

// LIMITE e constante inteira do proprio codigo — nao vem do usuario.
ok('LIMIT usa constante, não entrada do usuário',
   (bool)preg_match('/private const LIMITE\s*=\s*\d+/', file_get_contents($API . '/lib/GcalLinks.php')));

$links = file_get_contents($API . '/lib/GcalLinks.php');
ok('GcalLinks é somente leitura',
   preg_match_all('/\b(INSERT|UPDATE|DELETE|REPLACE|DROP|ALTER|TRUNCATE|GRANT)\s/i', $links) === 0);
ok('GcalLinks usa prepare/execute em toda consulta',
   substr_count($links, '->prepare(') === substr_count($links, '->execute('));

// Nenhum segredo pode sair para o cliente.
$vazou = [];
foreach (arquivos($API, '.php') as $f) {
    $c = file_get_contents($f);
    if (preg_match('/ApiResponse::success\([^)]*(client_secret|refresh_token|access_token|CRYPTO_KEY)/i', $c)) {
        $vazou[] = basename($f);
    }
}
ok('nenhum endpoint devolve segredo', empty($vazou), implode(' ', $vazou));

$m = new GcalMock();
$contas = $m->contas();
$temSegredo = false;
foreach ($contas as $c) {
    foreach (['access_token', 'refresh_token', 'client_secret', 'token'] as $k) {
        if (!empty($c[$k]) && $c[$k] !== '********') $temSegredo = true;
    }
}
ok('contas não trafegam token (comportamento)', !$temSegredo);
$sync = $m->sincronizacao();
ok('sync_token mascarado (comportamento)', ($sync[0]['sync_token'] ?? '') === '********');

// Escrita em calendario sem permissao TEM de ser recusada no SERVIDOR.
$err = null;
try { $m->criarEvento(['calendar_id' => 'feriados@group.v.calendar.google.com', 'summary' => 'x',
                       'start' => '2026-08-01T10:00:00-03:00', 'end' => '2026-08-01T11:00:00-03:00']); }
catch (Throwable $e) { $err = $e->getMessage(); }
ok('servidor recusa escrita em calendário reader', $err !== null);

$err2 = null;
try { $m->atualizarEvento('diretoria@dshow.com.br', 'evt_1009', ['summary' => 'x']); }
catch (Throwable $e) { $err2 = $e->getMessage(); }
ok('servidor recusa edição em freeBusyReader', $err2 !== null);

// ═══════════════════════════════════════════════════════════════════════
echo "\n▸ PRIVACIDADE / LGPD (§75)\n";
// ═══════════════════════════════════════════════════════════════════════

$tz = 'America/Sao_Paulo';
$hoje = (new DateTimeImmutable('now', new DateTimeZone($tz)))->format('Y-m-d');
$evs = $m->eventos(['de' => $hoje, 'ate' => $hoje, 'tz' => $tz]);
$priv = array_values(array_filter($evs, fn($e) => $e['calendar_id'] === 'diretoria@dshow.com.br'));

ok('bloco de calendário livre/ocupado continua existindo', count($priv) === 1,
   '(sumir mentiria na disponibilidade)');
if ($priv) {
    $p = $priv[0];
    ok('título redigido',        $p['summary'] === 'Ocupado');
    ok('descrição removida',     $p['description'] === null);
    ok('local removido',         $p['location'] === null);
    ok('participantes removidos', $p['attendees'] === []);
    ok('conferência removida',   $p['conference'] === null);
    ok('vínculos removidos',     $p['links'] === []);
    ok('marcado como redacted',  !empty($p['redacted']));
}

// A redacao tem de ser do SERVIDOR: filtro so no front vaza no DevTools.
$mock = file_get_contents($API . '/lib/GcalMock.php');
ok('redação acontece no servidor', str_contains($mock, 'aplicarPrivacidade'));

// Log nunca pode levar conteudo de evento.
$logSuspeito = [];
foreach (arquivos($API, '.php') as $f) {
    foreach (file($f) as $n => $l) {
        if (preg_match('/error_log\(.*\$(e\[|evento|summary|description|attendees|token)/i', $l)) {
            $logSuspeito[] = basename($f) . ':' . ($n + 1);
        }
    }
}
ok('nenhum log com conteúdo de evento ou token', empty($logSuspeito), implode(' ', $logSuspeito));

ok('GcalCrypto tem scrub para limpar payload antes de logar',
   str_contains(file_get_contents($API . '/lib/GcalCrypto.php'), 'function scrub'));

// Relatorio de participantes nao pode expor quem nao participa.
$rel = $m->relatorio('participantes', ['de' => $hoje, 'ate' => $hoje, 'tz' => $tz]);
$temEuMesmo = array_filter($rel['linhas'], fn($l) => $l['email'] === 'jhony@dshow.com.br');
ok('relatório de participantes não inclui o próprio usuário', count($temEuMesmo) === 0);

// ═══════════════════════════════════════════════════════════════════════
echo "\n▸ FUSOS (§47) — inclusive virada de horário de verão\n";
// ═══════════════════════════════════════════════════════════════════════

// Grep solto acha CONVERT_TZ nos COMENTARIOS que explicam justamente por que
// nao se usa CONVERT_TZ — falso positivo classico. Ancora em linha de codigo:
// descarta as que comecam com //, * ou #.
$convertTz = [];
foreach (arquivos($API, '.php') as $f) {
    foreach (file($f) as $n => $l) {
        $t = ltrim($l);
        if ($t === '' || str_starts_with($t, '//') || str_starts_with($t, '*')
            || str_starts_with($t, '/*') || str_starts_with($t, '#')) continue;
        if (stripos($l, 'CONVERT_TZ') !== false) $convertTz[] = basename($f) . ':' . ($n + 1);
    }
}
ok('CONVERT_TZ não aparece em nenhuma query do módulo', empty($convertTz), implode(' ', $convertTz));

ok('SP: 09:00 local vira 12:00 UTC',
   Tz::paraUtc('2026-07-30 09:00:00', 'America/Sao_Paulo')->format('H:i') === '12:00');
ok('ida e volta preserva a hora de parede',
   Tz::paraLocal(Tz::paraUtc('2026-07-30 09:00:00', 'America/Sao_Paulo'), 'America/Sao_Paulo')
     ->format('H:i') === '09:00');

// DST de verdade: Nova York vira em 08/03/2026 (2h → 3h).
$antesDst  = Tz::paraUtc('2026-03-07 12:00:00', 'America/New_York');   // EST, UTC-5
$depoisDst = Tz::paraUtc('2026-03-09 12:00:00', 'America/New_York');   // EDT, UTC-4
ok('NY antes do DST = UTC-5', $antesDst->format('H:i') === '17:00', '(' . $antesDst->format('H:i') . ')');
ok('NY depois do DST = UTC-4', $depoisDst->format('H:i') === '16:00', '(' . $depoisDst->format('H:i') . ')');
ok('o offset MUDA na virada (não é fixo)', $antesDst->format('H:i') !== $depoisDst->format('H:i'));

// Hora inexistente (o relógio pula das 2 para as 3).
$pulada = Tz::paraUtc('2026-03-08 02:30:00', 'America/New_York');
ok('hora inexistente no DST não explode', $pulada instanceof DateTimeImmutable, '(' . $pulada->format('H:i') . ' UTC)');

// Europa vira em outra data — o modulo nao pode assumir um calendario so.
$eu = Tz::difMinutos(new DateTimeImmutable('2026-07-30 12:00:00'), 'Europe/Lisbon', 'America/Sao_Paulo');
ok('Lisboa x SP no verão europeu = 4h', $eu === 240, "({$eu} min)");
$sh = Tz::difMinutos(new DateTimeImmutable('2026-07-30 12:00:00'), 'Asia/Shanghai', 'America/Sao_Paulo');
ok('Shenzhen x SP = 11h (§47.2)', $sh === 660, "({$sh} min)");

ok('fuso inválido cai no padrão, não no default do processo',
   Tz::normalizar('Nao/Existe') === 'America/Sao_Paulo');
ok('dia inteiro é reconhecido como intervalo de datas (§48)',
   Tz::ehDiaInteiro('2026-07-30', '2026-07-31'));
ok('evento com hora NÃO é dia inteiro',
   !Tz::ehDiaInteiro('2026-07-30T09:00:00-03:00', '2026-07-30T10:00:00-03:00'));

// O front tambem nao pode fixar SP.
$tsTz = file_get_contents($SRC . '/lib/tz.ts');
ok('front resolve o fuso do usuário via Intl', str_contains($tsTz, 'resolvedOptions().timeZone'));
ok('front calcula offset por instante (sensível a DST)', str_contains($tsTz, 'offsetMinutos'));

// Evento de dia inteiro nao pode virar 24h em lugar nenhum.
$mes = $m->eventos(['de' => $hoje, 'ate' => (new DateTimeImmutable($hoje))->modify('+30 days')->format('Y-m-d'), 'tz' => $tz]);
$allday = array_values(array_filter($mes, fn($e) => !empty($e['all_day'])));
$formatoOk = true;
foreach ($allday as $e) { if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', (string)$e['start'])) $formatoOk = false; }
ok('dia inteiro usa data pura na API', $formatoOk, '(' . count($allday) . ' eventos)');

// ═══════════════════════════════════════════════════════════════════════
echo "\n▸ RECORRÊNCIA (§19, §20)\n";
// ═══════════════════════════════════════════════════════════════════════

$semana = $m->eventos(['de' => $hoje, 'ate' => (new DateTimeImmutable($hoje))->modify('+7 days')->format('Y-m-d'), 'tz' => $tz]);
$serie = array_values(array_filter($semana, fn($e) => $e['recurring_event_id'] === 'ser_daily'));
ok('série tem várias instâncias', count($serie) >= 4, '(' . count($serie) . ')');
ok('instância preserva o id da série (§58)',
   $serie && $serie[0]['recurring_event_id'] === 'ser_daily');
ok('instância traz a regra em texto (§20)',
   $serie && !empty($serie[0]['recurrence']['human']), $serie[0]['recurrence']['human'] ?? '');
ok('regra guarda o RRULE',
   $serie && str_starts_with((string)($serie[0]['recurrence']['rrule'] ?? ''), 'RRULE:'));

// escopo=this NAO pode contaminar as outras ocorrencias.
if (count($serie) >= 2) {
    $m->atualizarEvento($serie[0]['calendar_id'], $serie[0]['id'], ['summary' => 'SO ESTA'], 'this');
    $dep = $m->eventos(['de' => $hoje, 'ate' => (new DateTimeImmutable($hoje))->modify('+7 days')->format('Y-m-d'), 'tz' => $tz]);
    $mudadas = array_filter($dep, fn($e) => $e['summary'] === 'SO ESTA');
    ok('escopo=this altera SÓ uma ocorrência', count($mudadas) === 1, '(' . count($mudadas) . ')');

    $m->atualizarEvento($serie[1]['calendar_id'], $serie[1]['id'], ['summary' => 'TODA A SERIE'], 'all');
    $dep2 = $m->eventos(['de' => $hoje, 'ate' => (new DateTimeImmutable($hoje))->modify('+7 days')->format('Y-m-d'), 'tz' => $tz]);
    $todas = array_filter($dep2, fn($e) => $e['summary'] === 'TODA A SERIE');
    ok('escopo=all altera a série inteira', count($todas) >= 4, '(' . count($todas) . ')');
}
GcalMock::reset();

// ═══════════════════════════════════════════════════════════════════════
echo "\n▸ MÚLTIPLAS CONTAS (§55)\n";
// ═══════════════════════════════════════════════════════════════════════

$m = new GcalMock();
$contas = $m->contas();
ok('mais de uma conta suportada', count($contas) >= 2, '(' . count($contas) . ')');
ok('cada conta declara o e-mail', count(array_filter($contas, fn($c) => !empty($c['email']))) === count($contas));
ok('cada conta declara o tipo', count(array_filter($contas, fn($c) => !empty($c['account_type']))) === count($contas));
$comProblema = array_filter($contas, fn($c) => $c['connection_status'] !== 'connected');
ok('conta com problema aparece com o motivo', count($comProblema) >= 1
   && !empty(array_values($comProblema)[0]['last_error_message']));
$st = $m->status();
ok('status agrega contas com problema', ($st['accounts_with_problem'] ?? 0) >= 1);

$cals = $m->calendarios();
ok('todo calendário aponta a conta de origem',
   count(array_filter($cals, fn($c) => isset($c['account_id']))) === count($cals));

// ═══════════════════════════════════════════════════════════════════════
echo "\n▸ PERFORMANCE (§77)\n";
// ═══════════════════════════════════════════════════════════════════════

$init = file_get_contents($API . '/_init.php');
ok('janela tem teto no servidor', str_contains($init, '400'), '(400 dias)');
ok('fuso é saneado antes de usar', str_contains($init, 'Tz::normalizar'));

$t0 = microtime(true);
$m->eventos(['de' => $hoje, 'ate' => (new DateTimeImmutable($hoje))->modify('+90 days')->format('Y-m-d'), 'tz' => $tz]);
$ms90 = (int)round((microtime(true) - $t0) * 1000);
ok('janela de 90 dias abaixo de 400ms', $ms90 < 400, "({$ms90}ms)");

$t0 = microtime(true);
$m->overview(['tz' => $tz]);
$msOv = (int)round((microtime(true) - $t0) * 1000);
ok('overview abaixo de 700ms', $msOv < 700, "({$msOv}ms)");

$t0 = microtime(true);
GcalLinks::buscar('painel');
$msLink = (int)round((microtime(true) - $t0) * 1000);
ok('busca no CRM real abaixo de 800ms', $msLink < 800, "({$msLink}ms)");

// Bundles: o primeiro paint nao pode carregar o que so uma tela usa.
$dist = '/var/www/dshowdash/public/components/panels/panel-google-calendar/dist';
$manifest = json_decode((string)file_get_contents($dist . '/.vite/manifest.json'), true);
$entrada = null;
foreach ($manifest as $k => $v) { if (str_ends_with($k, 'src/entry.tsx')) $entrada = $v; }
ok('manifest do build existe', $entrada !== null);
if ($entrada) {
    $noPaint = array_merge([$entrada['file']], $entrada['imports'] ?? []);
    $total = 0;
    foreach ($noPaint as $c) {
        $p = $dist . '/' . (is_string($c) ? $c : ($manifest[$c]['file'] ?? ''));
        if (is_file($p)) $total += filesize($p);
    }
    // Resolve os imports nomeados para arquivo real.
    $total = 0;
    foreach ($noPaint as $c) {
        $arq = isset($manifest[$c]) ? $manifest[$c]['file'] : $c;
        $p = $dist . '/' . $arq;
        if (is_file($p)) $total += filesize($p);
    }
    $kb = (int)round($total / 1024);
    ok('primeiro paint abaixo de 500 kB', $kb < 500, "({$kb} kB)");

    $pesados = glob($dist . '/chunks/{echarts,fullcalendar,d3}*.js', GLOB_BRACE);
    $lazy = true;
    foreach ($pesados as $p) {
        $nome = basename($p);
        foreach ($noPaint as $c) {
            $arq = isset($manifest[$c]) ? $manifest[$c]['file'] : $c;
            if (str_contains((string)$arq, explode('.', $nome)[0])) $lazy = false;
        }
    }
    ok('ECharts, FullCalendar e D3 fora do primeiro paint', $lazy,
       '(' . count($pesados) . ' chunks pesados)');
}

// ═══════════════════════════════════════════════════════════════════════
echo "\n▸ CONTRATO E ROTAS (§86)\n";
// ═══════════════════════════════════════════════════════════════════════

$ref = new ReflectionClass('GcalProvider');
$impl = new ReflectionClass('GcalMock');
$faltando = [];
foreach ($ref->getMethods() as $mm) {
    if (!$impl->hasMethod($mm->getName())) $faltando[] = $mm->getName();
}
ok('GcalMock implementa o contrato inteiro', empty($faltando), implode(' ', $faltando));

require_once $API . '/lib/GcalReal.php';
$real = new ReflectionClass('GcalReal');
$faltando2 = [];
foreach ($ref->getMethods() as $mm) {
    if (!$real->hasMethod($mm->getName())) $faltando2[] = $mm->getName();
}
ok('GcalReal implementa o contrato inteiro', empty($faltando2), implode(' ', $faltando2));

ok('IDs externos preservados (§58)',
   str_contains($mock, "'ical_uid'") && str_contains($mock, "'recurring_event_id'")
   && str_contains($mock, "'etag'") && str_contains($mock, "'sequence'"));

// Erro tem de trazer identificacao para o suporte.
$estados = file_get_contents($SRC . '/screens/Estados.tsx');
ok('tela de erro mostra código e horário (§72)',
   str_contains($estados, 'Código') && str_contains($estados, 'Horário'));

echo "\n═══════════════════════════════════════════════════════════\n";
if ($falhas === 0) {
    echo "  HOMOLOGADO — 0 falha" . ($avisos ? ", {$avisos} aviso(s)" : "") . "\n";
} else {
    echo "  *** {$falhas} FALHA(S), {$avisos} aviso(s) ***\n";
}
echo "═══════════════════════════════════════════════════════════\n";
exit($falhas === 0 ? 0 : 1);
