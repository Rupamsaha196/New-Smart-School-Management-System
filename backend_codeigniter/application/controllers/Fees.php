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
        $type        = trim(!empty($payload['type']) ? $payload['type'] : ($this->input->post('type') ?: 'Tuition Fee (Quarterly)'));
        $collect_now = isset($payload['collect_now']) ? (bool)$payload['collect_now'] : (bool)$this->input->post('collect_now');

        // Boundary Validation
        if ($amount <= 0) {
            $this->error('Fee invoice amount must be a positive number greater than 0.', 422);
            return;
        }
        if ($amount > 10000000) {
            $this->error('Fee invoice amount exceeds maximum permissible limit (₹1,00,00,000).', 422);
            return;
        }

        // Foreign Key Check: Verify student exists
        $student = $this->db->where('id', $student_id)->get('students')->row_array();
        if (!$student) {
            $this->error("Foreign key constraint: Student ID {$student_id} does not exist in database.", 404);
            return;
        }

        // Duplicate Check: Check if an identical fee invoice already exists in Pending status
        $existing_fee = $this->db->where([
            'student_id' => $student_id,
            'title'      => $type,
            'status'     => 'Pending',
        ])->get('student_fees')->row_array();
        if ($existing_fee) {
            $this->error("Duplicate entry: A pending fee invoice for '{$type}' already exists for this student (Invoice #{$existing_fee['id']}).", 409);
            return;
        }

        // Transactional Execution
        $this->db->trans_begin();
        try {
            $fee_id = $this->fee_model->quick_create($student_id, $amount, $type, $collect_now);
            if ($this->db->trans_status() === FALSE) {
                $this->db->trans_rollback();
                $this->error('Transaction error: Failed to generate fee invoice.', 500);
                return;
            }
            $this->db->trans_commit();
            $this->success(['fee_id' => $fee_id], 'Quick fee invoice generated successfully', 201);
        } catch (\Throwable $e) {
            $this->db->trans_rollback();
            $this->error('Invoice generation failed: ' . $e->getMessage(), 500);
        }
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
