<?php
defined('BASEPATH') OR exit('No direct script access allowed');

#[\AllowDynamicProperties]
class CI_Model {
    public function __construct() {}

    public function __get(string $key) {
        $CI =& get_instance();
        return $CI->$key ?? NULL;
    }
}
