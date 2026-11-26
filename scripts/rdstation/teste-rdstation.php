<?php
declare(strict_types=1);
// teste-rdstation.php — conector do RD Station Marketing (VINHO/ACIMA_ESQUERDA, 26/11). Sem rede (transporte falso), sem banco.
// Pasta de segredos TEMPORÁRIA com valores inventados, criada e removida aqui. Uso: php scripts/rdstation/teste-rdstation.php
require_once __DIR__ . '/../../api/rdstation/RdStation.php';

$ok = 0; $falhas = [];
function check(string $n, bool $c, string $i = ''): void { global $ok, $falhas; if ($c) { $ok++; echo "ok    $n\n"; } else { $falhas[] = $n; echo "FALHA $n" . ($i !== '' ? " · $i" : '') . "\n"; } }
function erroDe(Closure $f): ?string { try { $f(); return null; } catch (RdErro $e) { return $e->codigo; } }

final class RdFalso implements RdTransporte
{
    public array $chamadas = []; public array $rotas = [];
    public function enviar(string $metodo, string $url, array $cab, ?string $corpo): array
    {
        RdGuarda::conferir($metodo, $url);   // a MESMA guarda do transporte real
        $this->chamadas[] = ['m' => $metodo, 'u' => $url, 'c' => $cab, 'b' => $corpo];
        $p = (string) parse_url($url, PHP_URL_PATH);
        $f = $this->rotas[$metodo . ' ' . $p] ?? null;
        return $f ? $f($corpo, $url) : ['status' => 404, 'corpo' => '{}'];
    }
}

$TMP = sys_get_temp_dir() . '/rd-teste.' . bin2hex(random_bytes(4)); mkdir($TMP, 0700);
register_shutdown_function(function () use ($TMP): void { if (preg_match('#/rd-teste\.[0-9a-f]{8}$#', $TMP)) { foreach (glob("$TMP/{,.}*", GLOB_BRACE) as $f) if (is_file($f)) unlink($f); @rmdir($TMP); } });
$ID = 'idInventado-1234'; $SEC = 'segredoInventado_ABCDEFGH5678'; $ACC = 'acessoFalso.AAAA1111'; $REF = 'renovaFalso.BBBB2222';
$seg = new RdSegredos($TMP);
$agora = new DateTimeImmutable('2026-11-26 13:00:00', new DateTimeZone('America/Sao_Paulo'));

// ---- A. GUARDA SÓ LEITURA (transporte real e cliente) — nada disso toca a rede: a guarda vem antes do curl_init
$real = new RdCurl();
foreach (['POST', 'PUT', 'PATCH', 'DELETE'] as $m) check("transporte real: $m para a API do RD → somente_leitura, antes da rede", erroDe(fn() => $real->enviar($m, 'https://api.rd.services/platform/contacts', [], '{}')) === 'somente_leitura');
foreach (['PUT', 'PATCH', 'DELETE', 'HEAD', 'get'] as $m) check("transporte real: $m até para a URL do token → somente_leitura", erroDe(fn() => $real->enviar($m, RdAuth::TOKEN_URL, [], null)) === 'somente_leitura');
check('transporte real: POST só na URL EXATA do token (com query, barra a mais ou outro host → recusado)',
    erroDe(fn() => $real->enviar('POST', RdAuth::TOKEN_URL . '?x=1', [], '')) === 'somente_leitura' && erroDe(fn() => $real->enviar('POST', RdAuth::TOKEN_URL . '/', [], '')) === 'somente_leitura'
    && erroDe(fn() => $real->enviar('POST', 'https://api.rd.services.evil.example/auth/token', [], '')) === 'somente_leitura');
foreach (['https://api.rd.services/platform/contacts/x', 'http://api.rd.services/platform/segmentations', 'https://api.rd.services:8443/platform/segmentations',
          'https://u@api.rd.services/platform/segmentations', 'https://outro.example/platform/segmentations', 'https://api.rd.services/platform/segmentations/1/contacts/../../x',
          'https://api.rd.services/platform/analytics/emails'] as $u)
    check("transporte real: GET fora da lista ($u) → rota_nao_permitida", erroDe(fn() => $real->enviar('GET', $u, [], null)) === 'rota_nao_permitida');
