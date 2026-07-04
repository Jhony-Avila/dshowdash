<?php
// /api/koala/services/PricingCalculationService.php
// ÚNICA fonte de verdade dos cálculos (backend). Sem impostos no MVP.
// @module koala.service.pricing @version 1.0.0-F2
declare(strict_types=1);

class PricingCalculationService
{
    /**
     * Calcula um item: base = qty*unit_price; desconto (valor OU percent); acréscimo (valor OU percent).
     * @return array{base:float,discount:float,addition:float,subtotal:float}
     */
    public static function computeItem(array $it): array
    {
        $qty   = (float) ($it['quantity'] ?? 0);
        $price = (float) ($it['unit_price'] ?? 0);
        $base  = round($qty * $price, 2);

        $discount = isset($it['discount_value']) && $it['discount_value'] !== null && $it['discount_value'] !== ''
            ? (float) $it['discount_value']
            : round($base * ((float) ($it['discount_percent'] ?? 0)) / 100, 2);

        $addition = isset($it['addition_value']) && $it['addition_value'] !== null && $it['addition_value'] !== ''
            ? (float) $it['addition_value']
            : round($base * ((float) ($it['addition_percent'] ?? 0)) / 100, 2);

        if ($discount > $base) { $discount = $base; }   // desconto não passa do bruto do item
        $subtotal = round($base - $discount + $addition, 2);

        return ['base' => $base, 'discount' => round($discount, 2), 'addition' => round($addition, 2), 'subtotal' => $subtotal];
    }

    /**
     * Enriquece uma linha (item ou despesa) com os dois valores calculados da spec:
     *  - line_subtotal = BRUTO (qty * unit_price)
     *  - line_total    = LÍQUIDO (bruto − desconto + acréscimo) = coluna `subtotal` persistida
     * O front NUNCA calcula para persistir — só exibe estes campos do backend.
     */
    public static function withLineTotals(array $row): array
    {
        $c = self::computeItem($row);
        $row['line_subtotal'] = $c['base'];
        $row['line_total']    = $c['subtotal'];
        return $row;
    }

    /** Soma bruto/desconto/acréscimo/líquido de uma coleção de linhas (itens OU despesas). */
    private static function sumLines(array $lines): array
    {
        $gross = 0.0; $disc = 0.0; $add = 0.0;
        foreach ($lines as $l) {
            $c = self::computeItem($l);   // mesma mecânica: base = qty*preço; desconto/acréscimo valor|%
            $gross += $c['base']; $disc += $c['discount']; $add += $c['addition'];
        }
        $gross = round($gross, 2); $disc = round($disc, 2); $add = round($add, 2);
        return ['gross' => $gross, 'discount' => $disc, 'addition' => $add, 'net' => round($gross - $disc + $add, 2)];
    }

    /**
     * Totais da proposta. RECONCILIAÇÃO (LOTE 2026-07-03): despesas operacionais
     * generalizam frete/instalação/deslocamento (mantidos como legado somável para
     * não quebrar propostas existentes). Desconto da proposta (valor OU %, mesma
     * semântica dos itens) aplicado sobre o total pré-desconto.
     *
     * total_final = total_net(itens) + total_expenses + (frete+instal+desloc legado) − desconto_proposta
     *
     * @param array $items    linhas de itens
     * @param array $expenses linhas de despesas operacionais (mesmo shape dos itens)
     * @return array{total_gross:float,total_discount:float,total_addition:float,total_net:float,
     *               total_expenses:float,proposal_discount:float,total_final:float}
     */
    public static function computeTotals(
        array $items,
        float $freight = 0,
        float $installation = 0,
        float $displacement = 0,
        array $expenses = [],
        $proposalDiscountValue = null,
        $proposalDiscountPercent = null
    ): array {
        $it  = self::sumLines($items);
        $exp = self::sumLines($expenses);

        $totalExpenses = $exp['net'];
        // Base pré-desconto de proposta: líquido de itens + despesas + campos legados de frete/instal/desloc.
        $preDiscount = round($it['net'] + $totalExpenses + $freight + $installation + $displacement, 2);

        // Desconto da proposta: valor tem precedência sobre percentual; percentual sobre a base pré-desconto.
        $propDisc = ($proposalDiscountValue !== null && $proposalDiscountValue !== '')
            ? (float) $proposalDiscountValue
            : round($preDiscount * ((float) ($proposalDiscountPercent ?? 0)) / 100, 2);
        if ($propDisc < 0) { $propDisc = 0.0; }
        if ($propDisc > $preDiscount) { $propDisc = $preDiscount; }   // não passa do total

        $final = round($preDiscount - $propDisc, 2);

        return [
            'total_gross'      => $it['gross'],      // bruto dos ITENS (granularidade original preservada)
            'total_discount'   => $it['discount'],   // soma dos descontos de ITENS
            'total_addition'   => $it['addition'],
            'total_net'        => $it['net'],
            'total_expenses'   => $totalExpenses,
            'proposal_discount'=> round($propDisc, 2),
            'total_final'      => $final,
        ];
    }
}
