<?php
// This file handles menu-related API requests
// It processes menu creation, updates, and retrieval operations
// It enforces proper authentication and authorization checks
function handleMenusRequest($method, $uri)
{
    if (function_exists('console_log')) {
        console_log("Handling Menus Request: $method $uri");
    }
    $db = new Database();
    $jwt = new JwtHelper();

    if ($method === 'GET' && preg_match('#^/restaurants/([0-9]+)/menus/?$#', $uri, $matches)) {
        $id = $matches[1];
        if (function_exists('console_log'))
            console_log("Fetching menus for restaurant $id");


        $sql = "SELECT * FROM Vmenus WHERE restaurant_id = ? AND is_active = 1 ORDER BY name ASC";
        $response = $db->rawSelect($sql, [$id]);

        if ($response['status'] >= 400)
            jsonResponse(['message' => 'Server error'], 500);
        jsonResponse($response['data'] ?? []);
    }


    if ($method === 'GET' && preg_match('#^/menus/([0-9]+)/items/?$#', $uri, $matches)) {
        $id = $matches[1];

        $sql = "
            SELECT mi.*, mti.display_order, mti.is_available
            FROM Vmenu_to_item mti
            JOIN Vmenu_items mi ON mti.item_id = mi.id
            WHERE mti.menu_id = ? AND mti.is_available = 1
            ORDER BY mti.display_order ASC
        ";

        $response = $db->rawSelect($sql, [$id]);

        if ($response['status'] >= 400)
            jsonResponse(['message' => 'Server error'], 500);

        jsonResponse($response['data']);
    }

    if ($method === 'POST' && preg_match('#^/menus/([0-9]+)/items/?$#', $uri, $matches)) {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
        $token = str_replace('Bearer ', '', $authHeader);
        if (!$jwt->verify($token))
            jsonResponse(['message' => 'Unauthorized'], 401);

        $menuId = $matches[1];


        $menuRes = $db->select('Vmenus', ['id' => $menuId]);
        if (empty($menuRes['data'])) {
            jsonResponse(['message' => 'Menu not found'], 404);
        }
        $restaurantId = $menuRes['data'][0]['restaurant_id'];

        $input = json_decode(file_get_contents('php://input'), true);

        $name = sanitizeInput($input['name'] ?? null);
        $description = sanitizeInput($input['description'] ?? null);
        $price = $input['price'] ?? null;

        if (!$name || !$price) {
            jsonResponse(['message' => 'Name and price are required'], 400);
        }

        $itemRes = $db->insert('Vmenu_items', [
            'restaurant_id' => $restaurantId,
            'name' => $name,
            'description' => $description,
            'price' => $price,
            'image_url' => $input['image_url'] ?? null
        ]);

        if ($itemRes['status'] >= 400 || empty($itemRes['data'])) {
            jsonResponse(['message' => 'Failed to create item'], 500);
        }

        $newItemId = $itemRes['data'][0]['id'];


        $linkRes = $db->insert('Vmenu_to_item', [
            'menu_id' => $menuId,
            'item_id' => $newItemId,
            'display_order' => 0,
            'is_available' => 1
        ]);

        if ($linkRes['status'] >= 400) {
            jsonResponse(['message' => 'Failed to link item to menu'], 500);
        }

        jsonResponse(['message' => 'Item added', 'id' => $newItemId, 'name' => $name], 201);
    }

    if ($method === 'DELETE' && preg_match('#^/menus/([0-9]+)/items/([0-9]+)/?$#', $uri, $matches)) {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
        $token = str_replace('Bearer ', '', $authHeader);
        if (!$jwt->verify($token))
            jsonResponse(['message' => 'Unauthorized'], 401);

        $menuId = $matches[1];
        $itemId = $matches[2];


        $sql = "UPDATE Vmenu_to_item SET is_available = 0 WHERE menu_id = ? AND item_id = ?";
        $res = $db->rawSelect($sql, [$menuId, $itemId]);


        $res = $db->update('Vmenu_to_item', ['is_available' => 0], ['menu_id' => $menuId, 'item_id' => $itemId]);

        if ($res['status'] >= 400) {
            jsonResponse(['message' => 'Failed to remove item'], 500);
        }

        jsonResponse(['message' => 'Item removed']);
    }


    if ($method === 'GET' && preg_match('#^/menus/([0-9]+)/?$#', $uri, $matches)) {
        $id = $matches[1];
        $response = $db->select('Vmenus', ['id' => $id]);

        if (empty($response['data']))
            jsonResponse(['message' => 'Menu not found'], 404);
        jsonResponse($response['data'][0]);
    }


    if ($method === 'POST' && preg_match('#^/menus/?$#', $uri)) {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
        $token = str_replace('Bearer ', '', $authHeader);
        if (!$jwt->verify($token))
            jsonResponse(['message' => 'Unauthorized'], 401);

        $input = json_decode(file_get_contents('php://input'), true);
        $restaurant_id = $input['restaurant_id'] ?? null;
        $name = sanitizeInput($input['name'] ?? null);
        $description = sanitizeInput($input['description'] ?? null);

        if (!$restaurant_id || !$name) {
            jsonResponse(['message' => 'Restaurant ID and name are required.'], 400);
        }

        $res = $db->insert('Vmenus', [
            'restaurant_id' => $restaurant_id,
            'name' => $name,
            'description' => $description,
            'is_active' => 1
        ]);

        if ($res['status'] >= 400) {
            jsonResponse(['message' => 'Failed to create menu'], 500);
        }

        jsonResponse(['message' => 'Menu created successfully', 'id' => $res['data'][0]['id']], 201);
    }


    if ($method === 'PUT' && preg_match('#^/menus/([0-9]+)/?$#', $uri, $matches)) {

        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
        $token = str_replace('Bearer ', '', $authHeader);
        if (!$jwt->verify($token))
            jsonResponse(['message' => 'Unauthorized'], 401);

        $id = $matches[1];
        $input = json_decode(file_get_contents('php://input'), true);

        $updates = [];
        if (isset($input['name']))
            $updates['name'] = sanitizeInput($input['name']);
        if (isset($input['description']))
            $updates['description'] = sanitizeInput($input['description']);
        if (isset($input['is_active']))
            $updates['is_active'] = $input['is_active'];

        if (empty($updates))
            jsonResponse(['message' => 'No fields to update'], 400);

        $res = $db->update('Vmenus', $updates, ['id' => $id]);

        if ($res['status'] >= 400)
            jsonResponse(['message' => 'Server error updating menu'], 500);
        if (empty($res['data']))
            jsonResponse(['message' => 'Menu not found'], 404);

        jsonResponse(['message' => 'Menu updated successfully', 'menu' => $res['data'][0]]);
    }


    if ($method === 'DELETE' && preg_match('#^/menus/([0-9]+)/?$#', $uri, $matches)) {

        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
        $token = str_replace('Bearer ', '', $authHeader);
        if (!$jwt->verify($token))
            jsonResponse(['message' => 'Unauthorized'], 401);

        $id = $matches[1];


        $res = $db->update('Vmenus', ['is_active' => 0], ['id' => $id]);

        if ($res['status'] >= 400)
            jsonResponse(['message' => 'Server error deleting menu'], 500);
        if (empty($res['data']))
            jsonResponse(['message' => 'Menu not found'], 404);

        jsonResponse(['message' => 'Menu deleted successfully']);
    }


    jsonResponse(['message' => 'Menu route not found', 'uri' => $uri, 'method' => $method], 404);
}
