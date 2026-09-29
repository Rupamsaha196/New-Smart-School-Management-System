<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class CI_Output {
    protected int $status_code = 200;
    protected string $final_output = '';
    protected array $headers = [];

    public function __construct() {
        $this->enable_cors();
    }

    public function enable_cors(): self {
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
        $this->set_header("Access-Control-Allow-Origin: $origin");
        $this->set_header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
        $this->set_header("Access-Control-Allow-Headers: Authorization, Content-Type, Accept, X-Requested-With, Origin");
        $this->set_header("Access-Control-Allow-Credentials: true");

        if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
            $this->set_status_header(200);
            $this->_display();
            exit(0);
        }
        return $this;
    }

    public function set_status_header(int $code = 200, string $text = ''): self {
        $this->status_code = $code;
        http_response_code($code);
        return $this;
    }

    public function get_status_header(): int {
        return $this->status_code;
    }

    public function set_header(string $header, bool $replace = TRUE): self {
        $this->headers[] = [$header, $replace];
        return $this;
    }

    public function set_content_type(string $mime_type, ?string $charset = 'utf-8'): self {
        $header = 'Content-Type: ' . $mime_type . ($charset ? '; charset=' . $charset : '');
        $this->set_header($header);
        return $this;
    }

    public function set_output(string $output): self {
        $this->final_output = $output;
        return $this;
    }

    public function get_output(): string {
        return $this->final_output;
    }

    public function json($data, int $status_code = 200): void {
        $this->set_status_header($status_code);
        $this->set_content_type('application/json');
        $this->set_output(json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));
    }

    public function _display(?string $output = ''): void {
        if ($output !== '') {
            $this->final_output = $output;
        }

        foreach ($this->headers as $h) {
            header($h[0], $h[1]);
        }

        echo $this->final_output;
    }
}
