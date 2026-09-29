<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Users extends REST_Controller {

    public function __construct() {
        parent::__construct();
        $this->load->model('User_model', 'user_model');
    }

    public function index(): void {
        $users = $this->user_model->get_users();
        $this->response($users);
    }

    public function roles(): void {
        $roles = $this->user_model->get_roles();
        $this->response($roles);
    }

    public function permissions(): void {
        $modules = [
            'User & Role Management',
            'Admin Dashboard',
            'Student Admission Management',
            '360° Student Profile',
            'Student Search',
            'Student Promotion',
            'Student Categorization',
            'Fees Management',
            'Income & Expense Management',
            'Attendance Management',
            'Examination Management',
            'Academic/Class Management',
            'Class Timetable',
            'Download Center',
            'Library Management',
            'Transport Management',
            'Hostel Management',
            'Notice Board / Communication',
            'WhatsApp Integration',
            'Online Classes / Live Classes',
            'Staff Management',
            'Staff Attendance',
            'Student CV',
            'Transfer Certificate / TC',
            'Admit Card',
            'Annual Calendar',
            'Custom Fields',
            'QR / Barcode Attendance',
            'Two-Factor Login',
            'Behavior Records',
            'Thermal Printing',
            'Quick Fee Creation',
            'Fine Management',
            'Fee Discount Management',
            'Online Payment Processing',
            'Reports',
            'Multi-School Capability',
            'Mobile Application',
            'Front Website / WhatsApp Widget',
            'Academic Session Management',
            'Document Management',
            'Student Sibling Management',
            'RTE Records',
            'School Settings',
            'Technology Stack',
        ];
        $this->response($modules);
    }
}
