<?php
// Verificador de go-live do modulo Google Calendar
// @module google-calendar.golive.cli
// @version 1.0.0
// @created 2026-07-30
//
// UM comando responde "posso ligar?":
//
//     php scripts/gcal-golive.php
//
// Le a MESMA checklist que o /status e o 503 do provedor real usam
// (api/google-calendar/lib/GcalGoLive.php). Nao escreve nada, nao chama o
// Google, nao muda o .env — e seguro rodar em producao a qualquer hora.
//
// Codigo de saida: 0 = pronto para ligar, 1 = falta item bloqueante. Assim da
// para encadear num deploy sem ler a saida.
declare(strict_types=1);

$raiz = dirname(__DIR__);
require_once $raiz . '/api/_helpers/ApiResponse.php';
require_once $raiz . '/config/db_connection.php';
require_once $raiz . '/api/google-calendar/lib/GcalCrypto.php';
require_once $raiz . '/api/google-calendar/lib/GoogleOAuth.php';
require_once $raiz . '/api/google-calendar/lib/GcalGoLive.php';

$cor = static fn(string $c, string $s): string =>
    (PHP_SAPI === 'cli' && stream_isatty(STDOUT)) ? "\033[{$c}m{$s}\033[0m" : $s;

$linha = str_repeat('─', 74);
echo "\n", $cor('1', 'GO-LIVE — Google Calendar'), "\n$linha\n\n";

$itens = GcalGoLive::itens();
$falta = [];

foreach ($itens as $i => $it) {
    $marca = $it['ok'] ? $cor('32', '✔') : ($it['bloqueia'] ? $cor('31', '✖') : $cor('33', '○'));
    printf("%s  %d. %s\n", $marca, $i + 1, $it['titulo']);
    printf("       %s\n", $cor('90', $it['detalhe']));
    if (!$it['ok']) {
        // A instrucao so aparece no item que FALTA. Repetir o passo a passo de
        // tudo transformaria a saida em parede de texto e esconderia o que
        // realmente precisa de acao.
        foreach (explode("\n", $it['resolver']) as $l) {
            printf("       %s %s\n", $cor('36', '→'), $l);
        }
        if ($it['bloqueia']) $falta[] = $it['titulo'];
    }
    echo "\n";
}

echo "$linha\n";
printf("Redirect URI a cadastrar no Google Cloud:\n  %s\n\n", $cor('36', GoogleOAuth::redirectUri()));
printf("Escopos da etapa '%s':\n", strtolower((string)(getenv('GCAL_OAUTH_STAGE') ?: 'read')));
foreach (explode(' ', GoogleOAuth::scopes()) as $e) { echo '  ', $cor('90', $e), "\n"; }

echo "\n", $linha, "\n";
echo $cor('1', 'Chaves esperadas no .env'), "\n";
foreach (GcalGoLive::CHAVES_ENV as $k => $desc) {
    $tem = getenv($k) !== false && getenv($k) !== '';
    printf("  %s %-38s %s\n", $tem ? $cor('32', '✔') : $cor('90', '·'), $k, $cor('90', $desc));
}

echo "\n$linha\n";
if ($falta) {
    echo $cor('31', 'AINDA NÃO — ' . count($falta) . ' item(ns) bloqueante(s):'), "\n";
    foreach ($falta as $f) { echo '  • ', $f, "\n"; }
    echo "\nCorrija os itens acima e rode este comando de novo.\n\n";
    exit(1);
}

$modo = strtolower((string)(getenv('GCAL_PROVIDER') ?: 'mock'));
echo $cor('32', 'PRONTO PARA LIGAR.'), "\n";
echo $modo === 'google'
    ? "  GCAL_PROVIDER já está em 'google' — o módulo está servindo dado real.\n\n"
    : "  Último passo:  GCAL_PROVIDER=google  no .env, e recarregar o php-fpm.\n\n";
exit(0);
