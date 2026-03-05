import { Column, Entity, ManyToOne, Unique } from "typeorm";
import BaseModel from "./BaseModel";
import Product from "./Product";
import Currency from "./Currency";
import { TABLE_NAMES } from "../constants";

@Entity(TABLE_NAMES.PRODUCT_CURRENCY_PRICING)
@Unique(["product", "currency"]) // Ensure one price per currency per product
export default class ProductCurrencyPricing extends BaseModel {
  @Column("decimal", { precision: 10, scale: 2, nullable: false })
  price: number;

  @ManyToOne(() => Product, (product) => product.currencyPricing, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  product: Product;

  @ManyToOne(() => Currency, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  currency: Currency;
}