$f = new RdFalso(); $api = new RdLeitura($f, $ACC);
foreach (['POST', 'PUT', 'PATCH', 'DELETE'] as $m) check("cliente: requisitar('$m') → somente_leitura e o transporte NÃO é chamado", erroDe(fn() => $api->requisitar($m, '/platform/segmentations')) === 'somente_leitura' && $f->chamadas === []);
check('cliente: rota fora da lista → recusada sem chamar o transporte', erroDe(fn() => $api->get('/platform/contacts/a@b.c')) === 'rota_nao_permitida' && $f->chamadas === []);
$src = (string) file_get_contents(__DIR__ . '/../../api/rdstation/RdStation.php');
check("código: o único 'POST' enviado é o do token (RdAuth::token, URL conferida contra as 2 constantes); CURLOPT_CUSTOMREQUEST não existe",
    substr_count($src, "enviar('POST'") === 1 && str_contains($src, "enviar('POST', \$url") && !str_contains($src, 'CURLOPT_CUSTOMREQUEST'));
check('transporte real: a troca do code só em ?token_by=code EXATO (outro parâmetro junto → recusado)', erroDe(fn() => $real->enviar('POST', RdAuth::TOKEN_CODE_URL . '&x=1', [], '')) === 'somente_leitura'
    && erroDe(fn() => $real->enviar('PUT', RdAuth::TOKEN_CODE_URL, [], '')) === 'somente_leitura');

// ---- B. segredos e cifra
check('sem pasta configurada: nao_configurado (nunca chama o RD)', erroDe(fn() => (new RdAuth($f, $seg))->urlAutorizar('x')) === 'nao_configurado' && !$seg->configurado());
file_put_contents("$TMP/client_id", "$ID\n"); file_put_contents("$TMP/client_secret", "$SEC\n"); file_put_contents("$TMP/cripto.key", base64_encode(random_bytes(32)) . "\n");
check('configurado com client_id, client_secret e cripto.key', $seg->configurado() && $seg->cliente() === ['id' => $ID, 'segredo' => $SEC]);
$cr = new RdCrypto($seg->chave()); $env = $cr->cifrar('{"a":"x"}');
check('cifra: volta igual; envelope v1 sem o texto', $cr->decifrar($env) === '{"a":"x"}' && str_starts_with($env, 'v1.') && !str_contains($env, '"a"'));
$p = explode('.', $env); $p[3] = base64_encode(strrev((string) base64_decode($p[3])));
check('cifra: envelope adulterado ou chave errada → cripto', erroDe(fn() => $cr->decifrar(implode('.', $p))) === 'cripto' && erroDe(fn() => (new RdCrypto(random_bytes(32)))->decifrar($env)) === 'cripto');

// ---- C. OAuth: state anti-CSRF + troca do code
$auth = new RdAuth($f, $seg); $tok = new RdTokens($seg, $cr);
$f->rotas['POST /auth/token'] = function (?string $b) use ($ACC, $REF) {
    $j = json_decode((string) $b, true);
    if (($j['client_id'] ?? '') !== 'idInventado-1234' || ($j['client_secret'] ?? '') !== 'segredoInventado_ABCDEFGH5678') return ['status' => 401, 'corpo' => '{}'];
    if (($j['code'] ?? '') === 'codigoBom-123' || ($j['refresh_token'] ?? '') === $REF) return ['status' => 200, 'corpo' => json_encode(['access_token' => $ACC, 'refresh_token' => $REF, 'expires_in' => 86400])];
    return ['status' => 400, 'corpo' => '{"error":"invalid_grant"}'];
};
$S = []; $url = RdOAuth::iniciar($auth, 75, $S, $agora); parse_str((string) parse_url($url, PHP_URL_QUERY), $q);
check('conectar: URL do diálogo com client_id, redirect cadastrado e state de 64 hex; a sessão guarda só o HASH', str_starts_with($url, RdAuth::DIALOGO_URL . '?')
    && $q['client_id'] === $ID && $q['redirect_uri'] === RdAuth::RETORNO_URL && $q['redirect_uri'] === 'https://dshowdash.com.br/api/integracoes/index.php?r=oauth/rdstation/retorno' && preg_match('/^[0-9a-f]{64}$/', $q['state']) === 1
    && $S[RdOAuth::CHAVE_SESSAO]['h'] === hash('sha256', $q['state']) && !str_contains(json_encode($S), $q['state']));
