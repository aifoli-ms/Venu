<?php
// This file handles restaurant-related API requests
// It manages restaurant listings, details, reviews, and user favorites
// It enforces ownership checks for updates and authentications for interactions

function handleRestaurantsRequest($method, $uri)
{
    if (function_exists('console_log')) {
        console_log("Handling Restaurants Request: $method $uri");
    }
    $db = new Database();
    $jwt = new JwtHelper();


    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    $token = str_replace('Bearer ', '', $authHeader);
    $user = $jwt->verify($token);
    $userId = $user ? $user['userId'] : null;


    if ($method === 'GET' && preg_match('#^/restaurants$#', $uri)) {
        $filter = $_GET['filter'] ?? null;

        if ($filter === 'favorites') {
            if (!$userId) {
                jsonResponse(['message' => 'Must be logged in to view favorites.'], 403);
            }


            $sql = "
                SELECT r.*, 1 as is_favorite, 
                       COUNT(rv.id) as total_reviews, 
                       ROUND(IFNULL(AVG(rv.rating), 0), 1) as average_rating
                FROM Vrestaurants r
                JOIN Vfavorites f ON r.id = f.restaurant_id
                LEFT JOIN Vreviews rv ON r.id = rv.restaurant_id
                WHERE f.user_id = ?
                GROUP BY r.id
            ";
            $response = $db->rawSelect($sql, [$userId]);


            $restaurants = $response['data'] ?? [];
            foreach ($restaurants as &$r) {
                $r['is_favorite'] = true;
            }
            jsonResponse($restaurants);

        } else {

            $sql = "
                SELECT r.*, 
                       COUNT(rv.id) as total_reviews, 
                       ROUND(IFNULL(AVG(rv.rating), 0), 1) as average_rating
                FROM Vrestaurants r
                LEFT JOIN Vreviews rv ON r.id = rv.restaurant_id
                GROUP BY r.id
            ";
            $response = $db->rawSelect($sql);
            $restaurants = $response['data'] ?? [];


            if ($userId) {
                $favResponse = $db->select('Vfavorites', ['user_id' => $userId], 'restaurant_id');
                $favIds = array_column($favResponse['data'] ?? [], 'restaurant_id');

                foreach ($restaurants as &$r) {
                    $r['is_favorite'] = in_array($r['id'], $favIds);
                }
            } else {
                foreach ($restaurants as &$r) {
                    $r['is_favorite'] = false;
                }
            }

            jsonResponse($restaurants);
        }
    }


    if ($method === 'GET' && preg_match('#^/restaurants/([0-9]+)$#', $uri, $matches)) {
        $id = $matches[1];
        $response = $db->select('Vrestaurants', ['id' => $id]);

        if (empty($response['data'])) {
            jsonResponse(['message' => 'Restaurant not found'], 404);
        }
        jsonResponse($response['data'][0]);
    }


    if ($method === 'GET' && preg_match('#^/restaurants/([0-9]+)/reviews$#', $uri, $matches)) {
        $id = $matches[1];


        $sql = "
            SELECT rv.*, u.name 
            FROM Vreviews rv
            LEFT JOIN Vusers u ON rv.user_id = u.id
            WHERE rv.restaurant_id = ?
            ORDER BY rv.created_at DESC
        ";

        $response = $db->rawSelect($sql, [$id]);


        $formatted = [];
        foreach ($response['data'] as $row) {
            $r = $row;
            $r['users'] = ['name' => $row['name']];
            unset($r['name']);
            $formatted[] = $r;
        }

        jsonResponse($formatted);
    }


    if ($method === 'POST' && preg_match('#^/restaurants/([0-9]+)/reviews$#', $uri, $matches)) {
        if (!$userId)
            jsonResponse(['message' => 'Unauthorized'], 401);

        $id = $matches[1];
        $input = json_decode(file_get_contents('php://input'), true);
        $rating = $input['rating'] ?? null;
        $comment = sanitizeInput($input['comment'] ?? null);

        if (!$rating || !$comment) {
            jsonResponse(['message' => 'Rating and comment are required.'], 400);
        }

        $res = $db->insert('Vreviews', [
            'restaurant_id' => $id,
            'user_id' => $userId,
            'rating' => (int) $rating,
            'comment' => $comment
        ]);

        if ($res['status'] >= 400) {
            jsonResponse(['message' => 'Server error adding review'], 500);
        }

        jsonResponse(['message' => 'Review added successfully', 'review' => $res['data'][0] ?? null], 201);
    }

    if ($method === 'POST' && preg_match('#^/favorites/toggle$#', $uri)) {
        if (!$userId)
            jsonResponse(['message' => 'Unauthorized'], 401);

        $input = json_decode(file_get_contents('php://input'), true);
        $restaurant_id = $input['restaurant_id'] ?? null;

        if (!$restaurant_id) {
            jsonResponse(['message' => 'Restaurant ID is required.'], 400);
        }


        $check = $db->select('Vfavorites', ['user_id' => $userId, 'restaurant_id' => $restaurant_id]);

        if (!empty($check['data'])) {

            $del = $db->delete('Vfavorites', ['user_id' => $userId, 'restaurant_id' => $restaurant_id]);
            if ($del['status'] >= 400)
                jsonResponse(['message' => 'Error unfavoriting'], 500);
            jsonResponse(['message' => 'Unfavorited successfully.', 'is_favorite' => false]);
        } else {

            $ins = $db->insert('Vfavorites', ['user_id' => $userId, 'restaurant_id' => $restaurant_id]);
            if ($ins['status'] >= 400)
                jsonResponse(['message' => 'Error favoriting'], 500);
            jsonResponse(['message' => 'Favorited successfully.', 'is_favorite' => true], 201);
        }
    }
    if ($method === 'PATCH' && preg_match('#^/restaurants/([0-9]+)$#', $uri, $matches)) {
        if (!$userId) {
            jsonResponse(['message' => 'Unauthorized'], 401);
        }

        $id = $matches[1];
        $input = json_decode(file_get_contents('php://input'), true);


        $resCheck = $db->select('Vrestaurants', ['id' => $id]);
        if (empty($resCheck['data'])) {
            jsonResponse(['message' => 'Restaurant not found'], 404);
        }
        $restaurant = $resCheck['data'][0];

        if ((int) $restaurant['owner_id'] !== (int) $userId) {
            jsonResponse(['message' => 'Forbidden: You do not own this restaurant.'], 403);
        }


        $permittedFields = ['name', 'location', 'capacity', 'cuisine_type', 'description', 'image_url'];
        $updates = [];

        foreach ($permittedFields as $field) {
            if (isset($input[$field])) {
                $updates[$field] = sanitizeInput($input[$field]);
            }
        }

        if (empty($updates)) {
            jsonResponse(['message' => 'No fields to update.'], 400);
        }


        $res = $db->update('Vrestaurants', $updates, ['id' => $id]);

        if ($res['status'] >= 400) {
            jsonResponse(['message' => 'Failed to update restaurant.'], 500);
        }

        jsonResponse(['message' => 'Restaurant updated successfully.', 'data' => $updates]);
    }
}
