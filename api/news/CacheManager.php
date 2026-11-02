<?php
/**
 * Cache Manager
 * @version 1.0.0
 */

class CacheManager {
    private $config;
    
    public function __construct($config) {
        $this->config = $config;
    }
    
    public function get() {
        if (!$this->config['cache']['enabled']) {
            return null;
        }
        
        $cachePath = $this->config['cache']['path'];
        
        if (!file_exists($cachePath)) {
            return null;
        }
        
        $cacheData = json_decode(file_get_contents($cachePath), true);
        
        if (!$cacheData || !isset($cacheData['timestamp'])) {
            return null;
        }
        
        $age = time() - $cacheData['timestamp'];
        
        if ($age > $this->config['cache']['ttl']) {
            return null;
        }
        
        return $cacheData['data'];
    }
    
    public function set($data) {
        if (!$this->config['cache']['enabled']) {
            return false;
        }
        
        $cachePath = $this->config['cache']['path'];
        $cacheDir = dirname($cachePath);
        
        if (!is_dir($cacheDir)) {
            mkdir($cacheDir, 0775, true);
        }
        
        $cacheData = [
            'timestamp' => time(),
            'data' => $data
        ];
        
        return file_put_contents($cachePath, json_encode($cacheData, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
    }
    
    public function clear() {
        $cachePath = $this->config['cache']['path'];
        if (file_exists($cachePath)) {
            return unlink($cachePath);
        }
        return true;
    }
}
