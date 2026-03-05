import {Column, Entity, OneToMany} from "typeorm";
import BaseModel from "./BaseModel";
import SubCategory from "./SubCategory";
import Product from "./Product";
import Inventory from "./Inventory";
import {TABLE_NAMES} from "../constants";

@Entity(TABLE_NAMES.COUNTRIES)
export default class Countries extends BaseModel {
    @Column("varchar", {length: 30, nullable: false, unique: true})
    country_name: string;

   @Column("varchar",  {length: 30, nullable: false, unique: true})
  country_currency: string;

  @Column("varchar", {length: 30, nullable: false, unique: true})
  currency_icon: string;
}
