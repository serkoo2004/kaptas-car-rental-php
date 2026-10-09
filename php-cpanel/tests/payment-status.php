<?php

declare(strict_types=1);

require dirname(__DIR__) . '/app/Services/PaymentStatus.php';

use Kaptas\Services\PaymentStatus;

$checks = 0;
function check(bool $value, string $name): void {
    global $checks;
    if (!$value) throw new RuntimeException($name);
    $checks++;
}
$base = ['status' => 'PENDING', 'bankState' => 'CHALLENGE', 'bankEnvironment' => 'test', 'reservationStatus' => 'HOLD'];
$view = static fn (array $changes) => PaymentStatus::present(array_replace($base, $changes));
check($view([])['poll'], 'Challenge waits without confirming');
foreach (['PROCESSING', 'REVIEW'] as $state) {
    check($view(['bankState' => $state, 'status' => 'REVIEW_REQUIRED'])['poll'], $state . ' polls');
}
$paid = $view(['bankState' => 'PAID', 'bankEnvironment' => 'live', 'status' => 'PAID', 'reservationStatus' => 'CONFIRMED']);
check($paid['state'] === 'confirmed' && !$paid['poll'], 'Live verified confirmation stops polling');
$test = $view(['bankState' => 'TEST_PAID', 'status' => 'CANCELLED', 'reservationStatus' => 'CANCELLED']);
check($test['state'] === 'test_paid' && !$test['poll'], 'Test success is not live confirmation');
check($view(['bankState' => 'TEST_PAID', 'bankEnvironment' => 'live'])['state'] !== 'test_paid', 'Test state must be sandbox');
check($view(['bankState' => 'PAID', 'status' => 'PAID', 'reservationStatus' => 'CONFIRMED'])['state'] !== 'confirmed', 'Sandbox cannot confirm');
check($view(['bankState' => 'REVIEW_STOCK', 'status' => 'REVIEW_REQUIRED'])['state'] === 'attention', 'Stock conflict needs attention');
check($view(['bankState' => 'PAID', 'status' => 'PAID', 'bankEnvironment' => 'live', 'reservationStatus' => 'CANCELLED'])['state'] === 'attention', 'Paid cancelled booking is not confirmed');
check($view(['resultCode' => 'CB_MISSING_HASH'])['state'] === 'verification_blocked', 'Callback diagnostic stops indefinite waiting');
check(!str_contains($view(['resultCode' => '<secret>'])['message'], '<secret>'), 'Unrecognized diagnostic never exposed');
check(!str_contains($view(['bankEnvironment' => 'live', 'resultCode' => 'CB_MISSING_HASH'])['message'], 'CB_'), 'Sandbox diagnostics not exposed for live');
check($view(['bankState' => 'FAILED', 'status' => 'FAILED'])['state'] === 'failed', 'Failure stops polling');
check(!PaymentStatus::present(null)['poll'], 'Missing result never polls');
$owner = ['paymentUserId' => 'owner', 'paymentLeadId' => 'lead'];
check(PaymentStatus::owns($owner, ['id' => 'owner'], []), 'Payment owner can read');
check(PaymentStatus::owns($owner, null, ['lead']), 'Checkout session can read');
check(!PaymentStatus::owns($owner, ['id' => 'other', 'role' => 'ADMIN'], []), 'Unrelated admin cannot read by ID');
check(!PaymentStatus::owns([], null, [null]), 'Null ownership cannot grant access');
echo "OK: {$checks} payment status checks; no bank, database or mail access.\n";
