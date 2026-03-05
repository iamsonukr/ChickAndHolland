import Order, { OrderStatus, ShippingStatus } from "../models/Order";
import Style from "../models/OrderStyle";
import StoreStyleProgress from "../models/StoreStyleProgress";

const STATUS_FIELD_MAP: Record<OrderStatus, keyof Order> = {
  [OrderStatus.Pattern]: "pattern",
  [OrderStatus.Khaka]: "khaka",
  [OrderStatus.Issue_Beading]: "issue_beading",
  [OrderStatus.Beading]: "beading",
  [OrderStatus.Zarkan]: "zarkan",
  [OrderStatus.Stitching]: "stitching",
  [OrderStatus.Balance_Pending]: "balance_pending",
  [OrderStatus.Ready_To_Delivery]: "ready_to_delivery",
  [OrderStatus.Shipped]: "shipped",
};

export async function updateOrderByBarcode(
  barcode: string,
  nextStatus: OrderStatus,
  qty: number
) {
  const style = await Style.findOne({
    where: { barcode },
    relations: ["order"],
  });

  if (!style) throw new Error("Invalid barcode");

  const order = style.order;
  const now = new Date();

  // 🔒 BLOCK SHIP IF BALANCE PENDING
  if (
    nextStatus === OrderStatus.Shipped &&
    order.orderStatus === OrderStatus.Balance_Pending
  ) {
    throw new Error("Balance pending. Cannot ship order.");
  }

  // 1️⃣ PROGRESS ENTRY
  const progress = new StoreStyleProgress();
  progress.barcode = barcode;
  progress.status = nextStatus;
  progress.qty = qty;
  await progress.save();

  // 2️⃣ ORDER STATUS
  order.orderStatus = nextStatus;

  // 3️⃣ 🔥 ALWAYS SET DATE
  const field = STATUS_FIELD_MAP[nextStatus];
  if (field) {
    (order[field] as any) = now;
  }

  // 4️⃣ SHIPPING INFO
  if (nextStatus === OrderStatus.Shipped) {
    order.shippingStatus = ShippingStatus.Shipped;
    order.shippingDate = now;
  }

  await order.save();
}

