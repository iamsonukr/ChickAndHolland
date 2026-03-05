import { Column, Entity } from "typeorm";
import BaseModel from "./BaseModel";
import { TABLE_NAMES } from "../constants";

@Entity(TABLE_NAMES.EXPENSES)
export default class Expense extends BaseModel {
  @Column("varchar", { length: 225, nullable: false })
  expenseName: string;

  @Column("varchar", { length: 225, nullable: true, default: null })
  invoice: string;

  @Column("varchar", { length: 225, nullable: false })
  payer: string;

  @Column("varchar", { length: 225, nullable: false })
  expenseType: string;

  @Column("int", { nullable: false })
  amount: string;

  @Column("varchar", { length: 225, nullable: false })
  currency: string;

  @Column("boolean", { default: false })
  isPaid: boolean;

  @Column("varchar", { length: 225, nullable: true })
  otherType: string;

  @Column("datetime", {
    nullable: true, // Allow NULL values
    default: () => "CURRENT_TIMESTAMP",
  })
  Pending: Date | null;

  @Column("datetime", { nullable: true })
  Paid: Date;
}
