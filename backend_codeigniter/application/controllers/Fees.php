<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Fees extends REST_Controller {

    public function __construct() {
        parent::__construct();
        $this->load->model('Fee_model', 'fee_model');
        $this->load->model('Setting_model', 'setting_model');
        $this->load->library('Thermal_lib', null, 'thermal');
    }

    public function index(): void {
        $student_id = $this->input->get('student_id');
        $fees = $this->fee_model->get_fees($student_id ? (int)$student_id : null);
        $this->response($fees);
    }

    public function summary(): void {
        $summary = $this->fee_model->summary();
        $this->response($summary);
    }

    public function defaulters(): void {
        $defaulters = $this->db->where('status', 'Pending')->get('student_fees')->result_array();
        $this->response($defaulters);
    }

    public function quick_create(): void {
        $payload = $this->get_payload();
        $student_id  = (int)(!empty($payload['student_id']) ? $payload['student_id'] : ($this->input->post('student_id') ?: 1));
        $amount      = floatval(!empty($payload['amount']) ? $payload['amount'] : ($this->input->post('amount') ?: 12500));
        $type        = !empty($payload['type']) ? $payload['type'] : ($this->input->post('type') ?: 'Tuition Fee (Quarterly)');
        $collect_now = isset($payload['collect_now']) ? (bool)$payload['collect_now'] : (bool)$this->input->post('collect_now');

        $fee_id = $this->fee_model->quick_create($student_id, $amount, $type, $collect_now);
        $this->success(['fee_id' => $fee_id], 'Quick fee invoice generated successfully', 201);
    }

    public function thermal_receipt(int $id): void {
        $fee = $this->fee_model->find($id) ?: [
            'id'           => $id,
            'title'        => 'Tuition Fee (Term 1)',
            'amount'       => 12500,
            'paid'         => 12500,
            'receipt_no'   => 'SS-REC-' . str_pad((string)$id, 5, '0', STR_PAD_LEFT),
            'date'         => date('Y-m-d'),
            'student_name' => 'Aarav Sharma',
            'admission_no' => 'SS2025001',
            'payment_mode' => 'UPI / Online Portal',
        ];

        $settings = $this->setting_model->get_settings();
        $slip = $this->thermal->format_80mm_receipt($fee, $settings);
        $this->response($slip);
    }

    public function online_checkout(): void {
        $payload = $this->get_payload();
        $fee_id = (int)(!empty($payload['fee_id']) ? $payload['fee_id'] : ($this->input->post('fee_id') ?: 1));
        $method = !empty($payload['payment_method']) ? $payload['payment_method'] : ($this->input->post('payment_method') ?: 'UPI');

        $fee = $this->fee_model->find($fee_id);
        $base = $fee ? floatval($fee['amount'] - $fee['paid']) : 12500;
        if ($base <= 0) $base = 12500;

        $settings = $this->setting_model->get_settings();
        $pct = floatval($settings['online_processing_fee_pct'] ?? 1.50);
        $fee_surcharge = round(($base * $pct) / 100, 2);
        $total = $base + $fee_surcharge;

        $order_id = 'ORD_' . strtoupper(bin2hex(random_bytes(6)));

        $this->response([
            'order_id'               => $order_id,
            'fee_id'                 => $fee_id,
            'payment_method'         => $method,
            'base_amount'            => $base,
            'processing_fee_pct'     => $pct,
            'processing_fee_amount'  => $fee_surcharge,
            'total_payable'          => $total,
            'currency'               => 'INR',
            'status'                 => 'ReadyForPayment',
        ]);
    }

    public function types(): void {
        $types = $this->fee_model->get_fee_types();
        $this->response($types);
    }

    public function discounts(): void {
        $discounts = $this->fee_model->get_fee_discounts();
        $this->response($discounts);
    }
}
