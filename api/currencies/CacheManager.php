<?php
/**
 * Cache Manager for Currencies
 * @version 1.1.0 - Added getStale for fallback
 */

class CacheManager {
    private $cachePath;
    private $ttl;
    private $enabled;
    
    public function __construct($cachePath, $ttl = 300, $enabled = true) {
        $this->cachePath = $cachePath;
        $this->ttl = $ttl;
        $this->enabled = $enabled;
    }
    
    public function get() {
        if (!$this->enabled) {
            return null;
        }
        
        if (!file_exists($this->cachePath)) {
            return null;
        }
        
        $cacheData = json_decode(file_get_contents($this->cachePath), true);
        
        if (!$cacheData || !isset($cacheData['timestamp'])) {
            return null;
        }
        
        $age = time() - $cacheData['timestamp'];
        
        if ($age > $this->ttl) {
            return null;
        }
        
        return $cacheData['data'];
    }
    
    // v1.1.0: Retorna cache mesmo expirado (para fallback quando API falha)
    public function getStale() {
        if (!file_exists($this->cachePath)) {
            return null;
        }
        
        $cacheData = json_decode(file_get_contents($this->cachePath), true);
        
        if (!$cacheData || !isset($cacheData['data'])) {
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
        
        return file_put_contents($this->cachePath, json_encode($cacheData, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
    }
    
    public function clear() {
        if (file_exists($this->cachePath)) {
            return unlink($this->cachePath);
        }
        return true;
    }
    
    public function getAge() {
        if (!file_exists($this->cachePath)) {
            return null;
        }
        
        $cacheData = json_decode(file_get_contents($this->cachePath), true);
        
        if (!$cacheData || !isset($cacheData['timestamp'])) {
            return null;
        }
        
        return time() - $cacheData['timestamp'];
    }
}
