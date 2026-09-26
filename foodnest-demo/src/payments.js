export async function processPayment(order) {
  // Release issue: the application does not validate the required
  // PAYSTACK_SECRET_KEY before attempting a payment.
  if (!order || !order.amount) {
    return { success: false, message: "Invalid order" };
  }

  if (!process.env.PAYSTACK_SECRET_KEY) {
    return { success: false, message: "Payment configuration missing: PAYSTACK_SECRET_KEY is not set" };
  }

  // Simulated payment provider response for the hackathon demo.
  return {
    success: true,
    message: "Payment accepted"
  };
}
