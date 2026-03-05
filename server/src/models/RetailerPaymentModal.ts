import {
  Column,
  Entity,
  JoinColumn,
  ManyToMany,
  ManyToOne,
  OneToMany,
  OneToOne,
} from "typeorm";
import { TABLE_NAMES } from "../constants";
import BaseModel from "./BaseModel";
import { RetailerOrder } from "./RetailerOrder";

@Entity(TABLE_NAMES.RETAILERORDERSPAYMENT)
export default class RetailerOrdersPayment extends BaseModel {
  @ManyToOne(() => RetailerOrder, (order) => order)
  order: RetailerOrder;

  @Column("int", { nullable: false })
  amount: number;

  @Column("varchar", { length: 225, nullable: false, default: "Bank Share" })
  paymentMethod: string;
}
