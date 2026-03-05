import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  UpdateDateColumn,
} from "typeorm";
import BaseModel from "./BaseModel";
import Role from "./Role";
import { TABLE_NAMES } from "../constants";

@Entity(TABLE_NAMES.EMPLOYEES)
export default class Employee extends BaseModel {
  @Column("varchar", { length: 50, nullable: false })
  firstName: string;

  @Column("varchar", { length: 50, nullable: true, unique: true })
  lastName: string;

  @Column("varchar", { length: 50, nullable: false })
  address1: string;

  @Column("varchar", { length: 50, nullable: true })
  address2: string;

  @Column("varchar", { length: 20, nullable: false })
  state: string;

  @Column("varchar", { length: 20, nullable: false })
  city: string;

  @Column("varchar", { length: 6, nullable: false })
  zipCode: string;

  @Column("varchar", { length: 13, nullable: false, unique: true })
  mobileNumber: string;

  @Column("varchar", { length: 50, nullable: false, unique: true })
  userName: string;

  @Column("varchar", { length: 60, nullable: false })
  password: string;

  @Column("varchar", { length: 150, nullable: false })
  image: string;

  @UpdateDateColumn()
  lastLoginTime: Date;

  @ManyToOne(() => Role, (role) => role.employees, {
    onDelete: "SET NULL",
    onUpdate: "CASCADE",
  })
  role: Role;

  @OneToOne(() => Employee, { onDelete: "SET NULL", onUpdate: "CASCADE" })
  @JoinColumn({ name: "reportingManagerId" })
  reportingManager: Employee;
}
