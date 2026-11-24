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
//   sudo -u www-data php scripts/bling-releitura-situacao.php --executar --confirmo="RELER PEDIDOS DO BLING" --pedidos=<id,id,…>
//        # relê SÓ esses pedidos (GET por id, um por vez, com pausa) — NÃO mexe no checkpoint da releitura inteira (Codex DSHOW-112, condição 4)
//   sudo -u www-data php scripts/bling-releitura-situacao.php --parar               # pede parada; a página em curso termina e grava
// Saída: rc 0 = concluída (ou parada a pedido SEM erro); rc 1 = erro, concluída COM erros (PARA-STATUS §132) ou parada depois de erro
//        (Codex DSHOW-113 P2); rc 2 = uso errado — validado ANTES de qualquer efeito (nada feito, nem o marcador de parada).
// Modos mutuamente exclusivos: --parar (sozinho) | --situacoes [--conta] | --executar --confirmo=… [--pedidos|--pausa-ms|--conta] | contagem [--conta].
// Saída: [OK]/[ERRO] e contagens; nunca token, chave ou dado pessoal.

if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
$raiz = dirname(__DIR__);
const FRASE = 'RELER PEDIDOS DO BLING';
const ARQ_PARAR = '/var/lib/bling/releitura-situacao.parar';

// Opções aceitas (notação do getopt: ':' = exige valor). O portão BLING SITUAÇÃO procura o literal 'pedidos:' para saber que o modo existe.
const OPCOES = ['situacoes', 'executar', 'confirmo:', 'parar', 'pausa-ms:', 'conta:', 'pedidos:'];
const MAX_PEDIDOS = 1000;   // = BlingSyncService::MAX_PEDIDOS_REPROCESSO

/**
 * Codex DSHOW-113 (1): validação CENTRAL de TODOS os argumentos, ANTES de qualquer efeito (marcador de parada, .env, banco, Bling, checkpoint).
 * Função pura: não lê arquivo, não escreve, não sai. Entrada inválida → ['erro' => mensagem] e o chamador sai com rc 2.
 * - só a forma --opcao / --opcao=valor; opção desconhecida, repetida, flag com valor ou valor vazio = erro (o getopt descartava "--x=" em silêncio);
 * - modos MUTUAMENTE EXCLUSIVOS: parar | situacoes | executar (releitura inteira ou --pedidos) | contagem;
 *   --parar não aceita nenhuma outra opção; --situacoes só com --conta; --confirmo/--pausa-ms/--pedidos só com --executar;
 * - --pedidos: ids numéricos do Bling, sem repetição, 1..MAX_PEDIDOS; inválido NUNCA vira a releitura inteira.
 * @param list<string> $args argumentos SEM o nome do script
 * @return array{erro:string}|array{modo:string, conta:?int, pausa:int, pedidos:?list<string>}
 */
