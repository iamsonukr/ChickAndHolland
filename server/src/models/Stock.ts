import { Column, Entity, ManyToOne, OneToMany } from "typeorm";
import BaseModel from "./BaseModel";
import { RetailerOrder } from "./RetailerOrder";
import RetailerStockOrders from "./RetailerStockOrders";
import StockCurrencyPricing from "./StockCurrencyPricing";

@Entity("stock")
export default class Stock extends BaseModel {
  @Column("varchar", { length: 50, nullable: false })
  styleNo: string;

  @Column("text", { nullable: true, default: null })
  colors: string;

  @Column("int", { nullable: false })
  quantity: number;

  @Column("int", { nullable: false })
  price: number;

  @Column("int", { nullable: false })
  discount: number;

  @Column("int", { nullable: false })
  discountedPrice: number;

  @Column("int", { nullable: false })
  size: number;

  @Column("varchar", { nullable: false, default: "EU" })
  size_country: string;

  @Column("varchar", { nullable: false, default: "SAS" })
  mesh_color: string;

  @Column("varchar", { nullable: false, default: "SAS" })
  beading_color: string;

  @Column("int", { nullable: false, default: 0 })
  add_lining: number;

  @Column("varchar", { nullable: false, default: "SAS" })
  lining: string;

  @Column("varchar", { nullable: true, default: "SAS" })
  lining_color: string | null;

  @Column("boolean", { default: true })
  isActive: boolean;

  // Currency-based pricing relationship
  @OneToMany(() => StockCurrencyPricing, (pricing) => pricing.stock, {
    cascade: true,
    onDelete: "CASCADE"
  })
  currencyPricing: StockCurrencyPricing[];

  //soft delete
  @Column("boolean", { default: false })
  isDeleted: boolean;
  
}
