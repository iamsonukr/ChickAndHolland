import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  OneToOne,
} from "typeorm";
import BaseModel from "./BaseModel";
import { TABLE_NAMES } from "../constants";
import Role from "./Role";

@Entity(TABLE_NAMES.PAGE_ACTIONS)
export default class Page_Actions extends BaseModel {
  @Column("varchar", { length: 30, unique: true })
  name: string;

  @Column("int", { default: 0 })
  action: number;

  @OneToOne(() => Role, (Role) => Role.id)
  @JoinColumn()
  role: Role;
}
