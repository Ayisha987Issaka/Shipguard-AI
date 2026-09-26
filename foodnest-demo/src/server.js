import express from "express";
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
  app.listen(PORT, () => console.log(`FoodNest running on ${PORT}`));
}

export default app;