function validarArgumentos(array $args): array
{
    $spec = [];
    foreach (OPCOES as $o) { $spec[rtrim($o, ':')] = str_ends_with($o, ':'); }
    $v = [];
    foreach ($args as $a) {
        $a = (string) $a;
        if (!preg_match('/^--([a-z][a-z-]*)(=(.*))?$/s', $a, $m)) { return ['erro' => 'argumento não reconhecido: ' . mb_substr($a, 0, 40)]; }
        $nome = $m[1]; $temValor = isset($m[2]) && $m[2] !== ''; $valor = $m[3] ?? '';
        if (!array_key_exists($nome, $spec)) { return ['erro' => "opção desconhecida --$nome"]; }
        if (array_key_exists($nome, $v)) { return ['erro' => "--$nome só uma vez"]; }
        if ($spec[$nome] && !$temValor) { return ['erro' => "--$nome exige valor (--$nome=…)"]; }
        if ($spec[$nome] && trim($valor) === '') {
            return ['erro' => $nome === 'pedidos' ? '--pedidos sem lista (vazio) — NÃO se relê tudo no lugar' : "--$nome vazio"];
        }
        if (!$spec[$nome] && $temValor) { return ['erro' => "--$nome não aceita valor"]; }
        $v[$nome] = $spec[$nome] ? $valor : true;
    }
    $modos = array_values(array_intersect(['parar', 'situacoes', 'executar'], array_keys($v)));
    if (count($modos) > 1) { return ['erro' => 'modos incompatíveis: --' . implode(' e --', $modos) . ' (use um de cada vez)']; }
    $modo = $modos[0] ?? 'contagem';
    $permitidas = ['parar' => [], 'situacoes' => ['conta'], 'executar' => ['confirmo', 'pausa-ms', 'conta', 'pedidos'], 'contagem' => ['conta']][$modo];
    foreach (array_keys($v) as $nome) {
        if ($nome === $modo || in_array($nome, $permitidas, true)) { continue; }
        if ($modo === 'parar') { return ['erro' => "--parar não aceita outras opções (veio --$nome)"]; }
        return ['erro' => "--$nome exige --executar --confirmo=\"" . FRASE . '"'];
    }
    if ($modo === 'executar' && ($v['confirmo'] ?? '') !== FRASE) { return ['erro' => '--executar exige --confirmo="' . FRASE . '"']; }
    $conta = null;
    if (isset($v['conta'])) {
        if (!preg_match('/^[1-9][0-9]{0,9}$/', $v['conta'])) { return ['erro' => '--conta precisa ser um id numérico']; }
        $conta = (int) $v['conta'];
    }
    $pausa = 1500;
    if (isset($v['pausa-ms'])) {
        if (!preg_match('/^[0-9]{1,5}$/', $v['pausa-ms']) || (int) $v['pausa-ms'] < 500 || (int) $v['pausa-ms'] > 60000) { return ['erro' => '--pausa-ms entre 500 e 60000']; }
        $pausa = (int) $v['pausa-ms'];
    }
    $pedidos = null;
    if (isset($v['pedidos'])) {
        $brutos = array_map('trim', explode(',', $v['pedidos']));
        $invalidos = array_values(array_filter($brutos, static fn(string $x): bool => !preg_match('/^[1-9][0-9]{0,19}$/', $x)));
        if ($invalidos !== []) {
            return ['erro' => '--pedidos com ' . count($invalidos) . ' item(ns) inválido(s) (ex.: '
                . implode(', ', array_map(static fn($x) => $x === '' ? '(vazio)' : mb_substr($x, 0, 20), array_slice($invalidos, 0, 5)))
                . ") — só ids numéricos do Bling; 'SEM-ID' não se relê por id"];
        }
        if (count(array_unique($brutos)) !== count($brutos)) { return ['erro' => '--pedidos com id repetido']; }
        if (count($brutos) > MAX_PEDIDOS) { return ['erro' => '--pedidos acima de ' . MAX_PEDIDOS . ' (veio ' . count($brutos) . ')']; }
        $pedidos = $brutos;
    }
    return ['modo' => $modo === 'executar' ? ($pedidos !== null ? 'pedidos' : 'releitura') : $modo, 'conta' => $conta, 'pausa' => $pausa, 'pedidos' => $pedidos];
}

$args = validarArgumentos(array_slice($argv, 1));
if (isset($args['erro'])) { fwrite(STDERR, '[ERRO] ' . $args['erro'] . " — nada feito\n"); exit(2); }
$modo = $args['modo']; $pausa = $args['pausa']; $pedidos = $args['pedidos'];

// daqui para baixo os argumentos já são válidos e o modo é único
if ($modo === 'parar') {
    if (@touch(ARQ_PARAR) === false) { fwrite(STDERR, "[ERRO] não consegui criar " . ARQ_PARAR . "\n"); exit(1); }
    echo "[OK] parada pedida — a releitura termina a página em curso, grava o progresso e sai (rodar de novo retoma)\n"; exit(0);
}

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
$contas = $args['conta'] !== null ? [$args['conta']] : $repo->contasAtivas();
if (count($contas) !== 1) { fwrite(STDERR, "[ERRO] esperava exatamente 1 conta Bling ativa (achei " . count($contas) . "); use --conta=<id>\n"); exit(2); }
$conta = (int) $contas[0];
$sync = new BlingSyncService($repo, new BlingAuthService($repo, new BlingTransporteCurl()));
$mostrar = static fn(array $x) => print(json_encode($x, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT) . "\n");

echo "== contagem (banco local) — conta $conta\n";
$antes = $sync->contagemSituacao($conta);
$mostrar($antes);

if ($modo === 'situacoes') {
    echo "== situações do módulo de vendas (2 GETs ao Bling)\n";
    $s = $sync->lerSituacoesVendas($conta);
    $mostrar($s);
    if ($s['situacao'] === 'escopo_ausente') { echo "[AVISO] o token atual NÃO tem o escopo de situações — nada foi reautorizado; decisão do Jhony\n"; exit(3); }
    exit($s['situacao'] === 'ok' ? 0 : 1);
}
if ($modo === 'contagem') { echo "[OK] só contagem — nada foi chamado no Bling. Para reler: --executar --confirmo=\"" . FRASE . "\"\n"; exit(0); }

