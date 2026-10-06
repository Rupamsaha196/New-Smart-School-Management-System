<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Website extends REST_Controller {

    private function _ensure_table(): void {
        $this->db->query("CREATE TABLE IF NOT EXISTS `admission_inquiries` (
          `id` int(11) NOT NULL AUTO_INCREMENT,
          `inquiry_id` varchar(50) NOT NULL UNIQUE,
          `parent_name` varchar(150) NOT NULL,
          `student_name` varchar(150) DEFAULT NULL,
          `phone` varchar(30) NOT NULL,
          `email` varchar(150) DEFAULT NULL,
          `target_class` varchar(50) NOT NULL DEFAULT 'Class 1',
          `message` text DEFAULT NULL,
          `status` enum('New', 'Contacted', 'In Review', 'Converted', 'Closed') NOT NULL DEFAULT 'New',
          `counselor_notes` text DEFAULT NULL,
          `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
          `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (`id`),
          KEY `idx_inquiry_status` (`status`),
          KEY `idx_inquiry_phone` (`phone`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");
    }

    public function inquiry(): void {
        $p = $this->get_payload();
        $parent_name  = trim(!empty($p['parent_name']) ? $p['parent_name'] : ($this->input->post('parent_name') ?? ''));
        $student_name = trim(!empty($p['student_name']) ? $p['student_name'] : ($this->input->post('student_name') ?? ''));
        $phone        = trim(!empty($p['phone']) ? $p['phone'] : ($this->input->post('phone') ?? ''));
        $email        = trim(!empty($p['email']) ? $p['email'] : ($this->input->post('email') ?? ''));
        $target_class = trim(!empty($p['target_class']) ? $p['target_class'] : ($this->input->post('target_class') ?: 'Class 1'));
        $message      = trim(!empty($p['message']) ? $p['message'] : ($this->input->post('message') ?: 'Admission inquiry'));

        if (empty($parent_name)) {
            $this->error('Parent / Guardian name is required', 422);
            return;
        }
        if (empty($phone)) {
            $this->error('Contact mobile number is required', 422);
            return;
        }

        $this->_ensure_table();

        $inquiry_id = 'INQ-' . date('Y') . '-' . strtoupper(bin2hex(random_bytes(2)));

        $data = [
            'inquiry_id'   => $inquiry_id,
            'parent_name'  => $parent_name,
            'student_name' => $student_name ?: null,
            'phone'        => $phone,
            'email'        => $email ?: null,
            'target_class' => $target_class,
            'message'      => $message,
            'status'       => 'New',
            'created_at'   => date('Y-m-d H:i:s'),
            'updated_at'   => date('Y-m-d H:i:s'),
        ];

        $this->db->insert('admission_inquiries', $data);
        $insert_id = $this->db->insert_id();
        $data['id'] = $insert_id;

        $this->success($data, 'Thank you! Your admission inquiry has been registered. Our admissions counselor will contact you shortly.', 201);
    }

    public function inquiries(): void {
        $this->_ensure_table();

        $status = $this->input->get('status');
        $search = $this->input->get('search');
        $class  = $this->input->get('class');

        $this->db->from('admission_inquiries');

        if (!empty($status) && $status !== 'all') {
            $this->db->where('status', $status);
        }
        if (!empty($class) && $class !== 'all') {
            $this->db->where('target_class', $class);
        }
        if (!empty($search)) {
            $this->db->group_start();
            $this->db->like('parent_name', $search);
            $this->db->or_like('student_name', $search);
            $this->db->or_like('phone', $search);
            $this->db->or_like('inquiry_id', $search);
            $this->db->or_like('email', $search);
            $this->db->group_end();
        }

        $this->db->order_by('created_at', 'DESC');
        $items = $this->db->get()->result_array();

        // Calculate counts
        $all_counts = $this->db->select("
            COUNT(*) as total,
            SUM(CASE WHEN status = 'New' THEN 1 ELSE 0 END) as count_new,
            SUM(CASE WHEN status = 'Contacted' THEN 1 ELSE 0 END) as count_contacted,
            SUM(CASE WHEN status = 'In Review' THEN 1 ELSE 0 END) as count_in_review,
            SUM(CASE WHEN status = 'Converted' THEN 1 ELSE 0 END) as count_converted,
            SUM(CASE WHEN status = 'Closed' THEN 1 ELSE 0 END) as count_closed
        ")->get('admission_inquiries')->row_array();

        $summary = [
            'total'       => (int)($all_counts['total'] ?? 0),
            'new'         => (int)($all_counts['count_new'] ?? 0),
            'contacted'   => (int)($all_counts['count_contacted'] ?? 0),
            'in_review'   => (int)($all_counts['count_in_review'] ?? 0),
            'converted'   => (int)($all_counts['count_converted'] ?? 0),
            'closed'      => (int)($all_counts['count_closed'] ?? 0),
        ];

        $this->response([
            'inquiries' => $items,
            'summary'   => $summary
        ]);
    }

    public function update_inquiry(int $id): void {
        $this->_ensure_table();
        $p = $this->get_payload();

        $existing = $this->db->where('id', $id)->get('admission_inquiries')->row_array();
        if (!$existing) {
            $this->error('Inquiry not found', 404);
            return;
        }

        $updates = [];
        if (isset($p['status'])) {
            $updates['status'] = $p['status'];
        }
        if (isset($p['counselor_notes'])) {
            $updates['counselor_notes'] = $p['counselor_notes'];
        }
        if (isset($p['target_class'])) {
            $updates['target_class'] = $p['target_class'];
        }

        $updates['updated_at'] = date('Y-m-d H:i:s');

        $this->db->where('id', $id)->update('admission_inquiries', $updates);
        $updated = $this->db->where('id', $id)->get('admission_inquiries')->row_array();

        $this->success($updated, 'Inquiry updated successfully.');
    }

    public function delete_inquiry(int $id): void {
        $this->_ensure_table();
        $this->db->where('id', $id)->delete('admission_inquiries');
        $this->success(null, 'Inquiry deleted successfully.');
    }

    public function info(): void {
        $this->load->model('Setting_model', 'settings');
        $s = $this->settings->get_settings();
        $this->response([
            'school_name'      => $s['school_name'] ?? 'Smart School International',
            'tagline'          => $s['tagline'] ?? 'Empowering Minds, Shaping Futures',
            'phone'            => $s['phone'] ?? '+91 98765 43210',
            'email'            => $s['email'] ?? 'admissions@smartschool.edu',
            'whatsapp'         => $s['whatsapp_number'] ?? '+919876543210',
            'admissions_open'  => true,
            'active_session'   => $s['active_session'] ?? '2026-2027',
        ]);
    }
}
