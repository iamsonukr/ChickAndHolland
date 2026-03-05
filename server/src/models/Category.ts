import {Column, Entity, OneToMany} from "typeorm";
import BaseModel from "./BaseModel";
import SubCategory from "./SubCategory";
import Product from "./Product";
import Inventory from "./Inventory";
import {TABLE_NAMES} from "../constants";

@Entity(TABLE_NAMES.CATEGORIES)
export default class Category extends BaseModel {
    @Column("varchar", {length: 30, nullable: false, unique: true})
    name: string;

    @Column("int", {nullable: true, default: 0})
    priority: number;

    @OneToMany(() => SubCategory, (subCat) => subCat.category)
    subCategories: SubCategory[];

    @OneToMany(() => Product, (product) => product.category)
    products: Product[];

    @OneToMany(() => Inventory, (inventory) => inventory.category)
    inventories: Inventory[];
}
