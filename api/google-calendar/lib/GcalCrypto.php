<?php
// Google Calendar / GcalCrypto - cifragem de tokens OAuth (AES-256-GCM)
// @version 1.0.0
// @created 2026-07-29
// @app Google Calendar
//
// Espelha api/outlook/lib/OutlookCrypto.php, mas com chave PROPRIA
// (GCAL_CRYPTO_KEY) para isolar o segredo do modulo.
//
// Cifra em repouso: access_token, refresh_token, code_verifier (PKCE),
// syncToken e o token de canal push (§50). O texto puro NUNCA e persistido,
// logado nem devolvido ao front. O syncToken entra aqui porque, alem de
// sensivel, ele e a chave que autoriza ler o delta de uma agenda inteira.
//
// Contrato:
//   encrypt(string $plain): string   -> envelope "v1.<iv>.<tag>.<ct>" (base64)
//   decrypt(string $envelope): string
//   isConfigured(): bool
//   looksEncrypted(string): bool
//   mask(?string): ?string
//   last4(?string): ?string
//   scrub(array): array
declare(strict_types=1);

final class GcalCryptoException extends RuntimeException {}

final class GcalCrypto
{
    private const CIPHER      = 'aes-256-gcm';
    private const VERSION     = 'v1';
    private const IV_LEN      = 12;
    private const TAG_LEN     = 16;
    private const KEY_LEN     = 32;
    private const ENVELOPE_RE = '/^v1\.[A-Za-z0-9+\/=]+\.[A-Za-z0-9+\/=]+\.[A-Za-z0-9+\/=]*$/';

    private static ?string $keyCache = null;

    private static function key(): string
    {
        if (self::$keyCache !== null) {
            return self::$keyCache;
        }
        $raw = getenv('GCAL_CRYPTO_KEY');
        if ($raw === false || $raw === '') {
            $raw = $_ENV['GCAL_CRYPTO_KEY'] ?? '';
        }
        $raw = trim((string)$raw);
        if ($raw === '') {
            throw new GcalCryptoException('GCAL_CRYPTO_KEY ausente no .env');
        }
        $key = base64_decode($raw, true);
        if ($key === false) {
            throw new GcalCryptoException('GCAL_CRYPTO_KEY nao e base64 valido');
        }
        if (strlen($key) !== self::KEY_LEN) {
            throw new GcalCryptoException('GCAL_CRYPTO_KEY deve ter ' . self::KEY_LEN . ' bytes apos base64 (tem ' . strlen($key) . ')');
        }
        return self::$keyCache = $key;
    }

    public static function isConfigured(): bool
    {
        try { self::key(); return true; }
        catch (GcalCryptoException $e) { return false; }
    }

    public static function encrypt(string $plain): string
    {
        if ($plain === '') {
            return '';
        }
        $iv  = random_bytes(self::IV_LEN);
        $tag = '';
        $ct  = openssl_encrypt($plain, self::CIPHER, self::key(), OPENSSL_RAW_DATA, $iv, $tag, '', self::TAG_LEN);
        if ($ct === false) {
            throw new GcalCryptoException('Falha ao cifrar');
        }
        return self::VERSION . '.' . base64_encode($iv) . '.' . base64_encode($tag) . '.' . base64_encode($ct);
    }

    public static function decrypt(string $envelope): string
    {
        if ($envelope === '') {
            return '';
        }
        if (!self::looksEncrypted($envelope)) {
            throw new GcalCryptoException('Envelope em formato desconhecido');
        }
        $parts = explode('.', $envelope, 4);
        if (count($parts) !== 4) {
            throw new GcalCryptoException('Envelope malformado');
        }
        [$ver, $ivB64, $tagB64, $ctB64] = $parts;
        if ($ver !== self::VERSION) {
            throw new GcalCryptoException("Versao de envelope nao suportada: {$ver}");
        }
        $iv  = base64_decode($ivB64, true);
        $tag = base64_decode($tagB64, true);
        $ct  = base64_decode($ctB64, true);
        if ($iv === false || $tag === false || $ct === false) {
            throw new GcalCryptoException('Envelope com base64 invalido');
        }
        if (strlen($iv) !== self::IV_LEN || strlen($tag) !== self::TAG_LEN) {
            throw new GcalCryptoException('Envelope com IV/tag invalido');
        }
        $plain = openssl_decrypt($ct, self::CIPHER, self::key(), OPENSSL_RAW_DATA, $iv, $tag);
        if ($plain === false) {
            throw new GcalCryptoException('Falha ao decifrar (chave incorreta ou dado adulterado)');
        }
        return $plain;
    }

    public static function looksEncrypted(string $value): bool
    {
        return $value !== '' && preg_match(self::ENVELOPE_RE, $value) === 1;
    }

    public static function mask(?string $stored): ?string
    {
        if ($stored === null || $stored === '') {
            return null;
        }
        return '********';
    }

    public static function last4(?string $token): ?string
    {
        if ($token === null || strlen($token) < 4) {
            return null;
        }
        return substr($token, -4);
    }

    public static function scrub(array $row): array
    {
        foreach (['password', 'senha', 'token', 'access_token', 'refresh_token',
                  'token_encrypted', 'refresh_token_encrypted', 'code_verifier',
                  'code_verifier_cipher', 'client_secret', 'secret', 'authorization',
                  'id_token'] as $k) {
            if (array_key_exists($k, $row)) {
                $row[$k] = self::mask(is_string($row[$k]) ? $row[$k] : null);
            }
        }
        return $row;
    }
}
