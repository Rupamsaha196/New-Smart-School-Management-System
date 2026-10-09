<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Fee_model extends CI_Model {

    public function get_fees(?int $student_id = null, ?string $campus = null): array {
        if ($student_id) {
            $this->db->where('student_id', $student_id);
        }
        if ($campus !== null) {
            $main_name = 'Kolkata Main Campus (Salt Lake Sector V)';
            $is_main = empty($campus) || stripos($campus, 'kolkata main') !== false || stripos($campus, 'salt lake') !== false || strtolower(trim($campus)) === 'main';
            if ($is_main) {
                $this->db->where("(campus = '{$main_name}' OR campus = 'Kolkata Main' OR campus LIKE '%Kolkata Main%' OR campus IS NULL OR campus = '')", null, false);
            } else {
                $this->db->where('campus', $campus);
            }
        }
        return $this->db->get('student_fees')->result_array();
    }

    public function find(int $id): ?array {
        return $this->db->where('id', $id)->get('student_fees')->row_array();
    }

    public function get_fee_types(): array {
        return $this->db->get('fee_types')->result_array();
    }

    public function get_fee_discounts(): array {
        return $this->db->get('fee_discounts')->result_array();
    }

    public function summary(?string $campus = null): array {
        if ($campus !== null) {
            $main_name = 'Kolkata Main Campus (Salt Lake Sector V)';
            $is_main = empty($campus) || stripos($campus, 'kolkata main') !== false || stripos($campus, 'salt lake') !== false || strtolower(trim($campus)) === 'main';
            if ($is_main) {
                $this->db->where("(campus = '{$main_name}' OR campus = 'Kolkata Main' OR campus LIKE '%Kolkata Main%' OR campus IS NULL OR campus = '')", null, false);
            } else {
                $this->db->where('campus', $campus);
            }
        }
        $fees = $this->db->get('student_fees')->result_array();
        $total_due = array_sum(array_column($fees, 'amount'));
        $total_collected = array_sum(array_column($fees, 'paid'));
        $total_pending = array_sum(array_map(fn($f) => max(0, $f['amount'] - $f['paid']), $fees));

        return [
            'total_due'       => $total_due,
            'total_collected' => $total_collected,
            'total_pending'   => $total_pending,
            'collection_rate' => $total_due > 0 ? round(($total_collected / $total_due) * 100, 2) : 0,
        ];
    }

    public function quick_create(int $student_id, float $amount, string $type, bool $collect_now, ?string $campus = null): int {
        $student = $this->db->where('id', $student_id)->get('students')->row_array();
        $name = $student ? ($student['first_name'] . ' ' . $student['last_name']) : 'Student';
        $receipt_no = 'SS-REC-' . date('Y') . '-' . str_pad((string)rand(100, 9999), 5, '0', STR_PAD_LEFT);
        $campus_val = $campus ?: ($student['campus'] ?? 'Kolkata Main Campus (Salt Lake Sector V)');

        $data = [
            'student_id'   => $student_id,
            'receipt_no'   => $receipt_no,
            'type'         => $type,
            'amount'       => $amount,
            'paid'         => $collect_now ? $amount : 0,
            'status'       => $collect_now ? 'Paid' : 'Pending',
            'campus'       => $campus_val,
            'due_date'     => date('Y-m-d', strtotime('+15 days')),
            'date'         => $collect_now ? date('Y-m-d') : null,
            'payment_mode' => $collect_now ? 'Cash Counter' : 'Pending',
            'month'        => date('F Y'),
            'created_at'   => date('Y-m-d H:i:s'),
            'updated_at'   => date('Y-m-d H:i:s'),
        ];
        $this->db->insert('student_fees', $data);
        $fee_id = $this->db->insert_id();

        if ($collect_now) {
            $this->db->insert('transactions', [
                'type'        => 'Income',
                'head'        => 'Tuition & Academic Fees',
                'description' => "Quick Fee Collection: {$type} for {$name}",
                'amount'      => $amount,
                'date'        => date('Y-m-d'),
                'created_at'  => date('Y-m-d H:i:s'),
                'updated_at'  => date('Y-m-d H:i:s'),
            ]);
        }

        return $fee_id;
    }

    public function calculate_fine(array $fee): float {
        $due = !empty($fee['due_date']) ? strtotime($fee['due_date']) : 0;
        if ($due > 0 && time() > $due && ($fee['status'] ?? '') !== 'Paid') {
            $days_overdue = ceil((time() - $due) / 86400);
            return floatval($days_overdue * 20); // ₹20 / day fine
        }
        return floatval($fee['fine'] ?? 0);
    }
}
