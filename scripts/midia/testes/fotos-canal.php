<?php
// FOTOS-1 (DIREITA, 19/11) — testes do proxy de fotos (api/midia/FotosCanal.php + FotosAppCliente.php) com TRANSPORTE FALSO:
// nada vai à rede, nenhum segredo real (arquivo temporário 0600 com valor sintético). Rodar: php scripts/midia/testes/fotos-canal.php
declare(strict_types=1);
require __DIR__ . '/../../../api/midia/FotosAppCliente.php';
require __DIR__ . '/../../../api/midia/FotosCanal.php';
$n = 0; $f = 0;
$ok = function (string $nome, bool $c, string $x = '') use (&$n, &$f) { $n++; if (!$c) { $f++; echo "[ERRO] $nome" . ($x ? " · $x" : '') . "\n"; } };
// REGRA PERMANENTE (23/11): o teste só escreve num diretório PRIVADO criado e VERIFICADO por ele mesmo — nada fora dele; falhou → aborta.
$tmpBase = realpath(sys_get_temp_dir());
if ($tmpBase === false || $tmpBase === '' || $tmpBase === '/') { echo "[ERRO] tmp do sistema inválido — ABORTADO\n"; exit(2); }
$TMP = $tmpBase . '/midia-canal-' . bin2hex(random_bytes(8));
if (!@mkdir($TMP, 0700) || !is_dir($TMP) || realpath($TMP) !== $TMP || (fileperms($TMP) & 0777) !== 0700) { echo "[ERRO] diretório temporário não criado/verificado — ABORTADO\n"; exit(2); }
$arq = function (string $nome) use ($TMP): string { if ($nome === '' || str_contains($nome, '/') || str_contains($nome, '..')) { echo "[ERRO] nome inválido — ABORTADO\n"; exit(2); } return $TMP . '/' . $nome; };
$seg = $arq('segredo-sintetico.key'); file_put_contents($seg, str_repeat('s', 40) . "\n"); chmod($seg, 0600);   // sintético
$ult = null;
$fake = function (array $resp) use (&$ult) { return function (string $m, string $url, array $cab, string $corpo, int $t) use ($resp, &$ult) { $ult = compact('m', 'url', 'cab', 'corpo'); return $resp + ['status' => 0, 'corpo' => '', 'tipo' => '', 'erro' => null]; }; };
$canal = fn(array $resp, string $s = '') => new FotosCanal(new FotosAppCliente(3100, $s ?: $seg, $fake($resp)), 75);
$CH = 'op-teste-0123456789ab';
$rec = ['canal' => 'dash', 'chave' => $CH, 'confirmado_em' => '2026-11-19T12:00:00.000Z', 'desfecho' => 'aplicada', 'duplicada' => false, 'foto_id' => 812, 'operacao' => 'publicar', 'produto_id' => 550, 'titular_user_id' => 75, 'versao_nova' => 7];   // DSHOW-103: recibo do app ≥ ea77d74 traz o titular
$JPG = "\xFF\xD8\xFF\xE0" . str_repeat('x', 100);
$erro = function (callable $fn) { try { $fn(); return null; } catch (FotosErro $e) { return $e; } };

// permissão: SÓ o 75
$ok('75 publica', FotosPermissoes::publica(75, [75]));
$ok('80 não publica (sem caminho por nível/UARPS)', !FotosPermissoes::publica(80, [75]) && !FotosPermissoes::publica(0, [75]));
$ok('padrão sem env = [75]', FotosPermissoes::publicadores() === [75]);

// tipo pelos bytes
$ok('jpeg/png/webp/heic', FotosCanal::tipoPelosBytes($JPG) === 'jpeg' && FotosCanal::tipoPelosBytes("\x89PNG\r\n\x1A\nxxxx") === 'png'
  && FotosCanal::tipoPelosBytes('RIFF0000WEBPVP8 ') === 'webp' && FotosCanal::tipoPelosBytes("\0\0\0\x18ftypheic0000") === 'heic');
