import { Column, Entity, OneToMany } from "typeorm";
import Expense from "./Expense";
import BaseModel from "./BaseModel";
import { TABLE_NAMES } from "../constants";

@Entity(TABLE_NAMES.PAYERS)
export default class Payer extends BaseModel {
  @Column("varchar", { length: 50, nullable: false, unique: true })
  name: string;

  @Column("varchar", { length: 13, nullable: false })
  mobileNumber: string;

  @OneToMany(() => Expense, (expense) => expense.expenseType)
  expenses: Expense[];
}
