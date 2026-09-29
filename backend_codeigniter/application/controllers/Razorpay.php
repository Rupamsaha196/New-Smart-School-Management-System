<?php
defined('BASEPATH') OR exit('No direct script access allowed');

/**
 * Razorpay Payment Gateway Controller
 * Handles order creation, payment verification, and gateway settings.
 * Infosof Technologies 2026
 */
class Razorpay extends REST_Controller {

    private ?string $key_id = null;
    private ?string $key_secret = null;
    private string $mode = 'test';
    private bool $enabled = true;
    private string $base_url = 'https://api.razorpay.com/v1/';

    public function __construct() {
        parent::__construct();
        $this->load->model('Fee_model', 'fee_model');

        // 1. Try loading from database school_settings
        $settings = $this->db->get('school_settings')->row_array();
        if ($settings) {
            $this->key_id     = !empty($settings['razorpay_key_id']) ? trim($settings['razorpay_key_id']) : null;
            $this->key_secret = !empty($settings['razorpay_key_secret']) ? trim($settings['razorpay_key_secret']) : null;
            $this->mode       = $settings['razorpay_mode'] ?? 'test';
            $this->enabled    = isset($settings['razorpay_enabled']) ? (bool)$settings['razorpay_enabled'] : true;
        }

        // 2. Fall back to config/razorpay.php if not set in DB
        if (empty($this->key_id) || $this->is_placeholder_key($this->key_id)) {
            $this->config->load('razorpay', TRUE, TRUE);
            $cfg_key = $this->config->item('razorpay_key_id', 'razorpay');
            $cfg_sec = $this->config->item('razorpay_key_secret', 'razorpay');
            if (!empty($cfg_key) && !$this->is_placeholder_key($cfg_key)) {
                $this->key_id     = $cfg_key;
                $this->key_secret = $cfg_sec;
            }
        }

        // 3. Fall back to env variables
        if (empty($this->key_id) || $this->is_placeholder_key($this->key_id)) {
            $env_key = getenv('RAZORPAY_KEY_ID');
            $env_sec = getenv('RAZORPAY_KEY_SECRET');
            if (!empty($env_key)) {
                $this->key_id     = $env_key;
                $this->key_secret = $env_sec;
            }
        }

        // Default test keys if still empty
        if (empty($this->key_id)) {
            $this->key_id = 'rzp_test_YOUR_KEY_ID_HERE';
        }
        if (empty($this->key_secret)) {
            $this->key_secret = 'YOUR_KEY_SECRET_HERE';
        }
    }

    private function is_placeholder_key(?string $key): bool {
        if (empty($key)) return true;
        if (strpos($key, 'YOUR_KEY') !== false) return true;
        if (strpos($key, 'XXXXXXXX') !== false) return true;
        return false;
    }

    /* ------------------------------------------------------------------
     * POST /api/razorpay/create-order
     * Body: { fee_id, amount, student_name, admission_no, email, mobile, currency }
     * Returns Razorpay order object so frontend can open the checkout popup.
     * ------------------------------------------------------------------ */
    public function create_order(): void {
        $p = $this->get_payload();
        $fee_id      = (int)(!empty($p['fee_id']) ? $p['fee_id'] : ($this->input->post('fee_id') ?: 0));
        $amount_raw  = (float)(!empty($p['amount']) ? $p['amount'] : ($this->input->post('amount') ?: 0));  // in Rupees from frontend
        $currency    = !empty($p['currency']) ? $p['currency'] : ($this->input->post('currency') ?: 'INR');

        // Convert rupees to paise (Razorpay requires smallest currency unit)
        $amount_paise = (int)round($amount_raw * 100);

        if ($amount_paise <= 0) {
            $this->error('Invalid payment amount. Amount must be greater than zero.', 400);
            return;
        }

        $receipt = 'SS_FEE_' . ($fee_id ?: time());
        $is_placeholder = $this->is_placeholder_key($this->key_id) || $this->is_placeholder_key($this->key_secret);

        // If credentials are real, call real Razorpay Orders API
        if (!$is_placeholder) {
            $payload = [
                'amount'          => $amount_paise,
                'currency'        => $currency,
                'receipt'         => $receipt,
                'payment_capture' => 1,
                'notes'           => [
                    'fee_id'       => $fee_id,
                    'student_name' => !empty($p['student_name']) ? $p['student_name'] : ($this->input->post('student_name') ?: ''),
                    'admission_no' => !empty($p['admission_no']) ? $p['admission_no'] : ($this->input->post('admission_no') ?: ''),
                ],
            ];

            $ch = curl_init($this->base_url . 'orders');
            curl_setopt_array($ch, [
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_POST           => true,
                CURLOPT_POSTFIELDS     => json_encode($payload),
                CURLOPT_USERPWD        => $this->key_id . ':' . $this->key_secret,
                CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
                CURLOPT_TIMEOUT        => 15,
            ]);

            $response = curl_exec($ch);
            $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $curl_err  = curl_error($ch);
            curl_close($ch);

            if ($curl_err) {
                $this->error('Network error contacting Razorpay: ' . $curl_err, 502);
                return;
            }

            $order = json_decode($response, true);

            if ($http_code === 200 && !empty($order['id'])) {
                $this->response([
                    'success'    => true,
                    'order_id'   => $order['id'],
                    'amount'     => $order['amount'],       // paise
                    'currency'   => $order['currency'],
                    'receipt'    => $order['receipt'],
                    'key_id'     => $this->key_id,
                    'fee_id'     => $fee_id,
                    'is_sandbox' => false,
                ]);
                return;
            }

            // If real credentials failed with error, report it
            $msg = $order['error']['description'] ?? ('Razorpay error (HTTP ' . $http_code . ')');
            $this->error($msg, $http_code ?: 502);
            return;
        }

        // Sandbox / Simulator mode (for testing without live credentials)
        $sim_order_id = 'order_sim_' . bin2hex(random_bytes(8));
        $this->response([
            'success'    => true,
            'order_id'   => $sim_order_id,
            'amount'     => $amount_paise,
            'currency'   => $currency,
            'receipt'    => $receipt,
            'key_id'     => $this->key_id,
            'fee_id'     => $fee_id,
            'is_sandbox' => true,
            'notice'     => 'Razorpay Sandbox Mode: Simulated checkout order created.',
        ]);
    }

