import { Column, Entity, ManyToOne } from "typeorm";
import BaseModel from "./BaseModel";
import Category from "./Category";
import SubCategory from "./SubCategory";
import Product from "./Product";
import { TABLE_NAMES } from "../constants";

@Entity(TABLE_NAMES.INVENTORY)
export default class Inventory extends BaseModel {
  @Column("varchar", { length: 20, nullable: false })
  color: string;

  @Column("varchar", { length: 100, nullable: false })
  general: string;

  @Column("int", { nullable: false })
  size: number;

  @ManyToOne(() => Category, (category) => category.inventories, {
    onDelete: "SET NULL",
    onUpdate: "CASCADE",
  })
  category: Category;

  @ManyToOne(() => SubCategory, (subCategory) => subCategory.inventories, {
    onDelete: "SET NULL",
    onUpdate: "CASCADE",
  })
  subCategory: SubCategory;

  @ManyToOne(() => Product, (product) => product.inventories, {
    onDelete: "SET NULL",
    onUpdate: "CASCADE",
  })
  product: Product;
}
