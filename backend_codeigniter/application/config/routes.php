<?php
defined('BASEPATH') OR exit('No direct script access allowed');

/**
 * Smart School CodeIgniter 3.x / 4 Route Mappings
 * Infosof Technologies 2026
 * Maps all 45 modules to their corresponding REST controllers.
 */

$route['default_controller'] = 'dashboard';
$route['404_override'] = '';
$route['translate_uri_dashes'] = FALSE;

// ── Auth & Two-Factor ────────────────────────────────────────────────
$route['api/login']                     = 'auth/login';
$route['api/auth/google']               = 'auth/google_login';
$route['api/logout']                    = 'auth/logout';
$route['api/me']                        = 'auth/me';
$route['api/two-factor/verify']         = 'auth/verify_2fa';
$route['api/two-factor/google-oauth']   = 'auth/verify_google_2fa';
$route['api/two-factor/status']         = 'settings/two_factor_status';
$route['api/two-factor/enable']         = 'settings/two_factor_enable';
$route['api/two-factor/disable']        = 'settings/two_factor_disable';
$route['api/two-factor/link-google']    = 'settings/two_factor_link_google';

// ── Dashboard ────────────────────────────────────────────────────────
$route['api/dashboard'] = 'dashboard/index';

// ── Users & Roles ────────────────────────────────────────────────────
$route['api/users']       = 'users/index';
$route['api/roles']       = 'users/roles';
$route['api/permissions'] = 'users/permissions';

// ── Students & 360 Profile ───────────────────────────────────────────
$route['api/students']                      = 'students/index';
$route['api/students/(:num)']               = 'students/show/$1';
$route['api/students/update/(:num)']        = 'students/update/$1';
$route['api/students/delete/(:num)']        = 'students/destroy/$1';
$route['api/students/(:num)/tc']            = 'students/tc/$1';
$route['api/students/(:num)/cv']            = 'students/cv/$1';
$route['api/students/(:num)/notes']         = 'students/add_note/$1';
$route['api/students/(:num)/siblings']      = 'students/add_sibling/$1';

// ── Fees & Finance ───────────────────────────────────────────────────
$route['api/fees']                          = 'fees/index';
$route['api/fees/summary']                  = 'fees/summary';
$route['api/fees/defaulters']               = 'fees/defaulters';
$route['api/fees/quick-create']             = 'fees/quick_create';
$route['api/fees/(:num)/thermal-receipt']   = 'fees/thermal_receipt/$1';
$route['api/fees/online-checkout']          = 'fees/online_checkout';
$route['api/fee-types']                     = 'fees/types';
$route['api/fee-discounts']                 = 'fees/discounts';
$route['api/transactions']                  = 'finance/transactions';
$route['api/transactions/store']            = 'finance/store_transaction';

// ── Razorpay Payment Gateway ──────────────────────────────────────────
$route['api/razorpay/create-order']         = 'razorpay/create_order';
$route['api/razorpay/order']                = 'razorpay/create_order';
$route['api/razorpay/verify']               = 'razorpay/verify';
$route['api/razorpay/config']               = 'razorpay/config_key';
$route['api/razorpay/status']               = 'razorpay/config_key';
$route['api/razorpay/save-keys']            = 'razorpay/save_config';
$route['api/razorpay/test-connection']      = 'razorpay/test_connection';

// ── Attendance & QR Attendance ───────────────────────────────────────
$route['api/attendance']                    = 'attendance/index';
$route['api/attendance/bulk']               = 'attendance/bulk';
$route['api/attendance/daily-stats']        = 'attendance/daily_stats';
$route['api/attendance/report']             = 'attendance/report';
$route['api/attendance/qr-scan']            = 'attendance/qr_scan';
$route['api/qr-attendance']                 = 'attendance/qr_logs';
$route['api/qr-attendance/scan']            = 'attendance/qr_scan';
$route['api/qr-attendance/today-stats']     = 'attendance/qr_stats';

