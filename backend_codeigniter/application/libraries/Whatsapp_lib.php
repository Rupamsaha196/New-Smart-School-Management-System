<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Whatsapp_lib {

    /**
     * Build WhatsApp Click-to-Chat URL
     */
    public function build_chat_url(string $phone_number, string $message): string {
        $clean_phone = preg_replace('/[^0-9]/', '', $phone_number);
        $encoded_msg = rawurlencode($message);
        return "https://wa.me/{$clean_phone}?text={$encoded_msg}";
    }

    /**
     * Get pre-built templates
     */
    public function get_templates(array $params = []): array {
        $student_name = $params['student_name'] ?? 'Student';
        $amount = $params['amount'] ?? '12,500';

        return [
            'fees' => "Dear Parent, this is an official fee reminder from Smart School International. Outstanding Term 1 dues of ₹{$amount} for {$student_name} are pending. You may pay online or at the school accounts desk.",
            'attendance' => "Smart School Attendance Alert: Student {$student_name} was marked Absent today. Please acknowledge this notification.",
            'admit' => "Smart School Notice: CBSE Examination Admit Cards & Schedules have been generated. Kindly download your hall ticket from the student portal.",
            'notice' => "Urgent Advisory: Due to heavy weather conditions, school classes will disperse early at 1:00 PM today. School transport routes are departing accordingly.",
            'support' => "Hello Smart School Support Desk, I would like to inquire about admissions and school facilities for Session 2026-2027.",
        ];
    }
}
