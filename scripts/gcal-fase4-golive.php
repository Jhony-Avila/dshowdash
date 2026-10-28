<?php
// Prova do caminho de GO-LIVE, sem credencial do Google
// @module google-calendar.golive.prova
// @version 1.0.0
// @created 2026-07-30
//
//     php scripts/gcal-fase4-golive.php
//
// PARA QUE SERVE
// O caminho conectar -> callback -> gravar token -> descobrir calendarios ->
// sincronizar -> SERVIR AS TELAS so seria executado pela primeira vez com as
// credenciais reais, em producao, com o dono olhando. Este script executa esse
// caminho inteiro AGORA, com transporte falso e credenciais de fachada, contra
// o banco GCAL_DSHOW de verdade.
//
// Se ele passa, o que falta no go-live e SO colar as credenciais: a mecanica ja
// esta provada. Se ele falha, falha aqui — nao na frente do dono.
//
// SEGURANCA: grava numa conta de teste (user_id 999.999) e APAGA tudo ao final,
// inclusive em caso de erro. Nenhum dado real e tocado.
declare(strict_types=1);

if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }

$raiz = dirname(__DIR__);
require_once $raiz . '/api/_helpers/ApiResponse.php';
require_once $raiz . '/config/db_connection.php';
require_once $raiz . '/api/google-calendar/lib/Tz.php';
require_once $raiz . '/api/google-calendar/lib/GcalProvider.php';
require_once $raiz . '/api/google-calendar/lib/GcalCrypto.php';
require_once $raiz . '/api/google-calendar/lib/GoogleOAuth.php';
require_once $raiz . '/api/google-calendar/lib/GcalTransport.php';
require_once $raiz . '/api/google-calendar/lib/GcalNormalizer.php';
require_once $raiz . '/api/google-calendar/lib/GoogleCalendarClient.php';
require_once $raiz . '/api/google-calendar/lib/GcalLinks.php';
require_once $raiz . '/api/google-calendar/lib/GcalReports.php';
require_once $raiz . '/api/google-calendar/lib/GcalGoLive.php';
require_once $raiz . '/api/google-calendar/lib/GcalProviderBase.php';
require_once $raiz . '/api/google-calendar/lib/GcalDb.php';
require_once $raiz . '/api/google-calendar/repositories/GcalRepository.php';
require_once $raiz . '/api/google-calendar/services/GcalAuthService.php';
require_once $raiz . '/api/google-calendar/services/GcalSyncService.php';

const USER_TESTE = 999999;

$ok = 0; $falhas = [];
$check = static function (string $nome, bool $cond, string $obs = '') use (&$ok, &$falhas): void {
    if ($cond) { $ok++; printf("  ok      %s %s\n", $nome, $obs); }
    else       { $falhas[] = $nome; printf("  FALHA   %s %s\n", $nome, $obs); }
};
$secao = static fn(string $t) => printf("\n%s\n%s\n", $t, str_repeat('─', mb_strlen($t)));

// ── Fachadas de ambiente ────────────────────────────────────────────
// Nao tocam o .env: `putenv` vale so para este processo.
putenv('GOOGLE_CALENDAR_OAUTH_CLIENT_ID=teste.apps.googleusercontent.com');
putenv('GOOGLE_CALENDAR_OAUTH_CLIENT_SECRET=segredo-de-teste');
putenv('GCAL_OAUTH_STAGE=read');

$repo = new GcalRepository();

/** Remove tudo do usuario de teste. Rodado no inicio E no fim. */
$limpar = static function (GcalRepository $r): void {
    // As FKs em CASCADE cuidam de calendarios, eventos, tokens e sync_state; o
    // que nao cascateia (auditoria) e apagado explicitamente.
    $r->pdo()->prepare("DELETE FROM gcal_accounts WHERE user_id = :u")->execute([':u' => USER_TESTE]);
    $r->pdo()->prepare("DELETE FROM gcal_audit_logs WHERE user_id = :u")->execute([':u' => USER_TESTE]);
    $r->pdo()->prepare("DELETE FROM gcal_oauth_states WHERE user_id = :u")->execute([':u' => USER_TESTE]);
};
$limpar($repo);

// A limpeza acontece ACONTECA O QUE ACONTECER: um teste que morre no meio nao
// pode deixar conta fantasma no banco de producao.
register_shutdown_function(static function () use ($repo, $limpar) { $limpar($repo); });

