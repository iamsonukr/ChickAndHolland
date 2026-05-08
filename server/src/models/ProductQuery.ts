import { Column, Entity } from "typeorm";
import BaseModel from "./BaseModel";
import { TABLE_NAMES } from "../constants";

@Entity(TABLE_NAMES.PRODUCT_QUERIES)
export default class ProductQuery extends BaseModel {
  @Column("varchar", { length: 100, nullable: false })
  firstName: string;

  @Column("varchar", { length: 100, nullable: false })
  lastName: string;

  @Column("varchar", { length: 225, nullable: false })
  email: string;

  @Column("varchar", { length: 100, nullable: false })
  contactNumber: string;

  @Column("varchar", { length: 100, nullable: false })
  city: string;

  @Column("varchar", { length: 100, nullable: false })
  country: string;

  @Column("text", { nullable: false })
  message: string;

  @Column("text", { nullable: false })
  productCodes: string;

  @Column("varchar", { length: 50, nullable: true })
  page: string | null;

  @Column("boolean", { default: false })
  isRead: boolean;
}
