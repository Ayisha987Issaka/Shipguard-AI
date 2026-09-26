/**
 * foodnestSnapshot — static, read-only representation of the FoodNest demo
 * project as it exists on disk at inspection time.
 *
 * The specialist agents inspect this snapshot. In a production ShipGuard
 * deployment, this data would be fetched from a backend API that reads the
 * actual project files. For the hackathon demo the snapshot is the ground
 * truth captured directly from the files.
 */

export interface FileSnapshot {
  path: string;
  content: string;
}

export interface ProjectSnapshot {
  name: string;
  version: string;
  files: FileSnapshot[];
  testOutput: TestRunOutput;
}

export interface TestRunOutput {
  passed: number;
  failed: number;
  total: number;
  failures: TestFailure[];
  rawOutput: string;
}

export interface TestFailure {
  testName: string;
  file: string;
  line: number;
  actual: string;
  expected: string;
  message: string;
}

// ─── Snapshot ─────────────────────────────────────────────────────────────────

export const foodnestSnapshot: ProjectSnapshot = {
  name: 'foodnest-demo',
  version: '2.0.0',

  testOutput: {
    passed: 1,
    failed: 1,
    total: 2,
    failures: [
      {
        testName: 'successful payment returns success',
        file: 'tests/payment.test.js',
        line: 5,
        actual: 'false',
        expected: 'true',
        message:
          "AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:\nfalse !== true",
      },
    ],
    rawOutput: `✔ health check contract (7.928ms)
✖ successful payment returns success (4.7425ms)
ℹ tests 2
ℹ pass 1
ℹ fail 1
✖ failing tests:
  AssertionError: Expected values to be strictly equal:
  false !== true
  at tests/payment.test.js:11`,
  },

  files: [
    {
      path: 'package.json',
      content: `{
  "name": "foodnest-demo",
  "version": "2.0.0",
  "private": true,
  "description": "Deliberately imperfect demo application for ShipGuard AI",
  "type": "module",
  "scripts": {
    "start": "node src/server.js",
    "test": "node --test"
  },
  "engines": {
    "node": ">=20"
  },
  "dependencies": {
    "express": "^5.1.0"
  }
}`,
    },
    {
      path: 'Dockerfile',
      content: `FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]`,
    },
    {
      path: 'README.md',
      content: `# FoodNest Demo

FoodNest is a sample food-ordering API used to demonstrate ShipGuard AI.

## Requirements
- Node.js 18+
- npm

## Run
npm install
npm start

## API
GET /health

POST /api/payment

Example payment body:
{
  "amount": 100,
  "email": "customer@example.com"
}

## Deployment
Run the application with Node.js and configure the payment environment variables.`,
    },
    {
      path: '.env.example',
      content: `PORT=3000
NODE_ENV=development
PAYSTACK_PUBLIC_KEY=replace-me
# PAYSTACK_SECRET_KEY is required for payment processing but is missing here.`,
    },
    {
      path: 'src/server.js',
      content: `import express from "express";
import { processPayment } from "./payments.js";

const app = express();
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "foodnest" });
});

app.post("/api/payments", async (req, res) => {
  const result = await processPayment(req.body);
  res.status(result.success ? 200 : 400).json(result);
});

const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => console.log(\`FoodNest running on \${PORT}\`));
}

export default app;`,
    },
    {
      path: 'src/payments.js',
      content: `export async function processPayment(order) {
  // Release issue: the application does not validate the required
  // PAYSTACK_SECRET_KEY before attempting a payment.
  if (!order || !order.amount) {
    return { success: false, message: "Invalid order" };
  }

  // Simulated payment provider response for the hackathon demo.
  return {
    success: false,
    message: "Payment provider unavailable"
  };
}`,
    },
    {
      path: 'tests/health.test.js',
      content: `import test from "node:test";
import assert from "node:assert/strict";

test("health check contract", async () => {
  // Simple contract test used by ShipGuard during the demo.
  assert.equal(typeof process.env.NODE_ENV === "string" || process.env.NODE_ENV === undefined, true);
});`,
    },
    {
      path: 'tests/payment.test.js',
      content: `import test from "node:test";
import assert from "node:assert/strict";
import { processPayment } from "../src/payments.js";

test("successful payment returns success", async () => {
  const result = await processPayment({
    amount: 100,
    email: "customer@example.com"
  });

  assert.equal(result.success, true);
});`,
    },
    {
      path: 'docs/RELEASE_NOTES.md',
      content: `# FoodNest v2.0 Release Notes

Planned release improvements:
- Payment processing
- Order management
- Production deployment

Known release blockers should be resolved before deployment.`,
    },
    {
      path: 'docs/DATABASE_MIGRATION.md',
      content: `# Database Migration

This file is intentionally incomplete for the ShipGuard demo.

The application is expected to use a production database in the next release,
but the migration steps, rollback procedure, and schema version are not documented yet.`,
    },
  ],
};

// ─── File lookup helper ───────────────────────────────────────────────────────

export function getFile(path: string): FileSnapshot | undefined {
  return foodnestSnapshot.files.find((f) => f.path === path);
}
