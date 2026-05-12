import Order, { OrderStatus, ShippingStatus } from "../models/Order";
import Style from "../models/OrderStyle";
import StoreStyleProgress from "../models/StoreStyleProgress";
import { DEFAULT_ORDER_STAGE, getStageIndex } from "../lib/stageFlow";

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
  const latestProgress = await StoreStyleProgress.findOne({
    where: { barcode: style.barcode },
    order: { createdAt: "DESC" },
  });
  const currentStatus = latestProgress?.status || DEFAULT_ORDER_STAGE;
  const currentIndex = getStageIndex(currentStatus);
  const nextIndex = getStageIndex(nextStatus);

  if (currentIndex === -1 || nextIndex === -1 || nextIndex <= currentIndex) {
    throw new Error(
      currentIndex === nextIndex
        ? `Already at ${nextStatus}`
        : "Cannot move order status backward or to an unknown stage.",
    );
  }

  // 1️⃣ PROGRESS ENTRY
  const progress = new StoreStyleProgress();
  progress.barcode = barcode;
  progress.status = nextStatus;
  progress.qty = qty;
  await progress.save();

  // 2️⃣ CHECK IF ALL STYLES IN ORDER HAVE REACHED NEXT STATUS
  const allStyles = await Style.find({
    where: { order: { id: order.id } },
  });

  const allStylesProgress = await Promise.all(
    allStyles.map(async (style) => {
      const latestProgress = await StoreStyleProgress.findOne({
        where: { barcode: style.barcode },
        order: { createdAt: "DESC" },
      });
      return latestProgress;
    })
  );

  // Check if all styles have the next status (or are at starting status if no progress)
  const allStylesAtNextStatus = allStylesProgress.every(
    (progress) => (progress?.status || OrderStatus.Pattern) === nextStatus
  );

  // 3️⃣ UPDATE ORDER STATUS ONLY IF ALL STYLES ARE AT NEXT STATUS
  if (allStylesAtNextStatus) {
    order.orderStatus = nextStatus;

    // 4️⃣ 🔥 ALWAYS SET DATE
    const field = STATUS_FIELD_MAP[nextStatus];
    if (field) {
      (order[field] as any) = now;
    }

    // 5️⃣ SHIPPING INFO
    if (nextStatus === OrderStatus.Shipped) {
      order.shippingStatus = ShippingStatus.Shipped;
      order.shippingDate = now;
    }

    await order.save();
  }
}

