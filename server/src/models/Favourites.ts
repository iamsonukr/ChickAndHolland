import { Column, Entity, ManyToOne, OneToMany, JoinColumn } from "typeorm";
import BaseModel from "./BaseModel";
import Retailer from "./Retailer";
import Product from "./Product";
import ProductColour from "./ProductColours";
import Currency from "./Currency";

@Entity("favourites")
export default class Favourites extends BaseModel {
  @ManyToOne(() => Product, (product) => product.favourites)
  product: Product;

  @ManyToOne(() => Retailer, (retailer) => retailer.favourites)
  retailer: Retailer;

  @Column("varchar", { nullable: false, default: "SAS" })
  color: string;

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

  @Column("int", { nullable: false })
  product_size: number;
  
  @Column("varchar", { nullable: true })
  admin_us_size: string;

  @Column("int", { nullable: false })
  quantity: number;

  @Column("int", { nullable: false, default: 0 })
  customization_price: number;

  @Column("int", { nullable: false, default: 0 })
  product_price: number;

  @Column("varchar", { nullable: false, default: "Noting To customize" })
  customization: string;

  @Column("text", { nullable: true })
  reference_image: string;

  @Column("varchar", { nullable: false, default: "EU" })
  size_country: string;

  @Column("int", { nullable: false, default: 0 })
  is_order_placed: number;

  @Column({ nullable: true })
  currencyId: number | null;

  @ManyToOne(() => Currency, { nullable: true })
  @JoinColumn({ name: "currencyId" })
  currency: Currency;
}
