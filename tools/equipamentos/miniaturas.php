<?php
// tools/equipamentos/miniaturas.php — CACHE DE MINIATURAS das fotos dos produtos (decisão A6; missão §13). Tarefa de LEITURA: lê os arquivos
// do armazenamento do backend do app (nada muda no app) e grava JPEGs reencodados (GD → SEM EXIF/GPS) em duas medidas (lado maior 480 e
// 1280), com nome pelo sha256 da origem, e um manifesto mídia → arquivo. Idempotente (arquivo existente com o mesmo sha é mantido).
// Entrada: --lista <tsv>  (media_id, product_id, sha256, storage_key, is_cover, position) — só mídias publicadas, visíveis, não excluídas
//          e não suprimidas (quem gera a lista aplica o filtro);  --origem <raiz do armazenamento>;  --destino <pasta>;  [--limite-mb 500]
// Saída: <destino>/<sha>-480.jpg, <sha>-1280.jpg e <destino>/manifesto.json. Nunca grava storage_key nem caminho de origem no manifesto.
declare(strict_types=1);

final class Miniaturas
{
    public const MEDIDAS = [480, 1280];

    /** Escolhe a melhor variante de origem para a medida (a menor que ainda cubra o lado pedido). */
    public static function origemPara(string $dir, int $lado): ?string
    {
        foreach (($lado <= 768 ? ['w768.jpg', 'w1536.jpg', 'w2048.jpg', 'original.jpg'] : ['w1536.jpg', 'w2048.jpg', 'original.jpg', 'w768.jpg']) as $f) {
            if (is_file("$dir/$f")) return "$dir/$f";
        }
        return null;
    }

    /** Reencoda para JPEG com o lado maior = $lado (nunca amplia). GD não copia metadados: EXIF/GPS saem. */
    public static function gerar(string $origem, string $destino, int $lado): array
    {
        $info = @getimagesize($origem);
        if (!$info) throw new RuntimeException('origem ilegível');
        $img = match ($info[2]) { IMAGETYPE_JPEG => imagecreatefromjpeg($origem), IMAGETYPE_PNG => imagecreatefrompng($origem), IMAGETYPE_WEBP => imagecreatefromwebp($origem), default => false };
        if (!$img) throw new RuntimeException('formato não suportado');
        [$w, $h] = [imagesx($img), imagesy($img)];
        $f = min(1, $lado / max($w, $h)); $nw = max(1, (int) round($w * $f)); $nh = max(1, (int) round($h * $f));
        $out = imagecreatetruecolor($nw, $nh);
        imagefill($out, 0, 0, imagecolorallocate($out, 255, 255, 255));
        imagecopyresampled($out, $img, 0, 0, 0, 0, $nw, $nh, $w, $h);
        $tmp = $destino . '.tmp' . getmypid();
        if (!imagejpeg($out, $tmp, 82)) throw new RuntimeException('falha ao gravar');
        chmod($tmp, 0600); rename($tmp, $destino);
        return [$nw, $nh];
    }
}

if (PHP_SAPI === 'cli' && realpath($argv[0] ?? '') === realpath(__FILE__)) {
    $o = getopt('', ['lista:', 'origem:', 'destino:', 'limite-mb:']);
    $dest = rtrim((string) ($o['destino'] ?? ''), '/'); $raiz = rtrim((string) ($o['origem'] ?? ''), '/');
    $limite = (int) ($o['limite-mb'] ?? 500) * 1024 * 1024;
    if (!is_dir($dest) || !is_dir($raiz) || !is_file((string) ($o['lista'] ?? ''))) { fwrite(STDERR, "uso: --lista <tsv> --origem <dir> --destino <dir>\n"); exit(2); }
    $man = is_file("$dest/manifesto.json") ? (json_decode((string) file_get_contents("$dest/manifesto.json"), true) ?: []) : [];
    $n = ['geradas' => 0, 'mantidas' => 0, 'sem_origem' => 0, 'falhas' => 0];
    foreach (file((string) $o['lista'], FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $l) {
        [$mid, $pid, $sha, $chave, $capa, $pos] = explode("\t", $l) + [null, null, null, null, 0, 0];
        if (!ctype_digit((string) $mid) || !preg_match('/^[0-9a-f]{64}$/', (string) $sha) || !preg_match('#^[0-9A-Za-z/_-]{1,80}$#', (string) $chave) || str_contains((string) $chave, '..')) { $n['falhas']++; continue; }
        $dir = "$raiz/$chave"; $reg = ['product_id' => (int) $pid, 'sha' => $sha, 'capa' => (int) $capa === 1, 'posicao' => (int) $pos];
        foreach (Miniaturas::MEDIDAS as $lado) {
            $arq = "$sha-$lado.jpg";
            if (is_file("$dest/$arq")) { $n['mantidas']++; $reg["p$lado"] = $arq; continue; }
            $src = Miniaturas::origemPara($dir, $lado);
            if ($src === null) { $n['sem_origem']++; continue; }
            $usado = array_sum(array_map('filesize', glob("$dest/*.jpg") ?: []));
            if ($usado > $limite) { fwrite(STDERR, "limite de disco atingido\n"); break 2; }
            try { [$w, $h] = Miniaturas::gerar($src, "$dest/$arq", $lado); $reg["p$lado"] = $arq; $reg["d$lado"] = [$w, $h]; $n['geradas']++; }
            catch (Throwable $e) { $n['falhas']++; }
        }
        $man[(string) $mid] = array_merge($man[(string) $mid] ?? [], $reg);
    }
    $tmp = "$dest/manifesto.json.tmp"; file_put_contents($tmp, json_encode($man, JSON_PRETTY_PRINT)); chmod($tmp, 0600); rename($tmp, "$dest/manifesto.json");
    echo 'MINIATURAS_OK ' . json_encode($n + ['midias' => count($man)]) . "\n";
}
