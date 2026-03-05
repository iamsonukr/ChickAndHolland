import { Column, Entity } from "typeorm";
import BaseModel from "./BaseModel";

@Entity("new_user_roles")
export default class NewUserRoles extends BaseModel {
  @Column("varchar", { length: 255, nullable: false })
  roleName: string;

  @Column("json", { nullable: false })
  permissions: string[];
    totalCount?: number;
}
