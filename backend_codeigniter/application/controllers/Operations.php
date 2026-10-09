<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Operations extends REST_Controller {

    public function __construct() {
        parent::__construct();
        $this->load->model('Operations_model', 'ops');
    }

    public function library_books(): void {
        $method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
        if ($method === 'POST') {
            $this->store_book();
            return;
        }
        $campus = $this->get_active_campus();
        $books = $this->ops->get_books($campus);
        $this->response($books);
    }

    public function library_stats(): void {
        $campus = $this->get_active_campus();
        $stats = $this->ops->library_stats($campus);
        $this->response($stats);
    }

    public function book_issues(): void {
        $issues = $this->ops->get_book_issues();
        $this->response($issues);
    }

    public function return_book(): void {
        $payload = $this->get_payload();
        $issue_id = (int)(!empty($payload['issue_id']) ? $payload['issue_id'] : ($this->input->post('issue_id') ?: 0));
        if ($issue_id <= 0) {
            $this->error('Valid Issue ID is required', 422);
            return;
        }
        $res = $this->ops->return_book($issue_id);
        if ($res) {
            $this->success(null, 'Book marked as returned and inventory updated');
        } else {
            $this->error('Book issue record not found', 404);
        }
    }

    public function transport_routes(): void {
        if (strtoupper($this->input->method()) === 'POST') {
            $this->store_route();
            return;
        }
        $campus = $this->get_active_campus();
        $routes = $this->ops->get_routes($campus);
        $this->response($routes);
    }

    public function hostels(): void {
        if (strtoupper($this->input->method()) === 'POST') {
            $this->store_hostel();
            return;
        }
        $campus = $this->get_active_campus();
        $hostels = $this->ops->get_hostels($campus);
        $this->response($hostels);
    }

    public function notices(): void {
        $campus = $this->get_active_campus();
        $notices = $this->ops->get_notices($campus);
        $this->response($notices);
    }

    public function store_notice(): void {
        $payload = $this->input->post();
        if (empty($payload['title'])) {
            $this->error('Notice title is required', 422);
            return;
        }
        $id = $this->ops->create_notice($payload);
        $this->success(['id' => $id], 'Notice published successfully', 201);
    }

    public function store_book(): void {
        $payload = $this->get_payload();
        $title = trim($payload['title'] ?? '');
        if (empty($title)) {
            $this->error('Book title is required and cannot be empty.', 422);
            return;
        }

        // Boundary Validation
        $qty = intval($payload['qty'] ?? 1);
        if ($qty <= 0) {
            $this->error('Book quantity must be at least 1.', 422);
            return;
        }
        if ($qty > 10000) {
            $this->error('Book quantity exceeds maximum catalog limit (10,000).', 422);
            return;
        }

        // Duplicate Check 1: ISBN
        if (!empty($payload['isbn'])) {
            $isbn = trim($payload['isbn']);
            $existing_isbn = $this->db->where('isbn', $isbn)->get('library_books')->row_array();
            if ($existing_isbn) {
                $this->error("Duplicate entry: A book with ISBN '{$isbn}' already exists in catalog.", 409);
                return;
            }
        }

        // Duplicate Check 2: Title and Author
        $author = trim($payload['author'] ?? '');
        $this->db->where('LOWER(title)', strtolower($title));
        if (!empty($author)) {
            $this->db->where('LOWER(author)', strtolower($author));
        }
        $existing_book = $this->db->get('library_books')->row_array();
        if ($existing_book) {
            $this->error("Duplicate entry: Book '{$title}'" . (!empty($author) ? " by '{$author}'" : "") . " already exists in the catalog.", 409);
            return;
        }

        $id = $this->ops->create_book($payload);
        $this->success(['id' => $id], 'Book added to catalog', 201);
    }

    public function issue_book(): void {
        $payload = $this->get_payload();
        if (empty($payload['book_id'])) {
            $this->error('Book ID is required', 422);
            return;
        }
        $id = $this->ops->issue_book($payload);
        if (!$id) {
            $this->error('Cannot issue book: Book not found or 0 available copies remain in inventory.', 422);
            return;
        }
        $this->success(['id' => $id], 'Book issued successfully', 201);
    }

    public function store_route(): void {
        $payload = $this->get_payload();
        $routeName = trim($payload['route_name'] ?? ($payload['route_title'] ?? ($payload['title'] ?? '')));
        $vehicleNo = trim($payload['vehicle_no'] ?? '');
        $fare = floatval($payload['fare'] ?? 2000);

        if (empty($routeName)) {
            $this->error('Route name is required and cannot be empty.', 422);
            return;
        }

        // Boundary check on fare
        if ($fare < 0 || $fare > 100000) {
            $this->error('Transport fare must be between ₹0 and ₹1,00,000.', 422);
            return;
        }

        // Duplicate Check 1: Route Name
        $existing_route = $this->db->where('LOWER(route_name)', strtolower($routeName))->get('transport_routes')->row_array();
        if ($existing_route) {
            $this->error("Duplicate entry: Transport route '{$routeName}' already exists.", 409);
            return;
        }

        // Duplicate Check 2: Vehicle Number
        if (!empty($vehicleNo)) {
            $existing_veh = $this->db->where('LOWER(vehicle_no)', strtolower($vehicleNo))->get('transport_routes')->row_array();
            if ($existing_veh) {
                $this->error("Duplicate entry: Vehicle '{$vehicleNo}' is already assigned to '{$existing_veh['route_name']}'.", 409);
                return;
            }
        }

        $id = $this->ops->create_route($payload);
        $this->success(['id' => $id], 'Transport route added', 201);
    }

    public function update_route(int $id): void {
        $payload = $this->get_payload();
        $this->ops->update_route($id, $payload);
        $this->success(null, 'Transport route updated');
    }

    public function destroy_route(int $id): void {
        $this->ops->delete_route($id);
        $this->success(null, 'Transport route removed');
    }

    public function store_hostel(): void {
        $payload = $this->get_payload();
        $name = trim($payload['name'] ?? ($payload['hostel_name'] ?? ''));
        $capacity = intval($payload['capacity'] ?? ($payload['intake'] ?? 50));

        if (empty($name)) {
            $this->error('Hostel name is required and cannot be empty.', 422);
            return;
        }

        // Boundary check on bed capacity
        if ($capacity <= 0 || $capacity > 5000) {
            $this->error('Hostel capacity must be between 1 and 5,000 beds.', 422);
            return;
        }

        $existing = $this->db->where('LOWER(name)', strtolower($name))->get('hostels')->row_array();
        if ($existing) {
            $this->error("Duplicate entry: Hostel block '{$name}' already exists.", 409);
            return;
        }

        $id = $this->ops->create_hostel($payload);
        $this->success(['id' => $id], 'Hostel block registered', 201);
    }

    public function allocate_hostel(): void {
        $payload = $this->get_payload();
        if (empty($payload['student_id']) || empty($payload['hostel_id'])) {
            $this->error('Student ID and Hostel ID are required for allocation', 422);
            return;
        }

        $student_id = (int)$payload['student_id'];
        $existing = $this->db->where('student_id', $student_id)
                             ->where("(leave_date IS NULL OR leave_date >= '" . date('Y-m-d') . "')", null, false)
                             ->get('student_hostels')->row_array();
        if ($existing) {
            $this->error("Duplicate allocation: Student is already actively assigned to a hostel room.", 409);
            return;
        }

        $id = $this->ops->allocate_student($payload);
        $this->success(['id' => $id], 'Student allocated to hostel block successfully', 201);
    }

    public function hostel_allocations(): void {
        $allocations = $this->ops->get_student_allocations();
        $this->response($allocations);
    }

    public function vacate_hostel(int $id): void {
        $this->ops->vacate_student($id);
        $this->success(null, 'Student vacated / allocation removed');
    }

    public function calendar_events(): void {
        if ($this->input->method() === 'post') {
            $this->store_calendar_event();
            return;
        }
        $events = $this->ops->get_calendar_events();
        $this->response($events);
    }

    public function store_calendar_event(): void {
        $payload = $this->input->post();
        if (empty($payload['title'])) {
            $this->error('Event title is required', 422);
            return;
        }
        $id = $this->ops->create_calendar_event($payload);
        $this->success(['id' => $id], 'Calendar event published successfully', 201);
    }

    public function destroy_calendar_event(int $id): void {
        $this->ops->delete_calendar_event($id);
        $this->success(null, 'Calendar event removed');
    }
}
