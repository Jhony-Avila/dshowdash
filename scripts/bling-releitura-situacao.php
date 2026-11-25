<?php
declare(strict_types=1);
// scripts/bling-releitura-situacao.php — PORTÃO BLING SITUAÇÃO (ACIMA_DIREITA, 23/11/2026). Só LEITURA no Bling (GET).
//
// Relê TODOS os pedidos de venda pela listagem (páginas de 100, uma página por vez, pausa entre páginas, 429 respeitado pelo
// BlingClient) e grava, pelo MESMO caminho da sincronização normal, o id real da situação (coluna nova situacao_bling_id) e a loja
// (loja_bling_id, coluna do portão BLING LOJA) — UMA releitura para as duas. Pode parar e retomar (progresso por página).
//
// Rodar como o usuário do php-fpm, dentro da release (lê o .env da própria release, como o bling-worker.php):
//   sudo -u www-data php scripts/bling-releitura-situacao.php                       # contagem (só banco local; NÃO chama o Bling)
//   sudo -u www-data php scripts/bling-releitura-situacao.php --situacoes           # lista de situações do módulo de vendas (2 GETs)
//   sudo -u www-data php scripts/bling-releitura-situacao.php --executar --confirmo="RELER PEDIDOS DO BLING" [--pausa-ms=1500]
//   sudo -u www-data php scripts/bling-releitura-situacao.php --parar               # pede parada; a página em curso termina e grava
// Saída: [OK]/[ERRO] e contagens; nunca token, chave ou dado pessoal.

if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
$raiz = dirname(__DIR__);
const FRASE = 'RELER PEDIDOS DO BLING';
const ARQ_PARAR = '/var/lib/bling/releitura-situacao.parar';

$opt = getopt('', ['situacoes', 'executar', 'confirmo:', 'parar', 'pausa-ms:', 'conta:']);
if (isset($opt['parar'])) {
    if (@touch(ARQ_PARAR) === false) { fwrite(STDERR, "[ERRO] não consegui criar " . ARQ_PARAR . "\n"); exit(1); }
    echo "[OK] parada pedida — a releitura termina a página em curso, grava o progresso e sai (rodar de novo retoma)\n"; exit(0);
}
if (isset($opt['executar']) && ($opt['confirmo'] ?? '') !== FRASE) {
    fwrite(STDERR, "[ERRO] --executar exige --confirmo=\"" . FRASE . "\" — nada feito\n"); exit(2);
}
$pausa = isset($opt['pausa-ms']) ? (int) $opt['pausa-ms'] : 1500;
if ($pausa < 500 || $pausa > 60000) { fwrite(STDERR, "[ERRO] --pausa-ms entre 500 e 60000\n"); exit(2); }

foreach (file($raiz . '/.env') as $linha) {
    $linha = trim($linha);
    if ($linha === '' || $linha[0] === '#' || !str_contains($linha, '=')) continue;
    [$k, $v] = explode('=', $linha, 2);
    $k = trim($k); $v = trim($v, " \t\"'");
    putenv("$k=$v"); $_ENV[$k] = $v;
}
define('BLING_ENTRADA', true);
foreach (['lib/BlingSituacoes', 'lib/BlingCrypto', 'lib/BlingTransporte', 'lib/BlingOAuth', 'lib/BlingVersionAdapter', 'lib/BlingNormalizer',
          'repositories/BlingRepository', 'lib/BlingClient', 'services/BlingAuthService', 'services/BlingSyncService'] as $f) {
    require_once $raiz . '/api/bling/' . $f . '.php';
}

$repo = new BlingRepository();
if (!$repo->disponivel() || !$repo->schemaAplicado() || !BlingCrypto::disponivel()) { fwrite(STDERR, "[ERRO] banco BLING, esquema ou chave de cifra indisponível\n"); exit(1); }
$contas = isset($opt['conta']) ? [(int) $opt['conta']] : $repo->contasAtivas();
if (count($contas) !== 1) { fwrite(STDERR, "[ERRO] esperava exatamente 1 conta Bling ativa (achei " . count($contas) . "); use --conta=<id>\n"); exit(2); }
$conta = (int) $contas[0];
$sync = new BlingSyncService($repo, new BlingAuthService($repo, new BlingTransporteCurl()));
$mostrar = static fn(array $x) => print(json_encode($x, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT) . "\n");

echo "== contagem (banco local) — conta $conta\n";
$antes = $sync->contagemSituacao($conta);
$mostrar($antes);

if (isset($opt['situacoes'])) {
    echo "== situações do módulo de vendas (2 GETs ao Bling)\n";
    $s = $sync->lerSituacoesVendas($conta);
    $mostrar($s);
    if ($s['situacao'] === 'escopo_ausente') { echo "[AVISO] o token atual NÃO tem o escopo de situações — nada foi reautorizado; decisão do Jhony\n"; exit(3); }
    exit($s['situacao'] === 'ok' ? 0 : 1);
}
if (!isset($opt['executar'])) { echo "[OK] só contagem — nada foi chamado no Bling. Para reler: --executar --confirmo=\"" . FRASE . "\"\n"; exit(0); }

if (!$antes['tem_coluna_situacao_id']) { fwrite(STDERR, "[ERRO] falta a coluna situacao_bling_id — rode antes a migração 20261123-situacao\n"); exit(2); }
if (!$antes['tem_coluna_loja']) { fwrite(STDERR, "[ERRO] falta a coluna loja_bling_id — rode antes o portão BLING LOJA (para não reler os pedidos duas vezes)\n"); exit(2); }
$trava = @fopen('/var/lib/bling/releitura-situacao.lock', 'c');
if ($trava === false || !flock($trava, LOCK_EX | LOCK_NB)) { fwrite(STDERR, "[ERRO] já há uma releitura rodando\n"); exit(2); }
if (is_file(ARQ_PARAR)) { @unlink(ARQ_PARAR); }   // pedido de parada ANTIGO não vale para esta execução

$t0 = microtime(true);
$r = $sync->releituraPedidos($conta, static fn(): bool => is_file(ARQ_PARAR), static function (int $ms): void { usleep($ms * 1000); }, $pausa);
echo "== releitura\n"; $mostrar($r + ['segundos' => round(microtime(true) - $t0, 1)]);
echo "== contagem depois\n"; $mostrar($sync->contagemSituacao($conta));
if (is_file(ARQ_PARAR)) { @unlink(ARQ_PARAR); }
echo match ($r['situacao']) {
    'concluida' => "[OK] releitura concluída\n",
    'interrompida' => "[OK] parada a pedido na página {$r['pagina_inicial']}+{$r['paginas']} — rodar de novo retoma\n",
    default => "[ERRO] releitura não concluiu ({$r['situacao']}) — o progresso ficou gravado; rodar de novo retoma\n",
};
exit($r['situacao'] === 'concluida' || $r['situacao'] === 'interrompida' ? 0 : 1);
