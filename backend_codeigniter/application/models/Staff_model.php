<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Staff_model extends CI_Model {

    public function get_all(): array {
        return $this->db->get('staff')->result_array();
    }

    public function find(int $id): ?array {
        return $this->db->where('id', $id)->get('staff')->row_array();
    }

    protected function sanitize_staff_data(array $data): array {
        if (!isset($data['emp_id'])) {
            $data['emp_id'] = $data['staff_id'] ?? ('EMP' . rand(1000, 9999));
        }
        if (!isset($data['role'])) {
            $data['role'] = $data['designation'] ?? 'Teacher';
        }
        if (!isset($data['designation'])) {
            $data['designation'] = $data['role'];
        }
        if (!isset($data['department'])) {
            $data['department'] = 'Academics';
        }
        if (isset($data['salary']) && !isset($data['basic_salary'])) {
            $data['basic_salary'] = $data['salary'];
        }

        $allowed = [
            'emp_id', 'name', 'role', 'designation', 'email', 'phone', 'dob',
            'gender', 'blood_group', 'religion', 'category', 'joining_date',
            'address', 'city', 'state', 'pincode', 'qualification', 'basic_salary',
            'account_no', 'bank_name', 'ifsc_code', 'profile_photo', 'department', 'status'
        ];

        return array_intersect_key($data, array_flip($allowed));
    }

    public function create_staff(array $data): int {
        $clean = $this->sanitize_staff_data($data);
        $clean['created_at'] = date('Y-m-d H:i:s');
        $clean['updated_at'] = date('Y-m-d H:i:s');
        $this->db->insert('staff', $clean);
        return (int)$this->db->insert_id();
    }

    public function mark_attendance(string $date, array $records): int {
        $count = 0;
        foreach ($records as $r) {
            $staff_id = $r['staff_id'] ?? null;
            if (!$staff_id) continue;

            $status = $r['status'] ?? 'Present';
            $existing = $this->db->where(['staff_id' => $staff_id, 'date' => $date])->get('staff_attendances')->row_array();

            if ($existing) {
                $this->db->update('staff_attendances', [
                    'status'     => $status,
                    'time_in'    => $r['time_in'] ?? null,
                    'time_out'   => $r['time_out'] ?? null,
                    'updated_at' => date('Y-m-d H:i:s'),
                ], ['id' => $existing['id']]);
            } else {
                $this->db->insert('staff_attendances', [
                    'staff_id'   => $staff_id,
                    'date'       => $date,
                    'status'     => $status,
                    'time_in'    => $r['time_in'] ?? null,
                    'time_out'   => $r['time_out'] ?? null,
                    'created_at' => date('Y-m-d H:i:s'),
                    'updated_at' => date('Y-m-d H:i:s'),
                ]);
            }
            $count++;
        }
        return $count;
    }
}
