<?php
// /api/koala/services/SectionImageService.php
// Upload/galeria/serve de imagens por seção. Validação RIGOROSA no backend:
// mime REAL (finfo) + tamanho + re-encode via GD (valida + descarta metadata) + nome gerado por nós.
// Armazena em storage/koala/media/sections/{id}/ e SERVE via PHP (sem alias nginx aberto).
// @module koala.service.section_image @version 1.0.0
declare(strict_types=1);

class SectionImageService
{
    private const MEDIA_ROOT = '/var/www/dshowdash/storage/koala/media';
    private const MAX_BYTES = 10485760; // 10 MB
    private const ALLOWED = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];

    private \PDO $pdo;
    private SectionImageRepository $images;
    private SectionRepository $sections;

    public function __construct(\PDO $pdo)
    {
        $this->pdo = $pdo;
        $this->images = new SectionImageRepository($pdo);
        $this->sections = new SectionRepository($pdo);
    }

    public function list(int $sectionId): array
    {
        if ($this->sections->findById($sectionId) === null) { ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404, ['section_id' => $sectionId]); }
        return $this->images->listBySection($sectionId);
    }

    /**
     * @param array $file  entrada de $_FILES (name,type,tmp_name,error,size)
     * @param array $meta  extras opcionais ($_POST): title
     */
    public function upload(array $koala, int $sectionId, array $file, array $meta = []): array
    {
        if ($this->sections->findById($sectionId) === null) {
            ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404, ['section_id' => $sectionId]);
        }
        // 1. erro de upload
        if (!isset($file['error']) || $file['error'] !== UPLOAD_ERR_OK) {
            $code = $file['error'] ?? 'sem arquivo';
            ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 422, ['field' => 'image', 'message' => "Falha no upload (codigo $code)."]);
        }
        $tmp = (string) $file['tmp_name'];
        // is_uploaded_file é o guard correto no HTTP; em CLI (smoke) cai p/ is_file.
        $legit = (PHP_SAPI === 'cli') ? is_file($tmp) : is_uploaded_file($tmp);
        if (!$legit) {
            ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 422, ['field' => 'image', 'message' => 'Arquivo temporario invalido.']);
        }
        // 2. tamanho
        $size = (int) ($file['size'] ?? filesize($tmp));
        if ($size <= 0) {
            ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 422, ['field' => 'image', 'message' => 'Arquivo vazio.']);
        }
        if ($size > self::MAX_BYTES) {
            ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 422, ['field' => 'image', 'message' => 'Arquivo maior que 10MB.']);
        }
        // 3. MIME REAL (nunca confia no client) — pega .php renomeado de .png
        $finfo = new \finfo(FILEINFO_MIME_TYPE);
        $mime = (string) $finfo->file($tmp);
        if (!isset(self::ALLOWED[$mime])) {
            ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 422, [
                'field' => 'image', 'message' => "Tipo nao permitido ($mime). Aceitos: JPG, PNG, WebP.",
            ]);
        }
        $ext = self::ALLOWED[$mime];
        // 4. decodifica com GD (valida que é imagem real + permite re-encode sem metadata)
        $raw = file_get_contents($tmp);
        $img = $raw !== false ? @imagecreatefromstring($raw) : false;
        if ($img === false) {
            ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 422, ['field' => 'image', 'message' => 'Conteudo nao e uma imagem valida.']);
        }
        $w = imagesx($img);
        $h = imagesy($img);

        // 5. nome/dir gerados por NÓS (jamais o filename do cliente)
        $fileName = 'sec' . $sectionId . '_' . bin2hex(random_bytes(8)) . '.' . $ext;
        $relPath = 'sections/' . $sectionId . '/' . $fileName;
        $dir = self::MEDIA_ROOT . '/sections/' . $sectionId;
        if (!is_dir($dir) && !@mkdir($dir, 0775, true) && !is_dir($dir)) {
            imagedestroy($img);
            ApiResponse::error(ApiResponse::ERR_INTERNAL_ERROR, 500, ['message' => 'Nao foi possivel criar o diretorio de midia.']);
        }
        $dest = self::MEDIA_ROOT . '/' . $relPath;

        // 6. re-encode (strip de metadata/EXIF por construção)
        $ok = false;
        if ($mime === 'image/jpeg') {
            if (function_exists('imageinterlace')) { imageinterlace($img, true); }
            $ok = imagejpeg($img, $dest, 90);
        } elseif ($mime === 'image/png') {
            $ok = imagepng($img, $dest);
        } elseif ($mime === 'image/webp') {
            $ok = imagewebp($img, $dest, 90);
        }
        imagedestroy($img);
        if (!$ok || !is_file($dest)) {
            ApiResponse::error(ApiResponse::ERR_INTERNAL_ERROR, 500, ['message' => 'Falha ao gravar a imagem.']);
        }
        @chmod($dest, 0664);

        // 7. registro
        $id = $this->images->insert([
            'section_id'    => $sectionId,
            'title'         => isset($meta['title']) ? mb_substr((string) $meta['title'], 0, 160) : null,
            'file_name'     => $fileName,
            'original_name' => self::safeOriginalName((string) ($file['name'] ?? '')),
            'file_path'     => $relPath,
            'mime_type'     => $mime,
            'file_size'     => (int) filesize($dest),
            'width'         => $w,
            'height'        => $h,
            'uploaded_by'   => (int) $koala['id'],
        ]);
        return $this->images->findById($id);
    }

    /** Serve o binário da imagem via PHP (sem alias aberto). Faz exit. */
    public function serve(int $imageId): void
    {
        $img = $this->images->findById($imageId);
        if ($img === null || $img['deleted_at'] !== null) {
            ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404, ['image_id' => $imageId]);
        }
        $full = self::MEDIA_ROOT . '/' . $img['file_path'];
        $real = realpath($full);
        // defesa: caminho tem de ficar dentro de MEDIA_ROOT (com separador final: senão um dir irmão
        // ".../media-x" passaria pelo prefixo ".../media").
        if ($real === false || strpos($real, realpath(self::MEDIA_ROOT) . DIRECTORY_SEPARATOR) !== 0 || !is_file($real)) {
            ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404, ['image_id' => $imageId]);
        }
        header('Content-Type: ' . $img['mime_type']);
        header('Content-Length: ' . filesize($real));
        header('Cache-Control: private, max-age=3600');
        header('X-Content-Type-Options: nosniff');
        readfile($real);
        exit;
    }

    /** Soft-delete: marca deleted_at + MOVE o arquivo p/ _trash (regra da casa: não some do disco). */
    public function softDelete(array $koala, int $imageId): array
    {
        $img = $this->images->findById($imageId);
        if ($img === null || $img['deleted_at'] !== null) {
            ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404, ['image_id' => $imageId]);
        }
        $sectionId = (int) $img['section_id'];
        $newRel = 'sections/' . $sectionId . '/_trash/' . $img['file_name'];
        $trashDir = self::MEDIA_ROOT . '/sections/' . $sectionId . '/_trash';
        if (!is_dir($trashDir)) { @mkdir($trashDir, 0775, true); }
        $from = self::MEDIA_ROOT . '/' . $img['file_path'];
        $to = self::MEDIA_ROOT . '/' . $newRel;
        if (is_file($from)) { @rename($from, $to); } // se falhar, arquivo permanece (mesmo assim não some)
        $this->images->softDelete($imageId, $newRel);
        return ['deleted' => $imageId];
    }

    /** Nome original só p/ registro (jamais em path): remove diretório e caracteres perigosos. */
    private static function safeOriginalName(string $name): string
    {
        $base = basename($name);
        $base = preg_replace('/[^A-Za-z0-9._ -]+/', '_', $base);
        return mb_substr((string) $base, 0, 255);
    }
}
