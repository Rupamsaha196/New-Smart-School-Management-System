<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class CI_URI {
    public string $uri_string = '';
    public array $segments = [];

    public function __construct() {
        $this->_detect_uri();
    }

    protected function _detect_uri(): void {
        $uri = $_SERVER['REQUEST_URI'] ?? '';
        if (strpos($uri, '?') !== false) {
            $uri = substr($uri, 0, strpos($uri, '?'));
        }
        $uri = str_replace('\\', '/', $uri);
        $script_name = str_replace('\\', '/', $_SERVER['SCRIPT_NAME'] ?? '');

        if ($script_name !== '' && strpos($uri, $script_name) === 0) {
            $uri = substr($uri, strlen($script_name));
        } else {
            $script_dir = rtrim(str_replace('\\', '/', dirname($script_name)), '/');
            if ($script_dir !== '' && $script_dir !== '.' && strpos($uri, $script_dir) === 0) {
                $uri = substr($uri, strlen($script_dir));
            }
        }

        $uri = trim($uri, '/');
        $this->uri_string = $uri;
        $this->segments = $uri !== '' ? explode('/', $uri) : [];
    }

    public function segment(int $n, $no_result = NULL) {
        return $this->segments[$n - 1] ?? $no_result;
    }

    public function rsegment(int $n, $no_result = NULL) {
        return $this->segment($n, $no_result);
    }

    public function total_segments(): int {
        return count($this->segments);
    }

    public function uri_string(): string {
        return $this->uri_string;
    }
}
