<?php
// FOTOS-1 (DIREITA, 19/11) — testes do proxy de fotos (api/midia/FotosCanal.php + FotosAppCliente.php) com TRANSPORTE FALSO:
// nada vai à rede, nenhum segredo real (arquivo temporário 0600 com valor sintético). Rodar: php scripts/midia/testes/fotos-canal.php
declare(strict_types=1);
require __DIR__ . '/../../../api/midia/FotosAppCliente.php';
require __DIR__ . '/../../../api/midia/FotosCanal.php';
$n = 0; $f = 0;
$ok = function (string $nome, bool $c, string $x = '') use (&$n, &$f) { $n++; if (!$c) { $f++; echo "[ERRO] $nome" . ($x ? " · $x" : '') . "\n"; } };
$seg = tempnam(sys_get_temp_dir(), 'midia'); file_put_contents($seg, str_repeat('s', 40) . "\n"); chmod($seg, 0600);   // sintético
$ult = null;
$fake = function (array $resp) use (&$ult) { return function (string $m, string $url, array $cab, string $corpo, int $t) use ($resp, &$ult) { $ult = compact('m', 'url', 'cab', 'corpo'); return $resp + ['status' => 0, 'corpo' => '', 'tipo' => '', 'erro' => null]; }; };
$canal = fn(array $resp, string $s = '') => new FotosCanal(new FotosAppCliente(3100, $s ?: $seg, $fake($resp)), 75);
$CH = 'op-teste-0123456789ab';
$rec = ['canal' => 'dash', 'chave' => $CH, 'confirmado_em' => '2026-11-19T12:00:00.000Z', 'desfecho' => 'aplicada', 'duplicada' => false, 'foto_id' => 812, 'operacao' => 'publicar', 'produto_id' => 550, 'versao_nova' => 7];
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
$vazio = tempnam(sys_get_temp_dir(), 'midia'); file_put_contents($vazio, 'curto'); chmod($vazio, 0600); $ult = null;
$e = $erro(fn() => $canal(['status' => 201], $vazio)->publicar(550, $CH, $JPG));
$ok('sem segredo → 503 recusada, nada enviado', $e && $e->http === 503 && $e->meta['desfecho'] === 'recusada' && $ult === null);
$aberto = tempnam(sys_get_temp_dir(), 'midia'); file_put_contents($aberto, str_repeat('s', 40)); chmod($aberto, 0644);
$e = $erro(fn() => $canal(['status' => 201], $aberto)->capa(812, $CH, 7));
$ok('segredo com permissão aberta = ausente', $e && $e->codigo === 'APP_UNAVAILABLE');

// ordem / versão
$canal(['status' => 200, 'corpo' => json_encode(['desfecho' => 'aplicada', 'recibo' => array_merge($rec, ['operacao' => 'ordem', 'foto_id' => null])])])->ordem(550, $CH, 7, [12, 9, 31]);
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

foreach ([$seg, $vazio, $aberto] as $x) @unlink($x);
echo ($f ? '[ERRO]' : '[OK]  ') . " fotos-canal (proxy de fotos do Dash, transporte falso): $n casos, $f falha(s)\n";
exit($f ? 1 : 0);
