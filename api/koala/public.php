<?php
// /api/koala/public.php — Link público da proposta (F4). PORTA SEM LOGIN: hostil por default.
// Roteado pelo nginx: /p/{slug}  e  /p/{slug}/download  (KOALA_SLUG / KOALA_ACTION via fastcgi_param).
// Serve SEMPRE a versão PUBLICADA CONGELADA (nunca o rascunho). @module koala.public @version 1.0.0-F4
declare(strict_types=1);

@ini_set('display_errors', '0'); // nunca vazar stack/paths na porta pública
error_reporting(E_ALL);

require __DIR__ . '/_init.php'; // carrega classes + getConnection (NÃO autentica)

// ── helpers de saída (HTML mínimo, sem vazar dados) ──
function pub_page(int $code, string $title, string $body): void
{
    http_response_code($code);
    header('Content-Type: text/html; charset=utf-8');
    header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
    header('X-Content-Type-Options: nosniff');
    header('Referrer-Policy: no-referrer');
    $t = htmlspecialchars($title, ENT_QUOTES, 'UTF-8');
    echo "<!doctype html><html lang=\"pt-BR\"><head><meta charset=\"utf-8\">"
       . "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"><title>$t</title>"
       . "<style>body{font-family:Inter,Arial,sans-serif;background:#f4f5f7;color:#222;margin:0;"
       . "display:flex;min-height:100vh;align-items:center;justify-content:center}"
       . ".box{background:#fff;padding:40px 48px;border-radius:14px;box-shadow:0 4px 24px rgba(0,0,0,.08);text-align:center;max-width:440px}"
       . "h1{font-size:20px;margin:0 0 8px}p{color:#666;margin:0;font-size:14px}</style></head>"
       . "<body><div class=\"box\"><h1>$t</h1><div>$body</div></div></body></html>";
    exit;
}
function pub_404(): void { pub_page(404, 'Proposta não encontrada', '<p>O link não existe ou não está mais disponível.</p>'); }

$clientIp = $_SERVER['HTTP_CF_CONNECTING_IP']
    ?? (isset($_SERVER['HTTP_X_FORWARDED_FOR']) ? trim(explode(',', $_SERVER['HTTP_X_FORWARDED_FOR'])[0]) : ($_SERVER['REMOTE_ADDR'] ?? ''));
$_SERVER['REMOTE_ADDR'] = $clientIp; // usado por registerView

$slug   = (string) ($_SERVER['KOALA_SLUG'] ?? '');
$action = (string) ($_SERVER['KOALA_ACTION'] ?? '');
if ($slug === '' && preg_match('#^/p/([^/?]+)(?:/(download))?#', (string) ($_SERVER['REQUEST_URI'] ?? ''), $m)) {
    $slug = $m[1]; $action = $m[2] ?? '';
}

try {
    $pdo = getConnection('DSHOWDASH');
    $svc = new PublicationService($pdo);

    // Rate-limit por IP (a única porta sem login).
    if ($svc->rateLimited($clientIp !== '' ? $clientIp : 'unknown')) {
        http_response_code(429);
        header('Retry-After: 60');
        pub_page(429, 'Muitas requisições', '<p>Aguarde um instante e tente novamente.</p>');
    }

    // Slug inexistente / revogado / excluído / formato inválido = 404 IDÊNTICO (não enumerável).
    $p = $svc->resolvePublic($slug);
    if ($p === null) { pub_404(); }

    // Expirada: página limpa, sem vazar conteúdo.
    if ($svc->isExpired($p)) {
        pub_page(410, 'Proposta expirada', '<p>Esta proposta não está mais disponível para visualização.</p>');
    }

    // Download do PDF (mesma versão publicada congelada).
    if ($action === 'download') {
        try {
            $pdfAbs = $svc->publishedPdfPath($p);
        } catch (\Throwable $e) {
            pub_page(500, 'Indisponível', '<p>Não foi possível gerar o PDF agora.</p>');
        }
        $svc->registerView($p, $slug);
        header('Content-Type: application/pdf');
        header('Content-Disposition: attachment; filename="' . basename($pdfAbs) . '"');
        header('Content-Length: ' . filesize($pdfAbs));
        header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
        header('X-Content-Type-Options: nosniff');
        readfile($pdfAbs);
        exit;
    }

    // Página da proposta (versão congelada) + botão "Baixar PDF".
    $svc->registerView($p, $slug);
    $html = $svc->renderPublished($p);
    $btn = '<a href="/p/' . rawurlencode($slug) . '/download" '
         . 'style="position:fixed;top:16px;right:16px;z-index:99999;background:#5b2be0;color:#fff;'
         . 'text-decoration:none;font:600 14px Inter,Arial,sans-serif;padding:10px 16px;border-radius:10px;'
         . 'box-shadow:0 2px 10px rgba(0,0,0,.18)">Baixar PDF</a>';
    $html = (stripos($html, '</body>') !== false)
        ? str_ireplace('</body>', $btn . '</body>', $html)
        : $html . $btn;

    header('Content-Type: text/html; charset=utf-8');
    header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
    header('X-Content-Type-Options: nosniff');
    header('Referrer-Policy: no-referrer');
    echo $html;
    exit;
} catch (\Throwable $e) {
    error_log('[koala public] ' . $e->getMessage());
    pub_page(500, 'Indisponível', '<p>Não foi possível exibir a proposta agora.</p>');
}
