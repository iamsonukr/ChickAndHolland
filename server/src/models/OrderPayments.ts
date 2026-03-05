import { Column, Entity, ManyToOne } from "typeorm";
import { TABLE_NAMES } from "../constants";
import Order from "./Order";
import BaseModel from "./BaseModel";

@Entity(TABLE_NAMES.ORDERPAYMENTS)
export default class OrderPayments extends BaseModel {
  @ManyToOne(() => Order, (order) => order.orderPayments)
  order: Order;

  @Column("int", { nullable: false })
  amount: number;

  @Column("varchar", { length: 225, nullable: false, default: "Bank Share" })
  paymentMethod: string;
}
