import { Column, Entity } from "typeorm";
import BaseModel from "./BaseModel";
import { TABLE_NAMES } from "../constants";

@Entity(TABLE_NAMES.BEADERS)
export default class Beader extends BaseModel {
  @Column("varchar", { length: 255, nullable: false, unique: true })
  name: string;
}
