<?php
/**
 * Smart School - PHP Built-in Web Server Router
 * Infosof Technologies 2026
 *
 * Directs static file requests directly and passes all dynamic API/web
 * routes to the CodeIgniter front controller (index.php).
 */

$uri = urldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH));
$file = __DIR__ . $uri;

if ($uri !== '/' && file_exists($file) && !is_dir($file)) {
    return false; // serve requested file as-is
}

require_once __DIR__ . '/index.php';
