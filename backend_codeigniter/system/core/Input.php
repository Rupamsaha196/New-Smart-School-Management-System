<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class CI_Input {
    public array $raw_json = [];
    protected string $raw_stream = '';

    public function __construct() {
        $this->raw_stream = file_get_contents('php://input') ?: '';
        if ($this->raw_stream !== '') {
            $decoded = json_decode($this->raw_stream, true);
            if (is_array($decoded)) {
                $this->raw_json = $decoded;
            }
        }
    }

    public function get($index = NULL, bool $xss_clean = FALSE) {
        if ($index === NULL) return $_GET;
        return $_GET[$index] ?? NULL;
    }

    public function post($index = NULL, bool $xss_clean = FALSE) {
        if ($index === NULL) {
            return !empty($_POST) ? $_POST : $this->raw_json;
        }
        if (isset($_POST[$index])) return $_POST[$index];
        if (isset($this->raw_json[$index])) return $this->raw_json[$index];
        return NULL;
    }

    public function post_get($index, bool $xss_clean = FALSE) {
        return $this->post($index, $xss_clean) ?? $this->get($index, $xss_clean);
    }

    public function raw_input_stream(): string {
        return $this->raw_stream;
    }

    public function json(?string $key = NULL) {
        if ($key === NULL) return $this->raw_json;
        return $this->raw_json[$key] ?? NULL;
    }

    public function ip_address(): string {
        return $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
    }

    public function user_agent(): string {
        return $_SERVER['HTTP_USER_AGENT'] ?? '';
    }

    public function method(bool $upper = FALSE): string {
        $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
        return $upper ? strtoupper($method) : strtolower($method);
    }

    public function get_request_header(string $index): ?string {
        $key = 'HTTP_' . str_replace('-', '_', strtoupper($index));
        if (isset($_SERVER[$key])) return $_SERVER[$key];
        if (isset($_SERVER[strtoupper($index)])) return $_SERVER[strtoupper($index)];
        if (function_exists('apache_request_headers')) {
            $headers = apache_request_headers();
            foreach ($headers as $k => $v) {
                if (strcasecmp($k, $index) === 0) return $v;
            }
        }
        return NULL;
    }
}