    /* ------------------------------------------------------------------
     * POST /api/razorpay/verify
     * Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature, fee_id, amount, student_name, admission_no }
     * Verifies HMAC-SHA256 signature and marks the fee as paid in DB.
     * ------------------------------------------------------------------ */
    public function verify(): void {
        $p = $this->get_payload();
        $order_id   = !empty($p['razorpay_order_id'])   ? $p['razorpay_order_id']   : ($this->input->post('razorpay_order_id')   ?: '');
        $payment_id = !empty($p['razorpay_payment_id']) ? $p['razorpay_payment_id'] : ($this->input->post('razorpay_payment_id') ?: '');
        $signature  = !empty($p['razorpay_signature'])  ? $p['razorpay_signature']  : ($this->input->post('razorpay_signature')  ?: '');
        $fee_id     = (int)(!empty($p['fee_id'])        ? $p['fee_id']        : ($this->input->post('fee_id')        ?: 0));
        $amount     = (float)(!empty($p['amount'])      ? $p['amount']      : ($this->input->post('amount')      ?: 0));

        if (!$order_id || !$payment_id) {
            $this->error('Missing payment verification parameters (order_id or payment_id).', 400);
            return;
        }

        $is_placeholder = $this->is_placeholder_key($this->key_id) || $this->is_placeholder_key($this->key_secret);
        $is_sandbox_order = strpos($order_id, 'order_sim_') === 0;

        // Perform HMAC check if real keys and not a sandbox order
        if (!$is_placeholder && !$is_sandbox_order) {
            if (empty($signature)) {
                $this->error('Missing Razorpay signature for live verification.', 400);
                return;
            }
            $expected = hash_hmac('sha256', $order_id . '|' . $payment_id, $this->key_secret);
            if (!hash_equals($expected, $signature)) {
                $this->error('Payment signature verification failed. Possible tampered request.', 400);
                return;
            }
        }

        // Signature valid — record payment in DB
        $clean_pid = preg_replace('/[^a-zA-Z0-9]/', '', $payment_id);
        $receipt_no = 'RZP-' . strtoupper(substr($clean_pid, -8));

        // 1. Update or create student_fees record
        $student_name = $this->input->post('student_name') ?: 'Student';
        $adm_no       = $this->input->post('admission_no') ?: '';

        if ($fee_id > 0) {
            $this->db->where('id', $fee_id)->update('student_fees', [
                'status'              => 'Paid',
                'paid'                => $amount,
                'payment_mode'        => 'Razorpay Online Gateway',
                'receipt_no'          => $receipt_no,
                'payment_date'        => date('Y-m-d H:i:s'),
                'razorpay_order_id'   => $order_id,
                'razorpay_payment_id' => $payment_id,
                'updated_at'          => date('Y-m-d H:i:s'),
            ]);
        } else if (!empty($adm_no)) {
            $st = $this->db->where('admission_no', $adm_no)->get('students')->row_array();
            if ($st) {
                // Check if existing pending fee exists
                $existing_fee = $this->db->where(['student_id' => $st['id'], 'status' => 'Pending'])->get('student_fees')->row_array();
                if ($existing_fee) {
                    $this->db->where('id', $existing_fee['id'])->update('student_fees', [
                        'status'              => 'Paid',
                        'paid'                => $amount,
                        'payment_mode'        => 'Razorpay Online Gateway',
                        'receipt_no'          => $receipt_no,
                        'payment_date'        => date('Y-m-d H:i:s'),
                        'razorpay_order_id'   => $order_id,
                        'razorpay_payment_id' => $payment_id,
                        'updated_at'          => date('Y-m-d H:i:s'),
                    ]);
                    $fee_id = $existing_fee['id'];
                } else {
                    $this->db->insert('student_fees', [
                        'student_id'          => $st['id'],
                        'receipt_no'          => $receipt_no,
                        'type'                => 'Tuition Fee (Quarterly)',
                        'amount'              => $amount,
                        'paid'                => $amount,
                        'status'              => 'Paid',
                        'due_date'            => date('Y-m-d'),
                        'date'                => date('Y-m-d'),
                        'payment_mode'        => 'Razorpay Online Gateway',
                        'month'               => date('F Y'),
                        'razorpay_order_id'   => $order_id,
                        'razorpay_payment_id' => $payment_id,
                        'payment_date'        => date('Y-m-d H:i:s'),
                        'created_at'          => date('Y-m-d H:i:s'),
                        'updated_at'          => date('Y-m-d H:i:s'),
                    ]);
                    $fee_id = (int)$this->db->insert_id();
                }
            }
        }

        // 2. Also log in transactions ledger as Income
        $student_name = $this->input->post('student_name') ?: 'Student';
        $adm_no       = $this->input->post('admission_no') ?: '';

        $this->db->insert('transactions', [
            'type'         => 'Income',
            'head'         => 'Online Fee Collection (Razorpay)',
            'reference_no' => $receipt_no,
            'description'  => "Online fee payment for {$student_name} ({$adm_no}) via Razorpay Gateway. Payment ID: {$payment_id}, Order ID: {$order_id}",
            'amount'       => $amount,
            'payment_mode' => 'Razorpay Online Gateway',
            'date'         => date('Y-m-d'),
            'created_at'   => date('Y-m-d H:i:s'),
            'updated_at'   => date('Y-m-d H:i:s'),
        ]);

        $this->response([
            'success'      => true,
            'message'      => 'Payment verified and recorded successfully in database.',
            'receipt_no'   => $receipt_no,
            'payment_id'   => $payment_id,
            'order_id'     => $order_id,
            'fee_id'       => $fee_id,
            'amount'       => $amount,
            'payment_date' => date('Y-m-d H:i:s'),
            'is_sandbox'   => $is_sandbox_order || $is_placeholder,
        ]);
    }

