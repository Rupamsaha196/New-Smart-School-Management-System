<?php
$pdo = new PDO('mysql:host=127.0.0.1;port=3306;dbname=smart_school', 'root', '0');
$books = $pdo->query('SELECT * FROM library_books')->fetchAll(PDO::FETCH_ASSOC);
echo "=== BOOKS (" . count($books) . ") ===\n";
foreach ($books as $b) {
    echo "ID: {$b['id']}, Title: {$b['title']}, Qty: {$b['qty']}, Available: " . ($b['available_qty'] ?? $b['available_copies'] ?? 'null') . "\n";
}

$issues = $pdo->query('SELECT * FROM book_issues')->fetchAll(PDO::FETCH_ASSOC);
echo "=== BOOK ISSUES (" . count($issues) . ") ===\n";
foreach ($issues as $i) {
    echo "ID: {$i['id']}, Book ID: {$i['book_id']}, Student ID: {$i['student_id']}, Student Name: {$i['student_name']}\n";
}
