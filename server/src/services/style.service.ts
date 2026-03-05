import Order from "../models/Order";
import OrderStyle from "../models/OrderStyle";

export async function createStyleBarcode(order: Order, style: OrderStyle) {
  // Step 1: save style so it gets its ID
  await style.save();

  // Step 2: generate unique barcode
  style.barcode = `${order.purchaeOrderNo}-${style.styleNo}-${style.id}`;

  // Step 3: save again
  await style.save();
}