$ok('gif/pdf recusados', FotosCanal::tipoPelosBytes('GIF89a....') === null && FotosCanal::tipoPelosBytes('%PDF-1.4') === null);

// publicar: sucesso com recibo; assinatura e request_id na query
$r = $canal(['status' => 201, 'corpo' => json_encode(['desfecho' => 'aplicada', 'recibo' => $rec])])->publicar(550, $CH, $JPG);
$ok('publicar 201 → aplicada + recibo (operacao foto_publicar, chaves ordenadas)', $r['desfecho'] === 'aplicada' && $r['recibo']['operacao'] === 'foto_publicar' && array_keys($r['recibo']) === array_values(array_unique(array_merge(array_keys($r['recibo']))) ) && $r['recibo']['versao_nova'] === 7);
$ok('vai ao loopback com request_id = chave e user_id 75', str_starts_with($ult['url'], 'http://127.0.0.1:3100/internal/dash/v1/products/550/media?') && str_contains($ult['url'], 'request_id=' . $CH) && str_contains($ult['url'], 'user_id=75'));
$sig = ''; foreach ($ult['cab'] as $c) if (str_starts_with($c, 'X-Dash-Sig: ')) $sig = substr($c, 12);
$ok('assinado (X-Dash-Sig hex 64) e o corpo são os bytes', (bool) preg_match('/^[0-9a-f]{64}$/', $sig) && $ult['corpo'] === $JPG);
$ok('reenvio (x-idempotent-replay) → repetido', $canal(['status' => 200, 'corpo' => json_encode(['desfecho' => 'aplicada', 'recibo' => $rec]), 'replay' => true])->publicar(550, $CH, $JPG)['repetido'] === true);
$dup = $rec; $dup['desfecho'] = 'sem_mudanca'; $dup['duplicada'] = true;
$ok('foto igual → sem_mudanca', $canal(['status' => 200, 'corpo' => json_encode(['desfecho' => 'sem_mudanca', 'recibo' => $dup])])->publicar(550, $CH, $JPG)['desfecho'] === 'sem_mudanca');

// pré-filtro: nada sai para o app
$ult = null; $e = $erro(fn() => $canal(['status' => 201])->publicar(550, $CH, str_repeat('x', 10)));
$ok('formato não aceito → 415 recusada, nada enviado', $e && $e->http === 415 && $e->meta['desfecho'] === 'recusada' && $ult === null);
$e = $erro(fn() => $canal(['status' => 201])->publicar(550, $CH, "\xFF\xD8\xFF" . str_repeat('x', FotosCanal::MAX_BYTES)));
$ok('> 15 MB → 413', $e && $e->http === 413 && $ult === null);
$e = $erro(fn() => $canal(['status' => 201])->publicar(550, 'curta', $JPG));
$ok('chave inválida → 422', $e && $e->http === 422 && $e->codigo === 'VALIDATION_ERROR');

