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
        $books = $this->ops->get_books();
        $this->response($books);
    }

    public function library_stats(): void {
        $stats = $this->ops->library_stats();
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
        $routes = $this->ops->get_routes();
        $this->response($routes);
    }

    public function hostels(): void {
        if (strtoupper($this->input->method()) === 'POST') {
            $this->store_hostel();
            return;
        }
        $hostels = $this->ops->get_hostels();
        $this->response($hostels);
    }

    public function notices(): void {
        $notices = $this->ops->get_notices();
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
        if (empty($payload['title'])) {
            $this->error('Book title is required', 422);
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
        $this->success(['id' => $id], 'Book issued successfully', 201);
    }

    public function store_route(): void {
        $payload = $this->get_payload();
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
        if (empty($payload['name'])) {
            $this->error('Hostel name is required', 422);
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
