<?php
declare(strict_types=1);

/**
 * /api/avatar/SvgSanitizer.php — sanitizador de SVG do Avatar Studio.
 * @version 1.0.0  @created 2026-07-29
 *
 * MODELO DE CONFIANÇA: o SVG chega do NAVEGADOR (gerado pelo motor do
 * panel-avatar-studio), portanto NÃO é confiável. Este sanitizador impõe a
 * gramática exata que o motor produz — whitelist de elementos e atributos,
 * zero scripts, zero event handlers, zero referências externas — e devolve
 * uma SERIALIZAÇÃO NOSSA (nunca o texto original). Qualquer coisa fora da
 * gramática → rejeição integral (fail-closed), não "limpeza parcial".
 */
final class SvgSanitizer
{
    /** Tamanho máximo aceito (o motor gera ~20–80 KB). */
    public const MAX_BYTES = 300_000;

    private const ELEMENTOS = [
        'svg', 'defs', 'clippath', 'lineargradient', 'radialgradient', 'stop',
        'g', 'path', 'rect', 'circle', 'ellipse', 'line', 'pattern',
        'filter', 'fegaussianblur', 'animate', 'animatetransform', 'text',
    ];

    private const ATRIBUTOS = [
        'id', 'x', 'y', 'x1', 'y1', 'x2', 'y2', 'cx', 'cy', 'r', 'rx', 'ry',
        'd', 'width', 'height', 'viewbox', 'fill', 'stroke', 'stroke-width',
        'stroke-linecap', 'stroke-linejoin', 'stroke-dasharray', 'opacity',
        'transform', 'clip-path', 'filter', 'offset', 'stop-color',
        'stop-opacity', 'gradientunits', 'gradienttransform', 'patternunits',
        'stddeviation', 'attributename', 'values', 'dur', 'begin',
        'repeatcount', 'type', 'font-family', 'font-size', 'font-weight',
        'letter-spacing', 'text-anchor', 'role', 'aria-label', 'aria-hidden',
        'xmlns',
    ];

    /** Atributos que podem referenciar ids internos via url(#...). */
    private const ATRIBUTOS_URL = ['fill', 'stroke', 'clip-path', 'filter'];

    /**
     * @return string SVG canônico e seguro
     * @throws InvalidArgumentException se qualquer regra for violada
     */
    public static function sanitizar(string $svg): string
    {
        if (strlen($svg) > self::MAX_BYTES) {
            throw new InvalidArgumentException('SVG_MUITO_GRANDE');
        }
        if (stripos($svg, '<!DOCTYPE') !== false || stripos($svg, '<!ENTITY') !== false) {
            throw new InvalidArgumentException('SVG_DOCTYPE_PROIBIDO');
        }

        $dom = new DOMDocument();
        $dom->preserveWhiteSpace = false;
        // LIBXML_NONET: nunca tocar a rede. NUNCA passar LIBXML_NOENT
        // (expandiria entidades — vetor de XXE).
        $ok = @$dom->loadXML($svg, LIBXML_NONET);
        if (!$ok || !$dom->documentElement) {
            throw new InvalidArgumentException('SVG_INVALIDO');
        }

        $raiz = $dom->documentElement;
        if (strtolower($raiz->localName) !== 'svg') {
            throw new InvalidArgumentException('SVG_RAIZ_INVALIDA');
        }
        $viewBox = $raiz->getAttribute('viewBox');
        if (!preg_match('/^0 0 240 240$/', $viewBox)) {
            throw new InvalidArgumentException('SVG_VIEWBOX_INVALIDO');
        }

        self::validarNo($raiz);

        $limpo = $dom->saveXML($raiz);
        if ($limpo === false || $limpo === '') {
            throw new InvalidArgumentException('SVG_SERIALIZACAO');
        }
        return $limpo;
    }

    private static function validarNo(DOMNode $no): void
    {
        foreach (iterator_to_array($no->childNodes) as $filho) {
            if ($filho instanceof DOMComment
                || $filho instanceof DOMProcessingInstruction
                || $filho instanceof DOMDocumentType) {
                throw new InvalidArgumentException('SVG_NO_PROIBIDO');
            }
        }

        if ($no instanceof DOMElement) {
            $nome = strtolower($no->localName);
            if (!in_array($nome, self::ELEMENTOS, true)) {
                throw new InvalidArgumentException("SVG_ELEMENTO_PROIBIDO:$nome");
            }
            foreach (iterator_to_array($no->attributes) as $attr) {
                /** @var DOMAttr $attr */
                $aNome = strtolower($attr->name);
                $valor = $attr->value;
                if (str_starts_with($aNome, 'on')) {
                    throw new InvalidArgumentException('SVG_EVENT_HANDLER');
                }
                if (!in_array($aNome, self::ATRIBUTOS, true)) {
                    throw new InvalidArgumentException("SVG_ATRIBUTO_PROIBIDO:$aNome");
                }
                self::validarValor($aNome, $valor);
            }
        }

        foreach (iterator_to_array($no->childNodes) as $filho) {
            if ($filho instanceof DOMElement) {
                self::validarNo($filho);
            } elseif ($filho instanceof DOMText) {
                // texto livre só dentro de <text> (rótulo da moldura Dshow)
                $pai = strtolower($filho->parentNode->localName ?? '');
                if ($pai !== 'text' && trim($filho->textContent) !== '') {
                    throw new InvalidArgumentException('SVG_TEXTO_FORA_DE_TEXT');
                }
                if (strlen($filho->textContent) > 40) {
                    throw new InvalidArgumentException('SVG_TEXTO_LONGO');
                }
            }
        }
    }

    private static function validarValor(string $nome, string $valor): void
    {
        if (strlen($valor) > 6000) { // paths longos (d=...) têm folga; resto é curto
            throw new InvalidArgumentException('SVG_VALOR_LONGO');
        }
        $v = strtolower($valor);
        // nenhum vetor de fuga: URLs externas, scripts, entidades, imports
        foreach (['javascript', 'data:', 'http:', 'https:', '//', '&#', '<', 'expression', 'import'] as $proibido) {
            if (str_contains($v, $proibido)) {
                throw new InvalidArgumentException("SVG_VALOR_PROIBIDO:$nome");
            }
        }
        if (str_contains($v, 'url(')) {
            if (!in_array($nome, self::ATRIBUTOS_URL, true)
                || !preg_match('/^url\(#[a-z0-9_-]+\)$/i', trim($valor))) {
                throw new InvalidArgumentException("SVG_URL_INVALIDA:$nome");
            }
        }
    }
}
