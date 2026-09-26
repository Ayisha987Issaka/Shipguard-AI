import test from "node:test";
import assert from "node:assert/strict";
import { processPayment } from "../src/payments.js";

test("successful payment returns success", async () => {
  // Set a non-production placeholder key so the PAYSTACK_SECRET_KEY guard
  // in processPayment() does not reject this call. This value is never
  // transmitted — processPayment() is a stub with no network calls.
  process.env.PAYSTACK_SECRET_KEY = "test-key";
  try {
    const result = await processPayment({
      amount: 100,
      email: "customer@example.com"
    });

    assert.equal(result.success, true);
  } finally {
    // Clean up so subsequent tests are not affected by this env var.
    delete process.env.PAYSTACK_SECRET_KEY;
  }
});
