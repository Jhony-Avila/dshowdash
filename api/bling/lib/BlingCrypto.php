<?php
// Bling / lib/BlingCrypto.php - cifra dos tokens em repouso
// @module  bling.crypto
// @version 1.0.0
// @created 2026-07-30
//
// AES-256-GCM. Autenticado: além de esconder, DETECTA adulteração — se alguém
// mexer no ciphertext no banco, a decifra falha em vez de devolver lixo.
//
// O §4 do briefing é explícito: o navegador nunca vê token. Isto cuida do outro
// lado — o token também não fica legível para quem tiver SELECT no banco.
declare(strict_types=1);

// Ponto de entrada único: `public/api` é symlink para esta árvore, então cada
// arquivo daqui é alcançável por HTTP. Sem este guarda, um usuário autenticado
// conseguiria executar internals fora do roteador — que é onde moram o gate de
// permissão, o CSRF e o envelope de resposta.
if (!defined('BLING_ENTRADA')) { http_response_code(404); exit; }

final class BlingCrypto
{
    private const CIFRA = 'aes-256-gcm';
    private const TAG_BYTES = 16;
    /** Versão do formato, no primeiro byte. Permite trocar de cifra sem perder o que já foi gravado. */
    private const VERSAO = "\x01";

    /**
     * Chave de 32 bytes vinda do ambiente.
     * Falha ALTO se ausente ou malformada: cifrar com chave fraca ou previsível
     * é pior do que não cifrar, porque passa a sensação de proteção.
     */
    private static function chave(): string
    {
        $hex = getenv('BLING_CRYPTO_KEY');
        if (!is_string($hex) || $hex === '') {
            $hex = $_ENV['BLING_CRYPTO_KEY'] ?? $_SERVER['BLING_CRYPTO_KEY'] ?? '';
        }
        $hex = trim((string) $hex);

        if ($hex === '') {
            throw new RuntimeException(
                'BLING_CRYPTO_KEY ausente. Gere com: openssl rand -hex 32'
            );
        }
        if (!preg_match('/^[0-9a-f]{64}$/i', $hex)) {
            throw new RuntimeException(
                'BLING_CRYPTO_KEY inválida: são esperados 32 bytes em hexadecimal (64 caracteres).'
            );
        }
        return (string) hex2bin($hex);
    }

    /** Cifra e devolve bytes prontos para VARBINARY. */
    public static function cifrar(string $texto): string
    {
        if ($texto === '') {
            return '';
        }
        $chave = self::chave();
        $iv = random_bytes(12);   // 96 bits: o tamanho recomendado para GCM
        $tag = '';

        $cifrado = openssl_encrypt($texto, self::CIFRA, $chave, OPENSSL_RAW_DATA, $iv, $tag, '', self::TAG_BYTES);
        if ($cifrado === false) {
            throw new RuntimeException('Falha ao cifrar o token.');
        }

        // versão | iv | tag | ciphertext — tudo num blob só, sem coluna extra.
        return self::VERSAO . $iv . $tag . $cifrado;
    }

    /**
     * Decifra. Devolve null quando o blob está adulterado ou foi cifrado com
     * outra chave — quem chama decide o que fazer (normalmente: pedir reconexão).
     * Lançar aqui obrigaria try/catch em todo ponto de leitura.
     */
    public static function decifrar(?string $blob): ?string
    {
        if ($blob === null || $blob === '') {
            return null;
        }
        if (strlen($blob) < 1 + 12 + self::TAG_BYTES) {
            return null;
        }
        if ($blob[0] !== self::VERSAO) {
            error_log('[bling] blob cifrado com versão desconhecida: ' . bin2hex($blob[0]));
            return null;
        }

        $iv  = substr($blob, 1, 12);
        $tag = substr($blob, 13, self::TAG_BYTES);
        $ct  = substr($blob, 13 + self::TAG_BYTES);

        try {
            $texto = openssl_decrypt($ct, self::CIFRA, self::chave(), OPENSSL_RAW_DATA, $iv, $tag);
        } catch (Throwable $e) {
            error_log('[bling] falha ao decifrar: ' . $e->getMessage());
            return null;
        }

        return $texto === false ? null : $texto;
    }

    /** A chave está configurada e utilizável? Usado no checklist de go-live. */
    public static function disponivel(): bool
    {
        try { self::chave(); return true; } catch (Throwable) { return false; }
    }

    /**
     * Prova de ida e volta. Roda no checklist para pegar chave errada ANTES de
     * gravar um token que depois não abre.
     */
    public static function autoteste(): bool
    {
        try {
            $amostra = 'bling-autoteste-' . bin2hex(random_bytes(8));
            return self::decifrar(self::cifrar($amostra)) === $amostra;
        } catch (Throwable) {
            return false;
        }
    }
}