// desconhecido: timeout, rede, 5xx, 2xx sem recibo, corpo ilegível — SEMPRE com a mesma chave
foreach ([['erro' => 'timeout'], ['erro' => 'rede'], ['status' => 500, 'corpo' => '{"error":{"code":"x","message":"y"}}'], ['status' => 201, 'corpo' => '{"desfecho":"aplicada"}'],
          ['status' => 200, 'corpo' => '<html>'], ['status' => 400, 'corpo' => '']] as $i => $resp) {
  $e = $erro(fn() => $canal($resp)->publicar(550, $CH, $JPG));
  $ok("desconhecido #$i (mesma chave, nunca salvo)", $e && $e->meta['desfecho'] === 'desconhecido' && $e->meta['chave'] === $CH && $e->meta['gravado'] === null, $e ? $e->codigo : 'sem erro');
}
// recusa e conflito escritos pelo app
$e = $erro(fn() => $canal(['status' => 409, 'corpo' => json_encode(['error' => ['code' => 'version_conflict', 'message' => 'As fotos mudaram.'], 'desfecho' => 'conflito', 'gravado' => false]), 'versao_galeria' => '9'])->capa(812, $CH, 7));
$ok('409 version_conflict → conflito + versao_atual 9', $e && $e->http === 409 && $e->codigo === 'VERSION_CONFLICT' && $e->meta['desfecho'] === 'conflito' && $e->meta['versao_atual'] === 9);
$e = $erro(fn() => $canal(['status' => 409, 'corpo' => json_encode(['error' => ['code' => 'request_in_progress', 'message' => 'x'], 'desfecho' => 'em_andamento', 'gravado' => null])])->remover(812, $CH, 7));
$ok('409 em andamento', $e && $e->meta['desfecho'] === 'em_andamento');
$e = $erro(fn() => $canal(['status' => 400, 'corpo' => json_encode(['error' => ['code' => 'product_inactive', 'message' => 'Produto inativo.'], 'desfecho' => 'recusada', 'gravado' => false])])->publicar(550, $CH, $JPG));
$ok('400 recusada com a mensagem do app', $e && $e->meta['desfecho'] === 'recusada' && $e->getMessage() === 'Produto inativo.' && $e->codigo === 'PRODUCT_INACTIVE');
$e = $erro(fn() => $canal(['status' => 429, 'corpo' => json_encode(['error' => ['code' => 'rate_limited', 'message' => 'Devagar.'], 'desfecho' => 'recusada']), 'retry_after' => '20'])->restaurar(812, $CH, 7));
$ok('429 com retry_after', $e && $e->http === 429 && $e->meta['retry_after'] === '20');
// sem segredo → recusada (nada saiu)
$vazio = $arq('segredo-curto.key'); file_put_contents($vazio, 'curto'); chmod($vazio, 0600); $ult = null;
$e = $erro(fn() => $canal(['status' => 201], $vazio)->publicar(550, $CH, $JPG));
$ok('sem segredo → 503 recusada, nada enviado', $e && $e->http === 503 && $e->meta['desfecho'] === 'recusada' && $ult === null);
$aberto = $arq('segredo-aberto.key'); file_put_contents($aberto, str_repeat('s', 40)); chmod($aberto, 0644);
$e = $erro(fn() => $canal(['status' => 201], $aberto)->capa(812, $CH, 7));
$ok('segredo com permissão aberta = ausente', $e && $e->codigo === 'APP_UNAVAILABLE');

// ordem / versão
$canal(['status' => 200, 'corpo' => json_encode(['desfecho' => 'aplicada', 'recibo' => array_merge($rec, ['operacao' => 'ordem', 'foto_id' => null, 'ordem' => [12, 9, 31]])])])->ordem(550, $CH, 7, [12, 9, 31]);
$ok('ordem vai na query (12,9,31) com versao', str_contains($ult['url'], 'ordem=12%2C9%2C31') && str_contains($ult['url'], 'versao=7') && $ult['corpo'] === '');
$ok('ordem com repetição → 422', ($e = $erro(fn() => $canal([])->ordem(550, $CH, 7, [12, 12]))) && $e->http === 422);
$ok('versão ausente → 422', ($e = $erro(fn() => $canal([])->capa(812, $CH, 0))) && $e->http === 422);

