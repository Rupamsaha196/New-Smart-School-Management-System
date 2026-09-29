<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Website extends REST_Controller {

    public function inquiry(): void {
        $p = $this->get_payload();
        $parent_name  = !empty($p['parent_name']) ? $p['parent_name'] : $this->input->post('parent_name');
        $student_name = !empty($p['student_name']) ? $p['student_name'] : $this->input->post('student_name');
        $phone        = !empty($p['phone']) ? $p['phone'] : $this->input->post('phone');
        $target_class = !empty($p['target_class']) ? $p['target_class'] : ($this->input->post('target_class') ?: 'Class 1');
        $message      = !empty($p['message']) ? $p['message'] : ($this->input->post('message') ?: 'Admission inquiry');

        $inquiry_id = 'INQ-' . strtoupper(bin2hex(random_bytes(3)));

        $this->success([
            'inquiry_id'   => $inquiry_id,
            'parent_name'  => $parent_name,
            'student_name' => $student_name,
            'phone'        => $phone,
            'target_class' => $target_class,
            'status'       => 'Received',
            'submitted_at' => date('Y-m-d H:i:s'),
        ], 'Admission inquiry received! Our admissions team will contact you shortly.', 201);
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
