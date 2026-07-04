<?php
// /api/koala/render/Renderer.php
// RENDERER ÚNICO (motor). Percorre pages->sections->components do structure_json,
// resolve bindings + placeholders {{...}}, aplica estilos, gera HTML A4 self-contained.
// Consumido por: preview (iframe), link público, PDF (mesma saída = zero divergência).
// @module koala.render.engine
// @version 1.0.0-F1
declare(strict_types=1);

class Renderer
{
    /**
     * @param array  $structure  structure_json decodificado (pages/sections/components)
     * @param array  $data       mapa de dados: proposal.*, client.*, seller.*, items[] + 'placeholders'
     * @param string $mode       'draft' => marca d'água "RASCUNHO"; 'final' => sem marca
     */
    public static function render(array $structure, array $data, string $mode = 'final'): string
    {
        $css = @file_get_contents(__DIR__ . '/base.css');
        if ($css === false) { $css = ''; }
        $placeholders = $data['placeholders'] ?? [];

        $pagesHtml = '';
        foreach (($structure['pages'] ?? []) as $page) {
            $sectionsHtml = '';
            foreach (($page['sections'] ?? []) as $section) {
                $comps = '';
                foreach (($section['components'] ?? []) as $comp) {
                    $comps .= self::renderComponent($comp, $data, $placeholders);
                }
                $sectionsHtml .= '<div class="koala-section" data-section="'
                    . htmlspecialchars((string) ($section['section_key'] ?? ''), ENT_QUOTES) . '">' . $comps . '</div>';
            }
            $watermark = $mode === 'draft' ? '<div class="koala-watermark">RASCUNHO</div>' : '';
            $pagesHtml .= '<div class="koala-page">' . $watermark . $sectionsHtml . '</div>';
        }

        return '<!doctype html><html lang="pt-br"><head><meta charset="utf-8">'
            . '<meta name="viewport" content="width=device-width, initial-scale=1">'
            . '<title>Koala Docs — Preview</title><style>' . $css . '</style></head><body>'
            . $pagesHtml . '</body></html>';
    }

    /**
     * FRAGMENTO de biblioteca (uma seção do catálogo). Reusa o MESMO motor de componentes
     * do render de página inteira, mas emite um bloco de largura A4 e ALTURA AUTO, fundo branco,
     * SEM marca d'água (é um bloco de biblioteca, não uma proposta).
     *
     * @param array $section  nível-seção: {section_key, components:[...]}
     * @param array $data     mapa de dados/exemplo (mesmo shape do render): proposal.*, ... + 'placeholders'
     */
    public static function renderFragment(array $section, array $data): string
    {
        $css = @file_get_contents(__DIR__ . '/base.css');
        if ($css === false) { $css = ''; }
        $placeholders = $data['placeholders'] ?? [];

        $comps = '';
        foreach (($section['components'] ?? []) as $comp) {
            $comps .= self::renderComponent($comp, $data, $placeholders);
        }
        $block = '<div class="koala-section" data-section="'
            . htmlspecialchars((string) ($section['section_key'] ?? ''), ENT_QUOTES) . '">' . $comps . '</div>';

        return '<!doctype html><html lang="pt-br"><head><meta charset="utf-8">'
            . '<meta name="viewport" content="width=device-width, initial-scale=1">'
            . '<title>Koala Docs — Seção</title><style>' . $css . '</style></head>'
            . '<body class="koala-fragment-body"><div class="koala-fragment">' . $block . '</div></body></html>';
    }

    private static function renderComponent(array $c, array $data, array $placeholders): string
    {
        $type = (string) ($c['component_type'] ?? 'text');

        if ($type === 'price_table') {
            return self::renderPriceTable($c, $data);
        }

        // Texto: binding primeiro (path -> valor); fallback content_json.text; depois placeholders {{...}}.
        $text = null;
        $bindPath = $c['bindings_json']['text'] ?? null;
        if ($bindPath !== null) {
            $text = self::getByPath($data, (string) $bindPath);
        }
        if ($text === null || $text === '') {
            $text = (string) ($c['content_json']['text'] ?? '');
        }
        $text = self::applyPlaceholders((string) $text, $placeholders);
        $safe = htmlspecialchars($text, ENT_QUOTES);

        switch ($type) {
            case 'title':
                return '<h1 class="koala-title">' . $safe . '</h1>';
            case 'text':
                return '<p class="koala-text">' . $safe . '</p>';
            default:
                return '<div class="koala-text" data-type="' . htmlspecialchars($type, ENT_QUOTES) . '">' . $safe . '</div>';
        }
    }

    private static function renderPriceTable(array $c, array $data): string
    {
        $rows  = self::getByPath($data, (string) ($c['bindings_json']['rows'] ?? 'proposal.items'));
        $total = self::getByPath($data, (string) ($c['bindings_json']['total'] ?? 'proposal.total_final'));
        if (!is_array($rows)) { $rows = []; }

        $html = '<table class="koala-table"><thead><tr>'
            . '<th>Descricao</th><th class="num">Qtd</th><th class="num">Valor Unit.</th><th class="num">Subtotal</th>'
            . '</tr></thead><tbody>';
        foreach ($rows as $r) {
            $html .= '<tr>'
                . '<td>' . htmlspecialchars((string) ($r['description'] ?? ''), ENT_QUOTES) . '</td>'
                . '<td class="num">' . htmlspecialchars((string) ($r['quantity'] ?? ''), ENT_QUOTES) . '</td>'
                . '<td class="num">' . htmlspecialchars((string) ($r['unit_price'] ?? ''), ENT_QUOTES) . '</td>'
                . '<td class="num">' . htmlspecialchars((string) ($r['subtotal'] ?? ''), ENT_QUOTES) . '</td>'
                . '</tr>';
        }
        $html .= '</tbody></table>';
        if ($total !== null) {
            $html .= '<div class="koala-total">Total: ' . htmlspecialchars((string) $total, ENT_QUOTES) . '</div>';
        }
        return $html;
    }

    /** Substitui {{Chave}} pelos valores do mapa de placeholders. */
    private static function applyPlaceholders(string $text, array $placeholders): string
    {
        if ($text === '' || strpos($text, '{{') === false) { return $text; }
        foreach ($placeholders as $key => $val) {
            $text = str_replace('{{' . $key . '}}', (string) $val, $text);
        }
        return $text;
    }

    /** Resolve caminho pontilhado 'proposal.title' no mapa de dados. */
    private static function getByPath(array $data, string $path)
    {
        $node = $data;
        foreach (explode('.', $path) as $seg) {
            if (is_array($node) && array_key_exists($seg, $node)) {
                $node = $node[$seg];
            } else {
                return null;
            }
        }
        return $node;
    }
}
