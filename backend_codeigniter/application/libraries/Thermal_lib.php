<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Thermal_lib {

    /**
     * Format an 80mm thermal receipt payload
     */
    public function format_80mm_receipt(array $fee, array $school_settings): array {
        $receipt_no = $fee['receipt_no'] ?? ('SS-REC-' . str_pad($fee['id'] ?? 1, 5, '0', STR_PAD_LEFT));
        $date = !empty($fee['date']) ? date('d-m-Y', strtotime($fee['date'])) : date('d-m-Y');
        $paid = floatval($fee['paid'] ?? $fee['amount'] ?? 0);

        return [
            'thermal_width' => '80mm',
            'school_name'   => $school_settings['school_name'] ?? 'SMART SCHOOL INTERNATIONAL',
            'school_phone'  => $school_settings['phone'] ?? '+91 98765 43210',
            'school_address'=> $school_settings['address'] ?? 'Plot 42, Institutional Area, Sector V, Salt Lake, Kolkata, West Bengal - 700091',
            'receipt_no'    => $receipt_no,
            'date'          => $date,
            'student_name'  => $fee['student_name'] ?? 'Student',
            'admission_no'  => $fee['admission_no'] ?? 'SS2025001',
            'fee_head'      => $fee['title'] ?? ($fee['type'] ?? 'Tuition Fee'),
            'paid_amount'   => $paid,
            'payment_mode'  => $fee['payment_mode'] ?? 'Cash Counter',
            'cashier'       => 'Chief Accountant',
            'footer'        => 'THANK YOU FOR YOUR PAYMENT - COMPUTER GENERATED SLIP',
        ];
    }
}
