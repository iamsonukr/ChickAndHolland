import { RetailerOrder } from "../models/RetailerOrder";

export async function generateUniquePO(prefix: string) {
  const lastOrder = await RetailerOrder.createQueryBuilder("order")
    .where("order.purchaeOrderNo LIKE :prefix", { prefix: `${prefix}%` })
    .orderBy("order.id", "DESC")
    .getOne();

  let nextNumber = 1;

  if (lastOrder?.purchaeOrderNo) {
    const numericPart = lastOrder.purchaeOrderNo.replace(/[^\d]/g, "");
    nextNumber = Number(numericPart) + 1;
  }

  return `${prefix}${String(nextNumber).padStart(5, "0")}`;
}
