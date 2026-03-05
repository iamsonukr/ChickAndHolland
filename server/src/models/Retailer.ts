import { Column, Entity, JoinColumn, OneToMany, OneToOne } from "typeorm";
import { TABLE_NAMES } from "../constants";
import BaseModel from "./BaseModel";
import Customer from "./Customer";
import Favourites from "./Favourites";
import { RetailerOrder } from "./RetailerOrder";
import RetailerStockOrders from "./RetailerStockOrders";
import RetailerFavouritesOrders from "./ReailerFavouritesOrder";
import RetailerBank from "./RetailerBank";
import AdminBank from "./AdminBank";

@Entity(TABLE_NAMES.RETAILERS)
export default class Retailer extends BaseModel {
  // username, password.. one to one relationship with customer
  @Column("varchar", { length: 50, nullable: false })
  username: string;

  @Column("varchar", { length: 50, nullable: false })
  password: string;

  @Column("boolean", { default: false })
  isDeleted: boolean;

  @OneToOne(() => Customer)
  @JoinColumn()
  customer: Customer;
  @OneToOne(() => RetailerBank, (retailerBank) => retailerBank.retailer) // Inverse side
  retailerBank: RetailerBank;

  @OneToMany(() => Favourites, (favourites) => favourites.retailer)
  favourites: Favourites[];

  @OneToMany(() => RetailerOrder, (retailerOrders) => retailerOrders.retailer)
  orders: RetailerOrder[];

  @OneToMany(() => RetailerStockOrders, (r) => r.retailer)
  stock: RetailerStockOrders[];

  @OneToMany(
    () => RetailerFavouritesOrders,
    (favourites) => favourites.retailer
  )
  retailer_fav: Favourites[];
}
