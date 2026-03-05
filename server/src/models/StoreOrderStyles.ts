import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import BaseModel from "./BaseModel";
import Order from "./Order";   // <-- store orders ka model import

@Entity("store_order_styles")
export default class StoreOrderStyles extends BaseModel {

  @ManyToOne(() => Order, (order) => order.id, { onDelete: "CASCADE" })
  @JoinColumn({ name: "orderId" })
  order: Order;

  @Column("varchar")
  styleNo: string;

  @Column("varchar", { nullable: true })
  size_country: string;

  @Column("varchar", { nullable: true })
  size: string;

  @Column("int", { nullable: false })
  quantity: number;

  @Column("varchar", { unique: true })
  barcode: string;

  @Column("text", { default: "[]" })
  photoUrls: string; // JSON array store karne ke liye
}