// conferir
$cf = $canal(['status' => 200, 'corpo' => json_encode(['estado' => 'aplicada', 'operacao' => 'publicar', 'desfecho' => 'aplicada', 'recibo' => $rec])])->conferir($CH);
$ok('conferir aplicada → mesmo recibo', $cf['resultado'] === 'aplicada' && $cf['recibo']['foto_id'] === 812 && $cf['operacao'] === 'foto_publicar');
$ok('conferir nao_encontrada → reenvio seguro', $canal(['status' => 200, 'corpo' => '{"estado":"nao_encontrada"}'])->conferir($CH)['reenvio_seguro'] === true);
$ok('conferir pode_estar_demorando → em_andamento + sinal', $canal(['status' => 200, 'corpo' => '{"estado":"pode_estar_demorando","operacao":"publicar","desde":"x"}'])->conferir($CH)['sinal'] === 'pode_estar_demorando');
$na = $canal(['status' => 200, 'corpo' => json_encode(['estado' => 'nao_aplicada', 'operacao' => 'capa', 'desfecho' => 'recusada', 'http_status' => 400, 'erro' => ['code' => 'x', 'message' => 'Não pode.']])])->conferir($CH);
$ok('conferir nao_aplicada → erro', $na['resultado'] === 'nao_aplicada' && $na['erro']['mensagem'] === 'Não pode.');

// imagem
$im = $canal(['status' => 200, 'corpo' => 'BYTES', 'tipo' => 'image/webp', 'etag' => '"v3"'])->imagem(812, 256, false, null);
$ok('imagem 200 com ETag', $im['status'] === 200 && $im['etag'] === '"v3"' && str_contains($ult['url'], 'size=256'));
$canal(['status' => 304, 'etag' => '"v3"'])->imagem(812, 256, true, '"v3"');
$ok('If-None-Match repassado; removida=1', in_array('If-None-Match: "v3"', $ult['cab'], true) && str_contains($ult['url'], 'removida=1'));
$ok('tamanho fora da lista → 422', ($e = $erro(fn() => $canal([])->imagem(812, 999, false, null))) && $e->http === 422);
$ok('imagem com tipo inesperado → erro', ($e = $erro(fn() => $canal(['status' => 200, 'corpo' => '<html>', 'tipo' => 'text/html'])->imagem(812, 256, false, null))) !== null);
// galeria
$g = $canal(['status' => 200, 'corpo' => json_encode(['produto' => ['id' => 550], 'versao_galeria' => 7, 'limite_fotos' => 30, 'fotos' => [], 'removidas' => []])])->galeria(550);
$ok('galeria 200', $g['versao_galeria'] === 7);
$ok('galeria 403 do app', ($e = $erro(fn() => $canal(['status' => 403, 'corpo' => '{"error":{"code":"sem_permissao","message":"x"}}'])->galeria(550))) && $e->http === 403);


// ── DSHOW-100 (Codex): casos novos — os 38 acima continuam ────────────────────────────────────────────────────────────────
require_once __DIR__ . '/../../../api/midia/FotosPortas.php';
// portas (função pura usada pelo index.php)
foreach (FotosPortas::DESLIGADO as $fonte) $ok("100 flag OFF para todos ($fonte) → 404 antes da sessão", FotosPortas::antesDaSessao($fonte) === [404, 'NOT_FOUND']);
$ok('100 flag ilegível = OFF → 404 (DSHOW-103 §1: inválido = OFF; nunca liga)', FotosPortas::antesDaSessao('error') === [404, 'NOT_FOUND']);
$ok('100 flag ligada (override/rollout) → segue para a sessão', FotosPortas::antesDaSessao('override') === null && FotosPortas::antesDaSessao('rollout') === null);
$ok('100 rota desconhecida → 404', FotosPortas::rotaEFlags('GET', 'publicar', true, true) === [404, 'NOT_FOUND'] && FotosPortas::rotaEFlags('POST', 'galeria', true, true) === [404, 'NOT_FOUND'] && FotosPortas::rotaEFlags('DELETE', 'remover', true, true) === [404, 'NOT_FOUND']);
$ok('100 pessoa fora da flag → 404', FotosPortas::rotaEFlags('GET', 'galeria', false, true) === [404, 'NOT_FOUND']);
$ok('100 POST com escrita desligada → 404; GET não depende da escrita', FotosPortas::rotaEFlags('POST', 'capa', true, false) === [404, 'NOT_FOUND'] && FotosPortas::rotaEFlags('GET', 'galeria', true, false) === null);
$ok('100 usuário diferente do 75 → 403 NOT_AUTHORIZED; o 75 passa', FotosPortas::publicador(990080, [75]) === [403, 'NOT_AUTHORIZED'] && FotosPortas::publicador(80, [75]) === [403, 'NOT_AUTHORIZED'] && FotosPortas::publicador(75, [75]) === null);

