import Stripe from "stripe";
import { Request, Response } from "express";
import { RetailerOrder } from "../models/RetailerOrder";
import RetailerOrdersPayment from "../models/RetailerPaymentModal";
import { OrderStatus } from "../models/Order";
import db from "../db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export default async function stripeWebhookHandler(req: Request, res: Response) {
  try {
    const sig = req.headers["stripe-signature"] as string;

    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    console.log("🔥 WEBHOOK RECEIVED:", event.type);

    let orderId: any = null;
    let amount = 0;

    // ---------------------------------------------------------
    // 1️⃣ CHECKOUT SESSION COMPLETED
    // ---------------------------------------------------------
    if (event.type === "checkout.session.completed") {
      const session: any = event.data.object;

      console.log("SESSION METADATA:", session.metadata);

      orderId = session.metadata?.orderId;
      amount = (session.amount_total || 0) / 100;
    }

    // ---------------------------------------------------------
    // 2️⃣ PAYMENT INTENT SUCCEEDED
    // ---------------------------------------------------------
    if (event.type === "payment_intent.succeeded") {
      const pi: any = event.data.object;

      console.log("PAYMENT INTENT METADATA:", pi.metadata);

      orderId = pi.metadata?.orderId;
      amount = (pi.amount_received || 0) / 100;

      // If metadata missing → fetch metadata from charge
      if (!orderId && pi.latest_charge) {
        const charge = await stripe.charges.retrieve(pi.latest_charge);
        if (charge.metadata?.orderId) {
          orderId = charge.metadata.orderId;
        }
      }
    }

    // ---------------------------------------------------------
    // 3️⃣ IF NO ORDER ID → IGNORE
    // ---------------------------------------------------------
    if (!orderId) {
      console.log("❌ No order ID found in metadata.");
      return res.sendStatus(200);
    }

    console.log("✔️ ORDER ID:", orderId);

    // ---------------------------------------------------------
    // 4️⃣ FETCH MAIN ORDER WITH CHILD RELATIONS
    // ---------------------------------------------------------
    const order = await RetailerOrder.findOne({
      where: { id: Number(orderId) },
      relations: ["favourite_order", "Stock_order"],
    });

    if (!order) {
      console.log("❌ ORDER NOT FOUND:", orderId);
      return res.sendStatus(200);
    }

    // ---------------------------------------------------------
    // 5️⃣ SAVE PAYMENT RECORD
    // ---------------------------------------------------------
    const payment = new RetailerOrdersPayment();
    payment.amount = amount;
    payment.order = order;
    await payment.save();

    // ---------------------------------------------------------
    // 6️⃣ UPDATE MAIN ORDER STATUS
    // ---------------------------------------------------------
    order.isApproved = true;            // Approved
    order.status_id = 1;                // Status Completed/Approved
    order.orderStatus = OrderStatus.Pattern;
    order.pattern = new Date();         // First stage completed timestamp
    order.payment_status = "Paid";      // Payment done

    await order.save();

    // ---------------------------------------------------------
    // 7️⃣ UPDATE CHILD TABLES → MOST IMPORTANT
    // ---------------------------------------------------------
    // Fresh Order
    if (order.favourite_order) {
      await db.query(
        `UPDATE retailer_favourites_orders 
         SET is_approved = 1,
             payment_status = 'Paid'
         WHERE id = ?`,
        [order.favourite_order.id]
      );
    }

    // Stock Order
    if (order.Stock_order) {
      await db.query(
        `UPDATE retailer_stock_orders 
         SET is_approved = 1,
             payment_status = 'Paid'
         WHERE id = ?`,
        [order.Stock_order.id]
      );
    }

    console.log("🎉 PAYMENT SUCCESS → ORDER APPROVED & MARKED PAID:", orderId);

    return res.sendStatus(200);
  } catch (err) {
    console.log("❌ WEBHOOK ERROR:", err);
    return res.status(400).send("Webhook Error");
  }
}
