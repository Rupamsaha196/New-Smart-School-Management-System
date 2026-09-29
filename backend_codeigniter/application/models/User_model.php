<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class User_model extends CI_Model {

    public function get_users(): array {
        return $this->db->select('id, name, email, role, created_at')->get('users')->result_array();
    }

    public function find_by_email(string $email): ?array {
        return $this->db->where('email', $email)->get('users')->row_array();
    }

    public function find(int $id): ?array {
        return $this->db->where('id', $id)->get('users')->row_array();
    }

    public function create_user(array $data): int {
        if (!empty($data['password'])) {
            $data['password'] = password_hash($data['password'], PASSWORD_BCRYPT);
        }
        $data['created_at'] = date('Y-m-d H:i:s');
        $data['updated_at'] = date('Y-m-d H:i:s');
        $this->db->insert('users', $data);
        return $this->db->insert_id();
    }

    public function update_user(int $id, array $data): bool {
        if (!empty($data['password'])) {
            $data['password'] = password_hash($data['password'], PASSWORD_BCRYPT);
        }
        $data['updated_at'] = date('Y-m-d H:i:s');
        return $this->db->update('users', $data, ['id' => $id]);
    }

    public function delete_user(int $id): bool {
        return $this->db->delete('users', ['id' => $id]);
    }

    public function get_roles(): array {
        return [
            ['id' => 1, 'key' => 'super_admin', 'name' => 'Super Admin', 'description' => 'Full administrative access across all school branches & system configuration.'],
            ['id' => 2, 'key' => 'admin', 'name' => 'Administrator', 'description' => 'Operational control of academic sessions, students, staff, and classes.'],
            ['id' => 3, 'key' => 'accountant', 'name' => 'Accountant', 'description' => 'Full control over fee structures, fee collections, receipts, and expense ledgers.'],
            ['id' => 4, 'key' => 'teacher', 'name' => 'Teacher', 'description' => 'Mark attendance, enter exam marks, manage homework, and schedule live classes.'],
            ['id' => 5, 'key' => 'receptionist', 'name' => 'Receptionist', 'description' => 'Front desk visitor records, new student inquiries, and initial admission setup.'],
            ['id' => 6, 'key' => 'librarian', 'name' => 'Librarian', 'description' => 'Manage library catalog, book issues, returns, and overdue tracking.'],
            ['id' => 7, 'key' => 'parent', 'name' => 'Parent', 'description' => 'Monitor wards attendance, fee invoices, admit cards, and teacher notices.'],
            ['id' => 8, 'key' => 'student', 'name' => 'Student', 'description' => 'Access timetable, learning downloads, examination progress cards, and live classes.'],
        ];
    }
}
