<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Qr_lib {

    /**
     * Process barcode or QR code scan payload
     */
    public function process_scan(string $code, array $existing_student = null): array {
        $timestamp = date('Y-m-d H:i:s');
        $hour = (int)date('H');

        $status = ($hour > 9) ? 'Late' : 'Present';
        $type = ($hour >= 14) ? 'Out' : 'In';

        return [
            'identifier'   => $code,
            'status'       => $status,
            'scan_type'    => $type,
            'timestamp'    => $timestamp,
            'matched'      => $existing_student !== null,
            'student_name' => $existing_student ? ($existing_student['first_name'] . ' ' . $existing_student['last_name']) : 'Unknown Identity',
            'admission_no' => $existing_student['admission_no'] ?? $code,
        ];
    }
}
