import { Column, Entity, ManyToOne, OneToMany } from "typeorm";
import BaseModel from "./BaseModel";
import Category from "./Category";
import SubCategory from "./SubCategory";
import ProductImage from "./ProductImage";
import Inventory from "./Inventory";
import { TABLE_NAMES } from "../constants";
import Favourites from "./Favourites";
import ProductCountryPricing from "./ProductCountryPricing";
import ProductCurrencyPricing from "./ProductCurrencyPricing";

@Entity(TABLE_NAMES.PRODUCTS)
export default class Product extends BaseModel {
  @Column("int", { nullable: true })
  quantity: number;

  @Column("varchar", { length: 20, nullable: true })
  color: string;

  @Column("varchar", { length: 30, nullable: false, unique: true })
  productCode: string;

  @Column("int", { nullable: true, default: 0 })
  price: number;

  // @Column("varchar", { length: 20, nullable: false })
  // unitProduct: string;

  // @Column("varchar", { length: 20, nullable: false })
  // unitSale: string;

  @Column("text", { nullable: true })
  description: string;

  @Column("int", { nullable: true })
  minSaleQuantity: number;

  @Column("boolean", { nullable: true })
  hasReturnPolicy: boolean;

  @Column("boolean", { nullable: true })
  hasDiscount: boolean;

  @Column("int", { nullable: true })
  stockAlert: number;

  @Column("varchar", { nullable: false, default: "SAS" })
  mesh_color: string;

  @Column("varchar", { nullable: false, default: "SAS" })
  beading_color: string;

  @Column("varchar", { nullable: false, default: "SAS" })
  lining: string;

  @Column("varchar", { nullable: true, default: "SAS" })
  lining_color: string | null;

  @Column("int", { nullable: false, default: 0 })
  product_size: number;

  @ManyToOne(() => Category, (cat) => cat.products, {
    onDelete: "SET NULL",
    onUpdate: "CASCADE",
  })
  category: Category;

  @ManyToOne(() => SubCategory, (cat) => cat.products, {
    onDelete: "SET NULL",
    onUpdate: "CASCADE",
  })
  subCategory: SubCategory;

  @OneToMany(() => ProductImage, (prodImage) => prodImage.product)
  images: ProductImage[];

  @OneToMany(() => Inventory, (inventory) => inventory.product)
  inventories: Inventory[];

  @OneToMany(() => Favourites, (favourites) => favourites.retailer)
  favourites: Favourites[];

  @OneToMany(() => ProductCountryPricing, (pricing) => pricing.product, {
    cascade: true,
    onDelete: "CASCADE"
  })
  countryPricing: ProductCountryPricing[];

  // New relationship for currency-based pricing
  @OneToMany(() => ProductCurrencyPricing, (pricing) => pricing.product, {
    cascade: true,
    onDelete: "CASCADE"
  })
  currencyPricing: ProductCurrencyPricing[];
}