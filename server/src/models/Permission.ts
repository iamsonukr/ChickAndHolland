import { Column, Entity } from "typeorm";
import BaseModel from "./BaseModel";
import { TABLE_NAMES } from "../constants";
import db from "../db";

@Entity(TABLE_NAMES.PERMISSIONS)
export default class Permission extends BaseModel {
  @Column("varchar", { length: 30, unique: true })
  name: string;
}

const defaultPermissions = [
  "dashboard",
  "analytics",
  "employeeslist",
  "expences",
  "inventory",
  "payments",
  "reports",
  "users",
  "userroles",
  "customisedorders",
  "noncustomisedorders",
  "category",
  "subcategory",
  "employee",
  "expencetype",
  "payers",
  "products",
];

export const createPermissions = async () => {
  const permissions = [] as Permission[];

  for (const permission of defaultPermissions) {
    permissions.push({ name: permission } as Permission);
  }

  await Permission.save(permissions);
};
