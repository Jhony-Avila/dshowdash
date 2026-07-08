<?php
// /api/koala/services/PdfGenerationService.php
// Gera o PDF da proposta pelo RENDERIZADOR ÚNICO via Chromium headless.
// F5: o PDF sai de uma VERSÃO CONGELADA (freeze antes de renderizar) — nunca do rascunho vivo.
//     Regerar sem mudança reusa a última versão E o arquivo (dirty-detection no VersioningService).
// PHP é dono de auth/permissão/DB/render; o node (tools/koala-pdf/generate.mjs) é conversor PURO.
// @module koala.service.pdf @version 1.1.0-F5
declare(strict_types=1);

require_once __DIR__ . '/ProposalRenderService.php';

class PdfGenerationService
{
    private \PDO $pdo;

    private const BROWSERS_PATH = '/opt/ms-playwright';
    private const NODE_BIN      = '/usr/bin/node';
    private const GENERATOR     = '/var/www/dshowdash/tools/koala-pdf/generate.mjs';
    private const STORAGE_ROOT  = '/var/www/dshowdash/storage';
    private const PDF_DIR       = '/var/www/dshowdash/storage/koala/pdf';
    private const TMP_DIR       = '/var/www/dshowdash/storage/koala/tmp';
    private const TIMEOUT_S     = 45;

    public function __construct(\PDO $pdo) { $this->pdo = $pdo; }

    /**
     * Gera o PDF da proposta a partir de uma versão congelada (freeze com trigger 'pdf').
     * @return array{pdf_path:string,file:string,bytes:int,mode:string,version:int,version_id:int,reused:bool}
     */
    public function generate(array $koala, int $proposalId): array
    {
        $p = (new ProposalService($this->pdo))->get($koala, $proposalId);       // 404/403
        $mode = ((string) ($p['status'] ?? 'draft') === 'draft') ? 'draft' : 'final';

        // 1) FREEZE de marco (fecha a pendência oficial F5): o PDF sai da versão congelada.
        $ver = new VersioningService($this->pdo);
        $fr  = $ver->freeze($koala, $proposalId, 'pdf', $mode);
        $vid = (int) $fr['version_id'];
        $vn  = (int) $fr['version_number'];

        if (!is_dir(self::TMP_DIR) || !is_dir(self::PDF_DIR)) {
            ApiResponse::error('PDF_STORAGE_UNAVAILABLE', 500);
        }

        $safeNum = preg_replace('/[^A-Za-z0-9_-]/', '', (string) ($p['proposal_number'] ?? (string) $proposalId));
        $pdfName = 'proposta-' . ($safeNum !== '' ? $safeNum : (string) $proposalId) . "-v{$vn}.pdf";
        $pdfAbs  = self::PDF_DIR . '/' . $pdfName;
        $pdfRel  = 'koala/pdf/' . $pdfName;

        // 2) Regerar SEM mudança: reusa versão E arquivo (não reprocessa Chromium).
        if ($fr['reused'] && is_file($pdfAbs)) {
            $this->persist($proposalId, $vid, $pdfRel);
            return ['pdf_path' => $pdfRel, 'file' => $pdfName, 'bytes' => (int) filesize($pdfAbs),
                    'mode' => $mode, 'version' => $vn, 'version_id' => $vid, 'reused' => true];
        }

        // 3) Renderiza a VERSÃO CONGELADA (não o rascunho vivo) -> HTML tmp.
        $html = $ver->renderVersion($koala, $proposalId, $vid, $mode);
        $token   = bin2hex(random_bytes(8));
        $tmpHtml = self::TMP_DIR . "/proposal-{$proposalId}-v{$vn}-{$token}.html";
        if (file_put_contents($tmpHtml, $html) === false) {
            ApiResponse::error('PDF_TMP_WRITE_FAILED', 500);
        }

        // 4) Conversão via node (conversor puro; env aponta o Chromium compartilhado).
        try {
            $res = $this->runConverter($tmpHtml, $pdfAbs);
        } finally {
            @unlink($tmpHtml);
        }
        if (!$res['ok'] || !is_file($pdfAbs)) {
            ApiResponse::error('PDF_GENERATION_FAILED', 500, ['detail' => $res['err'] ?? 'unknown']);
        }
        $bytes = (int) filesize($pdfAbs);

        // 5) Persiste pdf_path (proposta + versão) e loga (oficial via LogService).
        $this->persist($proposalId, $vid, $pdfRel);
        (new LogService($this->pdo))->log($koala, [
            'proposal_id' => $proposalId, 'proposal_version_id' => $vid,
            'action' => 'proposal_pdf_generated', 'entity_type' => 'proposal', 'entity_id' => $proposalId,
            'metadata' => ['mode' => $mode, 'bytes' => $bytes, 'version' => $vn],
        ]);

        return ['pdf_path' => $pdfRel, 'file' => $pdfName, 'bytes' => $bytes,
                'mode' => $mode, 'version' => $vn, 'version_id' => $vid, 'reused' => (bool) $fr['reused']];
    }

