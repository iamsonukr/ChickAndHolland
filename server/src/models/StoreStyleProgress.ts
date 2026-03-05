import { Entity, Column } from "typeorm";
import BaseModel from "./BaseModel";

@Entity("store_style_progress")
export default class StoreStyleProgress extends BaseModel {

  @Column()
  barcode: string;

  @Column()
  status: string;

  @Column("int")
  qty: number;
}
