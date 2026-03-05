import { Column, Entity, OneToMany } from "typeorm";
import BaseModel from "./BaseModel";
import { TABLE_NAMES } from "../constants";
import Order from "./Order";

@Entity(TABLE_NAMES.SELLERS)
export default class Seller extends BaseModel {
  @Column("varchar", { length: 50, nullable: false })
  name: string;

  @Column("varchar", { length: 50, nullable: false, unique: true })
  email: string;

  @Column("varchar", { length: 100, nullable: false, unique: true })
  password: string;

  // @OneToMany(() => Order, (order) => order.seller)
  // orders: Order[];
}