    /* ------------------------------------------------------------------
     * GET /api/razorpay/config
     * Returns public key_id and configuration status.
     * ------------------------------------------------------------------ */
    public function config_key(): void {
        $is_placeholder = $this->is_placeholder_key($this->key_id);
        $this->response([
            'key_id'         => $this->key_id ?: null,
            'configured'     => !$is_placeholder,
            'mode'           => $this->mode,
            'enabled'        => $this->enabled,
            'is_placeholder' => $is_placeholder,
            'currency'       => 'INR',
        ]);
    }

    /* ------------------------------------------------------------------
     * POST /api/razorpay/save-keys
     * Body: { razorpay_key_id, razorpay_key_secret, razorpay_mode, razorpay_enabled }
     * Saves Razorpay credentials into school_settings table.
     * ------------------------------------------------------------------ */
    public function save_config(): void {
        $p = $this->get_payload();
        $key_id     = trim(!empty($p['razorpay_key_id']) ? $p['razorpay_key_id'] : ($this->input->post('razorpay_key_id') ?: ''));
        $key_secret = trim(!empty($p['razorpay_key_secret']) ? $p['razorpay_key_secret'] : ($this->input->post('razorpay_key_secret') ?: ''));
        $mode       = (!empty($p['razorpay_mode']) ? $p['razorpay_mode'] : $this->input->post('razorpay_mode')) === 'live' ? 'live' : 'test';
        $enabled    = isset($p['razorpay_enabled']) ? (int)$p['razorpay_enabled'] : ($this->input->post('razorpay_enabled') !== null ? (int)$this->input->post('razorpay_enabled') : 1);

        if (empty($key_id)) {
            $this->error('Razorpay Key ID cannot be empty.', 422);
            return;
        }

        $update_data = [
            'razorpay_key_id'     => $key_id,
            'razorpay_mode'       => $mode,
            'razorpay_enabled'    => $enabled,
            'updated_at'          => date('Y-m-d H:i:s'),
        ];

        // Only update secret if provided (don't overwrite with blank)
        if (!empty($key_secret) && $key_secret !== '••••••••••••••••') {
            $update_data['razorpay_key_secret'] = $key_secret;
        }

        $exists = $this->db->get('school_settings')->row_array();
        if ($exists) {
            $this->db->where('id', $exists['id'])->update('school_settings', $update_data);
        } else {
            $this->db->insert('school_settings', $update_data);
        }

        $this->response([
            'success' => true,
            'message' => 'Razorpay Payment Gateway credentials updated successfully.',
            'mode'    => $mode,
            'key_id'  => $key_id,
        ]);
    }

    /* ------------------------------------------------------------------
     * Helper: unified error response matching REST_Controller
     * ------------------------------------------------------------------ */
    public function error(string $message = 'An error occurred', int $http_code = 400, $errors = NULL): void {
        $this->response([
            'status'  => 'error',
            'success' => false,
            'error'   => $message,
            'message' => $message,
            'errors'  => $errors,
        ], $http_code);
    }
}
