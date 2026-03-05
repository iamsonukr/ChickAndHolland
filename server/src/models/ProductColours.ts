import BaseModel from "./BaseModel";
import { Column, Entity, OneToMany } from "typeorm";
import { TABLE_NAMES } from "../constants";
import Favourites from "./Favourites";

@Entity(TABLE_NAMES.PRODUCT_COLOURS)
export default class ProductColour extends BaseModel {
  @Column("varchar", { length: 30, nullable: false, unique: true })
  name: string;

  @Column("varchar", { length: 10, nullable: false, unique: true })
  hexcode: string;

  // @OneToMany(() => Favourites, (favourites) => favourites.color)
  // favourites: Favourites[];
}
