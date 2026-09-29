<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class CI_Router {
    public array $routes = [];
    public string $class = '';
    public string $method = '';
    public array $params = [];
    public string $directory = '';
    public string $default_controller = 'welcome';

    public function __construct() {
        if (file_exists(APPPATH . 'config/routes.php')) {
            require(APPPATH . 'config/routes.php');
            if (isset($route) && is_array($route)) {
                $this->routes = $route;
                if (isset($route['default_controller'])) {
                    $this->default_controller = $route['default_controller'];
                }
            }
        }
    }

    public function _set_routing(): void {
        $uri = &load_class('URI', 'core');
        $uri_string = $uri->uri_string();

        if ($uri_string === '') {
            $this->_set_default_controller();
            return;
        }

        // Match routes
        foreach ($this->routes as $key => $val) {
            $key = str_replace([':any', ':num'], ['[^/]+', '[0-9]+'], $key);

            if (preg_match('#^' . $key . '$#', $uri_string)) {
                if (strpos($val, '$') !== FALSE && strpos($key, '(') !== FALSE) {
                    $val = preg_replace('#^' . $key . '$#', $val, $uri_string);
                }
                $this->_set_request(explode('/', $val));
                return;
            }
        }

        $this->_set_request($uri->segments);
    }

    protected function _set_default_controller(): void {
        $parts = explode('/', $this->default_controller);
        $this->class = $parts[0];
        $this->method = $parts[1] ?? 'index';
    }

    protected function _set_request(array $segments): void {
        if (empty($segments)) {
            $this->_set_default_controller();
            return;
        }

        $this->class = strtolower($segments[0]);
        $this->method = isset($segments[1]) ? strtolower($segments[1]) : 'index';
        $this->params = array_slice($segments, 2);
    }

    public function fetch_class(): string {
        return $this->class;
    }

    public function fetch_method(): string {
        return $this->method;
    }

    public function fetch_directory(): string {
        return $this->directory;
    }
}
