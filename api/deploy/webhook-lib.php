<?php
// api/deploy/webhook-lib.php — regra do webhook do auto-deploy (P1-04a, Fase 1 · Etapa 3).
// Função pura de efeito controlado: recebe cabeçalhos, corpo e a raiz do projeto; devolve [status, corpo].
// Não executa shell; só ENFILEIRA. Aceita SOMENTE: assinatura HMAC válida, evento push, repositório e ref
// esperados, SHA de 40 hex não nulo, entrega inédita (X-GitHub-Delivery — anti-replay).
declare(strict_types=1);

const WEBHOOK_REPO_ESPERADO = 'Jhony-Avila/dshowdash';
const WEBHOOK_REF_ESPERADO = 'refs/heads/main';

/** @param array<string,string> $srv cabeçalhos no formato de $_SERVER */
function dshow_webhook_processar(array $srv, string $corpo, string $raiz): array
{
    $segredoArq = $raiz . '/config/webhook-secret.txt';
    if (!is_file($segredoArq)) { return [503, 'sem-secret']; }
    $segredo = trim((string) file_get_contents($segredoArq));
    if (strlen($segredo) < 16) { return [503, 'sem-secret']; }
    $assinatura = (string) ($srv['HTTP_X_HUB_SIGNATURE_256'] ?? '');
    $esperada = 'sha256=' . hash_hmac('sha256', $corpo, $segredo);
    if ($assinatura === '' || !hash_equals($esperada, $assinatura)) { return [403, 'assinatura']; }
    $evento = (string) ($srv['HTTP_X_GITHUB_EVENT'] ?? '');
    if ($evento === 'ping') { return [200, 'pong']; }
    if ($evento !== 'push') { return [204, '']; }
    $dados = json_decode($corpo, true);
    if (!is_array($dados)) { return [400, 'json']; }
    $repo = (string) ($dados['repository']['full_name'] ?? '');
    if (!hash_equals(WEBHOOK_REPO_ESPERADO, $repo)) { return [403, 'repositorio']; }
    if (($dados['ref'] ?? '') !== WEBHOOK_REF_ESPERADO) { return [204, '']; }
    if (!empty($dados['deleted'])) { return [204, '']; }
    $sha = (string) ($dados['after'] ?? '');
    if (!preg_match('/^[0-9a-f]{40}$/', $sha) || $sha === str_repeat('0', 40)) { return [422, 'sem-sha']; }
    $entrega = (string) ($srv['HTTP_X_GITHUB_DELIVERY'] ?? '');
    if (!preg_match('/^[0-9A-Za-z-]{8,64}$/', $entrega)) { return [400, 'sem-entrega']; }
    if (is_file($raiz . '/config/auto-deploy.off')) { return [202, 'desligado']; }
    $fila = $raiz . '/storage/deploy-fila';
    $vistas = $fila . '/.entregas';
    if (!is_dir($vistas) && !@mkdir($vistas, 0770, true) && !is_dir($vistas)) { return [503, 'fila']; }
    // anti-replay: a mesma entrega (X-GitHub-Delivery) só enfileira uma vez; criação exclusiva = atômica
    $marca = @fopen($vistas . '/' . hash('sha256', $entrega), 'x');
    if ($marca === false) { return [409, 'replay']; }
    fwrite($marca, $sha . "\n"); fclose($marca);
    $ok = @file_put_contents($fila . '/pedido-' . $sha, 'repo=' . $repo . "\nentrega=" . $entrega . "\nrecebido=" . date('c') . "\n", LOCK_EX);
    if ($ok === false) { return [503, 'fila']; }
    return [202, 'na-fila'];
}
