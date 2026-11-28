<?php
declare(strict_types=1);
/**
 * TextoPerfil (AZUL/ESQUERDA, 27/11 · P0 XSS-UARPS, defesa no SERVIDOR): campos de texto do PRÓPRIO perfil (nome, nome_resumido,
 * nome_completo, funcao, departamento) são exibidos em telas de outras pessoas (editor de permissões do Dono, header, listas).
 * O escape na tela é a correção principal; aqui o servidor RECUSA os caracteres que fecham atributo ou abrem marcação:
 * aspas duplas ("), sinais < >, crase (`) e caracteres de controle (inclusive quebra de linha e tab). Apóstrofo (D'Ávila) continua aceito.
 */
final class TextoPerfil
{
    public const PROIBIDO = '/["<>`]|[\x00-\x1F\x7F]/u';

    /** true quando o texto tem caractere proibido (ou UTF-8 inválido, que o preg_match com /u recusa → false → tratado como inseguro). */
    public static function inseguro(string $v): bool
    {
        $r = preg_match(self::PROIBIDO, $v);
        return $r !== 0;   // 1 = achou; false = UTF-8 inválido → inseguro também
    }
}
