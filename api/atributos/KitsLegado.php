<?php
// /api/atributos/KitsLegado.php — os 7 KITS de atribuição do legado do Jhony (Led_Lovers_PROD.mm_atributos_x_itens, lote 1 de 16/11/2026).
// Gerado da E0 (atributos-web/e0-proveniencia/ANEXO-E0-B-kits-legado.json): cada item legado recebeu exatamente UM destes conjuntos
// (ids de mm_atributos = eq_atributo.legado_id). Dado CONGELADO do legado: não editar à mão; o kit como conceito editável vem na E2.
declare(strict_types=1);

final class KitsLegado
{
    /** codigo => [nome, ids do legado (ordenados)] */
    public const KITS = [
        'base' => ['nome' => 'Base (8)', 'ids' => [1, 2, 3, 4, 5, 6, 18, 19]],
        'gabinete' => ['nome' => 'Gabinete', 'ids' => [1, 2, 3, 4, 5, 6, 9, 10, 11, 15, 18, 19, 23, 24, 40, 77, 78, 80, 87, 88, 89, 94, 96, 101, 111, 113, 118, 119, 121, 122, 124, 125, 129, 133, 137, 138, 139, 142, 143, 152, 158, 161, 348, 397, 399, 401, 402, 409, 462, 494, 499, 532, 537, 545, 548, 549]],
        'modulo' => ['nome' => 'Módulo', 'ids' => [1, 2, 3, 4, 5, 6, 9, 10, 11, 15, 18, 19, 23, 24, 40, 77, 78, 87, 88, 94, 96, 101, 111, 118, 119, 121, 122, 124, 125, 129, 133, 135, 137, 138, 139, 142, 143, 147, 152, 153, 158, 160, 161, 348, 397, 399, 401, 402, 409, 462, 494, 499, 532, 537, 545, 548, 549]],
        'parafusos' => ['nome' => 'Parafusos', 'ids' => [1, 2, 3, 4, 5, 6, 18, 19, 36, 162, 163, 164, 165, 166, 167, 168, 169, 170, 171, 172, 173, 174, 175, 176, 177, 178, 179, 180, 181, 182, 183, 184, 185, 186, 187, 188, 190, 191, 192, 193, 194, 195, 196, 197, 198, 199, 200, 201, 202, 203, 204, 205, 206]],
        'controladoras' => ['nome' => 'Controladoras', 'ids' => [1, 2, 3, 4, 5, 6, 18, 19, 207, 214, 228, 229, 231, 235, 242, 243, 245, 246, 320, 332, 333, 336, 337, 340, 351, 394, 400, 405, 408, 434, 447, 448, 570, 575, 576]],
        'cabos' => ['nome' => 'Cabos', 'ids' => [1, 2, 3, 4, 5, 6, 18, 19, 30, 31, 35, 39, 42, 48, 49, 60, 66, 70, 71, 500, 569]],
        'fontes' => ['nome' => 'Fontes', 'ids' => [1, 2, 3, 4, 5, 6, 9, 10, 11, 15, 16, 18, 19, 21, 22, 23, 137, 161, 178, 179, 399, 409, 454, 455, 486, 487, 535, 536, 537, 538, 539, 545, 546, 549, 555, 558, 559, 560, 561, 562, 563, 564, 566, 567, 568, 571]],
    ];
    /** Os 8 da base (presentes em todos os kits). */
    public const BASE = [1, 2, 3, 4, 5, 6, 18, 19];

    /** Kit do conjunto exato de ids legados atribuídos a um item; null = conjunto fora dos 7 (não ocorre no lote 1). */
    public static function doConjunto(array $idsLegado): ?string
    {
        $s = array_values(array_unique(array_map('intval', $idsLegado))); sort($s);
        foreach (self::KITS as $cod => $k) if ($k['ids'] === $s) return $cod;
        return null;
    }

    /** Rótulo da origem de UM atributo dentro do kit: 'Base (8)' se estiver na base; senão o nome do kit. */
    public static function origemDoAtributo(?string $kit, int $idLegado): ?string
    {
        if ($kit === null) return null;
        return in_array($idLegado, self::BASE, true) ? self::KITS['base']['nome'] : self::KITS[$kit]['nome'];
    }
}
