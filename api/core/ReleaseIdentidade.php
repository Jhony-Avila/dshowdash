<?php
// Identidade do build servido (AZUL, 27/11; decisão do Jhony: nada de configuração manual no php-fpm).
// Fonte: o arquivo RELEASE_SHA que o publicar-sha.sh grava na raiz de cada release (scripts/deploy/p1-04/publicar-sha.sh:83), conferido
// com o nome do diretório da release (<sha12>-<carimbo>, :73) quando ele segue esse formato. Sem arquivo, formato inválido ou divergência
// com o nome = null ("desconhecido") — quem chama trata como INFORMATIVO, nunca como falha geral.
declare(strict_types=1);

final class ReleaseIdentidade
{
    public static function sha(string $raizRelease): ?string
    {
        $raiz = realpath($raizRelease);
        if ($raiz === false) { return null; }
        $arq = $raiz . '/RELEASE_SHA';
        $txt = is_file($arq) ? @file_get_contents($arq, false, null, 0, 128) : false;
        if (!is_string($txt)) { return null; }
        $sha = strtolower(trim($txt));
        if (!preg_match('/^[0-9a-f]{40}$/D', $sha)) { return null; }
        $nome = basename($raiz);
        if (preg_match('/^([0-9a-f]{12})-/', $nome, $m) && $m[1] !== substr($sha, 0, 12)) { return null; }   // arquivo ≠ release servida
        return $sha;
    }
}
