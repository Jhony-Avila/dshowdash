<?php
/**
 * Cache Manager for Weather
 * @version 1.0.0
 */

class CacheManager {
    private $cachePath;
    private $ttl;
    private $enabled;
    
    public function __construct($cachePath, $ttl = 1800, $enabled = true) {
        $this->cachePath = $cachePath;
        $this->ttl = $ttl;
        $this->enabled = $enabled;
    }
    
    public function get() {
        if (!$this->enabled || !file_exists($this->cachePath)) {
            return null;
        }
        
        $cacheData = json_decode(file_get_contents($this->cachePath), true);
        
        if (!$cacheData || !isset($cacheData['timestamp'])) {
            return null;
        }
        
        if ((time() - $cacheData['timestamp']) > $this->ttl) {
            return null;
        }
        
        return $cacheData['data'];
    }
    
    public function set($data) {
        if (!$this->enabled) {
            return false;
        }
        
        $cacheDir = dirname($this->cachePath);
        if (!is_dir($cacheDir)) {
            mkdir($cacheDir, 0775, true);
        }
        
        $cacheData = [
            'timestamp' => time(),
            'data' => $data
        ];
        
        return file_put_contents($this->cachePath, json_encode($cacheData, JSON_UNESCAPED_UNICODE));
    }
    
    public function getAge() {
        if (!file_exists($this->cachePath)) {
            return null;
        }
        
        $cacheData = json_decode(file_get_contents($this->cachePath), true);
        return $cacheData ? (time() - $cacheData['timestamp']) : null;
    }
}
