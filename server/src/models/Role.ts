import { Column, Entity, JoinTable, ManyToMany, OneToMany } from "typeorm";
import BaseModel from "./BaseModel";
import Permission from "./Permission";
import Employee from "./Employee";
import { TABLE_NAMES } from "../constants";

@Entity(TABLE_NAMES.ROLES)
export default class Role extends BaseModel {
  @Column("varchar", { length: 50, nullable: false, unique: true })
  name: string;

  @Column("varchar", { length: 150, nullable: true })
  description: string;

  @OneToMany(() => Employee, (employee) => employee.role)
  employees: Employee[];

  @ManyToMany(() => Permission)
  @JoinTable({ name: "roles_permissions" })
  permissions: Permission[];
}
