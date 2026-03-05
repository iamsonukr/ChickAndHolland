

import { BeforeUpdate, Column, Entity, ManyToOne, OneToMany } from "typeorm";
import BaseModel from "./BaseModel";
import { TABLE_NAMES } from "../constants";
import Customer from "./Customer";
import Style from "./OrderStyle";
import OrderPayments from "./OrderPayments";

export enum OrderType {
  Store = "Store",
  Online = "Online",
  Retail = "Retail",
  Customer = "Customer",
}

export enum OrderStatus {
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

export enum ShippingStatus {
  NotShipped = "Not Shipped",
  Shipped = "Shipped",
}

@Entity(TABLE_NAMES.ORDERS)
export default class Order extends BaseModel {
  @Column("varchar", { length: 225, nullable: false })
  purchaeOrderNo: string;

  @Column("varchar", { length: 225, nullable: false })
  manufacturingEmailAddress: string;

  // @Column("enum", { enum: OrderType, default: OrderType.Store })
  // orderType: OrderType;
   @Column("varchar", { length: 255 })
orderType: string;

  @Column("text", { nullable: true })
ppt_path: string;

@Column({ nullable: true, unique: true })
barcode: string;



  @Column("datetime", { nullable: false, default: () => "CURRENT_TIMESTAMP" })
  orderReceivedDate: Date;

  @Column("datetime", { nullable: true })
  orderCancellationDate: Date;

  // 🔹 Status Tracking Dates
  @Column("datetime", { nullable: true, default: () => "CURRENT_TIMESTAMP" })
  pattern: Date | null;

  @Column("datetime", { nullable: true })
  khaka: Date;

  @Column("datetime", { nullable: true })
  issue_beading: Date;

  @Column("datetime", { nullable: true })
  beading: Date;

  @Column("datetime", { nullable: true })
  zarkan: Date;

  @Column("datetime", { nullable: true })
  stitching: Date;

  @Column({ type: "timestamp", nullable: true })
balance_pending?: Date;

  @Column("datetime", { nullable: true })
  ready_to_delivery: Date;

  @Column("datetime", { nullable: true })
  shipped: Date;

  @Column("text", { nullable: true })
  address: string;

  @Column("enum", { enum: OrderStatus, default: OrderStatus.Pattern })
  orderStatus: OrderStatus;

  @Column("enum", { enum: ShippingStatus, default: ShippingStatus.NotShipped })
  shippingStatus: ShippingStatus;

  @Column("datetime", { nullable: true })
  shippingDate: Date | null;

  @BeforeUpdate()
  updateShippingDate() {
    if (this.orderStatus === OrderStatus.Shipped) {
      this.shippingDate = new Date();
    } else if (this.orderStatus === OrderStatus.Ready_To_Delivery) {
      this.shippingDate = null;
    }
  }

  @Column("varchar", { length: 225, nullable: true })
  trackingNo: string;

  @Column("int", { default: 0 })
  status: number;

  @ManyToOne(() => Customer, (customer) => customer.orders, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  customer: Customer;

  @OneToMany(() => Style, (style) => style.order, {
    cascade: true,
  })
  styles: Style[];

  @OneToMany(() => OrderPayments, (orderPayments) => orderPayments.order, {
    cascade: true,
  })
  orderPayments: OrderPayments[];
}
