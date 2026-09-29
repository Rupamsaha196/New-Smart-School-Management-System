<?php
defined('BASEPATH') OR exit('No direct script access allowed');

#[\AllowDynamicProperties]
class CI_Controller {
    private static ?CI_Controller $instance = null;
    public CI_Loader $load;
    public CI_Input $input;
    public CI_Output $output;
    public CI_Config $config;
    public CI_URI $uri;
    public $db;
    protected array $_dynamic_props = [];

    public function __construct() {
        self::$instance =& $this;

        $this->load   =& load_class('Loader', 'core');
        $this->input  =& load_class('Input', 'core');
        $this->output =& load_class('Output', 'core');
        $this->config =& load_class('Config', 'core');
        $this->uri    =& load_class('URI', 'core');

        // Autoload database by default
        $this->load->database();
    }

    public static function &get_instance(): ?CI_Controller {
        return self::$instance;
    }

    public function __set(string $name, $value): void {
        $this->$name = $value;
        $this->_dynamic_props[$name] = $value;
    }

    public function __get(string $name) {
        return $this->_dynamic_props[$name] ?? NULL;
    }
}