[$ro1, $pa1] = RdOAuth::rotaEParametros(['r' => 'oauth/rdstation/retorno', 'code' => 'c1', 'state' => 's1']);
[$ro2, $pa2] = RdOAuth::rotaEParametros(['r' => 'oauth/rdstation/retorno?code=c2', 'state' => 's2']);   // "?code=" concatenado ao callback com ?r=
[$ro3, $pa3] = RdOAuth::rotaEParametros(['r' => 'oauth/rdstation/conectar?code=x', 'code' => 'manda']);
check('rota por ?r=: normal, "?code=" concatenado (rota limpa + code recuperado) e o $_GET tem precedência', $ro1 === 'oauth/rdstation/retorno' && $pa1['code'] === 'c1'
    && $ro2 === 'oauth/rdstation/retorno' && $pa2['code'] === 'c2' && $pa2['state'] === 's2' && $ro3 === 'oauth/rdstation/conectar' && $pa3['code'] === 'manda'
    && RdOAuth::rotaEParametros([])[0] === '' && RdOAuth::rotaEParametros(['r' => ['x']])[0] === '');
$n0 = count($f->chamadas);
$casos = ['state ausente' => [[], 75, 'state_invalido'], 'state trocado' => [['state' => str_repeat('a', 64), 'code' => 'codigoBom-123'], 75, 'state_invalido'],
          'outro usuário do Dash' => [['state' => $q['state'], 'code' => 'codigoBom-123'], 12, 'state_invalido']];
foreach ($casos as $nome => [$get, $u, $esp]) { $S2 = $S; check("retorno: $nome → $esp, sem trocar code", RdOAuth::retorno($get, $u, $S2, $auth, $tok, $agora) === $esp && !isset($S2[RdOAuth::CHAVE_SESSAO])); }
$S2 = $S; check('retorno: state vencido (> 10 min) → expirado', RdOAuth::retorno(['state' => $q['state'], 'code' => 'codigoBom-123'], 75, $S2, $auth, $tok, $agora->modify('+11 minutes')) === 'expirado');
$S2 = $S; check('retorno: o RD devolveu error (usuário negou) → negado', RdOAuth::retorno(['state' => $q['state'], 'error' => 'access_denied'], 75, $S2, $auth, $tok, $agora) === 'negado');
$S2 = $S; check('retorno: code com caractere estranho → code_invalido', RdOAuth::retorno(['state' => $q['state'], 'code' => "x\ny<script>"], 75, $S2, $auth, $tok, $agora) === 'code_invalido');
check('nenhum dos retornos recusados chamou o RD', count($f->chamadas) === $n0 && !$seg->temToken());
$S2 = $S; check('retorno: code recusado pelo RD → reautorizar, nada gravado', RdOAuth::retorno(['state' => $q['state'], 'code' => 'codigoRuim-999'], 75, $S2, $auth, $tok, $agora) === 'reautorizar' && !$seg->temToken());
$S3 = $S; $r = RdOAuth::retorno(['state' => $q['state'], 'code' => 'codigoBom-123'], 75, $S3, $auth, $tok, $agora);
$disco = implode("\n", array_map('file_get_contents', glob("$TMP/token.enc")));
check('retorno ok: tokens gravados CIFRADOS (0600), nenhum token em texto no disco', $r === 'ok' && $seg->temToken() && !str_contains($disco, $ACC) && !str_contains($disco, $REF)
    && (fileperms("$TMP/token.enc") & 0777) === 0600);
