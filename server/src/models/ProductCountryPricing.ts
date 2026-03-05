import { Column, Entity, ManyToOne, Unique } from "typeorm";
import BaseModel from "./BaseModel";
import Product from "./Product";
import Country from "./Country";
import { TABLE_NAMES } from "../constants";

@Entity(TABLE_NAMES.PRODUCT_COUNTRY_PRICING)
@Unique(["product", "country"]) // Ensure one price per country per product
export default class ProductCountryPricing extends BaseModel {
  @Column("decimal", { precision: 10, scale: 2, nullable: false })
  price: number;

  @ManyToOne(() => Product, (product) => product.countryPricing, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  product: Product;

  @ManyToOne(() => Country, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  country: Country;
}