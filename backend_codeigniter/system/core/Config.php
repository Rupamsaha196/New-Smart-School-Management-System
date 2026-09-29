<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class CI_Config {
    public array $config = [];

    public function __construct() {
        if (file_exists(APPPATH . 'config/config.php')) {
            require(APPPATH . 'config/config.php');
            if (isset($config) && is_array($config)) {
                $this->config = $config;
            }
        }
    }

    public function load(string $file = '', bool $use_sections = FALSE, bool $fail_gracefully = FALSE): bool {
        $file = ($file === '') ? 'config' : str_replace('.php', '', $file);
        $file_path = APPPATH . 'config/' . $file . '.php';
        if (file_exists($file_path)) {
            require($file_path);
            if (isset($config) && is_array($config)) {
                if ($use_sections) {
                    $this->config[$file] = array_merge($this->config[$file] ?? [], $config);
                } else {
                    $this->config = array_merge($this->config, $config);
                }
                return TRUE;
            }
        }
        if (!$fail_gracefully) {
            return FALSE;
        }
        return FALSE;
    }

    public function item(string $item, string $index = '') {
        if ($index == '') {
            return $this->config[$item] ?? NULL;
        }
        return $this->config[$index][$item] ?? NULL;
    }

    public function set_item(string $item, $value): void {
        $this->config[$item] = $value;
    }

    public function base_url(string $uri = ''): string {
        $base = $this->item('base_url') ?: 'http://localhost:8000/';
        return rtrim($base, '/') . '/' . ltrim($uri, '/');
    }

    public function site_url(string $uri = ''): string {
        return $this->base_url($uri);
    }
}
