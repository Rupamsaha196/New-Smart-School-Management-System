<?php
$pdo = new PDO('mysql:host=127.0.0.1;port=3306;dbname=smart_school', 'root', '0');
$stmt = $pdo->query('DESCRIBE book_issues');
echo "Columns of book_issues table:\n";
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    echo " - {$row['Field']} ({$row['Type']}) " . ($row['Null'] === 'NO' ? 'NOT NULL' : 'NULL') . "\n";
}