check('state de uso único: o mesmo state de novo → state_invalido', RdOAuth::retorno(['state' => $q['state'], 'code' => 'codigoBom-123'], 75, $S3, $auth, $tok, $agora) === 'state_invalido');
$ult = end($f->chamadas);
check('troca do code: POST JSON em /auth/token?token_by=code com client_id/secret/code (documentação do RD)', $ult['m'] === 'POST' && $ult['u'] === RdAuth::TOKEN_CODE_URL && json_decode($ult['b'], true)['code'] === 'codigoBom-123');

// ---- D. renovação + leitura + sincronização (só números)
check('acesso válido: devolve o token sem renovar', $tok->acesso($auth, $agora) === $ACC && count($f->chamadas) === $n0 + 2);
check('perto de vencer (5 min de folga): renova pelo refresh e grava de novo cifrado', $tok->acesso($auth, $agora->modify('+86200 seconds')) === $ACC && end($f->chamadas)['m'] === 'POST'
    && isset(json_decode(end($f->chamadas)['b'], true)['refresh_token']) && end($f->chamadas)['u'] === RdAuth::TOKEN_URL);
$f->rotas['GET /platform/analytics/funnel'] = fn() => ['status' => 200, 'corpo' => json_encode(['account_id' => 1, 'query_date' => ['start_date' => '2026-10-28', 'end_date' => '2026-11-26'], 'grouped_by' => 'daily', 'funnel' => [['reference_day' => '2026-11-01', 'visitors_count' => 100, 'contacts_count' => 20, 'qualified_contacts_count' => 4, 'opportunities_count' => 3, 'sales_count' => 1], ['reference_day' => '2026-11-02', 'visitors_count' => 50, 'contacts_count' => 5, 'qualified_contacts_count' => 1, 'opportunities_count' => 0, 'sales_count' => 0]]])];
$f->rotas['GET /platform/analytics/conversions'] = fn() => ['status' => 200, 'corpo' => json_encode(['account_id' => 1, 'conversions' => [['asset_id' => 11, 'asset_identifier' => 'LP Teste', 'asset_type' => 'LandingPage', 'visits_count' => 70, 'conversions_count' => 7, 'conversion_rate' => 10.0], ['asset_id' => 12, 'asset_identifier' => 'Form', 'asset_type' => 'Forms', 'visits_count' => 30, 'conversions_count' => 3, 'conversion_rate' => 10.0]]])];
$f->rotas['GET /platform/segmentations'] = fn() => ['status' => 200, 'corpo' => json_encode(['segmentations' => [['id' => 1, 'name' => 'Todos'], ['id' => 2, 'name' => 'Leads']]])];
$e = (new RdSincronizador($seg, $f))->rodar($agora);
check('sincronização: ok, totais somados por campo (funil e conversões), 2 segmentações', $e['estado'] === 'ok' && $e['totais']['funil']['contacts_count'] === 25 && $e['totais']['funil']['visitors_count'] === 150 && !isset($e['totais']['funil']['account_id'])
    && $e['totais']['conversoes']['conversions_count'] === 10 && !isset($e['totais']['conversoes']['asset_id']) && $e['totais']['indisponivel'] === [] && $e['totais']['segmentacoes'] === 2 && $e['totais']['periodo'] === ['start_date' => '2026-10-28', 'end_date' => '2026-11-26'], json_encode($e));
$ej = (string) file_get_contents("$TMP/estado.json");
check('estado.json: só números e datas (sem nome de ativo, sem token)', !str_contains($ej, 'LP Teste') && !str_contains($ej, $ACC) && !str_contains($ej, 'Todos'));
$gets = array_values(array_filter($f->chamadas, fn($c) => $c['m'] === 'GET'));
check('leituras com Bearer e só GET nas rotas da lista', count($gets) === 3 && str_contains(implode(' ', $gets[0]['c']), 'Authorization: Bearer ' . $ACC));
check('todas as chamadas ao RD: GET nas rotas da lista ou POST na URL do token', array_filter($f->chamadas, fn($c) => !($c['m'] === 'GET' || ($c['m'] === 'POST' && in_array($c['u'], [RdAuth::TOKEN_URL, RdAuth::TOKEN_CODE_URL], true)))) === []);

