import { Column, Entity, ManyToOne, OneToMany } from "typeorm";
import BaseModel from "./BaseModel";
import Category from "./Category";
import Product from "./Product";
import Inventory from "./Inventory";
import Order from "./Order";
import { TABLE_NAMES } from "../constants";

@Entity(TABLE_NAMES.SUBCATEGORY)
export default class SubCategory extends BaseModel {
  @Column("varchar", { length: 30, nullable: false, unique: false })
  name: string;

  @Column("int", { nullable: true, default: 0 })
  priority: number;

  @ManyToOne(() => Category, (category) => category.subCategories, {
    onDelete: "SET NULL",
    onUpdate: "CASCADE",
  })
  category: Category;

  @OneToMany(() => Product, (product) => product.category)
  products: Product[];

  @OneToMany(() => Inventory, (inventory) => inventory.subCategory)
  inventories: Inventory[];
}
