<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Finance extends REST_Controller {

    /**
     * GET  /api/transactions   — list all transactions (with optional ?type=Income|Expense filter)
     * POST /api/transactions   — create a new transaction record in the ledger
     */
    public function transactions(): void {
        $method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');

        if ($method === 'POST') {
            $this->store_transaction();
            return;
        }

        // GET: list all
        $type = $this->input->get('type');
        if ($type) {
            $this->db->where('type', $type);
        }
        $campus = $this->get_active_campus();
        $this->apply_campus_filter('', $campus);
        $transactions = $this->db->order_by('date', 'DESC')->get('transactions')->result_array();
        $this->response($transactions);
    }

    public function store_transaction(): void {
        $payload = $this->get_payload() ?: $this->input->post();
        $head = $payload['head'] ?? ($payload['title'] ?? null);
        $amount = floatval($payload['amount'] ?? 0);
        if (empty($head) || $amount <= 0) {
            $this->error('Valid title/head and amount are required', 422);
            return;
        }

        $type = in_array(ucfirst(strtolower($payload['type'] ?? '')), ['Income', 'Expense'])
            ? ucfirst(strtolower($payload['type']))
            : 'Expense';

        $campus = $payload['campus'] ?? $this->get_active_campus();

        $data = [
            'type'         => $type,
            'head'         => $head,
            'amount'       => $amount,
            'date'         => $payload['date'] ?? date('Y-m-d'),
            'payment_mode' => $payload['payment_mode'] ?? 'Cash',
            'description'  => $payload['description'] ?? $head,
            'reference_no' => $payload['reference_no'] ?? ('TXN-' . strtoupper(bin2hex(random_bytes(4)))),
            'campus'       => $campus,
            'created_at'   => date('Y-m-d H:i:s'),
            'updated_at'   => date('Y-m-d H:i:s'),
        ];
        $this->db->insert('transactions', $data);
        $id = $this->db->insert_id();

        $this->success(['id' => $id, 'head' => $head, 'amount' => $amount], 'Financial transaction recorded', 201);
    }
}
