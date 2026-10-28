<?php
// DataTables / Crypto - cifragem de credenciais de conexao (AES-256-GCM)
// @version 1.0.0
// @created 2026-07-20
// @app DataTables
//
// Contrato:
//   encrypt(string $plain): string   -> envelope base64 "v1.<iv>.<tag>.<ct>"
//   decrypt(string $envelope): string
//   isConfigured(): bool
//   mask(?string $any): ?string      -> nunca devolve o valor real
//
// A chave vem de DATATABLES_CRYPTO_KEY (.env), base64 de 32 bytes.
// Gerar com: openssl rand -base64 32
declare(strict_types=1);

final class DtCryptoException extends RuntimeException {}

final class DtCrypto
{
    private const CIPHER      = 'aes-256-gcm';
    private const VERSION     = 'v1';
    private const IV_LEN      = 12;   // 96 bits, recomendado para GCM
    private const TAG_LEN     = 16;
    private const KEY_LEN     = 32;   // AES-256
    private const ENVELOPE_RE = '/^v1\.[A-Za-z0-9+\/=]+\.[A-Za-z0-9+\/=]+\.[A-Za-z0-9+\/=]*$/';

    private static ?string $keyCache = null;

    // ═══════════════════════════════════════════════════════════════
    // CHAVE
    // ═══════════════════════════════════════════════════════════════

    /** Resolve a chave binaria de 32 bytes. Lanca se ausente/invalida. */
    private static function key(): string
    {
        if (self::$keyCache !== null) {
            return self::$keyCache;
        }

        $raw = getenv('DATATABLES_CRYPTO_KEY');
        if ($raw === false || $raw === '') {
            $raw = $_ENV['DATATABLES_CRYPTO_KEY'] ?? '';
        }
        $raw = trim((string)$raw);

        if ($raw === '') {
            throw new DtCryptoException('DATATABLES_CRYPTO_KEY ausente no .env');
        }

        $key = base64_decode($raw, true);
        if ($key === false) {
            throw new DtCryptoException('DATATABLES_CRYPTO_KEY nao e base64 valido');
        }
        if (strlen($key) !== self::KEY_LEN) {
            throw new DtCryptoException(
                'DATATABLES_CRYPTO_KEY deve ter ' . self::KEY_LEN . ' bytes apos base64 (tem ' . strlen($key) . ')'
            );
        }

        return self::$keyCache = $key;
    }

    /** Chave presente e utilizavel? Nao lanca - para health checks. */
    public static function isConfigured(): bool
    {
        try {
            self::key();
            return true;
        } catch (DtCryptoException $e) {
            return false;
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // CIFRAGEM
    // ═══════════════════════════════════════════════════════════════

    /**
     * Cifra um segredo. Retorna envelope textual seguro para persistir.
     * String vazia devolve string vazia (ausencia de senha e estado valido).
     */
    public static function encrypt(string $plain): string
    {
        if ($plain === '') {
            return '';
        }

        $iv  = random_bytes(self::IV_LEN);
        $tag = '';

        $ct = openssl_encrypt(
            $plain,
            self::CIPHER,
            self::key(),
            OPENSSL_RAW_DATA,
            $iv,
            $tag,
            '',
            self::TAG_LEN
        );

        if ($ct === false) {
            throw new DtCryptoException('Falha ao cifrar credencial');
        }

        return self::VERSION . '.' . base64_encode($iv) . '.' . base64_encode($tag) . '.' . base64_encode($ct);
    }

    /**
     * Decifra um envelope produzido por encrypt().
     * Falha de autenticacao (tag GCM) lanca - nunca devolve lixo silenciosamente.
     */
    public static function decrypt(string $envelope): string
    {
        if ($envelope === '') {
            return '';
        }

        if (!self::looksEncrypted($envelope)) {
            throw new DtCryptoException('Envelope de credencial em formato desconhecido');
        }

        $parts = explode('.', $envelope, 4);
        if (count($parts) !== 4) {
            throw new DtCryptoException('Envelope de credencial malformado');
        }

        [$ver, $ivB64, $tagB64, $ctB64] = $parts;
        if ($ver !== self::VERSION) {
            throw new DtCryptoException("Versao de envelope nao suportada: {$ver}");
        }

        $iv  = base64_decode($ivB64, true);
        $tag = base64_decode($tagB64, true);
        $ct  = base64_decode($ctB64, true);

        if ($iv === false || $tag === false || $ct === false) {
            throw new DtCryptoException('Envelope de credencial com base64 invalido');
        }
        if (strlen($iv) !== self::IV_LEN || strlen($tag) !== self::TAG_LEN) {
            throw new DtCryptoException('Envelope de credencial com IV/tag de tamanho invalido');
        }

        $plain = openssl_decrypt($ct, self::CIPHER, self::key(), OPENSSL_RAW_DATA, $iv, $tag);

        if ($plain === false) {
            // Chave trocada, dado corrompido ou adulterado.
            throw new DtCryptoException('Falha ao decifrar credencial (chave incorreta ou dado adulterado)');
        }

        return $plain;
    }

    /** Heuristica de formato - distingue envelope nosso de texto plano legado. */
    public static function looksEncrypted(string $value): bool
    {
        return $value !== '' && preg_match(self::ENVELOPE_RE, $value) === 1;
    }

    // ═══════════════════════════════════════════════════════════════
    // EXPOSICAO SEGURA
    // ═══════════════════════════════════════════════════════════════

    /**
     * Representacao para o front-end. NUNCA devolve o valor real.
     * Sinaliza apenas se ha ou nao um segredo armazenado.
     */
    public static function mask(?string $stored): ?string
    {
        if ($stored === null || $stored === '') {
            return null;
        }
        return '********';
    }

    /** Remove qualquer chave sensivel de um array antes de logar/serializar. */
    public static function scrub(array $row): array
    {
        foreach (['password', 'password_encrypted', 'senha', 'token', 'secret', 'api_key'] as $k) {
            if (array_key_exists($k, $row)) {
                $row[$k] = self::mask(is_string($row[$k]) ? $row[$k] : null);
            }
        }
        return $row;
    }
}