// destino fixo: host e prefixo constantes; porta só da configuração; caminho validado
$ult = null; $canal(['status' => 200, 'corpo' => '{"estado":"nao_encontrada"}'])->conferir($CH);
$ok('100 destino fixo: http://127.0.0.1:3100/internal/dash/v1/operacoes/<chave>', str_starts_with($ult['url'], 'http://127.0.0.1:3100/internal/dash/v1/operacoes/' . $CH . '?'));
$porta = new FotosCanal(new FotosAppCliente(3199, $seg, $fake(['status' => 200, 'corpo' => '{"estado":"nao_encontrada"}'])), 75); $porta->conferir($CH);
$ok('100 porta vem só da configuração (3199) e o host continua 127.0.0.1', str_starts_with($ult['url'], 'http://127.0.0.1:3199/internal/dash/v1/'));
$ok('100 porta fora da faixa recusada', (function () { try { new FotosAppCliente(80); return false; } catch (InvalidArgumentException) { return true; } })());
$cli = new FotosAppCliente(3100, $seg, $fake([]));
foreach (['/../etc/passwd', '/products/1?x=y', 'products', '/products/1#a', '//evil'] as $mau) {
  $ok("100 caminho inválido recusado ($mau)", (function () use ($cli, $mau) { try { $cli->pedir('GET', $mau, []); return false; } catch (InvalidArgumentException) { return true; } })());
}
$ok('100 cURL real: sem redirecionamento, só HTTP, sem proxy (código)', (function () { $src = file_get_contents(__DIR__ . '/../../../api/midia/FotosAppCliente.php');
  return str_contains($src, 'CURLOPT_FOLLOWLOCATION => false') && str_contains($src, 'CURLOPT_PROTOCOLS => CURLPROTO_HTTP') && str_contains($src, "CURLOPT_NOPROXY => '*'") && str_contains($src, "public const HOST = '127.0.0.1';"); })());

// assinatura e corpo idênticos nas duas pontas: o "app" falso refaz o HMAC com o mesmo segredo e confere o corpo
$verifica = function (string $m, string $url, array $cab, string $corpo) use ($seg) {
  $h = []; foreach ($cab as $c) { [$k, $v] = array_map('trim', explode(':', $c, 2)) + [1 => '']; $h[strtolower($k)] = $v; }
  $u = parse_url($url); $cq = $u['path'] . (isset($u['query']) ? '?' . $u['query'] : '');
  $base = $h['x-dash-ts'] . "\n" . $h['x-dash-nonce'] . "\n" . $m . "\n" . $cq . "\n" . hash('sha256', $corpo);
  return hash_equals(hash_hmac('sha256', $base, trim((string) file_get_contents($seg))), $h['x-dash-sig'] ?? '') && ctype_digit($h['x-dash-ts']) && abs(time() - (int) $h['x-dash-ts']) < 5 && strlen($h['x-dash-nonce']) >= 24;
};
$recebido = null;
$appVerifica = function (string $m, string $url, array $cab, string $corpo, int $t) use ($verifica, &$recebido, $rec) {
  $recebido = ['ok' => $verifica($m, $url, $cab, $corpo), 'corpo' => $corpo, 'm' => $m, 'cab' => $cab];
  return ['status' => $recebido['ok'] ? 201 : 401, 'corpo' => $recebido['ok'] ? json_encode(['desfecho' => 'aplicada', 'recibo' => $rec]) : '{}', 'tipo' => 'application/json', 'erro' => null];
};
$cv = new FotosCanal(new FotosAppCliente(3100, $seg, $appVerifica), 75);
$cv->publicar(550, $CH, $JPG);
$ok('100 publicar: o app recalcula o HMAC (ts, nonce, método, caminho+query, sha256 do corpo) e confere', $recebido['ok'] === true);
$ok('100 publicar: corpo recebido = bytes enviados (byte a byte)', $recebido['corpo'] === $JPG && $recebido['m'] === 'POST' && in_array('Content-Type: application/octet-stream', $recebido['cab'], true));
$erro(fn() => $cv->capa(812, $CH, 7));   // só a assinatura importa aqui (o recibo de publicar não correlaciona com capa → desconhecido, de propósito)
$ok('100 capa (POST sem corpo): assinatura confere com sha256("")', $recebido['ok'] === true && $recebido['corpo'] === '');
$cv2 = new FotosCanal(new FotosAppCliente(3100, $seg, function ($m, $url, $cab, $corpo, $t) use ($verifica, &$recebido) { $cab2 = array_map(fn($c) => str_starts_with($c, 'X-Dash-Sig: ') ? 'X-Dash-Sig: ' . str_repeat('0', 64) : $c, $cab);
  $recebido = ['ok' => $verifica($m, $url, $cab2, $corpo)]; return ['status' => 401, 'corpo' => '{"error":{"code":"assinatura_invalida","message":"x"}}', 'tipo' => 'application/json', 'erro' => null]; }), 75);
