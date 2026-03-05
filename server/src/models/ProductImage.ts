import { Column, Entity, ManyToOne } from "typeorm";
import BaseModel from "./BaseModel";
import Product from "./Product";
import { TABLE_NAMES } from "../constants";

@Entity(TABLE_NAMES.PRODUCT_IMAGES)
export default class ProductImage extends BaseModel {
  @Column("varchar", { length: 150, nullable: false })
  name: string;

  @Column("boolean", { nullable: false, default: false })
  isMain: boolean;

  @ManyToOne(() => Product, (pro) => pro.images, {
    onDelete: "SET NULL",
    onUpdate: "CASCADE",
  })
  product: Product;
}
