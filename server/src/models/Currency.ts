import { Column, Entity } from "typeorm";
import BaseModel from "./BaseModel";
import { TABLE_NAMES } from "../constants";

@Entity(TABLE_NAMES.CURRENCIES)
export default class Currency extends BaseModel {
  @Column("varchar", { length: 10, nullable: false, unique: true })
  code: string; // EUR, USD, GBP

  @Column("varchar", { length: 50, nullable: false })
  name: string; // Euro, US Dollar, British Pound

  @Column("varchar", { length: 10, nullable: false })
  symbol: string; // €, $, £

  @Column("boolean", { default: false })
  isDefault: boolean; // EUR should be default
}