$e = $erro(fn() => $cv2->publicar(550, $CH, $JPG));
$ok('100 assinatura adulterada não confere no app; 401 do app → 503 recusada (nada gravado)', $recebido['ok'] === false && $e && $e->http === 503 && $e->meta['desfecho'] === 'recusada' && $e->meta['gravado'] === false);

// timeout em todas as escritas → desconhecido com a MESMA chave; leitura → 503 sem desfecho
foreach (['capa' => fn($c) => $c->capa(812, $CH, 7), 'ordem' => fn($c) => $c->ordem(550, $CH, 7, [1, 2]), 'remover' => fn($c) => $c->remover(812, $CH, 7), 'restaurar' => fn($c) => $c->restaurar(812, $CH, 7)] as $op => $fn) {
  $e = $erro(fn() => $fn($canal(['erro' => 'timeout'])));
  $ok("100 timeout em $op → 504 desconhecido, mesma chave", $e && $e->http === 504 && $e->meta['desfecho'] === 'desconhecido' && $e->meta['chave'] === $CH);
}
$e = $erro(fn() => $canal(['erro' => 'timeout'])->galeria(550));
$ok('100 timeout na leitura → 503 APP_UNAVAILABLE sem desfecho de escrita', $e && $e->http === 503 && !isset($e->meta['desfecho']));
$e = $erro(fn() => $canal(['erro' => 'timeout'])->conferir($CH));
$ok('100 timeout no conferir → 503 (o conferir nunca vira "desconhecido de escrita")', $e && $e->http === 503 && !isset($e->meta['desfecho']));

