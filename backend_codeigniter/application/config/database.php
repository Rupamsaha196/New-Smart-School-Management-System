<?php
defined('BASEPATH') OR exit('No direct script access allowed');

// Auto-load .env configuration if present (for easy cPanel / production setup)
$env_search_paths = [
    defined('FCPATH') ? FCPATH . '.env' : null,
    APPPATH . '../.env',
    dirname(APPPATH) . '/../.env'
];
foreach ($env_search_paths as $env_file) {
    if ($env_file && file_exists($env_file)) {
        $lines = file($env_file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            $line = trim($line);
            if ($line !== '' && strpos($line, '#') !== 0 && strpos($line, '=') !== false) {
                list($key, $val) = explode('=', $line, 2);
                $key = trim($key);
                $val = trim($val, " \t\n\r\0\x0B\"'");
                if (!isset($_SERVER[$key]) && !isset($_ENV[$key])) {
                    putenv("{$key}={$val}");
                    $_ENV[$key] = $val;
                    $_SERVER[$key] = $val;
                }
            }
        }
        break;
    }
}

$active_group = 'default';
$query_builder = TRUE;

$raw_db_url = getenv('MYSQL_URL') ?: getenv('DATABASE_URL');
$parsed_url = !empty($raw_db_url) ? parse_url($raw_db_url) : null;

$db['default'] = [
    'dsn'          => '',
    'hostname'     => trim($parsed_url['host'] ?? (getenv('DB_HOST') ?: 'localhost')),
    'port'         => trim($parsed_url['port'] ?? (getenv('DB_PORT') ?: 3306)),
    'username'     => trim(isset($parsed_url['user']) ? urldecode($parsed_url['user']) : (getenv('DB_USERNAME') ?: 'root')),
    'password'     => getenv('DB_PASSWORD') !== false ? getenv('DB_PASSWORD') : (isset($parsed_url['pass']) ? urldecode($parsed_url['pass']) : ''),
    'database'     => trim(isset($parsed_url['path']) ? ltrim($parsed_url['path'], '/') : (getenv('DB_DATABASE') ?: 'smart_school')),
    'dbdriver'     => 'pdo',
    'dbprefix'     => '',
    'pconnect'     => FALSE,
    'db_debug'     => (ENVIRONMENT !== 'production'),
    'cache_on'     => FALSE,
    'cachedir'     => '',
    'char_set'     => 'utf8mb4',
    'dbcollat'     => 'utf8mb4_unicode_ci',
    'swap_pre'     => '',
    'encrypt'      => FALSE,
    'compress'     => FALSE,
    'stricton'     => FALSE,
    'failover'     => [],
    'save_queries' => TRUE
];
