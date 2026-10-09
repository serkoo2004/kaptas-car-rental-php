<?php

declare(strict_types=1);

return [
    'app' => [
        'environment' => 'production',
        'url' => 'https://alanadiniz.com',
        'secret' => '',
    ],
    'database' => [
        'host' => 'localhost',
        'port' => 3306,
        'name' => '',
        'user' => '',
        'password' => '',
    ],
    'mail' => [
        'host' => 'smtp.gmail.com',
        'port' => 587,
        'secure' => 'tls',
        'user' => '',
        'password' => '',
        'from_address' => '',
        'from_name' => 'KAPTAS Car Rental',
    ],
    'payment' => [
        'provider' => 'disabled',
        'vakifbank' => [
            'environment' => 'test',
            'live_enabled' => false,
            'merchant_id' => '',
            'terminal_no' => '',
            'password' => '',
        ],
    ],
];