echo "\nPROVA DO CAMINHO DE GO-LIVE — Google Calendar\n";
echo str_repeat('═', 74), "\n";

// ═══════════════════════════════════════════════════════════════════
$secao('1. Início do OAuth (state + PKCE)');

$auth = new GcalAuthService($repo);
$url = $auth->iniciar(USER_TESTE, '/#/panel-google-calendar/contas');
parse_str((string)parse_url($url, PHP_URL_QUERY), $q);

$check('authorize_url aponta para o Google',
    str_starts_with($url, 'https://accounts.google.com/o/oauth2/v2/auth'));
$check('code_challenge_method = S256', ($q['code_challenge_method'] ?? '') === 'S256');
$check('access_type=offline + prompt=consent',
    ($q['access_type'] ?? '') === 'offline' && ($q['prompt'] ?? '') === 'consent',
    '(sem isso não vem refresh_token)');
$check('escopo é o de LEITURA na etapa read',
    !str_contains((string)($q['scope'] ?? ''), 'auth/calendar.events')
    && str_contains((string)($q['scope'] ?? ''), 'calendar.readonly'));
$check('state foi persistido', (bool)($q['state'] ?? null));

$state = (string)$q['state'];
$desafio = (string)$q['code_challenge'];

// ═══════════════════════════════════════════════════════════════════
$secao('2. Callback: troca do code por token');

// O token endpoint devolve o que o Google devolveria.
GoogleOAuth::$postDeTeste = static function (array $campos): array {
    // Confere o PKCE do lado do "servidor": o verifier tem de bater com o
    // challenge enviado no passo 1.
    $GLOBALS['__verifier_recebido'] = $campos['code_verifier'] ?? null;
    $GLOBALS['__grant_recebido']    = $campos['grant_type'] ?? null;
    return [
        'access_token'  => 'ya29.token-de-teste',
        'refresh_token' => '1//refresh-de-teste',
        'expires_in'    => 3599,
        'scope'         => GoogleOAuth::scopes(),
        'token_type'    => 'Bearer',
    ];
};

// O perfil e as chamadas de API passam pelo transporte falso.
$fake = new GcalTransportFake(
    new GcalResposta(200, ['sub' => '11223344556677889900', 'email' => 'teste@dshow.com.br',
                           'name' => 'Conta de Teste', 'hd' => 'dshow.com.br'])
);
$authFake = new GcalAuthService($repo, $fake);
$r = $authFake->concluir('codigo-devolvido-pelo-google', $state);

$verificadorOk = isset($GLOBALS['__verifier_recebido'])
    && rtrim(strtr(base64_encode(hash('sha256', $GLOBALS['__verifier_recebido'], true)), '+/', '-_'), '=')
       === $desafio;
$check('PKCE fecha (sha256(verifier) == challenge)', $verificadorOk);
$check('grant_type = authorization_code', ($GLOBALS['__grant_recebido'] ?? '') === 'authorization_code');
$check('conta criada', $r['account_id'] > 0, '(id ' . $r['account_id'] . ')');
$check('e-mail identificado', $r['email'] === 'teste@dshow.com.br');
$check('redirect pós-login preservado', $r['redirect'] === '/#/panel-google-calendar/contas');

$accountId = (int)$r['account_id'];

$check('state foi consumido (não reutilizável)',
    $repo->consumirState($state) === null, '(replay do mesmo code é recusado)');

$tok = $repo->lerTokens($accountId);
$check('access_token recuperável', ($tok['access'] ?? '') === 'ya29.token-de-teste');
$check('refresh_token recuperável', ($tok['refresh'] ?? '') === '1//refresh-de-teste');

$bruto = $repo->pdo()->query(
    "SELECT access_token_enc FROM gcal_oauth_tokens WHERE account_id = $accountId")->fetchColumn();
$check('token está CIFRADO em disco',
    is_string($bruto) && !str_contains($bruto, 'ya29.'), '(nada de token em texto puro)');

// ═══════════════════════════════════════════════════════════════════
$secao('3. Descoberta de calendários');

