<?php
$servername = "_________";
$db_username = "_________";
$db_password = "________";
$db_name = "__________";


if (!function_exists('sanitizeInput')) {
    function sanitizeInput($data)
    {
        if (is_array($data)) {
            foreach ($data as $key => $value) {
                $data[$key] = sanitizeInput($value);
            }
            return $data;
        }

        $clean = preg_replace('/<[^>]*>/', '', $data ?? '');

        if ($clean !== ($data ?? '')) {
            if (function_exists('jsonResponse')) {
                jsonResponse(['message' => 'Invalid input: HTML tags are not allowed.'], 400);
            } else {
                header('Content-Type: application/json');
                http_response_code(400);
                echo json_encode(['message' => 'Invalid input: HTML tags are not allowed.']);
                exit;
            }
        }

        return htmlspecialchars(trim($data ?? ''), ENT_QUOTES, 'UTF-8');
    }
}

$databaseUrl = getenv('DATABASE_URL');

if ($databaseUrl) {
    $parsed = parse_url($databaseUrl);
    return [
        'host' => $parsed['host'],
        'port' => $parsed['port'] ?? 5432,
        'username' => $parsed['user'],
        'password' => $parsed['pass'],
        'dbname' => ltrim($parsed['path'], '/'),
        'sslmode' => 'require'
    ];
}

return [
    'host' => $servername,
    'port' => 5432,
    'username' => $db_username,
    'password' => $db_password,
    'dbname' => $db_name,
    'sslmode' => 'prefer'
];