// 401 / 403 / 409 / 422 / 503 do app
$env = fn(int $st, string $code, string $des) => ['status' => $st, 'corpo' => json_encode(['error' => ['code' => $code, 'message' => "msg $code"], 'desfecho' => $des, 'gravado' => $des === 'desconhecido' ? null : false])];
$e = $erro(fn() => $canal(['status' => 401, 'corpo' => '{"error":{"code":"assinatura_invalida"}}'])->galeria(550));
$ok('100 leitura: 401 do app → 503 APP_UNAVAILABLE', $e && $e->http === 503 && $e->codigo === 'APP_UNAVAILABLE');
$e = $erro(fn() => $canal($env(403, 'sem_permissao', 'recusada'))->remover(812, $CH, 7));
$ok('100 escrita: 403 do app → 403 recusada, gravado false', $e && $e->http === 403 && $e->codigo === 'SEM_PERMISSAO' && $e->meta['desfecho'] === 'recusada' && $e->meta['gravado'] === false);
$e = $erro(fn() => $canal($env(409, 'photo_limit', 'conflito'))->publicar(550, $CH, $JPG));
$ok('100 escrita: 409 photo_limit → conflito', $e && $e->http === 409 && $e->meta['desfecho'] === 'conflito');
$e = $erro(fn() => $canal($env(422, 'invalid_image', 'recusada'))->publicar(550, $CH, $JPG));
$ok('100 escrita: 422 → recusada com a mensagem do app', $e && $e->http === 422 && $e->getMessage() === 'msg invalid_image');
$e = $erro(fn() => $canal($env(503, 'indisponivel', 'desconhecido'))->restaurar(812, $CH, 7));
$ok('100 escrita: 503 do app → desconhecido (pode ter gravado), mesma chave', $e && $e->meta['desfecho'] === 'desconhecido' && $e->meta['chave'] === $CH);
$e = $erro(fn() => $canal(['status' => 503, 'corpo' => ''])->galeria(550));
$ok('100 leitura: 503 do app → 503 APP_UNAVAILABLE', $e && $e->http === 503);
$e = $erro(fn() => $canal([])->ordem(550, $CH, 7, range(1, 101)));
$ok('100 ordem com 101 IDs → 422, nada enviado (limite do app = 100)', $e && $e->http === 422 && FotosCanal::MAX_ORDEM === 100);
$ult = null; $canal(['status' => 200, 'corpo' => json_encode(['desfecho' => 'aplicada', 'recibo' => array_merge($rec, ['operacao' => 'ordem', 'foto_id' => null, 'ordem' => range(1, 100)])])])->ordem(550, $CH, 7, range(1, 100));
$ok('100 ordem com exatamente 100 IDs passa', $ult !== null);

// GET de recibo (conferir) sem efeito: só GET, corpo vazio, nenhum request_id de escrita
$ult = null; $canal(['status' => 200, 'corpo' => json_encode(['estado' => 'aplicada', 'operacao' => 'publicar', 'desfecho' => 'aplicada', 'recibo' => $rec])])->conferir($CH);
$ok('100 conferir = GET sem corpo, sem request_id (não reexecuta)', $ult['m'] === 'GET' && $ult['corpo'] === '' && !str_contains($ult['url'], 'request_id='));

// nenhum vazamento do segredo: em nenhuma URL, cabeçalho, mensagem ou meta de erro, nem nas respostas
$segredo = trim((string) file_get_contents($seg)); $vaz = [];
$capt = function (string $m, string $url, array $cab, string $corpo, int $t) use (&$vaz, $segredo) { if (str_contains($url . implode("\n", $cab) . $corpo, $segredo)) $vaz[] = $url; return ['status' => 500, 'corpo' => '', 'tipo' => '', 'erro' => null]; };
$cs = new FotosCanal(new FotosAppCliente(3100, $seg, $capt), 75);
$saidas = [];
foreach ([fn() => $cs->publicar(550, $CH, $JPG), fn() => $cs->capa(1, $CH, 1), fn() => $cs->galeria(1), fn() => $cs->conferir($CH), fn() => $cs->imagem(1, 256, false, null)] as $fn) { $x = $erro($fn); $saidas[] = $x ? json_encode([$x->getMessage(), $x->meta, $x->codigo]) : ''; }
$ok('100 segredo nunca sai em URL/cabeçalho/corpo para o app nem em mensagem/meta de erro', $vaz === [] && !str_contains(implode('', $saidas), $segredo));
$ok('100 segredo nunca é logado pelo cliente (código não passa o segredo ao error_log)', !preg_match('/error_log\([^;]*\$s(egredo)?\b/', (string) file_get_contents(__DIR__ . '/../../../api/midia/FotosAppCliente.php')));

echo ($f ? '[ERRO]' : '[OK]  ') . " fotos-canal (proxy de fotos do Dash, transporte falso): $n casos, $f falha(s)\n";
exit($f ? 1 : 0);
