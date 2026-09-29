<?php
defined('BASEPATH') OR exit('No direct script access allowed');

#[\AllowDynamicProperties]
class CI_Loader {
    protected array $_ci_models = [];
    protected array $_ci_libraries = [];
    protected array $_ci_helpers = [];

    public function model($model, string $name = '', $db_conn = FALSE) {
        if (empty($model)) return null;

        if (is_array($model)) {
            foreach ($model as $bmodel) {
                $this->model($bmodel);
            }
            return $this;
        }

        $path = '';
        if (($last_slash = strrpos($model, '/')) !== FALSE) {
            $path = substr($model, 0, ++$last_slash);
            $model = substr($model, $last_slash);
        }

        if (empty($name)) {
            $name = strtolower($model);
        }

        $CI =& get_instance();
        if (isset($CI->$name)) {
            return $CI->$name;
        }

        $class_name = ucfirst($model);
        $file = APPPATH . 'models/' . $path . $class_name . '.php';

        if (!file_exists($file)) {
            $file = APPPATH . 'models/' . $path . strtolower($class_name) . '.php';
            if (!file_exists($file)) {
                show_error('Unable to locate the model you have specified: ' . $model);
            }
        }

        require_once($file);
        $instance = new $class_name();
        if ($CI !== null) {
            $CI->$name = $instance;
        }
        $this->_ci_models[$name] = $instance;
        return $instance;
    }

    public function database($params = '', bool $return = FALSE, bool $query_builder = NULL) {
        $CI =& get_instance();
        require_once(BASEPATH . 'database/DB.php');

        if ($return === TRUE) {
            return DB($params, $query_builder);
        }

        $db = DB($params, $query_builder);
        if ($CI !== null) {
            $CI->db = $db;
        }
        return $this;
    }

    public function library($library, $params = NULL, ?string $object_name = NULL) {
        if (empty($library)) return null;

        if (is_array($library)) {
            foreach ($library as $key => $value) {
                if (is_int($key)) {
                    $this->library($value);
                } else {
                    $this->library($key, $value);
                }
            }
            return $this;
        }

        $class = ucfirst($library);
        $name = $object_name ?: strtolower($library);

        $CI =& get_instance();
        if (isset($CI->$name)) {
            return $CI->$name;
        }

        $file = APPPATH . 'libraries/' . $class . '.php';
        if (!file_exists($file)) {
            $file = BASEPATH . 'libraries/' . $class . '.php';
            if (!file_exists($file)) {
                show_error('Unable to locate the library you have specified: ' . $library);
            }
        }

        require_once($file);
        $instance = isset($params) ? new $class($params) : new $class();
        if ($CI !== null) {
            $CI->$name = $instance;
        }
        $this->_ci_libraries[$name] = $instance;
        return $instance;
    }

    public function helper($helpers): self {
        return $this;
    }

    public function view(string $view, array $vars = [], bool $return = FALSE) {
        $file = APPPATH . 'views/' . $view . '.php';
        if (!file_exists($file)) {
            show_error('Unable to load the requested file: ' . $view . '.php');
        }

        extract($vars);
        ob_start();
        include($file);
        $buffer = ob_get_clean();

        if ($return === TRUE) {
            return $buffer;
        }

        $CI =& get_instance();
        if ($CI !== null) {
            $CI->output->set_output($buffer);
        }
        return $this;
    }
}
