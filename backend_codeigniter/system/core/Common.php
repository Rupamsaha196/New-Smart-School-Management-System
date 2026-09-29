<?php
defined('BASEPATH') OR exit('No direct script access allowed');

/**
 * CodeIgniter Common Functions
 * PHP 8.x Compatible for Smart School 2026
 */

if (!function_exists('is_php')) {
    function is_php(string $version): bool {
        static $_is_php;
        $version = (string)$version;
        if (!isset($_is_php[$version])) {
            $_is_php[$version] = version_compare(PHP_VERSION, $version, '>=');
        }
        return $_is_php[$version];
    }
}

if (!function_exists('get_instance')) {
    function &get_instance(): ?CI_Controller {
        return CI_Controller::get_instance();
    }
}

if (!function_exists('load_class')) {
    function &load_class(string $class, string $directory = 'libraries', $param = NULL) {
        static $_classes = [];

        if (isset($_classes[$class])) {
            return $_classes[$class];
        }

        $name = FALSE;
        foreach ([APPPATH, BASEPATH] as $path) {
            if (file_exists($path . $directory . '/' . $class . '.php')) {
                $name = 'CI_' . $class;
                if (class_exists($name, FALSE) === FALSE) {
                    require_once($path . $directory . '/' . $class . '.php');
                }
                break;
            }
        }

        if ($name === FALSE) {
            // Check direct class file
            foreach ([APPPATH, BASEPATH] as $path) {
                if (file_exists($path . $directory . '/' . ucfirst($class) . '.php')) {
                    $name = ucfirst($class);
                    if (class_exists($name, FALSE) === FALSE) {
                        require_once($path . $directory . '/' . ucfirst($class) . '.php');
                    }
                    break;
                }
            }
        }

        if ($name === FALSE || !class_exists($name, FALSE)) {
            exit('Unable to locate the specified class: ' . $class . '.php');
        }

        $_classes[$class] = isset($param) ? new $name($param) : new $name();
        return $_classes[$class];
    }
}

if (!function_exists('config_item')) {
    function config_item(string $item) {
        static $_config;
        if (empty($_config)) {
            $_config[0] =& load_class('Config', 'core');
        }
        return $_config[0]->item($item);
    }
}

if (!function_exists('show_error')) {
    function show_error($message, int $status_code = 500, string $heading = 'An Error Was Encountered') {
        http_response_code($status_code);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'status'  => 'error',
            'code'    => $status_code,
            'heading' => $heading,
            'message' => $message,
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
        exit(1);
    }
}

if (!function_exists('show_404')) {
    function show_404(string $page = '', bool $log_error = TRUE) {
        show_error('The page you requested was not found: ' . $page, 404, '404 Page Not Found');
    }
}

if (!function_exists('log_message')) {
    function log_message(string $level, string $message): void {
        // Can log to file or ignore in production
    }
}
