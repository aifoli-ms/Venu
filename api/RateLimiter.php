<?php

class RateLimiter
{
    private $db;

    public function __construct()
    {
        $this->db = new Database();
    }


    public function isBlocked($ip, $endpoint, $limit, $windowSeconds)
    {
        $result = $this->db->select('Vrate_limits', [
            'ip_address' => $ip,
            'endpoint' => $endpoint
        ]);

        if (empty($result['data'])) {
            return false;
        }

        $record = $result['data'][0];
        $currentTime = time();
        $elapsed = $currentTime - $record['window_start'];

        if ($elapsed > $windowSeconds) {

            return false;
        }

        if ($record['requests'] >= $limit) {
            return true;
        }

        return false;
    }


    public function increment($ip, $endpoint, $windowSeconds = 900)
    {
        $currentTime = time();

        $result = $this->db->select('Vrate_limits', [
            'ip_address' => $ip,
            'endpoint' => $endpoint
        ]);

        if (empty($result['data'])) {
            $this->db->insert('Vrate_limits', [
                'ip_address' => $ip,
                'endpoint' => $endpoint,
                'requests' => 1,
                'window_start' => $currentTime
            ]);
            return;
        }

        $record = $result['data'][0];
        $elapsed = $currentTime - $record['window_start'];

        if ($elapsed > $windowSeconds) {

            $this->db->update('Vrate_limits', [
                'requests' => 1,
                'window_start' => $currentTime
            ], ['id' => $record['id']]);
        } else {

            $newCount = $record['requests'] + 1;
            if (function_exists('console_log'))
                console_log("Rate limit incremented for IP $ip at $endpoint. Count: $newCount");
            $this->db->query("UPDATE Vrate_limits SET requests = requests + 1 WHERE id = ?", [$record['id']]);
        }
    }


    public function clear($ip, $endpoint)
    {
        $this->db->delete('Vrate_limits', [
            'ip_address' => $ip,
            'endpoint' => $endpoint
        ]);
    }
}
