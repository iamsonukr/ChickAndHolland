// import { Router, Request, Response, raw } from "express";
// import asyncHandler from "../middleware/AsyncHandler";
// import stripe from "../lib/stripe";
// import { RetailerOrder } from "../models/RetailerOrder";
// import RetailerOrdersPayment from "../models/RetailerPaymentModal";

// const router = Router();

// // ✅ Single source of truth for currency
// const CURRENCY = "eur";

// // ✅ Named constant instead of magic number
// const ORDER_STATUS_PENDING = 0;

// // ✅ Shared helper to avoid duplicate payment logic
// async function markOrderAsPaid(
//   orderId: string,
//   amount: number
// ): Promise<void> {
//   const order = await RetailerOrder.findOne({
//     where: { id: Number(orderId) },
//   });

//   if (!order || order.payment_status === "PAID") return;

//   await RetailerOrdersPayment.create({
//     order,
//     amount,
//     paymentMethod: "Stripe",
//   }).save();

//   order.payment_status = "PAID";
//   // ℹ️ paymentMode not in model — tracked via paymentMethod in RetailerOrdersPayment record
//   order.isApproved = false; // still pending admin approval
//   await order.save();

//   console.log(`✅ Order ${order.id} marked as PAID`);
// }

// /**
//  * ======================================
//  * 1️⃣ CREATE PAYMENT INTENT (PAY NOW)
//  * ======================================
//  */
// router.post(
//   "/create-intent/:orderId",
//   asyncHandler(async (req: Request, res: Response) => {
//     const { orderId } = req.params;

//     const order = await RetailerOrder.findOne({
//       where: { id: Number(orderId), status: ORDER_STATUS_PENDING },
//     });

//     if (!order) {
//       return res.status(404).json({
//         success: false,
//         message: "Order not found",
//       });
//     }

//     const paymentIntent = await stripe.paymentIntents.create({
//       amount: Math.round(order.purchaseAmount * 100), // in cents
//       currency: CURRENCY, // ✅ consistent currency
//       metadata: {
//         orderId: order.id.toString(),
//       },
//       automatic_payment_methods: {
//         enabled: true,
//       },
//     });

//     return res.json({
//       success: true,
//       clientSecret: paymentIntent.client_secret,
//     });
//   })
// );

// /**
//  * ======================================
//  * 2️⃣ STRIPE WEBHOOK (FINAL AUTHORITY)
//  * ======================================
//  */
// router.post(
//   "/webhook",
//   raw({ type: "application/json" }),
//   async (req: Request, res: Response) => {
//     const sig = req.headers["stripe-signature"] as string;

//     let event;

//     try {
//       event = stripe.webhooks.constructEvent(
//         req.body,
//         sig,
//         process.env.STRIPE_WEBHOOK_SECRET!
//       );
//     } catch (err: any) {
//       console.error("❌ Stripe Webhook Error:", err.message);
//       return res.status(400).send(`Webhook Error: ${err.message}`);
//     }

//     try {
//       if (event.type === "checkout.session.completed") {
//         const session = event.data.object as any;
//         const orderId = session.metadata?.orderId;

//         if (!orderId) return res.json({ received: true });

//         // ✅ Use shared helper — no duplicate logic
//         await markOrderAsPaid(orderId, session.amount_total / 100);
//       }

//       // ✅ payment_intent.succeeded only runs if metadata has orderId
//       // (i.e. created via /create-intent, not /checkout — avoids double-processing)
//       if (event.type === "payment_intent.succeeded") {
//         const intent = event.data.object as any;
//         const orderId = intent.metadata?.orderId;

//         if (orderId) {
//           await markOrderAsPaid(orderId, intent.amount / 100);
//         }
//       }

//       if (event.type === "payment_intent.payment_failed") {
//         console.error("❌ Stripe payment failed:", event.data.object);
//       }

//       res.json({ received: true });
//     } catch (error) {
//       console.error("❌ Webhook processing error:", error);
//       res.status(500).json({ received: true });
//     }
//   }
// );

// /**
//  * ======================================
//  * 3️⃣ CHECKOUT SESSION
//  * ======================================
//  */
// router.post(
//   "/checkout",
//   asyncHandler(async (req: Request, res: Response) => {
//     const { orderId } = req.body;

//     if (!orderId) {
//       return res.status(400).json({
//         success: false,
//         msg: "orderId is required",
//       });
//     }

//     // ✅ Consistent status filter with /create-intent
//     const order = await RetailerOrder.findOne({
//       where: { id: Number(orderId), status: ORDER_STATUS_PENDING },
//     });

//     if (!order) {
//       return res.status(404).json({
//         success: false,
//         msg: "Order not found",
//       });
//     }

//     const session = await stripe.checkout.sessions.create({
//       payment_method_types: ["card"],
//       mode: "payment",
//       line_items: [
//         {
//           price_data: {
//             currency: CURRENCY, // ✅ consistent currency
//             product_data: {
//               name: `Order #${order.purchaeOrderNo}`,
//             },
//             unit_amount: Math.round(order.purchaseAmount * 100),
//           },
//           quantity: 1,
//         },
//       ],
//       success_url: `${process.env.CLIENT_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
//       cancel_url: `${process.env.CLIENT_URL}/payment/cancel`,
//       metadata: {
//         orderId: order.id.toString(),
//       },
//     });

//     return res.json({
//       success: true,
//       url: session.url,
//     });
//   })
// );

// /**
//  * ======================================
//  * 4️⃣ PAYMENT STATUS
//  * ======================================
//  */
// router.get(
//   "/payment-status/:sessionId",
//   asyncHandler(async (req: Request, res: Response) => {
//     const session = await stripe.checkout.sessions.retrieve(
//       req.params.sessionId
//     );

//     res.json({
//       success: true,
//       stripeStatus: session.payment_status,
//       orderId: session.metadata?.orderId,
//     });
//   })
// );

// export default router;