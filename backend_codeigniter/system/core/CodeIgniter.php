<?php
defined('BASEPATH') OR exit('No direct script access allowed');

/**
 * CodeIgniter Application Handler
 * PHP 8.x Optimized Execution Pipeline
 */

require_once(BASEPATH . 'core/Common.php');

$CFG =& load_class('Config', 'core');
$URI =& load_class('URI', 'core');
$RTR =& load_class('Router', 'core');
$OUT =& load_class('Output', 'core');

$RTR->_set_routing();

$class = $RTR->fetch_class();
$method = $RTR->fetch_method();
$params = $RTR->params;

$controller_file = APPPATH . 'controllers/' . ucfirst($class) . '.php';
if (!file_exists($controller_file)) {
    $controller_file = APPPATH . 'controllers/' . strtolower($class) . '.php';
    if (!file_exists($controller_file)) {
        show_404($class . '/' . $method);
    }
}

require_once(BASEPATH . 'core/Controller.php');
require_once(BASEPATH . 'core/Model.php');
require_once(APPPATH . 'libraries/REST_Controller.php');
require_once($controller_file);

$class_name = ucfirst($class);
if (!class_exists($class_name)) {
    $class_name = strtolower($class);
    if (!class_exists($class_name)) {
        show_404($class . '/' . $method);
    }
}

$CI = new $class_name();

if (method_exists($CI, '_remap')) {
    $CI->_remap($method, $params);
} elseif (method_exists($CI, $method)) {
    call_user_func_array([$CI, $method], $params);
} else {
    show_404($class . '/' . $method);
}

$OUT->_display();