    /** Streama o PDF (autenticado). Gera on-demand se não existir. */
    public function stream(array $koala, int $proposalId): void
    {
        $meta = $this->generate($koala, $proposalId);
        $pdfAbs = self::STORAGE_ROOT . '/' . $meta['pdf_path'];
        if (!is_file($pdfAbs)) { ApiResponse::error('PDF_NOT_FOUND', 404); }

        header('Content-Type: application/pdf');
        header('Content-Disposition: inline; filename="' . basename($pdfAbs) . '"');
        header('Content-Length: ' . filesize($pdfAbs));
        header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
        readfile($pdfAbs);
        exit;
    }

    /**
     * PDF de uma VERSÃO específica congelada (usado pelo link público — versão publicada).
     * Sempre 'final' (sem marca d'água de rascunho). Não exige o mesmo gate (o chamador valida).
     */
    public function generateForVersion(array $koala, int $proposalId, int $versionId): array
    {
        $ver = new VersioningService($this->pdo);
        $snap = $ver->getSnapshot($koala, $proposalId, $versionId); // valida pertencimento
        $vn = (int) ($snap['_meta']['version_number'] ?? 0);
        $num = (string) ($snap['business']['proposal_number'] ?? $proposalId);
        $safeNum = preg_replace('/[^A-Za-z0-9_-]/', '', $num);
        $pdfName = 'proposta-' . ($safeNum !== '' ? $safeNum : (string) $proposalId) . "-v{$vn}.pdf";
        $pdfAbs  = self::PDF_DIR . '/' . $pdfName;
        $pdfRel  = 'koala/pdf/' . $pdfName;

        if (!is_file($pdfAbs)) {
            $html = $ver->renderVersion($koala, $proposalId, $versionId, 'final');
            $this->htmlToPdf($html, $pdfAbs);
            (new ProposalVersionRepository($this->pdo))->setPdfPath($versionId, $pdfRel);
        }
        return ['pdf_path' => $pdfRel, 'file' => $pdfName, 'abs' => $pdfAbs, 'bytes' => (int) filesize($pdfAbs), 'version' => $vn];
    }

    /** Converte um HTML self-contained em PDF (caminho AUTENTICADO). Encerra com ApiResponse::error (JSON) em falha. */
    public function htmlToPdf(string $html, string $pdfAbs): array
    {
        try {
            return $this->htmlToPdfOrThrow($html, $pdfAbs);
        } catch (\RuntimeException $e) {
            // preserva o comportamento de API (JSON + exit) e o detalhe do conversor p/ o editor autenticado.
            ApiResponse::error($e->getMessage(), 500, ['detail' => $e->getPrevious()?->getMessage() ?? 'unknown']);
        }
        return ['bytes' => 0]; // inalcançável (ApiResponse::error faz exit); satisfaz o type-hint.
    }

