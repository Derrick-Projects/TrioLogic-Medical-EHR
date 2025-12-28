<?php
require_once __DIR__ . '/config_mail.php';

function sendEmailSendGrid($toEmail, $toName, $subject, $html, $text = '')
{
    if ($text === '') {
        $textContent = strip_tags($html);
    } else {
        $textContent = $text;
    }

    $payload = array(
        "personalizations" => array(
            array(
                "to" => array(
                    array("email" => $toEmail, "name" => $toName)
                )
            )
        ),
        "from" => array(
            "email" => MAIL_FROM_EMAIL,
            "name"  => MAIL_FROM_NAME
        ),
        "subject" => $subject,
        "content" => array(
            array("type" => "text/plain", "value" => $textContent),
            array("type" => "text/html",  "value" => $html)
        )
    );

    $ch = curl_init("https://api.sendgrid.com/v3/mail/send");
    curl_setopt_array($ch, array(
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => array(
            "Authorization: Bearer " . SENDGRID_API_KEY,
            "Content-Type: application/json"
        ),
        CURLOPT_POSTFIELDS => json_encode($payload),
        CURLOPT_TIMEOUT => 20
    ));

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlErr  = curl_error($ch);
    curl_close($ch);

    if ($curlErr) {
        return array("ok" => false, "code" => 0, "error" => $curlErr, "response" => $response);
    }
    return array("ok" => ($httpCode === 202), "code" => $httpCode, "response" => $response);
}
