<?php

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

$filePath = __DIR__ . $_SERVER['REQUEST_URI'];
$served = false;

if (is_file($filePath)) {
    $served = $filePath;
} elseif (is_file(__DIR__ . '/src' . $_SERVER['REQUEST_URI'])) {
    $served = __DIR__ . '/src' . $_SERVER['REQUEST_URI'];
}

if ($served) {

    $ext = pathinfo($served, PATHINFO_EXTENSION);
    $mimeTypes = [
        'css' => 'text/css',
        'js' => 'application/javascript',
        'png' => 'image/png',
        'jpg' => 'image/jpeg',
        'jpeg' => 'image/jpeg',
        'gif' => 'image/gif',
        'html' => 'text/html',
        'svg' => 'image/svg+xml',
    ];

    if (isset($mimeTypes[$ext])) {
        header("Content-Type: " . $mimeTypes[$ext]);
    }
    readfile($served);
    exit;
}


if ($_SERVER['REQUEST_URI'] === '/' || $_SERVER['REQUEST_URI'] === '/index.html' || $_SERVER['REQUEST_URI'] === '/index.php') {
 
    header("Location: /src/homepage/index.html");
    exit;
}


if (file_exists(__DIR__ . '/.env')) {
    $lines = file(__DIR__ . '/.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos($line, '=') !== false && substr($line, 0, 1) !== '#') {
            list($key, $value) = explode('=', $line, 2);
            putenv(trim($key) . '=' . trim($value));
            $_ENV[trim($key)] = trim($value);
        }
    }
}

function jsonResponse($data, $status = 200)
{
    header('Content-Type: application/json');
    http_response_code($status);
    echo json_encode($data);
    exit;
}

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}


$scriptName = dirname($_SERVER['SCRIPT_NAME']);
$requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);


if (strpos($requestUri, $scriptName) === 0) {
    $requestUri = substr($requestUri, strlen($scriptName));
}


if (strpos($requestUri, '/index.php') === 0) {
    $requestUri = substr($requestUri, strlen('/index.php'));
}
if (empty($requestUri) || $requestUri[0] !== '/') {
    $requestUri = '/' . $requestUri;
}

$uri = $requestUri;
$method = $_SERVER['REQUEST_METHOD'];


require_once __DIR__ . '/api/config.php';
require_once __DIR__ . '/api/Database.php';
require_once __DIR__ . '/api/JwtHelper.php';

require_once __DIR__ . '';
if (preg_match('#^/users#', $uri)) {
    require_once __DIR__ . '/api/Controllers/Auth.php';
    handleAuthRequest($method, $uri);
    exit;
}



if (preg_match('#^/profile#', $uri)) {
    require_once __DIR__ . '/api/Controllers/Profile.php';
    handleProfileRequest($method, $uri);
    exit;
}


if (preg_match('#^/reservations#', $uri)) {
    require_once __DIR__ . '/api/Controllers/Reservations.php';
    handleReservationsRequest($method, $uri);
    exit;
}


if (preg_match('#^/menus#', $uri) || (preg_match('#^/restaurants/\d+/menus#', $uri))) {
    require_once __DIR__ . '/api/Controllers/Menus.php';
    handleMenusRequest($method, $uri);
    exit;
}


if (preg_match('#^/restaurants#', $uri) || preg_match('#^/favorites/toggle#', $uri)) {
    require_once __DIR__ . '/api/Controllers/Restaurants.php';
    handleRestaurantsRequest($method, $uri);
    exit;
}


if (preg_match('#^/alfred#', $uri)) {
    require_once __DIR__ . '/api/Controllers/Ai.php';
    handleAiRequest($method, $uri);
    exit;
}


http_response_code(404);
echo "Not Found";
