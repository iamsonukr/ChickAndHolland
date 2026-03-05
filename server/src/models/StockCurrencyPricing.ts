import { Column, Entity, ManyToOne, Unique } from "typeorm";
import BaseModel from "./BaseModel";
import Stock from "./Stock";
import Currency from "./Currency";
import { TABLE_NAMES } from "../constants";

@Entity(TABLE_NAMES.STOCK_CURRENCY_PRICING)
@Unique(["stock", "currency"]) // Ensure one price per currency per stock
export default class StockCurrencyPricing extends BaseModel {
  @Column("decimal", { precision: 10, scale: 2, nullable: false })
  price: number;

  @Column("decimal", { precision: 10, scale: 2, nullable: false })
  discountedPrice: number;

  @ManyToOne(() => Stock, (stock) => stock.currencyPricing, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  stock: Stock;

  @ManyToOne(() => Currency, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  currency: Currency;
}