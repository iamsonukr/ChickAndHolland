import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import BaseModel from "./BaseModel";
import { RetailerOrder } from "./RetailerOrder";

@Entity("retailer_order_styles")
export default class RetailerOrderStyles extends BaseModel {
    
  @ManyToOne(() => RetailerOrder, (order) => order.id, { onDelete: "CASCADE" })
  @JoinColumn({ name: "retailerOrderId" })
  retailerOrder: RetailerOrder;

  @Column("varchar", { nullable: true })
  styleNo: string;

  @Column("varchar", { unique: true })
  barcode: string;

  @Column("int", { nullable: true })
  quantity: number;

  @Column("varchar", { nullable: true })
  size: string;

  @Column("varchar", { nullable: true })
  size_country: string;
  @Column("text", { nullable: true, default: "[]" })
photoUrls: string;

}
