import { Column, Entity } from "typeorm";
import BaseModel from "./BaseModel";
import { TABLE_NAMES } from "../constants";

@Entity(TABLE_NAMES.SPONSOR)
export default class SPONSOR extends BaseModel {
  @Column("varchar", { length: 100, nullable: false })
  image_url: string;

  @Column("varchar", { length: 100, nullable: true })
  description : string;
}