$fake->enfileirar(new GcalResposta(200, ['items' => [
    ['id' => 'teste@dshow.com.br', 'summary' => 'Agenda principal', 'primary' => true,
     'accessRole' => 'owner', 'timeZone' => 'America/Sao_Paulo', 'backgroundColor' => '#3b82f6'],
    ['id' => 'sala.reuniao@dshow.com.br', 'summary' => 'Sala de Reunião',
     'accessRole' => 'writer', 'timeZone' => 'America/Sao_Paulo', 'backgroundColor' => '#f59e0b'],
]]));

$sync = new GcalSyncService($repo, $authFake);
$n = $sync->sincronizarCalendarios($accountId);
$check('2 calendários descobertos', $n === 2);

$cals = $repo->listarCalendarios(USER_TESTE);
$check('calendários persistidos e legíveis', count($cals) === 2);
$check('o principal veio marcado', (bool)($cals[0]['is_primary'] ?? false));

// ═══════════════════════════════════════════════════════════════════
$secao('4. Carga de eventos');

$hoje = new DateTimeImmutable('today 14:00', new DateTimeZone('America/Sao_Paulo'));
$fim  = $hoje->modify('+1 hour');
$fake->enfileirar(new GcalResposta(200, [
    'nextSyncToken' => 'CAESBnRva2Vu',
    'items' => [
        ['id' => 'evt-teste-1', 'status' => 'confirmed', 'summary' => 'Reunião de teste',
         'iCalUID' => 'evt-teste-1@google.com', 'etag' => '"abc"', 'sequence' => 0,
         'start' => ['dateTime' => $hoje->format('c'), 'timeZone' => 'America/Sao_Paulo'],
         'end'   => ['dateTime' => $fim->format('c'),  'timeZone' => 'America/Sao_Paulo'],
         'organizer' => ['email' => 'teste@dshow.com.br', 'self' => true],
         'attendees' => [
            ['email' => 'teste@dshow.com.br', 'responseStatus' => 'accepted', 'organizer' => true, 'self' => true],
            ['email' => 'cliente@externo.com', 'responseStatus' => 'needsAction'],
         ],
         'conferenceData' => ['conferenceSolution' => ['name' => 'Google Meet'],
                              'entryPoints' => [['entryPointType' => 'video',
                                                 'uri' => 'https://meet.google.com/abc-defg-hij']]],
         'reminders' => ['overrides' => [['method' => 'popup', 'minutes' => 10]]],
         'created' => '2026-07-01T10:00:00Z', 'updated' => '2026-07-20T10:00:00Z'],
    ],
]));

$res = $sync->cargaCompleta($accountId, 'teste@dshow.com.br');
$check('1 evento processado', $res['processed'] === 1, json_encode($res));
$check('gravado como NOVO', $res['created'] === 1);

$ultima = end($fake->chamadas);
$check('carga completa manda timeMin/timeMax e NÃO syncToken',
    isset($ultima['query']['timeMin'], $ultima['query']['timeMax'])
    && !isset($ultima['query']['syncToken']),
    '(o Google recusa os dois juntos)');

