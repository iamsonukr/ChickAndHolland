import { Column, Entity, OneToMany, OneToOne, ManyToOne, JoinColumn, UpdateDateColumn } from "typeorm";
import BaseModel from "./BaseModel";
import Order from "./Order";
import Retailer from "./Retailer";
import Clients from "./ClientsModel";
import Country from "./Country";
import Currency from "./Currency";

@Entity("customers")
export default class Customer extends BaseModel {
  @Column("varchar", { length: 50, nullable: false })
  name: string;

  @Column("varchar", { length: 50, nullable: false })
  storeName: string;

  @Column("varchar", { length: 200, nullable: false })
  storeAddress: string;

  @Column("varchar", { length: 225, nullable: true })
  website: string;

  @Column("text", { nullable: true })
  phoneNumber: string;

  @Column("varchar", { length: 50, nullable: false })
  contactPerson: string;

  @Column("boolean", { default: true })
  isActive: boolean;

  @Column("boolean", { default: false })
  isDeleted: boolean;

  @Column("text", { nullable: true })
  email: string;

  @Column({ nullable: true })
  quickbooksCustomerId: string;

  @UpdateDateColumn()
  lastLoginTime: Date;

  @Column({ nullable: true })
  countryId: string | null;

  @ManyToOne(() => Country, { nullable: true })
  @JoinColumn({ name: "countryId" })
  country: Country;

  @Column({ nullable: true })
  currencyId: string | null;

  @ManyToOne(() => Currency, { nullable: true })
  @JoinColumn({ name: "currencyId" })
  currency: Currency;

  @OneToMany(() => Order, (order) => order.customer)
  orders: Order[];

  @OneToOne(() => Retailer, (retailer) => retailer.customer)
  retailer: Retailer;

  @OneToOne(() => Clients, (clients) => clients.customer)
  client: Clients;
}