import { Column, Entity, ManyToOne } from "typeorm";
import BaseModel from "./BaseModel";
import OrderStyle from "./OrderStyle";
import RetailerOrderStyles from "./RetailerOrderStyles";

export enum StyleStage {
  Pattern = "Pattern",
  Khaka = "Khaka",
  Issue_Beading = "Issue Beading",
  Beading = "Beading",
  Zarkan = "Zarkan",
  Stitching = "Stitching",
  Balance_Pending = "Balance Pending",
  Ready_To_Delivery = "Ready To Delivery",
  Shipped = "Shipped",
}

@Entity("styleProgress")
export default class StyleProgress extends BaseModel {

@ManyToOne(() => RetailerOrderStyles, { onDelete: "CASCADE" })
style: RetailerOrderStyles;


  @Column()
  barcode: string;

  @Column("enum", { enum: StyleStage })
  stage: StyleStage;

  @Column("int")
  qty: number;

  @Column("datetime", { default: () => "CURRENT_TIMESTAMP" })
  date: Date;
}
