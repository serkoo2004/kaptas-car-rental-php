<?php

declare(strict_types=1);

namespace Kaptas\Services;

use Kaptas\Core\Config;
use RuntimeException;

final class Mailer
{
    private $socket = null;

    public static function configured(): bool
    {
        return Config::get('mail.host', '') !== ''
            && Config::get('mail.user', '') !== ''
            && Config::get('mail.password', '') !== ''
            && Config::get('mail.from_address', '') !== '';
    }

    public static function verification(string $target, string $code): void
    {
        $subject = 'KAPTAS e-posta dogrulama kodu';
        $html = self::template(
            'E-posta adresinizi do&#287;rulay&#305;n',
            'Hesab&#305;n&#305;zdaki e-posta de&#287;i&#351;ikli&#287;ini tamamlamak i&ccedil;in do&#287;rulama kodunuz:',
            $code,
            'Bu kod 10 dakika ge&ccedil;erlidir. Bu i&#351;lemi siz ba&#351;latmad&#305;ysan&#305;z mesaj&#305; dikkate almay&#305;n.'
        );
        (new self())->send($target, $subject, $html);
    }

    public static function passwordReset(string $target, string $code): void
    {
        $subject = 'KAPTAS sifre yenileme kodu';
        $html = self::template(
            '&#350;ifrenizi yenileyin',
            'Yeni &#351;ifrenizi olu&#351;turmak i&ccedil;in kodunuz:',
            $code,
            'Bu kod 10 dakika ge&ccedil;erlidir. Talebi siz olu&#351;turmad&#305;ysan&#305;z herhangi bir i&#351;lem yapmay&#305;n.'
        );
        (new self())->send($target, $subject, $html);
    }

