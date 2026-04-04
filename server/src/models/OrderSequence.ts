import { Column, Entity, PrimaryGeneratedColumn, Unique } from "typeorm";
import BaseModel from "./BaseModel";

@Entity("order_sequence")
@Unique(["name"])
export default class OrderSequence extends BaseModel {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column("varchar", { length: 100 })
  name!: string;

  @Column("int", { default: 1 })
  nextNumber!: number;
}
