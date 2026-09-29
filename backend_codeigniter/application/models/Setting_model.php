<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Setting_model extends CI_Model {

    public function get_settings(): array {
        $settings = $this->db->get('school_settings')->row_array();
        if (!$settings) {
            return [
                'id'                      => 1,
                'school_name'             => 'Smart School International',
                'tagline'                 => 'Empowering Minds, Shaping Futures',
                'email'                   => 'admin@smartschool.edu',
                'phone'                   => '+91 98765 43210',
                'address'                 => 'Plot 42, Institutional Area, Sector V, Salt Lake, Kolkata, West Bengal - 700091',
                'active_session'          => '2025-2026',
                'currency'                => 'INR',
                'currency_symbol'         => '₹',
                'receipt_prefix'          => 'SS-REC-',
                'thermal_format'          => '80mm',
                'whatsapp_number'         => '+919876543210',
                'whatsapp_default_message'=> 'Hello Smart School Support Desk, I would like to inquire about admissions and school facilities.',
                'current_campus'          => 'Kolkata Main Campus (Salt Lake Sector V)',
                'available_campuses'      => json_encode(['Kolkata Main Campus (Salt Lake Sector V)', 'South Kolkata Campus (Ballygunge)', 'St. Xavier Model Academy (Park Street)']),
                'online_processing_fee_pct'=> 1.50,
            ];
        }
        return $settings;
    }

    public function update_settings(array $data): bool {
        // Only update valid columns present in school_settings table
        $valid_cols = [
            'school_name', 'tagline', 'email', 'phone', 'address', 'active_session',
            'currency', 'currency_symbol', 'receipt_prefix', 'thermal_format',
            'whatsapp_number', 'whatsapp_default_message', 'current_campus',
            'available_campuses', 'online_processing_fee_pct',
            'razorpay_key_id', 'razorpay_key_secret', 'razorpay_enabled', 'razorpay_mode'
        ];
        $clean = [];
        foreach ($data as $k => $v) {
            if (in_array($k, $valid_cols)) {
                $clean[$k] = is_array($v) ? json_encode($v) : $v;
            }
        }
        $clean['updated_at'] = date('Y-m-d H:i:s');
        
        $exists = $this->db->get('school_settings')->row_array();
        if ($exists) {
            return $this->db->update('school_settings', $clean, ['id' => $exists['id']]);
        }
        return $this->db->insert('school_settings', $clean);
    }

    public function get_custom_fields(): array {
        return $this->db->get('custom_fields')->result_array();
    }
}
