import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { TABLE_NAMES } from "../constants";
import BaseModel from "./BaseModel";
import Product from "./Product";
import Order from "./Order";

@Entity(TABLE_NAMES.ORDER_ITEMS)
export default class OrderItem extends BaseModel {
  @ManyToOne(() => Product, { onDelete: "SET NULL", onUpdate: "CASCADE" })
  @JoinColumn({ name: "productId" })
  product: Product;

  @Column("int", { nullable: false })
  quantity: number;

  @ManyToOne(() => Order, { onDelete: "SET NULL", onUpdate: "CASCADE" })
  @JoinColumn({ name: "orderId" })
  order: Order;
}