    public function send(string $to, string $subject, string $html, ?string $messageKey = null): void
    {
        if (!self::configured()) {
            throw new RuntimeException('E-posta servisi yapilandirilmamis.');
        }
        if (!filter_var($to, FILTER_VALIDATE_EMAIL) || preg_match('/[\r\n]/', $to . $subject)) {
            throw new RuntimeException('E-posta alicisi veya konu bilgisi gecersiz.');
        }

        $host = (string) Config::get('mail.host');
        $port = (int) Config::get('mail.port', 587);
        $secure = strtolower((string) Config::get('mail.secure', 'tls'));
        $target = ($secure === 'ssl' ? 'ssl://' : 'tcp://') . $host . ':' . $port;
        $this->socket = @stream_socket_client($target, $errorCode, $errorMessage, 15, STREAM_CLIENT_CONNECT);
        if (!is_resource($this->socket)) {
            throw new RuntimeException('SMTP baglantisi kurulamadi: ' . $errorMessage, $errorCode);
        }
        stream_set_timeout($this->socket, 15);

        try {
            $this->expect([220]);
            $this->command('EHLO ' . ($_SERVER['SERVER_NAME'] ?? 'localhost'), [250]);
            if ($secure === 'tls') {
                $this->command('STARTTLS', [220]);
                if (!stream_socket_enable_crypto($this->socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
                    throw new RuntimeException('SMTP TLS baslatilamadi.');
                }
                $this->command('EHLO ' . ($_SERVER['SERVER_NAME'] ?? 'localhost'), [250]);
            }
            $this->command('AUTH LOGIN', [334]);
            $this->command(base64_encode((string) Config::get('mail.user')), [334]);
            $this->command(base64_encode((string) Config::get('mail.password')), [235]);

            $from = (string) Config::get('mail.from_address');
            $this->command('MAIL FROM:<' . $from . '>', [250]);
            $this->command('RCPT TO:<' . $to . '>', [250, 251]);
            $this->command('DATA', [354]);

            $headers = [
                'Date: ' . date(DATE_RFC2822),
                'From: ' . self::encodeHeader((string) Config::get('mail.from_name')) . ' <' . $from . '>',
                'To: <' . $to . '>',
                'Subject: ' . self::encodeHeader($subject),
                'MIME-Version: 1.0',
                'Content-Type: multipart/related; boundary="' . ($boundary = 'related_' . bin2hex(random_bytes(12))) . '"',
                'Message-ID: <' . ($messageKey === null ? bin2hex(random_bytes(12)) : hash('sha256', $messageKey)) . '@' . self::messageDomain() . '>',
            ];
            $body = self::mimeBody($html, $boundary);
            $this->writeAll(implode("\r\n", $headers) . "\r\n\r\n" . $body . "\r\n.\r\n");
            $this->expect([250]);
            // DATA was accepted. A disconnect during QUIT is not a delivery failure.
            try {
                $this->command('QUIT', [221]);
            } catch (\Throwable) {
            }
        } finally {
            if (is_resource($this->socket)) {
                fclose($this->socket);
            }
        }
    }

    private function command(string $command, array $expected): void
    {
        $this->writeAll($command . "\r\n");
        $this->expect($expected);
    }

    private function writeAll(string $payload): void
    {
        $written = 0;
        $length = strlen($payload);
        while ($written < $length) {
            $chunk = fwrite($this->socket, substr($payload, $written));
            if ($chunk === false || $chunk === 0) {
                throw new RuntimeException('SMTP verisi gonderilemedi.');
            }
            $written += $chunk;
        }
    }

    private function expect(array $expected): void
    {
        $response = '';
        do {
            $line = fgets($this->socket, 515);
            if ($line === false) {
                throw new RuntimeException('SMTP sunucusundan yanit alinamadi.');
            }
            $response .= $line;
        } while (isset($line[3]) && $line[3] === '-');

        $code = (int) substr($response, 0, 3);
        if (!in_array($code, $expected, true)) {
            throw new RuntimeException('SMTP islemi reddedildi: ' . trim($response));
        }
    }

    private static function encodeHeader(string $value): string
    {
        return '=?UTF-8?B?' . base64_encode($value) . '?=';
    }

    private static function template(string $title, string $intro, string $code, string $footer): string
    {
        return '<!doctype html><html><body style="margin:0;padding:24px;background:#f4f4f1">'
            . '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td align="center">'
            . '<table role="presentation" width="560" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:560px;background:#ffffff;border:1px solid #e5e5df;border-top:4px solid #ffc81b">'
            . '<tr><td style="padding:28px 36px 18px;text-align:center"><img src="cid:kaptas-logo" width="255" alt="KAPTAS Car Rental" style="display:inline-block;width:255px;max-width:100%;height:auto;border:0"></td></tr>'
            . '<tr><td style="padding:0 36px 32px;font-family:Arial,sans-serif;color:#242424">'
            . '<h1 style="margin:0 0 14px;font-size:24px;line-height:1.3">' . $title . '</h1>'
            . '<p style="margin:0 0 22px;color:#555;font-size:15px;line-height:1.6">' . $intro . '</p>'
            . '<div style="margin:0 0 22px;padding:17px 20px;border:1px solid #ead170;background:#fff9df;text-align:center;font-size:30px;font-weight:700;letter-spacing:8px;color:#202020">' . htmlspecialchars($code, ENT_QUOTES, 'UTF-8') . '</div>'
            . '<p style="margin:0;color:#6a6a6a;font-size:13px;line-height:1.6">' . $footer . '</p>'
            . '</td></tr></table></td></tr></table></body></html>';
    }

    private static function mimeBody(string $html, string $relatedBoundary): string
    {
        $logo = KAPTAS_ROOT . '/public_html/assets/email-logo.png';
        if (!is_file($logo) || !is_readable($logo)) {
            throw new RuntimeException('E-posta logo dosyasi bulunamadi.');
        }
        $alternativeBoundary = 'alternative_' . bin2hex(random_bytes(12));
        $plain = html_entity_decode(strip_tags(preg_replace('#</(?:p|h[1-6]|div|tr)>#i', "\n", $html) ?? $html), ENT_QUOTES, 'UTF-8');
        $parts = [
            '--' . $relatedBoundary,
            'Content-Type: multipart/alternative; boundary="' . $alternativeBoundary . '"',
            '',
            '--' . $alternativeBoundary,
            'Content-Type: text/plain; charset=UTF-8',
            'Content-Transfer-Encoding: base64',
            '',
            self::base64Part(trim($plain)),
            '--' . $alternativeBoundary,
            'Content-Type: text/html; charset=UTF-8',
            'Content-Transfer-Encoding: base64',
            '',
            self::base64Part($html),
            '--' . $alternativeBoundary . '--',
            '--' . $relatedBoundary,
            'Content-Type: image/png; name="email-logo.png"',
            'Content-Transfer-Encoding: base64',
            'Content-ID: <kaptas-logo>',
            'Content-Disposition: inline; filename="email-logo.png"',
            '',
            self::base64Part((string) file_get_contents($logo)),
            '--' . $relatedBoundary . '--',
        ];
        return implode("\r\n", $parts);
    }

    private static function base64Part(string $content): string
    {
        return rtrim(chunk_split(base64_encode($content), 76, "\r\n"), "\r\n");
    }

    private static function messageDomain(): string
    {
        $host = parse_url((string) Config::get('app.url'), PHP_URL_HOST);
        return is_string($host) && preg_match('/^[a-z0-9.-]+$/i', $host) ? $host : 'localhost.local';
    }
}