$guardado = $repo->lerSyncToken($accountId, 'teste@dshow.com.br');
$check('syncToken guardado e decifrável', $guardado === 'CAESBnRva2Vu');
$bruto = $repo->pdo()->query(
    "SELECT sync_token_enc FROM gcal_sync_state WHERE account_id = $accountId
      AND calendar_id = 'teste@dshow.com.br'")->fetchColumn();
$check('syncToken CIFRADO em disco', is_string($bruto) && !str_contains($bruto, 'CAESBnRva2Vu'));

// ═══════════════════════════════════════════════════════════════════
$secao('5. Incremental usa o token e não a janela');

$fake->enfileirar(new GcalResposta(200, ['nextSyncToken' => 'CAESBnRva2Vu2', 'items' => []]));
$sync->incremental($accountId, 'teste@dshow.com.br');
$ultima = end($fake->chamadas);
$check('incremental manda syncToken', ($ultima['query']['syncToken'] ?? '') === 'CAESBnRva2Vu');
$check('incremental NÃO manda timeMin', !isset($ultima['query']['timeMin']));

// ═══════════════════════════════════════════════════════════════════
$secao('6. Token expirado renova sozinho');

$repo->pdo()->exec(
    "UPDATE gcal_oauth_tokens SET expires_at = UTC_TIMESTAMP() - INTERVAL 1 HOUR
      WHERE account_id = $accountId");
$check('repositório reconhece o vencimento', $repo->tokenVencido($accountId));

$refreshPedido = null;
GoogleOAuth::$postDeTeste = static function (array $c) use (&$refreshPedido): array {
    $refreshPedido = $c['grant_type'] ?? null;
    // O Google NAO devolve refresh_token no refresh — de proposito, para provar
    // que o repositorio preserva o anterior em vez de apagar a credencial.
    return ['access_token' => 'ya29.token-renovado', 'expires_in' => 3599,
            'scope' => GoogleOAuth::scopes(), 'token_type' => 'Bearer'];
};
$novo = $authFake->tokenValido($accountId);
$check('grant_type = refresh_token', $refreshPedido === 'refresh_token');
$check('access_token foi renovado', $novo === 'ya29.token-renovado');
$check('refresh_token NÃO foi apagado',
    ($repo->lerTokens($accountId)['refresh'] ?? '') === '1//refresh-de-teste',
    '(resposta do refresh vem sem ele)');

// ═══════════════════════════════════════════════════════════════════
$secao('7. AS TELAS, servidas pelo banco (GcalDb)');

$db = new GcalDb($repo, $authFake, USER_TESTE);

$check('provedor se identifica como google', $db->nome() === 'google');

$st = $db->status();
$check('status: conectado', $st['connected'] === true && $st['accounts'] === 1);
$check('status: 2 calendários', $st['calendars'] === 2);

$lista = $db->calendarios();
$check('tela Calendários responde', count($lista) === 2);

$eventos = $db->eventos(['de' => $hoje->format('Y-m-d'), 'ate' => $hoje->format('Y-m-d'),
                         'tz' => 'America/Sao_Paulo']);
$check('tela Agenda devolve o evento', count($eventos) === 1, count($eventos) . ' evento(s)');

if ($eventos) {
    $e = $eventos[0];
    $check('  título', $e['summary'] === 'Reunião de teste');
    $check('  duração calculada', $e['duration_min'] === 60, $e['duration_min'] . ' min');
    $check('  2 participantes', count($e['attendees']) === 2);
    $check('  externo identificado',
        (bool)($e['attendees'][1]['external'] ?? $e['attendees'][0]['external'] ?? false));
    $check('  link do Meet', str_contains((string)($e['conference']['uri'] ?? ''), 'meet.google.com'));
    $check('  lembrete de 10 min', ($e['reminders'][0]['minutes'] ?? null) === 10);
    $check('  cor do calendário anexada', !empty($e['calendar_color']));
    $check('  minha resposta', $e['my_response'] === 'accepted');
    $check('  sou o organizador', $e['is_organizer'] === true);
}

$um = $db->evento('teste@dshow.com.br', 'evt-teste-1');
$check('drawer de evento abre', $um !== null && $um['id'] === 'evt-teste-1');

// As telas derivadas vem todas da base compartilhada — se respondem aqui,
// respondem igual no mock, porque e literalmente o mesmo codigo.
$check('tela Conflitos responde',
    is_array($db->conflitos(['de' => $hoje->format('Y-m-d'), 'ate' => $hoje->format('Y-m-d')])));
$check('tela Convites responde',
    is_array($db->convites(['de' => $hoje->format('Y-m-d'), 'ate' => $hoje->modify('+7 days')->format('Y-m-d')])));
$check('tela Disponibilidade responde',
    is_array($db->freeBusy(['de' => $hoje->format('Y-m-d'), 'ate' => $hoje->format('Y-m-d'),
                            'participantes' => ['teste@dshow.com.br']])));
$check('KPIs do Overview respondem', isset($db->overview(['tz' => 'America/Sao_Paulo'])['hoje']));
$check('tela Alertas responde', is_array($db->alertas([])));
// Os DOIS calendarios tem de aparecer, embora so um tenha rodado: o outro sai
// como `pending`. Se a tela listasse so os ja sincronizados, um calendario
// recem-descoberto sumiria justo depois de conectar a conta.
$sincs = $db->sincronizacao();
$check('tela Sincronização lista TODOS os calendários', count($sincs) === 2,
    count($sincs) . ' de 2');
$pendentes = array_values(array_filter($sincs, static fn($s) => $s['status'] === 'pending'));
$check('calendário nunca sincronizado aparece como "pending"',
    count($pendentes) === 1 && $pendentes[0]['calendar_id'] === 'sala.reuniao@dshow.com.br');
$check('sincronizado aparece como "ok"',
    count(array_filter($sincs, static fn($s) => $s['status'] === 'ok')) === 1);
$check('syncToken nunca sai do servidor',
    !array_filter($sincs, static fn($s) => $s['sync_token'] !== '********'));

$cat = $db->tiposRelatorio();
$check('catálogo de relatórios completo', count($cat) >= 11, count($cat) . ' relatórios');
$quebrados = [];
foreach ($cat as $t) {
    try {
        $db->relatorio($t['id'], ['de' => $hoje->modify('-7 days')->format('Y-m-d'),
                                  'ate' => $hoje->format('Y-m-d'), 'tz' => 'America/Sao_Paulo']);
    } catch (\Throwable $e) { $quebrados[] = $t['id'] . ': ' . $e->getMessage(); }
}
$check('todos os relatórios geram sobre o banco', !$quebrados, implode(' | ', $quebrados));

// ═══════════════════════════════════════════════════════════════════
$secao('8. Isolamento entre usuários');

$outro = new GcalDb($repo, $authFake, USER_TESTE + 1);
$check('outro usuário não vê a conta', count($outro->contas()) === 0);
$check('outro usuário não vê os calendários', count($outro->calendarios()) === 0);
$check('outro usuário não vê os eventos',
    count($outro->eventos(['de' => $hoje->format('Y-m-d'), 'ate' => $hoje->format('Y-m-d')])) === 0);

// ═══════════════════════════════════════════════════════════════════
$secao('9. Escrita respeita o papel de acesso');

$negado = false;
try {
    // `reader` no calendario -> tem de recusar ANTES de chamar o Google.
    $repo->pdo()->exec("UPDATE gcal_calendars SET access_role = 'reader'
                         WHERE account_id = $accountId AND calendar_id = 'teste@dshow.com.br'");
    $db2 = new GcalDb($repo, $authFake, USER_TESTE);
    $db2->criarEvento(['calendar_id' => 'teste@dshow.com.br', 'summary' => 'não deveria existir']);
} catch (\Throwable $e) {
    $negado = str_contains($e->getMessage(), 'permissão');
}
$check('calendário read-only recusa criação', $negado);

// ═══════════════════════════════════════════════════════════════════
$secao('10. Checklist de go-live enxerga a conta');

$itens = [];
// A checklist e memoizada por requisicao; aqui o estado mudou no meio do
// processo (conta criada, calendarios sincronizados), entao re-medir e o ponto.
GcalGoLive::esquecer();
foreach (GcalGoLive::itens() as $i) { $itens[$i['id']] = $i; }
$check('item "conta conectada" ficou verde', $itens['conta']['ok'] === true);
$check('item "sincronização" ficou verde', $itens['sync']['ok'] === true,
    $itens['sync']['detalhe']);
$check('item "banco" verde', $itens['banco']['ok'] === true);

// ═══════════════════════════════════════════════════════════════════
$secao('11. Desconectar limpa tudo (prova da FK em CASCADE)');

GoogleOAuth::$postDeTeste = null;
$repo->pdo()->prepare("DELETE FROM gcal_accounts WHERE id = :a")->execute([':a' => $accountId]);
foreach (['gcal_calendars', 'gcal_events', 'gcal_oauth_tokens', 'gcal_sync_state'] as $t) {
    $n = (int)$repo->pdo()->query("SELECT COUNT(*) FROM $t WHERE account_id = $accountId")->fetchColumn();
    $check("  $t zerado", $n === 0, $n > 0 ? "sobraram $n" : '');
}
$n = (int)$repo->pdo()->query(
    "SELECT COUNT(*) FROM gcal_audit_logs WHERE user_id = " . USER_TESTE)->fetchColumn();
$check('auditoria SOBREVIVEU à exclusão', $n > 0, "$n registro(s) — é o objetivo dela");

// ═══════════════════════════════════════════════════════════════════
echo "\n", str_repeat('═', 74), "\n";
if ($falhas) {
    printf("%d ok · %d FALHA(S):\n", $ok, count($falhas));
    foreach ($falhas as $f) { echo "  • $f\n"; }
    echo "\n";
    exit(1);
}
printf("TODOS OS %d CHECKS PASSARAM\n", $ok);
echo "O caminho de go-live está provado. Falta apenas colar as credenciais.\n\n";
exit(0);
