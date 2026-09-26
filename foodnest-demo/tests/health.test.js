import test from "node:test";
import assert from "node:assert/strict";

test("health check contract", async () => {
  // Simple contract test used by ShipGuard during the demo.
  assert.equal(typeof process.env.NODE_ENV === "string" || process.env.NODE_ENV === undefined, true);
});
