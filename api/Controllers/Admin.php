<?php

function handleAdminRequest($method, $uri)
{
    $db = new Database();
    $jwt = new JwtHelper();

    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    $token = str_replace('Bearer ', '', $authHeader);


    $decoded = $jwt->verify($token);
    if (!$decoded) {
        jsonResponse(['message' => 'Unauthorized'], 401);
    }

    $userId = $decoded['userId'];


    $userRes = $db->select('Vusers', ['id' => $userId]);
    if (empty($userRes['data']) || ($userRes['data'][0]['role'] ?? '') !== 'admin') {
        jsonResponse(['message' => 'Forbidden: Admin access required.'], 403);
    }



    if ($method === 'GET' && preg_match('#^/admin/stats$#', $uri)) {
        $stats = [];

        $users = $db->rawSelect("SELECT COUNT(*) as count FROM Vusers");
        $stats['users'] = $users['data'][0]['count'] ?? 0;

        $reviews = $db->rawSelect("SELECT COUNT(*) as count FROM Vreviews");
        $stats['reviews'] = $reviews['data'][0]['count'] ?? 0;

        $restaurants = $db->rawSelect("SELECT COUNT(*) as count FROM Vrestaurants");
        $stats['restaurants'] = $restaurants['data'][0]['count'] ?? 0;

        jsonResponse($stats);
    }

    if ($method === 'GET' && preg_match('#^/admin/users$#', $uri)) {
        $sql = "SELECT id, name, email, role FROM Vusers ORDER BY id DESC";
        $response = $db->rawSelect($sql);
        jsonResponse($response['data']);
    }


    if ($method === 'DELETE' && preg_match('#^/admin/users/(\d+)$#', $uri, $matches)) {
        $targetId = $matches[1];
        if ($targetId == $userId) {
            jsonResponse(['message' => 'Cannot delete yourself.'], 400);
        }


        $targetRes = $db->select('Vusers', ['id' => $targetId]);
        if (!empty($targetRes['data']) && ($targetRes['data'][0]['role'] === 'admin')) {
            jsonResponse(['message' => 'Forbidden: Cannot delete another admin.'], 403);
        }

        $db->delete('Vusers', ['id' => $targetId]);
        jsonResponse(['message' => 'User deleted successfully.']);
    }




    if ($method === 'GET' && preg_match('#^/admin/all_restaurants$#', $uri)) {
        $sql = "SELECT id, name, owner_id FROM Vrestaurants ORDER BY name ASC";
        $response = $db->rawSelect($sql);
        jsonResponse($response['data']);
    }


    if ($method === 'POST' && preg_match('#^/admin/users/(\d+)/role$#', $uri, $matches)) {
        $targetId = $matches[1];
        $input = json_decode(file_get_contents('php://input'), true);
        $newRole = $input['role'] ?? 'owner';
        $restaurantId = $input['restaurant_id'] ?? null;

        $db->update('Vusers', ['role' => $newRole], ['id' => $targetId]);

        if ($newRole === 'owner' && $restaurantId) {
            $db->update('Vrestaurants', ['owner_id' => $targetId], ['id' => $restaurantId]);
            jsonResponse(['message' => "User promoted to owner and assigned to restaurant."]);

        } elseif ($newRole === 'user' || $newRole === 'customer') {
            $db->update('Vrestaurants', ['owner_id' => null], ['owner_id' => $targetId]);
            if ($newRole === 'user') {
                $db->update('Vusers', ['role' => 'customer'], ['id' => $targetId]);
            }
            jsonResponse(['message' => "User demoted to standard user."]);
        } else {
            jsonResponse(['message' => "User role updated to $newRole."]);
        }
    }


    if ($method === 'GET' && preg_match('#^/admin/reviews$#', $uri)) {
        $sql = "
            SELECT r.id, r.rating, r.comment, r.created_at, u.name as user_name, rest.name as restaurant_name 
            FROM Vreviews r
            JOIN Vusers u ON r.user_id = u.id
            JOIN Vrestaurants rest ON r.restaurant_id = rest.id
            ORDER BY r.created_at DESC
        ";
        $response = $db->rawSelect($sql);
        jsonResponse($response['data']);
    }


    if ($method === 'DELETE' && preg_match('#^/admin/reviews/(\d+)$#', $uri, $matches)) {
        $reviewId = $matches[1];
        $db->delete('Vreviews', ['id' => $reviewId]);
        jsonResponse(['message' => 'Review deleted successfully.']);
    }


    if ($method === 'POST' && preg_match('#^/admin/restaurants$#', $uri)) {
        $input = json_decode(file_get_contents('php://input'), true);

        $required = ['name', 'location', 'cuisine_type', 'owner_id'];
        foreach ($required as $field) {
            if (empty($input[$field])) {
                jsonResponse(['message' => "Field '$field' is required."], 400);
            }
        }

        $ownerCheck = $db->select('Vusers', ['id' => $input['owner_id']]);
        if (empty($ownerCheck['data'])) {
            jsonResponse(['message' => 'Owner ID not found.'], 400);
        }

        $data = [
            'name' => sanitizeInput($input['name']),
            'location' => sanitizeInput($input['location']),
            'cuisine_type' => sanitizeInput($input['cuisine_type']),
            'description' => sanitizeInput($input['description'] ?? ''),
            'image_url' => sanitizeInput($input['image_url'] ?? ''),
            'capacity' => (int) ($input['capacity'] ?? 0),
            'owner_id' => $input['owner_id']
        ];

        $res = $db->insert('Vrestaurants', $data);
        if ($res['status'] >= 400) {
            jsonResponse(['message' => 'Error adding restaurant.'], 500);
        }
        jsonResponse(['message' => 'Restaurant added successfully.', 'id' => $res['data'][0]['id'] ?? null], 201);
    }
}
