<?php
require_once 'backend_codeigniter/index.php';
$ci = &get_instance();
$methods = get_class_methods($ci->db);
echo "Methods on CI DB:\n";
foreach ($methods as $m) {
    if (strpos($m, 'set') !== false || strpos($m, 'update') !== false || strpos($m, 'query') !== false) {
        echo " - $m\n";
    }
}
