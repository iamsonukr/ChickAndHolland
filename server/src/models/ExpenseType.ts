import { Column, Entity, OneToMany } from "typeorm";
import Expense from "./Expense";
import BaseModel from "./BaseModel";
import { TABLE_NAMES } from "../constants";

@Entity(TABLE_NAMES.EXPENSETYPES)
export default class ExpenseType extends BaseModel {
  @Column("varchar", { length: 50, nullable: false, unique: true })
  name: string;

  @OneToMany(() => Expense, (expense) => expense.expenseType)
  expenses: Expense[];
}