if (!$antes['tem_coluna_situacao_id']) { fwrite(STDERR, "[ERRO] falta a coluna situacao_bling_id — rode antes a migração 20261123-situacao\n"); exit(2); }
if (!$antes['tem_coluna_loja']) { fwrite(STDERR, "[ERRO] falta a coluna loja_bling_id — rode antes o portão BLING LOJA (para não reler os pedidos duas vezes)\n"); exit(2); }
$trava = @fopen('/var/lib/bling/releitura-situacao.lock', 'c');
if ($trava === false || !flock($trava, LOCK_EX | LOCK_NB)) { fwrite(STDERR, "[ERRO] já há uma releitura rodando\n"); exit(2); }
if (is_file(ARQ_PARAR)) { @unlink(ARQ_PARAR); }   // pedido de parada ANTIGO não vale para esta execução

$t0 = microtime(true);
if ($pedidos !== null) {
    echo "== releitura SÓ dos pedidos indicados (" . count($pedidos) . ") — o checkpoint da releitura inteira não é tocado\n";
    $r = $sync->releituraPedidosIds($conta, $pedidos, static fn(): bool => is_file(ARQ_PARAR), static function (int $ms): void { usleep($ms * 1000); }, $pausa);
    $mostrar($r + ['segundos' => round(microtime(true) - $t0, 1)]);
    echo "== contagem depois\n"; $mostrar($sync->contagemSituacao($conta));
    if (is_file(ARQ_PARAR)) { @unlink(ARQ_PARAR); }
    echo match ($r['situacao']) {
        'concluida' => "[OK] {$r['consultados']} pedido(s) relido(s), 0 erro(s)\n",
        'interrompida' => "[OK] parada a pedido depois de {$r['consultados']} de {$r['pedidos']} pedido(s) — rode de novo só com os que faltam\n",
        'concluida_com_erros' => "[ERRO] {$r['erros']} pedido(s) com erro: " . implode(',', $r['afetados_com_erro']) . " — nada foi gravado neles\n",
        // Codex DSHOW-113 (P2): parada a pedido DEPOIS de erro não é sucesso
        'interrompida_com_erros' => "[ERRO] parada a pedido depois de {$r['consultados']} de {$r['pedidos']}, com {$r['erros']} erro(s): " . implode(',', $r['afetados_com_erro']) . " — nada foi gravado neles\n",
        default => "[ERRO] releitura por pedido não rodou ({$r['situacao']})\n",
    };
    exit($r['situacao'] === 'concluida' || $r['situacao'] === 'interrompida' ? 0 : 1);
}
$r = $sync->releituraPedidos($conta, static fn(): bool => is_file(ARQ_PARAR), static function (int $ms): void { usleep($ms * 1000); }, $pausa);
echo "== releitura\n"; $mostrar($r + ['segundos' => round(microtime(true) - $t0, 1)]);
echo "== contagem depois\n"; $mostrar($sync->contagemSituacao($conta));
if (is_file(ARQ_PARAR)) { @unlink(ARQ_PARAR); }
echo match ($r['situacao']) {
    'concluida' => "[OK] releitura concluída\n",
    'concluida_com_erros' => "[ERRO] a releitura passou por todas as páginas, mas com {$r['erros']} erro(s) — NÃO está concluída; reprocesse só os afetados (--pedidos)\n",
    'interrompida' => "[OK] parada a pedido na página {$r['pagina_inicial']}+{$r['paginas']} — rodar de novo retoma\n",
    // Codex DSHOW-113 (P2): parou a pedido, mas a parte já lida teve erro → falha (o checkpoint continua 'parcial': rodar de novo retoma)
    'interrompida_com_erros' => "[ERRO] parada a pedido na página {$r['pagina_inicial']}+{$r['paginas']} com {$r['erros']} erro(s) — rodar de novo retoma; reprocesse os afetados (--pedidos)\n",
    default => "[ERRO] releitura não concluiu ({$r['situacao']}) — o progresso ficou gravado; rodar de novo retoma\n",
};
exit($r['situacao'] === 'concluida' || $r['situacao'] === 'interrompida' ? 0 : 1);