// ---- E. card de Integrações (sem segredo)
$card = RdCard::montar($seg, $agora->modify('+10 minutes'));
check('card: ok ("Em dia") com o horário da última sincronização', $card['estado'] === 'ok' && $card['ultima_sincronizacao'] === $agora->format(DATE_ATOM) && $card['id'] === 'rdstation');
check('card: atrasado depois de 3 h', RdCard::montar($seg, $agora->modify('+181 minutes'))['estado'] === 'atrasado');
$f->rotas['GET /platform/analytics/funnel'] = fn() => ['status' => 401, 'corpo' => '{}'];
$e2 = (new RdSincronizador($seg, $f))->rodar($agora->modify('+1 hour'));
$c2 = RdCard::montar($seg, $agora->modify('+61 minutes'));
check('401 na leitura → card com_problema "nova autorização" + ação Conectar; a última boa é mantida', $e2['estado'] === 'erro' && $e2['erro'] === 'reautorizar' && $c2['estado'] === 'com_problema'
    && $c2['acao']['url'] === RdCard::CONECTAR_URL && $c2['ultima_sincronizacao'] === $agora->format(DATE_ATOM) && $e2['totais']['funil']['contacts_count'] === 25);
check('card nunca carrega segredo', !preg_match('/' . preg_quote($SEC, '/') . '|' . preg_quote($ACC, '/') . '|' . preg_quote($REF, '/') . '|' . preg_quote($ID, '/') . '/', json_encode([$card, $c2])));
// fora do plano (funil só no Advanced): aquele total vira null e o resto segue; nada quebra
$f->rotas['GET /platform/analytics/funnel'] = fn() => ['status' => 403, 'corpo' => '{}'];
$e3 = (new RdSincronizador($seg, $f))->rodar($agora->modify('+2 hours'));
check('funil fora do plano (403): estado ok, funil null ("—"), conversões e segmentações lidas, motivo registrado', $e3['estado'] === 'ok' && $e3['totais']['funil'] === null
    && $e3['totais']['conversoes']['conversions_count'] === 10 && $e3['totais']['indisponivel'] === ['funil' => 'http_403'], json_encode($e3['totais']));
$f->rotas['GET /platform/segmentations'] = fn() => ['status' => 429, 'corpo' => '{}'];
$e4 = (new RdSincronizador($seg, $f))->rodar($agora->modify('+3 hours'));
check('429 para tudo: erro limite, totais da última boa mantidos', $e4['estado'] === 'erro' && $e4['erro'] === 'limite' && $e4['totais'] === $e3['totais']);
// estado.json estragado nunca derruba a tela de Integrações
require_once __DIR__ . '/../../api/geral/GeralV2Integracoes.php';
file_put_contents("$TMP/estado.json", '{"estado":"ok","ultima_sync_ok":"lixo"}');
$li = (new GeralV2Integracoes(new GeralV2(null, null, null, 75), null, $agora, '', 'APP_DSHOW', $seg))->lista()['integracoes'];
$rdc = array_values(array_filter($li, fn($x) => $x['id'] === 'rdstation'))[0] ?? null;
check('estado.json estragado: a lista de Integrações sai inteira; o card do RD vira com_problema', is_array($rdc) && $rdc['estado'] === 'com_problema' && count($li) >= 6, json_encode($rdc, JSON_UNESCAPED_UNICODE));
unlink("$TMP/token.enc");
check('card sem conexão: aguardando + Conectar; sem credenciais: aguardando + rd-segredo.sh', RdCard::montar($seg, $agora)['acao']['rotulo'] === 'Conectar'
    && str_contains(RdCard::montar(new RdSegredos("$TMP/nao-existe"), $agora)['proximo_passo'], 'rd-segredo.sh'));

echo 'teste-rdstation: ', $ok, ' ok, ', count($falhas), " falha(s)\n";
exit($falhas === [] ? 0 : 1);