// ── Examinations ─────────────────────────────────────────────────────
$route['api/exams']                         = 'exams/index';
$route['api/exams/store']                   = 'exams/store';
$route['api/exams/create']                  = 'exams/store';
$route['api/exams/(:num)/schedules']        = 'exams/schedules/$1';
$route['api/exams/(:num)/marks']            = 'exams/marks/$1';
$route['api/exams/(:num)/marks/bulk']       = 'exams/bulk_marks/$1';
$route['api/exams/(:num)/admit-card']       = 'exams/admit_card/$1';

// ── Academics ────────────────────────────────────────────────────────
$route['api/academics/classes']             = 'academics/classes';
$route['api/academics/classes/(:num)']      = 'academics/destroy_class/$1';
$route['api/classes']                       = 'academics/classes';
$route['api/classes/(:num)']                = 'academics/destroy_class/$1';
$route['api/academics/subjects']            = 'academics/subjects';
$route['api/academics/subjects/(:num)']     = 'academics/destroy_subject/$1';
$route['api/subjects']                      = 'academics/subjects';
$route['api/subjects/(:num)']               = 'academics/destroy_subject/$1';
$route['api/academics/promote']             = 'academics/promote';
$route['api/timetable']                     = 'academics/timetable';
$route['api/timetable/(:num)']              = 'academics/destroy_timetable/$1';
$route['api/sessions']                      = 'academics/sessions';
$route['api/sessions/(:num)/activate']      = 'academics/activate_session/$1';
$route['api/downloads']                     = 'academics/downloads';
$route['api/downloads/(:num)']              = 'academics/destroy_download/$1';
$route['api/live-classes']                  = 'academics/live_classes';
$route['api/live-classes/(:num)']           = 'academics/destroy_live_class/$1';

// ── Staff ────────────────────────────────────────────────────────────
$route['api/staff']                         = 'staff/index';
$route['api/staff/attendance']              = 'staff/attendance';
$route['api/staff/attendance/bulk']         = 'staff/bulk_attendance';

// ── Operations ───────────────────────────────────────────────────────
$route['api/library/books']                 = 'operations/library_books';
$route['api/library/books/store']           = 'operations/store_book';
$route['api/library/stats']                 = 'operations/library_stats';
$route['api/library/issue']                 = 'operations/issue_book';
$route['api/library/issues']                = 'operations/book_issues';
$route['api/library/return']                = 'operations/return_book';
$route['api/transport/routes']              = 'operations/transport_routes';
$route['api/transport/routes/store']        = 'operations/store_route';
$route['api/transport/routes/update/(:num)'] = 'operations/update_route/$1';
$route['api/transport/routes/(:num)']       = 'operations/destroy_route/$1';
$route['api/hostels']                       = 'operations/hostels';
$route['api/hostels/store']                 = 'operations/store_hostel';
$route['api/hostels/allocate']              = 'operations/allocate_hostel';
$route['api/hostels/allocations']           = 'operations/hostel_allocations';
$route['api/hostels/allocations/(:num)']    = 'operations/vacate_hostel/$1';
$route['api/notices']                       = 'operations/notices';
$route['api/notices/store']                 = 'operations/store_notice';
$route['api/calendar-events']               = 'operations/calendar_events';
$route['api/calendar-events/(:num)']        = 'operations/destroy_calendar_event/$1';

// ── Reports ──────────────────────────────────────────────────────────
$route['api/reports']                       = 'reports/index';

// ── Settings ─────────────────────────────────────────────────────────
$route['api/settings']                      = 'settings/index';
$route['api/settings/update']               = 'settings/update';
$route['api/settings/add-campus']           = 'settings/add_campus';
$route['api/custom-fields']                 = 'settings/custom_fields';

// ── Front Website ────────────────────────────────────────────────────
$route['api/website/inquiry']               = 'website/inquiry';
$route['api/website/info']                  = 'website/info';
