import { randomUUID } from "crypto";
import db from "../db";
import Order from "../models/Order";
import Style from "../models/OrderStyle";
import { expandOrderStylePieces, buildPiecePricing } from "../lib/orderPieces";
import { parseCustomSizesQuantity } from "../lib/orderPricing";
import { ORDER_BEADERS_TABLE } from "../utils/ensureOrderBeadersTable";

/** Idempotent repair: keep the original row/barcode and its scan history. */
export async function ensureRegularOrderPieces(
  orderId: number,
  options: { previousPieceCounts?: Map<number, number> } = {},
) {
  return db.transaction(async (manager) => {
    const order = await manager.findOne(Order, {
      where: { id: orderId, status: 0 }, lock: { mode: "pessimistic_write" },
    });
    if (!order) throw new Error("Order not found");
    const styles = await manager.createQueryBuilder(Style, "style")
      .addSelect("style.beader")
      .where("style.orderId = :orderId", { orderId })
      .setLock("pessimistic_write").getMany();
    let added = 0;
    for (const style of styles) {
      const pieces = expandOrderStylePieces(style);
      const needsRepair = pieces.length > 1 || parseCustomSizesQuantity(style.customSizesQuantity).length > 0;
      if (!needsRepair) continue;
      const pricing = buildPiecePricing(style, pieces);
      // A legacy barcode represented the entire grouped row. Carry its latest
      // recorded stage to the replacement pieces, with a migration audit note.
      const [latestProgress] = await manager.query(
        "SELECT status, createdAt FROM store_style_progress WHERE barcode = ? ORDER BY id DESC LIMIT 1",
        [style.barcode],
      );
      const inheritedStage = latestProgress?.status || style.currentStatus || null;
      const existingPieceCount = options.previousPieceCounts
        ? options.previousPieceCounts.get(style.id) ?? 0
        : pieces.length;
      const [beaderRow] = await manager.query(
        `SELECT beader FROM \`${ORDER_BEADERS_TABLE}\` WHERE styleId = ?`, [style.id],
      );
      for (let index = 0; index < pieces.length; index++) {
        const piece = pieces[index];
        const { id, createdAt, deletedAt, ...fields } = piece;
        const entity = manager.create(Style, {
          ...fields, order, quantity: 1,
          ...pricing[index],
          currentStatus: index < existingPieceCount ? inheritedStage : null,
          barcode: index === 0 ? style.barcode : `pending-${randomUUID()}`,
          ...(index === 0 ? { id: style.id, createdAt: style.createdAt } : {}),
        } as Style);
        await manager.save(entity);
        if (index > 0) {
          entity.barcode = `${order.purchaeOrderNo}-${entity.styleNo}-${entity.id}`;
          await manager.save(entity);
          if (inheritedStage && index < existingPieceCount) {
            await manager.query(
              "INSERT INTO store_style_progress (barcode, status, qty, createdAt) VALUES (?, ?, 1, ?)",
              [entity.barcode, inheritedStage, latestProgress?.createdAt || style.createdAt || new Date()],
            );
          }
          added++;
        }
        if (beaderRow?.beader) {
          await manager.query(
            `INSERT INTO \`${ORDER_BEADERS_TABLE}\` (orderId, styleId, productCode, beader)
             VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE beader = VALUES(beader)`,
            [orderId, entity.id, entity.styleNo, beaderRow.beader],
          );
        }
      }
    }
    return added;
  });
}
