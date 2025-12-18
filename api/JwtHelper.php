<?php
//This file is used to handle the JWT authentication
//It handles all the logic for the JWT authentication

class JwtHelper
{
    private $secret;

    public function __construct()
    {
        $this->secret = getenv('JWT_SECRET');
    }

    public function sign($payload)
    {
        if (function_exists('console_log')) {
            console_log("JWT Sign: payload=" . json_encode($payload));
        }
        $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
        $payload['exp'] = time() + (24 * 60 * 60);

        $base64UrlHeader = $this->base64UrlEncode($header);
        $base64UrlPayload = $this->base64UrlEncode(json_encode($payload));

        $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, $this->secret, true);
        $base64UrlSignature = $this->base64UrlEncode($signature);

        return $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;
    }

    public function verify($token)
    {
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            if (function_exists('console_log'))
                console_log("JWT Verify: Invalid token format");
            return false;
        }


        $header = $parts[0];
        $payload = $parts[1];
        $signature = $parts[2];

        $validSignature = hash_hmac('sha256', $header . "." . $payload, $this->secret, true);
        $base64UrlValidSignature = $this->base64UrlEncode($validSignature);

        if ($base64UrlValidSignature !== $signature) {
            if (function_exists('console_log'))
                console_log("JWT Verify: Invalid signature");
            return false;
        }

        $decodedPayload = json_decode($this->base64UrlDecode($payload), true);

        if (isset($decodedPayload['exp']) && $decodedPayload['exp'] < time()) {
            if (function_exists('console_log'))
                console_log("JWT Verify: Token expired");
            return false;
        }

        if (function_exists('console_log')) {
            console_log("JWT Verify: Success for User " . ($decodedPayload['userId'] ?? 'unknown'));
        }

        return $decodedPayload;
    }

    private function base64UrlEncode($data)
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private function base64UrlDecode($data)
    {
        return base64_decode(str_replace(['-', '_'], ['+', '/'], $data));
    }
}
