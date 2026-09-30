<?php
defined('BASEPATH') OR exit('No direct script access allowed');

require_once(__DIR__ . '/DB_query_builder.php');

function &DB($params = '', bool $query_builder_override = NULL) {
    static $_db_instances = [];

    if (isset($_db_instances['default'])) {
        return $_db_instances['default'];
    }

    if (file_exists(APPPATH . 'config/database.php')) {
        require(APPPATH . 'config/database.php');
    }

    $active_group = $active_group ?? 'default';
    $db_config = $db[$active_group] ?? [];

    $host = trim(getenv('DB_HOST') ?: ($db_config['hostname'] ?? 'localhost'));
    $port = trim(getenv('DB_PORT') ?: ($db_config['port'] ?? '3306'));
    $database = trim(getenv('DB_DATABASE') ?: ($db_config['database'] ?? 'smart_school'));
    $username = trim(getenv('DB_USERNAME') ?: ($db_config['username'] ?? 'root'));
    $password = getenv('DB_PASSWORD') !== false ? trim(getenv('DB_PASSWORD')) : ($db_config['password'] ?? '');
    $driver = $db_config['dbdriver'] ?? 'pdo';

    $dsn = "mysql:host={$host};port={$port};dbname={$database};charset=utf8mb4";
    $pdo = null;

    try {
        $pdo_options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_TIMEOUT            => 5,
            PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4",
        ];

        // For remote cloud MySQL or if DB_SSL is requested, configure CA bundle
        $is_local = in_array(strtolower($host), ['localhost', '127.0.0.1', '::1', '']);
        if (!$is_local || getenv('DB_SSL') === 'true') {
            $ca_bundle = '/etc/ssl/certs/ca-certificates.crt';
            if (file_exists($ca_bundle)) {
                $pdo_options[PDO::MYSQL_ATTR_SSL_CA] = $ca_bundle;
            } elseif (file_exists('/etc/pki/tls/certs/ca-bundle.crt')) {
                $pdo_options[PDO::MYSQL_ATTR_SSL_CA] = '/etc/pki/tls/certs/ca-bundle.crt';
            }
            if (defined('PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT')) {
                $pdo_options[PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT] = false;
            }
        }

        $pdo = new PDO($dsn, $username, $password, $pdo_options);
    } catch (PDOException $e) {
        // Fallback to SQLite if local MySQL is temporarily unavailable
        $sqlite_file = APPPATH . '../database/database.sqlite';
        if (file_exists($sqlite_file)) {
            $pdo = new PDO('sqlite:' . $sqlite_file);
            $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        } else {
            // Create minimal SQLite database in memory / file so application doesn't crash
            $pdo = new PDO('sqlite:' . APPPATH . 'cache/smart_school.sqlite');
        }
    }

    $_db_instances['default'] = new CI_DB_query_builder($pdo);
    return $_db_instances['default'];
}
