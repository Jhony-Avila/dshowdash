<?php
declare(strict_types=1);

/**
 * /api/avatar/PonteAuth.php — autenticação da PONTE servidor-a-servidor (backend do APP DSHOW → Dash).
 * Programa "Avatar nativo", Onda 1 (2026-10-27). ADR-012 do app-dshow.
 *
 * Regras (todas fail-closed):
 *   • só loopback (REMOTE_ADDR 127.0.0.1 / ::1) — a ponte nunca é exposta pela borda;
 *   • segredo compartilhado lido de ARQUIVO (0600, fora do git; nunca em código nem em log);
 *   • assinatura HMAC-SHA256 sobre "ts\nnonce\nMETODO\ncaminho\nsha256(corpo)" (cabeçalhos X-App-Ts, X-App-Nonce, X-App-Sig);
 *   • janela de ±60 s e nonce de uso único (guardado em arquivo por 120 s) contra repetição;
 *   • comparação em tempo constante (hash_equals).
 * Nada aqui lê sessão PHP, cookie ou CSRF — a identidade do usuário vem no corpo (user_id) e é responsabilidade do backend do app,
 * que a extrai da PRÓPRIA sessão do app (nunca do iPhone).
 */
final class PonteAuth
{
    public const JANELA_S = 60;
    public const NONCE_TTL_S = 120;
    public const SEGREDO_MIN = 32;

    /** Caminho do segredo: env AVST_PONTE_SEGREDO_ARQUIVO ou config/ponte-app.key (fora do git). */
    public static function caminhoSegredo(): string
    {
        $env = getenv('AVST_PONTE_SEGREDO_ARQUIVO');
        return is_string($env) && $env !== '' ? $env : (dirname(__DIR__, 2) . '/config/ponte-app.key');
    }

    /** Lê o segredo; '' quando ausente/curto/legível por outros (o chamador trata como "ponte indisponível"). */
    public static function segredo(?string $caminho = null): string
    {
        $caminho = $caminho ?? self::caminhoSegredo();
        if (!is_file($caminho) || !is_readable($caminho)) {
            return '';
        }
        clearstatcache(true, $caminho);
        $perm = fileperms($caminho);
        if ($perm !== false && ($perm & 0o077) !== 0) {
            error_log('AVST_PONTE segredo com permissão aberta (esperado 0600): ' . $caminho);
            return '';
        }
        $s = trim((string) file_get_contents($caminho));
        return strlen($s) >= self::SEGREDO_MIN ? $s : '';
    }

    public static function assinar(string $segredo, string $ts, string $nonce, string $metodo, string $caminho, string $corpo): string
    {
        $base = $ts . "\n" . $nonce . "\n" . strtoupper($metodo) . "\n" . $caminho . "\n" . hash('sha256', $corpo);
        return hash_hmac('sha256', $base, $segredo);
    }

    /**
     * Valida o pedido. Devolve ['ok' => bool, 'motivo' => string].
     * @param array<string,mixed> $server superglobal $_SERVER (ou equivalente nos testes)
     */
    public static function validar(array $server, string $corpo, string $segredo, ?string $dirNonces = null, ?int $agora = null): array
    {
        $agora = $agora ?? time();
        if ($segredo === '') {
            return ['ok' => false, 'motivo' => 'segredo_ausente'];
        }
        $ip = (string) ($server['REMOTE_ADDR'] ?? '');
        if (!in_array($ip, ['127.0.0.1', '::1'], true)) {
            return ['ok' => false, 'motivo' => 'origem'];
        }
        $ts = (string) ($server['HTTP_X_APP_TS'] ?? '');
        if (!preg_match('/^\d{9,11}$/', $ts) || abs($agora - (int) $ts) > self::JANELA_S) {
            return ['ok' => false, 'motivo' => 'janela'];
        }
        $nonce = (string) ($server['HTTP_X_APP_NONCE'] ?? '');
        if (!preg_match('/^[A-Za-z0-9_-]{16,64}$/', $nonce)) {
            return ['ok' => false, 'motivo' => 'nonce'];
        }
        $sig = (string) ($server['HTTP_X_APP_SIG'] ?? '');
        if (!preg_match('/^[0-9a-f]{64}$/', $sig)) {
            return ['ok' => false, 'motivo' => 'assinatura'];
        }
        $metodo = (string) ($server['REQUEST_METHOD'] ?? '');
        $caminho = (string) (parse_url((string) ($server['REQUEST_URI'] ?? ''), PHP_URL_PATH) ?: '');
        $esperada = self::assinar($segredo, $ts, $nonce, $metodo, $caminho, $corpo);
        if (!hash_equals($esperada, $sig)) {
            return ['ok' => false, 'motivo' => 'assinatura'];
        }
        if (!self::registrarNonce($nonce, $dirNonces, $agora)) {
            return ['ok' => false, 'motivo' => 'repetido'];
        }
        return ['ok' => true, 'motivo' => ''];
    }

    /** Uso único por NONCE_TTL_S: arquivo por nonce (nome = sha256) num diretório privado; poda oportunista. */
    private static function registrarNonce(string $nonce, ?string $dir, int $agora): bool
    {
        $dir = $dir ?? (sys_get_temp_dir() . '/avst-ponte-nonces');
        if (!is_dir($dir) && !@mkdir($dir, 0700, true) && !is_dir($dir)) {
            return false; // sem lugar para registrar = não aceita (fail-closed)
        }
        $arq = $dir . '/' . hash('sha256', $nonce);
        if (is_file($arq) && (filemtime($arq) ?: 0) > $agora - self::NONCE_TTL_S) {
            return false;
        }
        $fh = @fopen($arq, 'x');
        if ($fh === false) {
            if (is_file($arq) && (filemtime($arq) ?: 0) <= $agora - self::NONCE_TTL_S) {
                @touch($arq, $agora);
                self::podar($dir, $agora);
                return true;
            }
            return false;
        }
        fclose($fh);
        @touch($arq, $agora);
        if (random_int(0, 19) === 0) {
            self::podar($dir, $agora);
        }
        return true;
    }

    private static function podar(string $dir, int $agora): void
    {
        foreach (glob($dir . '/*') ?: [] as $f) {
            if ((filemtime($f) ?: 0) <= $agora - self::NONCE_TTL_S) {
                @unlink($f);
            }
        }
    }
}
