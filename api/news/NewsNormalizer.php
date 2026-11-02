<?php
/**
 * News Normalizer
 * @version 2.0.0-MARKET-RAIL
 * Inclui source e published_at para cada notícia
 */

class NewsNormalizer {
    private $config;
    
    public function __construct($config) {
        $this->config = $config;
    }
    
    public function normalize($items) {
        $normalized = [];
        
        foreach ($items as $item) {
            $title = $this->cleanTitle($item['title']);
            
            if (!$this->isValidTitle($title)) {
                continue;
            }
            
            // Detectar source do item
            $source = $this->detectSource($item);
            
            // Normalizar data de publicação
            $publishedAt = $this->normalizeDate($item);
            
            $normalized[] = [
                'title' => $title,
                'url' => $item['url'] ?? '',
                'source' => $source,
                'published_at' => $publishedAt
            ];
        }
        
        return $this->removeDuplicates($normalized);
    }
    
    /**
     * Detecta a fonte da notícia pela URL
     */
    private function detectSource($item) {
        // Se já tem source definido
        if (!empty($item['source'])) {
            return strtolower($item['source']);
        }
        
        // Detectar pela URL
        $url = $item['url'] ?? '';
        
        if (strpos($url, 'g1.globo.com') !== false) return 'g1';
        if (strpos($url, 'uol.com.br') !== false && strpos($url, 'folha') === false) return 'uol';
        if (strpos($url, 'folha.uol.com.br') !== false) return 'folha';
        if (strpos($url, 'estadao.com.br') !== false) return 'estadao';
        if (strpos($url, 'cnnbrasil.com.br') !== false) return 'cnn';
        if (strpos($url, 'valor.globo.com') !== false) return 'valor';
        if (strpos($url, 'infomoney.com.br') !== false) return 'infomoney';
        
        return 'default';
    }
    
    /**
     * Normaliza a data de publicação para ISO 8601
     */
    private function normalizeDate($item) {
        // pubDate do RSSFetcher vem como timestamp Unix
        if (!empty($item['pubDate'])) {
            $timestamp = $item['pubDate'];
            
            // Se é um número (timestamp Unix)
            if (is_numeric($timestamp)) {
                return date('c', (int)$timestamp);
            }
            
            // Se é string, tentar converter
            try {
                $date = new DateTime($timestamp);
                return $date->format('c');
            } catch (Exception $e) {
                // Fallback
            }
        }
        
        // Tentar outros campos de data
        $dateFields = ['published_at', 'date', 'publishedAt', 'updated'];
        
        foreach ($dateFields as $field) {
            if (!empty($item[$field])) {
                try {
                    if (is_numeric($item[$field])) {
                        return date('c', (int)$item[$field]);
                    }
                    $date = new DateTime($item[$field]);
                    return $date->format('c');
                } catch (Exception $e) {
                    continue;
                }
            }
        }
        
        // Fallback para agora
        return date('c');
    }
    
    private function cleanTitle($title) {
        $title = html_entity_decode($title, ENT_QUOTES | ENT_HTML5, 'UTF-8');
        
        $patterns = [
            '/\s*[-–—|]\s*(G1|UOL|Estadão|Folha|CNN Brasil|Veja mais).*$/i',
            '/\s*\|\s*.*$/i',
            '/\s*–\s*\d{2}\/\d{2}\/\d{4}.*$/i',
            '/\s*<[^>]+>.*$/i',
            '/\s+/'
        ];
        
        $replacements = ['', '', '', '', ' '];
        
        $title = preg_replace($patterns, $replacements, $title);
        $title = trim($title);
        
        $maxLength = $this->config['limits']['max_title_length'];
        if (mb_strlen($title, 'UTF-8') > $maxLength) {
            $title = mb_substr($title, 0, $maxLength - 3, 'UTF-8') . '...';
        }
        
        return $title;
    }
    
    private function isValidTitle($title) {
        $minLength = $this->config['limits']['min_title_length'];
        $maxLength = $this->config['limits']['max_title_length'];
        
        $length = mb_strlen($title, 'UTF-8');
        
        if ($length < $minLength || $length > $maxLength) {
            return false;
        }
        
        if (preg_match('/^[\s\W]*$/', $title)) {
            return false;
        }
        
        return true;
    }
    
    private function removeDuplicates($items) {
        $seen = [];
        $unique = [];
        
        foreach ($items as $item) {
            $key = $this->generateKey($item['title']);
            
            if (!isset($seen[$key])) {
                $seen[$key] = true;
                $unique[] = $item;
            }
        }
        
        return $unique;
    }
    
    private function generateKey($title) {
        $key = mb_strtolower($title, 'UTF-8');
        $key = preg_replace('/[^\w\s]/u', '', $key);
        $key = preg_replace('/\s+/', ' ', $key);
        return trim($key);
    }
}
