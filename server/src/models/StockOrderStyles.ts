import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import BaseModel from "./BaseModel";
import { RetailerOrder } from "./RetailerOrder";

@Entity("stock_order_styles")
export default class StockOrderStyles extends BaseModel {

  // 🔗 Parent Retailer Order
  @ManyToOne(() => RetailerOrder, (order) => order.id, { onDelete: "CASCADE" })
  @JoinColumn({ name: "retailerOrderId" })
  retailerOrder: RetailerOrder;

  // 🔹 Product style / productCode
  @Column("varchar", { nullable: true })
  styleNo: string;

  // 🔥 UNIQUE BARCODE (PO#STK001-1)
  @Column("varchar", { unique: true })
  barcode: string;

  // 🔹 ALWAYS 1 (one barcode = one piece)
  @Column("int", { default: 1 })
  quantity: number;

  // 🔹 Size info
  @Column("varchar", { nullable: true })
  size: string;

  @Column("varchar", { nullable: true })
  size_country: string;

  // 🔹 Manufacturing photos
  @Column("text", { nullable: true, default: "[]" })
  photoUrls: string;
}