    /**
     * Igual a htmlToPdf, mas LANÇA RuntimeException em falha — NUNCA emite JSON de API nem faz exit.
     * Usado pela PORTA PÚBLICA (public.php), onde um erro deve virar página HTML limpa (pub_page),
     * sem vazar código de erro/stderr do conversor. O código de falha vai na mensagem; o stderr
     * do conversor (paths/stack) fica só no getPrevious() — nunca chega ao cliente público.
     */
    public function htmlToPdfOrThrow(string $html, string $pdfAbs): array
    {
        if (!is_dir(self::TMP_DIR) || !is_dir(dirname($pdfAbs))) { throw new \RuntimeException('PDF_STORAGE_UNAVAILABLE'); }
        $tmpHtml = self::TMP_DIR . '/htmlpdf-' . bin2hex(random_bytes(8)) . '.html';
        if (file_put_contents($tmpHtml, $html) === false) { throw new \RuntimeException('PDF_TMP_WRITE_FAILED'); }
        // Escreve num PDF temporário no MESMO diretório e renomeia ATOMICAMENTE. Assim dois downloads
        // simultâneos do mesmo PDF ainda-inexistente nunca leem um arquivo meio-escrito (cada um gera o
        // seu tmp; o rename é atômico no mesmo filesystem; "último a renomear vence", ambos válidos).
        $tmpPdf = $pdfAbs . '.tmp-' . bin2hex(random_bytes(8));
        try { $res = $this->runConverter($tmpHtml, $tmpPdf); } finally { @unlink($tmpHtml); }
        if (!$res['ok'] || !is_file($tmpPdf)) {
            @unlink($tmpPdf);
            throw new \RuntimeException('PDF_GENERATION_FAILED', 0, new \RuntimeException((string) ($res['err'] ?? 'unknown')));
        }
        if (!@rename($tmpPdf, $pdfAbs)) {
            @unlink($tmpPdf);
            throw new \RuntimeException('PDF_GENERATION_FAILED', 0, new \RuntimeException('rename atômico falhou'));
        }
        return ['bytes' => (int) filesize($pdfAbs)];
    }

    // ── internos ──────────────────────────────────────────────────────────────

    private function persist(int $proposalId, int $versionId, string $pdfRel): void
    {
        $this->pdo->prepare('UPDATE koala_proposals SET pdf_path = ? WHERE id = ? AND deleted_at IS NULL')
                  ->execute([$pdfRel, $proposalId]);
        (new ProposalVersionRepository($this->pdo))->setPdfPath($versionId, $pdfRel);
    }

    private function runConverter(string $htmlPath, string $pdfPath): array
    {
        $cmd = escapeshellarg(self::NODE_BIN) . ' ' . escapeshellarg(self::GENERATOR)
             . ' --html=' . escapeshellarg($htmlPath)
             . ' --out='  . escapeshellarg($pdfPath);

        $env = [
            'PATH' => '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin',
            'HOME' => '/var/www',
            'PLAYWRIGHT_BROWSERS_PATH' => self::BROWSERS_PATH,
        ];
        $descriptors = [0 => ['pipe', 'r'], 1 => ['pipe', 'w'], 2 => ['pipe', 'w']];
        $proc = proc_open($cmd, $descriptors, $pipes, dirname(self::GENERATOR), $env);
        if (!is_resource($proc)) { return ['ok' => false, 'err' => 'proc_open_failed']; }

        fclose($pipes[0]);
        stream_set_blocking($pipes[1], false);
        stream_set_blocking($pipes[2], false);
        $stdout = ''; $stderr = ''; $start = time();
        while (true) {
            $status  = proc_get_status($proc);
            $stdout .= (string) stream_get_contents($pipes[1]);
            $stderr .= (string) stream_get_contents($pipes[2]);
            if (!$status['running']) { break; }
            if (time() - $start > self::TIMEOUT_S) {
                proc_terminate($proc, 9);
                fclose($pipes[1]); fclose($pipes[2]); proc_close($proc);
                return ['ok' => false, 'err' => 'timeout'];
            }
            usleep(100000);
        }
        $stdout .= (string) stream_get_contents($pipes[1]);
        $stderr .= (string) stream_get_contents($pipes[2]);
        fclose($pipes[1]); fclose($pipes[2]);
        $code = proc_close($proc);

        return ['ok' => $code === 0, 'code' => $code, 'out' => trim($stdout), 'err' => trim($stderr)];
    }
}
