<?php
require_once __DIR__ . '/env_loader.php';

// SendGrid API key from environment
define('SENDGRID_API_KEY', env('SENDGRID_API_KEY', ''));

// Must match your verified Sender Identity in SendGrid
define('MAIL_FROM_EMAIL', env('MAIL_FROM_EMAIL', ''));
define('MAIL_FROM_NAME', env('MAIL_FROM_NAME', ''));
