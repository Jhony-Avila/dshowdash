<?php
/**
 * RSS Fetcher
 * @version 1.1.0
 * @updated 2026-01-21
 * FIX: Memory leak em mergeResults (array_merge em loop)
 */

class RSSFetcher {
    private $config;
    
    public function __construct($config) {
        $this->config = $config;
    }
    
    public function fetchAll() {
        $sources = array_filter($this->config['sources'], function($source) {
            return $source['enabled'];
        });
        
        $results = $this->fetchMultiple($sources);
        
        return $this->mergeResults($results);
    }
    
    private function fetchMultiple($sources) {
        $handles = [];
        $results = [];
        
        $mh = curl_multi_init();
        
        foreach ($sources as $key => $source) {
            $ch = curl_init($source['url']);
            curl_setopt_array($ch, [
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_FOLLOWLOCATION => true,
                CURLOPT_MAXREDIRS => 3,
                CURLOPT_TIMEOUT => $source['timeout'],
                CURLOPT_CONNECTTIMEOUT => 2,
                CURLOPT_SSL_VERIFYPEER => false,
                CURLOPT_USERAGENT => 'Mozilla/5.0 (DshowDash/1.0)',
                CURLOPT_ENCODING => 'gzip, deflate'
            ]);
            
            curl_multi_add_handle($mh, $ch);
            $handles[$key] = $ch;
        }
        
        $running = null;
        do {
            curl_multi_exec($mh, $running);
            curl_multi_select($mh);
        } while ($running > 0);
        
        foreach ($handles as $key => $ch) {
            $content = curl_multi_getcontent($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            
            if ($httpCode === 200 && $content) {
                $results[$key] = $this->parseRSS($content);
            } else {
                $results[$key] = [];
            }
            
            curl_multi_remove_handle($mh, $ch);
            curl_close($ch);
        }
        
        curl_multi_close($mh);
        
        return $results;
    }
    
    private function parseRSS($content) {
        $items = [];
        
        libxml_use_internal_errors(true);
        $xml = simplexml_load_string($content);
        libxml_clear_errors();
        
        if (!$xml) {
            return $items;
        }
        
        if (isset($xml->channel->item)) {
            foreach ($xml->channel->item as $item) {
                $title = (string) $item->title;
                $link = (string) $item->link;
                
                if ($title && $link) {
                    $items[] = [
                        'title' => $title,
                        'url' => $link,
                        'pubDate' => isset($item->pubDate) ? strtotime((string) $item->pubDate) : time()
                    ];
                }
            }
        } elseif (isset($xml->entry)) {
            foreach ($xml->entry as $entry) {
                $title = (string) $entry->title;
                $link = '';
                
                if (isset($entry->link)) {
                    if (isset($entry->link['href'])) {
                        $link = (string) $entry->link['href'];
                    } else {
                        $link = (string) $entry->link;
                    }
                }
                
                if ($title && $link) {
                    $items[] = [
                        'title' => $title,
                        'url' => $link,
                        'pubDate' => isset($entry->updated) ? strtotime((string) $entry->updated) : time()
                    ];
                }
            }
        }
        
        return $items;
    }
    
    private function mergeResults($results) {
        $merged = [];

        // FIX: Evita array_merge em loop (O(n²) de memória)
        // Adiciona diretamente ao array final
        foreach ($results as $items) {
            foreach ($items as $item) {
                $merged[] = $item;
            }
        }

        usort($merged, function($a, $b) {
            return $b['pubDate'] - $a['pubDate'];
        });

        return $merged;
    }
}
